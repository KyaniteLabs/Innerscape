/**
 * Today's Summary API
 * 
 * GET /api/summary/today
 * 
 * Returns a plain text summary of today's items, optimized for Siri/iOS Shortcuts.
 * Includes tasks due today, projects with upcoming deadlines, and recent captures.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminTasks, projects, ideas, inboxLog } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { formatErrorResponse } from "@/lib/errors";

// Get start and end of today
function getTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format") || "text"; // "text" or "json"
        
        const { start, end } = getTodayRange();
        const userId = CONFIG.SINGLE_USER_ID;

        // Get tasks due today (not done)
        const tasksDueToday = await db.select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.userId, userId),
                eq(adminTasks.status, "todo"),
                gte(adminTasks.dueDate, start),
                lte(adminTasks.dueDate, end)
            ));

        // Get all pending tasks (not done)
        const allPendingTasks = await db.select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.userId, userId),
                eq(adminTasks.status, "todo")
            ))
            .orderBy(adminTasks.dueDate);

        // Get active projects
        const activeProjects = await db.select()
            .from(projects)
            .where(and(
                eq(projects.userId, userId),
                eq(projects.status, "active")
            ));

        // Get today's captures
        const todaysCaptures = await db.select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, userId),
                gte(inboxLog.createdAt, start)
            ))
            .orderBy(desc(inboxLog.createdAt))
            .limit(5);

        // Get recent ideas (last 3)
        const recentIdeas = await db.select()
            .from(ideas)
            .where(eq(ideas.userId, userId))
            .orderBy(desc(ideas.createdAt))
            .limit(3);

        // Build response
        if (format === "json") {
            return NextResponse.json({
                success: true,
                summary: {
                    tasksDueToday: tasksDueToday.length,
                    totalPendingTasks: allPendingTasks.length,
                    activeProjects: activeProjects.length,
                    capturedToday: todaysCaptures.length,
                },
                tasksDueToday,
                allPendingTasks: allPendingTasks.slice(0, 10),
                activeProjects,
                todaysCaptures,
                recentIdeas,
            });
        }

        // Plain text format for Siri
        const lines: string[] = [];
        const today = new Date().toLocaleDateString("en-US", { 
            weekday: "long", 
            month: "long", 
            day: "numeric" 
        });
        
        lines.push(`Summary for ${today}`);
        lines.push("");

        // Tasks due today
        if (tasksDueToday.length > 0) {
            lines.push(`DUE TODAY (${tasksDueToday.length}):`);
            tasksDueToday.forEach(task => {
                lines.push(`  - ${task.name}`);
            });
            lines.push("");
        }

        // All pending tasks
        if (allPendingTasks.length > 0) {
            lines.push(`PENDING TASKS (${allPendingTasks.length}):`);
            allPendingTasks.slice(0, 5).forEach(task => {
                const due = task.dueDate 
                    ? ` (due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
                    : "";
                lines.push(`  - ${task.name}${due}`);
            });
            if (allPendingTasks.length > 5) {
                lines.push(`  ... and ${allPendingTasks.length - 5} more`);
            }
            lines.push("");
        }

        // Active projects
        if (activeProjects.length > 0) {
            lines.push(`ACTIVE PROJECTS (${activeProjects.length}):`);
            activeProjects.forEach(project => {
                lines.push(`  - ${project.name}`);
            });
            lines.push("");
        }

        // Today's captures
        if (todaysCaptures.length > 0) {
            lines.push(`CAPTURED TODAY (${todaysCaptures.length}):`);
            todaysCaptures.forEach(capture => {
                const preview = capture.originalText.substring(0, 50).replace(/\n/g, " ");
                lines.push(`  - ${preview}${capture.originalText.length > 50 ? "..." : ""}`);
            });
            lines.push("");
        }

        // Recent ideas
        if (recentIdeas.length > 0) {
            lines.push(`RECENT IDEAS:`);
            recentIdeas.forEach(idea => {
                lines.push(`  - ${idea.name}`);
            });
        }

        // If nothing
        if (lines.length <= 2) {
            lines.push("No tasks, projects, or captures found.");
            lines.push("Time to capture something new!");
        }

        // Return as plain text
        return new NextResponse(lines.join("\n"), {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });

    } catch (error) {
        const { body, status } = formatErrorResponse(error);
        
        // For text format, return plain text error
        if (error instanceof Error) {
            return new NextResponse(`Error: ${error.message}`, { 
                status,
                headers: { "Content-Type": "text/plain" }
            });
        }
        
        return NextResponse.json(body, { status });
    }
}
