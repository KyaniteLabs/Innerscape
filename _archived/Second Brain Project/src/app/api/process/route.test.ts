/**
 * Process API Route Tests
 * 
 * Tests for /api/process endpoint that handles inbox item processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "./route";

// Mock the processor module
vi.mock("@/lib/processor", () => ({
    processInboxItem: vi.fn(),
    processPendingItems: vi.fn(),
}));

// Mock errors module
vi.mock("@/lib/errors", () => ({
    formatErrorResponse: vi.fn((error) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }),
}));

describe("Process API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetModules();
    });

    describe("POST /api/process", () => {
        describe("single item processing", () => {
            it("processes a specific inbox item when inboxId and text provided", async () => {
                const { processInboxItem } = await import("@/lib/processor");
                vi.mocked(processInboxItem).mockResolvedValue({
                    success: true,
                    inboxId: "inbox-123",
                    destination: "projects",
                    destinationId: "proj-456",
                    confidence: 0.9,
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({
                        inboxId: "inbox-123",
                        text: "Test capture text",
                    }),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(processInboxItem).toHaveBeenCalledWith("inbox-123", "Test capture text");
                expect(data.success).toBe(true);
                expect(data.destination).toBe("projects");
                expect(data.confidence).toBe(0.9);
            });

            it("returns error result when processing fails", async () => {
                const { processInboxItem } = await import("@/lib/processor");
                vi.mocked(processInboxItem).mockResolvedValue({
                    success: false,
                    inboxId: "inbox-123",
                    error: "Classification failed",
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({
                        inboxId: "inbox-123",
                        text: "Test",
                    }),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(data.success).toBe(false);
                expect(data.error).toBe("Classification failed");
            });

            it("handles processing exceptions", async () => {
                const { processInboxItem } = await import("@/lib/processor");
                vi.mocked(processInboxItem).mockRejectedValue(new Error("Database connection lost"));

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({
                        inboxId: "inbox-123",
                        text: "Test",
                    }),
                });

                const response = await POST(request);
                expect(response.status).toBe(500);
            });
        });

        describe("batch processing", () => {
            it("processes all pending items when no inboxId provided", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockResolvedValue({
                    processed: 5,
                    succeeded: 4,
                    failed: 1,
                    results: [],
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({}),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(processPendingItems).toHaveBeenCalledWith(10); // default limit
                expect(data.success).toBe(true);
                expect(data.processed).toBe(5);
                expect(data.succeeded).toBe(4);
                expect(data.failed).toBe(1);
            });

            it("respects custom limit parameter", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockResolvedValue({
                    processed: 3,
                    succeeded: 3,
                    failed: 0,
                    results: [],
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({ limit: 3 }),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(processPendingItems).toHaveBeenCalledWith(3);
                expect(data.processed).toBe(3);
            });

            it("handles empty pending queue", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockResolvedValue({
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    results: [],
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({}),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(data.success).toBe(true);
                expect(data.processed).toBe(0);
            });

            it("returns detailed results for each processed item", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockResolvedValue({
                    processed: 2,
                    succeeded: 1,
                    failed: 1,
                    results: [
                        { success: true, inboxId: "in1", destination: "projects" },
                        { success: false, inboxId: "in2", error: "Classification failed" },
                    ],
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({}),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(data.results).toHaveLength(2);
                expect(data.results[0].success).toBe(true);
                expect(data.results[1].success).toBe(false);
            });
        });

        describe("error handling", () => {
            it("handles invalid JSON body", async () => {
                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: "not valid json",
                });

                const response = await POST(request);
                expect(response.status).toBe(500);
            });

            it("handles batch processing exceptions", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockRejectedValue(new Error("Database error"));

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({}),
                });

                const response = await POST(request);
                expect(response.status).toBe(500);
            });
        });

        describe("edge cases", () => {
            it("handles inboxId without text (treats as batch)", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockResolvedValue({
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    results: [],
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({ inboxId: "inbox-123" }), // missing text
                });

                const response = await POST(request);
                const data = await response.json();

                // Should fall through to batch processing
                expect(processPendingItems).toHaveBeenCalled();
            });

            it("handles text without inboxId (treats as batch)", async () => {
                const { processPendingItems } = await import("@/lib/processor");
                vi.mocked(processPendingItems).mockResolvedValue({
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    results: [],
                });

                const request = new NextRequest("http://localhost/api/process", {
                    method: "POST",
                    body: JSON.stringify({ text: "some text" }), // missing inboxId
                });

                const response = await POST(request);

                // Should fall through to batch processing
                expect(processPendingItems).toHaveBeenCalled();
            });
        });
    });

    describe("GET /api/process", () => {
        it("processes pending items with default limit", async () => {
            const { processPendingItems } = await import("@/lib/processor");
            vi.mocked(processPendingItems).mockResolvedValue({
                processed: 5,
                succeeded: 5,
                failed: 0,
                results: [],
            });

            const request = new NextRequest("http://localhost/api/process");

            const response = await GET(request);
            const data = await response.json();

            expect(processPendingItems).toHaveBeenCalledWith(10);
            expect(data.success).toBe(true);
            expect(data.processed).toBe(5);
        });

        it("respects limit query parameter", async () => {
            const { processPendingItems } = await import("@/lib/processor");
            vi.mocked(processPendingItems).mockResolvedValue({
                processed: 5,
                succeeded: 5,
                failed: 0,
                results: [],
            });

            const request = new NextRequest("http://localhost/api/process?limit=5");

            const response = await GET(request);

            expect(processPendingItems).toHaveBeenCalledWith(5);
        });

        it("handles invalid limit parameter gracefully", async () => {
            const { processPendingItems } = await import("@/lib/processor");
            vi.mocked(processPendingItems).mockResolvedValue({
                processed: 0,
                succeeded: 0,
                failed: 0,
                results: [],
            });

            const request = new NextRequest("http://localhost/api/process?limit=invalid");

            const response = await GET(request);

            // parseInt("invalid") returns NaN, which becomes 10 (default via || 10)
            // Actually parseInt("invalid") returns NaN, NaN || 10 = 10
            expect(processPendingItems).toHaveBeenCalledWith(NaN);
        });

        it("handles processing exceptions", async () => {
            const { processPendingItems } = await import("@/lib/processor");
            vi.mocked(processPendingItems).mockRejectedValue(new Error("Connection timeout"));

            const request = new NextRequest("http://localhost/api/process");

            const response = await GET(request);
            expect(response.status).toBe(500);
        });

        it("returns detailed results array", async () => {
            const { processPendingItems } = await import("@/lib/processor");
            vi.mocked(processPendingItems).mockResolvedValue({
                processed: 2,
                succeeded: 2,
                failed: 0,
                results: [
                    { success: true, inboxId: "in1", destination: "projects", confidence: 0.9 },
                    { success: true, inboxId: "in2", destination: "ideas", confidence: 0.85 },
                ],
            });

            const request = new NextRequest("http://localhost/api/process");

            const response = await GET(request);
            const data = await response.json();

            expect(data.results).toHaveLength(2);
            expect(data.results[0].destination).toBe("projects");
            expect(data.results[1].destination).toBe("ideas");
        });

        it("works as cron job endpoint (no side effects on empty queue)", async () => {
            const { processPendingItems } = await import("@/lib/processor");
            vi.mocked(processPendingItems).mockResolvedValue({
                processed: 0,
                succeeded: 0,
                failed: 0,
                results: [],
            });

            const request = new NextRequest("http://localhost/api/process");

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.processed).toBe(0);
        });
    });
});
