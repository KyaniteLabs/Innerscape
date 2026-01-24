import { Hono } from 'hono';
import { habits, habitCompletions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const flow = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Habits
 */
flow.get('/habits', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(habits)
      .where(eq(habits.userId, userId));
      
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /habits error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch habits' } }, 500);
  }
});

/**
 * APEX Contract: Create Habit
 */
flow.post('/habits', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    const newHabit = {
      id: crypto.randomUUID(),
      userId,
      name: body.name,
      frequency: body.frequency || 'daily',
      preferredEnergy: body.preferredEnergy || null,
      streak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(habits).values(newHabit);
    return c.json({ success: true, data: newHabit }, 201);
  } catch (error) {
    console.error('[APEX] POST /habits error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create habit' } }, 500);
  }
});

/**
 * APEX Contract: Complete Habit
 */
flow.post('/habits/:id/complete', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const habitId = c.req.param('id');
    
    const completion = {
      id: crypto.randomUUID(),
      habitId,
      completedAt: new Date(),
    };
    
    await db.insert(habitCompletions).values(completion);
    
    return c.json({ success: true, data: completion });
  } catch (error) {
    console.error('[APEX] POST /habits/:id/complete error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to complete habit' } }, 500);
  }
});

/**
 * APEX Contract: Patch Habit
 */
flow.patch('/habits/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await db.update(habits)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.preferredEnergy !== undefined && { preferredEnergy: body.preferredEnergy }),
        updatedAt: new Date(),
      })
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] PATCH /habits/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update habit' } }, 500);
  }
});

/**
 * APEX Contract: Delete Habit
 */
flow.delete('/habits/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /habits/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete habit' } }, 500);
  }
});

export default flow;
