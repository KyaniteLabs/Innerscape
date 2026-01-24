/**
 * Detailed Analytics API
 * 
 * GET /api/analytics/detailed - Get comprehensive analytics data
 * 
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * 
 * Returns activity, productivity, regulation, and health metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog, adminTasks, projects, corrections } from "@/lib/db/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { getHealthMetrics } from "@/lib/agent/analytics";

// ===== Types =====

interface ActivityMetrics {
    capturesByHour: number[];      // 24 values
    capturesByDay: number[];       // 7 values (Sun-Sat)
    capturesByType: Record<string, number>;
    voiceVsText: { voice: number; text: number };
    averagePerDay: number;
    totalThisWeek: number;
    totalThisMonth: number;
    trend: "up" | "down" | "stable";
    streakDays: number;
    peakHours: number[];           // top 3 hours
}

interface ProductivityMetrics {
    completionRate: number;
    avgTimeToComplete: number;     // hours
    peakHours: number[];           // top 3 hours
    projectsWithActivity: number;
    tasksCompletedThisWeek: number;
    tasksCreatedThisWeek: number;
}

interface RegulationMetrics {
    winddownCompletions: number;
    winddownCompletionRate: number;
    topTechniques: string[];
    avgSessionMinutes: number;
    lastWinddownAt: string | null;
}

interface HealthMetrics {
    accuracy: number;
    healthScore: number;
    trend: "improving" | "stable" | "declining";
    correctionRate: number;
    correctionsThisWeek: number;
    lastOptimization: string | null;
    recommendations: string[];
}

interface InsightData {
    type: "positive" | "neutral" | "action";
    title: string;
    description: string;
    metric?: string;
}

interface DetailedAnalytics {
    activity: ActivityMetrics;
    productivity: ProductivityMetrics;
    regulation: RegulationMetrics;
    health: HealthMetrics;
    insights: InsightData[];
    generatedAt: string;
    period: string;
}

// ===== Helper Functions =====

function calculateStreak(captures: { createdAt: string | null }[]): number {
    if (captures.length === 0) return 0;

    const capturesByDate = new Map<string, boolean>();
    captures.forEach(c => {
        if (c.createdAt) {
            const date = new Date(c.createdAt).toDateString();
            capturesByDate.set(date, true);
        }
    });

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toDateString();
        
        if (capturesByDate.has(dateStr)) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    return streak;
}

function generateInsights(
    activity: ActivityMetrics,
    productivity: ProductivityMetrics,
    regulation: RegulationMetrics,
    health: HealthMetrics
): InsightData[] {
    const insights: InsightData[] = [];

    // Activity insights
    if (activity.streakDays >= 7) {
        insights.push({
            type: "positive",
            title: "On a roll!",
            description: `You've captured thoughts for ${activity.streakDays} days in a row.`,
            metric: `${activity.streakDays} day streak`,
        });
    }

    if (activity.trend === "up") {
        insights.push({
            type: "positive",
            title: "Activity increasing",
            description: "You're capturing more thoughts than last week.",
        });
    } else if (activity.trend === "down") {
        insights.push({
            type: "neutral",
            title: "Activity slowing",
            description: "Capture count is lower than last week. That's okay!",
        });
    }

    // Peak hours insight
    if (productivity.peakHours.length > 0) {
        const peakHour = productivity.peakHours[0];
        const period = peakHour < 12 ? "morning" : peakHour < 17 ? "afternoon" : "evening";
        insights.push({
            type: "neutral",
            title: `Peak ${period} person`,
            description: `You're most active around ${peakHour}:00.`,
            metric: `${activity.capturesByHour[peakHour] || 0} captures`,
        });
    }

    // Productivity insights
    if (productivity.completionRate >= 70) {
        insights.push({
            type: "positive",
            title: "Great completion rate",
            description: "You're finishing what you start!",
            metric: `${productivity.completionRate.toFixed(0)}% tasks done`,
        });
    } else if (productivity.completionRate < 30 && productivity.tasksCreatedThisWeek > 5) {
        insights.push({
            type: "action",
            title: "Task buildup",
            description: "Consider reviewing your pending tasks.",
            metric: `${productivity.tasksCreatedThisWeek - productivity.tasksCompletedThisWeek} net new`,
        });
    }

    // Regulation insights
    if (regulation.winddownCompletionRate >= 80) {
        insights.push({
            type: "positive",
            title: "Wind down champion",
            description: "Your evening ritual is on point!",
            metric: `${regulation.winddownCompletions} this week`,
        });
    } else if (regulation.winddownCompletions === 0) {
        insights.push({
            type: "action",
            title: "Try wind down",
            description: "The evening ritual can help you rest better.",
        });
    }

    // Health insights
    if (health.accuracy >= 90) {
        insights.push({
            type: "positive",
            title: "High accuracy",
            description: "The AI is learning your preferences well.",
            metric: `${health.accuracy.toFixed(0)}% accurate`,
        });
    } else if (health.correctionRate > 20) {
        insights.push({
            type: "neutral",
            title: "Learning from corrections",
            description: "Your feedback is helping improve accuracy.",
            metric: `${health.correctionsThisWeek} corrections`,
        });
    }

    // Voice vs text insight
    const voiceRatio = activity.voiceVsText.voice / (activity.voiceVsText.voice + activity.voiceVsText.text || 1);
    if (voiceRatio > 0.5) {
        insights.push({
            type: "neutral",
            title: "Voice-first user",
            description: "You prefer speaking over typing.",
            metric: `${Math.round(voiceRatio * 100)}% voice`,
        });
    }

    return insights.slice(0, 6); // Max 6 insights
}

// ===== Main Handler =====

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get("days") || "30", 10);
        const userId = CONFIG.SINGLE_USER_ID;

        // Calculate time boundaries
        const now = new Date();
        const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const midWeek = new Date(weekAgo.getTime() + 3.5 * 24 * 60 * 60 * 1000);

        // ===== ACTIVITY METRICS =====
        
        const allCaptures = await db
            .select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, userId),
                gte(inboxLog.createdAt, periodStart.toISOString())
            ));

        const weekCaptures = allCaptures.filter(c => 
            c.createdAt && new Date(c.createdAt) >= weekAgo
        );

        // Captures by hour
        const capturesByHour = Array(24).fill(0);
        weekCaptures.forEach(c => {
            if (c.createdAt) {
                capturesByHour[new Date(c.createdAt).getHours()]++;
            }
        });

        // Peak hours
        const peakHours = capturesByHour
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .filter(h => h.count > 0)
            .map(h => h.hour);

        // Captures by day of week
        const capturesByDay = Array(7).fill(0);
        weekCaptures.forEach(c => {
            if (c.createdAt) {
                capturesByDay[new Date(c.createdAt).getDay()]++;
            }
        });

        // Captures by type
        const capturesByType: Record<string, number> = {
            projects: 0,
            people: 0,
            ideas: 0,
            admin: 0,
            needs_review: 0,
        };
        allCaptures.forEach(c => {
            if (c.filedTo && capturesByType[c.filedTo] !== undefined) {
                capturesByType[c.filedTo]++;
            }
        });

        // Voice vs text
        const voiceVsText = {
            voice: allCaptures.filter(c => c.captureSource === "voice").length,
            text: allCaptures.filter(c => c.captureSource !== "voice").length,
        };

        // Calculate average per day
        const daysWithData = new Set(
            allCaptures
                .filter(c => c.createdAt)
                .map(c => new Date(c.createdAt!).toDateString())
        ).size;
        const averagePerDay = daysWithData > 0 ? allCaptures.length / daysWithData : 0;

        // Calculate trend
        const firstHalf = weekCaptures.filter(c => 
            c.createdAt && new Date(c.createdAt) < midWeek
        ).length;
        const secondHalf = weekCaptures.filter(c => 
            c.createdAt && new Date(c.createdAt) >= midWeek
        ).length;

        let activityTrend: "up" | "down" | "stable" = "stable";
        if (secondHalf > firstHalf * 1.2) activityTrend = "up";
        else if (secondHalf < firstHalf * 0.8) activityTrend = "down";

        // Calculate streak
        const streakDays = calculateStreak(allCaptures);

        const activity: ActivityMetrics = {
            capturesByHour,
            capturesByDay,
            capturesByType,
            voiceVsText,
            averagePerDay: Math.round(averagePerDay * 10) / 10,
            totalThisWeek: weekCaptures.length,
            totalThisMonth: allCaptures.length,
            trend: activityTrend,
            streakDays,
            peakHours,
        };

        // ===== PRODUCTIVITY METRICS =====

        const allTasks = await db
            .select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.userId, userId),
                gte(adminTasks.createdAt, weekAgo.toISOString())
            ));

        const completedTasks = allTasks.filter(t => t.status === "done");
        const tasksCreatedThisWeek = allTasks.length;
        const tasksCompletedThisWeek = completedTasks.length;
        
        const completionRate = tasksCreatedThisWeek > 0 
            ? (tasksCompletedThisWeek / tasksCreatedThisWeek) * 100 
            : 0;

        // Projects with activity
        const activeProjects = await db
            .select()
            .from(projects)
            .where(and(
                eq(projects.userId, userId),
                eq(projects.status, "active")
            ));

        // Average time to complete (estimate from tasks)
        const avgTimeToComplete = 24; // Placeholder - would need timestamps

        const productivity: ProductivityMetrics = {
            completionRate: Math.round(completionRate),
            avgTimeToComplete,
            peakHours,
            projectsWithActivity: activeProjects.length,
            tasksCompletedThisWeek,
            tasksCreatedThisWeek,
        };

        // ===== REGULATION METRICS =====

        // Get winddown data from localStorage (would need API endpoint)
        // For now, use placeholder data
        const regulation: RegulationMetrics = {
            winddownCompletions: 0, // Would come from client-side tracking
            winddownCompletionRate: 0,
            topTechniques: [],
            avgSessionMinutes: 45,
            lastWinddownAt: null,
        };

        // ===== HEALTH METRICS =====

        let health: HealthMetrics;
        try {
            const metaHealth = await getHealthMetrics();
            
            // Count corrections this week
            const weekCorrections = await db
                .select({ count: count() })
                .from(corrections)
                .where(and(
                    eq(corrections.userId, userId),
                    gte(corrections.correctedAt, weekAgo.toISOString())
                ));

            health = {
                accuracy: metaHealth.accuracy,
                healthScore: metaHealth.healthScore,
                trend: metaHealth.correctionsTrend,
                correctionRate: metaHealth.correctionsToday > 0 ? (metaHealth.correctionsToday / 10) * 100 : 0, // Estimate
                correctionsThisWeek: weekCorrections[0]?.count || 0,
                lastOptimization: metaHealth.lastOptimization,
                recommendations: metaHealth.recommendations,
            };
        } catch {
            health = {
                accuracy: 0,
                healthScore: 0,
                trend: "stable",
                correctionRate: 0,
                correctionsThisWeek: 0,
                lastOptimization: null,
                recommendations: [],
            };
        }

        // ===== GENERATE INSIGHTS =====

        const insights = generateInsights(activity, productivity, regulation, health);

        // ===== RESPONSE =====

        const response: DetailedAnalytics = {
            activity,
            productivity,
            regulation,
            health,
            insights,
            generatedAt: now.toISOString(),
            period: `${days} days`,
        };

        return NextResponse.json({
            success: true,
            ...response,
        });

    } catch (error) {
        console.error("[APEX] [Detailed Analytics API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
