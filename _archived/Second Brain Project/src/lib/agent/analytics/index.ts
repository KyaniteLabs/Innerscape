/**
 * META Analytics Module
 * 
 * Provides accuracy metrics, confusion patterns, and calibration data
 * for the self-improvement optimization loop.
 */

import { db } from "@/lib/db";
import { corrections, inboxLog, optimizationRuns } from "@/lib/db/schema";
import { desc, eq, and, gte, sql, count } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// ===== Types =====

export interface AccuracyMetrics {
    overall: number;                // % correct (no correction needed)
    totalClassifications: number;
    totalCorrections: number;
    byCategory: Record<string, CategoryMetrics>;
    confusionMatrix: ConfusionMatrix;
    confidenceCalibration: CalibrationBucket[];
    trend: TrendPoint[];
}

export interface CategoryMetrics {
    total: number;
    corrections: number;
    accuracy: number;
}

export interface ConfusionMatrix {
    categories: string[];
    matrix: number[][];  // matrix[i][j] = count of i → j corrections
}

export interface CalibrationBucket {
    range: string;       // e.g., "80-100%"
    minConfidence: number;
    maxConfidence: number;
    totalCount: number;
    correctCount: number;
    accuracy: number;
}

export interface TrendPoint {
    date: string;        // ISO date string (day)
    accuracy: number;
    totalItems: number;
    corrections: number;
}

export interface ConfusionPattern {
    from: string;
    to: string;
    count: number;
    percentage: number;
    examples: string[];  // Sample text snippets
}

export interface HealthMetrics {
    accuracy: number;
    correctionsToday: number;
    correctionsTrend: "improving" | "stable" | "declining";
    lastOptimization: string | null;
    healthScore: number;  // 0-100
    recommendations: string[];
}

// ===== Accuracy Metrics =====

/**
 * Get comprehensive accuracy metrics for the system
 */
export async function getAccuracyMetrics(days = 30): Promise<AccuracyMetrics> {
    const userId = CONFIG.SINGLE_USER_ID;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get total classifications in period
    const allItems = await db
        .select({
            id: inboxLog.id,
            filedTo: inboxLog.filedTo,
            confidence: inboxLog.confidence,
            createdAt: inboxLog.createdAt,
        })
        .from(inboxLog)
        .where(and(
            eq(inboxLog.userId, userId),
            gte(inboxLog.createdAt, startDateStr)
        ));

    // Get all corrections in period
    const allCorrections = await db
        .select()
        .from(corrections)
        .where(and(
            eq(corrections.userId, userId),
            gte(corrections.correctedAt, startDateStr)
        ));

    // Create lookup for corrected items
    const correctedIds = new Set(allCorrections.map(c => c.inboxId));

    // Calculate overall accuracy
    const totalClassifications = allItems.length;
    const totalCorrections = allCorrections.length;
    const overall = totalClassifications > 0 
        ? Math.round(((totalClassifications - totalCorrections) / totalClassifications) * 100) 
        : 100;

    // Calculate by-category metrics
    const byCategory = calculateCategoryMetrics(allItems, allCorrections);

    // Calculate confusion matrix
    const confusionMatrix = calculateConfusionMatrix(allCorrections);

    // Calculate confidence calibration
    const confidenceCalibration = calculateCalibration(allItems, correctedIds);

    // Calculate trend
    const trend = calculateTrend(allItems, allCorrections, days);

    return {
        overall,
        totalClassifications,
        totalCorrections,
        byCategory,
        confusionMatrix,
        confidenceCalibration,
        trend,
    };
}

/**
 * Calculate per-category accuracy metrics
 */
function calculateCategoryMetrics(
    items: Array<{ filedTo: string | null }>,
    corrections: Array<{ originalDestination: string }>
): Record<string, CategoryMetrics> {
    const categories = ["projects", "people", "ideas", "admin", "needs_review"];
    const result: Record<string, CategoryMetrics> = {};

    for (const cat of categories) {
        const catItems = items.filter(i => i.filedTo === cat);
        const catCorrections = corrections.filter(c => c.originalDestination === cat);
        
        const total = catItems.length;
        const correctionCount = catCorrections.length;
        const accuracy = total > 0 
            ? Math.round(((total - correctionCount) / total) * 100) 
            : 100;

        result[cat] = {
            total,
            corrections: correctionCount,
            accuracy,
        };
    }

    return result;
}

