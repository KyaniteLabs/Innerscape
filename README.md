# Innerscape Suite

A cohesive 100% TypeScript suite for self-awareness, productivity, and health.

## Repository Structure

- `innerscape-soma/`: React Native (Expo) app for somatic check-ins and emotional awareness.
- `innerscape-mobile/`: React Native (Expo) app for Mind (capture), Flow (habits), and Pulse (health).
- `Second Brain Project/`: Next.js Web Shell (Module Federation host) for deep analysis, goals, and brain management.
- `lifeos-backend/`: Hono + Cloudflare Workers API.
- `lifeos-design-system/`: Style Dictionary based tokens for consistent UI.
- `lifeos-shared/`: Shared TypeScript types, hooks, and components.

## Core Architecture

- **Auth**: Clerk (Unified across all apps)
- **Database**: Turso (libSQL)
- **Sync**: PowerSync (Local-first with cloud sync)
- **Shell**: 
  - **Mobile**: Universal Header + Deep Linking + iOS App Groups.
  - **Web**: Next.js Module Federation.

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

### 4. Mobile Apps
```bash
# Soma
npm run dev:soma

# Innerscape Mobile
npm run dev:mobile
```

### 5. Web App
Setup `.env` in `Second Brain Project/` then:
```bash
npm run dev:web
```

> **Note**: The Web App uses Webpack (via `next dev --webpack`) to support advanced shell features. Turbopack is currently disabled.

## APEX Compliance

This project follows the **APEX Engineering Rules**:
- **Contract-First**: All core functions documented with inputs/outputs/errors.
- **Identity**: Clerk unified authentication.
- **Context-First**: Emotional context shared via iOS App Groups and Web Shell.
- **Quality Gates**: Mandatory TypeScript and build verification.
