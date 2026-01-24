/**
 * Database Tools for Agent
 * 
 * CRUD operations and context gathering from the Second Brain database.
 * Automatically generates embeddings for new items to enable semantic search.
 */

import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks, inboxLog } from "@/lib/db/schema";
import { eq, desc, or, like, sql } from "drizzle-orm";
import type { ToolExecutionResult } from "../types";
import { storeEmbedding } from "../embeddings";
import { CONFIG } from "@/lib/config";

// ===== Get Related Items =====

export async function getRelatedItems(
    itemId: string,
    itemType: string,
    options: { limit?: number; userId: string }
): Promise<ToolExecutionResult> {
    const { limit = 3, userId } = options;

    try {
        // First, get the source item to understand what we're relating to
        let sourceItem: { name: string; tags: string | null } | null = null;

        switch (itemType) {
            case "projects":
                const projectResult = await db
                    .select({ name: projects.name, tags: projects.tags })
                    .from(projects)
                    .where(eq(projects.id, itemId))
                    .limit(1);
                sourceItem = projectResult[0] ?? null;
                break;
            case "people":
                const peopleResult = await db
                    .select({ name: people.name, tags: people.tags })
                    .from(people)
                    .where(eq(people.id, itemId))
                    .limit(1);
                sourceItem = peopleResult[0] ?? null;
                break;
            case "ideas":
                const ideasResult = await db
                    .select({ name: ideas.name, tags: ideas.tags })
                    .from(ideas)
                    .where(eq(ideas.id, itemId))
                    .limit(1);
                sourceItem = ideasResult[0] ?? null;
                break;
        }

        if (!sourceItem) {
            return { success: false, error: "Source item not found" };
        }

        // Parse tags if they exist
        let tags: string[] = [];
        if (sourceItem.tags) {
            try {
                tags = JSON.parse(sourceItem.tags);
            } catch {
                tags = [];
            }
        }

        // Find related items by name similarity or shared tags
        const related: Array<{ id: string; type: string; name: string; relevance: string }> = [];

        // Search in projects (if not already a project)
        if (itemType !== "projects") {
            const projectMatches = await db
                .select({ id: projects.id, name: projects.name, tags: projects.tags })
                .from(projects)
                .where(eq(projects.userId, userId))
                .limit(limit);

            for (const p of projectMatches) {
                const pTags = p.tags ? JSON.parse(p.tags) : [];
                const sharedTags = tags.filter(t => pTags.includes(t));
                if (sharedTags.length > 0 || (sourceItem.name && p.name.toLowerCase().includes(sourceItem.name.toLowerCase().split(" ")[0]))) {
                    related.push({
                        id: p.id,
                        type: "projects",
                        name: p.name,
                        relevance: sharedTags.length > 0 ? `Shared tags: ${sharedTags.join(", ")}` : "Name match",
                    });
                }
            }
        }

        // Search in people (if not already a person)
        if (itemType !== "people") {
            const peopleMatches = await db
                .select({ id: people.id, name: people.name, tags: people.tags })
                .from(people)
                .where(eq(people.userId, userId))
                .limit(limit);

            for (const p of peopleMatches) {
                const pTags = p.tags ? JSON.parse(p.tags) : [];
                const sharedTags = tags.filter(t => pTags.includes(t));
                if (sharedTags.length > 0) {
                    related.push({
                        id: p.id,
                        type: "people",
                        name: p.name,
                        relevance: `Shared tags: ${sharedTags.join(", ")}`,
                    });
                }
            }
        }

        // Search in ideas (if not already an idea)
        if (itemType !== "ideas") {
            const ideaMatches = await db
                .select({ id: ideas.id, name: ideas.name, tags: ideas.tags })
                .from(ideas)
                .where(eq(ideas.userId, userId))
                .limit(limit);

            for (const i of ideaMatches) {
                const iTags = i.tags ? JSON.parse(i.tags) : [];
                const sharedTags = tags.filter(t => iTags.includes(t));
                if (sharedTags.length > 0) {
                    related.push({
                        id: i.id,
                        type: "ideas",
                        name: i.name,
                        relevance: `Shared tags: ${sharedTags.join(", ")}`,
                    });
                }
            }
        }

        return {
            success: true,
            data: related.slice(0, limit),
        };
    } catch (error) {
        console.error("[APEX] [Tools] getRelatedItems error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Database error",
        };
    }
}

