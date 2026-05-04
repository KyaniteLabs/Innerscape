import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

// Mock the database
vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 5 }])
            })
        })
    }
}));

describe("Stats API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it("returns dashboard statistics", async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats).toBeDefined();
        expect(data.stats.projects.total).toBe(5);
    });
});
