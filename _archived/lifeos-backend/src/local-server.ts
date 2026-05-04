/**
 * APEX Contract: Local Development Server
 * Purpose: Run the API locally with Node.js instead of Wrangler
 * 
 * Usage: npx tsx src/local-server.ts
 * 
 * This bypasses Cloudflare Workers restrictions and allows
 * direct SQLite file access for local development.
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db/schema';
import type { HonoEnv } from './types';

// Import routes
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

// APEX: Named constants
const PORT = 8787;
const LOCAL_USER_ID = 'local-dev-user';
const DB_PATH = 'file:local.db';

// Create database connection (local SQLite)
const client = createClient({ url: DB_PATH });
const db = drizzle({ client, schema });

// Create Hono app with proper typing
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

// Global error handler
app.onError((err, c) => {
  console.error('[APEX] Unhandled error:', err.message, err.stack);
  return c.json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  }, 500);
});

// Public route
app.get('/', (c) => c.json({ 
  name: 'Innerscape Cloud API (Local Dev)', 
  version: '1.0.0',
  mode: 'local-development',
  timestamp: new Date().toISOString()
}));

// Inject database and userId for all API routes
app.use('/api/*', async (c, next) => {
  // Inject database
  c.set('db', db);
  
  // Inject local dev user (no auth required)
  c.set('userId', LOCAL_USER_ID);
  
  console.log(`[APEX] Local Auth: Using user ID "${LOCAL_USER_ID}"`);
  await next();
});

// Routes
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

// Start server
console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       LifeOS Backend - Local Development Server             ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`[APEX] Database: ${DB_PATH}`);
console.log(`[APEX] User ID: ${LOCAL_USER_ID}`);
console.log(`[APEX] Starting server on http://localhost:${PORT}`);
console.log('');

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`[APEX] ✅ Server running at http://localhost:${info.port}`);
  console.log('');
  console.log('Test endpoints:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/api/flow/habits`);
  console.log(`  curl http://localhost:${PORT}/api/analytics/streaks`);
  console.log('');
});
