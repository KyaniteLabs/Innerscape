# LifeOS Shared

Shared TypeScript types, Zod schemas, and utilities for all LifeOS applications.

## Overview

This package provides type-safe contracts between all TypeScript apps in the LifeOS suite:
- Second Brain Web (Next.js)
- Second Brain Mobile (React Native)
- Habit Tracker (React Native)
- Cloud Backend (Hono)

## Structure

```
lifeos-shared/
├── src/
│   ├── types/
│   │   ├── index.ts         # Re-exports
│   │   ├── feelings.ts      # Feelings APP types
│   │   ├── brain.ts         # Second Brain types
│   │   ├── habits.ts        # Habit Tracker types
│   │   ├── insights.ts      # Cross-app insight types
│   │   └── sync.ts          # Sync metadata types
│   ├── schemas/
│   │   ├── index.ts         # Re-exports
│   │   ├── feelings.ts      # Zod schemas for feelings
│   │   ├── brain.ts         # Zod schemas for brain
│   │   ├── habits.ts        # Zod schemas for habits
│   │   └── api.ts           # API request/response schemas
│   └── utils/
│       ├── index.ts         # Re-exports
│       ├── dates.ts         # Date utilities
│       ├── ids.ts           # ID generation
│       └── validation.ts    # Common validators
└── package.json
```

## Usage

```typescript
// Import types
import type { CheckIn, Project, Habit } from '@lifeos/shared';

// Import schemas for validation
import { checkInSchema, projectSchema } from '@lifeos/shared/schemas';

// Import utilities
import { generateId, formatRelativeDate } from '@lifeos/shared/utils';
```

## Building

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## Linking Locally

For development, link this package to consuming apps:

```bash
# In lifeos-shared
npm link

# In consuming app (e.g., lifeos-backend)
npm link @lifeos/shared
```

---

> This folder structure will be populated during Phase 0 of the LifeOS Suite implementation.
