import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { hashPassword, verifyPassword, signToken } from '../services/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/v1/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        preferences: { create: {} },
      },
    });

    const token = await signToken({ userId: user.id });

    return reply.status(201).send({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      token,
    });
  });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = await signToken({ userId: user.id });

    return reply.status(200).send({
      user: { id: user.id, email: user.email },
      token,
    });
  });

  app.get('/api/v1/user/me', { preHandler: authMiddleware }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      include: { preferences: true },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      preferences: user.preferences,
      onboardingCompleted: true,
    };
  });

  app.put('/api/v1/user/preferences', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({
      timezone: z.string().optional(),
      shutdownRitualTime: z.string().optional(),
      weeklyReviewDay: z.number().min(0).max(6).optional(),
      fontSize: z.enum(['small', 'medium', 'large']).optional(),
      highContrast: z.boolean().optional(),
      reducedMotion: z.boolean().optional(),
      dyslexiaFont: z.boolean().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId: request.userId! },
      update: parsed.data,
      create: { userId: request.userId!, ...parsed.data },
    });

    return preferences;
  });
}
