/**
 * Agent Orchestrator Tests
 * 
 * Contract tests for the main agent with mocked GLM API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
    mockGLMSuccess, 
    mockGLMError, 
    mockGLMTimeout,
    mockGLMSequence,
    createClassificationJSON,
    createClarificationJSON,
    resetGLMMocks,
} from "@/test/mocks/glm";
import { 
    createMockGLMResponse, 
    createMockGLMToolResponse,
    createMockToolCall,
} from "@/test/factories";

// Mock the database
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
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: "mock-id", name: "Test" }]),
            }),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
            }),
        }),
    },
}));

// Mock config
vi.mock("@/lib/config", () => ({
    CONFIG: {
        SINGLE_USER_ID: "test-user",
        AI: {
            API_KEY: "test-api-key",
            API_BASE_URL: "https://api.z.ai/api/paas/v4/",
            DEFAULT_MODEL: "glm-4.7",
            FAST_MODEL: "glm-4.7-flash",
            TIMEOUT_MS: 30000,
            MAX_RETRIES: 2,
            RETRY_DELAY_MS: 1000,
            THINKING_MODE: "enabled",
            TEMPERATURE: 0.7,
            MAX_TOKENS: 4096,
            TOOL_STREAM: true,
        },
        AGENT: {
            MAX_CONTEXT_ITEMS: 10,
            EMBEDDING_MODEL: "test-model",
            SIMILARITY_THRESHOLD: 0.5,
            MAX_SEARCH_RESULTS: 5,
        },
        HTTP: {
            BAD_REQUEST: 400,
            NOT_FOUND: 404,
            INTERNAL_SERVER_ERROR: 500,
            BAD_GATEWAY: 502,
        },
    },
}));

describe("Agent Orchestrator", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set env var for tests
        process.env.GLM_API_KEY = "test-api-key";
    });

    afterEach(() => {
        resetGLMMocks();
    });

    describe("Agent class", () => {
        it("throws error when API key is missing", async () => {
            delete process.env.GLM_API_KEY;
            
            // Need to re-import to pick up env change
            vi.resetModules();
            
            // Re-mock after reset
            vi.doMock("@/lib/config", () => ({
                CONFIG: {
                    SINGLE_USER_ID: "test-user",
                    AI: {
                        API_BASE_URL: "https://api.z.ai/api/paas/v4/",
                        DEFAULT_MODEL: "glm-4.7",
                        TIMEOUT_MS: 30000,
                        THINKING_MODE: "enabled",
                        TEMPERATURE: 0.7,
                        MAX_TOKENS: 4096,
                    },
                    AGENT: { MAX_CONTEXT_ITEMS: 10 },
                },
            }));

            const { Agent } = await import("./index");
            
            expect(() => new Agent()).toThrow("Missing GLM_API_KEY");
            
            // Restore
            process.env.GLM_API_KEY = "test-api-key";
        });
    });

    describe("processWithAgent", () => {
        it("successfully classifies and returns filed response", async () => {
            mockGLMSuccess(createClassificationJSON("projects", 0.9, {
                name: "Test Project",
                status: "active",
                next_action: "Start working",
            }));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("Create a new test project");

            expect(result.action).toBe("filed");
            expect(result.destination).toBe("projects");
            expect(result.confidence).toBe(0.9);
            expect(result.summary).toContain("Filed to projects");
        });

        it("returns clarify response when agent asks question", async () => {
            mockGLMSuccess(createClarificationJSON(
                "Is this a project or a simple task?",
                ["Project", "Task", "Not sure"]
            ));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("do the thing");

            expect(result.action).toBe("clarify");
            expect(result.question).toBe("Is this a project or a simple task?");
            expect(result.options).toEqual(["Project", "Task", "Not sure"]);
        });

        it("handles low confidence as needs_review", async () => {
            mockGLMSuccess(createClassificationJSON("needs_review", 0.4, {
                original_text: "ambiguous",
                reason: "Could not determine category",
            }));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("something unclear");

            expect(result.destination).toBe("needs_review");
            expect(result.confidence).toBe(0.4);
        });

        it("returns error response on API failure", async () => {
            mockGLMError(500, "Internal Server Error");

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("test");

            expect(result.action).toBe("error");
            expect(result.error).toContain("500");
        });

        it("handles timeout gracefully", async () => {
            mockGLMTimeout();

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("test");

            expect(result.action).toBe("error");
            expect(result.error).toBeDefined();
        });

        it("handles malformed JSON in response", async () => {
            // Mock a response that isn't valid JSON
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            role: "assistant",
                            content: "This is not JSON, just plain text",
                        },
                        finish_reason: "stop",
                    }],
                }),
            }));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("test");

            // Should treat content as summary when JSON parsing fails
            expect(result.action).toBe("filed");
            expect(result.summary).toContain("not JSON");
        });
    });

    describe("Tool execution", () => {
        it("executes tool calls and continues agent loop", async () => {
            // First response requests a tool call
            const toolCall = createMockToolCall("get_recent_context", { limit: 5 });
            const toolResponse = createMockGLMToolResponse([toolCall], "Let me check recent items");
            
            // Second response provides final answer
            const finalResponse = createMockGLMResponse(createClassificationJSON(
                "projects", 0.85, { name: "Related Project" }
            ));

            mockGLMSequence([toolResponse, finalResponse]);

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("something related to recent work");

            expect(result.action).toBe("filed");
            expect(result.destination).toBe("projects");
        });

        it("handles unknown tool gracefully", async () => {
            const toolCall = createMockToolCall("unknown_tool", {});
            const toolResponse = createMockGLMToolResponse([toolCall]);
            
            const finalResponse = createMockGLMResponse(createClassificationJSON(
                "needs_review", 0.5, { reason: "Tool failed" }
            ));

            mockGLMSequence([toolResponse, finalResponse]);

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("test");

            // Should still complete, just with tool error in context
            expect(result).toBeDefined();
        });

        it("respects max iterations limit", async () => {
            // Create a response that always requests another tool call
            const toolCall = createMockToolCall("get_recent_context", { limit: 5 });
            const toolResponse = createMockGLMToolResponse([toolCall]);

            // 6 tool responses should hit the limit (max 5 iterations)
            mockGLMSequence([
                toolResponse,
                toolResponse,
                toolResponse,
                toolResponse,
                toolResponse,
                toolResponse, // This one triggers exit
            ]);

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("infinite loop test");

            // Should exit loop and return something
            expect(result).toBeDefined();
        });

        it("handles tool execution errors", async () => {
            const toolCall = createMockToolCall("create_item", { 
                type: "projects",
                data: JSON.stringify({ name: "Test" })
            });
            const toolResponse = createMockGLMToolResponse([toolCall]);
            
            // Mock database to throw error
            vi.doMock("@/lib/db", () => ({
                db: {
                    insert: vi.fn().mockReturnValue({
                        values: vi.fn().mockReturnValue({
                            returning: vi.fn().mockRejectedValue(new Error("DB Error")),
                        }),
                    }),
                },
            }));

            const finalResponse = createMockGLMResponse(createClassificationJSON(
                "needs_review", 0.5, { error: "Could not create" }
            ));

            mockGLMSequence([toolResponse, finalResponse]);

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("create something");

            // Should handle error and continue
            expect(result).toBeDefined();
        });
    });

    describe("Response parsing", () => {
        it("extracts firstStep from response", async () => {
            mockGLMSuccess(JSON.stringify({
                action: "filed",
                destination: "admin",
                confidence: 0.9,
                summary: "Task added",
                firstStep: "Open your calendar",
                data: { name: "Schedule meeting" },
            }));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("schedule a meeting");

            expect(result.firstStep).toBe("Open your calendar");
        });

        it("extracts related items from response", async () => {
            mockGLMSuccess(JSON.stringify({
                action: "filed",
                destination: "people",
                confidence: 0.85,
                summary: "Added John",
                related: [
                    { id: "p1", type: "projects", name: "Project X", relevance: "Works on this" },
                ],
                data: { name: "John Doe" },
            }));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("talked to John about Project X");

            expect(result.related).toHaveLength(1);
            expect(result.related?.[0].name).toBe("Project X");
        });

        it("handles response with markdown code blocks", async () => {
            // Some models wrap JSON in markdown
            mockGLMSuccess("```json\n" + createClassificationJSON("ideas", 0.8, {
                name: "New Idea",
            }) + "\n```");

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("what if we did this");

            expect(result.action).toBe("filed");
            expect(result.destination).toBe("ideas");
        });

        it("preserves reasoning from thinking mode", async () => {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            role: "assistant",
                            content: createClassificationJSON("projects", 0.9, { name: "Test" }),
                            reasoning_content: "The user mentioned a multi-step task...",
                        },
                        finish_reason: "stop",
                    }],
                }),
            }));

            const { processWithAgent } = await import("./index");
            const result = await processWithAgent("build a new feature");

            expect(result.reasoning).toContain("multi-step");
        });
    });

    describe("Context handling", () => {
        it("includes context when enabled", async () => {
            mockGLMSuccess(createClassificationJSON("projects", 0.9, { name: "Test" }));

            const { processWithAgent } = await import("./index");
            await processWithAgent("test", { includeContext: true });

            // Verify fetch was called with messages including context
            const fetchCall = vi.mocked(fetch).mock.calls[0];
            const body = JSON.parse(fetchCall[1]?.body as string);
            
            // Should have system message(s)
            expect(body.messages.some((m: {role: string}) => m.role === "system")).toBe(true);
        });

        it("skips context when disabled", async () => {
            mockGLMSuccess(createClassificationJSON("projects", 0.9, { name: "Test" }));

            const { processWithAgent } = await import("./index");
            await processWithAgent("test", { includeContext: false });

            const fetchCall = vi.mocked(fetch).mock.calls[0];
            const body = JSON.parse(fetchCall[1]?.body as string);
            
            // Should only have system prompt and user message
            const systemMessages = body.messages.filter((m: {role: string}) => m.role === "system");
            expect(systemMessages.length).toBe(1); // Just the main system prompt
        });
    });

    describe("API request format", () => {
        it("sends correct model and parameters", async () => {
            mockGLMSuccess(createClassificationJSON("projects", 0.9, { name: "Test" }));

            const { processWithAgent } = await import("./index");
            await processWithAgent("test", { model: "glm-4.7" });

            const fetchCall = vi.mocked(fetch).mock.calls[0];
            const body = JSON.parse(fetchCall[1]?.body as string);

            expect(body.model).toBe("glm-4.7");
            expect(body.thinking).toEqual({ type: "enabled" });
            expect(body.response_format).toEqual({ type: "json_object" });
        });

        it("includes tools in request", async () => {
            mockGLMSuccess(createClassificationJSON("projects", 0.9, { name: "Test" }));

            const { processWithAgent } = await import("./index");
            await processWithAgent("test");

            const fetchCall = vi.mocked(fetch).mock.calls[0];
            const body = JSON.parse(fetchCall[1]?.body as string);

            expect(body.tools).toBeDefined();
            expect(Array.isArray(body.tools)).toBe(true);
            expect(body.tool_choice).toBe("auto");
        });

        it("sends authorization header", async () => {
            mockGLMSuccess(createClassificationJSON("projects", 0.9, { name: "Test" }));

            const { processWithAgent } = await import("./index");
            await processWithAgent("test");

            const fetchCall = vi.mocked(fetch).mock.calls[0];
            const headers = fetchCall[1]?.headers as Record<string, string>;

            expect(headers["Authorization"]).toContain("Bearer");
        });
    });
});
