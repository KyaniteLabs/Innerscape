import type { Database } from './db';

export type Bindings = {
  TURSO_CONNECTION_URL: string;
  TURSO_AUTH_TOKEN: string;
  CLERK_SECRET_KEY: string;
  DEEPGRAM_API_KEY?: string;
  LOCAL_DEV?: string; // Set to 'true' for local development without Clerk
};

export type Variables = {
  userId: string;
  db: Database;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

// Shared API response type (APEX: Single Source)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
