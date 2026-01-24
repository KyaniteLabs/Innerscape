/**
 * In-Memory Rate Limiter
 * 
 * Simple sliding window rate limiter for single-user deployment.
 * No external dependencies (Redis) required.
 * 
 * Usage:
 *   import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
 *   
 *   const result = rateLimit("capture", clientId);
 *   if (!result.success) {
 *       return new Response("Too many requests", { status: 429 });
 *   }
 */

import { CONFIG } from "./config";

// ===== Types =====

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp when the window resets
    retryAfter?: number; // Seconds until next request allowed
}

interface WindowEntry {
    count: number;
    windowStart: number;
}

// ===== Rate Limit Configuration =====

/**
 * Rate limits per route category
 * Format: { requests: number, windowMs: number }
 */
export const RATE_LIMITS = {
    // AI-heavy routes (cost money)
    capture: { requests: 20, windowMs: 60 * 1000 },      // 20/min
    chat: { requests: 30, windowMs: 60 * 1000 },         // 30/min
    classify: { requests: 20, windowMs: 60 * 1000 },     // 20/min
    optimize: { requests: 5, windowMs: 60 * 1000 },      // 5/min (heavy operation)
    summaries: { requests: 10, windowMs: 60 * 1000 },    // 10/min
    contentRefresh: { requests: 5, windowMs: 60 * 1000 }, // 5/min
    
    // Standard CRUD routes (lighter limits)
    standard: { requests: 100, windowMs: 60 * 1000 },    // 100/min
    
    // Analytics routes
    analytics: { requests: 60, windowMs: 60 * 1000 },    // 60/min
    
    // Burst protection (very short window)
    burst: { requests: 10, windowMs: 1000 },             // 10/sec
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMITS;

// ===== In-Memory Storage =====

// Map of "category:clientId" -> WindowEntry
const windows = new Map<string, WindowEntry>();

// Cleanup interval (clear old entries every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
    if (cleanupTimer) return;
    
    cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of windows.entries()) {
            // Remove entries older than 10 minutes
            if (now - entry.windowStart > 10 * 60 * 1000) {
                windows.delete(key);
            }
        }
    }, CLEANUP_INTERVAL_MS);
    
    // Don't keep the process alive just for cleanup
    if (cleanupTimer.unref) {
        cleanupTimer.unref();
    }
}

// Start cleanup on module load
startCleanup();

// ===== Rate Limiter =====

/**
 * Check rate limit for a request
 * 
 * @param category - The rate limit category (e.g., "capture", "chat")
 * @param clientId - Client identifier (IP, user ID, etc.)
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(
    category: RateLimitCategory,
    clientId: string = "default"
): RateLimitResult {
    const config = RATE_LIMITS[category];
    const key = `${category}:${clientId}`;
    const now = Date.now();
    
    let entry = windows.get(key);
    
    // If no entry or window expired, create new window
    if (!entry || now - entry.windowStart >= config.windowMs) {
        entry = {
            count: 1,
            windowStart: now,
        };
        windows.set(key, entry);
        
        return {
            success: true,
            limit: config.requests,
            remaining: config.requests - 1,
            reset: Math.ceil((now + config.windowMs) / 1000),
        };
    }
    
    // Window still active
    const remaining = config.requests - entry.count;
    const reset = Math.ceil((entry.windowStart + config.windowMs) / 1000);
    
    if (remaining <= 0) {
        // Rate limited
        const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);
        
        console.warn(
            `[APEX] [RateLimit] Rate limit exceeded for ${category}:${clientId}. ` +
            `Retry after ${retryAfter}s`
        );
        
        return {
            success: false,
            limit: config.requests,
            remaining: 0,
            reset,
            retryAfter,
        };
    }
    
    // Increment counter
    entry.count++;
    
    return {
        success: true,
        limit: config.requests,
        remaining: remaining - 1,
        reset,
    };
}

/**
 * Check multiple rate limits (e.g., both category-specific and burst protection)
 * Returns the most restrictive result
 */
export function rateLimitMultiple(
    categories: RateLimitCategory[],
    clientId: string = "default"
): RateLimitResult {
    let mostRestrictive: RateLimitResult | null = null;
    
    for (const category of categories) {
        const result = rateLimit(category, clientId);
        
        if (!result.success) {
            return result; // Immediately return if any limit exceeded
        }
        
        if (!mostRestrictive || result.remaining < mostRestrictive.remaining) {
            mostRestrictive = result;
        }
    }
    
    return mostRestrictive!;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
    };
    
    if (result.retryAfter !== undefined) {
        headers["Retry-After"] = String(result.retryAfter);
    }
    
    return headers;
}

/**
 * Create a rate-limited response (429 Too Many Requests)
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
        }),
        {
            status: CONFIG.HTTP.TOO_MANY_REQUESTS,
            headers: {
                "Content-Type": "application/json",
                ...getRateLimitHeaders(result),
            },
        }
    );
}

/**
 * Reset rate limit for a category (useful for testing)
 */
export function resetRateLimit(category: RateLimitCategory, clientId: string = "default"): void {
    const key = `${category}:${clientId}`;
    windows.delete(key);
}

/**
 * Reset all rate limits (useful for testing)
 */
export function resetAllRateLimits(): void {
    windows.clear();
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
    category: RateLimitCategory,
    clientId: string = "default"
): RateLimitResult {
    const config = RATE_LIMITS[category];
    const key = `${category}:${clientId}`;
    const now = Date.now();
    
    const entry = windows.get(key);
    
    if (!entry || now - entry.windowStart >= config.windowMs) {
        return {
            success: true,
            limit: config.requests,
            remaining: config.requests,
            reset: Math.ceil((now + config.windowMs) / 1000),
        };
    }
    
    const remaining = config.requests - entry.count;
    
    return {
        success: remaining > 0,
        limit: config.requests,
        remaining: Math.max(0, remaining),
        reset: Math.ceil((entry.windowStart + config.windowMs) / 1000),
        retryAfter: remaining <= 0 
            ? Math.ceil((entry.windowStart + config.windowMs - now) / 1000) 
            : undefined,
    };
}
