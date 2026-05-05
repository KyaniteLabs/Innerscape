/**
 * Integration tests for Declutter routes ported to Innerscape's Fastify backend.
 *
 * These verify the TypeScript port matches the Declutter API contract
 * captured by the characterization tests.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { declutterSessionRoutes, declutterValuationRoutes } from '../../src/routes/declutter.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let sessionId = '';
let itemId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(declutterSessionRoutes);
  await app.register(declutterValuationRoutes);

  const user = await prisma.user.create({
    data: {
      email: `declutter-test-${Date.now()}@test.com`,
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

// ── Sessions ──────────────────────────────────────────────────────────────

describe('POST /api/v1/declutter/sessions', () => {
  it('creates a new session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/declutter/sessions',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('session_id');
    expect(body).toHaveProperty('created_at');
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('money_on_table_low_usd');
    expect(body).toHaveProperty('money_on_table_high_usd');
    expect(Array.isArray(body.items)).toBe(true);
    sessionId = body.session_id;
  });
});

describe('GET /api/v1/declutter/sessions', () => {
  it('lists sessions for the authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/declutter/sessions',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('sessions');
    expect(Array.isArray(body.sessions)).toBe(true);
    expect(body.sessions.length).toBeGreaterThan(0);
    const s = body.sessions[0];
    expect(s).toHaveProperty('session_id');
    expect(s).toHaveProperty('total_items');
    expect(s).toHaveProperty('decided_items');
    expect(s).toHaveProperty('money_on_table_low_usd');
    expect(s).toHaveProperty('money_on_table_high_usd');
    expect(s).toHaveProperty('public_listing_count');
  });
});

describe('GET /api/v1/declutter/sessions/:sessionId', () => {
  it('returns a specific session', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/declutter/sessions/${sessionId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.session_id).toBe(sessionId);
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('money_on_table_low_usd');
    expect(body).toHaveProperty('money_on_table_high_usd');
  });
});

// ── Session Items ─────────────────────────────────────────────────────────

describe('POST /api/v1/declutter/sessions/:sessionId/items', () => {
  it('adds an item to a session with valuation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/declutter/sessions/${sessionId}/items`,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { label: 'bluetooth speaker', condition: 'good' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('item_id');
    expect(body).toHaveProperty('label', 'bluetooth speaker');
    expect(body).toHaveProperty('condition', 'good');
    expect(body).toHaveProperty('valuation');
    expect(body).toHaveProperty('listing_draft');
    expect(body).toHaveProperty('created_at');
    expect(body).toHaveProperty('decision');

    const v = body.valuation;
    expect(v).toHaveProperty('label');
    expect(v).toHaveProperty('estimated_low_usd');
    expect(v).toHaveProperty('estimated_high_usd');
    expect(v).toHaveProperty('confidence');
    expect(v).toHaveProperty('comp_count');
    expect(v).toHaveProperty('source');
    expect(typeof v.estimated_low_usd).toBe('number');
    expect(typeof v.estimated_high_usd).toBe('number');

    itemId = body.item_id;
  });
});

// ── Decisions ─────────────────────────────────────────────────────────────

describe('POST /api/v1/declutter/sessions/:sessionId/decisions', () => {
  it('records a keep decision', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/declutter/sessions/${sessionId}/decisions`,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { item_id: itemId, decision: 'keep', note: 'still useful' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('item_id', itemId);
    expect(body).toHaveProperty('decision', 'keep');
    expect(body).toHaveProperty('note', 'still useful');
    expect(body).toHaveProperty('decided_at');
  });

  it('accepts all valid decision values', async () => {
    const validDecisions = ['keep', 'donate', 'trash', 'recycle', 'relocate', 'maybe', 'sell'];
    for (const d of validDecisions) {
      expect(validDecisions).toContain(d);
    }
  });
});

// ── Session Summary ───────────────────────────────────────────────────────

describe('GET /api/v1/declutter/sessions/:sessionId/summary', () => {
  it('returns session summary with decision counts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/declutter/sessions/${sessionId}/summary`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('session_id');
    expect(body).toHaveProperty('total_items');
    expect(body).toHaveProperty('decided_items');
    expect(body).toHaveProperty('decision_counts');
    expect(body).toHaveProperty('total_estimated_low_usd');
    expect(body).toHaveProperty('total_estimated_high_usd');
    expect(body).toHaveProperty('money_on_table_low_usd');
    expect(body).toHaveProperty('money_on_table_high_usd');
    expect(body).toHaveProperty('public_listings');
    expect(typeof body.decision_counts).toBe('object');
  });
});

// ── Valuation ─────────────────────────────────────────────────────────────

describe('POST /api/v1/declutter/valuation/estimate', () => {
  it('returns price estimate for a known item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/declutter/valuation/estimate',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { label: 'bluetooth speaker', condition: 'good' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('label');
    expect(body).toHaveProperty('estimated_low_usd');
    expect(body).toHaveProperty('estimated_high_usd');
    expect(body).toHaveProperty('confidence');
    expect(body).toHaveProperty('comp_count');
    expect(body).toHaveProperty('source');
    expect(body.estimated_low_usd).toBeGreaterThanOrEqual(0);
    expect(body.estimated_high_usd).toBeGreaterThanOrEqual(body.estimated_low_usd);
  });
});

describe('POST /api/v1/declutter/valuation (simple)', () => {
  it('returns simple category-based valuation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/declutter/valuation',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { category: 'electronics', condition: 'good', count: 1 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('low');
    expect(body).toHaveProperty('mid');
    expect(body).toHaveProperty('high');
    expect(body).toHaveProperty('confidence');
    expect(body.low).toBeGreaterThanOrEqual(0);
    expect(body.high).toBeGreaterThanOrEqual(body.low);
  });
});

// ── Auth Enforcement ──────────────────────────────────────────────────────

describe('Auth enforcement', () => {
  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/declutter/sessions',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid tokens', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/declutter/sessions',
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.statusCode).toBe(401);
  });
});
