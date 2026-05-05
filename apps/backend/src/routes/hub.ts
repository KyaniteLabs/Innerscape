import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

// --- Capture Items (Universal Inbox) ---

const captureSchema = z.object({
  content: z.string().min(1).max(5000),
  contentType: z.enum(['text', 'voice', 'image', 'link']).default('text'),
  source: z.string().default('app'),
  tags: z.array(z.string()).default([]),
});

export async function captureRoutes(app: FastifyInstance) {
  app.post('/api/v1/capture', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = captureSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const item = await prisma.captureItem.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(item);
  });

  app.get('/api/v1/capture', { preHandler: authMiddleware }, async (request) => {
    const { status = 'pending' } = request.query as { status?: string };

    return prisma.captureItem.findMany({
      where: {
        userId: request.userId,
        ...(status ? { classificationStatus: status } : {}),
      },
      orderBy: { capturedAt: 'desc' },
    });
  });

  app.post('/api/v1/capture/:id/classify', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { module, type, confidence } = request.body as {
      module: string;
      type: string;
      confidence?: number;
    };

    const item = await prisma.captureItem.findFirst({ where: { id, userId: request.userId } });
    if (!item) return reply.status(404).send({ error: 'Capture item not found' });

    return prisma.captureItem.update({
      where: { id },
      data: {
        classificationStatus: 'classified',
        classifiedModule: module,
        classifiedType: type,
        classifiedConfidence: confidence ?? null,
      },
    });
  });

  app.delete('/api/v1/capture/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.captureItem.findFirst({ where: { id, userId: request.userId } });
    if (!item) return reply.status(404).send({ error: 'Capture item not found' });
    await prisma.captureItem.delete({ where: { id } });
    return reply.status(204).send();
  });
}

// --- Projects (PARA) ---

const projectSchema = z.object({
  name: z.string().min(1).max(200),
  area: z.enum(['projects', 'areas', 'resources', 'archives']).default('projects'),
  deadline: z.string().datetime().optional(),
});

export async function projectRoutes(app: FastifyInstance) {
  app.get('/api/v1/projects', { preHandler: authMiddleware }, async (request) => {
    const { status = 'active', area } = request.query as { status?: string; area?: string };

    return prisma.project.findMany({
      where: {
        userId: request.userId,
        ...(status ? { status } : {}),
        ...(area ? { area } : {}),
      },
      orderBy: { deadline: 'asc' },
    });
  });

  app.post('/api/v1/projects', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = projectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const project = await prisma.project.create({
      data: {
        userId: request.userId!,
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : new Date(),
      },
    });

    return reply.status(201).send(project);
  });

  app.post('/api/v1/projects/:id/archive', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await prisma.project.findFirst({ where: { id, userId: request.userId } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    return prisma.project.update({
      where: { id },
      data: { status: 'archived', area: 'archives' },
    });
  });
}

// --- Knowledge Base ---

const knowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  paraCategory: z.enum(['projects', 'areas', 'resources', 'archives']).default('resources'),
  tags: z.array(z.string()).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
});

export async function knowledgeRoutes(app: FastifyInstance) {
  app.get('/api/v1/knowledge', { preHandler: authMiddleware }, async (request) => {
    const { category, search } = request.query as { category?: string; search?: string };

    return prisma.knowledgeItem.findMany({
      where: {
        userId: request.userId,
        ...(category ? { paraCategory: category } : {}),
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { lastAccessedAt: 'desc' },
    });
  });

  app.post('/api/v1/knowledge', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = knowledgeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const item = await prisma.knowledgeItem.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(item);
  });

  app.get('/api/v1/knowledge/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.knowledgeItem.findFirst({ where: { id, userId: request.userId } });
    if (!item) return reply.status(404).send({ error: 'Item not found' });

    await prisma.knowledgeItem.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });

    return item;
  });

  app.delete('/api/v1/knowledge/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.knowledgeItem.findFirst({ where: { id, userId: request.userId } });
    if (!item) return reply.status(404).send({ error: 'Item not found' });
    await prisma.knowledgeItem.delete({ where: { id } });
    return reply.status(204).send();
  });
}

// --- Review Rituals ---

export async function reviewRoutes(app: FastifyInstance) {
  app.get('/api/v1/review/daily-summary', { preHandler: authMiddleware }, async (request) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [checkIns, completedHabits, tasksCompleted, captureCount, journalEntries] =
      await Promise.all([
        prisma.emotionalCheckIn.count({
          where: { userId: request.userId!, timestamp: { gte: today } },
        }),
        prisma.habit.count({
          where: {
            userId: request.userId!,
            lastCompletedAt: { gte: today },
          },
        }),
        prisma.task.count({
          where: {
            userId: request.userId!,
            completed: true,
            completedAt: { gte: today },
          },
        }),
        prisma.captureItem.count({
          where: {
            userId: request.userId!,
            capturedAt: { gte: today },
          },
        }),
        prisma.journalEntry.count({
          where: {
            userId: request.userId!,
            createdAt: { gte: today },
          },
        }),
      ]);

    return {
      date: today.toISOString(),
      emotionalCheckIns: checkIns,
      habitsCompleted: completedHabits,
      tasksCompleted,
      itemsCaptured: captureCount,
      journalEntries,
      totalActivity: checkIns + completedHabits + tasksCompleted + captureCount + journalEntries,
    };
  });

  app.get('/api/v1/review/weekly', { preHandler: authMiddleware }, async (request) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [avgEnergy, habitsCompleted, tasksDone, topTags] = await Promise.all([
      prisma.emotionalCheckIn.aggregate({
        where: { userId: request.userId!, timestamp: { gte: weekAgo } },
        _avg: { energyLevel: true },
        _count: true,
      }),
      prisma.habit.findMany({
        where: { userId: request.userId! },
        select: { name: true, streak: true, longestStreak: true },
      }),
      prisma.task.count({
        where: {
          userId: request.userId!,
          completed: true,
          completedAt: { gte: weekAgo },
        },
      }),
      prisma.journalEntry.findMany({
        where: { userId: request.userId!, createdAt: { gte: weekAgo } },
        select: { tags: true },
      }),
    ]);

    const allTags = topTags.flatMap((e) => e.tags);
    const tagCounts: Record<string, number> = {};
    for (const tag of allTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    return {
      weekStart: weekAgo.toISOString(),
      avgEnergy: Math.round((avgEnergy._avg.energyLevel || 0) * 10) / 10,
      checkInCount: avgEnergy._count,
      habits: habitsCompleted,
      tasksCompleted: tasksDone,
      topTags: Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
    };
  });
}
