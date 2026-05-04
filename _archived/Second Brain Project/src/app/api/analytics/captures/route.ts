/**
 * Capture Analytics API
 * 
 * GET /api/analytics/captures - Get capture statistics and patterns
 * 
 * Query params:
 *   - period: "today" | "week" | "month" (default: "today")
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";

interface CaptureStats {
    todayCount: number;
    lastHourCount: number;
    byType: {
        projects: number;
        people: number;
        ideas: number;
        admin: number;
        needsReview: number;
    };
    voiceVsText: {
        voice: number;
        text: number;
    };
    lastCaptureAt: string | null;
}

interface ActivityPattern {
    peakHours: number[];
    averagePerDay: number;
    trend: "up" | "down" | "stable";
    totalThisWeek: number;
    capturesByHour: number[];
    capturesByDay: number[];
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "today";
        const userId = CONFIG.SINGLE_USER_ID;

        // Calculate time boundaries
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get today's captures
        const todayCaptures = await db
            .select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, userId),
                gte(inboxLog.createdAt, todayStart.toISOString())
            ));

        // Get last hour captures
        const lastHourCaptures = todayCaptures.filter(c => 
            c.createdAt && new Date(c.createdAt) >= hourAgo
        );

        // Count by type
        const byType = {
            projects: todayCaptures.filter(c => c.filedTo === "projects").length,
            people: todayCaptures.filter(c => c.filedTo === "people").length,
            ideas: todayCaptures.filter(c => c.filedTo === "ideas").length,
            admin: todayCaptures.filter(c => c.filedTo === "admin").length,
            needsReview: todayCaptures.filter(c => c.filedTo === "needs_review" || c.status === "needs_review").length,
        };

        // Voice vs text
        const voiceVsText = {
            voice: todayCaptures.filter(c => c.captureSource === "voice").length,
            text: todayCaptures.filter(c => c.captureSource !== "voice").length,
        };

        // Last capture
        const lastCapture = todayCaptures
            .filter(c => c.createdAt)
            .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];

        const stats: CaptureStats = {
            todayCount: todayCaptures.length,
            lastHourCount: lastHourCaptures.length,
            byType,
            voiceVsText,
            lastCaptureAt: lastCapture?.createdAt || null,
        };

        // Calculate activity patterns (last 7 days)
        const weekCaptures = await db
            .select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, userId),
                gte(inboxLog.createdAt, weekAgo.toISOString())
            ));

        // Captures by hour (0-23)
        const capturesByHour = Array(24).fill(0);
        weekCaptures.forEach(c => {
            if (c.createdAt) {
                const hour = new Date(c.createdAt).getHours();
                capturesByHour[hour]++;
            }
        });

        // Find peak hours (top 3)
        const peakHours = capturesByHour
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(h => h.hour);

        // Captures by day of week (0=Sun, 6=Sat)
        const capturesByDay = Array(7).fill(0);
        weekCaptures.forEach(c => {
            if (c.createdAt) {
                const day = new Date(c.createdAt).getDay();
                capturesByDay[day]++;
            }
        });

        // Calculate average per day
        const daysWithData = new Set(
            weekCaptures
                .filter(c => c.createdAt)
                .map(c => new Date(c.createdAt!).toDateString())
        ).size;
        const averagePerDay = daysWithData > 0 ? weekCaptures.length / daysWithData : 0;

        // Calculate trend (compare this week's first half to second half)
        const midWeek = new Date(weekAgo.getTime() + 3.5 * 24 * 60 * 60 * 1000);
        const firstHalf = weekCaptures.filter(c => 
            c.createdAt && new Date(c.createdAt) < midWeek
        ).length;
        const secondHalf = weekCaptures.filter(c => 
            c.createdAt && new Date(c.createdAt) >= midWeek
        ).length;

        let trend: "up" | "down" | "stable" = "stable";
        if (secondHalf > firstHalf * 1.2) trend = "up";
        else if (secondHalf < firstHalf * 0.8) trend = "down";

        const pattern: ActivityPattern = {
            peakHours,
            averagePerDay: Math.round(averagePerDay * 10) / 10,
            trend,
            totalThisWeek: weekCaptures.length,
            capturesByHour,
            capturesByDay,
        };

        return NextResponse.json({
            success: true,
            stats,
            pattern,
            period,
            generatedAt: now.toISOString(),
        });

    } catch (error) {
        console.error("[APEX] [Captures Analytics API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