/**
 * Build confusion matrix from corrections
 */
function calculateConfusionMatrix(
    allCorrections: Array<{ originalDestination: string; correctedDestination: string }>
): ConfusionMatrix {
    const categories = ["projects", "people", "ideas", "admin", "needs_review"];
    const catIndex = Object.fromEntries(categories.map((c, i) => [c, i]));
    
    // Initialize matrix with zeros
    const matrix = categories.map(() => categories.map(() => 0));

    // Count corrections
    for (const corr of allCorrections) {
        const fromIdx = catIndex[corr.originalDestination];
        const toIdx = catIndex[corr.correctedDestination];
        if (fromIdx !== undefined && toIdx !== undefined) {
            matrix[fromIdx][toIdx]++;
        }
    }

    return { categories, matrix };
}

/**
 * Calculate confidence calibration buckets
 */
function calculateCalibration(
    items: Array<{ id: string; confidence: number | null }>,
    correctedIds: Set<string>
): CalibrationBucket[] {
    const buckets: CalibrationBucket[] = [
        { range: "0-40%", minConfidence: 0, maxConfidence: 40, totalCount: 0, correctCount: 0, accuracy: 0 },
        { range: "40-60%", minConfidence: 40, maxConfidence: 60, totalCount: 0, correctCount: 0, accuracy: 0 },
        { range: "60-80%", minConfidence: 60, maxConfidence: 80, totalCount: 0, correctCount: 0, accuracy: 0 },
        { range: "80-100%", minConfidence: 80, maxConfidence: 100, totalCount: 0, correctCount: 0, accuracy: 0 },
    ];

    for (const item of items) {
        const conf = item.confidence ?? 50; // Default to 50 if null
        const bucket = buckets.find(b => conf >= b.minConfidence && conf < b.maxConfidence) 
            || buckets[buckets.length - 1]; // 100% goes in last bucket
        
        bucket.totalCount++;
        if (!correctedIds.has(item.id)) {
            bucket.correctCount++;
        }
    }

    // Calculate accuracy for each bucket
    for (const bucket of buckets) {
        bucket.accuracy = bucket.totalCount > 0 
            ? Math.round((bucket.correctCount / bucket.totalCount) * 100) 
            : 100;
    }

    return buckets;
}

/**
 * Calculate accuracy trend over time
 */
function calculateTrend(
    items: Array<{ createdAt: string | null }>,
    corrections: Array<{ correctedAt: string | null; inboxId: string }>,
    days: number
): TrendPoint[] {
    const trend: TrendPoint[] = [];
    const correctionsByDate = new Map<string, number>();

    // Group corrections by date
    for (const corr of corrections) {
        if (corr.correctedAt) {
            const date = corr.correctedAt.split("T")[0];
            correctionsByDate.set(date, (correctionsByDate.get(date) || 0) + 1);
        }
    }

    // Group items by date
    const itemsByDate = new Map<string, number>();
    for (const item of items) {
        if (item.createdAt) {
            const date = item.createdAt.split("T")[0];
            itemsByDate.set(date, (itemsByDate.get(date) || 0) + 1);
        }
    }

    // Build trend for last N days (weekly buckets for readability)
    const today = new Date();
    for (let i = 0; i < Math.min(days, 30); i += 7) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        
        // Sum for week
        let weekItems = 0;
        let weekCorrections = 0;
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(date);
            dayDate.setDate(dayDate.getDate() - d);
            const dayStr = dayDate.toISOString().split("T")[0];
            weekItems += itemsByDate.get(dayStr) || 0;
            weekCorrections += correctionsByDate.get(dayStr) || 0;
        }

        const accuracy = weekItems > 0 
            ? Math.round(((weekItems - weekCorrections) / weekItems) * 100) 
            : 100;

        trend.push({
            date: dateStr,
            accuracy,
            totalItems: weekItems,
            corrections: weekCorrections,
        });
    }

    return trend.reverse(); // Oldest first
}

// ===== Confusion Patterns =====

/**
 * Get detailed confusion patterns for learning
 */
