/**
 * Integration Tests: CRUD Flow
 * 
 * Tests complete create, read, update, delete flows for all entity types.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { projects, adminTasks, people, ideas } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// Setup tables
async function setupTables() {
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
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
        CREATE TABLE IF NOT EXISTS admin_tasks (
            id TEXT PRIMARY KEY,
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
    
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS people (
            id TEXT PRIMARY KEY,
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
            id TEXT PRIMARY KEY,
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
}

async function cleanup() {
    try {
        await db.delete(projects);
        await db.delete(adminTasks);
        await db.delete(people);
        await db.delete(ideas);
    } catch {
        // Tables might not exist
    }
}

describe("Projects CRUD Flow", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("completes full CRUD lifecycle", async () => {
        // CREATE
        const [created] = await db.insert(projects).values({
            id: "proj-crud-1",
            name: "Test Project",
            status: "active",
            notes: "Initial notes",
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        expect(created.id).toBe("proj-crud-1");
        expect(created.name).toBe("Test Project");

        // READ
        const [read] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, "proj-crud-1"));

        expect(read).toBeDefined();
        expect(read.name).toBe("Test Project");

        // UPDATE
        await db
            .update(projects)
            .set({ 
                name: "Updated Project",
                status: "waiting",
                lastTouched: new Date().toISOString(),
            })
            .where(eq(projects.id, "proj-crud-1"));

        const [updated] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, "proj-crud-1"));

        expect(updated.name).toBe("Updated Project");
        expect(updated.status).toBe("waiting");

        // DELETE
        await db
            .delete(projects)
            .where(eq(projects.id, "proj-crud-1"));

        const [deleted] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, "proj-crud-1"));

        expect(deleted).toBeUndefined();
    });

    it("filters by status", async () => {
        // Create projects with different statuses
        await db.insert(projects).values([
            { id: "active-1", name: "Active 1", status: "active", userId: CONFIG.SINGLE_USER_ID },
            { id: "active-2", name: "Active 2", status: "active", userId: CONFIG.SINGLE_USER_ID },
            { id: "waiting-1", name: "Waiting 1", status: "waiting", userId: CONFIG.SINGLE_USER_ID },
            { id: "completed-1", name: "Completed 1", status: "completed", userId: CONFIG.SINGLE_USER_ID },
        ]);

        const activeProjects = await db
            .select()
            .from(projects)
            .where(and(
                eq(projects.userId, CONFIG.SINGLE_USER_ID),
                eq(projects.status, "active")
            ));

        expect(activeProjects).toHaveLength(2);
    });
});

describe("Admin Tasks CRUD Flow", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("completes task lifecycle: create → complete → verify", async () => {
        // Create task
        const [task] = await db.insert(adminTasks).values({
            id: "task-lifecycle-1",
            name: "Pay electricity bill",
            status: "todo",
            dueDate: new Date().toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        expect(task.status).toBe("todo");

        // Complete task
        await db
            .update(adminTasks)
            .set({ status: "done", lastTouched: new Date().toISOString() })
            .where(eq(adminTasks.id, "task-lifecycle-1"));

        const [completed] = await db
            .select()
            .from(adminTasks)
            .where(eq(adminTasks.id, "task-lifecycle-1"));

        expect(completed.status).toBe("done");
    });

    it("filters by completion status", async () => {
        await db.insert(adminTasks).values([
            { id: "todo-1", name: "Todo 1", status: "todo", userId: CONFIG.SINGLE_USER_ID },
            { id: "todo-2", name: "Todo 2", status: "todo", userId: CONFIG.SINGLE_USER_ID },
            { id: "done-1", name: "Done 1", status: "done", userId: CONFIG.SINGLE_USER_ID },
        ]);

        const todoTasks = await db
            .select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.userId, CONFIG.SINGLE_USER_ID),
                eq(adminTasks.status, "todo")
            ));

        expect(todoTasks).toHaveLength(2);

        const doneTasks = await db
            .select()
            .from(adminTasks)
            .where(and(
                eq(adminTasks.userId, CONFIG.SINGLE_USER_ID),
                eq(adminTasks.status, "done")
            ));

        expect(doneTasks).toHaveLength(1);
    });
});

describe("People CRUD Flow", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("creates and updates person with context", async () => {
        // Create
        const [person] = await db.insert(people).values({
            id: "person-1",
            name: "John Doe",
            context: "Met at conference",
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        expect(person.name).toBe("John Doe");

        // Update with follow-up
        await db
            .update(people)
            .set({ 
                followUps: "Send proposal by Friday",
                lastTouched: new Date().toISOString(),
            })
            .where(eq(people.id, "person-1"));

        const [updated] = await db
            .select()
            .from(people)
            .where(eq(people.id, "person-1"));

        expect(updated.followUps).toBe("Send proposal by Friday");
    });
});

describe("Ideas CRUD Flow", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("creates idea with one-liner and notes", async () => {
        const [idea] = await db.insert(ideas).values({
            id: "idea-1",
            name: "App Idea",
            oneLiner: "Task manager for ADHD minds",
            notes: "Focus on reducing friction...",
            userId: CONFIG.SINGLE_USER_ID,
        }).returning();

        expect(idea.oneLiner).toBe("Task manager for ADHD minds");
        expect(idea.notes).toContain("reducing friction");
    });
});

describe("Cross-Entity Relationships", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("can query all entity types for unified view", async () => {
        // Create one of each
        await db.insert(projects).values({
            id: "proj-unified",
            name: "Unified Test Project",
            userId: CONFIG.SINGLE_USER_ID,
        });

        await db.insert(adminTasks).values({
            id: "task-unified",
            name: "Unified Test Task",
            userId: CONFIG.SINGLE_USER_ID,
        });

        await db.insert(people).values({
            id: "person-unified",
            name: "Unified Test Person",
            userId: CONFIG.SINGLE_USER_ID,
        });

        await db.insert(ideas).values({
            id: "idea-unified",
            name: "Unified Test Idea",
            userId: CONFIG.SINGLE_USER_ID,
        });

        // Query all
        const projectList = await db.select().from(projects);
        const taskList = await db.select().from(adminTasks);
        const peopleList = await db.select().from(people);
        const ideaList = await db.select().from(ideas);

        expect(projectList).toHaveLength(1);
        expect(taskList).toHaveLength(1);
        expect(peopleList).toHaveLength(1);
        expect(ideaList).toHaveLength(1);

        // Combined count
        const totalItems = projectList.length + taskList.length + peopleList.length + ideaList.length;
        expect(totalItems).toBe(4);
    });
});
