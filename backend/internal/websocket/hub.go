package websocket

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/collabcode/backend/internal/ot"
	"github.com/redis/go-redis/v9"
)

type Room struct {
	ID      string
	Clients map[string]*Client // userID -> client
	mu      sync.RWMutex
}

type Hub struct {
	rooms      map[string]*Room
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
	otEngine   *ot.Engine
	redis      *redis.Client
	ctx        context.Context
	cancel     context.CancelFunc
}

func NewHub(otEngine *ot.Engine, redisClient *redis.Client) *Hub {
	ctx, cancel := context.WithCancel(context.Background())
	h := &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client, 256),
		unregister: make(chan *Client, 256),
		otEngine:   otEngine,
		redis:      redisClient,
		ctx:        ctx,
		cancel:     cancel,
	}
	return h
}

func (h *Hub) Run() {
	// Start Redis subscriber if Redis is available
	if h.redis != nil {
		go h.subscribeRedis()
	}

	for {
		select {
		case client := <-h.register:
			h.addClient(client)
		case client := <-h.unregister:
			h.removeClient(client)
		case <-h.ctx.Done():
			return
		}
	}
}

func (h *Hub) Stop() {
	h.cancel()
}

func (h *Hub) addClient(client *Client) {
	h.mu.Lock()
	room, exists := h.rooms[client.RoomID]
	if !exists {
		room = &Room{
			ID:      client.RoomID,
			Clients: make(map[string]*Client),
		}
		h.rooms[client.RoomID] = room
	}
	h.mu.Unlock()

	room.mu.Lock()
	room.Clients[client.UserID] = client
	room.mu.Unlock()

	// Initialize default files if workspace is empty
	ws := h.otEngine.GetWorkspace(client.RoomID)
	ws.Mu.Lock()
	if len(ws.Documents) == 0 {
		switch client.Language {
		case "javascript":
			ws.Documents["src/index.js"] = ot.NewDocument("console.log('Hello World');\n")
		case "typescript":
			ws.Documents["src/main.ts"] = ot.NewDocument("console.log('Hello World');\n")
		case "python":
			ws.Documents["src/main.py"] = ot.NewDocument("print('Hello World')\n")
		case "java":
			ws.Documents["src/Main.java"] = ot.NewDocument("public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}\n")
		case "c++":
			ws.Documents["src/main.cpp"] = ot.NewDocument("#include <iostream>\n\nint main() {\n    std::cout << \"Hello World\" << std::endl;\n    return 0;\n}\n")
		case "go":
			ws.Documents["src/main.go"] = ot.NewDocument("package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"Hello World\")\n}\n")
		default:
			ws.Documents["src/main.txt"] = ot.NewDocument("")
		}
	}
	
	// Prepare sync payload
	files := make(map[string]FileState)
	for id, doc := range ws.Documents {
		files[id] = FileState{
			Content: doc.GetContent(),
			Version: doc.GetVersion(),
		}
	}
	ws.Mu.Unlock()

	syncPayload, _ := json.Marshal(SyncPayload{
		Files:    files,
		Language: client.Language,
	})
	
	client.SendMessage(&WSMessage{
		Type:    TypeSyncFull,
		RoomID:  client.RoomID,
		Payload: syncPayload,
	})

	// Broadcast presence join to room
	h.broadcastToRoom(client.RoomID, &WSMessage{
		Type:   TypePresence,
		RoomID: client.RoomID,
		UserID: client.UserID,
		Payload: mustMarshal(PresencePayload{
			UserID:      client.UserID,
			DisplayName: client.DisplayName,
			Action:      "join",
			Online:      true,
		}),
	}, client.UserID)

	// Send list of online users to the new client
	h.sendOnlineUsers(client)

	log.Printf("User %s joined room %s", client.DisplayName, client.RoomID)
}

func (h *Hub) removeClient(client *Client) {
	h.mu.RLock()
	room, exists := h.rooms[client.RoomID]
	h.mu.RUnlock()

	if !exists {
		return
	}

	room.mu.Lock()
	delete(room.Clients, client.UserID)
	clientCount := len(room.Clients)
	room.mu.Unlock()

	close(client.Send)

	// Broadcast leave
	h.broadcastToRoom(client.RoomID, &WSMessage{
		Type:   TypePresence,
		RoomID: client.RoomID,
		UserID: client.UserID,
		Payload: mustMarshal(PresencePayload{
			UserID:      client.UserID,
			DisplayName: client.DisplayName,
			Action:      "leave",
			Online:      false,
		}),
	}, "")

	// Remove empty rooms
	if clientCount == 0 {
		h.mu.Lock()
		delete(h.rooms, client.RoomID)
		h.mu.Unlock()
	}

	log.Printf("User %s left room %s", client.DisplayName, client.RoomID)
}

