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

describe('POST /api/v1/trade/matches', () => {
  it('creates a trade match for another user\'s listing', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `trade-other-${Date.now()}@test.com`,
        password: 'hashed-not-real-password',
        preferences: { create: {} },
      },
    });

    const otherListing = await prisma.tradeListing.create({
      data: {
        userId: otherUser.id,
        itemLabel: 'other user book',
        condition: 'good',
        tradeValueCredits: 15,
        tags: ['books'],
        wantsInReturn: ['electronics'],
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/matches',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        listing_id: otherListing.id,
        message: 'I\'d like to trade!',
        use_credits: true,
        credit_amount: 15,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('listing_id', otherListing.id);
    expect(body).toHaveProperty('requester_id', userId);
    expect(body).toHaveProperty('owner_id', otherUser.id);
    expect(body).toHaveProperty('use_credits', true);
    expect(body).toHaveProperty('status');

    await prisma.tradeMatch.deleteMany({ where: { listingId: otherListing.id } });
    await prisma.tradeListing.delete({ where: { id: otherListing.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('rejects matching with own listing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/matches',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        listing_id: listingId,
        message: 'self match attempt',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Cannot match with own listing');
  });

  it('returns 404 for nonexistent listing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/matches',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        listing_id: '00000000-0000-0000-0000-000000000000',
      },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/trade/reviews', () => {
  it('creates a review for a trade match', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `review-target-${Date.now()}@test.com`,
        password: 'hashed-not-real-password',
        preferences: { create: {} },
      },
    });

    const otherListing = await prisma.tradeListing.create({
      data: {
        userId: otherUser.id,
        itemLabel: 'review test item',
        condition: 'good',
        tradeValueCredits: 10,
      },
    });

    const match = await prisma.tradeMatch.create({
      data: {
        listingId: otherListing.id,
        requesterId: userId!,
        ownerId: otherUser.id,
        message: 'trade for review test',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/reviews',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        trade_match_id: match.id,
        rated_user_id: otherUser.id,
        rating: 5,
        tags: ['punctual', 'friendly'],
        comment: 'Great trade experience!',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('rated_user_id', otherUser.id);
    expect(body).toHaveProperty('rating', 5);

    await prisma.tradeReview.deleteMany({ where: { tradeMatchId: match.id } });
    await prisma.tradeMatch.delete({ where: { id: match.id } });
    await prisma.tradeListing.delete({ where: { id: otherListing.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('rejects invalid rating', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/reviews',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        trade_match_id: 'fake-id',
        rated_user_id: 'fake-id',
        rating: 10,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});
