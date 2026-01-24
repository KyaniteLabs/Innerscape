import { describe, it, expect, vi, beforeEach } from "vitest";
import { processInboxItem, processPendingItems } from "./processor";
import { classifyWithGLM } from "@/lib/ai/classifier";
import { fileClassifiedItem } from "@/lib/filing";
import { db } from "@/lib/db";

// Mock dependencies
vi.mock("@/lib/ai/classifier", () => ({
    classifyWithGLM: vi.fn(),
    CLASSIFICATION_PROMPT: ""
}));

vi.mock("@/lib/filing", () => ({
    fileClassifiedItem: vi.fn()
}));

vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn()
    }
}));

// Mock config
vi.mock("@/lib/config", () => ({
    CONFIG: {
        AI: { CONFIDENCE_THRESHOLD: 0.6 },
        AGENT: { 
            ENABLED: false,  // Use legacy classifier in tests
            USE_LEGACY_CLASSIFIER: true,
        },
        SINGLE_USER_ID: "test-user",
        HTTP: {
            BAD_REQUEST: 400,
            NOT_FOUND: 404,
            INTERNAL_SERVER_ERROR: 500,
            BAD_GATEWAY: 502,
        },
    }
}));

describe("Processor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Default success mocks
        vi.mocked(classifyWithGLM).mockResolvedValue({
            destination: "projects",
            confidence: 0.9,
            data: { name: "Test Project" }
        });
        
        vi.mocked(fileClassifiedItem).mockResolvedValue({
            success: true,
            destination: "projects",
            destinationId: "proj-123"
        });
    });

    describe("processInboxItem", () => {
        it("classifies and files an item successfully", async () => {
            const result = await processInboxItem("inbox-1", "Test text");

            expect(result.success).toBe(true);
            expect(result.destination).toBe("projects");
            expect(result.destinationId).toBe("proj-123");
        });

        it("returns error if filing fails", async () => {
            vi.mocked(fileClassifiedItem).mockResolvedValueOnce({
                success: false,
                error: "Filing failed"
            });

            const result = await processInboxItem("inbox-1", "Test text");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Filing failed");
        });
    });

    describe("processPendingItems", () => {
        it("processes multiple items", async () => {
            const mockSelectResult = [
                { id: "inbox-1", originalText: "Test" }
            ];
            
            // Fix the chaining mock more robustly
            const mockLimit = vi.fn().mockResolvedValue(mockSelectResult);
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const result = await processPendingItems(5);

            expect(result.processed).toBe(1);
            expect(result.succeeded).toBe(1);
            expect(result.results).toHaveLength(1);
        });
    });
});
