import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { bodyCheckInRoutes, somaticRoutes, sleepRoutes, spaceRoutes } from '../../src/routes/body.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let checkInId = '';
let somaticId = '';
let spaceId = '';

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(bodyCheckInRoutes);
  await app.register(somaticRoutes);
  await app.register(sleepRoutes);
  await app.register(spaceRoutes);

  const user = await prisma.user.create({
    data: {
      email: `body-test-${Date.now()}@test.com`,
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

// --- Body Check-Ins ---

describe('POST /api/v1/body-checkins', () => {
  it('creates a body check-in with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/body-checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        bodyScan: { head: 'tension', shoulders: 'tight', chest: 'open' },
        emotionWheelFeeling: 'calm',
        emotionWheelValence: 'pleasant',
        reflectionRating: 4,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('emotionWheelFeeling', 'calm');
    expect(body).toHaveProperty('emotionWheelValence', 'pleasant');
    expect(body).toHaveProperty('reflectionRating', 4);
    expect(body).toHaveProperty('bodyScan');
    checkInId = body.id;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/body-checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { bodyScan: {} },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 with invalid valence', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/body-checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        bodyScan: {},
        emotionWheelFeeling: 'happy',
        emotionWheelValence: 'invalid',
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/body-checkins', () => {
  it('returns list of body check-ins', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/body-checkins',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('emotionWheelFeeling', 'calm');
  });
});

describe('GET /api/v1/body-checkins/latest', () => {
  it('returns the most recent check-in', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/body-checkins/latest',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', checkInId);
    expect(body).toHaveProperty('emotionWheelFeeling', 'calm');
  });
});

// --- Sleep Logs ---

describe('POST /api/v1/sleep', () => {
  it('creates a sleep log with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sleep',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        date: new Date().toISOString(),
        durationHours: 7.5,
        qualityScore: 4,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('durationHours', 7.5);
    expect(body).toHaveProperty('qualityScore', 4);
  });

  it('returns 400 with missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sleep',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { date: new Date().toISOString() },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 with quality score out of range', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sleep',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        date: new Date().toISOString(),
        durationHours: 7,
        qualityScore: 10,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/sleep', () => {
  it('returns sleep logs with summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sleep',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('summary');
    expect(Array.isArray(body.logs)).toBe(true);
    expect(body.summary).toHaveProperty('nights');
    expect(body.summary).toHaveProperty('avgDuration');
    expect(body.summary).toHaveProperty('avgQuality');
  });
});

// --- Somatic Mappings ---

describe('POST /api/v1/somatic', () => {
  it('creates a somatic mapping with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/somatic',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        sensationPattern: { chest: 'tightness', breathing: 'shallow' },
        predictedEmotion: 'anxiety',
        confidence: 0.82,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('predictedEmotion', 'anxiety');
    expect(body).toHaveProperty('confidence', 0.82);
    expect(body).toHaveProperty('sensationPattern');
    somaticId = body.id;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/somatic',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { sensationPattern: {} },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 with confidence out of range', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/somatic',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        sensationPattern: { chest: 'tightness' },
        predictedEmotion: 'stress',
        confidence: 1.5,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/somatic', () => {
  it('returns list of somatic mappings', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/somatic',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('predictedEmotion', 'anxiety');
  });
});

// --- Spaces ---

describe('POST /api/v1/spaces', () => {
  it('creates a space with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/spaces',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: { name: 'Living Room' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name', 'Living Room');
    spaceId = body.id;
  });

  it('returns 400 when name is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/spaces',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/spaces', () => {
  it('returns list of spaces with scans', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/spaces',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('name', 'Living Room');
    expect(body[0]).toHaveProperty('scans');
  });
});

// --- Auth enforcement ---

describe('Auth enforcement', () => {
  it('rejects body check-in without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/body-checkins',
      payload: {
        bodyScan: {},
        emotionWheelFeeling: 'calm',
        emotionWheelValence: 'pleasant',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects sleep log without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sleep',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects somatic mapping without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/somatic',
    });
    expect(res.statusCode).toBe(401);
  });
});
