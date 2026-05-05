import type { FastifyReply } from 'fastify';

export function sendError(reply: FastifyReply, status: number, message: string) {
  return reply.status(status).send({ error: message });
}
