import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const checkInSchema = z.object({
  energyLevel: z.number().int().min(0).max(100),
  valence: z.enum(['pleasant', 'unpleasant', 'neutral']),
  feelingLabel: z.string().max(50).optional(),
  bodySensationNote: z.string().max(500).optional(),
  source: z.enum(['manual', 'inferred']).default('manual'),
});

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function computeEmotionalState(energyLevel: number, valence: string): string {
  const highEnergy = energyLevel >= 50;
  if (highEnergy && valence === 'pleasant') return 'high_energy_pleasant';
  if (highEnergy && valence !== 'pleasant') return 'high_energy_unpleasant';
  if (!highEnergy && valence === 'pleasant') return 'low_energy_pleasant';
  return 'low_energy_unpleasant';
}

export async function emotionalRoutes(app: FastifyInstance) {
  app.post('/api/v1/checkins', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = checkInSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const checkIn = await prisma.emotionalCheckIn.create({
      data: {
        userId: request.userId!,
        ...parsed.data,
      },
    });

    return reply.status(201).send(checkIn);
  });

  app.get('/api/v1/checkins', { preHandler: authMiddleware }, async (request) => {
    const { limit = '50', offset = '0' } = request.query as { limit?: string; offset?: string };

    const checkIns = await prisma.emotionalCheckIn.findMany({
      where: { userId: request.userId },
      orderBy: { timestamp: 'desc' },
      take: Math.min(Number(limit), 200),
      skip: Number(offset),
    });

    return checkIns;
  });

  app.get('/api/v1/context/current', { preHandler: authMiddleware }, async (request) => {
    const latestCheckIn = await prisma.emotionalCheckIn.findFirst({
      where: { userId: request.userId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestCheckIn) {
      return {
        checkIn: null,
        inferredFactors: {
          timeOfDay: getTimeOfDay(),
          sleepQuality: null,
          consecutiveLowEnergyDays: 0,
        },
        computedState: null,
      };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckIns = await prisma.emotionalCheckIn.findMany({
      where: {
        userId: request.userId,
        timestamp: { gte: sevenDaysAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    const consecutiveLowEnergy = recentCheckIns
      ? (() => {
          let count = 0;
          const byDate = new Map<string, boolean>();
          for (const ci of recentCheckIns) {
            const dateKey = ci.timestamp.toISOString().split('T')[0];
            if (!byDate.has(dateKey)) {
              byDate.set(dateKey, ci.energyLevel < 30);
            }
          }
          for (const [, isLow] of byDate) {
            if (isLow) count++;
            else break;
          }
          return count;
        })()
      : 0;

    return {
      checkIn: latestCheckIn,
      inferredFactors: {
        timeOfDay: getTimeOfDay(),
        sleepQuality: null,
        consecutiveLowEnergyDays: consecutiveLowEnergy,
      },
      computedState: computeEmotionalState(latestCheckIn.energyLevel, latestCheckIn.valence),
    };
  });

  app.get('/api/v1/checkins/timeline', { preHandler: authMiddleware }, async (request) => {
    const { days = '7' } = request.query as { days?: string };
    const daysBack = Math.min(Number(days), 90);

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const checkIns = await prisma.emotionalCheckIn.findMany({
      where: {
        userId: request.userId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    const byDate = new Map<string, { date: string; avgEnergy: number; checkIns: number; dominantValence: string }>();

    for (const ci of checkIns) {
      const dateKey = ci.timestamp.toISOString().split('T')[0];
      const existing = byDate.get(dateKey) || { date: dateKey, avgEnergy: 0, checkIns: 0, dominantValence: '' };
      existing.avgEnergy += ci.energyLevel;
      existing.checkIns += 1;
      byDate.set(dateKey, existing);
    }

    const valenceCounts = new Map<string, Map<string, number>>();
    for (const ci of checkIns) {
      const dateKey = ci.timestamp.toISOString().split('T')[0];
      if (!valenceCounts.has(dateKey)) valenceCounts.set(dateKey, new Map());
      const vc = valenceCounts.get(dateKey)!;
      vc.set(ci.valence, (vc.get(ci.valence) || 0) + 1);
    }

    const timeline = Array.from(byDate.values()).map((day) => {
      const vc = valenceCounts.get(day.date);
      let dominantValence = 'neutral';
      if (vc) {
        let max = 0;
        for (const [valence, count] of vc) {
          if (count > max) {
            max = count;
            dominantValence = valence;
          }
        }
      }
      return {
        date: day.date,
        averageEnergy: Math.round(day.avgEnergy / day.checkIns),
        dominantValence,
        checkInCount: day.checkIns,
      };
    });

    return timeline;
  });
}
