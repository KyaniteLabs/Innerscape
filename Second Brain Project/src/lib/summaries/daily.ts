/**
 * Daily Micro-Summary Generator
 * 
 * Generates a brief summary of the day's captures and patterns.
 * Designed to be non-overwhelming and ADHD-friendly.
 */

import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks, inboxLog, agentMemory } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

export interface DailySummary {
    date: string;
    captures: {
        total: number;
        byType: {
            projects: number;
            people: number;
            ideas: number;
            admin: number;
        };
    };
    highlights: string[];
    patterns: string[];
    suggestedActions: string[];
    topItems: Array<{
        type: string;
        name: string;
        capturedAt: string;
    }>;
}

/**
 * Generate a daily summary for a specific date
 */
export async function generateDailySummary(
    date: Date = new Date()
): Promise<DailySummary> {
    const userId = CONFIG.SINGLE_USER_ID;
    
    // Get date range for the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const dayStartStr = dayStart.toISOString();
    const dayEndStr = dayEnd.toISOString();

    // Count captures by type from inbox log
    const captures = await db
        .select({
            filedTo: inboxLog.filedTo,
            count: sql<number>`count(*)`,
        })
        .from(inboxLog)
        .where(and(
            eq(inboxLog.userId, userId),
            gte(inboxLog.createdAt, dayStartStr),
        ))
        .groupBy(inboxLog.filedTo);

    const byType = {
        projects: 0,
        people: 0,
        ideas: 0,
        admin: 0,
    };
    let total = 0;

    for (const cap of captures) {
        if (cap.filedTo && cap.filedTo in byType) {
            byType[cap.filedTo as keyof typeof byType] = cap.count;
        }
        total += cap.count;
    }

    // Get recent items created today
    const topItems: Array<{ type: string; name: string; capturedAt: string }> = [];

    // Get today's projects
    const todayProjects = await db
        .select({ name: projects.name, createdAt: projects.createdAt })
        .from(projects)
        .where(and(
            eq(projects.userId, userId),
            gte(projects.createdAt, dayStartStr),
        ))
        .orderBy(desc(projects.createdAt))
        .limit(3);
    
    for (const p of todayProjects) {
        topItems.push({ type: "Project", name: p.name, capturedAt: p.createdAt || "" });
    }

    // Get today's ideas
    const todayIdeas = await db
        .select({ name: ideas.name, createdAt: ideas.createdAt })
        .from(ideas)
        .where(and(
            eq(ideas.userId, userId),
            gte(ideas.createdAt, dayStartStr),
        ))
        .orderBy(desc(ideas.createdAt))
        .limit(3);
    
    for (const i of todayIdeas) {
        topItems.push({ type: "Idea", name: i.name, capturedAt: i.createdAt || "" });
    }

    // Get today's tasks
    const todayTasks = await db
        .select({ name: adminTasks.name, createdAt: adminTasks.createdAt })
        .from(adminTasks)
        .where(and(
            eq(adminTasks.userId, userId),
            gte(adminTasks.createdAt, dayStartStr),
        ))
        .orderBy(desc(adminTasks.createdAt))
        .limit(3);
    
    for (const t of todayTasks) {
        topItems.push({ type: "Task", name: t.name, capturedAt: t.createdAt || "" });
    }

    // Generate highlights based on captures
    const highlights: string[] = [];
    if (total > 0) {
        highlights.push(`You captured ${total} item${total !== 1 ? "s" : ""} today`);
    }
    if (byType.ideas >= 2) {
        highlights.push(`${byType.ideas} ideas captured — your brain was active!`);
    }
    if (byType.projects >= 1) {
        highlights.push(`${byType.projects} new project${byType.projects !== 1 ? "s" : ""} started`);
    }
    if (total === 0) {
        highlights.push("No captures today — that's okay, rest days matter too");
    }

    // Generate patterns
    const patterns: string[] = [];
    const mostCaptured = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    if (mostCaptured[1] > 0) {
        patterns.push(`Most captures: ${mostCaptured[0]} (${mostCaptured[1]})`);
    }

    // Generate suggested actions
    const suggestedActions: string[] = [];
    if (byType.admin > 3) {
        suggestedActions.push("Review your pending tasks — you added several today");
    }
    if (byType.ideas > 2) {
        suggestedActions.push("Review your ideas — maybe one is worth exploring further");
    }
    if (total === 0) {
        suggestedActions.push("Try a quick voice capture to start tomorrow");
    }

    return {
        date: date.toISOString().split("T")[0],
        captures: { total, byType },
        highlights,
        patterns,
        suggestedActions,
        topItems: topItems.slice(0, 5),
    };
}

/**
 * Store daily summary in agent memory
 */
export async function storeDailySummary(summary: DailySummary): Promise<void> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = `daily_summary_${summary.date}`;
    const value = JSON.stringify(summary);

    // Upsert
    const existing = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(agentMemory)
            .set({ value, updatedAt: new Date().toISOString() })
            .where(eq(agentMemory.id, existing[0].id));
    } else {
        await db.insert(agentMemory).values({
            userId,
            key,
            value,
        });
    }
}

/**
 * Get stored daily summary
 */
export async function getDailySummary(date: string): Promise<DailySummary | null> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = `daily_summary_${date}`;

    const [entry] = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    if (!entry) return null;

    try {
        return JSON.parse(entry.value);
    } catch {
        return null;
    }
}

/**
 * Format daily summary for display
 */
export function formatDailySummary(summary: DailySummary): string {
    const lines: string[] = [];
    
    lines.push(`📅 **Daily Summary** — ${summary.date}`);
    lines.push("");
    
    if (summary.highlights.length > 0) {
        lines.push("**Highlights:**");
        summary.highlights.forEach(h => lines.push(`• ${h}`));
        lines.push("");
    }
    
    if (summary.topItems.length > 0) {
        lines.push("**What You Captured:**");
        summary.topItems.slice(0, 3).forEach(item => {
            lines.push(`• ${item.type}: "${item.name}"`);
        });
        lines.push("");
    }
    
    if (summary.suggestedActions.length > 0) {
        lines.push("**Suggested Next:**");
        lines.push(`→ ${summary.suggestedActions[0]}`);
    }
    
    return lines.join("\n");
}
