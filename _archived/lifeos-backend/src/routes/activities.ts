import { Hono } from 'hono';
import { activities } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const activitiesRoute = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Activity Feed
 * Inputs: None (Optional: limit, offset)
 * Outputs: ApiResponse<Activity[]>
 * Errors: DATABASE_ERROR
 */
activitiesRoute.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    
    // Optional query params
    const limit = Number(c.req.query('limit')) || 50;
    
    const results = await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
      
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /activities error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch activity feed' } }, 500);
  }
});

/**
 * APEX Contract: Record Activity
 * Inputs: { action, entityType, entityId, content, metadata }
 * Outputs: ApiResponse<Activity>
 * Errors: DATABASE_ERROR
 */
activitiesRoute.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    const newActivity = {
      id: crypto.randomUUID(),
      userId,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      content: body.content || null,
      metadata: body.metadata ? (typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata)) : null,
      timestamp: new Date(),
    };
    
    await db.insert(activities).values(newActivity);
    
    return c.json({ success: true, data: newActivity });
  } catch (error) {
    console.error('[APEX] POST /activities error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to record activity' } }, 500);
  }
});

export default activitiesRoute;
