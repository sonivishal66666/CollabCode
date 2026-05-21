# CollabCode

A production-grade realtime collaborative coding and technical interview platform.

![CollabCode](https://img.shields.io/badge/CollabCode-Realtime%20Collaboration-8b5cf6?style=for-the-badge)

## Architecture

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Monaco Editor + Zustand + Framer Motion
- **Backend**: Go + Fiber + WebSocket + OT Engine
- **Database**: Supabase PostgreSQL (free tier)
- **Cache**: Redis Cloud (free tier)
- **Code Execution**: Local Execution Engine via Go `os/exec` (uses host machine's installed runtimes)
- **Deployment**: Vercel (frontend) + Render (backend)

## Features

### 💎 Ultra-Premium Collaborative Suite
- 📹 **WebRTC Voice & Video Channels**: State-of-the-art, peer-to-peer audio and video calling integrated directly into the workspace. Utilizing WebSockets for signal routing, raw `RTCPeerConnection` for streams, and the **Web Audio API** with an `AnalyserNode` to drive beautiful dynamic glowing avatar borders for active speakers.
- 🎨 **Glassmorphic Collaborative Whiteboard**: Real-time canvas drawings synced instantly across users. Features Pencil, Line, Rectangle, Circle, and Eraser, with customizable line thickness and palette matching, all synced over WebSocket.
- ⏳ **Workspace "Time Machine"**: Step back in time to inspect any file's history. Includes a highly responsive sliding scrubber timeline and a side-by-side comparative diffing panel utilizing Monaco Editor's native high-performance `DiffEditor`.
- ⌨️ **Universal Command Palette (`Ctrl + K`)**: A floating glassmorphism control hub inspired by modern IDEs. Instantly search and switch files, run compilation, shift UI themes, toggle panels, and control audio settings with custom arpeggiated sound feedback.

### 👑 Ultra-Premium Portal Experience
- 🎨 **3D Damped Spring Tilt Portals**: Sleek, immersive login and signup portals driven by real-time mouse-coordinate spring solver physics using Framer Motion.
- 🌌 **High-Perspective Space Grid Backdrops**: Stunning visual canvas styled with high-perspective `#050508` grid lines and slow-drifting neon colored ambient glowing blobs.
- ⚡ **Interactive Input Fields & Focus States**: Color-coded neon focus highlighting (emerald for Display Name, cyan for Email, and violet for Password) plus custom animated password eye visibility toggles (`Eye`/`EyeOff`).
- 💅 **Visual Excellence & Typography**: Modern glassmorphism overlays, double-layered premium gradient borders, and responsive hover-glowing outlines tailored for elite developers.
- 🖊️ **Interactive Workspace Typing**: Real-time landing page placeholder typing simulator showing live editor entries for `"soni"` and `"vishal"`.


### 🚀 Core Platform Features
- 🔐 **JWT Authentication**: Secure user login/signup with state-of-the-art token rotation.
- 📁 **Multi-File Workspace Explorer**: Fully interactive sidebar with folder creation, nested structures, search/filter, and animated collapse/expand transitions.
- 👥 **OT-Powered Real-time Syncing**: Robust Operational Transform buffer syncing all workspace file and folder mutations instantly across all connected clients.
- 🎨 **Premium Multi-Theme Switcher**: Instant system-wide theme selector for **Vercel Midnight**, **Cyberpunk Neon**, **Tokyo Night**, and **Dracula**, with dynamic class variables synced perfectly to custom syntax themes inside Monaco.
- 👥 **Multiplayer Cursor Overlays**: Visualized real-time cursor coordinates and live selection ranges for remote users, complete with glowing name tags and pulsing user typing rings.
- 🎵 **Browser-Synthesized Audio Engine**: Fully immersive audio effects programmatically generated via browser-native **Web Audio API** (oscillator chimes, swooshes, woody clicks, and warning drones) with mute/unmute settings.
- 📝 **Monaco Editor Integration**: Embedded VS Code editing engine equipped with typescript definitions, smooth scrolling, auto-layout resizing, and smart language mappings.
- ▶️ **Live Multi-File Compilation**: Secure code execution environment for Python, JavaScript, C++, Java, TypeScript, and Go.
- 🎆 **Confetti Canvas Burst**: High-performance, hardware-accelerated HTML5 Canvas particle explosion synced to the active theme colors, triggered upon successful code compilation.
- 💬 **Sleek Workspace Chat**: Real-time collaborative chat sidebar featuring smooth slide-in entry and arpeggiated chiming audio notifications on receipt.
- 🎯 **Technical Interview Dashboard**: Specialized interview modes featuring integrated stopwatch timers, staggered spring card transitions, and active role configurations.
- 💾 **Snapshot Versioning**: Save snapshot milestones of active workspace directories instantly.
- 📊 **Redis Pub/Sub Scaling**: Modular infrastructure support for horizontal scaling across multiple servers.

## Quick Start

### Prerequisites

To fully utilize the platform and code execution:
- Go 1.22+
- Node.js 20+ (for Frontend and JS/TS execution)
- Python 3+ (for Python execution)
- Java JDK (for Java execution)
- GCC/G++ (for C++ execution)
- A free [Supabase](https://supabase.com) project
- (Optional) A free [Redis Cloud](https://redis.io/try-free/) instance

### 1. Setup Database

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `scripts/schema.sql`
4. Run the SQL to create all tables

### 2. Configure Environment

```bash
# In the project root
cp .env.example .env
```

Edit `.env` with your values:
```
PORT=8080
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
REDIS_URL=redis://default:[YOUR-PASSWORD]@[YOUR-HOST]:[YOUR-PORT]  # optional
JWT_SECRET=your-secret-key-at-least-32-chars-long
FRONTEND_URL=http://localhost:3000
```

### 3. Start Backend

```bash
cd backend
go mod tidy
go run ./cmd/server
```

The API will start on `http://localhost:8080`

### 4. Start Frontend

```bash
cd frontend

# Create frontend env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8080" >> .env.local

npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### 5. Open in Browser

1. Go to `http://localhost:3000`
2. Create an account
3. Create a room
4. Share the room code with a friend
5. Start coding together!

## Project Structure

```
collabcode/
├── backend/
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── auth/                   # JWT auth + handlers
│   │   ├── chat/                   # Chat persistence
│   │   ├── config/                 # Environment config
│   │   ├── db/                     # PostgreSQL + Redis
│   │   ├── execution/              # Local os/exec integration
│   │   ├── middleware/             # CORS, rate limiting, logging
│   │   ├── models/                 # Data models
│   │   ├── ot/                     # Operational Transform engine
│   │   ├── rooms/                  # Room CRUD
│   │   └── websocket/              # WebSocket hub + client
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages
│   │   ├── hooks/                  # React hooks
│   │   ├── lib/                    # API client, utilities
│   │   ├── stores/                 # Zustand stores
│   │   └── types/                  # TypeScript types
│   └── package.json
├── scripts/
│   └── schema.sql                  # Database schema
├── .env.example
└── README.md
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms` | List rooms |
| GET | `/api/rooms/:id` | Get room details |
| POST | `/api/rooms/join` | Join by code |
| DELETE | `/api/rooms/:id` | Delete room |
| POST | `/api/rooms/:id/snapshots` | Save code |
| GET | `/api/rooms/:id/snapshots` | Get snapshots |

### Execution
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/execute` | Execute code |
| GET | `/api/execute/languages` | List languages |

### WebSocket
| Path | Description |
|------|-------------|
| `ws://host/ws/:roomId?token=JWT` | Join room |

## Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import in Vercel
3. Set root directory to `frontend`
4. Add environment variables

### Backend → Render
1. Push to GitHub
2. Create Web Service in Render
3. Set root directory to `backend`
4. Set build command: `go build -o server ./cmd/server`
5. Set start command: `./server`
6. Add environment variables

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 16 (Turbopack), React 19, TypeScript |
| **Styling & Design** | HSL CSS Theme Engine, Glassmorphism, Tailwind CSS v4 |
| **Multiplayer Sync** | WebSocket Hub (Go Fiber), Operational Transform (OT) Engine |
| **Visual Annotations** | `useRemoteDecorations` Custom Hook, Monaco DeltaDecorations |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Sensory Audio** | Programmatic Oscillator Synthesizer (Web Audio API) |
| **Visual Effects** | Native HTML5 Canvas Particle Engine (Confetti) |
| **Animations** | Spring Physics & Layout Staggering (Framer Motion) |
| **State Management** | Zustand Store |
| **Backend API** | Go, Fiber, WebSocket |
| **Database** | Supabase PostgreSQL |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

## License

MIT
