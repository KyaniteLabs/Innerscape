import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { fileClassifiedItem } from "@/lib/filing";
import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { ClassificationResult } from "@/lib/ai/classifier";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * POST /api/inbox/classify
 * Manually classify an inbox item to a specific destination
 */
export async function POST(req: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit("classify");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    try {
        const body = await req.json();
        const { inboxId, destination } = body;

        // Validate required fields
        if (!inboxId || !destination) {
            return NextResponse.json(
                { success: false, error: "Missing inboxId or destination" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Validate destination
        const validDestinations = ["projects", "people", "ideas", "admin"];
        if (!validDestinations.includes(destination)) {
            return NextResponse.json(
                { success: false, error: `Invalid destination. Must be one of: ${validDestinations.join(", ")}` },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Fetch the inbox item
        const [inboxItem] = await db
            .select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.id, inboxId),
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID)
            ))
            .limit(1);

        if (!inboxItem) {
            return NextResponse.json(
                { success: false, error: "Inbox item not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        // Extract a name from the original text (first line or first 50 chars)
        const originalText = inboxItem.originalText;
        const firstLine = originalText.split('\n')[0].trim();
        const name = firstLine.length > 50 
            ? firstLine.substring(0, 47) + "..." 
            : firstLine || "Untitled";

        // Build classification result for filing
        const classification: ClassificationResult = {
            destination: destination as "projects" | "people" | "ideas" | "admin",
            confidence: 1.0, // Manual classification = 100% confidence
            data: {
                name,
                original_text: originalText,
                notes: originalText,
                // Type-specific defaults
                ...(destination === "projects" && { status: "active" }),
                ...(destination === "admin" && { status: "todo" }),
            }
        };

        // File the item using existing filing logic
        const result = await fileClassifiedItem(inboxId, classification);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to classify item" },
                { status: CONFIG.HTTP.INTERNAL_SERVER_ERROR }
            );
        }

        return NextResponse.json({
            success: true,
            destination: result.destination,
            destinationId: result.destinationId,
            message: `Item classified as ${destination}`,
        });

    } catch (error) {
        console.error("[APEX] [Classify API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
