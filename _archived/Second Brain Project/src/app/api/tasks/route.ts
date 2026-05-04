/**
 * Admin Tasks API Route
 * 
 * CRUD operations for admin tasks (to-dos with due dates)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { formatErrorResponse } from "@/lib/errors";
import { updateTaskSchema, validateBody } from "@/lib/validations";

/**
 * GET /api/tasks - List all admin tasks
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // "todo", "done", or null for all

        let query = db.select().from(adminTasks)
            .where(eq(adminTasks.userId, CONFIG.SINGLE_USER_ID));

        if (status) {
            query = db.select().from(adminTasks)
                .where(and(
                    eq(adminTasks.userId, CONFIG.SINGLE_USER_ID),
                    eq(adminTasks.status, status)
                ));
        }

        const tasks = await query;

        return NextResponse.json({ 
            tasks,
            count: tasks.length 
        });
    } catch (error) {
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * DELETE /api/tasks?id=xxx - Delete an admin task
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Task ID required" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Verify the task belongs to the user
        const [task] = await db.select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.id, id),
                eq(adminTasks.userId, CONFIG.SINGLE_USER_ID)
            ));

        if (!task) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        // Delete the task
        await db.delete(adminTasks)
            .where(eq(adminTasks.id, id));

        return NextResponse.json({ 
            success: true,
            message: "Task deleted" 
        });
    } catch (error) {
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * PATCH /api/tasks - Update a task (toggle status, edit)
 */
export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const queryId = searchParams.get("id");
        
        const body = await request.json();
        const validated = validateBody(updateTaskSchema, { ...body, id: queryId || body.id });
        
        const id = queryId || validated.id;

        if (!id) {
            return NextResponse.json(
                { error: "Task ID required" },
                { status: CONFIG.HTTP.BAD_REQUEST }
            );
        }

        // Verify the task belongs to the user
        const [task] = await db.select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.id, id),
                eq(adminTasks.userId, CONFIG.SINGLE_USER_ID)
            ));

        if (!task) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: CONFIG.HTTP.NOT_FOUND }
            );
        }

        // Update allowed fields
        const updates: Record<string, unknown> = { lastTouched: new Date().toISOString() };
        if (validated.status !== undefined) updates.status = validated.status;
        if (validated.name !== undefined) updates.name = validated.name;
        if (validated.dueDate !== undefined) updates.dueDate = validated.dueDate;
        if (validated.notes !== undefined) updates.notes = validated.notes;

        await db.update(adminTasks)
            .set(updates)
            .where(eq(adminTasks.id, id));

        // Return updated task
        const [updated] = await db.select()
            .from(adminTasks)
            .where(eq(adminTasks.id, id));

        return NextResponse.json({ 
            success: true,
            task: updated 
        });
    } catch (error) {
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
