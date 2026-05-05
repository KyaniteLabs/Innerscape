import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { signToken, hashPassword } from '../../src/services/auth.js';
import { authRoutes } from '../../src/routes/auth.js';
import { prisma } from '../../src/db.js';

let app: Fastify.FastifyInstance;
let token: string;
let userId: string;
let testEmail: string;

const TEST_PASSWORD = 'test-password-12345';

beforeAll(async () => {
  app = Fastify();
  await app.register(authRoutes);

  testEmail = `auth-test-${Date.now()}@test.com`;
  const hashedPassword = await hashPassword(TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      preferences: { create: {} },
    },
  });
  userId = user.id;
  token = await signToken({ userId });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'auth-test-' } },
  });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await app.close();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user with valid data', async () => {
    const email = `auth-test-register-${Date.now()}@test.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email,
        password: 'a-very-secure-password',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('token');
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email', email);
    expect(body.user).toHaveProperty('createdAt');
    expect(typeof body.token).toBe('string');
  });

  it('returns 400 for missing email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        password: 'a-very-secure-password',
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 for missing password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: 'someone@test.com',
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 for short password (under 12 chars)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: `auth-test-shortpw-${Date.now()}@test.com`,
        password: 'short',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 for duplicate email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: testEmail,
        password: 'another-secure-password',
      },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error).toBe('Email already registered');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: testEmail,
        password: TEST_PASSWORD,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('token');
    expect(body.user).toHaveProperty('id', userId);
    expect(body.user).toHaveProperty('email', testEmail);
    expect(typeof body.token).toBe('string');
  });

  it('returns 401 for wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: testEmail,
        password: 'wrong-password',
      },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('Invalid credentials');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: 'nonexistent-user@test.com',
        password: 'does-not-matter',
      },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('Invalid credentials');
  });

  it('returns 400 for empty password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        email: testEmail,
        password: '',
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('Token validation via GET /api/v1/user/me', () => {
  it('returns user data with a valid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/user/me',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', userId);
    expect(body).toHaveProperty('email', testEmail);
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('preferences');
  });

  it('returns 401 with no authorization header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/user/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/user/me',
      headers: { Authorization: 'Bearer invalid-token-value' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('Invalid or expired token');
  });
});
