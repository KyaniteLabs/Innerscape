import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
