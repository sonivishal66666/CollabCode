package execution

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/collabcode/backend/internal/auth"
	"github.com/collabcode/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

var languageMap = map[string]LanguageConfig{
	"python": {
		Language: "python",
		Version:  "3.14.3",
		Filename: "src/main.py",
	},
	"javascript": {
		Language: "javascript",
		Version:  "24.11.1",
		Filename: "src/index.js",
	},
	"cpp": {
		Language: "c++",
		Version:  "latest",
		Filename: "src/main.cpp",
	},
	"java": {
		Language: "java",
		Version:  "24.0.2",
		Filename: "src/Main.java",
	},
	"typescript": {
		Language: "typescript",
		Version:  "latest",
		Filename: "src/main.ts",
	},
	"go": {
		Language: "go",
		Version:  "latest",
		Filename: "src/main.go",
	},
}

type LanguageConfig struct {
	Language string
	Version  string
	Filename string
}

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		db: db,
	}
}

func (h *Handler) RegisterRoutes(app fiber.Router, authMiddleware fiber.Handler) {
	execRoute := app.Group("/execute", authMiddleware)
	execRoute.Post("/", h.Execute)
	execRoute.Get("/languages", h.GetLanguages)
}

func (h *Handler) Execute(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)

	var input struct {
		RoomID   string `json:"room_id"`
		Language string `json:"language"`
		Files    []struct {
			Name    string `json:"name"`
			Content string `json:"content"`
		} `json:"files"`
		Input    string `json:"input"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if len(input.Files) == 0 || input.Language == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "files and language are required"})
	}

	langConfig, exists := languageMap[input.Language]
	if !exists {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unsupported language"})
	}

	startTime := time.Now()

	// Auto-wrap Java code if it doesn't contain a class definition (only for the main file if it's the only one)
	if input.Language == "java" && len(input.Files) == 1 && !strings.Contains(input.Files[0].Content, "class ") {
		input.Files[0].Content = fmt.Sprintf("public class Main {\n    public static void main(String[] args) {\n        %s\n    }\n}", input.Files[0].Content)
	}

	// Create a temporary directory
	tempDir, err := os.MkdirTemp("", "codeexec-*")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create execution environment"})
	}
	defer os.RemoveAll(tempDir) // clean up

	// Write all files preserving directory structure
	for _, file := range input.Files {
		filePath := filepath.Join(tempDir, file.Name)
		if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create directories"})
		}
		if err := os.WriteFile(filePath, []byte(file.Content), 0644); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to write code file"})
		}
	}
	
	entrypointPath := filepath.Join(tempDir, langConfig.Filename)
	if _, err := os.Stat(entrypointPath); os.IsNotExist(err) && len(input.Files) > 0 {
		// Fallback to the first file if the expected entrypoint is not found
		entrypointPath = filepath.Join(tempDir, input.Files[0].Name)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var cmd *exec.Cmd
	switch input.Language {
	case "python":
		cmd = exec.CommandContext(ctx, "python", entrypointPath)
	case "javascript":
		cmd = exec.CommandContext(ctx, "node", entrypointPath)
	case "java":
		// Compile all Java files in src
		compileCmd := exec.CommandContext(ctx, "javac", "-d", ".", entrypointPath)
		compileCmd.Dir = tempDir
		if output, err := compileCmd.CombinedOutput(); err != nil {
			return c.JSON(models.ExecutionResult{Stdout: "", Stderr: string(output), ExitCode: 1, ExecutionTimeMs: int(time.Since(startTime).Milliseconds())})
		}
		// Run Main class
		cmd = exec.CommandContext(ctx, "java", "-cp", ".", "Main")
	case "go":
		cmd = exec.CommandContext(ctx, "go", "run", entrypointPath)
	case "cpp":
		exePath := filepath.Join(tempDir, "a.exe")
		compileCmd := exec.CommandContext(ctx, "g++", entrypointPath, "-o", exePath)
		compileCmd.Dir = tempDir
		if output, err := compileCmd.CombinedOutput(); err != nil {
			return c.JSON(models.ExecutionResult{Stdout: "", Stderr: string(output), ExitCode: 1, ExecutionTimeMs: int(time.Since(startTime).Milliseconds())})
		}
		cmd = exec.CommandContext(ctx, exePath)
	case "typescript":
		cmd = exec.CommandContext(ctx, "npx", "ts-node", entrypointPath)
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "execution not configured for language"})
	}

	cmd.Dir = tempDir

	if input.Input != "" {
		cmd.Stdin = strings.NewReader(input.Input)
	}

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf

	err = cmd.Run()

	executionTime := int(time.Since(startTime).Milliseconds())
	exitCode := 0
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			exitCode = exitError.ExitCode()
		} else {
			exitCode = 1
		}
	}

	// For context deadline exceeded
	if ctx.Err() == context.DeadlineExceeded {
		stderrBuf.WriteString("\nExecution timed out (10s limit).")
		exitCode = 124
	}

	stdout := stdoutBuf.String()
	stderr := stderrBuf.String()

	if input.RoomID != "" {
		h.db.Exec(context.Background(),
			`INSERT INTO execution_history (room_id, user_id, language, code, input, stdout, stderr, exit_code, execution_time_ms, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')`,
			input.RoomID, userID, input.Language, input.Files[0].Content, input.Input, stdout, stderr, exitCode, executionTime,
		)
	}

	result := models.ExecutionResult{
		Stdout:          stdout,
		Stderr:          stderr,
		ExitCode:        exitCode,
		ExecutionTimeMs: executionTime,
	}

	return c.JSON(result)
}

func (h *Handler) GetLanguages(c *fiber.Ctx) error {
	langs := make([]fiber.Map, 0)
	for key, cfg := range languageMap {
		langs = append(langs, fiber.Map{
			"id":       key,
			"name":     cfg.Language,
			"version":  cfg.Version,
			"filename": cfg.Filename,
		})
	}
	return c.JSON(langs)
}
