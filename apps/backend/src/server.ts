import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/v1', async () => ({
  name: 'Innerscape API',
  version: '0.1.0',
  status: 'operational',
}));

try {
  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