func (h *Hub) sendOnlineUsers(client *Client) {
	h.mu.RLock()
	room, exists := h.rooms[client.RoomID]
	h.mu.RUnlock()
	if !exists {
		return
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	for _, c := range room.Clients {
		if c.UserID != client.UserID {
			client.SendMessage(&WSMessage{
				Type:   TypePresence,
				RoomID: client.RoomID,
				UserID: c.UserID,
				Payload: mustMarshal(PresencePayload{
					UserID:      c.UserID,
					DisplayName: c.DisplayName,
					Action:      "join",
					Online:      true,
				}),
			})
		}
	}
}

func (h *Hub) handleMessage(client *Client, msg *WSMessage) {
	switch msg.Type {
	case TypeOTOperation:
		h.handleOTOperation(client, msg)
	case TypeWorkspaceUpdate:
		h.handleWorkspaceUpdate(client, msg)
	case TypeCursor:
		h.broadcastToRoom(client.RoomID, msg, client.UserID)
	case TypeChat:
		h.broadcastToRoom(client.RoomID, msg, "")
	case TypePresence:
		h.broadcastToRoom(client.RoomID, msg, client.UserID)
	case TypeDrawStroke, TypeWebRTCSignal:
		h.broadcastToRoom(client.RoomID, msg, client.UserID)
	case TypeHeartbeat:
		client.SendMessage(&WSMessage{Type: TypeHeartbeat})
	}

	// Publish to Redis for multi-instance scaling
	if h.redis != nil && msg.Type != TypeHeartbeat {
		h.publishToRedis(msg)
	}
}

func (h *Hub) handleWorkspaceUpdate(client *Client, msg *WSMessage) {
	var payload WorkspaceUpdatePayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		log.Printf("Failed to parse workspace update: %v", err)
		return
	}

	ws := h.otEngine.GetWorkspace(client.RoomID)

	switch payload.Action {
	case "create":
		ws.GetOrCreateDocument(payload.FileID, payload.Content)
		log.Printf("File created in room %s: %s", client.RoomID, payload.FileID)
	case "delete":
		ws.Mu.Lock()
		delete(ws.Documents, payload.FileID)
		ws.Mu.Unlock()
		log.Printf("File deleted in room %s: %s", client.RoomID, payload.FileID)
	default:
		log.Printf("Unknown workspace action: %s", payload.Action)
		return
	}

	// Broadcast to all other clients in the room
	h.broadcastToRoom(client.RoomID, msg, client.UserID)
}

func (h *Hub) handleOTOperation(client *Client, msg *WSMessage) {
	var payload OTPayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		log.Printf("Failed to parse OT payload: %v", err)
		return
	}

	// Parse ops from payload
	var ops []ot.Op
	if err := json.Unmarshal(payload.Ops, &ops); err != nil {
		log.Printf("Failed to parse OT ops: %v", err)
		return
	}

	clientOp := &ot.Operation{
		Ops:       ops,
		BaseLen:   payload.BaseLen,
		TargetLen: payload.TargetLen,
		UserID:    client.UserID,
	}

	transformedOp, newVersion, err := h.otEngine.ReceiveOperation(client.RoomID, msg.FileID, clientOp, payload.Version)
	if err != nil {
		log.Printf("OT error for room %s file %s: %v", client.RoomID, msg.FileID, err)
		// On OT error, send full sync to recover
		ws := h.otEngine.GetWorkspace(client.RoomID)
		doc, exists := ws.GetDocument(msg.FileID)
		if exists {
			files := map[string]FileState{
				msg.FileID: {Content: doc.GetContent(), Version: doc.GetVersion()},
			}
			syncPayload, _ := json.Marshal(SyncPayload{
				Files:    files,
				Language: client.Language,
			})
			client.SendMessage(&WSMessage{
				Type:    TypeSyncFull,
				RoomID:  client.RoomID,
				Payload: syncPayload,
			})
		}
		return
	}

	// Send ACK to originating client
	ackPayload, _ := json.Marshal(map[string]int{"version": newVersion})
	client.SendMessage(&WSMessage{
		Type:    TypeOTAck,
		RoomID:  client.RoomID,
		FileID:  msg.FileID,
		Payload: ackPayload,
	})

	// Broadcast transformed op to other clients
	broadcastPayload, _ := json.Marshal(OTPayload{
		Ops:       mustMarshal(transformedOp.Ops),
		Version:   newVersion,
		BaseLen:   transformedOp.BaseLen,
		TargetLen: transformedOp.TargetLen,
	})
	h.broadcastToRoom(client.RoomID, &WSMessage{
		Type:    TypeOTOperation,
		RoomID:  client.RoomID,
		UserID:  client.UserID,
		FileID:  msg.FileID,
		Payload: broadcastPayload,
	}, client.UserID)
}

func (h *Hub) broadcastToRoom(roomID string, msg *WSMessage, excludeUserID string) {
	h.mu.RLock()
	room, exists := h.rooms[roomID]
	h.mu.RUnlock()

	if !exists {
		return
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	for userID, client := range room.Clients {
		if userID != excludeUserID {
			select {
			case client.Send <- data:
			default:
				log.Printf("Client %s buffer full", userID)
			}
		}
	}
}

func (h *Hub) publishToRedis(msg *WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.redis.Publish(h.ctx, "collabcode:room:"+msg.RoomID, data)
}

func (h *Hub) subscribeRedis() {
	pubsub := h.redis.PSubscribe(h.ctx, "collabcode:room:*")
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		var wsMsg WSMessage
		if err := json.Unmarshal([]byte(msg.Payload), &wsMsg); err != nil {
			continue
		}
		// Only broadcast messages from other server instances
		h.broadcastToRoom(wsMsg.RoomID, &wsMsg, wsMsg.UserID)
	}
}

func mustMarshal(v interface{}) json.RawMessage {
	data, err := json.Marshal(v)
	if err != nil {
		return json.RawMessage("{}")
	}
	return data
}
