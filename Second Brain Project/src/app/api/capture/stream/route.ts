/**
 * Streaming Capture API
 * 
 * POST /api/capture/stream
 * 
 * Uses Server-Sent Events (SSE) to stream the agent's thought process
 * as it classifies and routes captures.
 * 
 * Events sent:
 * - thinking: Agent's reasoning process
 * - tool: Tool being called
 * - result: Tool result
 * - done: Final classification complete
 * - error: Something went wrong
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Agent } from "@/lib/agent";
import { CONFIG } from "@/lib/config";
import { sanitizeErrorMessage } from "@/lib/errors";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import type { StreamChunk } from "@/lib/agent/types";

const CaptureSchema = z.object({
    text: z.string().min(1, "Text cannot be empty"),
    source: z.string().optional().default("web"),
});

// SSE Event types for the client
interface SSEEvent {
    type: "thinking" | "tool" | "result" | "done" | "error" | "status";
    content: string;
    metadata?: {
        tool?: string;
        args?: string;
        confidence?: number;
        destination?: string;
        destinationId?: string;
        summary?: string;
        firstStep?: string;
        inboxId?: string;
    };
}

/**
 * Format SSE message
 */
function formatSSE(event: SSEEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * POST /api/capture/stream
 * 
 * Streams agent thoughts via SSE as it processes a capture
 */
export async function POST(req: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit("capture");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    // Parse request body
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return new Response(
            formatSSE({ type: "error", content: "Invalid JSON in request body" }),
            {
                status: CONFIG.HTTP.BAD_REQUEST,
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            }
        );
    }

    const result = CaptureSchema.safeParse(body);
    if (!result.success) {
        return new Response(
            formatSSE({ type: "error", content: "Invalid request data" }),
            {
                status: CONFIG.HTTP.BAD_REQUEST,
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            }
        );
    }

    const { text, source } = result.data;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            // Helper to send events
            const sendEvent = (event: SSEEvent) => {
                controller.enqueue(encoder.encode(formatSSE(event)));
            };

            try {
                // 1. Save to inbox first
                sendEvent({
                    type: "status",
                    content: "Saving capture...",
                });

                const [newItem] = await db.insert(inboxLog).values({
                    originalText: text,
                    captureSource: source,
                    status: "pending",
                    userId: CONFIG.SINGLE_USER_ID,
                }).returning();

                sendEvent({
                    type: "status",
                    content: "Analyzing...",
                    metadata: { inboxId: newItem.id },
                });

                // 2. Check if agent is enabled
                const useAgent = CONFIG.AGENT.ENABLED && !CONFIG.AGENT.USE_LEGACY_CLASSIFIER;
                
                if (!useAgent) {
                    // Legacy mode - just return basic result
                    sendEvent({
                        type: "done",
                        content: "Captured (legacy mode)",
                        metadata: {
                            inboxId: newItem.id,
                            summary: "Capture saved for processing",
                        },
                    });
                    controller.close();
                    return;
                }

                // 3. Process with agent, streaming thoughts
                const agent = new Agent();
                
                const agentResponse = await agent.process(text, {
                    model: CONFIG.AI.DEFAULT_MODEL,
                    includeContext: true,
                    stream: true,
                    onStream: (chunk: StreamChunk) => {
                        // Convert agent StreamChunk to our SSE format
                        switch (chunk.type) {
                            case "thinking":
                                sendEvent({
                                    type: "thinking",
                                    content: chunk.content || "Thinking...",
                                });
                                break;
                            
                            case "content":
                                // Intermediate content from agent
                                sendEvent({
                                    type: "thinking",
                                    content: chunk.content || "",
                                });
                                break;
                            
                            case "tool_call":
                                if (chunk.toolCall) {
                                    const toolName = chunk.toolCall.function.name;
                                    let argsPreview = "";
                                    try {
                                        const args = JSON.parse(chunk.toolCall.function.arguments);
                                        // Create a short preview of args
                                        argsPreview = Object.entries(args)
                                            .map(([k, v]) => `${k}=${typeof v === 'string' ? `"${v.substring(0, 30)}..."` : v}`)
                                            .join(", ");
                                    } catch {
                                        argsPreview = "...";
                                    }
                                    
                                    sendEvent({
                                        type: "tool",
                                        content: `Calling ${toolName}`,
                                        metadata: {
                                            tool: toolName,
                                            args: argsPreview,
                                        },
                                    });
                                }
                                break;
                            
                            case "tool_result":
                                if (chunk.toolResult) {
                                    const success = chunk.toolResult.success;
                                    
                                    sendEvent({
                                        type: "result",
                                        content: success ? `Got result` : `Tool failed: ${chunk.toolResult.error || "Unknown error"}`,
                                    });
                                }
                                break;
                            
                            case "done":
                                // Final response will be handled after agent.process() returns
                                break;
                        }
                    },
                });

                // 4. Update inbox with results
                if (agentResponse.action === "filed" && agentResponse.destination) {
                    await db
                        .update(inboxLog)
                        .set({
                            filedTo: agentResponse.destination,
                            destinationId: agentResponse.destinationId,
                            confidence: agentResponse.confidence 
                                ? Math.round(agentResponse.confidence * 100) 
                                : null,
                            status: "filed",
                        })
                        .where(eq(inboxLog.id, newItem.id));
                } else {
                    await db
                        .update(inboxLog)
                        .set({ status: "needs_review" })
                        .where(eq(inboxLog.id, newItem.id));
                }

                // 5. Send final done event
                sendEvent({
                    type: "done",
                    content: agentResponse.summary || "Processed",
                    metadata: {
                        inboxId: newItem.id,
                        destination: agentResponse.destination,
                        destinationId: agentResponse.destinationId,
                        confidence: agentResponse.confidence 
                            ? Math.round(agentResponse.confidence * 100) 
                            : undefined,
                        summary: agentResponse.summary,
                        firstStep: agentResponse.firstStep,
                    },
                });

            } catch (error) {
                console.error("[APEX] [Capture/Stream] Error:", error);
                sendEvent({
                    type: "error",
                    content: sanitizeErrorMessage(error),
                });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable nginx buffering
        },
    });
}
