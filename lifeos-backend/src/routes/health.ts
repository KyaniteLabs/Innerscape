import { Hono } from 'hono';
import { db } from '../db';
import { healthMetrics, sleepRecords } from '../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { HonoEnv } from '../types';

const health = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Sleep Records
 * Query: days (default 7)
 */
health.get('/sleep', async (c) => {
  const userId = c.get('userId');
  const days = parseInt(c.req.query('days') || '7');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.select()
    .from(sleepRecords)
    .where(and(
      eq(sleepRecords.userId, userId),
      gte(sleepRecords.startTime, startDate)
    ))
    .orderBy(desc(sleepRecords.startTime));
    
  return c.json({ success: true, data: results });
});

/**
 * APEX Contract: Sync Sleep Data
 */
health.post('/sleep', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const newRecord = {
    id: crypto.randomUUID(),
    userId,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime),
    quality: body.quality || null,
    source: body.source || 'manual',
  };
  
  await db.insert(sleepRecords).values(newRecord);
  return c.json({ success: true, data: newRecord }, 201);
});

/**
 * APEX Contract: Get Health Metrics
 */
health.get('/metrics', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');
  
  if (!type) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Metric type is required' } }, 400);
  }

  const results = await db.select()
    .from(healthMetrics)
    .where(and(eq(healthMetrics.userId, userId), eq(healthMetrics.type, type)))
    .orderBy(desc(healthMetrics.timestamp))
    .limit(100);
    
  return c.json({ success: true, data: results });
});

export default health;
