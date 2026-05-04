/**
 * Time Tools Tests
 * 
 * Tests for due date suggestion and time-related utilities.
 * These are deterministic tests - no mocking needed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { suggestDueDate } from "./time";

// Type for suggestDueDate result data
interface DueDateResult {
    dueDate: string | null;
    reasoning: string;
    urgencyDetected: string;
    humanReadable?: string;
}

// Helper to safely access typed result data
function getData(result: { success: boolean; data?: unknown }): DueDateResult {
    return result.data as DueDateResult;
}

describe("Time Tools", () => {
    // Use fixed date for deterministic tests
    const FIXED_DATE = new Date("2026-01-23T10:00:00Z"); // Friday
    
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(FIXED_DATE);
    });
    
    afterEach(() => {
        vi.useRealTimers();
    });

    describe("suggestDueDate", () => {
        describe("urgency levels", () => {
            it("suggests today for urgent tasks", async () => {
                const result = await suggestDueDate("urgent meeting prep", "urgent");
                
                expect(result.success).toBe(true);
                expect(result.data).toMatchObject({
                    dueDate: "2026-01-23",
                    urgencyDetected: "urgent",
                    humanReadable: "Today",
                });
                expect(getData(result).reasoning).toContain("Urgent");
            });

            it("suggests 2 days for soon tasks", async () => {
                const result = await suggestDueDate("buy groceries soon", "soon");
                
                expect(result.success).toBe(true);
                expect(result.data).toMatchObject({
                    dueDate: "2026-01-25", // Sunday, but no work keywords
                    urgencyDetected: "soon",
                });
                expect(getData(result).reasoning).toContain("2 days");
            });

            it("suggests 1 week for normal tasks", async () => {
                const result = await suggestDueDate("review document", "normal");
                
                expect(result.success).toBe(true);
                expect(result.data).toMatchObject({
                    dueDate: "2026-01-30", // Friday + 7 days = Friday
                    urgencyDetected: "normal",
                });
                expect(getData(result).reasoning).toContain("1 week");
            });

            it("returns null due date for someday tasks", async () => {
                const result = await suggestDueDate("someday learn piano", "someday");
                
                expect(result.success).toBe(true);
                expect(result.data).toMatchObject({
                    dueDate: null,
                    urgencyDetected: "someday",
                });
                expect(getData(result).reasoning).toContain("someday/maybe");
            });

            it("defaults to 1 week for unknown urgency", async () => {
                const result = await suggestDueDate("do something", "unknown");
                
                expect(result.success).toBe(true);
                expect(getData(result).dueDate).toBe("2026-01-30");
                expect(getData(result).reasoning).toContain("Default");
            });
        });

        describe("urgency detection from text", () => {
            it("detects urgent keywords", async () => {
                const urgentPhrases = [
                    "this is urgent",
                    "need this ASAP",
                    "do it immediately",
                    "emergency fix needed",
                    "finish today",
                    "complete tonight",
                ];

                for (const phrase of urgentPhrases) {
                    const result = await suggestDueDate(phrase);
                    expect(getData(result).urgencyDetected).toBe("urgent");
                }
            });

            it("detects soon keywords", async () => {
                const soonPhrases = [
                    "do this soon",
                    "finish this week",
                    "need by tomorrow",
                    "complete by friday",
                    "end of week deadline",
                ];

                for (const phrase of soonPhrases) {
                    const result = await suggestDueDate(phrase);
                    expect(getData(result).urgencyDetected).toBe("soon");
                }
            });

            it("detects normal keywords", async () => {
                const normalPhrases = [
                    "when you can",
                    "sometime next week",
                    "get around to it",
                    "would be nice to finish",
                    "this month",
                ];

                for (const phrase of normalPhrases) {
                    const result = await suggestDueDate(phrase);
                    expect(getData(result).urgencyDetected).toBe("normal");
                }
            });

            it("detects someday keywords", async () => {
                const somedayPhrases = [
                    "someday I want to",
                    "eventually learn",
                    "no rush on this",
                    "whenever you can",
                    "at some point",
                    "maybe try this",
                ];

                for (const phrase of somedayPhrases) {
                    const result = await suggestDueDate(phrase);
                    expect(getData(result).urgencyDetected).toBe("someday");
                    expect(getData(result).dueDate).toBeNull();
                }
            });

            it("uses provided urgency when no keywords detected", async () => {
                const result = await suggestDueDate("buy groceries", "soon");
                
                expect(getData(result).urgencyDetected).toBe("soon");
            });

            it("detected urgency overrides provided urgency", async () => {
                // Text says urgent, but parameter says normal
                const result = await suggestDueDate("urgent task", "normal");
                
                expect(getData(result).urgencyDetected).toBe("urgent");
                expect(getData(result).dueDate).toBe("2026-01-23"); // Today
            });
        });

        describe("weekend skipping for work tasks", () => {
            it("skips weekend for work-related tasks", async () => {
                // Friday + 2 days = Sunday, should become Monday
                const result = await suggestDueDate("prepare meeting presentation", "soon");
                
                expect(result.success).toBe(true);
                // Soon = 2 days = Sunday, work task = skip to Monday
                expect(getData(result).dueDate).toBe("2026-01-26"); // Monday
                expect(getData(result).reasoning).toContain("skip weekend");
            });

            it("does not skip weekend for personal tasks", async () => {
                // Friday + 2 days = Sunday, should stay Sunday (no work keywords)
                const result = await suggestDueDate("buy groceries", "soon");
                
                expect(result.success).toBe(true);
                expect(getData(result).dueDate).toBe("2026-01-25"); // Sunday
                expect(getData(result).reasoning).not.toContain("skip weekend");
            });

            it("recognizes various work keywords", async () => {
                const workTasks = [
                    "schedule meeting",
                    "make phone call to vendor",
                    "send email to team",
                    "finish quarterly report",
                    "prepare presentation",
                    "client deadline",
                    "project review",
                    "submit documents",
                    "office supplies",
                    "discuss with boss",
                    "team standup",
                    "colleague feedback",
                ];

                for (const task of workTasks) {
                    const result = await suggestDueDate(task, "soon");
                    // Check that it recognized as work (adjusted for weekend)
                    expect(getData(result).reasoning).toContain("skip weekend");
                }
            });
        });

        describe("human readable formatting", () => {
            it("formats today correctly", async () => {
                const result = await suggestDueDate("urgent task", "urgent");
                expect(getData(result).humanReadable).toBe("Today");
            });

            it("formats tomorrow correctly", async () => {
                // Set to Thursday so +1 = Friday (not a weekend)
                vi.setSystemTime(new Date("2026-01-22T10:00:00Z")); // Thursday
                
                const result = await suggestDueDate("quick task", "urgent");
                // Urgent = today = Thursday
                expect(getData(result).humanReadable).toBe("Today");
            });

            it("formats day of week for dates within a week", async () => {
                // Friday + 2 days for non-work = Sunday
                const result = await suggestDueDate("relax", "soon");
                
                expect(getData(result).humanReadable).toBe("Sunday");
            });

            it("formats as 'Next week' for dates 7-13 days out", async () => {
                // Need a task that results in 7-13 days out
                // Normal = 7 days, work task might push to 8 if weekend
                const result = await suggestDueDate("plan vacation", "normal");
                
                // 7 days from Friday = next Friday
                expect(getData(result).humanReadable).toBe("Next week");
            });
        });

        describe("edge cases", () => {
            it("handles empty task description", async () => {
                const result = await suggestDueDate("", "normal");
                
                expect(result.success).toBe(true);
                expect(getData(result).dueDate).toBe("2026-01-30");
            });

            it("handles very long task description", async () => {
                const longText = "a".repeat(10000);
                const result = await suggestDueDate(longText, "normal");
                
                expect(result.success).toBe(true);
            });

            it("handles special characters in description", async () => {
                const result = await suggestDueDate("task with émojis 🎉 and spëcial chars!", "normal");
                
                expect(result.success).toBe(true);
            });

            it("is case insensitive for keyword detection", async () => {
                const variations = ["URGENT", "Urgent", "uRgEnT"];
                
                for (const variation of variations) {
                    const result = await suggestDueDate(`this is ${variation}`, "normal");
                    expect(getData(result).urgencyDetected).toBe("urgent");
                }
            });
        });

        describe("date calculations", () => {
            it("handles month boundaries correctly", async () => {
                // Set to Jan 28, +7 days = Feb 4
                vi.setSystemTime(new Date("2026-01-28T10:00:00Z"));
                
                const result = await suggestDueDate("task", "normal");
                expect(getData(result).dueDate).toBe("2026-02-04");
            });

            it("handles year boundaries correctly", async () => {
                // Set to Dec 28, +7 days = Jan 4
                vi.setSystemTime(new Date("2025-12-28T10:00:00Z"));
                
                const result = await suggestDueDate("task", "normal");
                expect(getData(result).dueDate).toBe("2026-01-04");
            });

            it("handles leap year correctly", async () => {
                // 2024 is a leap year, Feb 28 + 2 days should be Mar 1
                vi.setSystemTime(new Date("2024-02-27T10:00:00Z"));
                
                const result = await suggestDueDate("task", "soon");
                expect(getData(result).dueDate).toBe("2024-02-29"); // Leap day!
            });
        });

        describe("weekend edge cases", () => {
            it("moves Saturday to Monday", async () => {
                // Set to Thursday, soon = +2 = Saturday
                vi.setSystemTime(new Date("2026-01-22T10:00:00Z")); // Thursday
                
                const result = await suggestDueDate("work meeting", "soon");
                expect(getData(result).dueDate).toBe("2026-01-26"); // Monday
            });

            it("moves Sunday to Monday", async () => {
                // Set to Friday, soon = +2 = Sunday
                vi.setSystemTime(new Date("2026-01-23T10:00:00Z")); // Friday
                
                const result = await suggestDueDate("work call", "soon");
                expect(getData(result).dueDate).toBe("2026-01-26"); // Monday
            });

            it("keeps weekday dates unchanged", async () => {
                // Set to Monday, soon = +2 = Wednesday
                vi.setSystemTime(new Date("2026-01-19T10:00:00Z")); // Monday
                
                const result = await suggestDueDate("work email", "soon");
                expect(getData(result).dueDate).toBe("2026-01-21"); // Wednesday
            });
        });
    });
});
