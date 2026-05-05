import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

// --- Body Check-Ins ---

const bodyCheckInSchema = z.object({
  bodyScan: z.record(z.any()),
  emotionWheelFeeling: z.string().min(1),
  emotionWheelValence: z.enum(['pleasant', 'unpleasant', 'neutral']),
  reflectionRating: z.number().int().min(1).max(5).optional(),
});

export async function bodyCheckInRoutes(app: FastifyInstance) {
  app.post('/api/v1/body-checkins', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = bodyCheckInSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const checkIn = await prisma.bodyCheckIn.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(checkIn);
  });

  app.get('/api/v1/body-checkins', { preHandler: authMiddleware }, async (request) => {
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string };

    return prisma.bodyCheckIn.findMany({
      where: { userId: request.userId },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
  });

  app.get('/api/v1/body-checkins/latest', { preHandler: authMiddleware }, async (request) => {
    const latest = await prisma.bodyCheckIn.findFirst({
      where: { userId: request.userId },
      orderBy: { timestamp: 'desc' },
    });

    return latest || { found: false };
  });
}

// --- Somatic Mappings ---

const somaticSchema = z.object({
  sensationPattern: z.record(z.any()),
  predictedEmotion: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export async function somaticRoutes(app: FastifyInstance) {
  app.post('/api/v1/somatic', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = somaticSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const mapping = await prisma.somaticMapping.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(mapping);
  });

  app.get('/api/v1/somatic', { preHandler: authMiddleware }, async (request) => {
    return prisma.somaticMapping.findMany({
      where: { userId: request.userId },
      orderBy: { occurrences: 'desc' },
    });
  });
}

// --- Sleep Logs ---

const sleepLogSchema = z.object({
  date: z.string().datetime(),
  durationHours: z.number().min(0).max(24),
  qualityScore: z.number().int().min(1).max(5),
});

export async function sleepRoutes(app: FastifyInstance) {
  app.post('/api/v1/sleep', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = sleepLogSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const log = await prisma.sleepLog.create({
      data: {
        userId: request.userId!,
        date: new Date(parsed.data.date),
        durationHours: parsed.data.durationHours,
        qualityScore: parsed.data.qualityScore,
      },
    });

    return reply.status(201).send(log);
  });

  app.get('/api/v1/sleep', { preHandler: authMiddleware }, async (request) => {
    const { days = '7' } = request.query as { days?: string };
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const logs = await prisma.sleepLog.findMany({
      where: {
        userId: request.userId,
        date: { gte: since },
      },
      orderBy: { date: 'desc' },
    });

    const avgDuration = logs.length
      ? logs.reduce((sum, l) => sum + l.durationHours, 0) / logs.length
      : 0;
    const avgQuality = logs.length
      ? logs.reduce((sum, l) => sum + l.qualityScore, 0) / logs.length
      : 0;

    return {
      logs,
      summary: {
        nights: logs.length,
        avgDuration: Math.round(avgDuration * 10) / 10,
        avgQuality: Math.round(avgQuality * 10) / 10,
      },
    };
  });
}

// --- Spaces & Scans ---

const spaceSchema = z.object({
  name: z.string().min(1).max(100),
});

const scanSchema = z.object({
  beforePhotoUri: z.string().min(1),
});

const detectedItemSchema = z.object({
  label: z.string().min(1),
  confidence: z.number().min(0).max(1),
  category: z.string().optional(),
});

export async function spaceRoutes(app: FastifyInstance) {
  // Spaces
  app.get('/api/v1/spaces', { preHandler: authMiddleware }, async (request) => {
    return prisma.space.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      include: { scans: { take: 1, orderBy: { scannedAt: 'desc' } } },
    });
  });

  app.post('/api/v1/spaces', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = spaceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const space = await prisma.space.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(space);
  });

  // Scans
  app.post('/api/v1/spaces/:spaceId/scans', { preHandler: authMiddleware }, async (request, reply) => {
    const { spaceId } = request.params as { spaceId: string };
    const parsed = scanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const space = await prisma.space.findFirst({ where: { id: spaceId, userId: request.userId } });
    if (!space) return reply.status(404).send({ error: 'Space not found' });

    const scan = await prisma.spaceScan.create({
      data: {
        spaceId,
        userId: request.userId!,
        beforePhotoUri: parsed.data.beforePhotoUri,
      },
    });

    return reply.status(201).send(scan);
  });

  app.post('/api/v1/scans/:scanId/complete', { preHandler: authMiddleware }, async (request, reply) => {
    const { scanId } = request.params as { scanId: string };
    const { afterPhotoUri, durationSeconds } = request.body as { afterPhotoUri?: string; durationSeconds?: number };

    const scan = await prisma.spaceScan.findFirst({ where: { id: scanId, userId: request.userId } });
    if (!scan) return reply.status(404).send({ error: 'Scan not found' });

    return prisma.spaceScan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        ...(afterPhotoUri ? { afterPhotoUri } : {}),
        ...(durationSeconds ? { durationSeconds } : {}),
      },
    });
  });

  // Detected items
  app.post('/api/v1/scans/:scanId/items', { preHandler: authMiddleware }, async (request, reply) => {
    const { scanId } = request.params as { scanId: string };
    const parsed = detectedItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const scan = await prisma.spaceScan.findFirst({ where: { id: scanId, userId: request.userId } });
    if (!scan) return reply.status(404).send({ error: 'Scan not found' });

    const item = await prisma.detectedItem.create({
      data: { scanId, ...parsed.data },
    });

    return reply.status(201).send(item);
  });

  app.post('/api/v1/items/:itemId/decide', { preHandler: authMiddleware }, async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    const { decision } = request.body as { decision: string };

    if (!['keep', 'donate', 'trash', 'sell', 'relocate'].includes(decision)) {
      return reply.status(400).send({ error: 'Invalid decision' });
    }

    const item = await prisma.detectedItem.findFirst({
      where: { id: itemId },
      include: { scan: true },
    });
    if (!item || item.scan.userId !== request.userId) {
      return reply.status(404).send({ error: 'Item not found' });
    }

    return prisma.detectedItem.update({
      where: { id: itemId },
      data: { decision, decidedAt: new Date() },
    });
  });
}
