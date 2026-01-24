import { Hono } from 'hono';
import { db } from '../db';
import { journalEntries } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { HonoEnv } from '../types';

const journal = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Journal Entries
 * Outputs: { success: true, data: JournalEntry[] }
 */
journal.get('/entries', async (c) => {
  const userId = c.get('userId');
  const results = await db.select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt));
    
  return c.json({ success: true, data: results });
});

/**
 * APEX Contract: Create Journal Entry
 * Inputs: { content, transcriptionSource, moodId, tags }
 */
journal.post('/entries', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  if (!body.content) {
    return c.json({ 
      success: false, 
      error: { code: 'VALIDATION_ERROR', message: 'Content is required' } 
    }, 400);
  }

  const newEntry = {
    id: crypto.randomUUID(),
    userId,
    content: body.content,
    transcriptionSource: body.transcriptionSource || 'typed',
    moodId: body.moodId || null,
    tags: body.tags ? JSON.stringify(body.tags) : null,
    createdAt: new Date(),
  };
  
  await db.insert(journalEntries).values(newEntry);
  console.log(`[APEX] Journal entry created for user ${userId}`);
  
  return c.json({ success: true, data: newEntry }, 201);
});

export default journal;
