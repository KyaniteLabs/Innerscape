/**
 * Single-user authentication stub
 * 
 * This is a personal tool - no multi-user auth needed.
 * All data belongs to a single user identified as "personal".
 * 
 * If you need multi-user support in the future, replace this
 * with a proper auth solution (Better Auth, NextAuth, Clerk, etc.)
 */

import { CONFIG } from "./config";

export const SINGLE_USER = {
    id: CONFIG.SINGLE_USER_ID,
    name: "Personal User",
} as const;

/**
 * Get current user - always returns the single user
 */
export function getCurrentUser() {
    return SINGLE_USER;
}

/**
 * For API routes that need user context
 * In single-user mode, this just returns the user ID
 */
export function getUserId(): string {
    return SINGLE_USER.id;
}
