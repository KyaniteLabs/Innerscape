import bcryptjs from 'bcryptjs';
const { hash, compare } = bcryptjs;
import { SignJWT, jwtVerify } from 'jose';

const INSECURE_PRODUCTION_JWT_SECRETS = new Set([
  'change-me-in-production',
  'dev-only-jwt-secret-change-me',
  'ci-test-secret-do-not-use-in-production',
]);

function resolveJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production' && (!value || INSECURE_PRODUCTION_JWT_SECRETS.has(value))) {
    throw new Error('JWT_SECRET must be set to a non-placeholder value in production');
  }

  return new TextEncoder().encode(value || 'innerscape-local-test-jwt-secret');
}

const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

export async function signToken(payload: { userId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return { userId: payload.userId as string };
}
