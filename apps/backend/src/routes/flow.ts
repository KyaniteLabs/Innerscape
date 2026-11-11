import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

// --- Habits ---

const habitSchema = z.object({
  name: z.string().min(1).max(100),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
});

export async function habitRoutes(app: FastifyInstance) {
  app.get('/api/v1/habits', { preHandler: authMiddleware }, async (request) => {
    return prisma.habit.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/api/v1/habits', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = habitSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const habit = await prisma.habit.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(habit);
  });

  app.post('/api/v1/habits/:id/complete', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const habit = await prisma.habit.findFirst({ where: { id, userId: request.userId } });
    if (!habit) return reply.status(404).send({ error: 'Habit not found' });

    const now = new Date();
    const lastCompleted = habit.lastCompletedAt;
    let newStreak = 1;

    if (lastCompleted) {
      const diffDays = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        newStreak = habit.streak + 1;
      }
    }

    const newLongest = Math.max(newStreak, habit.longestStreak);

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        streak: newStreak,
        longestStreak: newLongest,
        lastCompletedAt: now,
      },
    });

    return { ...updated, celebration: newStreak > habit.streak };
  });

  app.delete('/api/v1/habits/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const habit = await prisma.habit.findFirst({ where: { id, userId: request.userId } });
    if (!habit) return reply.status(404).send({ error: 'Habit not found' });
    await prisma.habit.delete({ where: { id } });
    return reply.status(204).send();
  });
}

// --- Goals & Tasks ---

const goalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  deadline: z.string().datetime().optional(),
  parentGoalId: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  goalId: z.string().optional(),
  estimatedDuration: z.number().int().min(1).default(25),
  dueDate: z.string().datetime().optional(),
});

export async function goalRoutes(app: FastifyInstance) {
  app.get('/api/v1/goals', { preHandler: authMiddleware }, async (request) => {
    const { status = 'active' } = request.query as { status?: string };
    return prisma.goal.findMany({
      where: { userId: request.userId, status },
      orderBy: { deadline: 'asc' },
    });
  });

  app.post('/api/v1/goals', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = goalSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: request.userId!,
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      },
    });

    return reply.status(201).send(goal);
  });

  app.get('/api/v1/tasks', { preHandler: authMiddleware }, async (request) => {
    const { goalId, completed } = request.query as { goalId?: string; completed?: string };

    return prisma.task.findMany({
      where: {
        userId: request.userId,
        ...(goalId ? { goalId } : {}),
        ...(completed !== undefined ? { completed: completed === 'true' } : {}),
      },
      orderBy: { dueDate: 'asc' },
    });
  });

  app.post('/api/v1/tasks', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = taskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const task = await prisma.task.create({
      data: {
        userId: request.userId!,
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
    });

    return reply.status(201).send(task);
  });

  app.post('/api/v1/tasks/:id/complete', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const task = await prisma.task.findFirst({ where: { id, userId: request.userId } });
    if (!task) return reply.status(404).send({ error: 'Task not found' });
    if (task.completed) return reply.status(400).send({ error: 'Already completed' });

    return prisma.task.update({
      where: { id },
      data: { completed: true, completedAt: new Date() },
    });
  });
}

// --- Dopamine Menu ---

const menuItemSchema = z.object({
  category: z.enum(['warm_up', 'deep_work', 'support', 'rest']),
  name: z.string().min(1).max(100),
  instructions: z.array(z.string()),
  estimatedDuration: z.number().int().min(1).default(15),
});

export async function dopamineRoutes(app: FastifyInstance) {
  app.get('/api/v1/dopamine-menu', { preHandler: authMiddleware }, async (request) => {
    const { category } = request.query as { category?: string };

    return prisma.dopamineMenuItem.findMany({
      where: {
        userId: request.userId,
        ...(category ? { category } : {}),
      },
      orderBy: { lastUsedAt: 'asc' },
    });
  });

  app.post('/api/v1/dopamine-menu', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = menuItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const item = await prisma.dopamineMenuItem.create({
      data: { userId: request.userId!, ...parsed.data },
    });

    return reply.status(201).send(item);
  });

  app.post('/api/v1/dopamine-menu/:id/use', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.dopamineMenuItem.findFirst({ where: { id, userId: request.userId } });
    if (!item) return reply.status(404).send({ error: 'Menu item not found' });

    return prisma.dopamineMenuItem.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  });
}
