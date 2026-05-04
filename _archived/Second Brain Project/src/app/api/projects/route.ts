import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { desc, eq, and, ne } from "drizzle-orm";

import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";
import { createProjectSchema, updateProjectSchema, validateBody } from "@/lib/validations";

/**
 * GET /api/projects
 * List projects with optional status filter
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // active, waiting, blocked, someday, completed
        const includeCompleted = searchParams.get("includeCompleted") === "true";
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        let items;

        if (status) {
            items = await db
                .select()
                .from(projects)
                .where(and(
                    eq(projects.userId, CONFIG.SINGLE_USER_ID),
                    eq(projects.status, status as "active" | "waiting" | "blocked" | "someday" | "completed")
                ))
                .orderBy(desc(projects.lastTouched))
                .limit(limit);
        } else if (!includeCompleted) {
            // Default: exclude completed
            items = await db
                .select()
                .from(projects)
                .where(and(
                    eq(projects.userId, CONFIG.SINGLE_USER_ID),
                    ne(projects.status, "completed")
                ))
                .orderBy(desc(projects.lastTouched))
                .limit(limit);
        } else {
            items = await db
                .select()
                .from(projects)
                .where(eq(projects.userId, CONFIG.SINGLE_USER_ID))
                .orderBy(desc(projects.lastTouched))
                .limit(limit);
        }

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
        console.error("[APEX] [Projects API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = validateBody(createProjectSchema, body);

        const [newProject] = await db.insert(projects).values({
            name: validated.name,
            status: validated.status,
            nextAction: validated.nextAction,
            notes: validated.notes,
            tags: validated.tags ? JSON.stringify(validated.tags) : null,
            dueDate: validated.dueDate,
            startDate: validated.startDate,
            energyLevel: validated.energyLevel,
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        return NextResponse.json({
            success: true,
            item: {
                ...newProject,
                tags: newProject.tags ? JSON.parse(newProject.tags) : [],
            },
        });
    } catch (error) {
        console.error("[APEX] [Projects API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * PATCH /api/projects
 * Update a project
 */
export async function PATCH(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const queryId = searchParams.get("id");
        
        const body = await req.json();
        const validated = validateBody(updateProjectSchema, { ...body, id: queryId || body.id });
        
        const id = queryId || validated.id;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing id" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        const updates: Record<string, unknown> = { lastTouched: new Date().toISOString() };
        if (validated.name !== undefined) updates.name = validated.name;
        if (validated.status !== undefined) updates.status = validated.status;
        if (validated.nextAction !== undefined) updates.nextAction = validated.nextAction;
        if (validated.notes !== undefined) updates.notes = validated.notes;
        if (validated.dueDate !== undefined) updates.dueDate = validated.dueDate;
        if (validated.startDate !== undefined) updates.startDate = validated.startDate;
        if (validated.energyLevel !== undefined) updates.energyLevel = validated.energyLevel;
        if (validated.tags !== undefined) {
            updates.tags = validated.tags ? JSON.stringify(validated.tags) : null;
        }

        const [updated] = await db
            .update(projects)
            .set(updates)
            .where(and(
                eq(projects.id, id),
                eq(projects.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Project not found" },
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
        console.error("[APEX] [Projects API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * DELETE /api/projects
 * Delete a project
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
            .delete(projects)
            .where(and(
                eq(projects.id, id),
                eq(projects.userId, CONFIG.SINGLE_USER_ID)
            ))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: "Project not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        return NextResponse.json({
            success: true,
            deleted: true,
        });
    } catch (error) {
        console.error("[APEX] [Projects API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
