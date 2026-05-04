/**
 * Weekly Digest Generator
 * 
 * Generates a comprehensive weekly summary with trends, insights,
 * and actionable recommendations. Designed for weekly review sessions.
 */

import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks, inboxLog, corrections, agentMemory } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

export interface WeeklyDigest {
    weekStart: string;
    weekEnd: string;
    summary: {
        totalCaptures: number;
        capturesByDay: number[];
        capturesByType: {
            projects: number;
            people: number;
            ideas: number;
            admin: number;
        };
    };
    progress: {
        projectsStarted: number;
        projectsCompleted: number;
        tasksCompleted: number;
        tasksCreated: number;
        completionRate: number;
    };
    trends: {
        capturesTrend: "up" | "down" | "stable";
        mostActiveDay: string;
        peakHour: number | null;
        topTags: string[];
    };
    insights: Array<{
        type: "pattern" | "achievement" | "suggestion";
        message: string;
    }>;
    topItems: {
        projects: Array<{ name: string; status: string }>;
        ideas: Array<{ name: string; oneLiner: string | null }>;
        people: Array<{ name: string; context: string | null }>;
    };
    health: {
        classificationAccuracy: number;
        correctionsCount: number;
    };
}

/**
 * Generate weekly digest for a given week
 * @param weekStart Start of the week (defaults to last Sunday)
 */
export async function generateWeeklyDigest(
    weekStart?: Date
): Promise<WeeklyDigest> {
    const userId = CONFIG.SINGLE_USER_ID;
    
    // Calculate week boundaries
    if (!weekStart) {
        weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday
    }
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStartStr = weekStart.toISOString();
    const weekEndStr = weekEnd.toISOString();

    // Get captures by day
    const capturesByDay = await getCapturesByDay(userId, weekStartStr, weekEndStr);
    
    // Get captures by type
    const capturesByType = await getCapturesByType(userId, weekStartStr, weekEndStr);
    
    // Get progress metrics
    const progress = await getProgressMetrics(userId, weekStartStr, weekEndStr);
    
    // Get trends
    const trends = await getTrends(userId, weekStartStr, weekEndStr, capturesByDay);
    
    // Get top items
    const topItems = await getTopItems(userId, weekStartStr, weekEndStr);
    
    // Get health metrics
    const health = await getHealthMetrics(userId, weekStartStr, weekEndStr);
    
    // Generate insights
    const insights = generateInsights(capturesByType, progress, trends, health);

    const totalCaptures = Object.values(capturesByType).reduce((a, b) => a + b, 0);

    return {
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        summary: {
            totalCaptures,
            capturesByDay,
            capturesByType,
        },
        progress,
        trends,
        insights,
        topItems,
        health,
    };
}

// ===== Helper Functions =====

