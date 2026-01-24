import { Context, Next } from 'hono';

export const apexLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const { method, url } = c.req;
  
  console.log(`[APEX] --> ${method} ${url}`);
  
  await next();
  
  const ms = Date.now() - start;
  console.log(`[APEX] <-- ${method} ${url} (${c.res.status}) - ${ms}ms`);
};
