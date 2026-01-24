/**
 * System Prompt Tests
 * 
 * Tests for prompt formatting utilities.
 * These are deterministic tests - no mocking needed.
 */

import { describe, it, expect } from "vitest";
import { formatAgentResponse, createContextMessage, SYSTEM_PROMPT } from "./system";

describe("System Prompt Utilities", () => {
    describe("SYSTEM_PROMPT", () => {
        it("contains core agent identity", () => {
            expect(SYSTEM_PROMPT).toContain("Apex");
            expect(SYSTEM_PROMPT).toContain("executive function partner");
        });

        it("contains ADHD-friendly guidelines", () => {
            expect(SYSTEM_PROMPT).toContain("BLUF");
            expect(SYSTEM_PROMPT).toContain("Chunk Everything");
            expect(SYSTEM_PROMPT).toContain("No Shame");
            expect(SYSTEM_PROMPT).toContain("Task Initiation Support");
        });

        it("contains all category definitions", () => {
            expect(SYSTEM_PROMPT).toContain("people");
            expect(SYSTEM_PROMPT).toContain("projects");
            expect(SYSTEM_PROMPT).toContain("ideas");
            expect(SYSTEM_PROMPT).toContain("admin");
            expect(SYSTEM_PROMPT).toContain("needs_review");
        });

        it("contains response format schema", () => {
            expect(SYSTEM_PROMPT).toContain('"action"');
            expect(SYSTEM_PROMPT).toContain('"destination"');
            expect(SYSTEM_PROMPT).toContain('"confidence"');
            expect(SYSTEM_PROMPT).toContain('"firstStep"');
        });

        it("contains anti-patterns section", () => {
            expect(SYSTEM_PROMPT).toContain("Anti-Patterns");
            expect(SYSTEM_PROMPT).toContain("NEVER");
        });
    });

    describe("formatAgentResponse", () => {
        describe("filed action", () => {
            it("formats a basic filed response", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "Created new project",
                    destination: "projects",
                });

                expect(result).toContain("✓ Created new project");
                expect(result).toContain("→ Filed as: projects");
            });

            it("includes first step when provided", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "Task captured",
                    destination: "admin",
                    firstStep: "Open the calendar",
                });

                expect(result).toContain("⚡ First step: Open the calendar");
            });

            it("includes related items when provided", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "Person added",
                    destination: "people",
                    related: [
                        { name: "Project A", type: "projects", relevance: "Works together" },
                        { name: "Meeting Notes", type: "ideas", relevance: "Referenced" },
                    ],
                });

                expect(result).toContain("🔗 Related:");
                expect(result).toContain("Project A (Works together)");
                expect(result).toContain("Meeting Notes (Referenced)");
            });

            it("limits related items to 3", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "Item filed",
                    related: [
                        { name: "Item 1", type: "projects", relevance: "r1" },
                        { name: "Item 2", type: "people", relevance: "r2" },
                        { name: "Item 3", type: "ideas", relevance: "r3" },
                        { name: "Item 4", type: "admin", relevance: "r4" },
                    ],
                });

                expect(result).toContain("Item 1");
                expect(result).toContain("Item 2");
                expect(result).toContain("Item 3");
                expect(result).not.toContain("Item 4");
            });

            it("handles missing optional fields gracefully", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "Captured",
                });

                expect(result).toContain("✓ Captured");
                expect(result).not.toContain("First step");
                expect(result).not.toContain("Related");
            });
        });

        describe("clarify action", () => {
            it("formats a clarification request", () => {
                const result = formatAgentResponse({
                    action: "clarify",
                    summary: "Need more info",
                    question: "Is this a project or a task?",
                });

                expect(result).toContain("📝 Need more info");
                expect(result).toContain("❓ Is this a project or a task?");
            });

            it("includes numbered options", () => {
                const result = formatAgentResponse({
                    action: "clarify",
                    summary: "Ambiguous",
                    question: "What type is this?",
                    options: ["Project", "Task", "Idea"],
                });

                expect(result).toContain("1. Project");
                expect(result).toContain("2. Task");
                expect(result).toContain("3. Idea");
            });

            it("handles clarify without options", () => {
                const result = formatAgentResponse({
                    action: "clarify",
                    summary: "Need clarification",
                    question: "Can you elaborate?",
                });

                expect(result).toContain("❓ Can you elaborate?");
                expect(result).not.toContain("1.");
            });
        });

        describe("error handling", () => {
            it("handles empty summary gracefully", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "",
                });

                // Should not crash
                expect(result).toBeDefined();
            });

            it("handles empty related array", () => {
                const result = formatAgentResponse({
                    action: "filed",
                    summary: "Test",
                    related: [],
                });

                expect(result).not.toContain("Related");
            });

            it("handles empty options array", () => {
                const result = formatAgentResponse({
                    action: "clarify",
                    summary: "Test",
                    question: "Question?",
                    options: [],
                });

                expect(result).not.toContain("1.");
            });
        });
    });

    describe("createContextMessage", () => {
        it("returns empty string for empty captures array", () => {
            const result = createContextMessage([]);
            expect(result).toBe("");
        });

        it("formats single capture correctly", () => {
            const result = createContextMessage([
                { type: "projects", name: "Test Project", capturedAt: "2h ago" },
            ]);

            expect(result).toContain("Recent captures for context:");
            expect(result).toContain("projects: \"Test Project\" (2h ago)");
        });

        it("formats multiple captures", () => {
            const result = createContextMessage([
                { type: "projects", name: "Project A", capturedAt: "1h ago" },
                { type: "people", name: "John Doe", capturedAt: "3h ago" },
                { type: "ideas", name: "New Idea", capturedAt: "yesterday" },
            ]);

            expect(result).toContain("Project A");
            expect(result).toContain("John Doe");
            expect(result).toContain("New Idea");
        });

        it("limits to 5 captures", () => {
            const captures = Array.from({ length: 10 }, (_, i) => ({
                type: "projects" as const,
                name: `Project ${i + 1}`,
                capturedAt: `${i}h ago`,
            }));

            const result = createContextMessage(captures);

            expect(result).toContain("Project 1");
            expect(result).toContain("Project 5");
            expect(result).not.toContain("Project 6");
        });

        it("includes type in the output", () => {
            const result = createContextMessage([
                { type: "admin", name: "Buy groceries", capturedAt: "now" },
            ]);

            expect(result).toContain("admin:");
        });

        it("handles special characters in names", () => {
            const result = createContextMessage([
                { type: "ideas", name: "Test & \"Special\" <chars>", capturedAt: "now" },
            ]);

            expect(result).toContain("Test & \"Special\" <chars>");
        });
    });
});
