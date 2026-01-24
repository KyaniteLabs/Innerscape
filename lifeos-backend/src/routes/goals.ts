import { Hono } from 'hono';
import { db } from '../db';
import { goals } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const goalsRoute = new Hono<HonoEnv>();

goalsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const results = await db.select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
    
  return c.json({ success: true, data: results });
});

goalsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const newGoal = {
    id: crypto.randomUUID(),
    userId,
    title: body.title,
    description: body.description || null,
    targetDate: body.targetDate ? new Date(body.targetDate) : null,
    category: body.category || 'Personal',
    createdAt: new Date(),
  };
  
  await db.insert(goals).values(newGoal);
  return c.json({ success: true, data: newGoal }, 201);
});

goalsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await db.update(goals)
    .set({
      progress: body.progress,
      status: body.status,
      updatedAt: new Date() // if we had updatedAt
    } as any)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
    
  return c.json({ success: true });
});

export default goalsRoute;
