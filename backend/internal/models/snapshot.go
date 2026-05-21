package models

import "time"

type CodeSnapshot struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"room_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	Language  string    `json:"language"`
	Version   int       `json:"version"`
	CreatedAt time.Time `json:"created_at"`
}

type Execution struct {
	ID              string    `json:"id"`
	RoomID          string    `json:"room_id"`
	UserID          string    `json:"user_id"`
	Language        string    `json:"language"`
	Code            string    `json:"code"`
	Input           *string   `json:"input"`
	Stdout          *string   `json:"stdout"`
	Stderr          *string   `json:"stderr"`
	ExitCode        *int      `json:"exit_code"`
	ExecutionTimeMs *int      `json:"execution_time_ms"`
	MemoryUsedKB    *int      `json:"memory_used_kb"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
}

type ExecutionRequest struct {
	Language string `json:"language" validate:"required"`
	Code     string `json:"code" validate:"required"`
	Input    string `json:"input"`
}

type ExecutionResult struct {
	Stdout          string `json:"stdout"`
	Stderr          string `json:"stderr"`
	ExitCode        int    `json:"exit_code"`
	ExecutionTimeMs int    `json:"execution_time_ms"`
	MemoryUsedKB    int    `json:"memory_used_kb"`
	TimedOut        bool   `json:"timed_out"`
}
