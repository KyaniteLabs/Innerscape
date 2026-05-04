/**
 * Integration Tests: Analytics Flow
 * 
 * Tests the analytics data collection and calculation flows.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { inboxLog, adminTasks, corrections } from "@/lib/db/schema";
import { sql, eq, and, gte, count } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// Setup tables
async function setupTables() {
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS inbox_log (
            id TEXT PRIMARY KEY,
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
        CREATE TABLE IF NOT EXISTS corrections (
            id TEXT PRIMARY KEY,
            inbox_id TEXT NOT NULL,
            original_destination TEXT NOT NULL,
            corrected_destination TEXT NOT NULL,
            original_confidence INTEGER,
            text_snippet TEXT,
            corrected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )
    `);
}

async function cleanup() {
    try {
        await db.delete(inboxLog);
        await db.delete(adminTasks);
        await db.delete(corrections);
    } catch {
        // Tables might not exist
    }
}

describe("Capture Analytics", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    describe("Capture Counting", () => {
        it("counts captures by time period", async () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Add captures at different times
            await db.insert(inboxLog).values([
                { id: "today-1", originalText: "Today 1", createdAt: now.toISOString(), userId: CONFIG.SINGLE_USER_ID },
                { id: "today-2", originalText: "Today 2", createdAt: now.toISOString(), userId: CONFIG.SINGLE_USER_ID },
                { id: "yesterday-1", originalText: "Yesterday", createdAt: yesterday.toISOString(), userId: CONFIG.SINGLE_USER_ID },
                { id: "lastweek-1", originalText: "Last week", createdAt: lastWeek.toISOString(), userId: CONFIG.SINGLE_USER_ID },
            ]);

            // Count today's captures
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayCaptures = await db
                .select({ count: count() })
                .from(inboxLog)
                .where(and(
                    eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                    gte(inboxLog.createdAt, todayStart.toISOString())
                ));

            expect(todayCaptures[0].count).toBe(2);

            // Count all captures
            const allCaptures = await db
                .select({ count: count() })
                .from(inboxLog)
                .where(eq(inboxLog.userId, CONFIG.SINGLE_USER_ID));

            expect(allCaptures[0].count).toBe(4);
        });

        it("groups captures by destination type", async () => {
            await db.insert(inboxLog).values([
                { id: "proj-1", originalText: "Project 1", filedTo: "projects", status: "filed", userId: CONFIG.SINGLE_USER_ID },
                { id: "proj-2", originalText: "Project 2", filedTo: "projects", status: "filed", userId: CONFIG.SINGLE_USER_ID },
                { id: "idea-1", originalText: "Idea 1", filedTo: "ideas", status: "filed", userId: CONFIG.SINGLE_USER_ID },
                { id: "admin-1", originalText: "Admin 1", filedTo: "admin", status: "filed", userId: CONFIG.SINGLE_USER_ID },
                { id: "pending-1", originalText: "Pending", status: "pending", userId: CONFIG.SINGLE_USER_ID },
            ]);

            const projectCount = await db
                .select({ count: count() })
                .from(inboxLog)
                .where(and(
                    eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                    eq(inboxLog.filedTo, "projects")
                ));

            expect(projectCount[0].count).toBe(2);

            const ideaCount = await db
                .select({ count: count() })
                .from(inboxLog)
                .where(and(
                    eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                    eq(inboxLog.filedTo, "ideas")
                ));

            expect(ideaCount[0].count).toBe(1);
        });

        it("tracks voice vs text captures", async () => {
            await db.insert(inboxLog).values([
                { id: "voice-1", originalText: "Voice 1", captureSource: "voice", userId: CONFIG.SINGLE_USER_ID },
                { id: "voice-2", originalText: "Voice 2", captureSource: "voice", userId: CONFIG.SINGLE_USER_ID },
                { id: "web-1", originalText: "Web 1", captureSource: "web", userId: CONFIG.SINGLE_USER_ID },
                { id: "ios-1", originalText: "iOS 1", captureSource: "ios", userId: CONFIG.SINGLE_USER_ID },
            ]);

            const voiceCount = await db
                .select({ count: count() })
                .from(inboxLog)
                .where(and(
                    eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                    eq(inboxLog.captureSource, "voice")
                ));

            expect(voiceCount[0].count).toBe(2);

            const textCount = await db
                .select({ count: count() })
                .from(inboxLog)
                .where(and(
                    eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                    sql`${inboxLog.captureSource} != 'voice'`
                ));

            expect(textCount[0].count).toBe(2);
        });
    });
});

describe("Task Analytics", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("calculates completion rate", async () => {
        await db.insert(adminTasks).values([
            { id: "todo-1", name: "Todo 1", status: "todo", userId: CONFIG.SINGLE_USER_ID },
            { id: "todo-2", name: "Todo 2", status: "todo", userId: CONFIG.SINGLE_USER_ID },
            { id: "done-1", name: "Done 1", status: "done", userId: CONFIG.SINGLE_USER_ID },
            { id: "done-2", name: "Done 2", status: "done", userId: CONFIG.SINGLE_USER_ID },
            { id: "done-3", name: "Done 3", status: "done", userId: CONFIG.SINGLE_USER_ID },
        ]);

        const total = await db
            .select({ count: count() })
            .from(adminTasks)
            .where(eq(adminTasks.userId, CONFIG.SINGLE_USER_ID));

        const completed = await db
            .select({ count: count() })
            .from(adminTasks)
            .where(and(
                eq(adminTasks.userId, CONFIG.SINGLE_USER_ID),
                eq(adminTasks.status, "done")
            ));

        const completionRate = (completed[0].count / total[0].count) * 100;
        expect(completionRate).toBe(60);
    });
});

describe("Correction Analytics", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("tracks classification corrections", async () => {
        // Create inbox entry
        await db.insert(inboxLog).values({
            id: "inbox-corrected",
            originalText: "Pay electricity bill",
            filedTo: "projects", // Misclassified
            status: "filed",
            userId: CONFIG.SINGLE_USER_ID,
        });

        // Record correction
        await db.insert(corrections).values({
            id: "correction-1",
            inboxId: "inbox-corrected",
            originalDestination: "projects",
            correctedDestination: "admin",
            userId: CONFIG.SINGLE_USER_ID,
        });

        // Update inbox with correction
        await db
            .update(inboxLog)
            .set({ filedTo: "admin", status: "fixed" })
            .where(eq(inboxLog.id, "inbox-corrected"));

        // Verify correction was recorded
        const [correction] = await db
            .select()
            .from(corrections)
            .where(eq(corrections.inboxId, "inbox-corrected"));

        expect(correction.originalDestination).toBe("projects");
        expect(correction.correctedDestination).toBe("admin");

        // Verify inbox was updated
        const [inbox] = await db
            .select()
            .from(inboxLog)
            .where(eq(inboxLog.id, "inbox-corrected"));

        expect(inbox.status).toBe("fixed");
        expect(inbox.filedTo).toBe("admin");
    });

    it("calculates accuracy from corrections", async () => {
        // Simulate 10 captures, 2 needed correction
        for (let i = 0; i < 10; i++) {
            await db.insert(inboxLog).values({
                id: `accuracy-${i}`,
                originalText: `Capture ${i}`,
                filedTo: "projects",
                status: i < 2 ? "fixed" : "filed",
                userId: CONFIG.SINGLE_USER_ID,
            });
        }

        // Add corrections for first 2
        await db.insert(corrections).values([
            { id: "corr-0", inboxId: "accuracy-0", originalDestination: "projects", correctedDestination: "admin", userId: CONFIG.SINGLE_USER_ID },
            { id: "corr-1", inboxId: "accuracy-1", originalDestination: "projects", correctedDestination: "ideas", userId: CONFIG.SINGLE_USER_ID },
        ]);

        const totalFiled = await db
            .select({ count: count() })
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                sql`${inboxLog.status} IN ('filed', 'fixed')`
            ));

        const correctionCount = await db
            .select({ count: count() })
            .from(corrections)
            .where(eq(corrections.userId, CONFIG.SINGLE_USER_ID));

        const accuracy = ((totalFiled[0].count - correctionCount[0].count) / totalFiled[0].count) * 100;
        expect(accuracy).toBe(80);
    });
});

describe("Time-based Analytics", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("calculates daily capture counts", async () => {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        
        // Add 5 captures for today
        for (let i = 0; i < 5; i++) {
            await db.insert(inboxLog).values({
                id: `daily-${i}`,
                originalText: `Daily capture ${i}`,
                createdAt: new Date(today.getTime() + i * 1000).toISOString(),
                userId: CONFIG.SINGLE_USER_ID,
            });
        }

        const todayStart = new Date(todayStr);
        const todayEnd = new Date(todayStr);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const dailyCount = await db
            .select({ count: count() })
            .from(inboxLog)
            .where(and(
                eq(inboxLog.userId, CONFIG.SINGLE_USER_ID),
                gte(inboxLog.createdAt, todayStart.toISOString()),
                sql`${inboxLog.createdAt} < ${todayEnd.toISOString()}`
            ));

        expect(dailyCount[0].count).toBe(5);
    });
});