// ===== Create Item =====

export async function createItem(
    type: string,
    data: Record<string, unknown>,
    userId: string
): Promise<ToolExecutionResult> {
    try {
        const now = new Date().toISOString();
        const dueDate = data.due_date as string || null;

        // --- Deduplication Safety Layer ---
        // Before creating, do a quick semantic check to see if we're about to create a duplicate
        const { searchSimilar } = await import("../embeddings");
        const similarItems = await searchSimilar(data.name as string, {
            limit: 1,
            type: type as any,
            threshold: 0.85, // High threshold for auto-dedup safety
        });

        if (similarItems.length > 0) {
            const bestMatch = similarItems[0];
            console.info(`[APEX] [Tools] Auto-deduplication: Found existing ${type} "${bestMatch.itemId}" similar to "${data.name}"`);
            
            // Instead of creating, we redirect to an update
            return updateItem(bestMatch.itemId, type, data, userId);
        }
        // ----------------------------------

        switch (type) {
            case "projects": {
                const [result] = await db.insert(projects).values({
                    name: data.name as string,
                    status: (data.status as "active" | "waiting" | "blocked" | "someday" | "completed") || "active",
                    nextAction: data.next_action as string || null,
                    notes: data.notes as string || null,
                    tags: data.tags ? JSON.stringify(data.tags) : null,
                    dueDate,
                    createdAt: now,
                    lastTouched: now,
                    userId,
                }).returning({ id: projects.id, name: projects.name });

                // Generate embedding for semantic search (async, don't block but track failures)
                const embeddingText = `${result.name} ${data.notes || ""} ${data.next_action || ""}`.trim();
                const embeddingResult = await storeEmbedding("projects", result.id, embeddingText)
                    .then(() => ({ success: true }))
                    .catch(err => {
                        console.error("[APEX] [Tools] Failed to store embedding for project:", result.id, err);
                        return { success: false, error: err instanceof Error ? err.message : "Embedding failed" };
                    });

                return {
                    success: true,
                    data: { id: result.id, type: "projects", name: result.name },
                    warning: embeddingResult.success ? undefined : "Embedding storage failed - semantic search may not find this item",
                };
            }

            case "people": {
                const [result] = await db.insert(people).values({
                    name: data.name as string,
                    context: data.context as string || null,
                    followUps: data.follow_ups as string || null,
                    tags: data.tags ? JSON.stringify(data.tags) : null,
                    dueDate,
                    createdAt: now,
                    lastTouched: now,
                    userId,
                }).returning({ id: people.id, name: people.name });

                // Generate embedding for semantic search (async, don't block but track failures)
                const embeddingText = `${result.name} ${data.context || ""} ${data.follow_ups || ""}`.trim();
                const embeddingResult = await storeEmbedding("people", result.id, embeddingText)
                    .then(() => ({ success: true }))
                    .catch(err => {
                        console.error("[APEX] [Tools] Failed to store embedding for person:", result.id, err);
                        return { success: false, error: err instanceof Error ? err.message : "Embedding failed" };
                    });

                return {
                    success: true,
                    data: { id: result.id, type: "people", name: result.name },
                    warning: embeddingResult.success ? undefined : "Embedding storage failed - semantic search may not find this item",
                };
            }

            case "ideas": {
                const [result] = await db.insert(ideas).values({
                    name: data.name as string,
                    oneLiner: data.one_liner as string || null,
                    notes: data.notes as string || null,
                    tags: data.tags ? JSON.stringify(data.tags) : null,
                    dueDate,
                    createdAt: now,
                    lastTouched: now,
                    userId,
                }).returning({ id: ideas.id, name: ideas.name });

                // Generate embedding for semantic search (async, don't block but track failures)
                const embeddingText = `${result.name} ${data.one_liner || ""} ${data.notes || ""}`.trim();
                const embeddingResult = await storeEmbedding("ideas", result.id, embeddingText)
                    .then(() => ({ success: true }))
                    .catch(err => {
                        console.error("[APEX] [Tools] Failed to store embedding for idea:", result.id, err);
                        return { success: false, error: err instanceof Error ? err.message : "Embedding failed" };
                    });

                return {
                    success: true,
                    data: { id: result.id, type: "ideas", name: result.name },
                    warning: embeddingResult.success ? undefined : "Embedding storage failed - semantic search may not find this item",
                };
            }

            case "admin": {
                const [result] = await db.insert(adminTasks).values({
                    name: data.name as string,
                    dueDate,
                    status: "todo",
                    notes: data.notes as string || null,
                    createdAt: now,
                    lastTouched: now,
                    userId,
                }).returning({ id: adminTasks.id, name: adminTasks.name });

                // Generate embedding for semantic search (async, don't block but track failures)
                const embeddingText = `${result.name} ${data.notes || ""}`.trim();
                const embeddingResult = await storeEmbedding("admin", result.id, embeddingText)
                    .then(() => ({ success: true }))
                    .catch(err => {
                        console.error("[APEX] [Tools] Failed to store embedding for admin task:", result.id, err);
                        return { success: false, error: err instanceof Error ? err.message : "Embedding failed" };
                    });

                return {
                    success: true,
                    data: { id: result.id, type: "admin", name: result.name },
                    warning: embeddingResult.success ? undefined : "Embedding storage failed - semantic search may not find this item",
                };
            }

            default:
                return {
                    success: false,
                    error: `Unknown item type: ${type}`,
                };
        }
    } catch (error) {
        console.error("[APEX] [Tools] createItem error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Database error",
        };
    }
}

