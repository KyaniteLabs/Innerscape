import { Context, Next } from 'hono';
import { verifyToken } from '@clerk/backend';
import { HonoEnv } from '../types';

/**
 * APEX Contract: Clerk Authentication
 * Inputs: Authorization Header (Bearer <token>)
 * Outputs: Sets 'userId' in Hono context
 * Errors: 401 UNAUTHORIZED for missing/invalid tokens
 */
export const clerkAuth = async (c: Context<HonoEnv>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[APEX] Auth Failure: Missing Authorization header');
    return c.json({ 
      success: false, 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Missing authentication token' 
      } 
    }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    } as any);
    
    if (!payload.sub) throw new Error('Subject missing from token');
    
    c.set('userId', payload.sub);
    await next();
  } catch (err) {
    console.error('[APEX] Auth Failure: Invalid token', err);
    return c.json({ 
      success: false, 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Invalid or expired authentication token' 
      } 
    }, 401);
  }
};
