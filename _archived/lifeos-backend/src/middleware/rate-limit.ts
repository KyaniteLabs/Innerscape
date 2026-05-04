/**
 * @fileoverview Rate limiting middleware
 * @module middleware/rate-limit
 * 
 * APEX Contract:
 * - Inputs: Request context with userId
 * - Outputs: Passes through or returns 429
 * - Errors: 429 Too Many Requests when limit exceeded
 */

import { Context, Next } from 'hono';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = async (c: Context, next: Next) => {
  const userId = c.get('userId') as string | undefined;
  const key = userId || c.req.header('cf-connecting-ip') || 'anonymous';
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  if (record.count >= MAX_REQUESTS) {
    console.warn(`[APEX] Rate limit exceeded for ${key}`);
    return c.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      },
      429
    );
  }

  record.count++;
  await next();
};
