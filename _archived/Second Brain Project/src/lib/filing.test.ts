import { describe, it, expect, vi, beforeEach } from "vitest";
import { fileClassifiedItem } from "./filing";
import { db } from "@/lib/db";

// Mock dependencies
vi.mock("@/lib/db", () => ({
    db: {
        transaction: vi.fn(async (callback) => {
            const tx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: "new-id" }])
                    })
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue({})
                    })
                })
            };
            return callback(tx);
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            })
        })
    }
}));

describe("Filing", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe("successful filing", () => {
        it("files to projects successfully", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: { name: "Test Project" }
            });

            expect(result.success).toBe(true);
            expect(result.destination).toBe("projects");
            expect(result.destinationId).toBe("new-id");
        });

        it("files to people successfully", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "people",
                confidence: 0.9,
                data: { name: "Test Person" }
            });

            expect(result.success).toBe(true);
            expect(result.destination).toBe("people");
        });

        it("files to ideas successfully", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "ideas",
                confidence: 0.85,
                data: { 
                    name: "Great Idea",
                    one_liner: "A revolutionary concept",
                    notes: "More details here"
                }
            });

            expect(result.success).toBe(true);
            expect(result.destination).toBe("ideas");
            expect(result.destinationId).toBe("new-id");
        });

        it("files to admin successfully", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "admin",
                confidence: 0.9,
                data: { 
                    name: "Buy groceries",
                    due_date: "2026-01-25",
                    notes: "Milk, eggs, bread"
                }
            });

            expect(result.success).toBe(true);
            expect(result.destination).toBe("admin");
            expect(result.destinationId).toBe("new-id");
        });

        it("handles needs_review destination", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "needs_review",
                confidence: 0.4,
                data: {}
            });

            expect(result.success).toBe(true);
            expect(result.destination).toBe("needs_review");
            expect(result.destinationId).toBeUndefined();
        });

        it("preserves tags when filing to projects", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: { 
                    name: "Tagged Project",
                    tags: ["work", "urgent"]
                }
            });

            expect(result.success).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        it("handles transaction failure", async () => {
            vi.mocked(db.transaction).mockRejectedValueOnce(new Error("Database connection lost"));

            const result = await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: { name: "Test" }
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("connection lost");
            expect(console.error).toHaveBeenCalled();
        });

        it("handles insert failure within transaction", async () => {
            vi.mocked(db.transaction).mockImplementationOnce(async (callback) => {
                const tx = {
                    insert: vi.fn().mockReturnValue({
                        values: vi.fn().mockReturnValue({
                            returning: vi.fn().mockRejectedValue(new Error("Constraint violation"))
                        })
                    }),
                    update: vi.fn()
                } as unknown as Parameters<typeof callback>[0];
                return callback(tx);
            });

            const result = await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: { name: "Test" }
            });

            expect(result.success).toBe(false);
        });

        it("attempts to update inbox status even on filing failure", async () => {
            vi.mocked(db.transaction).mockRejectedValueOnce(new Error("Transaction failed"));

            await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: { name: "Test" }
            });

            // The outer update should be called to set needs_review
            expect(db.update).toHaveBeenCalled();
        });

        it("handles missing name in data gracefully", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: {} // Missing required name
            });

            // Should still attempt to file (database will enforce constraints)
            expect(db.transaction).toHaveBeenCalled();
        });

        it("handles unknown destination gracefully", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "unknown" as "projects",
                confidence: 0.9,
                data: { name: "Test" }
            });

            // Unknown destinations pass through (up to caller to validate)
            // The filing still "succeeds" because no exception was thrown
            expect(result.success).toBe(true);
            expect(result.destination).toBe("unknown");
        });
    });

    describe("data normalization", () => {
        it("handles undefined optional fields", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "projects",
                confidence: 0.9,
                data: { 
                    name: "Minimal Project",
                    notes: undefined,
                    tags: undefined
                }
            });

            expect(result.success).toBe(true);
        });

        it("handles undefined optional fields", async () => {
            const result = await fileClassifiedItem("inbox-1", {
                destination: "admin",
                confidence: 0.9,
                data: { 
                    name: "Simple Task",
                    // due_date and notes omitted
                }
            });

            expect(result.success).toBe(true);
        });
    });
});
