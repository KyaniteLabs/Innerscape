import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import { projects } from '../db/schema';
import { HonoEnv } from '../types';

const projectsRoute = new Hono<HonoEnv>();

// GET all projects
projectsRoute.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const results = await db.select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('[APEX] GET /projects error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch projects' } }, 500);
  }
});

// GET project by ID
projectsRoute.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    const results = await db.select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    
    if (results.length === 0) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
    }
    return c.json({ success: true, data: results[0] });
  } catch (error) {
    console.error('[APEX] GET /projects/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch project' } }, 500);
  }
});

// POST create project
projectsRoute.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const body = await c.req.json();
    
    if (!body.name) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } }, 400);
    }

    const newProject = {
      id: crypto.randomUUID(),
      userId,
      name: body.name,
      status: body.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(projects).values(newProject);
    return c.json({ success: true, data: newProject }, 201);
  } catch (error) {
    console.error('[APEX] POST /projects error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create project' } }, 500);
  }
});

// PATCH update project
projectsRoute.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await db.update(projects)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] PATCH /projects/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update project' } }, 500);
  }
});

// DELETE project
projectsRoute.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const id = c.req.param('id');
    
    await db.delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[APEX] DELETE /projects/:id error:', error);
    return c.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete project' } }, 500);
  }
});

export default projectsRoute;
