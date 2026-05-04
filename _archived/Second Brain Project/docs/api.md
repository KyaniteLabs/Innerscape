# NeuroSecond API Documentation

This document describes all API endpoints available in the NeuroSecond application.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Capture](#capture)
  - [Chat](#chat)
  - [Projects](#projects)
  - [People](#people)
  - [Ideas](#ideas)
  - [Tasks](#tasks)
  - [Inbox](#inbox)
  - [Analytics](#analytics)
  - [Optimization](#optimization)
  - [Content](#content)
  - [Summaries](#summaries)
  - [Unified](#unified)
  - [Stats](#stats)
  - [Process](#process)

---

## Overview

The NeuroSecond API is a REST API built with Next.js App Router. All endpoints return JSON responses.

**Base URL**: `http://localhost:3000/api` (development)

**Content-Type**: `application/json`

---

## Authentication

> **Note**: Authentication is currently **deferred** for the local network single-user deployment.
> See [auth-implementation-plan.md](./auth-implementation-plan.md) for the planned authentication implementation when expanding to multi-user or public release.

Currently, all API routes use a single user ID configured via `NEXT_PUBLIC_USER_ID` environment variable.

---

## Error Handling

All API endpoints use a consistent error response format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { ... }  // Optional
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External API failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Capture

#### POST /api/capture

Capture a thought for classification and filing.

**Request Body**:

```json
{
  "text": "string (required)",
  "source": "web | voice | ios | slack (optional, default: web)"
}
```

**Response**:

```json
{
  "success": true,
  "id": "inbox-item-uuid",
  "status": "pending | filed | needs_review"
}
```

#### POST /api/capture/stream

Stream the capture process with Server-Sent Events (SSE).

**Request Body**: Same as POST /api/capture

**Response**: SSE stream with events:
- `thinking` - Agent reasoning
- `tool` - Tool being called
- `result` - Tool result
- `done` - Classification complete
- `error` - Error occurred

---

### Chat

#### POST /api/chat

Send a message to the AI assistant.

**Request Body**:

```json
{
  "messages": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

**Response**:

```json
{
  "message": {
    "role": "assistant",
    "content": "string"
  }
}
```

---

### Projects

#### GET /api/projects

List all projects for the current user.

**Query Parameters**:
- `status` (optional): Filter by status (`active`, `waiting`, `blocked`, `someday`, `completed`)

**Response**:

```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "status": "active",
      "nextAction": "string | null",
      "notes": "string | null",
      "tags": ["string"],
      "dueDate": "ISO date | null",
      "createdAt": "ISO date",
      "lastTouched": "ISO date"
    }
  ]
}
```

#### POST /api/projects

Create a new project.

**Request Body**:

```json
{
  "name": "string (required)",
  "status": "active | waiting | blocked | someday (optional)",
  "nextAction": "string (optional)",
  "notes": "string (optional)",
  "tags": ["string"] (optional),
  "dueDate": "ISO date (optional)",
  "startDate": "ISO date (optional)",
  "energyLevel": "number 1-5 (optional)"
}
```

#### PATCH /api/projects

Update a project.

**Request Body**:

```json
{
  "id": "uuid (required)",
  "name": "string (optional)",
  "status": "string (optional)",
  "nextAction": "string (optional)",
  "notes": "string (optional)",
  "tags": ["string"] (optional),
  "dueDate": "ISO date (optional)"
}
```

#### DELETE /api/projects?id={uuid}

Archive a project (soft delete).

---

### People

#### GET /api/people

List all people entries.

#### POST /api/people

Create a new person entry.

**Request Body**:

```json
{
  "name": "string (required)",
  "context": "string (optional)",
  "followUps": "string (optional)",
  "tags": ["string"] (optional)
}
```

#### PATCH /api/people

Update a person entry.

#### DELETE /api/people?id={uuid}

Archive a person entry.

---

### Ideas

#### GET /api/ideas

List all ideas.

#### POST /api/ideas

Create a new idea.

**Request Body**:

```json
{
  "name": "string (required)",
  "oneLiner": "string (optional)",
  "notes": "string (optional)",
  "tags": ["string"] (optional)
}
```

#### PATCH /api/ideas

Update an idea.

#### DELETE /api/ideas?id={uuid}

Archive an idea.

---

### Tasks

#### GET /api/tasks

List admin tasks.

**Query Parameters**:
- `status` (optional): Filter by status (`todo`, `done`)

**Response**:

```json
{
  "tasks": [...],
  "count": 10
}
```

#### PATCH /api/tasks?id={uuid}

Update a task (e.g., toggle completion).

**Request Body**:

```json
{
  "status": "todo | done (optional)",
  "name": "string (optional)",
  "notes": "string (optional)",
  "dueDate": "ISO date (optional)"
}
```

#### DELETE /api/tasks?id={uuid}

Delete a task.

---

### Inbox

#### GET /api/inbox

List inbox items.

**Query Parameters**:
- `status` (optional): Filter by status (`pending`, `filed`, `needs_review`)

#### PATCH /api/inbox

Update an inbox item's status.

**Request Body**:

```json
{
  "id": "uuid (required)",
  "status": "pending | filed | needs_review | fixed"
}
```

#### POST /api/inbox/classify

Trigger classification for a pending inbox item.

**Request Body**:

```json
{
  "id": "uuid"
}
```

#### GET /api/inbox/recover

Check for stuck inbox items (filed but not created).

#### POST /api/inbox/recover

Recover stuck inbox items by creating missing records.

---

### Analytics

#### GET /api/analytics

Get META accuracy metrics and health data.

**Query Parameters**:
- `days` (optional, default: 30): Number of days to analyze
- `include` (optional): Comma-separated sections (`metrics`, `patterns`, `health`, `all`)

**Response**:

```json
{
  "success": true,
  "generatedAt": "ISO date",
  "period": "30 days",
  "metrics": { ... },
  "patterns": [ ... ],
  "health": { ... }
}
```

#### GET /api/analytics/detailed

Get comprehensive analytics data.

**Query Parameters**:
- `days` (optional, default: 30)

**Response**:

```json
{
  "success": true,
  "activity": { ... },
  "productivity": { ... },
  "regulation": { ... },
  "health": { ... },
  "insights": [ ... ]
}
```

#### GET /api/analytics/captures

Get capture statistics and patterns.

**Query Parameters**:
- `period` (optional): `today`, `week`, `month`

---

### Optimization

#### GET /api/optimize

Get optimization status and history.

**Query Parameters**:
- `history` (optional, default: 5): Number of historical runs

**Response**:

```json
{
  "success": true,
  "status": {
    "shouldRun": true,
    "reason": "15 corrections since last run"
  },
  "lastRun": { ... },
  "history": [ ... ]
}
```

#### POST /api/optimize

Trigger optimization cycle.

**Request Body**:

```json
{
  "force": false  // Set true to run even if not needed
}
```

---

### Content

#### GET /api/content/refresh

Refresh content from external sources.

#### POST /api/content/refresh

Force refresh specific content.

**Request Body**:

```json
{
  "type": "techniques | tips | all"
}
```

---

### Summaries

#### GET /api/summaries

Get or generate summaries.

**Query Parameters**:
- `type` (optional): `daily`, `weekly`
- `date` (optional): ISO date string
- `format` (optional): `json`, `text`
- `generate` (optional): `true` to force regeneration

#### POST /api/summaries

Force generate and store summaries.

**Request Body**:

```json
{
  "type": "daily | weekly",
  "date": "ISO date (optional)"
}
```

---

### Unified

#### GET /api/unified

Fetch normalized items from all tables.

**Query Parameters**:
- `type` (optional): `projects`, `people`, `ideas`, `admin`
- `includeArchived` (optional): `true` to include archived
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)
- `sortBy` (optional): `createdAt`, `lastTouched`, `dueDate`

**Response**:

```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "type": "projects | people | ideas | admin",
      "name": "string",
      "content": "string",
      "metadata": { ... },
      "temporal": {
        "createdAt": "ISO date",
        "lastTouched": "ISO date",
        "dueDate": "ISO date | null",
        "archivedAt": "ISO date | null"
      },
      "tags": ["string"]
    }
  ],
  "count": 10
}
```

---

### Stats

#### GET /api/stats

Get dashboard statistics.

**Response**:

```json
{
  "success": true,
  "projects": { "active": 5, "total": 10 },
  "people": { "count": 15 },
  "ideas": { "count": 20 },
  "tasks": { "pending": 3, "dueToday": 1 },
  "inbox": { "pending": 2 },
  "captures": { "today": 5, "thisWeek": 25 }
}
```

---

### Process

#### GET /api/process

Process pending inbox items.

**Query Parameters**:
- `limit` (optional, default: 10): Max items to process

#### POST /api/process

Process specific inbox item or batch.

**Request Body**:

```json
{
  "id": "uuid (optional - process specific item)",
  "limit": 10  // For batch processing
}
```

---

## Rate Limiting

> **Note**: Rate limiting is currently **not implemented** for the local network deployment.
> When expanding to multi-user or public release, implement rate limiting with `@upstash/ratelimit`.

---

## Changelog

- **v1.0.0** (2026-01): Initial API documentation
