/**
 * Capture Analytics API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

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
}

async function cleanup() {
    try {
        await db.delete(inboxLog);
    } catch {
        // Table might not exist
    }
}

async function seedTestData() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 mins ago
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await db.insert(inboxLog).values([
        {
            id: "capture-1",
            originalText: "Today's capture",
            filedTo: "projects",
            status: "filed",
            captureSource: "voice",
            createdAt: hourAgo.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "capture-2",
            originalText: "Today's text capture",
            filedTo: "ideas",
            status: "filed",
            captureSource: "web",
            createdAt: now.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "capture-3",
            originalText: "Yesterday's capture",
            filedTo: "admin",
            status: "filed",
            captureSource: "web",
            createdAt: yesterday.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
        {
            id: "capture-4",
            originalText: "Needs review item",
            filedTo: "needs_review",
            status: "needs_review",
            captureSource: "voice",
            createdAt: twoDaysAgo.toISOString(),
            userId: CONFIG.SINGLE_USER_ID,
        },
    ]);
}

describe("GET /api/analytics/captures", () => {
    beforeEach(async () => {
        await createTables();
        await cleanup();
        await seedTestData();
    });

    afterEach(async () => {
        await cleanup();
    });

    it("returns capture statistics", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats).toBeDefined();
        expect(data.pattern).toBeDefined();
    });

    it("counts today's captures", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        // Should have 2 captures from today
        expect(data.stats.todayCount).toBe(2);
    });

    it("counts captures by type", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(data.stats.byType.projects).toBeGreaterThanOrEqual(0);
        expect(data.stats.byType.ideas).toBeGreaterThanOrEqual(0);
        expect(data.stats.byType.admin).toBeGreaterThanOrEqual(0);
    });

    it("tracks voice vs text captures", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(data.stats.voiceVsText).toBeDefined();
        expect(data.stats.voiceVsText.voice).toBeGreaterThanOrEqual(0);
        expect(data.stats.voiceVsText.text).toBeGreaterThanOrEqual(0);
    });

    it("calculates activity patterns", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(data.pattern.capturesByHour).toHaveLength(24);
        expect(data.pattern.capturesByDay).toHaveLength(7);
        expect(data.pattern.peakHours).toBeDefined();
        expect(Array.isArray(data.pattern.peakHours)).toBe(true);
    });

    it("calculates weekly totals", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(data.pattern.totalThisWeek).toBeGreaterThanOrEqual(0);
        expect(data.pattern.averagePerDay).toBeGreaterThanOrEqual(0);
    });

    it("determines trend", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(["up", "down", "stable"]).toContain(data.pattern.trend);
    });

    it("includes generation metadata", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(data.generatedAt).toBeDefined();
        expect(data.period).toBe("today");
    });

    it("respects period parameter", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures?period=week");
        const response = await GET(req);
        const data = await response.json();

        expect(data.period).toBe("week");
    });

    it("returns last capture timestamp", async () => {
        const req = new NextRequest("http://localhost/api/analytics/captures");
        const response = await GET(req);
        const data = await response.json();

        expect(data.stats.lastCaptureAt).toBeDefined();
    });
});
