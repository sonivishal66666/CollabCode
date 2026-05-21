package websocket

import (
	"context"
	"log"

	"github.com/collabcode/backend/internal/auth"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	hub    *Hub
	jwtMgr *auth.JWTManager
	db     *pgxpool.Pool
}

func NewHandler(hub *Hub, jwtMgr *auth.JWTManager, db *pgxpool.Pool) *Handler {
	return &Handler{hub: hub, jwtMgr: jwtMgr, db: db}
}

func (h *Handler) RegisterRoutes(app fiber.Router) {
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/:roomID", websocket.New(h.HandleWebSocket))
}

func (h *Handler) HandleWebSocket(c *websocket.Conn) {
	roomID := c.Params("roomID")
	token := c.Query("token")

	if token == "" {
		log.Println("WebSocket: missing auth token")
		c.Close()
		return
	}

	claims, err := h.jwtMgr.ValidateToken(token)
	if err != nil {
		log.Printf("WebSocket: invalid token: %v", err)
		c.Close()
		return
	}

	// Verify user is participant of the room and get language
	var displayName string
	var language string
	err = h.db.QueryRow(context.Background(),
		`SELECT u.display_name, r.language FROM room_participants rp
		 JOIN users u ON u.id = rp.user_id
		 JOIN rooms r ON r.id = rp.room_id
		 WHERE rp.room_id = $1 AND rp.user_id = $2`,
		roomID, claims.UserID,
	).Scan(&displayName, &language)
	if err != nil {
		log.Printf("WebSocket: user %s not a participant of room %s", claims.UserID, roomID)
		c.Close()
		return
	}

	client := NewClient(h.hub, c, roomID, claims.UserID, displayName, language)
	h.hub.register <- client

	go client.WritePump()
	client.ReadPump()
}
