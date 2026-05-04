/**
 * Summaries API Route
 * 
 * Endpoints for generating and retrieving daily and weekly summaries.
 */

import { NextRequest, NextResponse } from "next/server";
import { 
    generateDailySummary, 
    storeDailySummary,
    getDailySummary,
    formatDailySummary,
    generateWeeklyDigest,
    storeWeeklyDigest,
    formatWeeklyDigest,
} from "@/lib/summaries";
import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * GET /api/summaries
 * Get or generate summaries
 * 
 * Query params:
 * - type: "daily" | "weekly" (default: "daily")
 * - date: ISO date string (default: today)
 * - format: "json" | "text" (default: "json")
 * - generate: "true" to force regeneration (default: use cached)
 */
export async function GET(req: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit("summaries");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "daily";
        const dateStr = searchParams.get("date");
        const format = searchParams.get("format") || "json";
        const forceGenerate = searchParams.get("generate") === "true";

        const date = dateStr ? new Date(dateStr) : new Date();

        if (type === "daily") {
            // Try to get cached summary first
            const dateKey = date.toISOString().split("T")[0];
            let summary = forceGenerate ? null : await getDailySummary(dateKey);
            
            if (!summary) {
                // Generate new summary
                summary = await generateDailySummary(date);
                await storeDailySummary(summary);
            }

            if (format === "text") {
                return NextResponse.json({
                    success: true,
                    formatted: formatDailySummary(summary),
                });
            }

            return NextResponse.json({
                success: true,
                summary,
            });
        }

        if (type === "weekly") {
            // Generate weekly digest
            const digest = await generateWeeklyDigest(date);
            await storeWeeklyDigest(digest);

            if (format === "text") {
                return NextResponse.json({
                    success: true,
                    formatted: formatWeeklyDigest(digest),
                });
            }

            return NextResponse.json({
                success: true,
                digest,
            });
        }

        return NextResponse.json(
            { success: false, error: "Invalid type. Use 'daily' or 'weekly'" },
            { status: CONFIG.HTTP.BAD_REQUEST }
        );

    } catch (error) {
        console.error("[APEX] [Summaries API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * POST /api/summaries/generate
 * Force generate and store summaries
 */
export async function POST(req: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit("summaries");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    try {
        const body = await req.json();
        const { type = "daily", date: dateStr } = body;

        const date = dateStr ? new Date(dateStr) : new Date();

        if (type === "daily") {
            const summary = await generateDailySummary(date);
            await storeDailySummary(summary);

            return NextResponse.json({
                success: true,
                summary,
                message: "Daily summary generated and stored",
            });
        }

        if (type === "weekly") {
            const digest = await generateWeeklyDigest(date);
            await storeWeeklyDigest(digest);

            return NextResponse.json({
                success: true,
                digest,
                message: "Weekly digest generated and stored",
            });
        }

        return NextResponse.json(
            { success: false, error: "Invalid type" },
            { status: CONFIG.HTTP.BAD_REQUEST }
        );

    } catch (error) {
        console.error("[APEX] [Summaries API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
