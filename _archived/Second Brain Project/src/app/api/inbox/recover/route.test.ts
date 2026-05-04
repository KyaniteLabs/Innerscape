/**
 * Inbox Recovery API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { db } from "@/lib/db";
import { inboxLog, projects, people, ideas, adminTasks } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// Setup test tables
async function createTables() {
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS inbox_log (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            original_text TEXT NOT NULL,
            filed_to TEXT,
            destination_id TEXT,
            confidence INTEGER,
            status TEXT DEFAULT 'pending',
            capture_source TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )
    `);
    
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            name TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            next_action TEXT,
            notes TEXT,
            energy_level INTEGER,
            start_date TEXT,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_touched TEXT DEFAULT CURRENT_TIMESTAMP,
            archived_at TEXT,
            tags TEXT,
            user_id TEXT NOT NULL
        )
    `);
    
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS people (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            name TEXT NOT NULL,
            context TEXT,
            follow_ups TEXT,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_touched TEXT DEFAULT CURRENT_TIMESTAMP,
            archived_at TEXT,
            tags TEXT,
            user_id TEXT NOT NULL
        )
    `);
    
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS ideas (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            name TEXT NOT NULL,
            one_liner TEXT,
            notes TEXT,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_touched TEXT DEFAULT CURRENT_TIMESTAMP,
            archived_at TEXT,
            tags TEXT,
            user_id TEXT NOT NULL
        )
    `);
    
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS admin_tasks (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            name TEXT NOT NULL,
            due_date TEXT,
            status TEXT DEFAULT 'todo',
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_touched TEXT DEFAULT CURRENT_TIMESTAMP,
            archived_at TEXT,
            user_id TEXT NOT NULL
        )
    `);
}

async function cleanup() {
    try {
        await db.delete(inboxLog);
        await db.delete(projects);
        await db.delete(people);
        await db.delete(ideas);
        await db.delete(adminTasks);
    } catch {
        // Tables might not exist yet
    }
}

describe("Inbox Recovery API", () => {
    beforeEach(async () => {
        await createTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    describe("GET /api/inbox/recover", () => {
        it("returns empty list when no stuck items", async () => {
            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.count).toBe(0);
            expect(data.items).toHaveLength(0);
        });

        it("finds stuck items (filed but no destinationId)", async () => {
            // Create a stuck item
            await db.insert(inboxLog).values({
                id: "stuck-1",
                originalText: "This is a stuck item that was filed but never created",
                status: "filed",
                filedTo: "projects",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.count).toBe(1);
            expect(data.items[0].destination).toBe("projects");
        });

        it("excludes properly filed items", async () => {
            // Create a properly filed item (has destinationId)
            await db.insert(inboxLog).values({
                id: "proper-1",
                originalText: "Properly filed item",
                status: "filed",
                filedTo: "projects",
                destinationId: "proj-123",
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await GET();
            const data = await response.json();

            expect(data.count).toBe(0);
        });

        it("truncates long text in preview", async () => {
            const longText = "a".repeat(100);
            await db.insert(inboxLog).values({
                id: "stuck-long",
                originalText: longText,
                status: "filed",
                filedTo: "ideas",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await GET();
            const data = await response.json();

            expect(data.items[0].text.length).toBeLessThanOrEqual(53); // 50 + "..."
            expect(data.items[0].text).toContain("...");
        });
    });

    describe("POST /api/inbox/recover", () => {
        it("returns no items recovered when none stuck", async () => {
            const response = await POST();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.recovered).toBe(0);
            expect(data.message).toContain("No stuck items");
        });

        it("recovers stuck project item", async () => {
            await db.insert(inboxLog).values({
                id: "stuck-proj",
                originalText: "Build new feature for app",
                status: "filed",
                filedTo: "projects",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await POST();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.recovered).toBe(1);
            expect(data.items[0].destination).toBe("projects");

            // Verify project was created
            const [project] = await db.select().from(projects);
            expect(project.name).toBe("Build new feature for app");
        });

        it("recovers stuck admin task", async () => {
            await db.insert(inboxLog).values({
                id: "stuck-admin",
                originalText: "Pay bills this week",
                status: "filed",
                filedTo: "admin",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await POST();
            const data = await response.json();

            expect(data.recovered).toBe(1);

            const [task] = await db.select().from(adminTasks);
            expect(task.name).toBe("Pay bills this week");
            expect(task.status).toBe("todo");
        });

        it("recovers stuck person item", async () => {
            await db.insert(inboxLog).values({
                id: "stuck-person",
                originalText: "John from accounting - follow up next week",
                status: "filed",
                filedTo: "people",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await POST();
            const data = await response.json();

            expect(data.recovered).toBe(1);

            const [person] = await db.select().from(people);
            expect(person.name).toContain("John");
        });

        it("recovers stuck idea item", async () => {
            await db.insert(inboxLog).values({
                id: "stuck-idea",
                originalText: "App idea: task manager with AI",
                status: "filed",
                filedTo: "ideas",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await POST();
            const data = await response.json();

            expect(data.recovered).toBe(1);

            const [idea] = await db.select().from(ideas);
            expect(idea.name).toContain("App idea");
        });

        it("updates inbox item with new destinationId", async () => {
            await db.insert(inboxLog).values({
                id: "stuck-update",
                originalText: "Test recovery update",
                status: "filed",
                filedTo: "projects",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            await POST();

            const [updated] = await db.select()
                .from(inboxLog)
                .where(eq(inboxLog.id, "stuck-update"));
            
            expect(updated.destinationId).not.toBeNull();
        });

        it("skips items with needs_review destination", async () => {
            await db.insert(inboxLog).values({
                id: "needs-review",
                originalText: "Ambiguous item needs review",
                status: "filed",
                filedTo: "needs_review",
                destinationId: null,
                userId: CONFIG.SINGLE_USER_ID,
            });

            const response = await POST();
            const data = await response.json();

            expect(data.recovered).toBe(0);
        });

        it("handles multiple stuck items", async () => {
            await db.insert(inboxLog).values([
                {
                    id: "stuck-1",
                    originalText: "Item 1",
                    status: "filed",
                    filedTo: "projects",
                    destinationId: null,
                    userId: CONFIG.SINGLE_USER_ID,
                },
                {
                    id: "stuck-2",
                    originalText: "Item 2",
                    status: "filed",
                    filedTo: "ideas",
                    destinationId: null,
                    userId: CONFIG.SINGLE_USER_ID,
                },
            ]);

            const response = await POST();
            const data = await response.json();

            expect(data.recovered).toBe(2);
        });
    });
});
