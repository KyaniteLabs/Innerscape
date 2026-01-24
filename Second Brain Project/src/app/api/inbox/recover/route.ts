/**
 * Inbox Recovery API
 * 
 * POST /api/inbox/recover
 * 
 * Recovers "stuck" inbox items that were marked as filed but never
 * actually created in the destination tables (due to the agent not
 * calling create_item).
 * 
 * This endpoint:
 * 1. Finds inbox items with status="filed" but no destinationId
 * 2. Creates the actual records in the destination tables
 * 3. Updates the inbox items with the new destinationIds
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboxLog, projects, adminTasks, people, ideas } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { formatErrorResponse } from "@/lib/errors";

export async function POST() {
    try {
        const userId = CONFIG.SINGLE_USER_ID;
        const now = new Date().toISOString();
        
        // Find stuck items: filed but no destinationId
        const stuckItems = await db
            .select()
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, userId),
                eq(inboxLog.status, "filed"),
                isNull(inboxLog.destinationId)
            ));

        if (stuckItems.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No stuck items found",
                recovered: 0,
            });
        }

        const recovered: Array<{ id: string; text: string; destination: string; newId: string }> = [];
        const errors: Array<{ id: string; error: string }> = [];

        for (const item of stuckItems) {
            try {
                const text = item.originalText;
                const destination = item.filedTo;

                if (!destination || destination === "needs_review") {
                    continue; // Skip items without a destination
                }

                let newId: string | null = null;
                const name = text.substring(0, 100).trim();

                switch (destination) {
                    case "projects": {
                        const [result] = await db.insert(projects).values({
                            name,
                            status: "active",
                            notes: text.length > 100 ? text : null,
                            lastTouched: now,
                            userId,
                        }).returning({ id: projects.id });
                        newId = result.id;
                        break;
                    }
                    
                    case "admin": {
                        const [result] = await db.insert(adminTasks).values({
                            name,
                            status: "todo",
                            notes: text.length > 100 ? text : null,
                            createdAt: item.createdAt || now,
                            userId,
                        }).returning({ id: adminTasks.id });
                        newId = result.id;
                        break;
                    }
                    
                    case "people": {
                        const [result] = await db.insert(people).values({
                            name,
                            context: text.length > 100 ? text : null,
                            lastTouched: now,
                            userId,
                        }).returning({ id: people.id });
                        newId = result.id;
                        break;
                    }
                    
                    case "ideas": {
                        const [result] = await db.insert(ideas).values({
                            name,
                            notes: text.length > 100 ? text : null,
                            lastTouched: now,
                            userId,
                        }).returning({ id: ideas.id });
                        newId = result.id;
                        break;
                    }
                }

                if (newId) {
                    // Update inbox item with the new destinationId
                    await db
                        .update(inboxLog)
                        .set({ destinationId: newId })
                        .where(eq(inboxLog.id, item.id));

                    recovered.push({
                        id: item.id,
                        text: name,
                        destination,
                        newId,
                    });
                }
            } catch (error) {
                errors.push({
                    id: item.id,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Recovered ${recovered.length} items`,
            recovered: recovered.length,
            items: recovered,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error("[APEX] [Inbox Recovery] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * GET /api/inbox/recover
 * 
 * Check for stuck items without recovering them
 */
export async function GET() {
    try {
        const userId = CONFIG.SINGLE_USER_ID;
        
        // Find stuck items: filed but no destinationId
        const stuckItems = await db
            .select({
                id: inboxLog.id,
                text: inboxLog.originalText,
                destination: inboxLog.filedTo,
                createdAt: inboxLog.createdAt,
            })
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, userId),
                eq(inboxLog.status, "filed"),
                isNull(inboxLog.destinationId)
            ));

        return NextResponse.json({
            success: true,
            count: stuckItems.length,
            items: stuckItems.map(item => ({
                id: item.id,
                text: item.text.substring(0, 50) + (item.text.length > 50 ? "..." : ""),
                destination: item.destination,
                createdAt: item.createdAt,
            })),
        });
    } catch (error) {
        console.error("[APEX] [Inbox Recovery] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
