import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog, corrections } from "@/lib/db/schema";
import { desc, eq, and, or } from "drizzle-orm";

import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { learnFromCorrection } from "@/lib/agent/memory/user-prefs";
import { invalidatePromptCache } from "@/lib/agent/prompts/cache";

/**
 * GET /api/inbox
 * List inbox items with optional filters
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // pending, filed, needs_review
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        let query = db
            .select()
            .from(inboxLog)
            .where(eq(inboxLog.userId, CONFIG.SINGLE_USER_ID))
            .orderBy(desc(inboxLog.createdAt))
            .limit(limit)
            .offset(offset);

        // Apply status filter if provided
        if (status) {
            const validStatuses = ["pending", "filed", "needs_review", "fixed"];
            if (validStatuses.includes(status)) {
                query = db
                    .select()
                    .from(inboxLog)
                    .where(and(
                        eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                        eq(inboxLog.status, status as "pending" | "filed" | "needs_review" | "fixed")
                    ))
                    .orderBy(desc(inboxLog.createdAt))
                    .limit(limit)
                    .offset(offset);
            }
        }

        const items = await query;

        return NextResponse.json({
            success: true,
            items,
            count: items.length,
            offset,
            limit,
        });
    } catch (error) {
        console.error("[APEX] [Inbox API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * PATCH /api/inbox
 * Update an inbox item (e.g., mark as reviewed)
 * Tracks corrections for META self-improvement when filedTo changes
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, status, filedTo, destinationId } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing id" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Fetch existing item to detect corrections
        const [existingItem] = await db
            .select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.id, id),
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID)
            ))
            .limit(1);

        if (!existingItem) {
            return NextResponse.json(
                { success: false, error: "Item not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (status) updateData.status = status;
        if (filedTo) updateData.filedTo = filedTo;
        if (destinationId) updateData.destinationId = destinationId;

        const [updated] = await db
            .update(inboxLog)
            .set(updateData)
            .where(and(
                eq(inboxLog.id, id),
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        // META: Track correction if filedTo changed (self-improvement loop)
        if (filedTo && existingItem.filedTo && filedTo !== existingItem.filedTo) {
            console.info(`[APEX] [META] Correction detected: ${existingItem.filedTo} → ${filedTo}`);
            
            // Record the correction for analytics
            await db.insert(corrections).values({
                inboxId: id,
                originalDestination: existingItem.filedTo,
                correctedDestination: filedTo,
                originalConfidence: existingItem.confidence,
                textSnippet: existingItem.originalText.slice(0, 200),
                userId: CONFIG.SINGLE_USER_ID,
            });

            // Invalidate prompt cache so new corrections are used immediately
            invalidatePromptCache();

            // Trigger learning from correction (async, don't block response)
            learnFromCorrection(
                CONFIG.SINGLE_USER_ID,
                {
                    originalDestination: existingItem.filedTo,
                    correctedDestination: filedTo,
                    originalData: {},
                    correctedData: {},
                }
            ).catch(err => {
                console.error("[APEX] [META] Learning from correction failed:", err);
            });
        }

        return NextResponse.json({
            success: true,
            item: updated,
        });
    } catch (error) {
        console.error("[APEX] [Inbox API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * DELETE /api/inbox
 * Delete an inbox item
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing id parameter" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Delete the item
        const [deleted] = await db
            .delete(inboxLog)
            .where(and(
                eq(inboxLog.id, id),
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: "Item not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Item deleted",
        });
    } catch (error) {
        console.error("[APEX] [Inbox API] Delete error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
