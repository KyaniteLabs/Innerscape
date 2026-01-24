export type Bindings = {
  TURSO_CONNECTION_URL: string;
  TURSO_AUTH_TOKEN: string;
  CLERK_SECRET_KEY: string;
  AI_MODEL_ENDPOINT: string;
};

export type Variables = {
  userId: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
