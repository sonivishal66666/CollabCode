package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/collabcode/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	db     *pgxpool.Pool
	jwtMgr *JWTManager
}

func NewHandler(db *pgxpool.Pool, jwtMgr *JWTManager) *Handler {
	return &Handler{db: db, jwtMgr: jwtMgr}
}

func (h *Handler) RegisterRoutes(app fiber.Router) {
	auth := app.Group("/auth")
	auth.Post("/signup", h.Signup)
	auth.Post("/login", h.Login)
	auth.Post("/refresh", h.Refresh)
	auth.Get("/me", NewAuthMiddleware(h.jwtMgr), h.Me)
}

func (h *Handler) Signup(c *fiber.Ctx) error {
	var input models.UserCreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if input.Email == "" || input.Password == "" || input.DisplayName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email, password, and display_name are required"})
	}
	if len(input.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "password must be at least 8 characters"})
	}

	var exists bool
	err := h.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", input.Email).Scan(&exists)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}
	if exists {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "email already registered"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to hash password"})
	}

	user := &models.User{}
	err = h.db.QueryRow(context.Background(),
		`INSERT INTO users (email, password_hash, display_name) 
		 VALUES ($1, $2, $3) 
		 RETURNING id, email, display_name, status, created_at, updated_at`,
		input.Email, string(hash), input.DisplayName,
	).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Status, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create user"})
	}

	accessToken, err := h.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	refreshToken, err := h.jwtMgr.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	h.storeRefreshToken(user.ID, refreshToken, c.Get("User-Agent"), c.IP())

	return c.Status(fiber.StatusCreated).JSON(models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var input models.UserLoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if input.Email == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email and password are required"})
	}

	user := &models.User{}
	err := h.db.QueryRow(context.Background(),
		`SELECT id, email, password_hash, display_name, avatar_url, status, created_at, updated_at 
		 FROM users WHERE email = $1`,
		input.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.DisplayName, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid email or password"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid email or password"})
	}

	accessToken, err := h.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	refreshToken, err := h.jwtMgr.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	h.storeRefreshToken(user.ID, refreshToken, c.Get("User-Agent"), c.IP())

	// Update last_seen
	h.db.Exec(context.Background(), "UPDATE users SET last_seen_at = NOW() WHERE id = $1", user.ID)

	return c.JSON(models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&body); err != nil || body.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "refresh_token is required"})
	}

	claims, err := h.jwtMgr.ValidateToken(body.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid refresh token"})
	}

	// Verify token exists in DB
	var sessionID string
	err = h.db.QueryRow(context.Background(),
		"SELECT id FROM sessions WHERE refresh_token = $1 AND user_id = $2 AND expires_at > NOW()",
		body.RefreshToken, claims.UserID,
	).Scan(&sessionID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "refresh token revoked or expired"})
	}

	// Delete old session
	h.db.Exec(context.Background(), "DELETE FROM sessions WHERE id = $1", sessionID)

	accessToken, err := h.jwtMgr.GenerateAccessToken(claims.UserID, claims.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	newRefreshToken, err := h.jwtMgr.GenerateRefreshToken(claims.UserID, claims.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	h.storeRefreshToken(claims.UserID, newRefreshToken, c.Get("User-Agent"), c.IP())

	return c.JSON(fiber.Map{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

func (h *Handler) Me(c *fiber.Ctx) error {
	userID := GetUserID(c)
	user := &models.User{}
	err := h.db.QueryRow(context.Background(),
		`SELECT id, email, display_name, avatar_url, status, last_seen_at, created_at, updated_at 
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.DisplayName, &user.AvatarURL, &user.Status, &user.LastSeenAt, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}
	return c.JSON(user)
}

func (h *Handler) storeRefreshToken(userID, token, userAgent, ip string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = h.db.Exec(ctx,
		`INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at) 
		 VALUES ($1, $2, $3, $4, $5)`,
		userID, token, userAgent, ip,
		time.Now().Add(7*24*time.Hour),
	)
}

func init() {
	_ = fmt.Sprintf // suppress unused import
}
