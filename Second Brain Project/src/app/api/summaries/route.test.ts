/**
 * Summaries API Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock rate limiter to always allow in tests
vi.mock("@/lib/rate-limit", () => ({
    rateLimit: vi.fn().mockReturnValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 }),
    rateLimitedResponse: vi.fn(),
}));

// Mock the summaries module
vi.mock("@/lib/summaries", () => ({
    generateDailySummary: vi.fn().mockResolvedValue({
        date: "2024-01-15",
        captures: {
            total: 10,
            byType: { projects: 2, people: 2, ideas: 4, admin: 2 }
        },
        highlights: ["Completed task X"],
        patterns: ["Pattern A"],
        suggestedActions: ["Action 1"],
        topItems: [{ type: "task", name: "Task X", capturedAt: "2024-01-15T10:00:00Z" }],
    }),
    storeDailySummary: vi.fn().mockResolvedValue(undefined),
    getDailySummary: vi.fn().mockResolvedValue(null),
    formatDailySummary: vi.fn().mockReturnValue("Formatted daily summary text"),
    generateWeeklyDigest: vi.fn().mockResolvedValue({
        weekStart: "2024-01-08",
        weekEnd: "2024-01-14",
        totalCaptures: 50,
        topProjects: ["Project A"],
    }),
    storeWeeklyDigest: vi.fn().mockResolvedValue(undefined),
    formatWeeklyDigest: vi.fn().mockReturnValue("Formatted weekly digest text"),
}));

describe("Summaries API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/summaries", () => {
        it("returns daily summary by default", async () => {
            const req = new NextRequest("http://localhost/api/summaries");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.summary).toBeDefined();
            expect(data.summary.date).toBe("2024-01-15");
        });

        it("returns cached summary when available", async () => {
            const { getDailySummary } = await import("@/lib/summaries");
            vi.mocked(getDailySummary).mockResolvedValueOnce({
                date: "2024-01-15",
                captures: {
                    total: 5,
                    byType: { projects: 1, people: 1, ideas: 2, admin: 1 }
                },
                highlights: [],
                patterns: [],
                suggestedActions: [],
                topItems: [{ type: "Project", name: "Cached Project", capturedAt: "2024-01-15T10:00:00Z" }],
            });

            const req = new NextRequest("http://localhost/api/summaries");
            const response = await GET(req);
            const data = await response.json();

            expect(data.summary.topItems[0].name).toBe("Cached Project");
        });

        it("forces regeneration when generate=true", async () => {
            const { generateDailySummary, getDailySummary } = await import("@/lib/summaries");
            vi.mocked(getDailySummary).mockResolvedValueOnce({
                date: "2024-01-15",
                captures: {
                    total: 5,
                    byType: { projects: 1, people: 1, ideas: 2, admin: 1 }
                },
                highlights: [],
                patterns: [],
                suggestedActions: [],
                topItems: [],
            });

            const req = new NextRequest("http://localhost/api/summaries?generate=true");
            await GET(req);

            // Should call generate even though cached exists
            expect(generateDailySummary).toHaveBeenCalled();
        });

        it("returns formatted text when format=text", async () => {
            const req = new NextRequest("http://localhost/api/summaries?format=text");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.formatted).toBe("Formatted daily summary text");
        });

        it("returns weekly digest when type=weekly", async () => {
            const req = new NextRequest("http://localhost/api/summaries?type=weekly");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.digest).toBeDefined();
            expect(data.digest.weekStart).toBe("2024-01-08");
        });

        it("returns formatted weekly text when format=text", async () => {
            const req = new NextRequest("http://localhost/api/summaries?type=weekly&format=text");
            const response = await GET(req);
            const data = await response.json();

            expect(data.formatted).toBe("Formatted weekly digest text");
        });

        it("returns error for invalid type", async () => {
            const req = new NextRequest("http://localhost/api/summaries?type=invalid");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain("Invalid type");
        });

        it("handles errors gracefully", async () => {
            const { generateDailySummary } = await import("@/lib/summaries");
            vi.mocked(generateDailySummary).mockRejectedValueOnce(new Error("Database error"));

            const req = new NextRequest("http://localhost/api/summaries");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
        });
    });

    describe("POST /api/summaries", () => {
        it("generates daily summary", async () => {
            const req = new NextRequest("http://localhost/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "daily" }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.summary).toBeDefined();
            expect(data.message).toContain("Daily summary");
        });

        it("generates weekly digest", async () => {
            const req = new NextRequest("http://localhost/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "weekly" }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.digest).toBeDefined();
            expect(data.message).toContain("Weekly digest");
        });

        it("defaults to daily type", async () => {
            const { generateDailySummary } = await import("@/lib/summaries");
            
            const req = new NextRequest("http://localhost/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            await POST(req);

            expect(generateDailySummary).toHaveBeenCalled();
        });

        it("returns error for invalid type", async () => {
            const req = new NextRequest("http://localhost/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "invalid" }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("Invalid type");
        });
    });
});
