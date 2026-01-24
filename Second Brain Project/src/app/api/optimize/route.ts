/**
 * Optimization API
 * 
 * POST /api/optimize - Trigger an optimization cycle
 * GET /api/optimize - Get optimization status and history
 */

import { NextRequest, NextResponse } from "next/server";
import { 
    runOptimizationCycle, 
    getOptimizationHistory,
    shouldRunOptimization,
} from "@/lib/agent/optimization";
import { formatErrorResponse } from "@/lib/errors";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * POST /api/optimize
 * 
 * Trigger a manual optimization cycle.
 * Analyzes correction patterns and updates learned behaviors.
 * 
 * Body (optional):
 *   - force: boolean - Run even if not needed
 */
export async function POST(req: NextRequest) {
    // Rate limiting (optimization is expensive)
    const rateLimitResult = rateLimit("optimize");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    try {
        const body = await req.json().catch(() => ({}));
        const force = body.force === true;

        // Check if optimization should run
        if (!force) {
            const check = await shouldRunOptimization();
            if (!check.shouldRun) {
                return NextResponse.json({
                    success: true,
                    skipped: true,
                    reason: check.reason,
                    message: "Optimization not needed. Use force=true to override.",
                });
            }
        }

        console.info("[APEX] [Optimize API] Starting optimization cycle...");
        const result = await runOptimizationCycle();

        return NextResponse.json({
            success: true,
            result,
            message: `Optimization complete. ${result.changes.length} change(s) made.`,
        });
    } catch (error) {
        console.error("[APEX] [Optimize API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * GET /api/optimize
 * 
 * Get optimization status and recent history.
 * 
 * Query params:
 *   - history: number - Number of historical runs to include (default: 5)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const historyLimit = parseInt(searchParams.get("history") || "5", 10);

        // Check if optimization is recommended
        const check = await shouldRunOptimization();
        
        // Get recent history
        const history = await getOptimizationHistory(historyLimit);

        return NextResponse.json({
            success: true,
            status: {
                shouldRun: check.shouldRun,
                reason: check.reason,
            },
            lastRun: history[0] || null,
            history,
        });
    } catch (error) {
        console.error("[APEX] [Optimize API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
