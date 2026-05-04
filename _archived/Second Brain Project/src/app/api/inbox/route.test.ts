import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { NextRequest } from "next/server";

// Mock the database
vi.mock("@/lib/db", () => {
    const mockSelectResult = [{ 
        id: "inbox-1", 
        originalText: "Test", 
        status: "pending",
        filedTo: "admin",
        confidence: 80,
        userId: "personal"
    }];
    
    return {
        db: {
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                offset: vi.fn().mockResolvedValue(mockSelectResult)
                            })
                        }),
                        limit: vi.fn().mockResolvedValue(mockSelectResult)
                    })
                })
            }),
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: "inbox-1", status: "filed" }])
                    })
                })
            }),
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockResolvedValue([])
            })
        }
    };
});

// Mock the user-prefs learning function
vi.mock("@/lib/agent/memory/user-prefs", () => ({
    learnFromCorrection: vi.fn().mockResolvedValue(undefined)
}));

describe("Inbox API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe("GET", () => {
        it("returns inbox items", async () => {
            const req = new NextRequest("http://localhost/api/inbox");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.items).toHaveLength(1);
        });
    });

    describe("PATCH", () => {
        it("updates an inbox item", async () => {
            const req = new NextRequest("http://localhost/api/inbox", {
                method: "PATCH",
                body: JSON.stringify({ id: "inbox-1", status: "filed" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.item.status).toBe("filed");
        });
    });
});
