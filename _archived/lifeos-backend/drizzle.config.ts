import type { Config } from 'drizzle-kit';

// Use local SQLite by default, Turso if configured
const url = process.env.TURSO_CONNECTION_URL || 'file:local.db';
const isLocal = !process.env.TURSO_CONNECTION_URL || url === 'file:local.db';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // Use turso driver for remote, default for local
  ...(isLocal ? {} : { driver: 'turso' }),
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
