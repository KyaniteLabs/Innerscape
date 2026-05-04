import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateInsights } from '../services/insights.js';

const journalSchema = z.object({
  content: z.string().min(1).max(10000),
  tags: z.array(z.string()).default([]),
  linkedCheckIns: z.array(z.string()).default([]),
});

export async function journalRoutes(app: FastifyInstance) {
  app.post('/api/v1/journal/entries', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = journalSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const entry = await prisma.journalEntry.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(entry);
  });

  app.get('/api/v1/journal/entries', { preHandler: authMiddleware }, async (request) => {
    const { limit = '50', offset = '0' } = request.query as { limit?: string; offset?: string };

    return prisma.journalEntry.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 200),
      skip: Number(offset),
    });
  });

  app.get('/api/v1/journal/entries/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId: request.userId },
    });
    if (!entry) return reply.status(404).send({ error: 'Entry not found' });
    return entry;
  });

  app.delete('/api/v1/journal/entries/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await prisma.journalEntry.findFirst({ where: { id, userId: request.userId } });
    if (!entry) return reply.status(404).send({ error: 'Entry not found' });
    await prisma.journalEntry.delete({ where: { id } });
    return reply.status(204).send();
  });
}

const insightSchema = z.object({
  type: z.enum(['pattern', 'correlation', 'trend', 'warning']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  dataPoints: z.array(z.string()).default([]),
});

export async function insightRoutes(app: FastifyInstance) {
  app.get('/api/v1/insights', { preHandler: authMiddleware }, async (request) => {
    const { limit = '10', dismissed } = request.query as { limit?: string; dismissed?: string };

    return prisma.insight.findMany({
      where: {
        userId: request.userId,
        ...(dismissed === 'false' ? { dismissedAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 50),
    });
  });

  app.post('/api/v1/insights', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = insightSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const insight = await prisma.insight.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(insight);
  });

  app.post('/api/v1/insights/:id/dismiss', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const insight = await prisma.insight.findFirst({ where: { id, userId: request.userId } });
    if (!insight) return reply.status(404).send({ error: 'Insight not found' });

    const updated = await prisma.insight.update({
      where: { id },
      data: { dismissedAt: new Date() },
    });
    return updated;
  });

  app.post('/api/v1/insights/:id/act', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const insight = await prisma.insight.findFirst({ where: { id, userId: request.userId } });
    if (!insight) return reply.status(404).send({ error: 'Insight not found' });

    const updated = await prisma.insight.update({
      where: { id },
      data: { actedUponAt: new Date() },
    });
    return updated;
  });

  app.post('/api/v1/insights/generate', { preHandler: authMiddleware }, async (request) => {
    const candidates = await generateInsights(request.userId!);

    const created = [];
    for (const candidate of candidates) {
      const existing = await prisma.insight.findFirst({
        where: {
          userId: request.userId!,
          type: candidate.type,
          title: candidate.title,
          dismissedAt: null,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const insight = await prisma.insight.create({
          data: { userId: request.userId!, ...candidate },
        });
        created.push(insight);
      }
    }

    return { generated: created.length, insights: created };
  });
}
