/**
 * Hybrid Search Tool
 * 
 * Combines multiple scoring signals for optimal relevance:
 * - Semantic similarity (embeddings): 50%
 * - Keyword matching: 30%
 * - Recency: 20%
 * 
 * Falls back to keyword-only search if embeddings are not available.
 */

import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks } from "@/lib/db/schema";
import { eq, like, or, desc } from "drizzle-orm";
import type { ToolExecutionResult } from "../types";
import { CONFIG } from "@/lib/config";
import { searchSimilar, isEmbeddingsReady } from "../embeddings";

interface SearchResult {
    id: string;
    type: string;
    name: string;
    snippet: string;
    score: number;
    // Component scores for debugging/transparency
    semanticScore?: number;
    keywordScore?: number;
    recencyScore?: number;
    lastTouched?: string | null;
}

// Hybrid scoring weights
const WEIGHTS = {
    semantic: 0.5,
    keyword: 0.3,
    recency: 0.2,
};

// ===== Main Search Function =====

export async function searchSecondBrain(
    query: string,
    options: {
        limit?: number;
        type?: string;
        userId: string;
        useHybrid?: boolean; // Allow disabling hybrid for specific use cases
    }
): Promise<ToolExecutionResult> {
    const { limit = 5, type = "all", userId, useHybrid = true } = options;

    try {
        const embeddingsReady = await isEmbeddingsReady();
        
        if (embeddingsReady && useHybrid) {
            console.info("[APEX] [Search] Using hybrid search (semantic + keyword + recency)");
            const results = await hybridSearch(query, { limit, type, userId });
            return { success: true, data: results };
        } else if (embeddingsReady) {
            console.info("[APEX] [Search] Using semantic search");
            const results = await semanticSearch(query, { limit, type, userId });
            return { success: true, data: results };
        }

        // Fall back to keyword search with recency
        console.info("[APEX] [Search] Falling back to keyword + recency search");
        const results = await keywordSearch(query, { limit, type, userId });
        return { success: true, data: results };
    } catch (error) {
        console.error("[APEX] [Tools] searchSecondBrain error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Search error",
        };
    }
}

// ===== Hybrid Search (Semantic + Keyword + Recency) =====

