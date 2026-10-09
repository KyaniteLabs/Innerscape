# Innerscape

> Innerscape is a personal growth OS — journaling, emotional check-ins, habits and goals, body/sleep logs, and a PARA-style hub — built as a TypeScript suite (Fastify backend + Expo mobile app).

**TL;DR:** Innerscape — self-hosted personal growth OS for self-awareness, productivity, and well-being. Best for people who want journaling, reflection, habits, and reviews in one app they control. Keywords: personal growth OS, journaling app, self-hosted well-being.

Personal growth OS — self-awareness, productivity, and well-being in one unified TypeScript suite.

## Stack

| Layer | Tech |
|-------|------|
| **Backend** | Fastify 5, Prisma 7, PostgreSQL, JWT (jose), Zod |
| **Mobile** | Expo SDK 56, React Native, TanStack Query v5, Expo Router |
| **Shared** | TypeScript types across backend + mobile |
| **Deploy** | Docker Compose, Traefik, Let's Encrypt TLS |

## Quick Start

### Prerequisites

- Node.js 22+ recommended (root `engines` allows >=20)
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
npm test                # integration tests
npx tsc --noEmit        # Zero errors
```

## Agent Surfaces

Innerscape exposes three local agent surfaces for project and reflective workflow support:

- CLI: `npm run cli -- brief`, `npm run cli -- modules`, or `npm run cli -- plan --focus "weekly review" --energy low`.
- MCP: `npm run mcp` starts a stdio MCP server with tools for the project brief, module map, and bounded planning prompts.
- Skill: [`skills/innerscape/SKILL.md`](skills/innerscape/SKILL.md) tells compatible agents how to use Innerscape without overstepping into diagnosis or major life automation.

Example MCP config from an installed checkout:

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

## Repository Structure

```
apps/
  backend/          Fastify API — 72 endpoints
    src/
      routes/       auth, emotional, journal, flow, body, hub, declutter, trade
      services/     auth, insights, vision-analysis
      middleware/    JWT auth
    tests/
      integration/  8 test files
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

---

## Part of KyaniteLabs

More from [KyaniteLabs](https://kyanitelabs.tech). Related projects:

- **[Elixis](https://github.com/KyaniteLabs/Elixis)** — local-first AI pattern-synthesis engine for ideas
- **[openglaze](https://github.com/KyaniteLabs/openglaze)** — free ceramic glaze calculator (UMF)
- **[tastecheck](https://github.com/KyaniteLabs/tastecheck)** — frontend taste and ship-gate toolkit for AI coding agents

→ More at **[kyanitelabs.tech](https://kyanitelabs.tech)**

<!-- s-plus-geo:start -->

## What is Innerscape?

**Innerscape** is a **personal growth OS** — self-awareness, productivity, and well-being in one TypeScript suite: a Fastify/Prisma backend and an Expo mobile app with Mind, Flow, Body, and Hub tabs.

| | |
| --- | --- |
| **Product** | Innerscape |
| **Category** | personal growth OS (journaling, habits, body, and reflection app) |
| **Best for** | people who want journaling, reflection, habits, goals, and reviews in one self-hosted app |
| **Not** | a clinical therapy product or medical diagnosis tool |
| **Source** | [GitHub](https://github.com/KyaniteLabs/Innerscape) · [Forgejo](https://git.kyanitelabs.tech/KyaniteLabs/Innerscape) (private, maintainers only) |
| **Keywords** | personal growth OS, journaling app, habit tracker, self-hosted well-being, PARA hub |

## Who it's for

- Primary: people who want journaling, reflection, habits, goals, and reviews in one self-hosted app
- Use when you need to track mood, journal, build habits, and run daily/weekly reviews in one place you control
- Skip if you need a clinical therapy product or medical diagnosis tool

## FAQ

### What is Innerscape?

**Innerscape** is a **personal growth OS** — self-awareness, productivity, and well-being in one TypeScript suite: a Fastify/Prisma backend and an Expo mobile app with Mind, Flow, Body, and Hub tabs.

### Who should use Innerscape?

People who want journaling, reflection, habits, goals, and reviews in one self-hosted app.

### How is Innerscape different?

Unlike single-purpose journaling or habit apps, Innerscape combines reflection, habits, body logs, and a knowledge hub in one self-hostable stack; it is positioned as personal tooling, not clinical software.

### Is Innerscape production software?

Treat the README status and release tags as source of truth for maturity. Validate against your own requirements before production use.

## Status

- Maintained as of 2026 on the default branch
- Prefer release tags when pinning dependencies
- Report issues on [GitHub](https://github.com/KyaniteLabs/Innerscape/issues)

## Agent surface

- Coding agents: read this README first, then repo docs/`AGENTS.md` if present
- Prefer machine-readable briefs (`llms.txt`) when the repo ships one
- MCP or skill entrypoints are documented in-repo when applicable

## Contributing

Issues and PRs welcome on [GitHub](https://github.com/KyaniteLabs/Innerscape). Keep public docs free of secrets and machine-local paths.

## License

See [LICENSE](LICENSE) in this repository (or package metadata if license is package-only).

<!-- s-plus-geo:end -->
