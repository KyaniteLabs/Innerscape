import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { z } from "zod";
import { queueClassification, QueueError } from "@/lib/queue";
import { processInboxItem } from "@/lib/processor";
import { processWithAgent } from "@/lib/agent";
import { ValidationError, DatabaseError, formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { rateLimit, rateLimitedResponse, getRateLimitHeaders } from "@/lib/rate-limit";

const CaptureSchema = z.object({
    text: z.string().min(1, "Text cannot be empty"),
    source: z.string().optional().default("web"),
    stream: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit("capture");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    try {
        // Parse and validate request body
        let body: unknown;
        try {
            body = await req.json();
        } catch (e) {
            console.error("[APEX] [Capture] JSON parse failed:", e);
            throw new ValidationError("Invalid JSON in request body");
        }

        const result = CaptureSchema.safeParse(body);
        if (!result.success) {
            throw new ValidationError("Invalid request data", {
                issues: result.error.flatten(),
            });
        }

        const { text, source } = result.data;

        // Save to inbox first
        let newItem;
        try {
            [newItem] = await db.insert(inboxLog).values({
                originalText: text,
                captureSource: source,
                status: "pending",
                userId: CONFIG.SINGLE_USER_ID,
            }).returning();
        } catch (error) {
            console.error("[APEX] [Capture] Database insert failed:", error instanceof Error ? error.message : "Unknown error");
            throw new DatabaseError("Failed to save capture", {
                source,
                textLength: text.length,
            });
        }

        // Use agent or legacy classifier based on config
        const useAgent = CONFIG.AGENT.ENABLED && !CONFIG.AGENT.USE_LEGACY_CLASSIFIER;
        
        if (useAgent) {
            // Process with the new agent system
            return await processWithAgentRoute(newItem.id, text, source);
        }

        // Legacy path: Use queue or synchronous processing
        return await processLegacyRoute(newItem.id, text);

    } catch (error) {
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * Process capture using the new agent system
 */
async function processWithAgentRoute(
    inboxId: string,
    text: string,
    source: string
): Promise<NextResponse> {
    try {
        console.info(`[APEX] [Capture] Processing with agent: ${inboxId}`);
        
        const agentResponse = await processWithAgent(text, {
            model: CONFIG.AI.DEFAULT_MODEL,
            includeContext: true,
        });

        // Update inbox with agent results
        const { eq } = await import("drizzle-orm");
        
        if (agentResponse.action === "filed" && agentResponse.destination) {
            await db
                .update(inboxLog)
                .set({
                    filedTo: agentResponse.destination,
                    destinationId: agentResponse.destinationId,
                    confidence: agentResponse.confidence ? Math.round(agentResponse.confidence * 100) : null,
                    status: "filed",
                })
                .where(eq(inboxLog.id, inboxId));
        } else if (agentResponse.action === "clarify" || agentResponse.action === "error") {
            await db
                .update(inboxLog)
                .set({
                    status: "needs_review",
                })
                .where(eq(inboxLog.id, inboxId));
        }

        return NextResponse.json({
            success: true,
            id: inboxId,
            action: agentResponse.action,
            status: agentResponse.action === "filed" ? "filed" : "needs_review",
            destination: agentResponse.destination,
            destinationId: agentResponse.destinationId,
            summary: agentResponse.summary,
            firstStep: agentResponse.firstStep,
            related: agentResponse.related,
            question: agentResponse.question,
            options: agentResponse.options,
            confidence: agentResponse.confidence,
        });
    } catch (error) {
        console.error("[APEX] [Capture] Agent processing failed:", error);
        
        // Fall back to legacy processing
        console.info("[APEX] [Capture] Falling back to legacy processing");
        return processLegacyRoute(inboxId, text);
    }
}

/**
 * Legacy processing path using queue or synchronous classifier
 */
async function processLegacyRoute(
    inboxId: string,
    text: string
): Promise<NextResponse> {
    let processingResult = null;
    
    try {
        const queueResult = await queueClassification(inboxId, text);
        if (!queueResult.queued) {
            // Redis not configured - process synchronously
            console.info(`[APEX] [Capture] Redis not available, processing synchronously for item ${inboxId}`);
            processingResult = await processInboxItem(inboxId, text);
        }
    } catch (error) {
        // Queue failed - try synchronous processing
        console.warn(`[APEX] [Capture] Queue failed for item ${inboxId}, processing synchronously:`, error instanceof Error ? error.message : "Unknown error");
        try {
            processingResult = await processInboxItem(inboxId, text);
        } catch (processError) {
            console.error(`[APEX] [Capture] Synchronous processing also failed for item ${inboxId}:`, processError instanceof Error ? processError.message : "Unknown error");
            // Item is still saved, can be processed later via /api/process
        }
    }

    return NextResponse.json({
        success: true,
        id: inboxId,
        action: processingResult?.destination ? "filed" : "pending",
        status: processingResult?.destination ? "filed" : "pending",
        destination: processingResult?.destination,
        destinationId: processingResult?.destinationId,
        summary: processingResult?.destination 
            ? `Filed to ${processingResult.destination}` 
            : "Captured - processing pending",
    });
}

/**
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
}
