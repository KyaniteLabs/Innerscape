import { Hono } from 'hono';
import { emotionalContext } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const feelings = new Hono<HonoEnv>();

/**
 * APEX Contract: Get All Check-ins
 */
feelings.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(emotionalContext)
      .where(eq(emotionalContext.userId, userId))
      .orderBy(desc(emotionalContext.timestamp));
      
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /feelings error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch feelings' } }, 500);
  }
});

/**
 * APEX Contract: Get Recent Mood
 */
feelings.get('/recent', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(emotionalContext)
      .where(eq(emotionalContext.userId, userId))
      .orderBy(desc(emotionalContext.timestamp))
      .limit(1);
      
    return c.json({ success: true, data: results[0] || null });
  } catch (error) {
    console.error('[APEX] GET /recent mood error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch mood' } }, 500);
  }
});

/**
 * APEX Contract: Post Check-in
 */
feelings.post('/check-in', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    const newCheckIn = {
      id: crypto.randomUUID(),
      userId,
      ...body,
      timestamp: new Date(),
    };
    
    await db.insert(emotionalContext).values(newCheckIn);
    
    return c.json({ success: true, data: newCheckIn });
  } catch (error) {
    console.error('[APEX] POST /check-in error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to save check-in' } }, 500);
  }
});

/**
 * APEX Contract: Delete Check-in
 */
feelings.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(emotionalContext)
      .where(and(eq(emotionalContext.id, id), eq(emotionalContext.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /feelings/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete check-in' } }, 500);
  }
});

export default feelings;