export async function getConfusionPatterns(limit = 10): Promise<ConfusionPattern[]> {
    const userId = CONFIG.SINGLE_USER_ID;

    // Get all corrections with text snippets
    const allCorrections = await db
        .select()
        .from(corrections)
        .where(eq(corrections.userId, userId))
        .orderBy(desc(corrections.correctedAt));

    // Group by from→to pairs
    const patternMap = new Map<string, { count: number; examples: string[] }>();
    
    for (const corr of allCorrections) {
        const key = `${corr.originalDestination}→${corr.correctedDestination}`;
        const existing = patternMap.get(key) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3 && corr.textSnippet) {
            existing.examples.push(corr.textSnippet);
        }
        patternMap.set(key, existing);
    }

    // Convert to array and sort by count
    const totalCorrections = allCorrections.length;
    const patterns: ConfusionPattern[] = [];

    for (const [key, data] of patternMap) {
        const [from, to] = key.split("→");
        patterns.push({
            from,
            to,
            count: data.count,
            percentage: totalCorrections > 0 
                ? Math.round((data.count / totalCorrections) * 100) 
                : 0,
            examples: data.examples,
        });
    }

    return patterns
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// ===== Health Metrics =====

/**
 * Get META health metrics for dashboard
 */
export async function getHealthMetrics(): Promise<HealthMetrics> {
    const userId = CONFIG.SINGLE_USER_ID;
    const today = new Date().toISOString().split("T")[0];

    // Get accuracy metrics
    const metrics = await getAccuracyMetrics(30);

    // Count today's corrections
    const todayCorrections = await db
        .select({ count: count() })
        .from(corrections)
        .where(and(
            eq(corrections.userId, userId),
            gte(corrections.correctedAt, today)
        ));

    // Get last optimization run
    const [lastOpt] = await db
        .select()
        .from(optimizationRuns)
        .where(eq(optimizationRuns.userId, userId))
        .orderBy(desc(optimizationRuns.runAt))
        .limit(1);

    // Determine trend
    let correctionsTrend: "improving" | "stable" | "declining" = "stable";
    if (metrics.trend.length >= 2) {
        const recent = metrics.trend[metrics.trend.length - 1];
        const previous = metrics.trend[metrics.trend.length - 2];
        if (recent.accuracy > previous.accuracy + 5) {
            correctionsTrend = "improving";
        } else if (recent.accuracy < previous.accuracy - 5) {
            correctionsTrend = "declining";
        }
    }

    // Calculate health score (weighted)
    const healthScore = Math.round(
        metrics.overall * 0.5 +  // Base accuracy
        (metrics.confidenceCalibration[3]?.accuracy || 100) * 0.3 +  // High-confidence calibration
        (correctionsTrend === "improving" ? 100 : correctionsTrend === "stable" ? 80 : 60) * 0.2
    );

    // Generate recommendations
    const recommendations = generateRecommendations(metrics, healthScore);

    return {
        accuracy: metrics.overall,
        correctionsToday: todayCorrections[0]?.count || 0,
        correctionsTrend,
        lastOptimization: lastOpt?.runAt || null,
        healthScore,
        recommendations,
    };
}

/**
 * Generate actionable recommendations based on metrics
 */
function generateRecommendations(metrics: AccuracyMetrics, healthScore: number): string[] {
    const recommendations: string[] = [];

    // Check overall accuracy
    if (metrics.overall < 80) {
        recommendations.push("Overall accuracy is below 80%. Consider reviewing common confusion patterns.");
    }

    // Check confidence calibration
    const highConfBucket = metrics.confidenceCalibration.find(b => b.range === "80-100%");
    if (highConfBucket && highConfBucket.accuracy < 90) {
        recommendations.push("High-confidence predictions have low accuracy. Model may be overconfident.");
    }

    // Check for problematic categories
    for (const [cat, data] of Object.entries(metrics.byCategory)) {
        if (data.total > 5 && data.accuracy < 70) {
            recommendations.push(`Category "${cat}" has low accuracy (${data.accuracy}%). Review classification criteria.`);
        }
    }

    // Check confusion matrix for common mistakes
    const { categories, matrix } = metrics.confusionMatrix;
    for (let i = 0; i < categories.length; i++) {
        for (let j = 0; j < categories.length; j++) {
            if (i !== j && matrix[i][j] >= 3) {
                recommendations.push(`Frequent confusion: "${categories[i]}" → "${categories[j]}" (${matrix[i][j]} times).`);
            }
        }
    }

    // Add positive feedback if doing well
    if (recommendations.length === 0 && healthScore >= 90) {
        recommendations.push("System is performing well. No immediate optimizations needed.");
    }

    return recommendations.slice(0, 5); // Limit to top 5
}
