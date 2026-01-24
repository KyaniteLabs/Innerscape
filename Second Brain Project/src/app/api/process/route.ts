import { NextRequest, NextResponse } from "next/server";
import { processInboxItem, processPendingItems } from "@/lib/processor";
import { formatErrorResponse } from "@/lib/errors";

/**
 * POST /api/process
 * Process a specific inbox item or all pending items
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // If inboxId is provided, process that specific item
        if (body.inboxId && body.text) {
            const result = await processInboxItem(body.inboxId, body.text);
            return NextResponse.json(result);
        }

        // Otherwise, process all pending items
        const limit = body.limit || 10;
        const results = await processPendingItems(limit);
        
        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error("[APEX] [Process API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * GET /api/process
 * Process all pending items (for cron jobs or manual triggers)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        const results = await processPendingItems(limit);
        
        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error("[APEX] [Process API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
