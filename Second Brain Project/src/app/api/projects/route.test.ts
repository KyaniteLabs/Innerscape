import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PATCH, DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock config
vi.mock("@/lib/config", () => ({
    CONFIG: {
        SINGLE_USER_ID: "test-user",
        HTTP: {
            OK: 200,
            CREATED: 201,
            BAD_REQUEST: 400,
            NOT_FOUND: 404,
            INTERNAL_SERVER_ERROR: 500,
        },
    },
}));

// Mock the database
vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: "proj-1", name: "Test Project", status: "active", tags: '["test"]' }])
                    })
                })
            })
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: "proj-new", name: "New Project", status: "active", tags: '["test"]' }])
            })
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: "proj-1", name: "Updated Project", status: "active", tags: '["test"]' }])
                })
            })
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: "proj-1" }])
            })
        })
    }
}));

describe("Projects API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe("GET", () => {
        it("returns a list of projects", async () => {
            const req = new NextRequest("http://localhost/api/projects");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.items).toHaveLength(1);
            expect(data.items[0].tags).toEqual(["test"]);
        });
    });

    describe("POST", () => {
        it("creates a new project", async () => {
            const req = new NextRequest("http://localhost/api/projects", {
                method: "POST",
                body: JSON.stringify({ name: "New Project", tags: ["test"] }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.item.name).toBe("New Project");
        });

        it("returns 400 if name is missing", async () => {
            const req = new NextRequest("http://localhost/api/projects", {
                method: "POST",
                body: JSON.stringify({ tags: ["test"] }),
            });
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
        });
    });

    describe("PATCH", () => {
        it("updates an existing project", async () => {
            const req = new NextRequest("http://localhost/api/projects", {
                method: "PATCH",
                body: JSON.stringify({ id: "proj-1", name: "Updated Project" }),
            });
            const response = await PATCH(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.item.name).toBe("Updated Project");
        });
    });

    describe("DELETE", () => {
        it("deletes a project", async () => {
            const req = new NextRequest("http://localhost/api/projects?id=proj-1", {
                method: "DELETE",
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.deleted).toBe(true);
        });
    });
});
