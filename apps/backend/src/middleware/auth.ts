import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../services/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.slice(7);
    const { userId } = await verifyToken(token);
    request.userId = userId;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}
