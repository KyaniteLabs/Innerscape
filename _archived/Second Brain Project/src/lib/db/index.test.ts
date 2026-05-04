/**
 * Database Module Tests
 * 
 * Tests for database connection, health check, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { db, healthCheck, ensureConnection, closeConnection, DatabaseConnectionError, DatabaseQueryError } from "./index";
import { projects, people, ideas, adminTasks, inboxLog } from "./schema";
import { eq, sql } from "drizzle-orm";

// Test user ID
const TEST_USER_ID = "test-user-123";

// Create tables for testing (in-memory database needs schema creation)
async function createTables() {
    // Create projects table
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

    // Create people table
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

    // Create ideas table
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

    // Create admin_tasks table
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

    // Create inbox_log table
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
}

describe("Database Module", () => {
    describe("healthCheck", () => {
        it("returns ok: true when database is healthy", async () => {
            const result = await healthCheck();
            
            expect(result.ok).toBe(true);
            expect(result.latencyMs).toBeGreaterThanOrEqual(0);
            expect(result.error).toBeUndefined();
        });

        it("returns latency in milliseconds", async () => {
            const result = await healthCheck();
            
            expect(typeof result.latencyMs).toBe("number");
            expect(result.latencyMs).toBeLessThan(1000); // Should be fast for in-memory
        });
    });

    describe("ensureConnection", () => {
        it("establishes connection without throwing", async () => {
            await expect(ensureConnection()).resolves.not.toThrow();
        });
    });

    describe("closeConnection", () => {
        it("closes connection without throwing", () => {
            expect(() => closeConnection()).not.toThrow();
        });
    });

    describe("DatabaseConnectionError", () => {
        it("creates error with correct properties", () => {
            const cause = new Error("Original error");
            const error = new DatabaseConnectionError("Connection failed", cause);
            
            expect(error.name).toBe("DatabaseConnectionError");
            expect(error.message).toBe("Connection failed");
            expect(error.cause).toBe(cause);
        });

        it("works without cause", () => {
            const error = new DatabaseConnectionError("Connection failed");
            
            expect(error.name).toBe("DatabaseConnectionError");
            expect(error.message).toBe("Connection failed");
            expect(error.cause).toBeUndefined();
        });
    });

    describe("DatabaseQueryError", () => {
        it("creates error with correct properties", () => {
            const cause = new Error("SQL error");
            const error = new DatabaseQueryError("Query failed", "SELECT * FROM users", cause);
            
            expect(error.name).toBe("DatabaseQueryError");
            expect(error.message).toBe("Query failed");
            expect(error.query).toBe("SELECT * FROM users");
            expect(error.cause).toBe(cause);
        });
    });
});

describe("Database CRUD Operations", () => {
    // Create tables once before all tests in this suite
    beforeAll(async () => {
        await createTables();
    });

    // Clean up test data before each test
    beforeEach(async () => {
        // Delete any existing test data
        await db.delete(projects).where(eq(projects.userId, TEST_USER_ID));
        await db.delete(people).where(eq(people.userId, TEST_USER_ID));
        await db.delete(ideas).where(eq(ideas.userId, TEST_USER_ID));
        await db.delete(adminTasks).where(eq(adminTasks.userId, TEST_USER_ID));
        await db.delete(inboxLog).where(eq(inboxLog.userId, TEST_USER_ID));
    });

    afterEach(async () => {
        // Clean up after each test
        await db.delete(projects).where(eq(projects.userId, TEST_USER_ID));
        await db.delete(people).where(eq(people.userId, TEST_USER_ID));
        await db.delete(ideas).where(eq(ideas.userId, TEST_USER_ID));
        await db.delete(adminTasks).where(eq(adminTasks.userId, TEST_USER_ID));
        await db.delete(inboxLog).where(eq(inboxLog.userId, TEST_USER_ID));
    });

    describe("Projects table", () => {
        it("inserts and retrieves a project", async () => {
            const [inserted] = await db.insert(projects).values({
                name: "Test Project",
                status: "active",
                userId: TEST_USER_ID,
            }).returning();

            expect(inserted).toBeDefined();
            expect(inserted.name).toBe("Test Project");
            expect(inserted.status).toBe("active");
            expect(inserted.id).toBeDefined();

            const [retrieved] = await db
                .select()
                .from(projects)
                .where(eq(projects.id, inserted.id));

            expect(retrieved).toBeDefined();
            expect(retrieved.name).toBe("Test Project");
        });

        it("updates a project", async () => {
            const [inserted] = await db.insert(projects).values({
                name: "Original Name",
                status: "active",
                userId: TEST_USER_ID,
            }).returning();

            await db
                .update(projects)
                .set({ name: "Updated Name", status: "completed" })
                .where(eq(projects.id, inserted.id));

            const [updated] = await db
                .select()
                .from(projects)
                .where(eq(projects.id, inserted.id));

            expect(updated.name).toBe("Updated Name");
            expect(updated.status).toBe("completed");
        });

        it("deletes a project", async () => {
            const [inserted] = await db.insert(projects).values({
                name: "To Delete",
                userId: TEST_USER_ID,
            }).returning();

            await db.delete(projects).where(eq(projects.id, inserted.id));

            const results = await db
                .select()
                .from(projects)
                .where(eq(projects.id, inserted.id));

            expect(results).toHaveLength(0);
        });

        it("stores and retrieves JSON tags", async () => {
            const tags = ["work", "urgent", "coding"];
            const [inserted] = await db.insert(projects).values({
                name: "Tagged Project",
                tags: JSON.stringify(tags),
                userId: TEST_USER_ID,
            }).returning();

            const [retrieved] = await db
                .select()
                .from(projects)
                .where(eq(projects.id, inserted.id));

            const parsedTags = JSON.parse(retrieved.tags!);
            expect(parsedTags).toEqual(tags);
        });
    });

    describe("People table", () => {
        it("inserts and retrieves a person", async () => {
            const [inserted] = await db.insert(people).values({
                name: "John Doe",
                context: "Met at conference",
                userId: TEST_USER_ID,
            }).returning();

            expect(inserted).toBeDefined();
            expect(inserted.name).toBe("John Doe");
            expect(inserted.context).toBe("Met at conference");

            const [retrieved] = await db
                .select()
                .from(people)
                .where(eq(people.id, inserted.id));

            expect(retrieved.name).toBe("John Doe");
        });
    });

    describe("Ideas table", () => {
        it("inserts and retrieves an idea", async () => {
            const [inserted] = await db.insert(ideas).values({
                name: "App Idea",
                oneLiner: "A cool new app",
                notes: "Detailed notes here",
                userId: TEST_USER_ID,
            }).returning();

            expect(inserted).toBeDefined();
            expect(inserted.name).toBe("App Idea");
            expect(inserted.oneLiner).toBe("A cool new app");

            const [retrieved] = await db
                .select()
                .from(ideas)
                .where(eq(ideas.id, inserted.id));

            expect(retrieved.name).toBe("App Idea");
        });
    });

    describe("Admin Tasks table", () => {
        it("inserts and retrieves a task", async () => {
            const [inserted] = await db.insert(adminTasks).values({
                name: "Pay bills",
                status: "todo",
                dueDate: "2026-02-01",
                userId: TEST_USER_ID,
            }).returning();

            expect(inserted).toBeDefined();
            expect(inserted.name).toBe("Pay bills");
            expect(inserted.status).toBe("todo");

            const [retrieved] = await db
                .select()
                .from(adminTasks)
                .where(eq(adminTasks.id, inserted.id));

            expect(retrieved.name).toBe("Pay bills");
            expect(retrieved.dueDate).toBe("2026-02-01");
        });

        it("updates task status", async () => {
            const [inserted] = await db.insert(adminTasks).values({
                name: "Complete task",
                status: "todo",
                userId: TEST_USER_ID,
            }).returning();

            await db
                .update(adminTasks)
                .set({ status: "done" })
                .where(eq(adminTasks.id, inserted.id));

            const [updated] = await db
                .select()
                .from(adminTasks)
                .where(eq(adminTasks.id, inserted.id));

            expect(updated.status).toBe("done");
        });
    });

    describe("Inbox Log table", () => {
        it("inserts and retrieves an inbox entry", async () => {
            const [inserted] = await db.insert(inboxLog).values({
                originalText: "Need to call dentist",
                filedTo: "admin",
                status: "pending",
                userId: TEST_USER_ID,
            }).returning();

            expect(inserted).toBeDefined();
            expect(inserted.originalText).toBe("Need to call dentist");
            expect(inserted.filedTo).toBe("admin");

            const [retrieved] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, inserted.id));

            expect(retrieved.originalText).toBe("Need to call dentist");
        });

        it("tracks confidence scores", async () => {
            const [inserted] = await db.insert(inboxLog).values({
                originalText: "Meeting with John",
                filedTo: "people",
                confidence: 85,
                status: "filed",
                userId: TEST_USER_ID,
            }).returning();

            const [retrieved] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, inserted.id));

            expect(retrieved.confidence).toBe(85);
        });
    });
});

describe("Database Constraints", () => {
    beforeAll(async () => {
        await createTables();
    });

    it("generates unique UUIDs for each record", async () => {
        const [project1] = await db.insert(projects).values({
            name: "Project 1",
            userId: TEST_USER_ID,
        }).returning();

        const [project2] = await db.insert(projects).values({
            name: "Project 2",
            userId: TEST_USER_ID,
        }).returning();

        expect(project1.id).not.toBe(project2.id);
        expect(project1.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format

        // Cleanup
        await db.delete(projects).where(eq(projects.userId, TEST_USER_ID));
    });

    it("sets default timestamps on insert", async () => {
        const [inserted] = await db.insert(projects).values({
            name: "Timestamped Project",
            userId: TEST_USER_ID,
        }).returning();

        expect(inserted.createdAt).toBeDefined();
        expect(inserted.lastTouched).toBeDefined();

        // Cleanup
        await db.delete(projects).where(eq(projects.id, inserted.id));
    });

    it("enforces required fields", async () => {
        // This should fail because name is required
        await expect(
            db.insert(projects).values({
                userId: TEST_USER_ID,
                // name is missing
            } as any)
        ).rejects.toThrow();
    });
});
