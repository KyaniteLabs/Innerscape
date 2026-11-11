# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The README and AGENTS.md MCP config now launches `node tools/innerscape-mcp.mjs` directly. The old `npm run mcp` launch printed npm's banner on stdout, which broke the JSON-RPC stream for MCP clients.
- The `innerscape` and `innerscape-mcp` bins now run when npm links them as symlinks, and importing the MCP module no longer starts reading stdin.
- New dependency-free tests (`npm run test:tools`) cover the CLI commands and the MCP server, including a subprocess run of the documented launch that requires pure JSON-RPC on stdout. Both CIs run them.
- The Hermes plugin now reads and saves only from local surfaces (CLI, TUI, Desktop, ACP). Webhooks, the API server, kanban workers and turns that name no surface used to pass the chat-platform gate; they now need `allow_reads_on_gateway` or `allow_writes_on_gateway` like Telegram or Discord.
- `/innerscape today` shows the latest check-in in your local time and says when it is not from today, instead of presenting an older check-in as today's in "server time".
- `/innerscape status` now asks the server whether it accepts the token (`/api/v1/user/me`), keeping only the yes or no.
- A token that Hermes refuses to hand to the plugin (for example an unscoped secret) is now a clear error instead of a crash.

### Added

- Hermes plugin v0.4.0 lets the agent drive the Desktop page: confirmed saves emit bounded local events that refresh today's data, and `innerscape_show` opens and focuses the Today, Check in, Journal or Unstuck Coach section. Older REST reads are cancelled before event refreshes, event and view inputs are validated, and the skills and status output explain the person's pane-enable step.
- Hermes plugin `plugins/innerscape-hermes` (v0.1.0): `innerscape_checkin`, `innerscape_journal` and `innerscape_today` tools, an `/innerscape` command and a bundled skill with the Innerscape guardrails. It calls your own server's REST API with `INNERSCAPE_TOKEN`, refuses plain http to other machines, follows no redirects, needs a user yes before saving a journal entry, keeps saving off on chat platforms by default, and never scores or labels a mood.
- CI job `ci/hermes-plugin` runs the plugin tests.
- Hermes plugin v0.3.0 merges in the Unstuck Coach: the `unstuck` skill (one next move, hold the rest, no diagnosis, crisis stop with 988), an `innerscape_capture` tool and `/innerscape capture` that park an item in the Innerscape inbox only after a yes, and a Get unstuck card on the Desktop page that opens a new chat with the note drafted and unsent, plus a palette action that jumps to the card.

## [0.1.0] - 2025-05-09

### Added

- Expo mobile app with React Native + Expo Router
- Fastify 5 backend with Prisma 6 and PostgreSQL
- Emotional Context System — real-time state tracking (energy + valence)
- Somatic check-in, journal, habit, goal, task, and sleep-log routes
- Declutter and Trade bounded contexts with type-safe routes
- Trade Marketplace UI with full backend API integration
- Space routes wired to mobile, replacing legacy DeclutterSpaces
- Zod validation on all POST endpoints
- JWT authentication (jose)
- Docker Compose deployment with Traefik reverse proxy and Let's Encrypt TLS
- 143 integration tests across all route groups
- GitHub Actions CI (lint + test + build)
- Issue templates (bug report, feature request)
- FUNDING.yml for GitHub Sponsors and Ko-fi

### Changed

- Migrated Declutter bounded contexts into Innerscape monorepo
- Refactored Declutter/Trade routes for type safety
- Upgraded dependencies, resolved critical fast-jwt vulnerability

### Removed

- Unused Redis from Docker Compose and env example
- Stale planning files, obsolete setup script, and legacy _archived code
