package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/collabcode/backend/internal/auth"
	"github.com/collabcode/backend/internal/chat"
	"github.com/collabcode/backend/internal/config"
	"github.com/collabcode/backend/internal/db"
	"github.com/collabcode/backend/internal/execution"
	"github.com/collabcode/backend/internal/middleware"
	"github.com/collabcode/backend/internal/ot"
	"github.com/collabcode/backend/internal/rooms"
	ws "github.com/collabcode/backend/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Load .env in development
	godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Database
	pgPool, err := db.NewPostgresPool(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer pgPool.Close()
	log.Println("✓ Connected to PostgreSQL")

	// Redis (optional — gracefully handle missing Redis)
	var redisClient *redis.Client
	if cfg.RedisURL != "" {
		redisClient, err = db.NewRedisClient(cfg.RedisURL)
		if err != nil {
			log.Printf("⚠ Redis not available (will work without scaling): %v", err)
		} else {
			defer redisClient.Close()
			log.Println("✓ Connected to Redis")
		}
	} else {
		log.Println("⚠ Redis URL not configured — running without Pub/Sub")
	}

	// Services
	jwtMgr := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	otEngine := ot.NewEngine()
	hub := ws.NewHub(otEngine, redisClient)
	go hub.Run()

	authMiddleware := auth.NewAuthMiddleware(jwtMgr)

	// Handlers
	authHandler := auth.NewHandler(pgPool, jwtMgr)
	roomHandler := rooms.NewHandler(pgPool)
	chatHandler := chat.NewHandler(pgPool)
	execHandler := execution.NewHandler(pgPool)
	wsHandler := ws.NewHandler(hub, jwtMgr, pgPool)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "CollabCode API",
		ServerHeader: "CollabCode",
		BodyLimit:    1 * 1024 * 1024, // 1MB
	})

	middleware.SetupMiddleware(app, cfg.FrontendURL)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "collabcode-api"})
	})

	// Register routes
	api := app.Group("/api")
	authHandler.RegisterRoutes(api)
	roomHandler.RegisterRoutes(api, authMiddleware)
	chatHandler.RegisterRoutes(api, authMiddleware)
	execHandler.RegisterRoutes(api, authMiddleware)
	wsHandler.RegisterRoutes(app)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down...")
		hub.Stop()
		app.Shutdown()
	}()

	log.Printf("🚀 CollabCode API starting on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
