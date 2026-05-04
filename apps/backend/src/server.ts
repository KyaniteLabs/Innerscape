import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.js';
import { emotionalRoutes } from './routes/emotional.js';
import { journalRoutes, insightRoutes } from './routes/journal.js';
import { habitRoutes, goalRoutes, dopamineRoutes } from './routes/flow.js';

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/v1', async () => ({
  name: 'Innerscape API',
  version: '0.1.0',
  status: 'operational',
}));

await app.register(authRoutes);
await app.register(emotionalRoutes);
await app.register(journalRoutes);
await app.register(insightRoutes);
await app.register(habitRoutes);
await app.register(goalRoutes);
await app.register(dopamineRoutes);

try {
  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
