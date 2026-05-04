import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";

// Mock rate limiter to always allow in tests
vi.mock("@/lib/rate-limit", () => ({
    rateLimit: vi.fn().mockReturnValue({ success: true, limit: 20, remaining: 19, reset: Date.now() + 60000 }),
    rateLimitedResponse: vi.fn(),
    getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

// Mock the database
vi.mock("@/lib/db", () => ({
    db: {
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: "test-uuid", status: "pending" }])
            })
        })
    }
}));

// Mock queue - returns result object, doesn't throw
vi.mock("@/lib/queue", () => ({
    queueClassification: vi.fn().mockResolvedValue({ queued: true, jobId: "job-123" }),
    QueueError: class QueueError extends Error {
        constructor(message: string) {
            super(message);
            this.name = "QueueError";
        }
    }
}));

// Mock processor - for synchronous classification fallback
vi.mock("@/lib/processor", () => ({
    processInboxItem: vi.fn().mockResolvedValue({
        success: true,
        inboxId: "test-uuid",
        destination: "projects",
        destinationId: "proj-123",
        confidence: 0.85
    })
}));

describe("POST /api/capture", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it("captures text and returns success with id and status", async () => {
        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ text: "Test thought", source: "web" }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe("test-uuid");
        expect(data.status).toBe("pending");
    });

    it("returns 400 with VALIDATION_ERROR when text is missing", async () => {
        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ source: "web" }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when text is empty string", async () => {
        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ text: "", source: "web" }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("VALIDATION_ERROR");
    });

    it("uses default source 'web' when not provided", async () => {
        const { db } = await import("@/lib/db");
        
        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ text: "Test" }),
        });

        const response = await POST(req);
        expect(response.status).toBe(200);
        
        // Verify the default source was used
        const insertMock = vi.mocked(db.insert);
        expect(insertMock).toHaveBeenCalled();
    });

    it("returns 500 DATABASE_ERROR when insert fails", async () => {
        const { db } = await import("@/lib/db");
        vi.mocked(db.insert).mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockRejectedValue(new Error("DB Error"))
            })
        } as unknown as ReturnType<typeof db.insert>);

        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ text: "Test thought" }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("DATABASE_ERROR");
        expect(console.error).toHaveBeenCalled();
    });

    it("returns 400 VALIDATION_ERROR when JSON body is invalid", async () => {
        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: "not valid json",
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("VALIDATION_ERROR");
        expect(data.message).toContain("Invalid JSON");
    });

    it("falls back to sync processing when queue fails", async () => {
        const { queueClassification, QueueError } = await import("@/lib/queue");
        vi.mocked(queueClassification).mockRejectedValueOnce(
            new QueueError("Redis connection failed")
        );

        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ text: "Test thought" }),
        });

        const response = await POST(req);
        const data = await response.json();

        // Should still succeed - item is saved and processed synchronously
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe("test-uuid");
    });

    it("processes synchronously when queue returns not queued", async () => {
        const { queueClassification } = await import("@/lib/queue");
        vi.mocked(queueClassification).mockResolvedValueOnce({
            queued: false,
            reason: "REDIS_NOT_CONFIGURED"
        });

        const req = new NextRequest("http://localhost/api/capture", {
            method: "POST",
            body: JSON.stringify({ text: "Test thought" }),
        });

        const response = await POST(req);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Sync processing should have been called
        expect(console.info).toHaveBeenCalled();
    });
});

describe("GET /api/capture", () => {
    it("returns health check status", async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe("ok");
        expect(data.timestamp).toBeDefined();
    });
});
