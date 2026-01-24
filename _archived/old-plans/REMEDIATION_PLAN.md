# Innerscape Suite — Comprehensive Remediation Plan

> **Version**: 3.0.0 | **Date**: January 24, 2026  
> **Status**: READY FOR IMPLEMENTATION  
> **Audience**: Coding Agent / Developer

---

## Document Purpose

This document provides **unambiguous, step-by-step instructions** for completing the Innerscape Suite. Every task includes:
- Exact file paths
- Complete code snippets (no placeholders)
- Acceptance criteria
- Dependencies between tasks

**A coding agent following this document should never need clarification.**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [App Shell Strategy](#2-app-shell-strategy)
3. [Design System Completion](#3-design-system-completion)
4. [Backend Remediation](#4-backend-remediation)
5. [Mobile App Remediation](#5-mobile-app-remediation)
6. [Web App Remediation](#6-web-app-remediation)
7. [Flutter App Remediation](#7-flutter-app-remediation)
8. [Cross-App Integration](#8-cross-app-integration)
9. [Task Execution Order](#9-task-execution-order)

---

## 1. Architecture Overview

### 1.1 Final App Structure (No Ambiguity)

```
INNERSCAPE SUITE
├── Innerscape Soma (Flutter)     → Body check-ins, 3D wheel
├── Innerscape Mobile (React Native) → Mind, Flow, Pulse, Hub tabs
├── Innerscape Hub (Next.js)      → Web dashboard, goals, analytics
└── Widgets (Native)              → iOS WidgetKit, Android Glance
```

### 1.2 Technology Stack (Locked)

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| Soma | Flutter | 3.10+ | Existing, enhance |
| Mobile | React Native + Expo | SDK 52 | New |
| Web | Next.js | 14.x | Existing, enhance |
| Backend | Hono + Cloudflare Workers | Hono 4.x | New |
| Database | Turso (libSQL) | Latest | New |
| Sync | PowerSync | 1.x | New |
| Auth | Clerk | Latest | New |
| Design Tokens | Style Dictionary | 3.9+ | Existing, enhance |

### 1.3 Repository Map

```
/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/
├── Feelings APP/                    # Flutter → Innerscape Soma
├── Second Brain Project/            # Next.js → Innerscape Hub
├── innerscape-mobile/               # React Native → Innerscape Mobile
├── lifeos-backend/                  # Hono API
├── lifeos-design-system/            # Style Dictionary tokens
└── lifeos-shared/                   # Shared TypeScript types
```

---

## 2. App Shell Strategy

### 2.1 Overview

To achieve Adobe-like suite cohesion, implement a **Light Shell** approach (Phase 1) with potential for **Medium Shell** (Phase 2).

### 2.2 Light Shell Implementation (Required)

The Light Shell creates visual cohesion through shared design elements without code sharing between frameworks.

#### 2.2.1 Shared Visual Elements

| Element | Specification | Applies To |
|---------|---------------|------------|
| **App Accent Colors** | Each app has a unique accent | All apps |
| **Shared Typography** | Satoshi (body), Outfit (headings) | All apps |
| **Unified Icons** | Lucide icon set | All apps |
| **Splash Animation** | Lottie with Innerscape logo | All mobile apps |
| **App Icon Style** | Rounded square, gradient, inner symbol | All mobile apps |

#### 2.2.2 App-Specific Accent Colors

Add to `/lifeos-design-system/tokens/colors.json`:

```json
{
  "color": {
    "app": {
      "soma": { 
        "value": "#8B5CF6", 
        "comment": "Purple - body/somatic focus" 
      },
      "mind": { 
        "value": "#4F46E5", 
        "comment": "Indigo - thought/capture" 
      },
      "flow": { 
        "value": "#F59E0B", 
        "comment": "Amber - energy/habits" 
      },
      "pulse": { 
        "value": "#22C55E", 
        "comment": "Green - health/vitality" 
      },
      "hub": { 
        "value": "#3B82F6", 
        "comment": "Blue - dashboard/overview" 
      }
    }
  }
}
```

#### 2.2.3 Deep Linking URL Scheme

All apps must register and handle:

```
innerscape://soma/check-in          # Open Soma, start check-in
innerscape://soma/patterns          # Open Soma patterns screen
innerscape://mind/capture           # Open Mobile, capture modal
innerscape://mind/inbox             # Open Mobile, Mind tab inbox
innerscape://flow/habits            # Open Mobile, Flow tab
innerscape://pulse/sleep            # Open Mobile, Pulse tab sleep
innerscape://hub/insights           # Open Mobile, Hub tab insights

# Web fallback (universal links)
https://app.innerscape.app/hub      # Open web dashboard
https://app.innerscape.app/goals    # Open web goals
```

### 2.3 Medium Shell Implementation (Future Phase)

After Light Shell is complete, optionally add:

1. **Universal Header Component** - Shared navigation header
2. **iOS App Groups** - Native cross-app data sharing
3. **Unified Onboarding** - Single flow introducing all suite apps

---

## 3. Design System Completion

### 3.1 Current State

The design system exists at `/lifeos-design-system/` with:
- ✅ `tokens/colors.json` - Complete
- ✅ `tokens/typography.json` - Complete (Satoshi + Outfit)
- ✅ `tokens/spacing.json` - Complete (includes animations)
- ✅ `config.json` - Outputs to SCSS, JS, Flutter
- ❌ Missing: App accent colors
- ❌ Missing: Component specifications
- ❌ Missing: Icon library
- ❌ Missing: Motion specifications

### 3.2 Tasks

#### Task DS-1: Add App Accent Colors

**File**: `/lifeos-design-system/tokens/colors.json`

**Action**: Add the following to the existing `color` object:

```json
"app": {
  "soma": { "value": "#8B5CF6", "comment": "Purple - body/somatic" },
  "mind": { "value": "#4F46E5", "comment": "Indigo - thought/capture" },
  "flow": { "value": "#F59E0B", "comment": "Amber - energy/habits" },
  "pulse": { "value": "#22C55E", "comment": "Green - health/vitality" },
  "hub": { "value": "#3B82F6", "comment": "Blue - dashboard/overview" }
}
```

**Acceptance Criteria**:
- [ ] `npm run build` succeeds
- [ ] `build/flutter/style_dictionary.dart` contains `appSoma`, `appMind`, etc.
- [ ] `build/js/tokens.js` contains `color.app.soma`, etc.
- [ ] `build/scss/_variables.scss` contains `$color-app-soma`, etc.

---

#### Task DS-2: Add Motion Tokens

**File**: `/lifeos-design-system/tokens/motion.json` (NEW FILE)

**Content**:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "lifeos-design-tokens-motion",
  "motion": {
    "duration": {
      "instant": { "value": "0ms" },
      "fast": { "value": "150ms" },
      "normal": { "value": "300ms" },
      "slow": { "value": "500ms" },
      "slower": { "value": "700ms" }
    },
    "easing": {
      "default": { "value": "cubic-bezier(0.4, 0, 0.2, 1)" },
      "easeIn": { "value": "cubic-bezier(0.4, 0, 1, 1)" },
      "easeOut": { "value": "cubic-bezier(0, 0, 0.2, 1)" },
      "easeInOut": { "value": "cubic-bezier(0.4, 0, 0.2, 1)" },
      "bounce": { "value": "cubic-bezier(0.68, -0.55, 0.265, 1.55)" },
      "spring": { "value": "cubic-bezier(0.175, 0.885, 0.32, 1.275)" }
    },
    "scale": {
      "pressed": { "value": "0.96" },
      "hover": { "value": "1.02" }
    }
  }
}
```

**Acceptance Criteria**:
- [ ] File exists at specified path
- [ ] `npm run build` succeeds
- [ ] Motion tokens appear in all output formats

---

#### Task DS-3: Add Component Specifications

**File**: `/lifeos-design-system/tokens/components.json` (NEW FILE)

**Content**:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "lifeos-design-tokens-components",
  "component": {
    "button": {
      "primary": {
        "background": { "value": "{color.brand.primary}" },
        "text": { "value": "{color.text.light.inverse}" },
        "borderRadius": { "value": "{radius.lg}" },
        "paddingX": { "value": "{spacing.4}" },
        "paddingY": { "value": "{spacing.3}" },
        "fontSize": { "value": "{font.size.base}" },
        "fontWeight": { "value": "{font.weight.semibold}" }
      },
      "secondary": {
        "background": { "value": "transparent" },
        "text": { "value": "{color.brand.primary}" },
        "border": { "value": "1px solid {color.brand.primary}" },
        "borderRadius": { "value": "{radius.lg}" },
        "paddingX": { "value": "{spacing.4}" },
        "paddingY": { "value": "{spacing.3}" }
      },
      "ghost": {
        "background": { "value": "transparent" },
        "text": { "value": "{color.text.light.primary}" },
        "borderRadius": { "value": "{radius.lg}" },
        "paddingX": { "value": "{spacing.3}" },
        "paddingY": { "value": "{spacing.2}" }
      }
    },
    "card": {
      "background": { "value": "{color.surface.light.card}" },
      "borderRadius": { "value": "{radius.xl}" },
      "padding": { "value": "{spacing.4}" },
      "shadow": { "value": "{shadow.md}" }
    },
    "input": {
      "background": { "value": "{color.surface.light.background}" },
      "border": { "value": "1px solid {color.surface.light.border}" },
      "borderRadius": { "value": "{radius.lg}" },
      "padding": { "value": "{spacing.3}" },
      "fontSize": { "value": "{font.size.base}" },
      "focusBorder": { "value": "2px solid {color.brand.primary}" }
    },
    "header": {
      "height": { "value": "56px" },
      "background": { "value": "{color.surface.light.card}" },
      "borderBottom": { "value": "1px solid {color.surface.light.border}" },
      "paddingX": { "value": "{spacing.4}" }
    },
    "tabBar": {
      "height": { "value": "64px" },
      "background": { "value": "{color.surface.light.card}" },
      "activeColor": { "value": "{color.brand.primary}" },
      "inactiveColor": { "value": "{color.text.light.muted}" },
      "iconSize": { "value": "24px" },
      "labelSize": { "value": "{font.size.xs}" }
    }
  }
}
```

**Acceptance Criteria**:
- [ ] File exists at specified path
- [ ] `npm run build` succeeds
- [ ] Component tokens resolve references correctly

---

#### Task DS-4: Update Style Dictionary Config

**File**: `/lifeos-design-system/config.json`

**Replace entire file with**:

```json
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "scss": {
      "transformGroup": "scss",
      "buildPath": "build/scss/",
      "files": [
        {
          "destination": "_variables.scss",
          "format": "scss/variables"
        }
      ]
    },
    "javascript": {
      "transformGroup": "js",
      "buildPath": "build/js/",
      "files": [
        {
          "destination": "tokens.js",
          "format": "javascript/module"
        },
        {
          "destination": "tokens.d.ts",
          "format": "typescript/module-declarations"
        }
      ]
    },
    "flutter": {
      "transformGroup": "flutter",
      "buildPath": "build/flutter/",
      "files": [
        {
          "destination": "innerscape_design.dart",
          "format": "flutter/class.dart",
          "className": "InnerscapeDesign"
        }
      ]
    },
    "css": {
      "transformGroup": "css",
      "buildPath": "build/css/",
      "files": [
        {
          "destination": "variables.css",
          "format": "css/variables"
        }
      ]
    }
  }
}
```

**Acceptance Criteria**:
- [ ] `npm run build` generates all 4 output formats
- [ ] TypeScript declarations file exists
- [ ] CSS variables file exists

---

#### Task DS-5: Rebuild Design System

**Command**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/lifeos-design-system"
npm run build
```

**Acceptance Criteria**:
- [ ] `build/scss/_variables.scss` exists and contains app colors
- [ ] `build/js/tokens.js` exists and exports all tokens
- [ ] `build/js/tokens.d.ts` exists with TypeScript types
- [ ] `build/flutter/innerscape_design.dart` exists with InnerscapeDesign class
- [ ] `build/css/variables.css` exists with CSS custom properties

---

## 4. Backend Remediation

### 4.1 Current State

**Path**: `/lifeos-backend/`

**Issues Identified**:
1. ❌ Missing `updatedAt` on some tables
2. ❌ Missing `insights` route implementation
3. ❌ Missing Drizzle config file
4. ❌ Incomplete error handling in some routes
5. ❌ Missing rate limiting
6. ⚠️ TypeScript errors in some route files

### 4.2 Tasks

#### Task BE-1: Add Drizzle Config

**File**: `/lifeos-backend/drizzle.config.ts` (NEW FILE)

**Content**:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
```

**Acceptance Criteria**:
- [ ] File exists
- [ ] `npx drizzle-kit generate` runs without error (may need credentials)

---

#### Task BE-2: Fix Schema - Add Missing Fields

**File**: `/lifeos-backend/src/db/schema.ts`

**Find and replace** the `captures` table definition:

```typescript
export const captures = sqliteTable('captures', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull().default('inbox'),
  status: text('status').notNull().default('active'),
  linkedProjectId: text('linked_project_id'),
  linkedPersonId: text('linked_person_id'),
  aiClassification: text('ai_classification'),
  aiConfidence: real('ai_confidence'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

**Add** the `activities` table (for Hub activity feed):

```typescript
export const activities = sqliteTable('activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  activityType: text('activity_type').notNull(), // 'capture' | 'check_in' | 'habit' | 'journal' | 'goal'
  entityId: text('entity_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  metadata: text('metadata'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

**Acceptance Criteria**:
- [ ] `captures` table has `updatedAt` field
- [ ] `activities` table is defined
- [ ] `npx tsc --noEmit` passes

---

#### Task BE-3: Implement Insights Route

**File**: `/lifeos-backend/src/routes/insights.ts`

**Replace entire file with**:

```typescript
/**
 * @fileoverview Insights API routes
 * @module routes/insights
 * 
 * APEX Contract:
 * - Input: userId from auth context
 * - Output: ApiResponse<Insight[]> or ApiResponse<Insight>
 * - Errors: 401 Unauthorized, 500 Internal Server Error
 */

import { Hono } from 'hono';
import { eq, desc, and, gte } from 'drizzle-orm';
import { insights } from '../db/schema';
import type { HonoEnv, ApiResponse } from '../types';

const insightsRoute = new Hono<HonoEnv>();

// GET /api/insights - Get all insights for user
insightsRoute.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const limit = parseInt(c.req.query('limit') || '20');
    const dismissed = c.req.query('dismissed') === 'true';

    const result = await db
      .select()
      .from(insights)
      .where(
        and(
          eq(insights.userId, userId),
          dismissed ? undefined : eq(insights.dismissed, false)
        )
      )
      .orderBy(desc(insights.createdAt))
      .limit(limit);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    return c.json(response);
  } catch (error) {
    console.error('[APEX] Error fetching insights:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch insights',
      },
    };
    return c.json(response, 500);
  }
});

// GET /api/insights/:id - Get single insight
insightsRoute.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');

    const [result] = await db
      .select()
      .from(insights)
      .where(and(eq(insights.id, id), eq(insights.userId, userId)))
      .limit(1);

    if (!result) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Insight not found',
        },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    return c.json(response);
  } catch (error) {
    console.error('[APEX] Error fetching insight:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch insight',
      },
    };
    return c.json(response, 500);
  }
});

// POST /api/insights/:id/dismiss - Dismiss an insight
insightsRoute.post('/:id/dismiss', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');

    await db
      .update(insights)
      .set({ dismissed: true, updatedAt: new Date() })
      .where(and(eq(insights.id, id), eq(insights.userId, userId)));

    const response: ApiResponse<{ dismissed: boolean }> = {
      success: true,
      data: { dismissed: true },
    };
    return c.json(response);
  } catch (error) {
    console.error('[APEX] Error dismissing insight:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to dismiss insight',
      },
    };
    return c.json(response, 500);
  }
});

// POST /api/insights/:id/action - Mark action taken on insight
insightsRoute.post('/:id/action', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');

    await db
      .update(insights)
      .set({ actionTaken: true, updatedAt: new Date() })
      .where(and(eq(insights.id, id), eq(insights.userId, userId)));

    const response: ApiResponse<{ actionTaken: boolean }> = {
      success: true,
      data: { actionTaken: true },
    };
    return c.json(response);
  } catch (error) {
    console.error('[APEX] Error marking action:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark action',
      },
    };
    return c.json(response, 500);
  }
});

// POST /api/insights/generate - Trigger insight generation (admin/cron)
insightsRoute.post('/generate', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');

    // TODO: Implement AI-based insight generation
    // For now, return a placeholder
    const response: ApiResponse<{ queued: boolean }> = {
      success: true,
      data: { queued: true },
    };
    return c.json(response);
  } catch (error) {
    console.error('[APEX] Error generating insights:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate insights',
      },
    };
    return c.json(response, 500);
  }
});

export default insightsRoute;
```

**Acceptance Criteria**:
- [ ] File compiles without TypeScript errors
- [ ] All 5 endpoints are implemented
- [ ] APEX logging format used (`[APEX]` prefix)

---

#### Task BE-4: Add Insights Schema

**File**: `/lifeos-backend/src/db/schema.ts`

**Add** the `insights` table:

```typescript
export const insights = sqliteTable('insights', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  insightType: text('insight_type').notNull(), // 'correlation' | 'pattern' | 'suggestion' | 'warning'
  title: text('title').notNull(),
  content: text('content').notNull(),
  sourceApps: text('source_apps'), // JSON array: ['soma', 'mind', 'flow', 'pulse']
  confidence: real('confidence'),
  dataPoints: integer('data_points'),
  timeframeDays: integer('timeframe_days'),
  actionTaken: integer('action_taken', { mode: 'boolean' }).default(false),
  dismissed: integer('dismissed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

**Acceptance Criteria**:
- [ ] Table definition compiles
- [ ] All fields match the route expectations

---

#### Task BE-5: Fix Activities Route Import

**File**: `/lifeos-backend/src/index.ts`

**Find and replace** the activities import:

```typescript
// Change this:
import activities from './routes/activities';

// To this (if file is in routes/routes/):
import activitiesRoute from './routes/activities';
// Then use: app.route('/api/activities', activitiesRoute);
```

**OR create the file if missing**:

**File**: `/lifeos-backend/src/routes/activities.ts` (if not exists)

```typescript
/**
 * @fileoverview Activities API routes
 * @module routes/activities
 * 
 * APEX Contract:
 * - Input: userId from auth context, optional limit/offset
 * - Output: ApiResponse<Activity[]>
 * - Errors: 401 Unauthorized, 500 Internal Server Error
 */

import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { activities } from '../db/schema';
import type { HonoEnv, ApiResponse } from '../types';

const activitiesRoute = new Hono<HonoEnv>();

// GET /api/activities - Get activity feed
activitiesRoute.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    return c.json(response);
  } catch (error) {
    console.error('[APEX] Error fetching activities:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch activities',
      },
    };
    return c.json(response, 500);
  }
});

export default activitiesRoute;
```

**Acceptance Criteria**:
- [ ] File exists at `/lifeos-backend/src/routes/activities.ts`
- [ ] Import in `index.ts` resolves correctly
- [ ] `npx tsc --noEmit` passes

---

#### Task BE-6: Add Rate Limiting Middleware

**File**: `/lifeos-backend/src/middleware/rate-limit.ts` (NEW FILE)

```typescript
/**
 * @fileoverview Rate limiting middleware
 * @module middleware/rate-limit
 * 
 * APEX Contract:
 * - Limits: 100 requests per minute per user
 * - Returns: 429 Too Many Requests when exceeded
 */

import { Context, Next } from 'hono';

// Simple in-memory rate limiter (for Cloudflare Workers, use KV in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

export const rateLimit = async (c: Context, next: Next) => {
  const userId = c.get('userId') as string | undefined;
  const key = userId || c.req.header('cf-connecting-ip') || 'anonymous';
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  if (record.count >= MAX_REQUESTS) {
    return c.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      },
      429
    );
  }

  record.count++;
  await next();
};
```

**Acceptance Criteria**:
- [ ] File exists
- [ ] Compiles without errors

---

#### Task BE-7: Run TypeScript Check

**Command**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/lifeos-backend"
npx tsc --noEmit
```

**Acceptance Criteria**:
- [ ] Command exits with code 0
- [ ] No TypeScript errors

---

## 5. Mobile App Remediation

### 5.1 Current State

**Path**: `/innerscape-mobile/`

**Issues Identified**:
1. ❌ Stub screens have placeholder content only
2. ❌ Missing API client implementation
3. ❌ Voice recorder exists but not integrated
4. ❌ Health service is a stub
5. ❌ No deep linking configuration
6. ⚠️ Some JSX syntax errors in stub files

### 5.2 Tasks

#### Task MB-1: Fix JSX Syntax Errors

**Files to check and fix**:
- `/app/(tabs)/mind/projects.tsx`
- `/app/(tabs)/mind/people.tsx`
- `/app/(tabs)/mind/ideas.tsx`
- `/app/(tabs)/flow/routines.tsx`
- `/app/(tabs)/flow/streaks.tsx`
- `/app/(tabs)/pulse/sleep.tsx`
- `/app/(tabs)/pulse/trends.tsx`
- `/app/(tabs)/hub/insights.tsx`

**Pattern to fix**: Ensure all `<View>` tags are properly closed.

**Example fix** (apply to all files with this issue):

```typescript
// WRONG:
export default function ScreenName() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold">Title</Text>
      {/* Missing closing </View> */}
      <Text>Content here</Text>
    </View>
  );
}

// CORRECT:
export default function ScreenName() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold">Title</Text>
      </View>
      <Text className="p-4">Content here</Text>
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] All 8 files compile without JSX errors
- [ ] `npx tsc --noEmit` passes

---

#### Task MB-2: Implement API Client

**File**: `/innerscape-mobile/lib/api/client.ts`

**Replace entire file with**:

```typescript
/**
 * @fileoverview API client for Innerscape Mobile
 * @module lib/api/client
 * 
 * APEX Contract:
 * - Input: Clerk auth token, API path, optional body
 * - Output: JSON response data
 * - Errors: Throws Error with message from API
 */

import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8787';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const useApiClient = () => {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = await getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE}/api${path}`;
    console.log(`[APEX] API ${options.method || 'GET'} ${path}`);

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      console.error(`[APEX] API Error: ${json.error?.message}`);
      throw new Error(json.error?.message || 'API request failed');
    }

    return json.data as T;
  };

  return {
    get: <T>(path: string) => fetchWithAuth<T>(path),
    post: <T>(path: string, body: unknown) =>
      fetchWithAuth<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    patch: <T>(path: string, body: unknown) =>
      fetchWithAuth<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: <T>(path: string) =>
      fetchWithAuth<T>(path, {
        method: 'DELETE',
      }),
  };
};

