import { Hono } from 'hono';
import { captures } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HonoEnv } from '../types';

const brain = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Inbox Items
 * Inputs: None
 * Outputs: ApiResponse<Capture[]>
 * Errors: DATABASE_ERROR
 */
brain.get('/inbox', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
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
  } catch (error) {
    console.error('[APEX] GET /inbox error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch inbox' } }, 500);
  }
});

/**
 * APEX Contract: Get Capture by ID
 */
brain.get('/captures/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    const results = await db.select()
      .from(captures)
      .where(and(eq(captures.id, id), eq(captures.userId, userId)));
    
    if (results.length === 0) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Capture not found' } }, 404);
    }
    
    return c.json({ success: true, data: results[0] });
  } catch (error) {
    console.error('[APEX] GET /captures/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch capture' } }, 500);
  }
});

/**
 * APEX Contract: Capture Something
 * Inputs: { content, type }
 * Outputs: ApiResponse<Capture>
 * Errors: DATABASE_ERROR
 */
brain.post('/capture', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
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
  } catch (error) {
    console.error('[APEX] POST /capture error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to capture item' } }, 500);
  }
});

/**
 * APEX Contract: Patch Capture
 */
brain.patch('/captures/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await db.update(captures)
      .set({
        ...(body.content !== undefined && { content: body.content }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.metadata !== undefined && { metadata: typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata) }),
        updatedAt: new Date(),
      })
      .where(and(eq(captures.id, id), eq(captures.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] PATCH /captures/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update capture' } }, 500);
  }
});

/**
 * APEX Contract: Delete Capture
 */
brain.delete('/captures/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(captures)
      .where(and(eq(captures.id, id), eq(captures.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /captures/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete capture' } }, 500);
  }
});

export default brain;
