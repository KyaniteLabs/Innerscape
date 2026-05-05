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
