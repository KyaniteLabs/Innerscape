import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { tradeRoutes } from '../../src/routes/trade.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let listingId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(tradeRoutes);

  const user = await prisma.user.create({
    data: {
      email: `trade-test-${Date.now()}@test.com`,
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

describe('POST /api/v1/trade/listings', () => {
  it('creates a trade listing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/listings',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        item_label: 'test bluetooth speaker',
        description: 'great condition speaker',
        condition: 'good',
        valuation_median_usd: 35,
        trade_value_credits: 35,
        tags: ['electronics', 'audio'],
        wants_in_return: ['books', 'plants'],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('item_label', 'test bluetooth speaker');
    expect(body).toHaveProperty('condition', 'good');
    expect(body).toHaveProperty('trade_value_credits', 35);
    expect(body).toHaveProperty('status', 'available');
    expect(body).toHaveProperty('created_at');
    expect(body).toHaveProperty('tags');
    expect(body.tags).toContain('electronics');
    expect(body).toHaveProperty('wants_in_return');
    listingId = body.id;
  });
});

describe('GET /api/v1/trade/listings', () => {
  it('returns available listings excluding own', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/listings',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('listings');
    expect(Array.isArray(body.listings)).toBe(true);
  });
});

describe('GET /api/v1/trade/listings/mine', () => {
  it('returns own listings', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/listings/mine',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.listings.length).toBeGreaterThan(0);
    expect(body.listings[0].item_label).toBe('test bluetooth speaker');
  });
});

describe('GET /api/v1/trade/credits', () => {
  it('returns credit balance and transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/credits',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('balance');
    expect(body).toHaveProperty('transactions');
    expect(typeof body.balance).toBe('number');
    expect(Array.isArray(body.transactions)).toBe(true);
  });
});

describe('GET /api/v1/trade/rules', () => {
  it('returns trade rules', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/rules',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('rules');
    expect(Array.isArray(body.rules)).toBe(true);
    expect(body.rules.length).toBeGreaterThan(0);
  });
});

describe('GET /api/v1/trade/safety', () => {
  it('returns safety checklists', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/safety',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('checklists');
    expect(Array.isArray(body.checklists)).toBe(true);
    expect(body.checklists.length).toBeGreaterThan(0);
  });
});

describe('Auth enforcement', () => {
  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/credits',
    });
    expect(res.statusCode).toBe(401);
  });
});