async function hybridSearch(
    query: string,
    options: { limit: number; type: string; userId: string }
): Promise<SearchResult[]> {
    const { limit, type, userId } = options;
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    // Get all items with their metadata
    const allItems = await getAllItemsWithMetadata(type, userId);
    
    // Get semantic scores from embeddings
    const semanticType = type === "all" ? "all" : type as "projects" | "people" | "ideas" | "admin";
    const semanticResults: Map<string, number> = new Map();
    
    try {
        const embeddingResults = await searchSimilar(query, {
            limit: 50, // Get more for merging
            type: semanticType,
            threshold: 0.3, // Lower threshold to include more candidates
        });
        
        for (const result of embeddingResults) {
            const key = `${result.itemType}:${result.itemId}`;
            semanticResults.set(key, result.similarity);
        }
    } catch (error) {
        console.warn("[APEX] [HybridSearch] Semantic search failed:", error);
    }

    // Score each item
    const scoredItems: SearchResult[] = [];
    const now = Date.now();

    for (const item of allItems) {
        const key = `${item.type}:${item.id}`;
        
        // Semantic score (0-1)
        const semanticScore = semanticResults.get(key) || 0;
        
        // Keyword score (0-1)
        const keywordScore = calculateKeywordScore(item.searchText, keywords);
        
        // Recency score (0-1): items touched recently score higher
        const recencyScore = calculateRecencyScore(item.lastTouched, now);
        
        // Combined hybrid score
        const hybridScore = (
            semanticScore * WEIGHTS.semantic +
            keywordScore * WEIGHTS.keyword +
            recencyScore * WEIGHTS.recency
        );

        // Only include items with some relevance
        if (hybridScore > 0.1 || semanticScore > 0.4 || keywordScore > 0.3) {
            scoredItems.push({
                id: item.id,
                type: item.type,
                name: item.name,
                snippet: item.snippet,
                score: hybridScore,
                semanticScore,
                keywordScore,
                recencyScore,
                lastTouched: item.lastTouched,
            });
        }
    }

    // Sort by hybrid score and limit
    return scoredItems
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// ===== Get All Items with Metadata =====

interface ItemWithMetadata {
    id: string;
    type: string;
    name: string;
    snippet: string;
    searchText: string;
    lastTouched: string | null;
}

async function getAllItemsWithMetadata(
    type: string,
    userId: string
): Promise<ItemWithMetadata[]> {
    const items: ItemWithMetadata[] = [];

    // Fetch projects
    if (type === "all" || type === "projects") {
        const projectResults = await db
            .select({
                id: projects.id,
                name: projects.name,
                notes: projects.notes,
                nextAction: projects.nextAction,
                lastTouched: projects.lastTouched,
            })
            .from(projects)
            .where(eq(projects.userId, userId));

        for (const p of projectResults) {
            items.push({
                id: p.id,
                type: "projects",
                name: p.name,
                snippet: p.notes?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || p.nextAction || "",
                searchText: `${p.name} ${p.notes || ""} ${p.nextAction || ""}`,
                lastTouched: p.lastTouched,
            });
        }
    }

    // Fetch people
    if (type === "all" || type === "people") {
        const peopleResults = await db
            .select({
                id: people.id,
                name: people.name,
                context: people.context,
                followUps: people.followUps,
                lastTouched: people.lastTouched,
            })
            .from(people)
            .where(eq(people.userId, userId));

        for (const p of peopleResults) {
            items.push({
                id: p.id,
                type: "people",
                name: p.name,
                snippet: p.context?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || "",
                searchText: `${p.name} ${p.context || ""} ${p.followUps || ""}`,
                lastTouched: p.lastTouched,
            });
        }
    }

    // Fetch ideas
    if (type === "all" || type === "ideas") {
        const ideaResults = await db
            .select({
                id: ideas.id,
                name: ideas.name,
                oneLiner: ideas.oneLiner,
                notes: ideas.notes,
                lastTouched: ideas.lastTouched,
            })
            .from(ideas)
            .where(eq(ideas.userId, userId));

        for (const i of ideaResults) {
            items.push({
                id: i.id,
                type: "ideas",
                name: i.name,
                snippet: i.oneLiner || i.notes?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || "",
                searchText: `${i.name} ${i.oneLiner || ""} ${i.notes || ""}`,
                lastTouched: i.lastTouched,
            });
        }
    }

    // Fetch admin tasks
    if (type === "all" || type === "admin") {
        const adminResults = await db
            .select({
                id: adminTasks.id,
                name: adminTasks.name,
                notes: adminTasks.notes,
                lastTouched: adminTasks.lastTouched,
            })
            .from(adminTasks)
            .where(eq(adminTasks.userId, userId));

        for (const a of adminResults) {
            items.push({
                id: a.id,
                type: "admin",
                name: a.name,
                snippet: a.notes?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || "",
                searchText: `${a.name} ${a.notes || ""}`,
                lastTouched: a.lastTouched,
            });
        }
    }

    return items;
}

// ===== Recency Scoring =====

function calculateRecencyScore(lastTouched: string | null, now: number): number {
    if (!lastTouched) return 0.3; // Default score for items without lastTouched
    
    const touchedTime = new Date(lastTouched).getTime();
    const ageMs = now - touchedTime;
    const ageHours = ageMs / CONFIG.UI.HOUR_MS;
    
    // Scoring curve:
    // - Last hour: 1.0
    // - Last day: 0.8
    // - Last week: 0.5
    // - Last month: 0.3
    // - Older: 0.1
    
    if (ageHours < 1) return 1.0;
    if (ageHours < 24) return 0.8;
    if (ageHours < 24 * 7) return 0.5;
    if (ageHours < 24 * 30) return 0.3;
    return 0.1;
}

// ===== Keyword Search (Fallback) =====

async function keywordSearch(
    query: string,
    options: { limit: number; type: string; userId: string }
): Promise<SearchResult[]> {
    const { limit, type, userId } = options;
    const results: SearchResult[] = [];
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    const searchPattern = `%${query}%`;

    // Search projects
    if (type === "all" || type === "projects") {
        const projectResults = await db
            .select({
                id: projects.id,
                name: projects.name,
                notes: projects.notes,
                nextAction: projects.nextAction,
            })
            .from(projects)
            .where(eq(projects.userId, userId))
            .limit(limit);

        for (const p of projectResults) {
            const score = calculateKeywordScore(
                `${p.name} ${p.notes || ""} ${p.nextAction || ""}`,
                keywords
            );
            if (score > 0) {
                results.push({
                    id: p.id,
                    type: "projects",
                    name: p.name,
                    snippet: p.notes?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || p.nextAction || "",
                    score,
                });
            }
        }
    }

    // Search people
    if (type === "all" || type === "people") {
        const peopleResults = await db
            .select({
                id: people.id,
                name: people.name,
                context: people.context,
                followUps: people.followUps,
            })
            .from(people)
            .where(eq(people.userId, userId))
            .limit(limit);

        for (const p of peopleResults) {
            const score = calculateKeywordScore(
                `${p.name} ${p.context || ""} ${p.followUps || ""}`,
                keywords
            );
            if (score > 0) {
                results.push({
                    id: p.id,
                    type: "people",
                    name: p.name,
                    snippet: p.context?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || "",
                    score,
                });
            }
        }
    }

    // Search ideas
    if (type === "all" || type === "ideas") {
        const ideaResults = await db
            .select({
                id: ideas.id,
                name: ideas.name,
                oneLiner: ideas.oneLiner,
                notes: ideas.notes,
            })
            .from(ideas)
            .where(eq(ideas.userId, userId))
            .limit(limit);

        for (const i of ideaResults) {
            const score = calculateKeywordScore(
                `${i.name} ${i.oneLiner || ""} ${i.notes || ""}`,
                keywords
            );
            if (score > 0) {
                results.push({
                    id: i.id,
                    type: "ideas",
                    name: i.name,
                    snippet: i.oneLiner || i.notes?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || "",
                    score,
                });
            }
        }
    }

    // Search admin tasks
    if (type === "all" || type === "admin") {
        const adminResults = await db
            .select({
                id: adminTasks.id,
                name: adminTasks.name,
                notes: adminTasks.notes,
            })
            .from(adminTasks)
            .where(eq(adminTasks.userId, userId))
            .limit(limit);

        for (const a of adminResults) {
            const score = calculateKeywordScore(
                `${a.name} ${a.notes || ""}`,
                keywords
            );
            if (score > 0) {
                results.push({
                    id: a.id,
                    type: "admin",
                    name: a.name,
                    snippet: a.notes?.substring(0, CONFIG.AGENT.SNIPPET_LENGTH) || "",
                    score,
                });
            }
        }
    }

    // Sort by score and limit
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// ===== Semantic Search (When Embeddings Available) =====

async function semanticSearch(
    query: string,
    options: { limit: number; type: string; userId: string }
): Promise<SearchResult[]> {
    const { limit, type, userId } = options;

    try {
        // Search using embeddings
        const semanticType = type === "all" ? "all" : type as "projects" | "people" | "ideas" | "admin";
        const embeddingResults = await searchSimilar(query, {
            limit,
            type: semanticType,
            threshold: CONFIG.AGENT.SIMILARITY_THRESHOLD,
        });

        // Convert to SearchResult format and fetch names
        const results: SearchResult[] = [];

        for (const result of embeddingResults) {
            const name = await getItemName(result.itemType, result.itemId, userId);
            if (name) {
                results.push({
                    id: result.itemId,
                    type: result.itemType,
                    name,
                    snippet: result.textContent.substring(0, CONFIG.AGENT.SNIPPET_LENGTH),
                    score: result.similarity,
                });
            }
        }

        return results;
    } catch (error) {
        console.warn("[APEX] [Search] Semantic search failed, falling back to keyword:", error);
        return keywordSearch(query, options);
    }
}

async function getItemName(
    itemType: string,
    itemId: string,
    userId: string
): Promise<string | null> {
    try {
        switch (itemType) {
            case "projects": {
                const [result] = await db
                    .select({ name: projects.name })
                    .from(projects)
                    .where(eq(projects.id, itemId))
                    .limit(1);
                return result?.name || null;
            }
            case "people": {
                const [result] = await db
                    .select({ name: people.name })
                    .from(people)
                    .where(eq(people.id, itemId))
                    .limit(1);
                return result?.name || null;
            }
            case "ideas": {
                const [result] = await db
                    .select({ name: ideas.name })
                    .from(ideas)
                    .where(eq(ideas.id, itemId))
                    .limit(1);
                return result?.name || null;
            }
            case "admin": {
                const [result] = await db
                    .select({ name: adminTasks.name })
                    .from(adminTasks)
                    .where(eq(adminTasks.id, itemId))
                    .limit(1);
                return result?.name || null;
            }
            default:
                return null;
        }
    } catch {
        return null;
    }
}

// ===== Helpers =====

function calculateKeywordScore(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
            // Exact match
            score += 1;
            
            // Bonus for keyword at start
            if (lowerText.startsWith(keyword)) {
                score += 0.5;
            }
        }
    }

    // Normalize by number of keywords
    return keywords.length > 0 ? score / keywords.length : 0;
}

// ===== Re-export for convenience =====

export { isEmbeddingsReady as isSemanticSearchAvailable } from "../embeddings";
