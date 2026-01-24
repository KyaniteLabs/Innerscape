/**
 * Prompt Caching System
 * 
 * Caches static parts of system prompts to reduce redundant computation.
 * Dynamic parts (time, corrections, patterns) are still computed per-request.
 */

import { SYSTEM_PROMPT } from "./system";

// Cache structure
interface PromptCache {
    staticPrompt: string;
    staticPromptHash: string;
    cachedAt: number;
    ttlMs: number;
}

// In-memory cache
let promptCache: PromptCache | null = null;

// Cache TTL: 5 minutes for static parts
const STATIC_CACHE_TTL = 5 * 60 * 1000;

// Dynamic parts cache (shorter TTL)
interface DynamicPartsCache {
    patterns: string | null;
    examples: string | null;
    corrections: string | null;
    cachedAt: number;
}

let dynamicCache: DynamicPartsCache | null = null;
const DYNAMIC_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Simple hash function for change detection
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

/**
 * Get cached static prompt (the base SYSTEM_PROMPT)
 */
export function getCachedStaticPrompt(): string {
    const now = Date.now();
    
    if (promptCache && (now - promptCache.cachedAt) < promptCache.ttlMs) {
        return promptCache.staticPrompt;
    }
    
    // Refresh cache
    promptCache = {
        staticPrompt: SYSTEM_PROMPT,
        staticPromptHash: simpleHash(SYSTEM_PROMPT),
        cachedAt: now,
        ttlMs: STATIC_CACHE_TTL,
    };
    
    return promptCache.staticPrompt;
}

/**
 * Get cached dynamic parts (patterns, corrections, examples)
 * Returns null if cache is stale or empty
 */
export function getCachedDynamicParts(): DynamicPartsCache | null {
    const now = Date.now();
    
    if (dynamicCache && (now - dynamicCache.cachedAt) < DYNAMIC_CACHE_TTL) {
        return dynamicCache;
    }
    
    return null;
}

/**
 * Update dynamic parts cache
 */
export function updateDynamicPartsCache(parts: {
    patterns: string | null;
    examples: string | null;
    corrections: string | null;
}): void {
    dynamicCache = {
        ...parts,
        cachedAt: Date.now(),
    };
}

/**
 * Get optimized system prompt with caching
 * - Static parts are cached for 5 minutes
 * - Dynamic parts (patterns, corrections) are cached for 1 minute
 * - Temporal grounding is always fresh
 */
export async function getOptimizedSystemPrompt(): Promise<string> {
    // Always fresh temporal grounding
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });

    const temporalGrounding = `
## Temporal Grounding
**CRITICAL**: Use the following real-time clock for all relative date calculations (tomorrow, next week, etc.):
- **Today's Date**: ${dateString}
- **Current Time**: ${timeString}
- **Reference**: Any mention of "tomorrow" must be relative to this date.
`;

    // Get static prompt from cache
    const staticPrompt = getCachedStaticPrompt();
    
    // Check dynamic parts cache
    let dynamicParts = getCachedDynamicParts();
    
    if (!dynamicParts) {
        // Fetch fresh dynamic parts
        try {
            const { 
                getLearnedPatternsForPrompt, 
                getDisambiguationExamplesForPrompt,
                getRecentCorrectionsAsExamples 
            } = await import("../optimization/patterns");
            
            const [patterns, examples, corrections] = await Promise.all([
                getLearnedPatternsForPrompt(),
                getDisambiguationExamplesForPrompt(),
                getRecentCorrectionsAsExamples(10),
            ]);
            
            dynamicParts = {
                patterns: patterns || null,
                examples: examples || null,
                corrections: corrections || null,
                cachedAt: Date.now(),
            };
            
            // Update cache
            updateDynamicPartsCache(dynamicParts);
        } catch (error) {
            console.warn("[APEX] [PromptCache] Failed to load dynamic parts:", error);
            dynamicParts = {
                patterns: null,
                examples: null,
                corrections: null,
                cachedAt: Date.now(),
            };
        }
    }

    // Build meta section
    const metaSection: string[] = [temporalGrounding];
    
    if (dynamicParts.corrections) {
        metaSection.push(dynamicParts.corrections);
    }
    
    if (dynamicParts.patterns) {
        metaSection.push(`
## Learned Patterns (from user corrections)

These patterns have been learned from past corrections. Pay special attention:

${dynamicParts.patterns}`);
    }

    if (dynamicParts.examples) {
        metaSection.push(`
## Disambiguation Examples (from real corrections)

These examples show common confusions that have been corrected:

${dynamicParts.examples}`);
    }

    // Inject before Anti-Patterns section
    const insertPoint = staticPrompt.indexOf("## Anti-Patterns");
    if (insertPoint > 0 && metaSection.length > 0) {
        return (
            staticPrompt.slice(0, insertPoint) +
            metaSection.join("\n") +
            "\n\n" +
            staticPrompt.slice(insertPoint)
        );
    }

    return staticPrompt + "\n" + metaSection.join("\n");
}

/**
 * Invalidate all caches (useful after corrections are made)
 */
export function invalidatePromptCache(): void {
    promptCache = null;
    dynamicCache = null;
    console.info("[APEX] [PromptCache] Cache invalidated");
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
    staticCacheAge: number | null;
    dynamicCacheAge: number | null;
    isStaticCached: boolean;
    isDynamicCached: boolean;
} {
    const now = Date.now();
    
    return {
        staticCacheAge: promptCache ? now - promptCache.cachedAt : null,
        dynamicCacheAge: dynamicCache ? now - dynamicCache.cachedAt : null,
        isStaticCached: promptCache !== null && (now - promptCache.cachedAt) < STATIC_CACHE_TTL,
        isDynamicCached: dynamicCache !== null && (now - dynamicCache.cachedAt) < DYNAMIC_CACHE_TTL,
    };
}
