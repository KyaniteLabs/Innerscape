import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { journalRoutes } from '../../src/routes/journal.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let entryId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(journalRoutes);

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
      payload: {
        tags: ['no-content'],
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
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
});

describe('DELETE /api/v1/journal/entries/:id', () => {
  it('deletes an existing entry', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/journal/entries/${entryId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(204);
  });

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
});

describe('Auth enforcement', () => {
  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journal/entries',
    });
    expect(res.statusCode).toBe(401);
  });
});
