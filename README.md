# Innerscape

**A personal growth operating system built in TypeScript** — combining journaling, emotional check-ins, habit tracking, goals, tasks, sleep logging, decluttering, and self-awareness workflows into one unified suite.

Innerscape is designed for anyone who wants a structured, privacy-conscious space to track their inner life and outer productivity. It ships as a Fastify REST backend, an Expo/React Native mobile app, and local CLI + MCP agent surfaces — all sharing a single TypeScript codebase.

---

## What Is This?

Innerscape is an open-source, self-hosted personal growth platform. It brings together modules that traditionally live in separate apps — mood tracking, journaling, habit streaks, goal setting, sleep analysis, and even a decluttering workflow — under one roof. The backend exposes a documented REST API; the mobile app consumes it across five tabs (Home, Mind, Flow, Body, Hub). Local agent integrations via CLI and MCP let AI assistants interact with your Innerscape data for reflective prompts and planning support.

If you've ever wished Notion, Daylio, and Habitica could talk to each other — and that you owned the data — Innerscape is for you.

---

## Features

| Category | Capabilities |
|----------|-------------|
| **Journaling** | Rich-text journal entries with AI-generated insights and emotional context |
| **Emotional Check-ins** | Track mood, energy, and context over time; view trends and patterns |
| **Habits** | Daily habit tracking with streak counters and a dopamine menu for quick wins |
| **Goals & Tasks** | Goal setting with progress tracking; task management tied to goals |
| **Sleep Logging** | Record sleep duration, quality, and notes; visualize patterns |
| **Somatic Mapping** | Body-awareness check-ins to connect physical sensations with emotional states |
| **Space Scanning** | Log your physical environment and its effect on well-being |
| **Decluttering** | Guided sessions for evaluating possessions with valuation and decision tracking |
| **Capture Inbox** | Quick-capture ideas, thoughts, and tasks before they slip away |
| **Projects (PARA)** | Organize life into Projects, Areas, Resources, and Archives |
| **Knowledge Base** | Store and reference personal knowledge and notes |
| **Reviews** | Structured daily and weekly review workflows |
| **Trade Marketplace** | List items, match with others, manage credits and rules |
| **AI Insights** | Backend-powered insight generation from your journal and check-in data |
| **Agent Surfaces** | CLI, MCP server, and Skill file for AI-assisted planning and reflection |
| **Type Safety** | End-to-end TypeScript with shared types between backend and mobile |

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Fastify 5, Prisma 6, PostgreSQL, JWT ([jose](https://github.com/panva/jose)), Zod |
| **Mobile** | Expo SDK 56, React Native, TanStack Query v5, Expo Router |
| **Shared** | TypeScript types across backend + mobile |
| **Deploy** | Docker Compose, Nginx, Let's Encrypt TLS |
| **Testing** | Vitest (143 integration tests), TypeScript strict mode |

---

## Installation

### Prerequisites

- **Node.js** >= 20.0.0
- **PostgreSQL** 16+
- **Expo CLI** (for mobile development)

### Clone and Bootstrap

```bash
git clone https://github.com/KyaniteLabs/Innerscape.git
cd Innerscape
npm ci
```

This is an npm workspaces monorepo. Running `npm ci` at the root installs dependencies for all packages.

---

## Quick Start

### Backend

```bash
cd apps/backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string
# Generate a JWT secret: openssl rand -base64 32

npx prisma migrate dev
npm run dev
```

The API server starts on `http://localhost:3001`.

### Mobile

```bash
cd apps/mobile
npx expo start
```

Scan the QR code with Expo Go or run in a simulator.

### Docker Compose

For a full deployment with PostgreSQL, backend, and Nginx:

```bash
export POSTGRES_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"
docker compose up -d
```

The compose file intentionally refuses to boot with placeholder production secrets.

### Build All Packages

```bash
npm run build
```

### Run Tests

```bash
npm test                # All workspace tests
cd apps/backend
npm test                # 143 integration tests
npx tsc --noEmit        # Type-check with zero errors
```

---

## Usage

### Mobile App

Innerscape's mobile app has five tabs:

| Tab | What You'll Find |
|-----|-----------------|
| **Home** | Dashboard with daily summary and quick actions |
| **Mind** | Journal entries, emotional check-ins, AI-generated insights |
| **Flow** | Habits with streak tracking, goals, tasks, dopamine menu |
| **Body** | Sleep logs, somatic mapping, space scanning |
| **Hub** | Capture inbox, PARA projects, knowledge base, reviews, trade marketplace |

### CLI Agent Surface

The CLI provides project briefs, module maps, and bounded planning prompts:

```bash
# Get a project brief
npm run cli -- brief

# View the module map
npm run cli -- modules

# Generate a plan based on focus and energy level
npm run cli -- plan --focus "weekly review" --energy low
```

### MCP Agent Surface

Start a Model Context Protocol (MCP) server for AI assistant integration:

```bash
npm run mcp
```

This launches a stdio MCP server exposing tools for the project brief, module map, and bounded planning.

Example configuration for an MCP-compatible client:

```json
{
  "mcpServers": {
    "innerscape": {
      "command": "npm",
      "args": ["run", "mcp", "--prefix", "/path/to/Innerscape"]
    }
  }
}
```

### Skill File

The file [`skills/innerscape/SKILL.md`](skills/innerscape/SKILL.md) tells compatible AI agents how to use Innerscape responsibly — without overstepping into diagnosis or major life automation. Point your agent at it for context-aware reflective support.

### API Overview

The backend exposes 72 REST endpoints across these domains:

| Domain | Endpoints |
|--------|-----------|
| **Auth** | Register, login, user preferences |
| **Emotional** | Check-ins, context tracking |
| **Journal** | CRUD entries, insights CRUD, insight generation |
| **Flow** | Habits, goals, tasks, dopamine menu |
| **Body** | Sleep logs, somatic mappings, space scanning |
| **Hub** | Capture, projects, knowledge, daily/weekly reviews |
| **Trade** | Listings, matches, credits, rules |
| **Declutter** | Sessions, items, valuations, decisions |

All endpoints require JWT authentication (obtained via `/auth/login` or `/auth/register`).

---

## Repository Structure

```
apps/
  backend/              Fastify API — 72 endpoints
    src/
      routes/           auth, emotional, journal, flow, body, hub, declutter, trade
      services/         auth, insights, vision-analysis
      middleware/        JWT auth
    tests/
      integration/      9 test files, 143 tests
  mobile/               Expo app — 5 tabs (Home, Mind, Flow, Body, Hub)
    hooks/              16 data hooks (TanStack Query)
    components/         12 UI components
packages/
  shared/               Shared TypeScript types used by both backend and mobile
tools/
  innerscape-cli.mjs    CLI agent surface
  innerscape-mcp.mjs    MCP server agent surface
skills/
  innerscape/           SKILL.md for AI agent integration
docs/
  plans/                Planning documents
  agent-law/            Agent usage guidelines
  factory/              Factory patterns
```

---

## FAQ

### Is Innerscape a replacement for therapy or medical advice?

No. Innerscape is a personal productivity and self-awareness tool. It can help you track patterns and reflect, but it is not a substitute for professional mental health care. The agent surfaces are explicitly designed to avoid overstepping into diagnosis or clinical guidance.

### Can I self-host Innerscape?

Yes. Innerscape is designed for self-hosting. Use Docker Compose for a production deployment with PostgreSQL, the backend API, and Nginx reverse proxy. You control your data entirely.

### What does the AI insight generation do?

The backend can analyze your journal entries and emotional check-in data to surface patterns, trends, and reflective prompts. It does not make predictions or clinical assessments — it helps you notice your own data more clearly.

### Do I need the mobile app to use Innerscape?

No. The backend is a standalone REST API. You can use the CLI, MCP server, or interact with the API directly. The mobile app is a polished frontend, but the data layer works independently.

### How is my data stored?

All data lives in your own PostgreSQL database. There is no cloud service or third-party data sharing. JWTs are used for authentication, and you manage your own secrets.

### What's the MCP server for?

The MCP (Model Context Protocol) server lets AI assistants like Claude, Cursor, or other MCP-compatible tools query your Innerscape project brief, module map, and planning data locally. It runs as a stdio process and never sends data to external services.

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Key guidelines:
- All TypeScript, all the time — maintain strict type safety.
- Run `npm test` and `npx tsc --noEmit` before submitting.
- Follow the existing code style (ESLint + Prettier configs are in the repo).
- Open an issue first for large changes to discuss the approach.

---

## License

[MIT](LICENSE) — [KyaniteLabs](https://kyanitelabs.tech)

---

## Part of KyaniteLabs

More from [KyaniteLabs](https://kyanitelabs.tech). Related projects:

- **[Elixis](https://github.com/KyaniteLabs/Elixis)** — local-first AI pattern-synthesis engine for ideas
- **[openglaze](https://github.com/KyaniteLabs/openglaze)** — free ceramic glaze calculator (UMF)
- **[liminal](https://github.com/KyaniteLabs/liminal)** — AI creative-coding studio (p5.js, GLSL, Three.js)

→ More at **[kyanitelabs.tech](https://kyanitelabs.tech)**