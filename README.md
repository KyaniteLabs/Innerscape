# Innerscape Suite

A cohesive 100% TypeScript suite for self-awareness, productivity, and health.

## Repository Structure

- `innerscape-mobile/`: Unified React Native (Expo) app for Mind, Flow, Body (Somatic/Pulse), and Hub.
- `Second Brain Project/`: Next.js Web Shell for deep analysis, goals, and brain management.
- `lifeos-backend/`: Hono + Cloudflare Workers API.
- `lifeos-design-system/`: Style Dictionary based tokens for consistent UI.
- `lifeos-shared/`: Shared TypeScript types, hooks, and components.
- `_archived/`: Deprecated projects (including the original standalone Soma app).

## Core Architecture

- **Auth**: Clerk (Unified across all apps)
- **Database**: Turso (libSQL)
- **Sync**: PowerSync (Local-first with cloud sync)
- **Shell**: 
  - **Mobile**: Unified App with 4-tab structure (Mind, Flow, Body, Hub).
  - **Web**: Next.js App Shell with full feature parity.

## Quick Start

### 1. Initial Setup
Run from the root directory:
```bash
npm run install:all
```

### 2. Design System & Shared Library
```bash
npm run build:ds
npm run build:shared
```

### 3. Backend
Setup `.env` in `lifeos-backend/` then:
```bash
npm run build:backend
```

### 4. Mobile App
```bash
cd innerscape-mobile
npm start
```

### 5. Web App
Setup `.env` in `Second Brain Project/` then:
```bash
npm run dev:web
```

## APEX Compliance

This project follows the **APEX Engineering Rules**:
- **Contract-First**: All core functions documented with inputs/outputs/errors.
- **Identity**: Clerk unified authentication.
- **Context-First**: Emotional context shared via Zustand and synced data.
- **Quality Gates**: Mandatory TypeScript and build verification.
