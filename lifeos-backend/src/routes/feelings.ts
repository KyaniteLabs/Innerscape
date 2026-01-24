import { Hono } from 'hono';
import { db } from '../db';
import { emotionalContext } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { HonoEnv } from '../types';

const feelings = new Hono<HonoEnv>();

// Get recent emotional context
feelings.get('/recent', async (c) => {
  const userId = c.get('userId'); // Assuming auth middleware sets this
  const results = await db.select()
    .from(emotionalContext)
    .where(eq(emotionalContext.userId, userId))
    .orderBy(desc(emotionalContext.timestamp))
    .limit(1);
    
  return c.json({ success: true, data: results[0] || null });
});

// Post new check-in
feelings.post('/check-in', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const newCheckIn = {
    id: crypto.randomUUID(),
    userId,
    ...body,
    timestamp: new Date(),
  };
  
  await db.insert(emotionalContext).values(newCheckIn);
  
  return c.json({ success: true, data: newCheckIn });
});

export default feelings;
