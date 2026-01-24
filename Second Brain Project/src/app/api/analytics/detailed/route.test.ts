/**
 * Detailed Analytics API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { db } from "@/lib/db";
import { inboxLog, adminTasks, projects, corrections } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// Mock getHealthMetrics
vi.mock("@/lib/agent/analytics", () => ({
    getHealthMetrics: vi.fn().mockResolvedValue({
        accuracy: 85,
        healthScore: 80,
        correctionsTrend: "stable" as const,
        correctionsToday: 2,
        lastOptimization: "2024-01-10T00:00:00Z",
        recommendations: ["Consider reviewing admin task classifications"],
    }),
}));

async function createTables() {
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
        CREATE TABLE IF NOT EXISTS corrections (
            id TEXT PRIMARY KEY,
            inbox_id TEXT NOT NULL,
            original_destination TEXT,
            corrected_destination TEXT NOT NULL,
            corrected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )
    `);
}

async function cleanup() {
    try {
        await db.delete(inboxLog);
        await db.delete(adminTasks);
        await db.delete(projects);
        await db.delete(corrections);
    } catch {
        // Tables might not exist
    }
}

async function seedTestData() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Add some captures
    await db.insert(inboxLog).values([
        {
            id: "capture-1",
            originalText: "Test capture 1",
            filedTo: "projects",
            status: "filed",
            captureSource: "voice",
            createdAt: now.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "capture-2",
            originalText: "Test capture 2",
            filedTo: "ideas",
            status: "filed",
            captureSource: "web",
            createdAt: yesterday.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "capture-3",
            originalText: "Test capture 3",
            filedTo: "admin",
            status: "filed",
            captureSource: "web",
            createdAt: lastWeek.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
    ]);

    // Add tasks
    await db.insert(adminTasks).values([
        {
            id: "task-1",
            name: "Test task 1",
            status: "done",
            createdAt: now.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "task-2",
            name: "Test task 2",
            status: "todo",
            createdAt: yesterday.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
    ]);

    // Add projects
    await db.insert(projects).values([
        {
            id: "proj-1",
            name: "Active Project",
            status: "active",
            userId: CONFIG.SINGLE_USER_ID,
        },
    ]);
}

describe("GET /api/analytics/detailed", () => {
    beforeEach(async () => {
        await createTables();
        await cleanup();
        await seedTestData();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("returns comprehensive analytics", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.activity).toBeDefined();
        expect(data.productivity).toBeDefined();
        expect(data.regulation).toBeDefined();
        expect(data.health).toBeDefined();
        expect(data.insights).toBeDefined();
    });

    it("includes activity metrics", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed");
        const response = await GET(req);
        const data = await response.json();

        expect(data.activity.capturesByHour).toHaveLength(24);
        expect(data.activity.capturesByDay).toHaveLength(7);
        expect(data.activity.capturesByType).toBeDefined();
        expect(data.activity.voiceVsText).toBeDefined();
    });

    it("includes productivity metrics", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed");
        const response = await GET(req);
        const data = await response.json();

        expect(data.productivity.completionRate).toBeDefined();
        expect(data.productivity.tasksCompletedThisWeek).toBeDefined();
        expect(data.productivity.projectsWithActivity).toBeGreaterThanOrEqual(0);
    });

    it("includes health metrics", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed");
        const response = await GET(req);
        const data = await response.json();

        expect(data.health.accuracy).toBe(85);
        expect(data.health.healthScore).toBe(80);
        expect(data.health.recommendations).toBeDefined();
    });

    it("generates insights", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed");
        const response = await GET(req);
        const data = await response.json();

        expect(Array.isArray(data.insights)).toBe(true);
    });

    it("respects days parameter", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed?days=7");
        const response = await GET(req);
        const data = await response.json();

        expect(data.period).toBe("7 days");
    });

    it("includes generation timestamp", async () => {
        const req = new NextRequest("http://localhost/api/analytics/detailed");
        const response = await GET(req);
        const data = await response.json();

        expect(data.generatedAt).toBeDefined();
        expect(new Date(data.generatedAt)).toBeInstanceOf(Date);
    });
});
