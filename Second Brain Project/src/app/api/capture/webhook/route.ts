/**
 * Webhook Capture API
 * 
 * POST /api/capture/webhook
 * 
 * Accepts captures from external sources:
 * - Email forwarding services (Zapier, Make, Cloudflare Email)
 * - SMS services (Twilio)
 * - Telegram bots
 * - iOS Shortcuts
 * - Browser extensions
 * - IFTTT
 * 
 * Authentication: Bearer token or secret in body
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { CONFIG } from "@/lib/config";
import { processWithAgent } from "@/lib/agent";

// Secret token for webhook authentication
const WEBHOOK_SECRET = process.env.CAPTURE_WEBHOOK_SECRET;

interface WebhookPayload {
    // The content to capture
    text?: string;
    content?: string;
    body?: string;
    message?: string;
    
    // Source identification
    source?: string;
    from?: string;
    
    // Optional metadata
    url?: string;
    title?: string;
    subject?: string;
    
    // Authentication (if not using Bearer token)
    secret?: string;
    token?: string;
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const authHeader = req.headers.get("authorization");
        const bearerToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : null;

        let body: WebhookPayload;
        
        // Handle different content types
        const contentType = req.headers.get("content-type") || "";
        
        if (contentType.includes("application/json")) {
            body = await req.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            body = Object.fromEntries(formData.entries()) as unknown as WebhookPayload;
        } else if (contentType.includes("text/plain")) {
            const text = await req.text();
            body = { text };
        } else {
            // Try JSON anyway
            try {
                body = await req.json();
            } catch {
                return NextResponse.json(
                    { success: false, error: "Unsupported content type" },
                    { status: CONFIG.HTTP.BAD_REQUEST }
                );
            }
        }

        // Verify authentication
        const providedSecret = bearerToken || body.secret || body.token;
        
        if (WEBHOOK_SECRET && providedSecret !== WEBHOOK_SECRET) {
            console.warn("[APEX] [Webhook] Unauthorized capture attempt");
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: CONFIG.HTTP.UNAUTHORIZED }
            );
        }

        // Extract the text content (try multiple field names)
        const text = body.text || body.content || body.body || body.message;
        
        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { success: false, error: "No content provided" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Build the capture text with metadata
        let captureText = text.trim();
        
        // Add URL if provided
        if (body.url) {
            captureText = `${captureText}\n\nURL: ${body.url}`;
        }
        
        // Add title/subject if provided
        if (body.title || body.subject) {
            captureText = `[${body.title || body.subject}]\n\n${captureText}`;
        }

        // Determine source
        const source = body.source || body.from || "webhook";

        // Save to inbox
        const [newItem] = await db.insert(inboxLog).values({
            originalText: captureText,
            captureSource: source,
            status: "pending",
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        console.log(`[APEX] [Webhook] Captured from ${source}: ${captureText.substring(0, 50)}...`);

        // Process with agent (async, don't wait)
        processWithAgent(captureText).catch(err => {
            console.error("[APEX] [Webhook] Agent processing failed:", err);
        });

        return NextResponse.json({
            success: true,
            id: newItem.id,
            message: "Captured successfully",
            source,
        });

    } catch (error) {
        console.error("[APEX] [Webhook] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: CONFIG.HTTP.INTERNAL_SERVER_ERROR }
        );
    }
}

// Also support GET for simple health check
export async function GET() {
    return NextResponse.json({
        success: true,
        message: "Second Brain capture webhook is active",
        endpoints: {
            capture: "POST /api/capture/webhook",
        },
        authentication: WEBHOOK_SECRET ? "required" : "disabled (set CAPTURE_WEBHOOK_SECRET)",
    });
}
