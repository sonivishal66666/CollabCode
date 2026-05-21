# CollabCode

A production-grade realtime collaborative coding and technical interview platform.

![CollabCode](https://img.shields.io/badge/CollabCode-Realtime%20Collaboration-8b5cf6?style=for-the-badge)

## 🏗️ Production Architecture

CollabCode is architected as a high-performance, low-latency decoupled system:

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Monaco Editor + Zustand + Framer Motion (Hosted on **Vercel**)
- **Backend**: Go + Fiber + WebSockets + OT Engine + Docker (Hosted on **Railway**)
- **Database**: Supabase PostgreSQL + Transaction Connection Pooler
- **Cache**: Redis Cloud (optional)
- **Code Execution**: Multi-Language Sandboxed Execution Engine via Go `os/exec` (fully containerized with pre-installed runtimes)

---

## 💎 Features

### 🛠️ Ultra-Premium Collaborative Suite
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

---

## ⚙️ Production Hardening & Optimizations

To ensure zero-downtime scalability and flawless real-time performance, CollabCode has been heavily optimized for cloud deployment:

### 🔌 Vercel WebSocket Bypass
*   **Problem**: Vercel's Serverless Edge and API Gateway layers filter out standard WebSocket handshake headers, returning `426 Upgrade Required`.
*   **Solution**: The stateful Go WebSocket hub was decoupled and containerized via **Docker** to run on a persistent **Railway** instance. This enables continuous TCP upgrades, secure persistent sessions, and flawless message broadcasting.

### 🔋 Supabase PgBouncer Simple Protocol
*   **Problem**: PostgreSQL connection poolers (like PgBouncer / Supabase Pooler on transaction port `6543`) do not support prepared statements, throwing protocol errors when using dynamic parameter binding.
*   **Solution**: Programmatically configured `pgx.QueryExecModeSimpleProtocol` in the Go database layer (`postgres.go`), ensuring safe and stable queries even under high concurrent load on the connection pooler port.

### 🔗 Secure Protocol Cross-Origin Handshakes
*   **Problem**: Mixed content blockages on the browser side when calling cross-origin backend systems.
*   **Solution**: Built-in automated CORS negotiation using environment variables. The frontend dynamically resolves secure protocols (`https://` for REST API, and `wss://` for secure WebSockets) while gracefully falling back to same-origin matching for local developer sandboxes.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Go 1.22+
- Node.js 20+
- A free [Supabase](https://supabase.com) project
- (Optional) A free [Redis Cloud](https://redis.io/try-free/) instance

### 1. Setup Database
1. Create a Supabase project.
2. Open the SQL Editor in your Supabase dashboard.
3. Copy and run the contents of [schema.sql](file:///c:/Users/visha/OneDrive/Desktop/Project/scripts/schema.sql) to set up all tables.

### 2. Configure Local Environment
```bash
# In the project root
cp .env.example .env
```

Edit your backend `.env` file:
```env
PORT=8080
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-secret-key-at-least-32-chars-long
FRONTEND_URL=http://localhost:3000
```

### 3. Run Locally
#### Start Go Backend
```bash
cd backend
go mod tidy
go run ./cmd/server
```
*API will run on `http://localhost:8080`*

#### Start Next.js Frontend
```bash
cd frontend
# Create frontend env variables for dev
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8080" >> .env.local

npm install
npm run dev
```
*Frontend will run on `http://localhost:3000`*

---

## 🚢 Production Deployment Setup

### 1. Backend → Railway (Dockerized Go Service)
1. Push your code to GitHub.
2. Create a new service on **Railway** connected to your repository.
3. Set the root directory of the build to `backend`.
4. Railway will automatically detect the `Dockerfile` in `backend` and build the containerized service.
5. In Railway **Settings**, scroll to **Networking** and click **Generate Domain** to get your public domain (e.g., `https://collabcode-production.up.railway.app`).
6. Set the following environment variables on Railway:
   * `DATABASE_URL`: Your Supabase pooler connection string (Port `6543`).
   * `JWT_SECRET`: A secure random secret string.
   * `FRONTEND_URL`: Your live Vercel domain (e.g., `https://collab-code-mocha.vercel.app`).
   * `ENV`: `production`

### 2. Frontend → Vercel (Next.js Application)
1. Import your project repository in **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Add the following **Environment Variables** (replacing the example domain with your actual Railway domain):
   * `NEXT_PUBLIC_API_URL` ➡️ `https://collabcode-production.up.railway.app` (No trailing slash)
   * `NEXT_PUBLIC_WS_URL` ➡️ `wss://collabcode-production.up.railway.app` (No trailing slash)
4. Click **Deploy**. Vercel will build and host your premium frontend experience globally.

---

## 📂 Project Structure

```
collabcode/
├── backend/
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── auth/                   # JWT auth + handlers
│   │   ├── chat/                   # Chat persistence
│   │   ├── config/                 # Environment config
│   │   ├── db/                     # PostgreSQL + Redis
│   │   ├── execution/              # Sandbox os/exec runtimes integration
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

---

## 📊 API & Endpoint Reference

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |

### Room Management
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms` | Create room |
## License

MIT
