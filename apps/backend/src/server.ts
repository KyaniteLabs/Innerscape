import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { prisma } from './db.js';
import { authRoutes } from './routes/auth.js';
import { emotionalRoutes } from './routes/emotional.js';
import { journalRoutes, insightRoutes } from './routes/journal.js';
import { habitRoutes, goalRoutes, dopamineRoutes } from './routes/flow.js';
import {
  bodyCheckInRoutes,
  somaticRoutes,
  sleepRoutes,
  spaceRoutes,
} from './routes/body.js';
import {
  captureRoutes,
  projectRoutes,
  knowledgeRoutes,
  reviewRoutes,
} from './routes/hub.js';
import {
  declutterSessionRoutes,
  declutterValuationRoutes,
  declutterAnalysisRoutes,
} from './routes/declutter.js';
import { tradeRoutes } from './routes/trade.js';

export { prisma };

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  const statusCode = (error as any).statusCode ?? 500;
  const message = statusCode >= 500 ? 'Internal server error' : (error as Error).message;
  reply.status(statusCode).send({ error: message });
});

app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({ error: 'Not found' });
});

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
await app.register(bodyCheckInRoutes);
await app.register(somaticRoutes);
await app.register(sleepRoutes);
await app.register(spaceRoutes);
await app.register(captureRoutes);
await app.register(projectRoutes);
await app.register(knowledgeRoutes);
await app.register(reviewRoutes);
await app.register(declutterSessionRoutes);
await app.register(declutterValuationRoutes);
await app.register(declutterAnalysisRoutes);
await app.register(tradeRoutes);

try {
  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
