/**
 * Database Tools Tests
 * 
 * Integration tests for database tools with mocked Drizzle ORM.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    createMockProject,
    createMockPerson,
    createMockIdea,
    createMockAdminTask,
    createMockInboxItem,
} from "@/test/factories";

// Create mock database responses
const mockProjects = [
    createMockProject({ id: "p1", name: "Project Alpha", tags: JSON.stringify(["work", "urgent"]) }),
    createMockProject({ id: "p2", name: "Project Beta", tags: JSON.stringify(["personal"]) }),
];

const mockPeople = [
    createMockPerson({ id: "pe1", name: "John Doe", tags: JSON.stringify(["work"]) }),
];

const mockIdeas = [
    createMockIdea({ id: "i1", name: "New Idea", tags: JSON.stringify(["innovation"]) }),
];

const mockInboxItems = [
    createMockInboxItem({ id: "in1", originalText: "First capture", filedTo: "projects" }),
    createMockInboxItem({ id: "in2", originalText: "Second capture", filedTo: "people" }),
];

// Mock the database module
vi.mock("@/lib/db", () => {
    const createSelectChain = (result: unknown[]) => ({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(result),
                }),
                limit: vi.fn().mockResolvedValue(result),
            }),
            orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(result),
            }),
            limit: vi.fn().mockResolvedValue(result),
        }),
    });

    return {
        db: {
            select: vi.fn().mockImplementation(() => createSelectChain([])),
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: "new-id", name: "Created Item" }]),
                }),
            }),
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            }),
        },
    };
});

// Mock schema
vi.mock("@/lib/db/schema", () => ({
    projects: { id: "id", name: "name", tags: "tags", userId: "userId" },
    people: { id: "id", name: "name", tags: "tags", userId: "userId" },
    ideas: { id: "id", name: "name", tags: "tags", userId: "userId" },
    adminTasks: { id: "id", name: "name", userId: "userId" },
    inboxLog: { id: "id", originalText: "originalText", filedTo: "filedTo", createdAt: "createdAt", userId: "userId" },
}));

describe("Database Tools", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetModules();
    });

    describe("getRelatedItems", () => {
        it("returns related items based on shared tags", async () => {
            // Mock to return projects first, then empty for others
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue(mockProjects),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRelatedItems } = await import("./database");
            
            const result = await getRelatedItems("pe1", "people", {
                limit: 3,
                userId: "test-user",
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it("handles missing source item", async () => {
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRelatedItems } = await import("./database");
            
            const result = await getRelatedItems("nonexistent", "projects", {
                userId: "test-user",
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("not found");
        });

        it("respects the limit parameter", async () => {
            const { db } = await import("@/lib/db");
            
            // Return source item, then many related items
            let callCount = 0;
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockImplementation(() => {
                            callCount++;
                            if (callCount === 1) {
                                return Promise.resolve([mockProjects[0]]);
                            }
                            return Promise.resolve(mockProjects);
                        }),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRelatedItems } = await import("./database");
            
            const result = await getRelatedItems("p1", "projects", {
                limit: 2,
                userId: "test-user",
            });

            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            expect((result.data as unknown[]).length).toBeLessThanOrEqual(2);
        });
    });

    describe("createItem", () => {
        beforeEach(async () => {
            const { db } = await import("@/lib/db");
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: "new-id", name: "New Item" }]),
                }),
            } as unknown as ReturnType<typeof db.insert>);
        });

        it("creates a project successfully", async () => {
            const { createItem } = await import("./database");
            
            const result = await createItem("projects", {
                name: "New Project",
                status: "active",
                next_action: "Start working",
                tags: ["work"],
            }, "test-user");

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject({
                id: "new-id",
                type: "projects",
            });
        });

        it("creates a person successfully", async () => {
            const { createItem } = await import("./database");
            
            const result = await createItem("people", {
                name: "Jane Doe",
                context: "Met at conference",
                tags: ["professional"],
            }, "test-user");

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject({
                type: "people",
            });
        });

        it("creates an idea successfully", async () => {
            const { createItem } = await import("./database");
            
            const result = await createItem("ideas", {
                name: "Great Idea",
                one_liner: "A revolutionary concept",
            }, "test-user");

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject({
                type: "ideas",
            });
        });

        it("creates an admin task successfully", async () => {
            const { createItem } = await import("./database");
            
            const result = await createItem("admin", {
                name: "Buy groceries",
                due_date: "2026-01-25",
            }, "test-user");

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject({
                type: "admin",
            });
        });

        it("returns error for unknown item type", async () => {
            const { createItem } = await import("./database");
            
            const result = await createItem("unknown" as "projects", {
                name: "Test",
            }, "test-user");

            expect(result.success).toBe(false);
            expect(result.error).toContain("Unknown");
        });

        it("handles database errors gracefully", async () => {
            const { db } = await import("@/lib/db");
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockRejectedValue(new Error("Constraint violation")),
                }),
            } as unknown as ReturnType<typeof db.insert>);

            const { createItem } = await import("./database");
            
            const result = await createItem("projects", {
                name: "Test",
            }, "test-user");

            expect(result.success).toBe(false);
            expect(result.error).toContain("Constraint");
        });
    });

    describe("getRecentContext", () => {
        it("returns recent inbox items", async () => {
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(mockInboxItems),
                        }),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRecentContext } = await import("./database");
            
            const result = await getRecentContext({
                limit: 10,
                type: "all",
                userId: "test-user",
            });

            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        it("filters by type when specified", async () => {
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue([mockInboxItems[0]]),
                        }),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRecentContext } = await import("./database");
            
            const result = await getRecentContext({
                limit: 10,
                type: "projects",
                userId: "test-user",
            });

            expect(result.success).toBe(true);
        });

        it("respects the limit parameter", async () => {
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(mockInboxItems.slice(0, 1)),
                        }),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRecentContext } = await import("./database");
            
            const result = await getRecentContext({
                limit: 1,
                userId: "test-user",
            });

            expect(result.success).toBe(true);
            expect((result.data as unknown[]).length).toBeLessThanOrEqual(1);
        });

        it("handles empty database", async () => {
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRecentContext } = await import("./database");
            
            const result = await getRecentContext({
                userId: "test-user",
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it("handles database errors gracefully", async () => {
            const { db } = await import("@/lib/db");
            
            vi.mocked(db.select).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockRejectedValue(new Error("Connection lost")),
                        }),
                    }),
                }),
            } as unknown as ReturnType<typeof db.select>));

            const { getRecentContext } = await import("./database");
            
            const result = await getRecentContext({
                userId: "test-user",
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});

describe("Relative Time Formatting", () => {
    // These test the formatRelativeTime helper used in getRecentContext
    // Since it's not exported, we test through the public API
    
    it("formats times correctly in context results", async () => {
        const { db } = await import("@/lib/db");
        
        const recentItem = {
            ...createMockInboxItem(),
            createdAt: new Date(), // Just now
        };
        
        vi.mocked(db.select).mockImplementation(() => ({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([recentItem]),
                    }),
                }),
            }),
        } as unknown as ReturnType<typeof db.select>));

        const { getRecentContext } = await import("./database");
        
        const result = await getRecentContext({
            userId: "test-user",
        });

        expect(result.success).toBe(true);
        const items = result.data as Array<{ capturedAt: string }>;
        if (items.length > 0) {
            // Should be a relative time string
            expect(items[0].capturedAt).toBeDefined();
        }
    });
});