// ===== Get Recent Context =====

export async function getRecentContext(options: {
    limit?: number;
    type?: string;
    userId: string;
}): Promise<ToolExecutionResult> {
    const { limit = 10, type = "all", userId } = options;

    try {
        const results: Array<{ id: string; type: string; name: string; capturedAt: string }> = [];

        // Get recent from inbox (most recent captures)
        const inboxItems = await db
            .select({
                id: inboxLog.id,
                filedTo: inboxLog.filedTo,
                createdAt: inboxLog.createdAt,
                originalText: inboxLog.originalText,
            })
            .from(inboxLog)
            .where(eq(inboxLog.userId, userId))
            .orderBy(desc(inboxLog.createdAt))
            .limit(limit);

        for (const item of inboxItems) {
            if (type === "all" || item.filedTo === type) {
                results.push({
                    id: item.id,
                    type: item.filedTo || "unknown",
                    name: item.originalText.substring(0, 50) + (item.originalText.length > 50 ? "..." : ""),
                    capturedAt: formatRelativeTime(item.createdAt),
                });
            }
        }

        // Also get recent items directly from each table for richer context
        if (type === "all" || type === "projects") {
            const recentProjects = await db
                .select({ id: projects.id, name: projects.name, lastTouched: projects.lastTouched })
                .from(projects)
                .where(eq(projects.userId, userId))
                .orderBy(desc(projects.lastTouched))
                .limit(3);

            for (const p of recentProjects) {
                if (!results.find(r => r.id === p.id)) {
                    results.push({
                        id: p.id,
                        type: "projects",
                        name: p.name,
                        capturedAt: formatRelativeTime(p.lastTouched),
                    });
                }
            }
        }

        if (type === "all" || type === "people") {
            const recentPeople = await db
                .select({ id: people.id, name: people.name, lastTouched: people.lastTouched })
                .from(people)
                .where(eq(people.userId, userId))
                .orderBy(desc(people.lastTouched))
                .limit(3);

            for (const p of recentPeople) {
                if (!results.find(r => r.id === p.id)) {
                    results.push({
                        id: p.id,
                        type: "people",
                        name: p.name,
                        capturedAt: formatRelativeTime(p.lastTouched),
                    });
                }
            }
        }

        // Sort by most recent and limit
        return {
            success: true,
            data: results.slice(0, limit),
        };
    } catch (error) {
        console.error("[APEX] [Tools] getRecentContext error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Database error",
        };
    }
}

