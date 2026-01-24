import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apexLogger } from './middleware/apex-logger';
import { errorHandler } from './middleware/error-handler';
import { clerkAuth } from './middleware/clerk-auth';
import { HonoEnv } from './types';
import feelings from './routes/feelings';
import brain from './routes/brain';
import flow from './routes/habits';
import journal from './routes/journal';
import health from './routes/health';
import goals from './routes/goals';
import insights from './routes/insights';

const app = new Hono<HonoEnv>();

// Middleware
app.use('*', cors());
app.use('*', apexLogger);
app.onError(errorHandler);

// Public Routes
app.get('/', (c) => c.text('Innerscape Cloud API v1.0'));

// Protected Routes
app.use('/api/*', clerkAuth);

app.route('/api/feelings', feelings);
app.route('/api/brain', brain);
app.route('/api/flow', flow);
app.route('/api/journal', journal);
app.route('/api/health', health);
app.route('/api/goals', goals);
app.route('/api/insights', insights);

export default app;
