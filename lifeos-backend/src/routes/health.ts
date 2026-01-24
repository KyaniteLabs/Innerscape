import { Hono } from 'hono';
import { healthMetrics, sleepRecords } from '../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { HonoEnv } from '../types';

const health = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Sleep Records
 */
health.get('/sleep', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
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
  } catch (error) {
    console.error('[APEX] GET /sleep error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch sleep records' } }, 500);
  }
});

/**
 * APEX Contract: Sync Sleep Data
 */
health.post('/sleep', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
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
  } catch (error) {
    console.error('[APEX] POST /sleep error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to sync sleep record' } }, 500);
  }
});

/**
 * APEX Contract: Delete Sleep Record
 */
health.delete('/sleep/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(sleepRecords)
      .where(and(eq(sleepRecords.id, id), eq(sleepRecords.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /sleep/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete sleep record' } }, 500);
  }
});

/**
 * APEX Contract: Get Health Metrics
 */
health.get('/metrics', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
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
  } catch (error) {
    console.error('[APEX] GET /metrics error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch metrics' } }, 500);
  }
});

export default health;
