/**
 * Admin Tasks API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE, PATCH } from "./route";
import { db } from "@/lib/db";
import { adminTasks } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// Setup test data
async function createTables() {
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS admin_tasks (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            name TEXT NOT NULL,
            status TEXT DEFAULT 'todo',
            notes TEXT,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_touched TEXT DEFAULT CURRENT_TIMESTAMP,
            archived_at TEXT,
            user_id TEXT NOT NULL
        )
    `);
}

async function seedTestData() {
    await db.insert(adminTasks).values([
        {
            id: "task-1",
            name: "Test Task 1",
            status: "todo",
            notes: "Notes for task 1",
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "task-2",
            name: "Test Task 2",
            status: "done",
            notes: "Completed task",
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "task-3",
            name: "Other User Task",
            status: "todo",
            userId: "other-user",
        },
    ]);
}

async function cleanup() {
    await db.delete(adminTasks);
}

describe("Admin Tasks API", () => {
    beforeEach(async () => {
        await createTables();
        await cleanup();
        await seedTestData();
    });

    afterEach(async () => {
        await cleanup();
    });

    describe("GET /api/tasks", () => {
        it("returns all tasks for current user", async () => {
            const req = new NextRequest("http://localhost/api/tasks");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.tasks).toHaveLength(2); // Only user's tasks, not other-user's
            expect(data.count).toBe(2);
        });

        it("filters by status when provided", async () => {
            const req = new NextRequest("http://localhost/api/tasks?status=todo");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.tasks).toHaveLength(1);
            expect(data.tasks[0].status).toBe("todo");
        });

        it("returns done tasks when filtered", async () => {
            const req = new NextRequest("http://localhost/api/tasks?status=done");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.tasks).toHaveLength(1);
            expect(data.tasks[0].status).toBe("done");
        });
    });

    describe("DELETE /api/tasks", () => {
        it("deletes a task by id", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=task-1", {
                method: "DELETE",
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toBe("Task deleted");

            // Verify task is deleted
            const [deleted] = await db.select()
                .from(adminTasks)
                .where(eq(adminTasks.id, "task-1"));
            expect(deleted).toBeUndefined();
        });

        it("returns 400 when id is missing", async () => {
            const req = new NextRequest("http://localhost/api/tasks", {
                method: "DELETE",
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Task ID required");
        });

        it("returns 404 when task not found", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=nonexistent", {
                method: "DELETE",
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Task not found");
        });

        it("returns 404 when task belongs to another user", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=task-3", {
                method: "DELETE",
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Task not found");
        });
    });

    describe("PATCH /api/tasks", () => {
        it("updates task status", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=task-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "done" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.task.status).toBe("done");
        });

        it("updates task name", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=task-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Updated Name" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.task.name).toBe("Updated Name");
        });

        it("updates task notes", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=task-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: "New notes" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.task.notes).toBe("New notes");
        });

        it("accepts id in body instead of query param", async () => {
            const req = new NextRequest("http://localhost/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: "task-1", status: "done" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });

        it("returns 400 when id is missing", async () => {
            const req = new NextRequest("http://localhost/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "done" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(400);
        });

        it("returns 404 when task not found", async () => {
            const req = new NextRequest("http://localhost/api/tasks?id=nonexistent", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "done" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Task not found");
        });

        it("updates lastTouched timestamp", async () => {
            const [before] = await db.select()
                .from(adminTasks)
                .where(eq(adminTasks.id, "task-1"));
            
            // Small delay to ensure timestamp changes
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const req = new NextRequest("http://localhost/api/tasks?id=task-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Updated" }),
            });
            await PATCH(req);

            const [after] = await db.select()
                .from(adminTasks)
                .where(eq(adminTasks.id, "task-1"));

            expect(after.lastTouched).not.toBe(before.lastTouched);
        });
    });
});
