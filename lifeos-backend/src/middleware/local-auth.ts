import { Context, Next } from 'hono';
import { HonoEnv } from '../types';

/**
 * APEX Contract: Local Development Authentication
 * Purpose: Bypass Clerk auth for local testing
 * 
 * Usage: Set LOCAL_DEV=true in .dev.vars to enable
 * 
 * Inputs: X-Dev-User-Id header (optional, defaults to 'local-dev-user')
 * Outputs: Sets 'userId' in Hono context
 */

// APEX: Named constant for default test user
const DEFAULT_LOCAL_USER_ID = 'local-dev-user';

export const localAuth = async (c: Context<HonoEnv>, next: Next) => {
  // Allow custom user ID via header for testing multi-user scenarios
  const customUserId = c.req.header('X-Dev-User-Id');
  const userId = customUserId || DEFAULT_LOCAL_USER_ID;
  
  console.log(`[APEX] Local Auth: Using user ID "${userId}"`);
  
  c.set('userId', userId);
  await next();
};
