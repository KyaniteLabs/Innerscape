# LifeOS Backend

Cloud backend for the LifeOS suite, built with Hono on Cloudflare Workers.

## Features

- **API Server**: RESTful API for all LifeOS apps
- **Sync Engine**: PowerSync server for real-time data synchronization
- **AI Services**: Classification, chat, and insight generation
- **Authentication**: Clerk integration for secure auth

## Structure

```
lifeos-backend/
├── src/
│   ├── index.ts           # Main entry point
│   ├── routes/
│   │   ├── feelings.ts    # Emotional context endpoints
│   │   ├── brain.ts       # Second Brain CRUD
│   │   ├── habits.ts      # Habit tracker endpoints
│   │   ├── insights.ts    # Cross-app insights
│   │   └── ai.ts          # AI classification & chat
│   ├── sync/              # PowerSync server
│   ├── ai/                # AI service implementations
│   └── auth/              # Clerk middleware
├── drizzle/               # Database migrations
├── wrangler.toml          # Cloudflare Workers config
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Environment Variables

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
CLERK_SECRET_KEY=...
GLM_API_KEY=...
POWERSYNC_URL=...
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Turso (libSQL)
- **ORM**: Drizzle
- **Auth**: Clerk
- **Sync**: PowerSync

---

> This folder structure will be populated during Phase 0-1 of the LifeOS Suite implementation.