// ===== Update Item =====

export async function updateItem(
    itemId: string,
    itemType: string,
    updates: Record<string, unknown>,
    userId: string
): Promise<ToolExecutionResult> {
    try {
        const now = new Date().toISOString();
        const { eq, and } = await import("drizzle-orm");

        switch (itemType) {
            case "projects": {
                // Get existing first to append notes if provided
                const [existing] = await db.select().from(projects).where(and(eq(projects.id, itemId), eq(projects.userId, userId))).limit(1);
                if (!existing) return { success: false, error: "Project not found" };

                const data: any = { lastTouched: now };
                if (updates.name) data.name = updates.name as string;
                if (updates.status) data.status = updates.status as any;
                if (updates.next_action) data.nextAction = updates.next_action as string;
                if (updates.due_date) data.dueDate = updates.due_date as string;
                
                // If notes are provided, append them
                if (updates.notes) {
                    data.notes = existing.notes ? `${existing.notes}\n\n[Update ${now}]: ${updates.notes}` : (updates.notes as string);
                }

                await db.update(projects).set(data).where(eq(projects.id, itemId));
                return { success: true, data: { id: itemId, type: "projects", name: data.name || existing.name } };
            }

            case "people": {
                const [existing] = await db.select().from(people).where(and(eq(people.id, itemId), eq(people.userId, userId))).limit(1);
                if (!existing) return { success: false, error: "Person not found" };

                const data: any = { lastTouched: now };
                if (updates.name) data.name = updates.name as string;
                if (updates.due_date) data.dueDate = updates.due_date as string;
                
                if (updates.context) {
                    data.context = existing.context ? `${existing.context}\n\n[Update ${now}]: ${updates.context}` : (updates.context as string);
                }
                if (updates.follow_ups) {
                    data.followUps = updates.follow_ups as string;
                }

                await db.update(people).set(data).where(eq(people.id, itemId));
                return { success: true, data: { id: itemId, type: "people", name: data.name || existing.name } };
            }

            case "ideas": {
                const [existing] = await db.select().from(ideas).where(and(eq(ideas.id, itemId), eq(ideas.userId, userId))).limit(1);
                if (!existing) return { success: false, error: "Idea not found" };

                const data: any = { lastTouched: now };
                if (updates.name) data.name = updates.name as string;
                if (updates.due_date) data.dueDate = updates.due_date as string;
                if (updates.one_liner) data.oneLiner = updates.one_liner as string;
                
                if (updates.notes) {
                    data.notes = existing.notes ? `${existing.notes}\n\n[Update ${now}]: ${updates.notes}` : (updates.notes as string);
                }

                await db.update(ideas).set(data).where(eq(ideas.id, itemId));
                return { success: true, data: { id: itemId, type: "ideas", name: data.name || existing.name } };
            }

            case "admin": {
                const data: any = { lastTouched: now };
                if (updates.name) data.name = updates.name as string;
                if (updates.due_date) data.dueDate = updates.due_date as string;
                if (updates.status) data.status = updates.status as string;
                
                if (updates.notes) {
                    const [existing] = await db.select().from(adminTasks).where(and(eq(adminTasks.id, itemId), eq(adminTasks.userId, userId))).limit(1);
                    if (existing) {
                        data.notes = existing.notes ? `${existing.notes}\n\n[Update ${now}]: ${updates.notes}` : (updates.notes as string);
                    } else {
                        data.notes = updates.notes as string;
                    }
                }

                await db.update(adminTasks).set(data).where(eq(adminTasks.id, itemId));
                return { success: true, data: { id: itemId, type: "admin" } };
            }

            default:
                return { success: false, error: `Unknown item type: ${itemType}` };
        }
    } catch (error) {
        console.error("[APEX] [Tools] updateItem error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Database error",
        };
    }
}

// ===== Helpers =====

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return "unknown";
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "unknown";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / CONFIG.UI.MINUTE_MS);
    const diffHours = Math.floor(diffMs / CONFIG.UI.HOUR_MS);
    const diffDays = Math.floor(diffMs / CONFIG.UI.DAY_MS);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
