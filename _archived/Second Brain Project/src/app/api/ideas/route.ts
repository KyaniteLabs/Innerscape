import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";

import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { createIdeaSchema, updateIdeaSchema, validateBody } from "@/lib/validations";

/**
 * GET /api/ideas
 * List all ideas
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const items = await db
            .select()
            .from(ideas)
            .where(eq(ideas.userId, CONFIG.SINGLE_USER_ID))
            .orderBy(desc(ideas.lastTouched))
            .limit(limit);

        // Parse tags JSON for each item
        const parsedItems = items.map(item => ({
            ...item,
            tags: item.tags ? JSON.parse(item.tags) : [],
        }));

        return NextResponse.json({
            success: true,
            items: parsedItems,
            count: parsedItems.length,
        });
    } catch (error) {
        console.error("[APEX] [Ideas API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * POST /api/ideas
 * Create a new idea
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = validateBody(createIdeaSchema, body);

        const [newIdea] = await db.insert(ideas).values({
            name: validated.name,
            oneLiner: validated.oneLiner,
            notes: validated.notes,
            tags: validated.tags ? JSON.stringify(validated.tags) : null,
            dueDate: validated.dueDate,
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        return NextResponse.json({
            success: true,
            item: {
                ...newIdea,
                tags: newIdea.tags ? JSON.parse(newIdea.tags) : [],
            },
        });
    } catch (error) {
        console.error("[APEX] [Ideas API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * PATCH /api/ideas
 * Update an idea
 */
export async function PATCH(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const queryId = searchParams.get("id");
        
        const body = await req.json();
        const validated = validateBody(updateIdeaSchema, { ...body, id: queryId || body.id });
        
        const id = queryId || validated.id;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing id" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        const updates: Record<string, unknown> = { lastTouched: new Date().toISOString() };
        if (validated.name !== undefined) updates.name = validated.name;
        if (validated.oneLiner !== undefined) updates.oneLiner = validated.oneLiner;
        if (validated.notes !== undefined) updates.notes = validated.notes;
        if (validated.dueDate !== undefined) updates.dueDate = validated.dueDate;
        if (validated.tags !== undefined) {
            updates.tags = validated.tags ? JSON.stringify(validated.tags) : null;
        }

        const [updated] = await db
            .update(ideas)
            .set(updates)
            .where(and(
                eq(ideas.id, id),
                eq(ideas.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Idea not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        return NextResponse.json({
            success: true,
            item: {
                ...updated,
                tags: updated.tags ? JSON.parse(updated.tags) : [],
            },
        });
    } catch (error) {
        console.error("[APEX] [Ideas API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * DELETE /api/ideas
 * Delete an idea
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing id" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        const [deleted] = await db
            .delete(ideas)
            .where(and(
                eq(ideas.id, id),
                eq(ideas.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: "Idea not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        return NextResponse.json({
            success: true,
            deleted: true,
        });
    } catch (error) {
        console.error("[APEX] [Ideas API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
