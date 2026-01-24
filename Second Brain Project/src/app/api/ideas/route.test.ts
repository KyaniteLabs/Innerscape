import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PATCH, DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock the database
vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: "idea-1", name: "Test Idea", tags: '["test"]' }])
                    })
                })
            })
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: "idea-new", name: "New Idea", tags: '["test"]' }])
            })
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: "idea-1", name: "Updated Idea", tags: '["test"]' }])
                })
            })
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: "idea-1" }])
            })
        })
    }
}));

describe("Ideas API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe("GET", () => {
        it("returns a list of ideas", async () => {
            const req = new NextRequest("http://localhost/api/ideas");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.items).toHaveLength(1);
        });
    });

    describe("POST", () => {
        it("creates a new idea", async () => {
            const req = new NextRequest("http://localhost/api/ideas", {
                method: "POST",
                body: JSON.stringify({ name: "New Idea" }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.item.name).toBe("New Idea");
        });
    });

    describe("PATCH", () => {
        it("updates an existing idea", async () => {
            const req = new NextRequest("http://localhost/api/ideas", {
                method: "PATCH",
                body: JSON.stringify({ id: "idea-1", name: "Updated Idea" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.item.name).toBe("Updated Idea");
        });
    });

    describe("DELETE", () => {
        it("deletes an idea", async () => {
            const req = new NextRequest("http://localhost/api/ideas?id=idea-1", {
                method: "DELETE",
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });
});
