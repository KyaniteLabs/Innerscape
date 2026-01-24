import { Hono } from 'hono';
import { habits, habitCompletions } from '../db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { HonoEnv } from '../types';

const flow = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Habits
 */
flow.get('/habits', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    
    // Get all habits for user
    const userHabits = await db.select()
      .from(habits)
      .where(eq(habits.userId, userId));
    
    if (userHabits.length === 0) {
      return c.json({ success: true, data: [] });
    }

    // Get today's completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completions = await db.select()
      .from(habitCompletions)
      .where(
        and(
          inArray(habitCompletions.habitId, userHabits.map(h => h.id)),
          gte(habitCompletions.completedAt, today)
        )
      );
    
    const completionSet = new Set(completions.map(c => c.habitId));
    
    // Map habits with completion status
    const data = userHabits.map(habit => ({
      ...habit,
      completedToday: completionSet.has(habit.id)
    }));
      
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[APEX] GET /habits error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch habits' } }, 500);
  }
});

/**
 * APEX Contract: Create Habit
 * Inputs: { name: string, frequency?: string, preferredEnergy?: number }
 * Outputs: ApiResponse<Habit>
 * Errors: VALIDATION_ERROR (missing name), DATABASE_ERROR
 */
flow.post('/habits', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    // APEX: Validate required inputs
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return c.json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Habit name is required' } 
      }, 400);
    }
    
    const newHabit = {
      id: crypto.randomUUID(),
      userId,
      name: body.name.trim(),
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
 * Inputs: habitId (path param)
 * Outputs: ApiResponse<HabitCompletion>
 * Errors: NOT_FOUND (habit doesn't exist or wrong user), DATABASE_ERROR
 */
flow.post('/habits/:id/complete', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const habitId = c.req.param('id');
    
    // APEX Security: Verify habit belongs to user before completing
    const [habit] = await db.select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1);
    
    if (!habit) {
      return c.json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Habit not found' } 
      }, 404);
    }
    
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
 * APEX Contract: Undo Habit Completion
 * Inputs: habitId (path param)
 * Outputs: ApiResponse<void>
 * Errors: NOT_FOUND (habit doesn't exist or wrong user), DATABASE_ERROR
 */
flow.delete('/habits/:id/complete', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const habitId = c.req.param('id');
    
    // APEX Security: Verify habit belongs to user before undoing
    const [habit] = await db.select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1);
    
    if (!habit) {
      return c.json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Habit not found' } 
      }, 404);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.delete(habitCompletions)
      .where(and(
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.completedAt, today)
      ));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /habits/:id/complete error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to undo habit completion' } }, 500);
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
