# Innerscape

## Project
Executive prosthetic for neurodivergent users (ADHD, autism, AuDHD). Not a productivity app — a cognitive environment that replaces degraded executive functions.

## Architecture
Monorepo with npm workspaces:
- `apps/mobile` — React Native + Expo Router (mobile-first, web export)
- `apps/backend` — Fastify 5 + Prisma 6 + PostgreSQL
- `packages/shared` — TypeScript types shared across all packages

## Key Commands
- `cd apps/backend && npm run dev` — Start backend with hot reload
- `cd apps/backend && npm test` — Run 143 integration tests
- `cd apps/backend && npx tsc --noEmit` — Type-check backend
- `cd apps/mobile && npx expo start` — Start Expo dev server
- `cd apps/mobile && npx tsc --noEmit` — Type-check mobile

## Stack
Mobile: React Native, Expo SDK 53, Expo Router, TanStack Query v5, Zustand
Backend: Fastify 5, Prisma 6, PostgreSQL, JWT (jose), Zod validation
Deploy: Docker Compose, Traefik reverse proxy, Let's Encrypt TLS

## Workflow
All changes via GitHub Issues + Pull Requests to `KyaniteLabs/Innerscape`.
Branch protection: PRs required for main, 1 approval, admin bypass enabled.

## Core Concept
Emotional Context System — real-time state tracking (energy + valence) that adapts the entire UI. This is the differentiator. Every feature must integrate with it.

## Rules
This project follows KyaniteLabs engineering standards.
- TypeScript strict mode everywhere
- Zod validation on all POST endpoints
- Tests required for new routes
- No `any` types in production code

<!-- EMPOWER_ORCHESTRATOR:START -->
## Empower the Orchestrator

This repository is governed by the Empower Orchestrator law. Every top-level/orchestrator Claude Code session is an audition to improve the system, not only finish the current task.

When you notice a repeatable task done 3+ times or a recurring agent failure mode, consider shipping the smallest durable artifact that prevents the repetition: a tool, skill, slash command, hook, guardrail, memory entry, test, verifier, or doctrine doc.

This applies to top-level/orchestrator sessions. Background workers execute their assigned slice and do not independently widen scope.

Before dispatching automation or creating a durable system change, state the four-question blast-radius check in chat:

1. Scale: one file/workspace/all sessions?
2. Severity: minor friction/broken workflow/data loss or leaked content?
3. Reversibility: single revert/manual cleanup/surgery?
4. Predictability: bounded failure mode/guessing/unknown?

All green permits auto mode. Any yellow requires inline human approval. Any red means do not dispatch; do the work inline or escalate.

Worker discipline: isolated worktree/sandbox, one artifact equals one commit/change unit, verify before commit, register through the target tool's native discovery surface, and never write outside the assigned scope.

Success line: “I noticed X, found a better way. The system just got an upgrade.”

Full recipe: `docs/agent-law/empower-orchestrator.md`.
<!-- EMPOWER_ORCHESTRATOR:END -->
