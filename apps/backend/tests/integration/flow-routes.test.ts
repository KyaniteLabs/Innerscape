import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { habitRoutes, goalRoutes, dopamineRoutes } from '../../src/routes/flow.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let habitId = '';
let taskId = '';
let dopamineId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(habitRoutes);
  await app.register(goalRoutes);
  await app.register(dopamineRoutes);

  const user = await prisma.user.create({
    data: {
      email: `flow-test-${Date.now()}@test.com`,
      password: 'hashed-not-real-password',
      preferences: { create: {} },
    },
  });
  userId = user.id;
  token = await signToken({ userId });
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await app.close();
});

// --- Habits ---

describe('POST /api/v1/habits', () => {
  it('creates a habit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        name: 'Morning meditation',
        frequency: 'daily',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name', 'Morning meditation');
    expect(body).toHaveProperty('frequency', 'daily');
    expect(body).toHaveProperty('streak');
    habitId = body.id;
  });

  it('rejects missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        frequency: 'daily',
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('GET /api/v1/habits', () => {
  it('returns list of habits', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/habits',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('frequency');
  });
});

describe('POST /api/v1/habits/:id/complete', () => {
  it('completes a habit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habitId}/complete`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('streak');
    expect(body).toHaveProperty('celebration');
  });

  it('returns 404 for non-existent habit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/habits/00000000-0000-0000-0000-000000000000/complete',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- Goals ---

describe('POST /api/v1/goals', () => {
  it('creates a goal', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        title: 'Learn TypeScript',
        description: 'Complete the advanced course',
        deadline: '2026-12-31T00:00:00Z',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('title', 'Learn TypeScript');
    expect(body).toHaveProperty('description', 'Complete the advanced course');
  });
});

describe('GET /api/v1/goals', () => {
  it('returns list of goals', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/goals',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('title');
  });
});

// --- Dopamine Menu ---

describe('POST /api/v1/dopamine-menu', () => {
  it('creates a dopamine menu item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/dopamine-menu',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        category: 'warm_up',
        name: 'Quick walk',
        instructions: ['Walk for 5 minutes', 'Focus on breathing'],
        estimatedDuration: 5,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name', 'Quick walk');
    expect(body).toHaveProperty('category', 'warm_up');
    expect(body).toHaveProperty('instructions');
  });
});

describe('GET /api/v1/dopamine-menu', () => {
  it('returns dopamine menu items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dopamine-menu',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('category');
    dopamineId = body[0].id;
  });
});

// --- Tasks ---

describe('POST /api/v1/tasks', () => {
  it('creates a task', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        title: 'Write integration tests',
        estimatedDuration: 30,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('title', 'Write integration tests');
    expect(body).toHaveProperty('completed', false);
    taskId = body.id;
  });

  it('rejects missing title', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { estimatedDuration: 25 },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/tasks', () => {
  it('returns list of tasks', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('title');
    expect(body[0]).toHaveProperty('completed');
  });
});

describe('POST /api/v1/tasks/:id/complete', () => {
  it('completes a task', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${taskId}/complete`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.completed).toBe(true);
    expect(body).toHaveProperty('completedAt');
  });

  it('rejects double completion', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${taskId}/complete`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks/00000000-0000-0000-0000-000000000000/complete',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- DELETE Habit ---

describe('DELETE /api/v1/habits/:id', () => {
  it('deletes a habit', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/habits/${habitId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for non-existent habit', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/habits/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- Dopamine Menu Use ---

describe('POST /api/v1/dopamine-menu/:id/use', () => {
  it('marks a dopamine menu item as used', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/dopamine-menu/${dopamineId}/use`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('lastUsedAt');
  });

  it('returns 404 for non-existent item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/dopamine-menu/00000000-0000-0000-0000-000000000000/use',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- Auth enforcement ---

describe('Auth enforcement', () => {
  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/habits',
    });
    expect(res.statusCode).toBe(401);
  });
});
