/**
 * APEX Contract: Innerscape Cloud API
 * Entry point for Cloudflare Workers
 * Routes: /api/feelings, /api/brain, /api/flow, /api/journal, /api/health, /api/goals, /api/insights, /api/activities, /api/projects
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db';
import { clerkAuth } from './middleware/clerk-auth';
import { rateLimit } from './middleware/rate-limit';
import type { HonoEnv } from './types';

// Routes
import feelings from './routes/feelings';
import brain from './routes/brain';
import flow from './routes/habits';
import journal from './routes/journal';
import health from './routes/health';
import goals from './routes/goals';
import insights from './routes/insights';
import activities from './routes/activities';
import projectsRoute from './routes/projects';
import analytics from './routes/analytics';

const app = new Hono<HonoEnv>();

// Global middleware
app.use('*', cors());

// APEX Logger middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[APEX] ${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
});

// Global error handler (APEX: Observe - every failure visible)
app.onError((err, c) => {
  console.error('[APEX] Unhandled error:', err.message);
  return c.json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  }, 500);
});

// Public route
app.get('/', (c) => c.json({ 
  name: 'Innerscape Cloud API', 
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

// Database injection middleware (before auth)
app.use('/api/*', async (c, next) => {
  const db = createDb(c.env);
  c.set('db', db);
  await next();
});

// Auth middleware
app.use('/api/*', clerkAuth);

// Rate limit middleware
app.use('/api/*', rateLimit);

// Protected routes
app.route('/api/feelings', feelings);
app.route('/api/brain', brain);
app.route('/api/flow', flow);
app.route('/api/journal', journal);
app.route('/api/health', health);
app.route('/api/goals', goals);
app.route('/api/insights', insights);
app.route('/api/activities', activities);
app.route('/api/projects', projectsRoute);
app.route('/api/analytics', analytics);

export default app;