// Non-hook version for use outside React components
export const createApiClient = (token: string) => {
  const fetchWithAuth = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_BASE}/api${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new Error(json.error?.message || 'API request failed');
    }

    return json.data as T;
  };

  return {
    get: <T>(path: string) => fetchWithAuth<T>(path),
    post: <T>(path: string, body: unknown) =>
      fetchWithAuth<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    patch: <T>(path: string, body: unknown) =>
      fetchWithAuth<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: <T>(path: string) =>
      fetchWithAuth<T>(path, {
        method: 'DELETE',
      }),
  };
};
```

**Acceptance Criteria**:
- [ ] File compiles without errors
- [ ] Exports `useApiClient` hook and `createApiClient` function
- [ ] Includes APEX logging

---

#### Task MB-3: Configure Deep Linking

**File**: `/innerscape-mobile/app.json`

**Add/update** the following in the existing config:

```json
{
  "expo": {
    "scheme": "innerscape",
    "ios": {
      "bundleIdentifier": "app.innerscape.mobile",
      "associatedDomains": [
        "applinks:app.innerscape.app"
      ]
    },
    "android": {
      "package": "app.innerscape.mobile",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "app.innerscape.app",
              "pathPrefix": "/"
            },
            {
              "scheme": "innerscape"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Acceptance Criteria**:
- [ ] `scheme` is set to `innerscape`
- [ ] iOS `associatedDomains` configured
- [ ] Android `intentFilters` configured

---

#### Task MB-4: Implement Mind Tab Inbox

**File**: `/innerscape-mobile/app/(tabs)/mind/index.tsx`

**Replace entire file with**:

```typescript
/**
 * @fileoverview Mind Tab - Inbox and Capture
 * @module app/(tabs)/mind
 * 
 * APEX Contract:
 * - Displays: User's inbox items
 * - Actions: Create capture, process items
 * - Data: From /api/brain/inbox
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Send, ChevronRight } from 'lucide-react-native';
import { useApiClient } from '../../../lib/api/client';

interface Capture {
  id: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function MindTab() {
  const [captureText, setCaptureText] = useState('');
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Fetch inbox items
  const {
    data: captures,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['inbox'],
    queryFn: () => api.get<Capture[]>('/brain/inbox'),
  });

  // Create capture mutation
  const createCapture = useMutation({
    mutationFn: (content: string) =>
      api.post<Capture>('/brain/capture', { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      setCaptureText('');
    },
  });

  const handleSubmit = useCallback(() => {
    if (captureText.trim()) {
      createCapture.mutate(captureText.trim());
    }
  }, [captureText, createCapture]);

  const renderItem = useCallback(
    ({ item }: { item: Capture }) => (
      <TouchableOpacity
        className="bg-white dark:bg-gray-800 p-4 mb-2 rounded-xl flex-row items-center"
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <Text className="text-gray-900 dark:text-gray-100 text-base">
            {item.content}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {item.type} • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </TouchableOpacity>
    ),
    []
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="p-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Inbox
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          Capture what's on your mind
        </Text>
      </View>

      {/* Capture Input */}
      <View className="px-4 pb-4">
        <View className="bg-white dark:bg-gray-800 rounded-xl flex-row items-center p-2 shadow-sm">
          <TextInput
            className="flex-1 text-gray-900 dark:text-gray-100 text-base px-3 py-2"
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            value={captureText}
            onChangeText={setCaptureText}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity
            className="p-2 mr-1"
            onPress={() => {
              /* TODO: Voice recording */
            }}
          >
            <Mic size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            className={`p-2 rounded-lg ${
              captureText.trim() ? 'bg-indigo-500' : 'bg-gray-200'
            }`}
            onPress={handleSubmit}
            disabled={!captureText.trim() || createCapture.isPending}
          >
            {createCapture.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color={captureText.trim() ? '#fff' : '#9CA3AF'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Inbox List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={captures || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-gray-400 text-base">
                Your inbox is empty. Capture something!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] File compiles without errors
- [ ] Displays loading state
- [ ] Displays inbox items from API
- [ ] Capture input works
- [ ] Pull-to-refresh works

---

#### Task MB-5: Implement Flow Tab Habits

**File**: `/innerscape-mobile/app/(tabs)/flow/index.tsx`

**Replace entire file with**:

```typescript
/**
 * @fileoverview Flow Tab - Today's Habits
 * @module app/(tabs)/flow
 * 
 * APEX Contract:
 * - Displays: Today's habits with completion status
 * - Actions: Toggle habit completion
 * - Data: From /api/habits/today
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Flame } from 'lucide-react-native';
import { useApiClient } from '../../../lib/api/client';

interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  streakCurrent: number;
  completedToday: boolean;
}

export default function FlowTab() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Fetch today's habits
  const {
    data: habits,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['habits', 'today'],
    queryFn: () => api.get<Habit[]>('/habits/today'),
  });

  // Toggle completion mutation
  const toggleCompletion = useMutation({
    mutationFn: async (habit: Habit) => {
      if (habit.completedToday) {
        return api.delete(`/habits/${habit.id}/complete`);
      } else {
        return api.post(`/habits/${habit.id}/complete`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const renderHabit = useCallback(
    ({ item }: { item: Habit }) => (
      <TouchableOpacity
        className={`bg-white dark:bg-gray-800 p-4 mb-3 rounded-xl flex-row items-center ${
          item.completedToday ? 'border-2 border-green-500' : ''
        }`}
        activeOpacity={0.7}
        onPress={() => toggleCompletion.mutate(item)}
      >
        {/* Checkbox */}
        <View
          className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${
            item.completedToday ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          {item.completedToday && <Check size={20} color="#fff" />}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`text-base font-medium ${
              item.completedToday
                ? 'text-gray-400 line-through'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {item.name}
          </Text>
          {item.description && (
            <Text className="text-gray-500 text-sm mt-1">
              {item.description}
            </Text>
          )}
        </View>

        {/* Streak */}
        {item.streakCurrent > 0 && (
          <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
            <Flame size={14} color="#F59E0B" />
            <Text className="text-amber-600 dark:text-amber-400 text-sm ml-1 font-medium">
              {item.streakCurrent}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [toggleCompletion]
  );

  // Group habits by category
  const groupedHabits = React.useMemo(() => {
    if (!habits) return [];
    
    const groups: { title: string; data: Habit[] }[] = [];
    const categories = [...new Set(habits.map((h) => h.category || 'Anytime'))];
    
    // Sort: Morning first, then others, then Evening
    const sortOrder = ['morning', 'anytime', 'evening'];
    categories.sort((a, b) => {
      const aIndex = sortOrder.indexOf(a.toLowerCase());
      const bIndex = sortOrder.indexOf(b.toLowerCase());
      return (aIndex === -1 ? 1 : aIndex) - (bIndex === -1 ? 1 : bIndex);
    });

    for (const category of categories) {
      groups.push({
        title: category.charAt(0).toUpperCase() + category.slice(1),
        data: habits.filter((h) => (h.category || 'Anytime') === category),
      });
    }

    return groups;
  }, [habits]);

  const completedCount = habits?.filter((h) => h.completedToday).length || 0;
  const totalCount = habits?.length || 0;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="p-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Today
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          {completedCount} of {totalCount} habits completed
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="px-4 pb-4">
        <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-green-500 rounded-full"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </View>
      </View>

      {/* Habits List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={groupedHabits}
          renderItem={({ item: group }) => (
            <View className="mb-4">
              <Text className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {group.title}
              </Text>
              {group.data.map((habit) => (
                <View key={habit.id} className="px-4">
                  {renderHabit({ item: habit })}
                </View>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.title}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-gray-400 text-base">
                No habits yet. Create one to get started!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] File compiles without errors
- [ ] Displays habits grouped by category
- [ ] Checkbox toggles completion
- [ ] Streak indicator shows
- [ ] Progress bar reflects completion

---

#### Task MB-6: Run TypeScript Check

**Command**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/innerscape-mobile"
npx tsc --noEmit
```

**Acceptance Criteria**:
- [ ] Command exits with code 0
- [ ] No TypeScript errors

---

## 6. Web App Remediation

### 6.1 Current State

**Path**: `/Second Brain Project/`

**Issues Identified**:
1. ❌ Hub page uses placeholder data
2. ❌ Goals page missing API integration
3. ❌ Analytics page missing real charts
4. ⚠️ Pre-existing TypeScript errors (legacy code)
5. ⚠️ Missing UI component library

### 6.2 Tasks

#### Task WB-1: Fix API Client Import

**File**: `/Second Brain Project/src/lib/api.ts`

**Ensure file contains**:

```typescript
/**
 * @fileoverview API client for Innerscape Hub (Web)
 * @module lib/api
 * 
 * APEX Contract:
 * - Uses Clerk for authentication
 * - Returns typed responses
 */

import { auth } from '@clerk/nextjs/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const api = {
  async get<T>(path: string): Promise<T | null> {
    try {
      const { getToken } = await auth();
      const token = await getToken();

      if (!token) {
        console.warn('[APEX] No auth token available');
        return null;
      }

      const res = await fetch(`${API_BASE}/api${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      const json: ApiResponse<T> = await res.json();

      if (!json.success) {
        console.error('[APEX] API Error:', json.error);
        return null;
      }

      return json.data ?? null;
    } catch (error) {
      console.error('[APEX] API fetch error:', error);
      return null;
    }
  },

  async post<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const { getToken } = await auth();
      const token = await getToken();

      if (!token) {
        return null;
      }

      const res = await fetch(`${API_BASE}/api${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json: ApiResponse<T> = await res.json();
      return json.success ? (json.data ?? null) : null;
    } catch (error) {
      console.error('[APEX] API post error:', error);
      return null;
    }
  },

  async patch<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const { getToken } = await auth();
      const token = await getToken();

      if (!token) {
        return null;
      }

      const res = await fetch(`${API_BASE}/api${path}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json: ApiResponse<T> = await res.json();
      return json.success ? (json.data ?? null) : null;
    } catch (error) {
      console.error('[APEX] API patch error:', error);
      return null;
    }
  },

  async delete<T>(path: string): Promise<boolean> {
    try {
      const { getToken } = await auth();
      const token = await getToken();

      if (!token) {
        return false;
      }

      const res = await fetch(`${API_BASE}/api${path}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json: ApiResponse<T> = await res.json();
      return json.success;
    } catch (error) {
      console.error('[APEX] API delete error:', error);
      return false;
    }
  },
};
```

**Acceptance Criteria**:
- [ ] File compiles
- [ ] Uses `@clerk/nextjs/server` for auth
- [ ] Includes APEX logging

---

#### Task WB-2: Fix Hub Page

**File**: `/Second Brain Project/src/app/hub/page.tsx`

**Replace entire file with**:

```typescript
/**
 * @fileoverview Hub Dashboard Page
 * @module app/hub/page
 * 
 * APEX Contract:
 * - Displays: Daily summary, insights, recent activity
 * - Data: Aggregated from all app sources
 */

import React from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';

interface Insight {
  id: string;
  insightType: string;
  title: string;
  content: string;
  confidence: number | null;
  createdAt: string;
}

interface Activity {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  createdAt: string;
}

interface DailySummary {
  emotionalContext: {
    energy: string;
    valence: string;
  } | null;
  habitsCompleted: number;
  habitsTotal: number;
  capturesCount: number;
  goalsProgress: number;
}

export default async function HubPage() {
  // Fetch data in parallel
  const [insights, activities, summary] = await Promise.all([
    api.get<Insight[]>('/insights?limit=5'),
    api.get<Activity[]>('/activities?limit=10'),
    api.get<DailySummary>('/hub/summary'),
  ]);

  const safeInsights = insights ?? [];
  const safeActivities = activities ?? [];
  const safeSummary = summary ?? {
    emotionalContext: null,
    habitsCompleted: 0,
    habitsTotal: 0,
    capturesCount: 0,
    goalsProgress: 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Hub
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Your day at a glance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Energy</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {safeSummary.emotionalContext?.energy ?? '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Habits</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {safeSummary.habitsCompleted}/{safeSummary.habitsTotal}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Captures</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {safeSummary.capturesCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Goals</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {safeSummary.goalsProgress}%
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Insights
          </h2>
          {safeInsights.length === 0 ? (
            <p className="text-gray-400">No insights yet</p>
          ) : (
            <div className="space-y-4">
              {safeInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="border-l-4 border-indigo-500 pl-4"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {insight.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {insight.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Activity
          </h2>
          {safeActivities.length === 0 ? (
            <p className="text-gray-400">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {safeActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0">
                    {new Date(activity.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div>
                    <span className="text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </span>
                    {activity.description && (
                      <p className="text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File compiles
- [ ] Uses API client with null-safe handling
- [ ] Displays real data from backend

---

#### Task WB-3: Create Card Component (if missing)

**File**: `/Second Brain Project/src/components/Card.tsx`

**Content** (if file doesn't exist):

```typescript
/**
 * @fileoverview Card component
 * @module components/Card
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File exists
- [ ] Exports `Card` component
- [ ] Supports dark mode

---

## 7. Flutter App Remediation

### 7.1 Current State

**Path**: `/Feelings APP/`

**Issues Identified**:
1. ⚠️ Import error in sync_service.dart (already fixed)
2. ❌ AI pattern service not fully implemented
3. ❌ Missing deep link handling
4. ⚠️ Auth service `getToken()` is a stub

### 7.2 Tasks

#### Task FL-1: Implement Auth Service getToken

**File**: `/Feelings APP/lib/domain/services/auth_service.dart`

**Find and replace** the `getToken` method:

```dart
/// Gets the current authentication token for API requests
/// 
/// APEX Contract:
/// - Returns: JWT token string or null if not authenticated
/// - Errors: Throws if Clerk SDK fails
Future<String?> getToken() async {
  try {
    // Using Clerk Flutter SDK
    final clerk = ClerkAuth.instance;
    final session = await clerk.session;
    
    if (session == null) {
      print('[APEX] No active session');
      return null;
    }
    
    final token = await session.getToken();
    return token;
  } catch (e) {
    print('[APEX] Error getting token: $e');
    return null;
  }
}
```

**Note**: If `ClerkAuth` is not available, use the stub implementation but mark as TODO:

```dart
/// Gets the current authentication token for API requests
/// 
/// TODO: Implement with actual Clerk SDK when available
Future<String?> getToken() async {
  print('[APEX] getToken called - returning stub token');
  // Stub: Return null for now, implement with Clerk
  return null;
}
```

**Acceptance Criteria**:
- [ ] Method exists and compiles
- [ ] Includes APEX logging

---

#### Task FL-2: Configure Deep Linking (iOS)

**File**: `/Feelings APP/ios/Runner/Info.plist`

**Add** inside the top-level `<dict>`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>innerscape</string>
    </array>
    <key>CFBundleURLName</key>
    <string>app.innerscape.soma</string>
  </dict>
</array>
<key>FlutterDeepLinkingEnabled</key>
<true/>
```

**Acceptance Criteria**:
- [ ] URL scheme `innerscape` is registered
- [ ] Deep linking is enabled

---

#### Task FL-3: Configure Deep Linking (Android)

**File**: `/Feelings APP/android/app/src/main/AndroidManifest.xml`

**Add** inside the `<activity>` tag:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="innerscape" />
    <data android:scheme="https" android:host="app.innerscape.app" android:pathPrefix="/soma" />
</intent-filter>
```

**Acceptance Criteria**:
- [ ] Intent filter is added
- [ ] Both `innerscape://` and `https://` schemes handled

---

#### Task FL-4: Run Flutter Analyze

**Command**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/Feelings APP"
flutter analyze
```

**Acceptance Criteria**:
- [ ] No errors (warnings acceptable)
- [ ] No "Target of URI doesn't exist" errors

---

## 8. Cross-App Integration

### 8.1 Shared Types Verification

**Path**: `/lifeos-shared/src/types/index.ts`

**Ensure file exports**:

```typescript
// Core entities
export interface User { ... }
export interface EmotionalContext { ... }
export interface Capture { ... }
export interface Habit { ... }
export interface HabitCompletion { ... }
export interface JournalEntry { ... }
export interface Goal { ... }
export interface Insight { ... }
export interface Activity { ... }
export interface SleepRecord { ... }
export interface HealthMetric { ... }

// API response wrapper
export interface ApiResponse<T> { ... }
export interface PaginatedResponse<T> { ... }
```

### 8.2 Brand Guidelines Document

**File**: `/lifeos-design-system/BRAND_GUIDELINES.md` (NEW FILE)

**Content**:

```markdown
# Innerscape Brand Guidelines

## Suite Identity

The Innerscape suite consists of multiple apps that share a unified visual identity.

## App-Specific Colors

| App | Hex | Usage |
|-----|-----|-------|
| Soma | #8B5CF6 | Body/somatic focus - purple evokes introspection |
| Mind | #4F46E5 | Thought/capture - indigo represents depth |
| Flow | #F59E0B | Energy/habits - amber conveys warmth and action |
| Pulse | #22C55E | Health/vitality - green symbolizes growth |
| Hub | #3B82F6 | Dashboard/overview - blue provides clarity |

## Typography

- **Headings**: Outfit (semibold/bold)
- **Body**: Satoshi (regular/medium)
- **Monospace**: JetBrains Mono (code, data)

## Iconography

Use Lucide icons throughout. Custom icons should match Lucide's 24px grid and 1.5px stroke width.

## Motion

- Entry animations: ease-out (0, 0, 0.2, 1)
- Exit animations: ease-in (0.4, 0, 1, 1)
- Duration: 150-300ms for micro-interactions

## Voice & Tone

- Warm and supportive
- Non-clinical
- Neurodiversity-affirming
- Direct (BLUF - Bottom Line Up Front)

## Deep Linking

All apps respond to `innerscape://` URL scheme:
- `innerscape://soma/...` - Soma app
- `innerscape://mind/...` - Mobile Mind tab
- `innerscape://flow/...` - Mobile Flow tab
- `innerscape://pulse/...` - Mobile Pulse tab
- `innerscape://hub/...` - Mobile Hub tab
```

**Acceptance Criteria**:
- [ ] File exists
- [ ] Documents all app colors
- [ ] Includes deep link scheme

---

## 9. Task Execution Order

### 9.1 Dependency Graph

```
DS-1 ──┐
DS-2 ──┼──▶ DS-4 ──▶ DS-5
DS-3 ──┘

BE-4 ──▶ BE-3 ──▶ BE-5 ──▶ BE-7
BE-2 ────────────────────────┘
BE-1 ────────────────────────┘
BE-6 ────────────────────────┘

MB-1 ──▶ MB-2 ──▶ MB-4 ──▶ MB-6
         MB-3 ──────┘
                    MB-5 ──┘

WB-1 ──▶ WB-2
WB-3 ────┘

FL-1 ──▶ FL-4
FL-2 ────┘
FL-3 ────┘
```

### 9.2 Execution Order (Optimal)

Execute in this order for minimal blocking:

**PHASE 0: GIT CONSOLIDATION (Do First)**

0. **Sequential** (Git - MUST DO FIRST):
   - GIT-1: Commit outstanding changes in nested repos
   - GIT-2: Remove nested .git directories
   - GIT-3: Create root .gitignore
   - GIT-4: Add all files to parent repo
   - GIT-5: (Optional) Configure remote

**PHASE 1: FOUNDATION**

1. **Parallel Group 1** (Design System):
   - DS-1, DS-2, DS-3 (can run in parallel)

2. **Sequential**: DS-4, DS-5

**PHASE 2: BACKEND**

3. **Parallel Group 2** (Backend Schema):
   - BE-1, BE-2, BE-4, BE-6 (can run in parallel)

4. **Sequential**: BE-3, BE-5, BE-7

**PHASE 3: CLIENTS**

5. **Parallel Group 3** (Mobile):
   - MB-1, MB-3 (can run in parallel)

6. **Sequential**: MB-2, MB-4, MB-5, MB-6

7. **Parallel Group 4** (Web + Flutter):
   - WB-1, WB-3 (can run in parallel)
   - FL-1, FL-2, FL-3 (can run in parallel)

8. **Sequential**: WB-2, FL-4

**PHASE 4: FINALIZATION**

9. **Final**: Create brand guidelines document

10. **Final Git Commit**:
    ```bash
    cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS"
    git add -A
    git commit -m "feat: complete remediation plan implementation"
    ```

### 9.3 Verification Checklist

After all tasks complete, verify:

- [ ] `npm run build` succeeds in `/lifeos-design-system/`
- [ ] `npx tsc --noEmit` succeeds in `/lifeos-backend/`
- [ ] `npx tsc --noEmit` succeeds in `/innerscape-mobile/`
- [ ] `flutter analyze` succeeds in `/Feelings APP/`
- [ ] All apps can be started without errors

---

## 10. Git Repository Consolidation

### 10.1 Current State (Conflicting)

```
/LifeOS/                          ← Has .git (parent, no remote)
├── Feelings APP/                 ← Has .git (GitHub remote)
├── Second Brain Project/         ← Has .git (no remote)
├── innerscape-mobile/            ← No .git (good)
├── lifeos-backend/               ← No .git (good)
├── lifeos-design-system/         ← No .git (good)
└── lifeos-shared/                ← No .git (good)
```

### 10.2 Resolution Options

#### Option A: Monorepo (RECOMMENDED)

Convert everything to a single repository. This is the standard approach for app suites.

**Pros:**
- Single source of truth
- Simplified CI/CD
- Easier cross-app changes
- Standard monorepo tooling works

**Cons:**
- Loses individual repo history (but Feelings APP history exists on GitHub)

#### Option B: Git Submodules

Keep nested repos as submodules of the parent.

**Pros:**
- Preserves individual histories
- Can push to separate remotes

**Cons:**
- Complex workflow
- Submodule state issues common
- Not recommended for tightly coupled code

### 10.3 Implementation: Monorepo Approach

Execute these tasks in order:

#### Task GIT-1: Commit Outstanding Changes in Nested Repos

**Purpose**: Preserve work before removing .git

**Commands** (Feelings APP):
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/Feelings APP"
git add -A
git commit -m "chore: preserve state before monorepo migration"
git push origin main  # Push to GitHub to preserve history
```

**Commands** (Second Brain Project):
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/Second Brain Project"
git add -A
git commit -m "chore: preserve state before monorepo migration"
# No remote to push to - history will be lost but content preserved
```

#### Task GIT-2: Remove Nested .git Directories

**WARNING**: This removes git history from nested repos. Ensure GIT-1 is complete first.

**Commands**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS"

# Remove nested .git directories
rm -rf "Feelings APP/.git"
rm -rf "Feelings APP/.github"
rm -rf "Second Brain Project/.git"

# Also remove any nested .git in Second Brain's subfolder
rm -rf "Second Brain Project/Second Brain/.git" 2>/dev/null || true
```

#### Task GIT-3: Create Root .gitignore

**File**: `/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/.gitignore`

**Content**:
```gitignore
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
.next/
out/
build/
dist/
*.js.map

# Flutter/Dart
.dart_tool/
.packages
.pub-cache/
.pub/
*.iml
*.ipr
*.iws
.idea/
*.lock
pubspec.lock

# iOS/Android
ios/Pods/
ios/.symlinks/
android/.gradle/
android/app/build/
*.apk
*.aab
*.ipa

# Environment
.env
.env.local
.env.*.local
*.env

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Turbo
.turbo/

# Vercel
.vercel/

# Local databases
*.db
*.sqlite
*.sqlite3
local.db

# Secrets (NEVER commit)
**/wrangler.toml
**/credentials.json
**/*.pem
**/*.key

# Build artifacts from design system
lifeos-design-system/build/

# Expo
.expo/
*.jks
*.p8
*.p12
*.mobileprovision
```

#### Task GIT-4: Add All Files to Parent Repo

**Commands**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS"

# Add all files
git add -A

# Check what will be committed
git status

# Commit
git commit -m "feat: consolidate LifeOS suite into monorepo

- Merge Feelings APP (Innerscape Soma) into monorepo
- Merge Second Brain Project (Innerscape Hub) into monorepo
- Add innerscape-mobile scaffolding
- Add lifeos-backend scaffolding
- Add lifeos-design-system with Style Dictionary
- Add lifeos-shared types package
- Add comprehensive REMEDIATION_PLAN.md

BREAKING CHANGE: Individual repos no longer exist as separate git repos.
Feelings APP history preserved at: https://github.com/Pastorsimon1798/Feelings-APP.git"
```

#### Task GIT-5: Configure Remote (Optional)

If you want to push to a new GitHub repo:

**Commands**:
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
git branch -M main
git push -u origin main
```

### 10.4 Verification

After completing GIT-1 through GIT-4:

```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS"

# Should show NO nested repos
find . -name ".git" -type d

# Should show clean status or only intentionally uncommitted files
git status

# Should show all packages in one repo
git ls-files | head -50
```

**Expected Output**:
- Only one `.git` directory at root
- All files from Feelings APP, Second Brain, etc. tracked
- No "untracked" folders for the app directories

### 10.5 Post-Migration Structure

```
/LifeOS/                          ← Single .git
├── .gitignore                    ← Comprehensive ignore rules
├── Feelings APP/                 ← Tracked (no nested .git)
├── Second Brain Project/         ← Tracked (no nested .git)
├── innerscape-mobile/            ← Tracked
├── lifeos-backend/               ← Tracked
├── lifeos-design-system/         ← Tracked
├── lifeos-shared/                ← Tracked
└── REMEDIATION_PLAN.md           ← Tracked
```

---

## Appendix A: File Path Reference

### Git Tasks

| Task | Action |
|------|--------|
| GIT-1 | Commit changes in `Feelings APP/` and `Second Brain Project/` |
| GIT-2 | Remove `Feelings APP/.git`, `Second Brain Project/.git` |
| GIT-3 | Create `/LifeOS/.gitignore` |
| GIT-4 | `git add -A && git commit` in parent repo |
| GIT-5 | `git remote add origin ...` (optional) |

### Implementation Tasks

| Task | File Path |
|------|-----------|
| DS-1 | `/lifeos-design-system/tokens/colors.json` |
| DS-2 | `/lifeos-design-system/tokens/motion.json` |
| DS-3 | `/lifeos-design-system/tokens/components.json` |
| DS-4 | `/lifeos-design-system/config.json` |
| BE-1 | `/lifeos-backend/drizzle.config.ts` |
| BE-2 | `/lifeos-backend/src/db/schema.ts` |
| BE-3 | `/lifeos-backend/src/routes/insights.ts` |
| BE-4 | `/lifeos-backend/src/db/schema.ts` |
| BE-5 | `/lifeos-backend/src/routes/activities.ts` |
| BE-6 | `/lifeos-backend/src/middleware/rate-limit.ts` |
| MB-1 | `/innerscape-mobile/app/(tabs)/mind/*.tsx` (multiple) |
| MB-2 | `/innerscape-mobile/lib/api/client.ts` |
| MB-3 | `/innerscape-mobile/app.json` |
| MB-4 | `/innerscape-mobile/app/(tabs)/mind/index.tsx` |
| MB-5 | `/innerscape-mobile/app/(tabs)/flow/index.tsx` |
| WB-1 | `/Second Brain Project/src/lib/api.ts` |
| WB-2 | `/Second Brain Project/src/app/hub/page.tsx` |
| WB-3 | `/Second Brain Project/src/components/Card.tsx` |
| FL-1 | `/Feelings APP/lib/domain/services/auth_service.dart` |
| FL-2 | `/Feelings APP/ios/Runner/Info.plist` |
| FL-3 | `/Feelings APP/android/app/src/main/AndroidManifest.xml` |

---

## Appendix B: Environment Variables

### Backend (`.env` / `wrangler.toml`)

```env
TURSO_CONNECTION_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
CLERK_SECRET_KEY=sk_live_xxx
DEEPGRAM_API_KEY=xxx
```

### Mobile (`app.json` extras or `.env`)

```env
EXPO_PUBLIC_API_URL=https://api.innerscape.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
```

### Web (`.env.local`)

```env
NEXT_PUBLIC_API_URL=https://api.innerscape.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

---

*End of Remediation Plan v3.0.0*
