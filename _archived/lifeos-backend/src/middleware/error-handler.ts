import { Context } from 'hono';

export const errorHandler = (err: Error, c: Context) => {
  console.error(`[APEX] ERROR:`, err);
  
  const status = (err as any).status || 500;
  const code = (err as any).code || 'INTERNAL_SERVER_ERROR';
  
  return c.json({
    success: false,
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      details: (err as any).details || {}
    }
  }, status as any);
};
