package main

import (
	"fmt"
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
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Load .env in development
	godotenv.Load()

	var configErr error
	cfg, configErr := config.Load()
	if configErr != nil {
		log.Printf("⚠ Failed to load config: %v", configErr)
		cfg = &config.Config{
			Port:        "8080",
			Env:         "production",
			DatabaseURL: "",
			RedisURL:    "",
			JWTSecret:   "dummy-secret-because-config-failed",
			FrontendURL: "http://localhost:3000",
		}
	}

	// Database
	var pgPool *pgxpool.Pool
	var dbErr error
	if configErr == nil && cfg.DatabaseURL != "" {
		pgPool, dbErr = db.NewPostgresPool(cfg.DatabaseURL)
		if dbErr != nil {
			log.Printf("⚠ Failed to connect to PostgreSQL: %v", dbErr)
		} else {
			defer pgPool.Close()
			log.Println("✓ Connected to PostgreSQL")
		}
	} else if configErr != nil {
		dbErr = fmt.Errorf("database URL not configured because config failed: %w", configErr)
	} else {
		dbErr = fmt.Errorf("DATABASE_URL is empty")
	}

	// Redis (optional — gracefully handle missing Redis)
	var redisClient *redis.Client
	var redisErr error
	if cfg.RedisURL != "" {
		redisClient, redisErr = db.NewRedisClient(cfg.RedisURL)
		if redisErr != nil {
			log.Printf("⚠ Redis not available (will work without scaling): %v", redisErr)
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
		status := "ok"
		var dbErrMsg string
		if dbErr != nil {
			status = "error"
			dbErrMsg = dbErr.Error()
		}
		var configErrMsg string
		if configErr != nil {
			status = "error"
			configErrMsg = configErr.Error()
		}
		return c.JSON(fiber.Map{
			"status":       status,
			"service":      "collabcode-api",
			"config_error": configErrMsg,
			"db_connected": dbErr == nil,
			"db_error":     dbErrMsg,
		})
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
