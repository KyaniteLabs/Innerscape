/**
 * Optimization Scheduler for META Self-Improvement
 * 
 * Coordinates the periodic analysis of correction data,
 * updates learned patterns, and adjusts system parameters.
 */

import { db } from "@/lib/db";
import { optimizationRuns, agentMemory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { getAccuracyMetrics, getConfusionPatterns } from "../analytics";
import { 
    detectPatterns, 
    saveLearnedPatterns,
    LearnedPattern 
} from "./patterns";

// ===== Types =====

export interface OptimizationResult {
    id: string;
    accuracyBefore: number;
    accuracyAfter: number | null;  // null until next measurement
    changes: string[];
    patternsLearned: number;
    recommendations: string[];
    runAt: string;
}

export interface OptimizationConfig {
    minCorrectionsRequired: number;  // Minimum corrections before running
    maxPatternsToLearn: number;
    confidenceAdjustmentEnabled: boolean;
}

const DEFAULT_CONFIG: OptimizationConfig = {
    minCorrectionsRequired: 5,
    maxPatternsToLearn: 10,
    confidenceAdjustmentEnabled: true,
};

// ===== Optimization Cycle =====

/**
 * Run the full optimization cycle
 * 
 * 1. Analyze accuracy metrics
 * 2. Detect patterns from corrections
 * 3. Update learned patterns in memory
 * 4. Adjust confidence thresholds if needed
 * 5. Log the optimization run
 */
export async function runOptimizationCycle(
    config: Partial<OptimizationConfig> = {}
): Promise<OptimizationResult> {
    const opts = { ...DEFAULT_CONFIG, ...config };
    const userId = CONFIG.SINGLE_USER_ID;
    const changes: string[] = [];
    const recommendations: string[] = [];

    console.info("[APEX] [META] Starting optimization cycle...");

    // 1. Get current metrics
    const metrics = await getAccuracyMetrics(30);
    const accuracyBefore = metrics.overall;

    console.info(`[APEX] [META] Current accuracy: ${accuracyBefore}%`);

    // Check if we have enough data
    if (metrics.totalCorrections < opts.minCorrectionsRequired) {
        console.info(`[APEX] [META] Not enough corrections (${metrics.totalCorrections}/${opts.minCorrectionsRequired}). Skipping optimization.`);
        return {
            id: crypto.randomUUID(),
            accuracyBefore,
            accuracyAfter: null,
            changes: ["Skipped: insufficient correction data"],
            patternsLearned: 0,
            recommendations: ["Continue using the system to generate more training data"],
            runAt: new Date().toISOString(),
        };
    }

    // 2. Detect and save patterns
    const patterns = await detectPatterns();
    if (patterns.length > 0) {
        await saveLearnedPatterns(patterns.slice(0, opts.maxPatternsToLearn));
        changes.push(`Learned ${patterns.length} pattern(s) from corrections`);
        console.info(`[APEX] [META] Learned ${patterns.length} patterns`);

        // Log top patterns
        for (const p of patterns.slice(0, 3)) {
            console.info(`[APEX] [META] Pattern: "${p.trigger}" → ${p.rightCategory} (not ${p.wrongCategory})`);
        }
    }

    // 3. Analyze confusion matrix for recommendations
    const confusionPatterns = await getConfusionPatterns(5);
    for (const cp of confusionPatterns) {
        if (cp.count >= 3) {
            recommendations.push(
                `High confusion: ${cp.from} → ${cp.to} (${cp.count} times). Consider clarifying category boundaries.`
            );
        }
    }

    // 4. Adjust confidence threshold if calibration is off
    if (opts.confidenceAdjustmentEnabled) {
        const highConfBucket = metrics.confidenceCalibration.find(b => b.range === "80-100%");
        if (highConfBucket && highConfBucket.accuracy < 85) {
            // High confidence but low accuracy = overconfident
            const adjustment = await adjustConfidenceThreshold("increase");
            if (adjustment) {
                changes.push(`Increased confidence threshold (model was overconfident)`);
            }
        } else if (highConfBucket && highConfBucket.accuracy > 95 && accuracyBefore < 75) {
            // High confidence accurate but overall low = threshold may be too high
            const adjustment = await adjustConfidenceThreshold("decrease");
            if (adjustment) {
                changes.push(`Decreased confidence threshold (too conservative)`);
            }
        }
    }

    // 5. Category-specific recommendations
    for (const [cat, data] of Object.entries(metrics.byCategory)) {
        if (data.total > 5 && data.accuracy < 70) {
            recommendations.push(
                `Category "${cat}" needs attention (${data.accuracy}% accuracy)`
            );
        }
    }

    // 6. Add positive feedback if appropriate
    if (changes.length === 0 && accuracyBefore >= 85) {
        changes.push("System performing well - no adjustments needed");
    }

    if (recommendations.length === 0) {
        recommendations.push("Continue normal operation");
    }

    // 7. Log the optimization run
    const runId = crypto.randomUUID();
    await db.insert(optimizationRuns).values({
        id: runId,
        accuracyBefore,
        accuracyAfter: null, // Will be measured later
        changes: JSON.stringify(changes),
        metrics: JSON.stringify(metrics),
        userId,
    });

    console.info(`[APEX] [META] Optimization cycle complete. Changes: ${changes.length}`);

    return {
        id: runId,
        accuracyBefore,
        accuracyAfter: null,
        changes,
        patternsLearned: patterns.length,
        recommendations,
        runAt: new Date().toISOString(),
    };
}

// ===== Confidence Threshold Adjustment =====

/**
 * Adjust the confidence threshold based on calibration data
 */
async function adjustConfidenceThreshold(
    direction: "increase" | "decrease"
): Promise<boolean> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = "confidence_threshold_adjustment";

    // Get current adjustment (default 0)
    const [existing] = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    const currentAdjustment = existing ? parseFloat(existing.value) : 0;
    const delta = direction === "increase" ? 0.05 : -0.05;
    const newAdjustment = Math.max(-0.2, Math.min(0.2, currentAdjustment + delta));

    // Don't adjust if we've hit limits
    if (newAdjustment === currentAdjustment) {
        return false;
    }

    // Save new adjustment
    if (existing) {
        await db
            .update(agentMemory)
            .set({ value: String(newAdjustment), updatedAt: new Date().toISOString() })
            .where(eq(agentMemory.id, existing.id));
    } else {
        await db.insert(agentMemory).values({
            userId,
            key,
            value: String(newAdjustment),
        });
    }

    console.info(`[APEX] [META] Confidence threshold adjusted: ${currentAdjustment} → ${newAdjustment}`);
    return true;
}

