package websocket

import "encoding/json"

type MessageType string

const (
	TypeOTOperation MessageType = "ot:operation"
	TypeOTAck       MessageType = "ot:ack"
	TypeSyncFull    MessageType = "sync:full"
	TypeSyncRequest MessageType = "sync:request"
	TypeCursor      MessageType = "cursor"
	TypePresence    MessageType = "presence"
	TypeChat        MessageType = "chat"
	TypeExecRequest MessageType = "exec:request"
	TypeExecResult      MessageType = "exec:result"
	TypeHeartbeat       MessageType = "heartbeat"
	TypeError           MessageType = "error"
	TypeWorkspaceUpdate MessageType = "workspace:update"
	TypeDrawStroke      MessageType = "draw:stroke"
	TypeWebRTCSignal    MessageType = "webrtc:signal"
)

type WorkspaceUpdatePayload struct {
	Action  string `json:"action"` // "create" or "delete"
	FileID  string `json:"file_id"`
	Content string `json:"content,omitempty"`
	IsDir   bool   `json:"is_dir,omitempty"`
}

type WSMessage struct {
	Type    MessageType     `json:"type"`
	RoomID  string          `json:"room_id,omitempty"`
	UserID  string          `json:"user_id,omitempty"`
	FileID  string          `json:"file_id,omitempty"` // Used to target specific files
	Payload json.RawMessage `json:"payload"`
}

type OTPayload struct {
	Ops     json.RawMessage `json:"ops"`
	Version int             `json:"version"`
	BaseLen int             `json:"base_len"`
	TargetLen int           `json:"target_len"`
}

type SyncPayload struct {
	Files    map[string]FileState `json:"files"`
	Language string               `json:"language"`
}

type FileState struct {
	Content string `json:"content"`
	Version int    `json:"version"`
}

type CursorPayload struct {
	Line      int    `json:"line"`
	Column    int    `json:"column"`
	UserID    string `json:"user_id"`
	UserName  string `json:"user_name"`
	Selection *SelectionRange `json:"selection,omitempty"`
}

type SelectionRange struct {
	StartLine   int `json:"start_line"`
	StartColumn int `json:"start_column"`
	EndLine     int `json:"end_line"`
	EndColumn   int `json:"end_column"`
}

type PresencePayload struct {
	UserID      string `json:"user_id"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url,omitempty"`
	Action      string `json:"action"` // "join", "leave", "typing"
	Online      bool   `json:"online"`
}

type ChatPayload struct {
	MessageID   string `json:"message_id"`
	Content     string `json:"content"`
	UserID      string `json:"user_id"`
	DisplayName string `json:"display_name"`
	Timestamp   string `json:"timestamp"`
}

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
