/**
 * Unified Items API Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock the unified items module
vi.mock("@/lib/unified/items", () => ({
    getAllItems: vi.fn().mockResolvedValue([
        {
            id: "proj-1",
            type: "projects",
            name: "Test Project",
            content: "Project notes",
            metadata: { status: "active" },
            temporal: {
                createdAt: "2024-01-01T00:00:00Z",
                lastTouched: "2024-01-15T00:00:00Z",
                dueDate: null,
                archivedAt: null,
            },
            tags: ["work"],
            userId: "personal",
        },
        {
            id: "idea-1",
            type: "ideas",
            name: "Test Idea",
            content: "Idea notes",
            metadata: { oneLiner: "A great idea" },
            temporal: {
                createdAt: "2024-01-02T00:00:00Z",
                lastTouched: "2024-01-10T00:00:00Z",
                dueDate: null,
                archivedAt: null,
            },
            tags: ["creative"],
            userId: "personal",
        },
    ]),
}));

describe("GET /api/unified", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns unified items list", async () => {
        const req = new NextRequest("http://localhost/api/unified");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.items).toHaveLength(2);
        expect(data.count).toBe(2);
    });

    it("filters by type parameter", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        
        const req = new NextRequest("http://localhost/api/unified?type=projects");
        await GET(req);

        expect(getAllItems).toHaveBeenCalledWith(
            expect.objectContaining({ type: "projects" })
        );
    });

    it("includes archived when requested", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        
        const req = new NextRequest("http://localhost/api/unified?includeArchived=true");
        await GET(req);

        expect(getAllItems).toHaveBeenCalledWith(
            expect.objectContaining({ includeArchived: true })
        );
    });

    it("respects limit parameter", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        
        const req = new NextRequest("http://localhost/api/unified?limit=10");
        await GET(req);

        expect(getAllItems).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 10 })
        );
    });

    it("respects offset parameter", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        
        const req = new NextRequest("http://localhost/api/unified?offset=20");
        await GET(req);

        expect(getAllItems).toHaveBeenCalledWith(
            expect.objectContaining({ offset: 20 })
        );
    });

    it("respects sortBy parameter", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        
        const req = new NextRequest("http://localhost/api/unified?sortBy=createdAt");
        await GET(req);

        expect(getAllItems).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: "createdAt" })
        );
    });

    it("uses default values when no params provided", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        
        const req = new NextRequest("http://localhost/api/unified");
        await GET(req);

        expect(getAllItems).toHaveBeenCalledWith(
            expect.objectContaining({
                limit: 50,
                offset: 0,
                sortBy: "lastTouched",
                includeArchived: false,
            })
        );
    });

    it("handles errors gracefully", async () => {
        const { getAllItems } = await import("@/lib/unified/items");
        vi.mocked(getAllItems).mockRejectedValueOnce(new Error("Database error"));

        const req = new NextRequest("http://localhost/api/unified");
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
    });
});