/**
 * Get the current confidence threshold adjustment
 */
export async function getConfidenceThresholdAdjustment(): Promise<number> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = "confidence_threshold_adjustment";

    const [entry] = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    return entry ? parseFloat(entry.value) : 0;
}

// ===== Optimization History =====

/**
 * Get recent optimization runs
 */
export async function getOptimizationHistory(limit = 10): Promise<OptimizationResult[]> {
    const userId = CONFIG.SINGLE_USER_ID;

    const runs = await db
        .select()
        .from(optimizationRuns)
        .where(eq(optimizationRuns.userId, userId))
        .orderBy(desc(optimizationRuns.runAt))
        .limit(limit);

    return runs.map(run => ({
        id: run.id,
        accuracyBefore: run.accuracyBefore || 0,
        accuracyAfter: run.accuracyAfter,
        changes: JSON.parse(run.changes),
        patternsLearned: 0, // Not stored, would need to recompute
        recommendations: [], // Would need to regenerate
        runAt: run.runAt || new Date().toISOString(),
    }));
}

/**
 * Check if optimization should run (smart scheduling)
 * 
 * Runs if:
 * - Never run before
 * - Last run was > 7 days ago
 * - Significant new corrections since last run (> 10)
 */
export async function shouldRunOptimization(): Promise<{
    shouldRun: boolean;
    reason: string;
}> {
    const userId = CONFIG.SINGLE_USER_ID;

    // Get last optimization run
    const [lastRun] = await db
        .select()
        .from(optimizationRuns)
        .where(eq(optimizationRuns.userId, userId))
        .orderBy(desc(optimizationRuns.runAt))
        .limit(1);

    if (!lastRun) {
        return { shouldRun: true, reason: "No previous optimization run" };
    }

    // Check time since last run
    const lastRunDate = new Date(lastRun.runAt || 0);
    const daysSinceLastRun = (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastRun >= 7) {
        return { shouldRun: true, reason: `${Math.floor(daysSinceLastRun)} days since last run` };
    }

    // Check for significant new corrections
    const metrics = await getAccuracyMetrics(7); // Last week
    if (metrics.totalCorrections >= 10) {
        return { shouldRun: true, reason: `${metrics.totalCorrections} new corrections this week` };
    }

    return { 
        shouldRun: false, 
        reason: `Last run ${Math.floor(daysSinceLastRun)} days ago, only ${metrics.totalCorrections} new corrections` 
    };
}
