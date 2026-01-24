import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks, inboxLog } from "@/lib/db/schema";
import { eq, and, count, ne } from "drizzle-orm";

import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { getHealthMetrics } from "@/lib/agent/analytics";

/**
 * GET /api/stats
 * Get dashboard statistics
 */
export async function GET() {
    try {
        // Get counts for each category
        const [
            projectsCount,
            activeProjectsCount,
            peopleCount,
            ideasCount,
            adminCount,
            pendingAdminCount,
            inboxPendingCount,
            inboxNeedsReviewCount,
            totalCapturedCount,
        ] = await Promise.all([
            // Total projects
            db.select({ count: count() }).from(projects).where(eq(projects.userId, CONFIG.SINGLE_USER_ID)),
            // Active projects (not completed)
            db.select({ count: count() }).from(projects).where(and(
                eq(projects.userId, CONFIG.SINGLE_USER_ID),
                ne(projects.status, "completed")
            )),
            // People
            db.select({ count: count() }).from(people).where(eq(people.userId, CONFIG.SINGLE_USER_ID)),
            // Ideas
            db.select({ count: count() }).from(ideas).where(eq(ideas.userId, CONFIG.SINGLE_USER_ID)),
            // Admin tasks total
            db.select({ count: count() }).from(adminTasks).where(eq(adminTasks.userId, CONFIG.SINGLE_USER_ID)),
            // Pending admin tasks
            db.select({ count: count() }).from(adminTasks).where(and(
                eq(adminTasks.userId, CONFIG.SINGLE_USER_ID),
                eq(adminTasks.status, "todo")
            )),
            // Inbox pending
            db.select({ count: count() }).from(inboxLog).where(and(
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                eq(inboxLog.status, "pending")
            )),
            // Inbox needs review
            db.select({ count: count() }).from(inboxLog).where(and(
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                eq(inboxLog.status, "needs_review")
            )),
            // Total captured
            db.select({ count: count() }).from(inboxLog).where(eq(inboxLog.userId, CONFIG.SINGLE_USER_ID)),
        ]);

        // Get META health metrics (self-improvement system)
        let metaHealth = null;
        try {
            metaHealth = await getHealthMetrics();
        } catch (metaError) {
            console.warn("[APEX] [Stats API] META health metrics unavailable:", metaError);
        }

        return NextResponse.json({
            success: true,
            stats: {
                projects: {
                    total: projectsCount[0]?.count ?? 0,
                    active: activeProjectsCount[0]?.count ?? 0,
                },
                people: {
                    total: peopleCount[0]?.count ?? 0,
                },
                ideas: {
                    total: ideasCount[0]?.count ?? 0,
                },
                admin: {
                    total: adminCount[0]?.count ?? 0,
                    pending: pendingAdminCount[0]?.count ?? 0,
                },
                inbox: {
                    pending: inboxPendingCount[0]?.count ?? 0,
                    needsReview: inboxNeedsReviewCount[0]?.count ?? 0,
                    totalCaptured: totalCapturedCount[0]?.count ?? 0,
                },
                // META Self-Improvement System metrics
                meta: metaHealth ? {
                    accuracy: metaHealth.accuracy,
                    healthScore: metaHealth.healthScore,
                    correctionsToday: metaHealth.correctionsToday,
                    correctionsTrend: metaHealth.correctionsTrend,
                    lastOptimization: metaHealth.lastOptimization,
                    recommendations: metaHealth.recommendations.slice(0, 3),
                } : null,
            },
        });
    } catch (error) {
        console.error("[APEX] [Stats API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
