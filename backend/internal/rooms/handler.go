package rooms

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

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
	rooms := app.Group("/rooms", authMiddleware)
	rooms.Post("/", h.Create)
	rooms.Get("/", h.List)
	rooms.Get("/:id", h.Get)
	rooms.Post("/join", h.Join)
	rooms.Delete("/:id", h.Delete)
	rooms.Get("/:id/snapshots", h.GetSnapshots)
	rooms.Post("/:id/snapshots", h.SaveSnapshot)
	rooms.Get("/:id/executions", h.GetExecutions)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	var input models.RoomCreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}
	if input.Language == "" {
		input.Language = "javascript"
	}
	if input.MaxParticipants <= 0 {
		input.MaxParticipants = 10
	}

	roomCode := generateRoomCode()
	room := &models.Room{}

	err := h.db.QueryRow(context.Background(),
		`INSERT INTO rooms (name, description, room_code, language, is_interview, max_participants, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, name, description, room_code, language, is_interview, status, max_participants, created_by, created_at, updated_at`,
		input.Name, input.Description, roomCode, input.Language, input.IsInterview, input.MaxParticipants, userID,
	).Scan(&room.ID, &room.Name, &room.Description, &room.RoomCode, &room.Language, &room.IsInterview,
		&room.Status, &room.MaxParticipants, &room.CreatedBy, &room.CreatedAt, &room.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create room"})
	}

	// Add creator as owner
	_, err = h.db.Exec(context.Background(),
		`INSERT INTO room_participants (room_id, user_id, role) VALUES ($1, $2, 'owner')`,
		room.ID, userID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to add participant"})
	}

	return c.Status(fiber.StatusCreated).JSON(room)
}

func (h *Handler) List(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	rows, err := h.db.Query(context.Background(),
		`SELECT r.id, r.name, r.description, r.room_code, r.language, r.is_interview, 
		        r.status, r.max_participants, r.created_by, r.created_at, r.updated_at,
		        rp.role,
		        (SELECT COUNT(*) FROM room_participants WHERE room_id = r.id) as participant_count
		 FROM rooms r
		 JOIN room_participants rp ON rp.room_id = r.id AND rp.user_id = $1
		 WHERE r.status = 'active'
		 ORDER BY r.updated_at DESC`,
		userID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch rooms"})
	}
	defer rows.Close()

	type RoomListItem struct {
		models.Room
		Role             string `json:"role"`
		ParticipantCount int    `json:"participant_count"`
	}

	results := make([]RoomListItem, 0)
	for rows.Next() {
		var item RoomListItem
		err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.RoomCode, &item.Language,
			&item.IsInterview, &item.Status, &item.MaxParticipants, &item.CreatedBy,
			&item.CreatedAt, &item.UpdatedAt, &item.Role, &item.ParticipantCount)
		if err != nil {
			continue
		}
		results = append(results, item)
	}

	return c.JSON(results)
}

