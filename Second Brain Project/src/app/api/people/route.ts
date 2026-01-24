import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";

import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { createPersonSchema, updatePersonSchema, validateBody } from "@/lib/validations";

/**
 * GET /api/people
 * List all people entries
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const items = await db
            .select()
            .from(people)
            .where(eq(people.userId, CONFIG.SINGLE_USER_ID))
            .orderBy(desc(people.lastTouched))
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
        console.error("[APEX] [People API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * POST /api/people
 * Create a new person entry
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = validateBody(createPersonSchema, body);

        const [newPerson] = await db.insert(people).values({
            name: validated.name,
            context: validated.context,
            followUps: validated.followUps,
            tags: validated.tags ? JSON.stringify(validated.tags) : null,
            dueDate: validated.dueDate,
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        return NextResponse.json({
            success: true,
            item: {
                ...newPerson,
                tags: newPerson.tags ? JSON.parse(newPerson.tags) : [],
            },
        });
    } catch (error) {
        console.error("[APEX] [People API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * PATCH /api/people
 * Update a person entry
 */
export async function PATCH(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const queryId = searchParams.get("id");
        
        const body = await req.json();
        const validated = validateBody(updatePersonSchema, { ...body, id: queryId || body.id });
        
        const id = queryId || validated.id;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing id" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        const updates: Record<string, unknown> = { lastTouched: new Date().toISOString() };
        if (validated.name !== undefined) updates.name = validated.name;
        if (validated.context !== undefined) updates.context = validated.context;
        if (validated.followUps !== undefined) updates.followUps = validated.followUps;
        if (validated.dueDate !== undefined) updates.dueDate = validated.dueDate;
        if (validated.tags !== undefined) {
            updates.tags = validated.tags ? JSON.stringify(validated.tags) : null;
        }

        const [updated] = await db
            .update(people)
            .set(updates)
            .where(and(
                eq(people.id, id),
                eq(people.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Person not found" },
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
        console.error("[APEX] [People API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * DELETE /api/people
 * Delete a person entry
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
            .delete(people)
            .where(and(
                eq(people.id, id),
                eq(people.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: "Person not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        return NextResponse.json({
            success: true,
            deleted: true,
        });
    } catch (error) {
        console.error("[APEX] [People API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
