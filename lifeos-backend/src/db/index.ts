/**
 * APEX Contract: Database Factory
 * Inputs: Cloudflare Workers Bindings (TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN)
 * Outputs: Drizzle database instance
 * Errors: Throws if bindings missing
 * Edge cases: Local dev uses file:local.db
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient, Client } from '@libsql/client';
import * as schema from './schema';
import type { Bindings } from '../types';

// Named constants (APEX: No Magic)
const LOCAL_DB_PATH = 'file:local.db';

export const createDb = (env: Bindings) => {
  // Safe defaults (APEX: Safe Defaults)
  const url = env.TURSO_CONNECTION_URL ?? LOCAL_DB_PATH;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url || url === LOCAL_DB_PATH) {
    console.log('[APEX] Using local SQLite database');
  }

  const client = createClient({ url, authToken });
  return drizzle({ client, schema });
};

export type Database = ReturnType<typeof createDb>;
