# Innerscape

## Project
Executive prosthetic for neurodivergent users (ADHD, autism, AuDHD). Not a productivity app — a cognitive environment that replaces degraded executive functions. Clean-slate rebuild (May 2026).

## Architecture
Monorepo with npm workspaces:
- `apps/mobile` — React Native + Expo Router (mobile-first)
- `apps/backend` — Fastify + Prisma + PostgreSQL
- `packages/shared` — TypeScript types shared across all packages
- `openspec/` — Spec documents (proposal, design, tasks)
- `_archived/` — Old codebases (reference only, never import from here)

## Key Commands
- `npm run dev:backend` — Start backend with hot reload
- `npm run dev:mobile` — Start Expo dev server
- `npm run build:shared` — Compile shared types
- `npm run typecheck` — Typecheck all workspaces
- `docker compose up -d` — PostgreSQL + Redis for local dev

## Stack
Mobile: React Native, Expo Router, Zustand, TanStack Query, WatermelonDB, NativeWind
Backend: Fastify, Prisma, PostgreSQL, Redis/BullMQ
AI: Hybrid (on-device classification + cloud LLM for insights/chat)

## Core Concept
Emotional Context System — real-time state tracking (energy + valence) that adapts the entire UI. This is the differentiator. Every feature must integrate with it.

## Rules
This project follows KyaniteLabs engineering standards.

### Git and PR Hygiene
- Commits tell *why*, not *what*
- PRs under 400 lines
- Rebase, don't merge on feature branches
- Never skip CI

### Git Workspace Hygiene
Agents must leave the repository in the same clean state they found it. No exceptions.

- **Delete feature branches** after merge — whether you merged via PR or locally. A merged branch that still exists is a failure.
- **Remove worktrees** when done. If you created a git worktree for isolated work, remove it when the work is complete or abandoned. No orphaned worktrees.
- **Clean up stale references** — prune remote-tracking branches that no longer exist upstream (`git remote prune origin`).
- **No abandoned work left behind** — if you started a branch, pushed it, and then the task was cancelled or superseded, delete the branch. Dead branches accumulate and confuse everyone.
- **Local branches stay current** — regularly rebase local tracking branches against their upstream. If a local branch has diverged and is no longer needed, delete it.
- **Worktree state matches intent** — if you're done with a task, the working directory should be clean (`git status` shows nothing). Staged changes, untracked files, and modified files from abandoned work are not acceptable.

The rule is simple: finish your work, merge or discard it, clean up every artifact you created. The main branch is the only permanent artifact. Everything else is temporary and must be treated as such.

### Security Non-Negotiables
- No `shell=True` with user input
- No hardcoded secrets/tokens/API keys
- Validate file paths (no path traversal)
- Use HTTPS for external calls

### Testing
- Test behavior, not implementation
- Test the unhappy path
- One assertion per concept

### Code Quality
- No orphaned code — every function called, every file imported
- No commented-out code blocks
- Pin exact dependency versions

## Epoch Data Tracking

Every project must use Epoch (KyaniteLabs/Epoch) for time estimation and actively feed it data. Epoch only becomes useful when it has real estimate-vs-actual data from real projects.

### What This Means
- **Before starting a task**, get a time estimate from Epoch (via MCP, REST API at `localhost:3099`, or CLI)
- **After completing a task**, record the actual time spent using `record_actual` or `POST /v1/feedback/record-actual`
- **Include context** — task type, complexity, tools used, anything that helps the model learn
- **Batch submissions are fine** — use `batch_record_actuals` for multiple estimates at once

### Integration
- MCP: add `@puenteworks/epoch` to your project's `.mcp.json`
- REST API: `epoch serve --port 3099`
- CLI: `npx @puenteworks/epoch pert-estimate ...`

### Why This Is Non-Negotiable
Epoch's accuracy improves with data. Without estimate-vs-actual feedback from real projects, it's just a calculator with uncalibrated assumptions. Every project that uses Epoch and reports back makes every other project's estimates better. This is a collective intelligence system — it only works if everyone contributes.
