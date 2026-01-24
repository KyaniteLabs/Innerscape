import { Hono } from 'hono';
import { journalEntries } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const journal = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Journal Entries
 */
journal.get('/entries', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
      
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /entries error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch journal entries' } }, 500);
  }
});

/**
 * APEX Contract: Create Journal Entry
 */
journal.post('/entries', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
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
      tags: body.tags ? (typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)) : null,
      createdAt: new Date(),
    };
    
    await db.insert(journalEntries).values(newEntry);
    
    return c.json({ success: true, data: newEntry }, 201);
  } catch (error) {
    console.error('[APEX] POST /entries error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create journal entry' } }, 500);
  }
});

/**
 * APEX Contract: Delete Journal Entry
 */
journal.delete('/entries/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /entries/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete entry' } }, 500);
  }
});

export default journal;
