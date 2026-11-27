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

// Regression: a non-numeric limit/offset reached Prisma as NaN and
// crashed the request with a 500. It is a client error and has to read as one.
describe('GET /api/v1/journal/entries query validation', () => {
  it.each([
    ['limit=notanumber', 'limit'],
    ['offset=notanumber', 'offset'],
    ['limit=abc', 'limit'],
  ])('returns 400, not 500, for %s', async (query, param) => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/journal/entries?${query}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty(`error.${param}`);
  });

  it.each(['limit=1.5', 'limit=-1', 'offset=1.5', 'offset=-1'])('returns 400 for %s', async (query) => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/journal/entries?${query}`,
      headers: authHeaders(),
    });
    expect(res.statusCode, query).toBe(400);
  });

  it('accepts limit=0 and offset=0', async () => {
    for (const query of ['limit=0', 'offset=0']) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/journal/entries?${query}`,
        headers: authHeaders(),
      });
      expect(res.statusCode, query).toBe(200);
    }
  });
});

describe('GET /api/v1/journal/entries pagination', () => {
  const CAP = 200;
  let previousUserId: string;
  let previousToken: string;

  beforeAll(async () => {
    // A user of our own, so the pages hold nothing but the rows seeded here.
    previousUserId = userId;
    previousToken = token;
    const owner = await prisma.user.create({
      data: {
        email: `journal-pagination-${Date.now()}@test.com`,
        password: 'hashed-not-real-password',
        preferences: { create: {} },
      },
    });
    userId = owner.id;
    token = await signToken({ userId });

    // One entry per second, newest first, so the pages are predictable.
    const now = Date.now();
    await prisma.journalEntry.createMany({
      data: Array.from({ length: CAP + 5 }, (_, i) => ({
        userId,
        content: `pagination-probe:${i}`,
        createdAt: new Date(now - i * 1000),
      })),
    });
  });

  afterAll(async () => {
    // Deleting the owner cascades to its entries.
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    userId = previousUserId;
    token = previousToken;
  });

  it('clamps a limit above the cap of 200 instead of failing or over-fetching', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journal/entries?limit=999999',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(CAP);
  });

  it('pages in order: offset advances the window and limit=0 gives an empty page', async () => {
    const page = async (limit: number, offset: number) => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/journal/entries?limit=${limit}&offset=${offset}`,
        headers: authHeaders(),
      });
      expect(res.statusCode).toBe(200);
      return (res.json() as Array<{ content: string }>).map((entry) => entry.content);
    };

    expect(await page(2, 0)).toEqual(['pagination-probe:0', 'pagination-probe:1']);
    expect(await page(2, 2)).toEqual(['pagination-probe:2', 'pagination-probe:3']);
    expect(await page(0, 0)).toEqual([]);
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

describe('GET /api/v1/insights query validation', () => {
  const CAP = 50;

  beforeAll(async () => {
    await prisma.insight.createMany({
      data: Array.from({ length: CAP + 5 }, (_, i) => ({
        userId,
        type: 'pattern',
        title: `cap-probe:${i}`,
        description: 'Seeded to prove the list route caps its page size.',
        confidence: 0.5,
      })),
    });
  });

  afterAll(async () => {
    await prisma.insight.deleteMany({ where: { userId, title: { startsWith: 'cap-probe:' } } });
  });

  it.each([
    ['limit=notanumber', 'limit'],
    ['limit=1.5', 'limit'],
    ['limit=-1', 'limit'],
  ])('returns 400, not 500, for %s', async (query, param) => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/insights?${query}`,
      headers: authHeaders(),
    });
    expect(res.statusCode, query).toBe(400);
    expect(res.json()).toHaveProperty(`error.${param}`);
  });

  it('accepts limit=0', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/insights?limit=0',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('clamps a limit above the cap of 50 instead of failing or over-fetching', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/insights?limit=999999',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(CAP);
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
