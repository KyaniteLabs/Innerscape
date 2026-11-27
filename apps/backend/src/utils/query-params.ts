import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const WHOLE_NUMBER = 'must be a whole number';
const NOT_NEGATIVE = 'must be 0 or more';

/** A query-string value that has to be a whole number of 0 or more ("0", "50"). */
const nonNegativeInteger = z.coerce
  .number(WHOLE_NUMBER)
  .int(WHOLE_NUMBER)
  .min(0, NOT_NEGATIVE);

/**
 * `limit` and `offset` for a list route. An absent param takes the route's default, a `limit`
 * above `maxLimit` is lowered to it, and anything that is not a whole number is a client error.
 */
export function listQuery(defaultLimit: number, maxLimit: number) {
  const clamp = (value: number) => Math.min(value, maxLimit);
  return z.object({
    limit: nonNegativeInteger.default(defaultLimit).transform(clamp),
    offset: nonNegativeInteger.default(0),
  });
}

/**
 * `days` for a look-back window. Absent takes `defaultDays`; above `maxDays` it is lowered to
 * it. Without `maxDays` the window is not capped.
 */
export function daysQuery(defaultDays: number, maxDays = Number.MAX_SAFE_INTEGER) {
  const clamp = (value: number) => Math.min(value, maxDays);
  return z.object({
    days: nonNegativeInteger.default(defaultDays).transform(clamp),
  });
}

/**
 * Reads the query string with `schema` at the HTTP boundary. When a value is invalid it answers
 * 400 with `{ error: { <param>: [message] } }`, the shape the body routes already use, and
 * returns null so the caller stops there. Nothing invalid reaches Prisma.
 */
export function parseQuery<T extends z.ZodType>(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: T,
): z.output<T> | null {
  const parsed = schema.safeParse(request.query);
  if (!parsed.success) {
    reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    return null;
  }
  return parsed.data;
}
