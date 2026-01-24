/**
 * Optimization API Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock rate limiter to always allow in tests
vi.mock("@/lib/rate-limit", () => ({
    rateLimit: vi.fn().mockReturnValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
    rateLimitedResponse: vi.fn(),
}));

// Mock the optimization module
vi.mock("@/lib/agent/optimization", () => ({
    runOptimizationCycle: vi.fn().mockResolvedValue({
        timestamp: "2024-01-15T10:00:00Z",
        corrections: 15,
        patterns: 3,
        changes: [
            { type: "rule_update", description: "Updated project classification" },
            { type: "weight_adjust", description: "Increased context weight" },
        ],
    }),
    getOptimizationHistory: vi.fn().mockResolvedValue([
        {
            timestamp: "2024-01-15T10:00:00Z",
            corrections: 15,
            changes: 2,
        },
        {
            timestamp: "2024-01-14T10:00:00Z",
            corrections: 20,
            changes: 1,
        },
    ]),
    shouldRunOptimization: vi.fn().mockResolvedValue({
        shouldRun: true,
        reason: "15 new corrections since last optimization",
    }),
}));

describe("Optimization API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/optimize", () => {
        it("returns optimization status", async () => {
            const req = new NextRequest("http://localhost/api/optimize");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.status).toBeDefined();
            expect(data.status.shouldRun).toBe(true);
        });

        it("returns optimization history", async () => {
            const req = new NextRequest("http://localhost/api/optimize");
            const response = await GET(req);
            const data = await response.json();

            expect(data.history).toHaveLength(2);
            expect(data.lastRun).toBeDefined();
        });

        it("respects history limit parameter", async () => {
            const { getOptimizationHistory } = await import("@/lib/agent/optimization");
            
            const req = new NextRequest("http://localhost/api/optimize?history=10");
            await GET(req);

            expect(getOptimizationHistory).toHaveBeenCalledWith(10);
        });

        it("uses default history limit of 5", async () => {
            const { getOptimizationHistory } = await import("@/lib/agent/optimization");
            
            const req = new NextRequest("http://localhost/api/optimize");
            await GET(req);

            expect(getOptimizationHistory).toHaveBeenCalledWith(5);
        });

        it("shows when optimization is not needed", async () => {
            const { shouldRunOptimization } = await import("@/lib/agent/optimization");
            vi.mocked(shouldRunOptimization).mockResolvedValueOnce({
                shouldRun: false,
                reason: "Not enough corrections",
            });

            const req = new NextRequest("http://localhost/api/optimize");
            const response = await GET(req);
            const data = await response.json();

            expect(data.status.shouldRun).toBe(false);
            expect(data.status.reason).toContain("Not enough");
        });

        it("handles errors gracefully", async () => {
            const { shouldRunOptimization } = await import("@/lib/agent/optimization");
            vi.mocked(shouldRunOptimization).mockRejectedValueOnce(new Error("Database error"));

            const req = new NextRequest("http://localhost/api/optimize");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
        });
    });

    describe("POST /api/optimize", () => {
        it("runs optimization cycle", async () => {
            const req = new NextRequest("http://localhost/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.result).toBeDefined();
            expect(data.result.changes).toHaveLength(2);
        });

        it("skips when not needed and force is false", async () => {
            const { shouldRunOptimization, runOptimizationCycle } = await import("@/lib/agent/optimization");
            vi.mocked(shouldRunOptimization).mockResolvedValueOnce({
                shouldRun: false,
                reason: "Insufficient corrections",
            });

            const req = new NextRequest("http://localhost/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.skipped).toBe(true);
            expect(data.reason).toContain("Insufficient");
            expect(runOptimizationCycle).not.toHaveBeenCalled();
        });

        it("runs when force=true even if not needed", async () => {
            const { shouldRunOptimization, runOptimizationCycle } = await import("@/lib/agent/optimization");
            vi.mocked(shouldRunOptimization).mockResolvedValueOnce({
                shouldRun: false,
                reason: "Not needed",
            });

            const req = new NextRequest("http://localhost/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.skipped).toBeUndefined();
            expect(runOptimizationCycle).toHaveBeenCalled();
        });

        it("returns success message with change count", async () => {
            const req = new NextRequest("http://localhost/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(data.message).toContain("2 change(s)");
        });

        it("handles missing body gracefully", async () => {
            const req = new NextRequest("http://localhost/api/optimize", {
                method: "POST",
            });
            const response = await POST(req);
            const data = await response.json();

            // Should still work, defaulting to force=false
            expect(response.status).toBe(200);
        });

        it("handles errors gracefully", async () => {
            const { runOptimizationCycle } = await import("@/lib/agent/optimization");
            vi.mocked(runOptimizationCycle).mockRejectedValueOnce(new Error("Optimization failed"));

            const req = new NextRequest("http://localhost/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
        });
    });
});
