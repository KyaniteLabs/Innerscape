import { Hono } from 'hono';
import { db } from '../db';
import { captures } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const brain = new Hono<HonoEnv>();

// Get all inbox items
brain.get('/inbox', async (c) => {
  const userId = c.get('userId');
  const results = await db.select()
    .from(captures)
    .where(
      and(
        eq(captures.userId, userId),
        eq(captures.status, 'inbox')
      )
    )
    .orderBy(desc(captures.createdAt));
    
  return c.json({ success: true, data: results });
});

// Capture something new
brain.post('/capture', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const newCapture = {
    id: crypto.randomUUID(),
    userId,
    content: body.content,
    type: body.type || 'idea',
    status: 'inbox',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.insert(captures).values(newCapture);
  
  return c.json({ success: true, data: newCapture });
});

export default brain;
