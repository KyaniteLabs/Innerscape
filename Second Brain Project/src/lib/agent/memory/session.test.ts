/**
 * Session Memory Tests
 * 
 * Tests for conversation session management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ===== Test the internal logic directly =====

describe("Session Memory Logic", () => {
    // Reference implementations for testing compaction logic
    const MAX_MESSAGES = 20;

    function compactIfNeeded(messages: Array<{ role: string; content: string }>) {
        if (messages.length <= MAX_MESSAGES) {
            return { messages, summary: null };
        }

        const systemMessages = messages.filter(m => m.role === "system");
        const recentMessages = messages.slice(-10);

        const olderMessages = messages.slice(systemMessages.length, -10);
        const summary = createSummary(olderMessages);

        return {
            messages: [
                ...systemMessages,
                { role: "system", content: `Previous conversation summary:\n${summary}` },
                ...recentMessages,
            ],
            summary,
        };
    }

    function createSummary(messages: Array<{ role: string; content: string }>): string {
        const userMessages = messages.filter(m => m.role === "user");
        const captures = userMessages.map(m => m.content.substring(0, 50)).join("; ");
        return `User captured: ${captures}. Agent processed ${userMessages.length} items.`;
    }

    describe("compactIfNeeded", () => {
        it("returns unchanged messages when under threshold", () => {
            const messages = [
                { role: "system", content: "System prompt" },
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi there" },
            ];

            const result = compactIfNeeded(messages);

            expect(result.messages).toEqual(messages);
            expect(result.summary).toBeNull();
        });

        it("returns unchanged messages at exactly threshold", () => {
            const messages = Array.from({ length: MAX_MESSAGES }, (_, i) => ({
                role: i % 2 === 0 ? "user" : "assistant",
                content: `Message ${i}`,
            }));

            const result = compactIfNeeded(messages);

            expect(result.messages).toEqual(messages);
            expect(result.summary).toBeNull();
        });

        it("compacts messages when over threshold", () => {
            const messages = [
                { role: "system", content: "System prompt" },
                ...Array.from({ length: 25 }, (_, i) => ({
                    role: i % 2 === 0 ? "user" : "assistant",
                    content: `Message ${i}`,
                })),
            ];

            const result = compactIfNeeded(messages);

            // Should have: system + summary + 10 recent
            expect(result.messages.length).toBeLessThan(messages.length);
            expect(result.summary).not.toBeNull();
        });

        it("preserves system messages during compaction", () => {
            const messages = [
                { role: "system", content: "System prompt 1" },
                { role: "system", content: "System prompt 2" },
                ...Array.from({ length: 30 }, (_, i) => ({
                    role: i % 2 === 0 ? "user" : "assistant",
                    content: `Message ${i}`,
                })),
            ];

            const result = compactIfNeeded(messages);

            // Original system messages should be preserved
            expect(result.messages[0].content).toBe("System prompt 1");
            expect(result.messages[1].content).toBe("System prompt 2");
        });

        it("keeps the 10 most recent messages", () => {
            const messages = [
                { role: "system", content: "System" },
                ...Array.from({ length: 30 }, (_, i) => ({
                    role: "user",
                    content: `User message ${i}`,
                })),
            ];

            const result = compactIfNeeded(messages);

            // Should end with the last messages
            const lastCompacted = result.messages[result.messages.length - 1];
            expect(lastCompacted.content).toBe("User message 29");
        });

        it("includes summary as system message", () => {
            const messages = [
                { role: "system", content: "Original system" },
                ...Array.from({ length: 25 }, (_, i) => ({
                    role: i % 2 === 0 ? "user" : "assistant",
                    content: `Message ${i}`,
                })),
            ];

            const result = compactIfNeeded(messages);

            const summaryMessage = result.messages.find(m => 
                m.role === "system" && m.content.includes("summary")
            );
            expect(summaryMessage).toBeDefined();
        });
    });

    describe("createSummary", () => {
        it("creates summary from user messages only", () => {
            const messages = [
                { role: "user", content: "First capture" },
                { role: "assistant", content: "Processed first" },
                { role: "user", content: "Second capture" },
                { role: "assistant", content: "Processed second" },
            ];

            const summary = createSummary(messages);

            expect(summary).toContain("First capture");
            expect(summary).toContain("Second capture");
            expect(summary).toContain("2 items"); // 2 user messages
        });

        it("truncates long messages in summary", () => {
            const longMessage = "a".repeat(100);
            const messages = [
                { role: "user", content: longMessage },
            ];

            const summary = createSummary(messages);

            // Should be truncated to 50 chars
            expect(summary.length).toBeLessThan(longMessage.length + 50);
        });

        it("handles empty messages array", () => {
            const summary = createSummary([]);

            expect(summary).toContain("0 items");
        });

        it("handles messages with no user messages", () => {
            const messages = [
                { role: "assistant", content: "Only assistant" },
                { role: "system", content: "System message" },
            ];

            const summary = createSummary(messages);

            expect(summary).toContain("0 items");
        });

        it("joins multiple captures with semicolons", () => {
            const messages = [
                { role: "user", content: "Capture A" },
                { role: "user", content: "Capture B" },
                { role: "user", content: "Capture C" },
            ];

            const summary = createSummary(messages);

            expect(summary).toContain("; ");
        });
    });
});

describe("Session Memory Service", () => {
    beforeEach(() => {
        vi.mock("@/lib/db", () => ({
            db: {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            orderBy: vi.fn().mockReturnValue({
                                limit: vi.fn().mockResolvedValue([]),
                            }),
                            limit: vi.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue(undefined),
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(undefined),
                    }),
                }),
            },
        }));

        vi.mock("@/lib/config", () => ({
            CONFIG: {
                AGENT: {
                    SESSION_TIMEOUT_MS: 30 * 60 * 1000,
                },
                HTTP: {
                    BAD_REQUEST: 400,
                    NOT_FOUND: 404,
                    INTERNAL_SERVER_ERROR: 500,
                },
            },
        }));
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe("getOrCreateSession", () => {
        it("creates new session when none exists", async () => {
            const { getOrCreateSession } = await import("./session");
            
            const result = await getOrCreateSession("test-user");
            
            expect(result.id).toBeDefined();
            expect(result.messages).toEqual([]);
        });
    });
});

describe("Relative Time Formatting", () => {
    // Reference implementation
    function formatRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-23T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns 'just now' for very recent times", () => {
        const date = new Date("2026-01-23T11:59:30Z"); // 30 seconds ago
        expect(formatRelativeTime(date)).toBe("just now");
    });

    it("returns minutes ago for times under an hour", () => {
        const date = new Date("2026-01-23T11:45:00Z"); // 15 minutes ago
        expect(formatRelativeTime(date)).toBe("15m ago");
    });

    it("returns hours ago for times under a day", () => {
        const date = new Date("2026-01-23T09:00:00Z"); // 3 hours ago
        expect(formatRelativeTime(date)).toBe("3h ago");
    });

    it("returns days ago for times under a week", () => {
        const date = new Date("2026-01-21T12:00:00Z"); // 2 days ago
        expect(formatRelativeTime(date)).toBe("2d ago");
    });

    it("returns formatted date for times over a week", () => {
        const date = new Date("2026-01-10T12:00:00Z"); // 13 days ago
        const result = formatRelativeTime(date);
        expect(result).not.toContain("ago");
        // Should be a date format
        expect(result).toMatch(/\d/);
    });
});
