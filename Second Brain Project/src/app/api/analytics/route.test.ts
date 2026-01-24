/**
 * Analytics API Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock the analytics functions
vi.mock("@/lib/agent/analytics", () => ({
    getAccuracyMetrics: vi.fn().mockResolvedValue({
        totalCaptures: 100,
        correctClassifications: 85,
        accuracy: 0.85,
    }),
    getConfusionPatterns: vi.fn().mockResolvedValue([
        { from: "projects", to: "admin", count: 5 },
        { from: "ideas", to: "projects", count: 3 },
    ]),
    getHealthMetrics: vi.fn().mockResolvedValue({
        pendingItems: 10,
        stuckItems: 2,
        averageProcessingTime: 150,
    }),
}));

describe("GET /api/analytics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns all analytics by default", async () => {
        const req = new NextRequest("http://localhost/api/analytics");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generatedAt).toBeDefined();
        expect(data.period).toBe("30 days");
        expect(data.metrics).toBeDefined();
        expect(data.patterns).toBeDefined();
        expect(data.health).toBeDefined();
    });

    it("respects days parameter", async () => {
        const req = new NextRequest("http://localhost/api/analytics?days=7");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.period).toBe("7 days");
    });

    it("returns only metrics when include=metrics", async () => {
        const req = new NextRequest("http://localhost/api/analytics?include=metrics");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.metrics).toBeDefined();
        expect(data.patterns).toBeUndefined();
        expect(data.health).toBeUndefined();
    });

    it("returns only patterns when include=patterns", async () => {
        const req = new NextRequest("http://localhost/api/analytics?include=patterns");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.metrics).toBeUndefined();
        expect(data.patterns).toBeDefined();
        expect(data.health).toBeUndefined();
    });

    it("returns multiple sections when include has multiple values", async () => {
        const req = new NextRequest("http://localhost/api/analytics?include=metrics,health");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.metrics).toBeDefined();
        expect(data.health).toBeDefined();
        expect(data.patterns).toBeUndefined();
    });

    it("handles errors gracefully", async () => {
        const { getAccuracyMetrics } = await import("@/lib/agent/analytics");
        vi.mocked(getAccuracyMetrics).mockRejectedValueOnce(new Error("Database error"));

        const req = new NextRequest("http://localhost/api/analytics?include=metrics");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
    });
});
