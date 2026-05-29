# Innerscape

Personal growth OS — self-awareness, productivity, and well-being in one unified TypeScript suite.

## Stack

| Layer | Tech |
|-------|------|
| **Backend** | Fastify 5, Prisma 6, PostgreSQL, JWT (jose), Zod |
| **Mobile** | Expo SDK 53, React Native, TanStack Query v5, Expo Router |
| **Shared** | TypeScript types across backend + mobile |
| **Deploy** | Docker Compose, Traefik, Let's Encrypt TLS |

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Expo CLI

### Backend

```bash
cd apps/backend
cp .env.example .env    # Edit with your DB connection
# Generate a local JWT secret: openssl rand -base64 32
npm ci
npx prisma migrate dev
npm run dev
```

For Docker Compose deployments, set `POSTGRES_PASSWORD` and `JWT_SECRET` in the deployment environment before starting the stack; the compose file intentionally refuses to boot with placeholder production secrets.

### Mobile

```bash
cd apps/mobile
npm ci
npx expo start
```

### Run Tests

```bash
cd apps/backend
npm test                # 143 integration tests
npx tsc --noEmit        # Zero errors
```

## Repository Structure

```
apps/
  backend/          Fastify API — 72 endpoints
    src/
      routes/       auth, emotional, journal, flow, body, hub, declutter, trade
      services/     auth, insights, vision-analysis
      middleware/    JWT auth
    tests/
      integration/  9 test files, 143 tests
  mobile/           Expo app — 5 tabs (Home, Mind, Flow, Body, Hub)
    hooks/          16 data hooks (TanStack Query)
    components/     12 UI components
packages/
  shared/           Shared TypeScript types
```

## Modules

| Tab | Features |
|-----|----------|
| **Mind** | Journal entries, emotional check-ins, AI insights |
| **Flow** | Habits (streaks), goals, tasks, dopamine menu |
| **Body** | Sleep logs, somatic mapping, space scanning |
| **Hub** | Capture inbox, projects (PARA), knowledge base, reviews, trade marketplace |

## API

- Auth: register, login, user preferences
- Emotional: check-ins, context tracking
- Journal: CRUD entries, insights CRUD, insight generation
- Flow: habits, goals, tasks, dopamine menu
- Body: sleep logs, somatic mappings, space scanning
- Hub: capture, projects, knowledge, daily/weekly reviews
- Trade: listings, matches, credits, rules
- Declutter: sessions, items, valuations, decisions

## License

MIT — KyaniteLabs
