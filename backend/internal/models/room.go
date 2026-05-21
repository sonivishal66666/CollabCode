package models

import "time"

type Room struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Description     *string   `json:"description"`
	RoomCode        string    `json:"room_code"`
	Language        string    `json:"language"`
	IsInterview     bool      `json:"is_interview"`
	Status          string    `json:"status"`
	MaxParticipants int       `json:"max_participants"`
	CreatedBy       string    `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type RoomCreateInput struct {
	Name            string `json:"name" validate:"required,min=2,max=200"`
	Description     string `json:"description"`
	Language        string `json:"language" validate:"required"`
	IsInterview     bool   `json:"is_interview"`
	MaxParticipants int    `json:"max_participants"`
}

type RoomParticipant struct {
	ID           string    `json:"id"`
	RoomID       string    `json:"room_id"`
	UserID       string    `json:"user_id"`
	Role         string    `json:"role"`
	JoinedAt     time.Time `json:"joined_at"`
	LastActiveAt time.Time `json:"last_active_at"`
	DisplayName  string    `json:"display_name,omitempty"`
	Email        string    `json:"email,omitempty"`
}

type RoomWithParticipants struct {
	Room         *Room              `json:"room"`
	Participants []*RoomParticipant `json:"participants"`
}
