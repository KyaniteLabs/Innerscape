import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { journalRoutes, insightRoutes } from '../../src/routes/journal.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let entryId = '';
let insightId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(journalRoutes);
  await app.register(insightRoutes);

  const user = await prisma.user.create({
    data: {
      email: `journal-test-${Date.now()}@test.com`,
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

describe('POST /api/v1/journal/entries', () => {
  it('creates a journal entry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/journal/entries',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        content: 'Today was a productive day.',
        tags: ['productivity', 'reflection'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('content', 'Today was a productive day.');
    expect(body).toHaveProperty('tags');
    expect(body.tags).toContain('productivity');
    expect(body.tags).toContain('reflection');
    expect(body).toHaveProperty('createdAt');
    entryId = body.id;
  });

  it('rejects missing content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/journal/entries',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { tags: ['no-content'] },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });

  it('accepts entry with linked check-ins', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/journal/entries',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        content: 'Reflecting on my mood today.',
        tags: ['mood'],
        linkedCheckIns: ['checkin-id-1'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.linkedCheckIns).toContain('checkin-id-1');
  });
});

describe('GET /api/v1/journal/entries', () => {
  it('returns list of entries with tags', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journal/entries',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('content');
    expect(body[0]).toHaveProperty('tags');
  });

  it('respects limit and offset query params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journal/entries?limit=1&offset=0',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeLessThanOrEqual(1);
  });
});

describe('GET /api/v1/journal/entries/:id', () => {
  it('returns a single entry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/journal/entries/${entryId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(entryId);
    expect(body).toHaveProperty('content');
  });

  it('returns 404 for non-existent entry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journal/entries/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/v1/journal/entries/:id', () => {
  it('returns 404 for non-existent entry', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/journal/entries/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toHaveProperty('error', 'Entry not found');
  });

  it('deletes an existing entry', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/journal/entries/${entryId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(204);
  });
});

describe('POST /api/v1/insights', () => {
  it('creates an insight', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insights',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        type: 'pattern',
        title: 'Low energy on Mondays',
        description: 'You consistently report lower energy on Mondays compared to other weekdays.',
        confidence: 0.85,
        dataPoints: ['energy_mon_avg_35', 'energy_other_avg_65'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('type', 'pattern');
    expect(body).toHaveProperty('title', 'Low energy on Mondays');
    expect(body).toHaveProperty('confidence', 0.85);
    insightId = body.id;
  });

  it('rejects invalid insight type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insights',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        type: 'invalid',
        title: 'Bad type',
        description: 'Should fail',
        confidence: 0.5,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects confidence out of range', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insights',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        type: 'trend',
        title: 'Overconfident',
        description: 'Confidence too high',
        confidence: 2.0,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/insights', () => {
  it('returns list of insights', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/insights',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('type');
    expect(body[0]).toHaveProperty('title');
  });

  it('filters non-dismissed insights', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/insights?dismissed=false',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('POST /api/v1/insights/:id/dismiss', () => {
  it('dismisses an insight', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/insights/${insightId}/dismiss`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('dismissedAt');
    expect(body.dismissedAt).not.toBeNull();
  });

  it('returns 404 for non-existent insight', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insights/00000000-0000-0000-0000-000000000000/dismiss',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/insights/:id/act', () => {
  it('marks insight as acted upon', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/insights/${insightId}/act`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('actedUponAt');
    expect(body.actedUponAt).not.toBeNull();
  });

  it('returns 404 for non-existent insight', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insights/00000000-0000-0000-0000-000000000000/act',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/insights/generate', () => {
  it('generates insights from user data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insights/generate',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('generated');
    expect(body).toHaveProperty('insights');
    expect(typeof body.generated).toBe('number');
    expect(Array.isArray(body.insights)).toBe(true);
  });
});

describe('Auth enforcement', () => {
  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journal/entries',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects insight requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/insights',
    });
    expect(res.statusCode).toBe(401);
  });
});
