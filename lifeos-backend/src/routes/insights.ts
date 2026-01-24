import { Hono } from 'hono';
import { db } from '../db';
import { insights } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { HonoEnv } from '../types';

const insightsRoute = new Hono<HonoEnv>();

// Get all insights
insightsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const results = await db.select()
    .from(insights)
    .where(eq(insights.userId, userId))
    .orderBy(desc(insights.createdAt));
    
  return c.json({ success: true, data: results });
});

export default insightsRoute;
