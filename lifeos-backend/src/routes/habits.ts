import { Hono } from 'hono';
import { db } from '../db';
import { habits, habitCompletions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { HonoEnv } from '../types';

const flow = new Hono<HonoEnv>();

// Get all habits
flow.get('/habits', async (c) => {
  const userId = c.get('userId');
  const results = await db.select()
    .from(habits)
    .where(eq(habits.userId, userId));
    
  return c.json({ success: true, data: results });
});

// Complete a habit
flow.post('/habits/:id/complete', async (c) => {
  const userId = c.get('userId');
  const habitId = c.req.param('id');
  
  const completion = {
    id: crypto.randomUUID(),
    habitId,
    completedAt: new Date(),
  };
  
  await db.insert(habitCompletions).values(completion);
  
  // Logic for updating streaks would go here
  
  return c.json({ success: true, data: completion });
});

export default flow;
