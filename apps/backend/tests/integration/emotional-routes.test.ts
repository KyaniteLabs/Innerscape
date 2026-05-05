import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken } from '../../src/services/auth.js';
import { emotionalRoutes } from '../../src/routes/emotional.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(emotionalRoutes);

  const user = await prisma.user.create({
    data: {
      email: `emotional-test-${Date.now()}@test.com`,
      password: 'hashed-not-real-password',
      preferences: { create: {} },
    },
  });
  userId = user.id;
  token = await signToken({ userId });
});

afterAll(async () => {
  await prisma.emotionalCheckIn.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await app.close();
});

describe('POST /api/v1/checkins', () => {
  it('creates a check-in with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        energyLevel: 75,
        valence: 'pleasant',
        feelingLabel: 'happy',
        bodySensationNote: 'relaxed shoulders',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('energyLevel', 75);
    expect(body).toHaveProperty('valence', 'pleasant');
    expect(body).toHaveProperty('feelingLabel', 'happy');
    expect(body).toHaveProperty('bodySensationNote', 'relaxed shoulders');
    expect(body).toHaveProperty('userId', userId);
    expect(body).toHaveProperty('timestamp');
  });

  it('creates a check-in with minimal data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        energyLevel: 50,
        valence: 'neutral',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('energyLevel', 50);
    expect(body).toHaveProperty('valence', 'neutral');
    expect(body).toHaveProperty('source', 'manual');
  });

  it('returns 400 for energy level above 100', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        energyLevel: 150,
        valence: 'pleasant',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for negative energy level', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        energyLevel: -5,
        valence: 'pleasant',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid valence', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        energyLevel: 50,
        valence: 'amazing',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing energy level', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        valence: 'pleasant',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing valence', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      payload: {
        energyLevel: 50,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        energyLevel: 50,
        valence: 'neutral',
      },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/checkins', () => {
  it('returns list of check-ins', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/checkins',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('energyLevel');
    expect(body[0]).toHaveProperty('valence');
    expect(body[0]).toHaveProperty('userId', userId);
  });

  it('returns check-ins ordered by timestamp descending', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/checkins',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    if (body.length >= 2) {
      const first = new Date(body[0].timestamp).getTime();
      const second = new Date(body[1].timestamp).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });

  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/checkins',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/context/current', () => {
  it('returns current emotional context', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/context/current',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('checkIn');
    expect(body).toHaveProperty('inferredFactors');
    expect(body).toHaveProperty('computedState');
    expect(body.inferredFactors).toHaveProperty('timeOfDay');
    expect(body.inferredFactors).toHaveProperty('sleepQuality');
    expect(body.inferredFactors).toHaveProperty('consecutiveLowEnergyDays');
  });

  it('returns a computed state when check-ins exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/context/current',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.computedState).not.toBeNull();
    expect(typeof body.computedState).toBe('string');
  });

  it('returns the latest check-in', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/context/current',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.checkIn).not.toBeNull();
    expect(body.checkIn).toHaveProperty('userId', userId);
    expect(body.checkIn).toHaveProperty('energyLevel');
    expect(body.checkIn).toHaveProperty('valence');
  });

  it('rejects requests without auth token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/context/current',
    });
    expect(res.statusCode).toBe(401);
  });
});
