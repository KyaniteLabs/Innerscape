/**
 * Analytics API
 * 
 * GET /api/analytics - Get META accuracy metrics and health data
 * 
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 *   - include: Comma-separated list of sections to include
 *              (metrics, patterns, health, all)
 */

import { NextRequest, NextResponse } from "next/server";
import { 
    getAccuracyMetrics, 
    getConfusionPatterns, 
    getHealthMetrics 
} from "@/lib/agent/analytics";
import { formatErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get("days") || "30", 10);
        const include = searchParams.get("include")?.split(",") || ["all"];

        const shouldInclude = (section: string) => 
            include.includes("all") || include.includes(section);

        const response: Record<string, unknown> = {
            success: true,
            generatedAt: new Date().toISOString(),
            period: `${days} days`,
        };

        // Get accuracy metrics
        if (shouldInclude("metrics")) {
            response.metrics = await getAccuracyMetrics(days);
        }

        // Get confusion patterns
        if (shouldInclude("patterns")) {
            response.patterns = await getConfusionPatterns(10);
        }

        // Get health summary
        if (shouldInclude("health")) {
            response.health = await getHealthMetrics();
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("[APEX] [Analytics API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
