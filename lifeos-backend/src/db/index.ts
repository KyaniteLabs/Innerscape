import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// This will be initialized with environment variables in Cloudflare Workers
const client = createClient({ 
  url: process.env.TURSO_CONNECTION_URL || 'file:local.db', 
  authToken: process.env.TURSO_AUTH_TOKEN 
});

export const db = drizzle(client, { schema });
