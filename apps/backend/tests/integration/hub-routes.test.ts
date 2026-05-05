import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { captureRoutes, projectRoutes, knowledgeRoutes, reviewRoutes } from '../../src/routes/hub.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let captureId = '';
let projectId = '';
let knowledgeId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(captureRoutes);
  await app.register(projectRoutes);
  await app.register(knowledgeRoutes);
  await app.register(reviewRoutes);

  const user = await prisma.user.create({
    data: {
      email: `hub-test-${Date.now()}@test.com`,
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

// --- Capture Items ---

describe('POST /api/v1/capture', () => {
  it('creates a capture item with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/capture',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        content: 'Test capture item',
        contentType: 'text',
        source: 'app',
        tags: ['test'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('content', 'Test capture item');
    expect(body).toHaveProperty('contentType', 'text');
    expect(body).toHaveProperty('classificationStatus', 'pending');
    expect(body.tags).toContain('test');
    captureId = body.id;
  });

  it('returns 400 when content is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/capture',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { source: 'app' },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('GET /api/v1/capture', () => {
  it('returns list of capture items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/capture',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('content', 'Test capture item');
  });
});

describe('POST /api/v1/capture/:id/classify', () => {
  it('classifies a capture item with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/capture/${captureId}/classify`,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        module: 'journal',
        type: 'reflection',
        confidence: 0.85,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('classificationStatus', 'classified');
    expect(body).toHaveProperty('classifiedModule', 'journal');
    expect(body).toHaveProperty('classifiedType', 'reflection');
    expect(body).toHaveProperty('classifiedConfidence', 0.85);
  });

  it('returns 400 with invalid classify payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/capture/${captureId}/classify`,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { module: 123 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for nonexistent capture item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/capture/00000000-0000-0000-0000-000000000000/classify',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        module: 'journal',
        type: 'reflection',
        confidence: 0.9,
      },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/v1/capture/:id', () => {
  it('deletes a capture item', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/capture',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { content: 'to be deleted' },
    });
    const { id } = createRes.json();

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/capture/${id}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for nonexistent capture item', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/capture/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- Projects ---

describe('POST /api/v1/projects', () => {
  it('creates a project with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        name: 'Test Project',
        area: 'projects',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name', 'Test Project');
    expect(body).toHaveProperty('area', 'projects');
    expect(body).toHaveProperty('status', 'active');
    projectId = body.id;
  });

  it('returns 400 when name is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { area: 'projects' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/projects', () => {
  it('returns list of projects', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('name', 'Test Project');
  });
});

describe('POST /api/v1/projects/:id/archive', () => {
  it('archives a project', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/archive`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('status', 'archived');
    expect(body).toHaveProperty('area', 'archives');
  });

  it('returns 404 for nonexistent project', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/00000000-0000-0000-0000-000000000000/archive',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- Knowledge ---

describe('POST /api/v1/knowledge', () => {
  it('creates a knowledge item with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/knowledge',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        title: 'Test Knowledge',
        content: 'Some knowledge content for testing',
        paraCategory: 'resources',
        tags: ['test', 'reference'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('title', 'Test Knowledge');
    expect(body).toHaveProperty('paraCategory', 'resources');
    expect(body.tags).toContain('test');
    knowledgeId = body.id;
  });

  it('returns 400 when title is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/knowledge',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { content: 'content without title' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/knowledge', () => {
  it('returns list of knowledge items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/knowledge',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('title', 'Test Knowledge');
  });
});

describe('GET /api/v1/knowledge/:id', () => {
  it('returns a single knowledge item', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/knowledge/${knowledgeId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', knowledgeId);
    expect(body).toHaveProperty('title', 'Test Knowledge');
  });

  it('returns 404 for nonexistent knowledge item', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/knowledge/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- Review / Daily Summary ---

describe('GET /api/v1/review/daily-summary', () => {
  it('returns daily summary with activity counts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/review/daily-summary',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('date');
    expect(body).toHaveProperty('emotionalCheckIns');
    expect(body).toHaveProperty('habitsCompleted');
    expect(body).toHaveProperty('tasksCompleted');
    expect(body).toHaveProperty('itemsCaptured');
    expect(body).toHaveProperty('journalEntries');
    expect(body).toHaveProperty('totalActivity');
    expect(typeof body.totalActivity).toBe('number');
  });
});

// --- Auth enforcement ---

describe('Auth enforcement', () => {
  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/capture',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST requests without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/capture',
      payload: { content: 'unauthorized' },
    });
    expect(res.statusCode).toBe(401);
  });
});