async function getCapturesByDay(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<number[]> {
    const results = await db
        .select({
            day: sql<string>`date(${inboxLog.createdAt})`,
            count: sql<number>`count(*)`,
        })
        .from(inboxLog)
        .where(and(
            eq(inboxLog.userId, userId),
            gte(inboxLog.createdAt, weekStart),
            lte(inboxLog.createdAt, weekEnd),
        ))
        .groupBy(sql`date(${inboxLog.createdAt})`)
        .orderBy(sql`date(${inboxLog.createdAt})`);

    // Fill in missing days with 0
    const captures: number[] = Array(7).fill(0);
    const startDate = new Date(weekStart);
    
    for (const result of results) {
        const resultDate = new Date(result.day);
        const dayIndex = Math.floor((resultDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
            captures[dayIndex] = result.count;
        }
    }
    
    return captures;
}

async function getCapturesByType(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<{ projects: number; people: number; ideas: number; admin: number }> {
    const results = await db
        .select({
            filedTo: inboxLog.filedTo,
            count: sql<number>`count(*)`,
        })
        .from(inboxLog)
        .where(and(
            eq(inboxLog.userId, userId),
            gte(inboxLog.createdAt, weekStart),
            lte(inboxLog.createdAt, weekEnd),
        ))
        .groupBy(inboxLog.filedTo);

    const byType = {
        projects: 0,
        people: 0,
        ideas: 0,
        admin: 0,
    };

    for (const r of results) {
        if (r.filedTo && r.filedTo in byType) {
            byType[r.filedTo as keyof typeof byType] = r.count;
        }
    }

    return byType;
}

async function getProgressMetrics(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<{
    projectsStarted: number;
    projectsCompleted: number;
    tasksCompleted: number;
    tasksCreated: number;
    completionRate: number;
}> {
    // Projects started this week
    const [projectsStartedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(and(
            eq(projects.userId, userId),
            gte(projects.createdAt, weekStart),
        ));
    const projectsStarted = projectsStartedResult?.count || 0;

    // Projects completed this week
    const [projectsCompletedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(and(
            eq(projects.userId, userId),
            eq(projects.status, "completed"),
            gte(projects.lastTouched, weekStart),
        ));
    const projectsCompleted = projectsCompletedResult?.count || 0;

    // Tasks created this week
    const [tasksCreatedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminTasks)
        .where(and(
            eq(adminTasks.userId, userId),
            gte(adminTasks.createdAt, weekStart),
        ));
    const tasksCreated = tasksCreatedResult?.count || 0;

    // Tasks completed this week
    const [tasksCompletedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminTasks)
        .where(and(
            eq(adminTasks.userId, userId),
            eq(adminTasks.status, "done"),
            gte(adminTasks.lastTouched, weekStart),
        ));
    const tasksCompleted = tasksCompletedResult?.count || 0;

    // Completion rate
    const completionRate = tasksCreated > 0 
        ? Math.round((tasksCompleted / tasksCreated) * 100) 
        : 0;

    return {
        projectsStarted,
        projectsCompleted,
        tasksCompleted,
        tasksCreated,
        completionRate,
    };
}

async function getTrends(
    userId: string,
    weekStart: string,
    weekEnd: string,
    capturesByDay: number[]
): Promise<{
    capturesTrend: "up" | "down" | "stable";
    mostActiveDay: string;
    peakHour: number | null;
    topTags: string[];
}> {
    // Capture trend (compare first half vs second half of week)
    const firstHalf = capturesByDay.slice(0, 4).reduce((a, b) => a + b, 0);
    const secondHalf = capturesByDay.slice(4).reduce((a, b) => a + b, 0);
    let capturesTrend: "up" | "down" | "stable" = "stable";
    if (secondHalf > firstHalf * 1.2) capturesTrend = "up";
    if (secondHalf < firstHalf * 0.8) capturesTrend = "down";

    // Most active day
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const maxDay = capturesByDay.indexOf(Math.max(...capturesByDay));
    const mostActiveDay = dayNames[maxDay];

    // Peak hour (from inbox log timestamps)
    const hourResults = await db
        .select({
            hour: sql<number>`strftime('%H', ${inboxLog.createdAt})`,
            count: sql<number>`count(*)`,
        })
        .from(inboxLog)
        .where(and(
            eq(inboxLog.userId, userId),
            gte(inboxLog.createdAt, weekStart),
            lte(inboxLog.createdAt, weekEnd),
        ))
        .groupBy(sql`strftime('%H', ${inboxLog.createdAt})`)
        .orderBy(desc(sql`count(*)`))
        .limit(1);

    const peakHour = hourResults.length > 0 ? hourResults[0].hour : null;

    // Top tags (from projects and ideas)
    const topTags: string[] = []; // Would need to parse JSON tags from DB

    return {
        capturesTrend,
        mostActiveDay,
        peakHour,
        topTags,
    };
}

async function getTopItems(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<{
    projects: Array<{ name: string; status: string }>;
    ideas: Array<{ name: string; oneLiner: string | null }>;
    people: Array<{ name: string; context: string | null }>;
}> {
    // Top projects (most recently touched)
    const topProjects = await db
        .select({ name: projects.name, status: projects.status })
        .from(projects)
        .where(and(
            eq(projects.userId, userId),
            gte(projects.lastTouched, weekStart),
        ))
        .orderBy(desc(projects.lastTouched))
        .limit(3);

    // Top ideas
    const topIdeas = await db
        .select({ name: ideas.name, oneLiner: ideas.oneLiner })
        .from(ideas)
        .where(and(
            eq(ideas.userId, userId),
            gte(ideas.createdAt, weekStart),
        ))
        .orderBy(desc(ideas.createdAt))
        .limit(3);

    // Top people
    const topPeople = await db
        .select({ name: people.name, context: people.context })
        .from(people)
        .where(and(
            eq(people.userId, userId),
            gte(people.lastTouched, weekStart),
        ))
        .orderBy(desc(people.lastTouched))
        .limit(3);

    return {
        projects: topProjects.map(p => ({ name: p.name, status: p.status || "active" })),
        ideas: topIdeas.map(i => ({ name: i.name, oneLiner: i.oneLiner })),
        people: topPeople.map(p => ({ name: p.name, context: p.context })),
    };
}

async function getHealthMetrics(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<{
    classificationAccuracy: number;
    correctionsCount: number;
}> {
    // Count corrections this week
    const [correctionsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(corrections)
        .where(and(
            eq(corrections.userId, userId),
            gte(corrections.correctedAt, weekStart),
        ));
    const correctionsCount = correctionsResult?.count || 0;

    // Total items classified this week
    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(inboxLog)
        .where(and(
            eq(inboxLog.userId, userId),
            eq(inboxLog.status, "filed"),
            gte(inboxLog.createdAt, weekStart),
        ));
    const totalFiled = totalResult?.count || 0;

    // Accuracy = (total - corrections) / total
    const classificationAccuracy = totalFiled > 0
        ? Math.round(((totalFiled - correctionsCount) / totalFiled) * 100)
        : 100;

    return {
        classificationAccuracy,
        correctionsCount,
    };
}

function generateInsights(
    capturesByType: { projects: number; people: number; ideas: number; admin: number },
    progress: { projectsStarted: number; tasksCompleted: number; completionRate: number },
    trends: { capturesTrend: string; mostActiveDay: string },
    health: { classificationAccuracy: number }
): Array<{ type: "pattern" | "achievement" | "suggestion"; message: string }> {
    const insights: Array<{ type: "pattern" | "achievement" | "suggestion"; message: string }> = [];

    // Achievement: Task completion
    if (progress.tasksCompleted >= 5) {
        insights.push({
            type: "achievement",
            message: `You completed ${progress.tasksCompleted} tasks this week! 🎉`,
        });
    }

    // Achievement: New projects
    if (progress.projectsStarted >= 2) {
        insights.push({
            type: "achievement",
            message: `${progress.projectsStarted} new projects started — you're building momentum`,
        });
    }

    // Pattern: Most captured type
    const topType = Object.entries(capturesByType).sort((a, b) => b[1] - a[1])[0];
    if (topType[1] > 3) {
        insights.push({
            type: "pattern",
            message: `${topType[0]} was your most captured type (${topType[1]} items)`,
        });
    }

    // Pattern: Most active day
    insights.push({
        type: "pattern",
        message: `Your most active day was ${trends.mostActiveDay}`,
    });

    // Suggestion: Low accuracy
    if (health.classificationAccuracy < 80) {
        insights.push({
            type: "suggestion",
            message: "Consider reviewing classification patterns — the AI is learning from your corrections",
        });
    }

    // Suggestion: Ideas building up
    if (capturesByType.ideas > 5) {
        insights.push({
            type: "suggestion",
            message: `You have ${capturesByType.ideas} new ideas — maybe pick one to explore this week?`,
        });
    }

    // Suggestion: Low task completion
    if (progress.completionRate < 50 && progress.tasksCompleted < progress.projectsStarted) {
        insights.push({
            type: "suggestion",
            message: "Focus on completing existing tasks before starting new projects",
        });
    }

    return insights.slice(0, 5); // Limit to 5 insights
}

/**
 * Store weekly digest in agent memory
 */
export async function storeWeeklyDigest(digest: WeeklyDigest): Promise<void> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = `weekly_digest_${digest.weekStart}`;
    const value = JSON.stringify(digest);

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
 * Format weekly digest for display
 */
export function formatWeeklyDigest(digest: WeeklyDigest): string {
    const lines: string[] = [];
    
    lines.push(`📊 **Weekly Digest** — ${digest.weekStart} to ${digest.weekEnd}`);
    lines.push("");
    
    lines.push("**Summary:**");
    lines.push(`• ${digest.summary.totalCaptures} total captures`);
    lines.push(`• ${digest.progress.tasksCompleted}/${digest.progress.tasksCreated} tasks completed (${digest.progress.completionRate}%)`);
    lines.push(`• ${digest.progress.projectsStarted} project${digest.progress.projectsStarted !== 1 ? "s" : ""} started`);
    lines.push("");
    
    if (digest.trends.mostActiveDay) {
        lines.push("**Trends:**");
        lines.push(`• Most active: ${digest.trends.mostActiveDay}`);
        lines.push(`• Momentum: ${digest.trends.capturesTrend === "up" ? "📈 Increasing" : digest.trends.capturesTrend === "down" ? "📉 Decreasing" : "➡️ Stable"}`);
        lines.push("");
    }
    
    if (digest.insights.length > 0) {
        lines.push("**Insights:**");
        digest.insights.slice(0, 3).forEach(insight => {
            const icon = insight.type === "achievement" ? "🏆" : insight.type === "pattern" ? "📊" : "💡";
            lines.push(`${icon} ${insight.message}`);
        });
        lines.push("");
    }
    
    if (digest.topItems.projects.length > 0) {
        lines.push("**Top Projects:**");
        digest.topItems.projects.forEach(p => {
            lines.push(`• ${p.name} (${p.status})`);
        });
    }
    
    return lines.join("\n");
}
