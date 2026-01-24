import { Hono } from 'hono';
import { insights } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const insightsRoute = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Insights
 */
insightsRoute.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(desc(insights.createdAt));
      
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /insights error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch insights' } }, 500);
  }
});

/**
 * APEX Contract: Create Insight
 */
insightsRoute.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    const newInsight = {
      id: crypto.randomUUID(),
      userId,
      title: body.title,
      content: body.content,
      type: body.type || 'pattern',
      createdAt: new Date(),
    };
    
    await db.insert(insights).values(newInsight);
    return c.json({ success: true, data: newInsight }, 201);
  } catch (error) {
    console.error('[APEX] POST /insights error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create insight' } }, 500);
  }
});

/**
 * APEX Contract: Delete Insight
 */
insightsRoute.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(insights)
      .where(and(eq(insights.id, id), eq(insights.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /insights/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete insight' } }, 500);
  }
});

export default insightsRoute;
