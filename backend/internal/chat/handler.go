package chat

import (
	"context"

	"github.com/collabcode/backend/internal/auth"
	"github.com/collabcode/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

func (h *Handler) RegisterRoutes(app fiber.Router, authMiddleware fiber.Handler) {
	chat := app.Group("/rooms/:id/messages", authMiddleware)
	chat.Get("/", h.GetMessages)
	chat.Post("/", h.SendMessage)
}

func (h *Handler) GetMessages(c *fiber.Ctx) error {
	roomID := c.Params("id")
	limit := c.QueryInt("limit", 50)
	if limit > 200 {
		limit = 200
	}

	rows, err := h.db.Query(context.Background(),
		`SELECT m.id, m.room_id, m.user_id, m.content, m.created_at, u.display_name
		 FROM messages m
		 JOIN users u ON u.id = m.user_id
		 WHERE m.room_id = $1
		 ORDER BY m.created_at DESC
		 LIMIT $2`,
		roomID, limit,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch messages"})
	}
	defer rows.Close()

	messages := make([]*models.Message, 0)
	for rows.Next() {
		m := &models.Message{}
		if err := rows.Scan(&m.ID, &m.RoomID, &m.UserID, &m.Content, &m.CreatedAt, &m.DisplayName); err != nil {
			continue
		}
		messages = append(messages, m)
	}

	// Reverse to chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return c.JSON(messages)
}

func (h *Handler) SendMessage(c *fiber.Ctx) error {
	roomID := c.Params("id")
	userID := auth.GetUserID(c)

	var body struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&body); err != nil || body.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content is required"})
	}

	msg := &models.Message{}
	err := h.db.QueryRow(context.Background(),
		`INSERT INTO messages (room_id, user_id, content) VALUES ($1, $2, $3)
		 RETURNING id, room_id, user_id, content, created_at`,
		roomID, userID, body.Content,
	).Scan(&msg.ID, &msg.RoomID, &msg.UserID, &msg.Content, &msg.CreatedAt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to send message"})
	}

	return c.Status(fiber.StatusCreated).JSON(msg)
}

func (h *Handler) SaveMessageFromWS(roomID, userID, content string) error {
	_, err := h.db.Exec(context.Background(),
		"INSERT INTO messages (room_id, user_id, content) VALUES ($1, $2, $3)",
		roomID, userID, content,
	)
	return err
}