func (h *Handler) Get(c *fiber.Ctx) error {
	roomID := c.Params("id")
	userID := auth.GetUserID(c)

	room := &models.Room{}
	err := h.db.QueryRow(context.Background(),
		`SELECT r.id, r.name, r.description, r.room_code, r.language, r.is_interview,
		        r.status, r.max_participants, r.created_by, r.created_at, r.updated_at
		 FROM rooms r
		 JOIN room_participants rp ON rp.room_id = r.id AND rp.user_id = $2
		 WHERE r.id = $1`,
		roomID, userID,
	).Scan(&room.ID, &room.Name, &room.Description, &room.RoomCode, &room.Language,
		&room.IsInterview, &room.Status, &room.MaxParticipants, &room.CreatedBy,
		&room.CreatedAt, &room.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	// Get participants
	partRows, err := h.db.Query(context.Background(),
		`SELECT rp.id, rp.room_id, rp.user_id, rp.role, rp.joined_at, rp.last_active_at,
		        u.display_name, u.email
		 FROM room_participants rp
		 JOIN users u ON u.id = rp.user_id
		 WHERE rp.room_id = $1`,
		roomID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch participants"})
	}
	defer partRows.Close()

	participants := make([]*models.RoomParticipant, 0)
	for partRows.Next() {
		p := &models.RoomParticipant{}
		if err := partRows.Scan(&p.ID, &p.RoomID, &p.UserID, &p.Role, &p.JoinedAt, &p.LastActiveAt, &p.DisplayName, &p.Email); err != nil {
			continue
		}
		participants = append(participants, p)
	}

	return c.JSON(models.RoomWithParticipants{Room: room, Participants: participants})
}

func (h *Handler) Join(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	var body struct {
		RoomCode string `json:"room_code"`
	}
	if err := c.BodyParser(&body); err != nil || body.RoomCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "room_code is required"})
	}

	var roomID string
	var maxParts int
	err := h.db.QueryRow(context.Background(),
		"SELECT id, max_participants FROM rooms WHERE room_code = $1 AND status = 'active'",
		body.RoomCode,
	).Scan(&roomID, &maxParts)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	// Check if already a participant
	var exists bool
	h.db.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2)",
		roomID, userID,
	).Scan(&exists)
	if exists {
		return c.JSON(fiber.Map{"room_id": roomID, "message": "already joined"})
	}

	// Check participant count
	var count int
	h.db.QueryRow(context.Background(),
		"SELECT COUNT(*) FROM room_participants WHERE room_id = $1",
		roomID,
	).Scan(&count)
	if count >= maxParts {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "room is full"})
	}

	_, err = h.db.Exec(context.Background(),
		`INSERT INTO room_participants (room_id, user_id, role) VALUES ($1, $2, 'participant')`,
		roomID, userID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to join room"})
	}

	return c.JSON(fiber.Map{"room_id": roomID, "message": "joined successfully"})
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	roomID := c.Params("id")
	userID := auth.GetUserID(c)

	result, err := h.db.Exec(context.Background(),
		"UPDATE rooms SET status = 'deleted' WHERE id = $1 AND created_by = $2",
		roomID, userID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete room"})
	}
	if result.RowsAffected() == 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "not authorized"})
	}

	return c.JSON(fiber.Map{"message": "room deleted"})
}

func (h *Handler) SaveSnapshot(c *fiber.Ctx) error {
	roomID := c.Params("id")
	userID := auth.GetUserID(c)

	var body struct {
		Content  string `json:"content"`
		Language string `json:"language"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	// Get next version number
	var version int
	h.db.QueryRow(context.Background(),
		"SELECT COALESCE(MAX(version), 0) + 1 FROM code_snapshots WHERE room_id = $1",
		roomID,
	).Scan(&version)

	snapshot := &models.CodeSnapshot{}
	err := h.db.QueryRow(context.Background(),
		`INSERT INTO code_snapshots (room_id, user_id, content, language, version)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, room_id, user_id, content, language, version, created_at`,
		roomID, userID, body.Content, body.Language, version,
	).Scan(&snapshot.ID, &snapshot.RoomID, &snapshot.UserID, &snapshot.Content,
		&snapshot.Language, &snapshot.Version, &snapshot.CreatedAt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save snapshot"})
	}

	return c.Status(fiber.StatusCreated).JSON(snapshot)
}

func (h *Handler) GetSnapshots(c *fiber.Ctx) error {
	roomID := c.Params("id")
	rows, err := h.db.Query(context.Background(),
		`SELECT id, room_id, user_id, content, language, version, created_at
		 FROM code_snapshots WHERE room_id = $1 ORDER BY version DESC LIMIT 20`,
		roomID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch snapshots"})
	}
	defer rows.Close()

	snapshots := make([]*models.CodeSnapshot, 0)
	for rows.Next() {
		s := &models.CodeSnapshot{}
		if err := rows.Scan(&s.ID, &s.RoomID, &s.UserID, &s.Content, &s.Language, &s.Version, &s.CreatedAt); err != nil {
			continue
		}
		snapshots = append(snapshots, s)
	}

	return c.JSON(snapshots)
}

func (h *Handler) GetExecutions(c *fiber.Ctx) error {
	roomID := c.Params("id")
	rows, err := h.db.Query(context.Background(),
		`SELECT id, room_id, user_id, language, code, input, stdout, stderr, 
		        exit_code, execution_time_ms, status, created_at
		 FROM execution_history WHERE room_id = $1 ORDER BY created_at DESC LIMIT 20`,
		roomID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch executions"})
	}
	defer rows.Close()

	executions := make([]*models.Execution, 0)
	for rows.Next() {
		e := &models.Execution{}
		if err := rows.Scan(&e.ID, &e.RoomID, &e.UserID, &e.Language, &e.Code, &e.Input,
			&e.Stdout, &e.Stderr, &e.ExitCode, &e.ExecutionTimeMs, &e.Status, &e.CreatedAt); err != nil {
			continue
		}
		executions = append(executions, e)
	}

	return c.JSON(executions)
}

func generateRoomCode() string {
	b := make([]byte, 4)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func init() {
	_ = time.Now // suppress unused import
}
