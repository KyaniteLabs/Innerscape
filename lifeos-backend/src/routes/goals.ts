import { Hono } from 'hono';
import { goals } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const goalsRoute = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Goals
 * Inputs: None
 * Outputs: ApiResponse<Goal[]>
 * Errors: DATABASE_ERROR
 */
goalsRoute.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
      
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /goals error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch goals' } }, 500);
  }
});

/**
 * APEX Contract: Create Goal
 * Inputs: { title, description, targetDate, category }
 * Outputs: ApiResponse<Goal>
 * Errors: DATABASE_ERROR
 */
goalsRoute.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    const newGoal = {
      id: crypto.randomUUID(),
      userId,
      title: body.title,
      description: body.description || null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      category: body.category || 'Personal',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(goals).values(newGoal);
    return c.json({ success: true, data: newGoal }, 201);
  } catch (error) {
    console.error('[APEX] POST /goals error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create goal' } }, 500);
  }
});

/**
 * APEX Contract: Update Goal
 * Inputs: { id }, body: { progress, status, title, description }
 * Outputs: ApiResponse<void>
 * Errors: DATABASE_ERROR
 */
goalsRoute.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await db.update(goals)
      .set({
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        updatedAt: new Date(),
      })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
      
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] PATCH /goals/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update goal' } }, 500);
  }
});

export default goalsRoute;
