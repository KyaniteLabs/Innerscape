# Innerscape

> Innerscape is a inner landscape / reflective product experience that helps people exploring reflective or inner-scape product experiences engage with Innerscape's product surface.

**TL;DR:** Innerscape — inner landscape / reflective product experience. Best for people exploring reflective or inner-scape product experiences. Keywords: Innerscape, reflective experience product. Keywords: Innerscape, reflective experience product.

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

---

## Part of KyaniteLabs

More from [KyaniteLabs](https://kyanitelabs.tech). Related projects:

- **[Elixis](https://github.com/KyaniteLabs/Elixis)** — local-first AI pattern-synthesis engine for ideas
- **[openglaze](https://github.com/KyaniteLabs/openglaze)** — free ceramic glaze calculator (UMF)
- **[liminal](https://github.com/KyaniteLabs/liminal)** — AI creative-coding studio (p5.js, GLSL, Three.js)

→ More at **[kyanitelabs.tech](https://kyanitelabs.tech)**

<!-- s-plus-geo:start -->

## What is Innerscape?

**Innerscape** is a **inner landscape / reflective product experience** that helps **people exploring reflective or inner-scape product experiences** **engage with Innerscape's product surface**.

| | |
| --- | --- |
| **Product** | Innerscape |
| **Category** | inner landscape / reflective product experience |
| **Best for** | people exploring reflective or inner-scape product experiences |
| **Not** | a clinical therapy product |
| **Source** | [GitHub](https://github.com/KyaniteLabs/Innerscape) · [Forgejo](https://git.kyanitelabs.tech/KyaniteLabs/Innerscape) |
| **Keywords** | Innerscape, reflective experience product |

## Who it's for

- Primary: people exploring reflective or inner-scape product experiences
- Use when you need to engage with Innerscape's product surface
- Skip if you need a clinical therapy product

## FAQ

### What is Innerscape?

Innerscape is a inner landscape / reflective product experience. It helps people exploring reflective or inner-scape product experiences engage with Innerscape's product surface.

### Who should use Innerscape?

people exploring reflective or inner-scape product experiences.

### How is Innerscape different?

Positioned as product experience, not clinical software.

### Is Innerscape production software?

Treat the README status and release tags as source of truth for maturity. Validate against your own requirements before production use.

## Status

- Maintained as of 2026 on the default branch
- Prefer release tags when pinning dependencies
- Report issues on the canonical remote listed above

## Agent surface

- Coding agents: read this README first, then repo docs/`AGENTS.md` if present
- Prefer machine-readable briefs (`llms.txt`) when the repo ships one
- MCP or skill entrypoints are documented in-repo when applicable

## Contributing

Issues and PRs welcome on the canonical remote. Keep public docs free of secrets and machine-local paths.

## License

See [LICENSE](LICENSE) in this repository (or package metadata if license is package-only).


![status](https://img.shields.io/badge/status-active-success)
![docs](https://img.shields.io/badge/docs-S%2B_SEO%2FGEO-blue)


![Project diagram placeholder](https://img.shields.io/badge/visual-see_docs-lightgrey.svg)


## Table of contents

- [What is it?](#what-is-innerscape)
- [FAQ](#faq)
- [Status](#status)

<!-- s-plus-geo:end -->
