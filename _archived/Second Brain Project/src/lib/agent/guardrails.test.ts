/**
 * Agent Guardrails Tests
 * 
 * Tests for input validation, output validation, content safety,
 * error classification, retry logic, and context management.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    validateInput,
    validateOutput,
    containsSensitiveInfo,
    redactSensitiveInfo,
    createTraceContext,
    classifyError,
    withRetry,
    estimateTokens,
    truncateMessages,
    CaptureResponseSchema,
    ChatResponseSchema,
    MAX_INPUT_LENGTH,
    MIN_INPUT_LENGTH,
} from "./guardrails";

// ===== Input Validation Tests =====

describe("validateInput", () => {
    it("accepts valid input", () => {
        const result = validateInput("Buy groceries tomorrow");
        
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe("Buy groceries tomorrow");
        expect(result.error).toBeUndefined();
    });

    it("rejects empty input", () => {
        const result = validateInput("");
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Input is required");
    });

    it("rejects null/undefined input", () => {
        const result = validateInput(null as any);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Input is required");
    });

    it("rejects input exceeding max length", () => {
        const longInput = "a".repeat(MAX_INPUT_LENGTH + 100);
        const result = validateInput(longInput);
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain("too long");
        expect(result.sanitized.length).toBe(MAX_INPUT_LENGTH);
    });

    it("accepts input at max length", () => {
        const maxInput = "a".repeat(MAX_INPUT_LENGTH);
        const result = validateInput(maxInput);
        
        expect(result.valid).toBe(true);
        expect(result.sanitized.length).toBe(MAX_INPUT_LENGTH);
    });

    it("strips HTML tags", () => {
        const input = "Hello <script>alert('xss')</script> World";
        const result = validateInput(input);
        
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe("Hello alert('xss') World");
        expect(result.sanitized).not.toContain("<script>");
    });

    it("converts markdown code blocks", () => {
        const input = "Here is code: ```console.log('hello')```";
        const result = validateInput(input);
        
        expect(result.valid).toBe(true);
        expect(result.sanitized).toContain("'''");
        expect(result.sanitized).not.toContain("```");
    });

    it("trims whitespace", () => {
        const result = validateInput("  hello world  ");
        
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe("hello world");
    });
});

// ===== Output Validation Tests =====

describe("validateOutput", () => {
    describe("CaptureResponseSchema", () => {
        it("validates a correct filed response", () => {
            const output = {
                action: "filed",
                destination: "projects",
                destinationId: "123",
                confidence: 0.95,
                summary: "Created new project",
                firstStep: "Review the project details",
            };
            
            const result = validateOutput(output, CaptureResponseSchema);
            
            expect(result.valid).toBe(true);
            expect(result.data?.action).toBe("filed");
        });

        it("validates a clarify response", () => {
            const output = {
                action: "clarify",
                summary: "Need more details",
                question: "Is this for work or personal?",
                options: ["Work", "Personal", "Both"],
            };
            
            const result = validateOutput(output, CaptureResponseSchema);
            
            expect(result.valid).toBe(true);
            expect(result.data?.action).toBe("clarify");
        });

        it("rejects invalid action", () => {
            const output = {
                action: "invalid",
                summary: "Test",
            };
            
            const result = validateOutput(output, CaptureResponseSchema);
            
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it("rejects confidence outside range", () => {
            const output = {
                action: "filed",
                destination: "projects",
                confidence: 1.5, // Invalid: > 1
                summary: "Test",
            };
            
            const result = validateOutput(output, CaptureResponseSchema);
            
            expect(result.valid).toBe(false);
        });

        it("rejects too many options", () => {
            const output = {
                action: "clarify",
                summary: "Test",
                options: ["1", "2", "3", "4"], // Max is 3
            };
            
            const result = validateOutput(output, CaptureResponseSchema);
            
            expect(result.valid).toBe(false);
        });

        it("rejects too many related items", () => {
            const output = {
                action: "filed",
                summary: "Test",
                related: [
                    { type: "project", name: "A", relevance: "related" },
                    { type: "project", name: "B", relevance: "related" },
                    { type: "project", name: "C", relevance: "related" },
                    { type: "project", name: "D", relevance: "related" }, // 4th item
                ],
            };
            
            const result = validateOutput(output, CaptureResponseSchema);
            
            expect(result.valid).toBe(false);
        });
    });

    describe("ChatResponseSchema", () => {
        it("validates a correct chat response", () => {
            const output = {
                content: "Here are your active projects...",
                suggestions: ["Show more details", "Filter by status"],
            };
            
            const result = validateOutput(output, ChatResponseSchema);
            
            expect(result.valid).toBe(true);
        });

        it("rejects too many suggestions", () => {
            const output = {
                content: "Response",
                suggestions: ["1", "2", "3", "4"], // Max is 3
            };
            
            const result = validateOutput(output, ChatResponseSchema);
            
            expect(result.valid).toBe(false);
        });
    });
});

// ===== Content Safety Tests =====

describe("containsSensitiveInfo", () => {
    it("detects SSN patterns", () => {
        expect(containsSensitiveInfo("My SSN is 123-45-6789")).toBe(true);
    });

    it("detects credit card numbers", () => {
        expect(containsSensitiveInfo("Card: 1234567890123456")).toBe(true);
    });

    it("detects passwords", () => {
        expect(containsSensitiveInfo("password: secret123")).toBe(true);
        expect(containsSensitiveInfo("PASSWORD = mypass")).toBe(true);
    });

    it("detects API keys", () => {
        expect(containsSensitiveInfo("api_key: sk-123abc")).toBe(true);
        expect(containsSensitiveInfo("apiKey=test123")).toBe(true);
    });

    it("detects secrets", () => {
        expect(containsSensitiveInfo("secret: mysecret")).toBe(true);
    });

    it("returns false for safe content", () => {
        expect(containsSensitiveInfo("Buy groceries tomorrow")).toBe(false);
        expect(containsSensitiveInfo("Call John at 555-1234")).toBe(false);
    });
});

describe("redactSensitiveInfo", () => {
    it("redacts SSN", () => {
        const result = redactSensitiveInfo("My SSN is 123-45-6789");
        expect(result).toContain("[REDACTED]");
        expect(result).not.toContain("123-45-6789");
    });

    it("redacts passwords", () => {
        const result = redactSensitiveInfo("password: secret123");
        expect(result).toContain("[REDACTED]");
        expect(result).not.toContain("secret123");
    });

    it("preserves safe content", () => {
        const result = redactSensitiveInfo("Buy groceries tomorrow");
        expect(result).toBe("Buy groceries tomorrow");
    });

    it("redacts multiple sensitive items", () => {
        const result = redactSensitiveInfo("SSN: 123-45-6789 and api_key: sk-abc");
        expect(result.match(/\[REDACTED\]/g)?.length).toBe(2);
    });
});

// ===== Tracing Tests =====

describe("createTraceContext", () => {
    it("creates a trace with unique ID", () => {
        const trace = createTraceContext("test-agent");
        
        expect(trace.traceId).toBeDefined();
        expect(trace.traceId.length).toBe(36); // UUID format
    });

    it("logs events correctly", () => {
        const trace = createTraceContext("test-agent");
        
        trace.log("input", { text: "Hello" });
        trace.log("output", { result: "World" }, 100);
        
        const events = trace.getTrace();
        
        expect(events).toHaveLength(2);
        expect(events[0].eventType).toBe("input");
        expect(events[1].eventType).toBe("output");
        expect(events[1].durationMs).toBe(100);
    });

    it("marks sensitive data as redacted", () => {
        const trace = createTraceContext("test-agent");
        
        trace.log("input", { password: "password: secret123" });
        
        const events = trace.getTrace();
        
        expect(events[0].data._redacted).toBe(true);
    });
});

// ===== Error Classification Tests =====

describe("classifyError", () => {
    it("classifies timeout errors", () => {
        const result = classifyError(new Error("Request timeout"));
        
        expect(result.type).toBe("timeout");
        expect(result.shouldRetry).toBe(true);
    });

    it("classifies AbortError", () => {
        const error = new Error("AbortError");
        const result = classifyError(error);
        
        expect(result.type).toBe("timeout");
        expect(result.shouldRetry).toBe(true);
    });

    it("classifies rate limit errors", () => {
        const result = classifyError(new Error("429 Too Many Requests"));
        
        expect(result.type).toBe("transient");
        expect(result.shouldRetry).toBe(true);
    });

    it("classifies 500 errors as transient", () => {
        const result = classifyError(new Error("500 Internal Server Error"));
        
        expect(result.type).toBe("transient");
        expect(result.shouldRetry).toBe(true);
    });

    it("classifies 502 errors as transient", () => {
        const result = classifyError(new Error("502 Bad Gateway"));
        
        expect(result.type).toBe("transient");
        expect(result.shouldRetry).toBe(true);
    });

    it("classifies 503 errors as transient", () => {
        const result = classifyError(new Error("503 Service Unavailable"));
        
        expect(result.type).toBe("transient");
        expect(result.shouldRetry).toBe(true);
    });

    it("classifies validation errors", () => {
        const result = classifyError(new Error("validation failed"));
        
        expect(result.type).toBe("validation");
        expect(result.shouldRetry).toBe(false);
    });

    it("classifies unknown errors", () => {
        const result = classifyError(new Error("Something unexpected"));
        
        expect(result.type).toBe("unknown");
        expect(result.shouldRetry).toBe(false);
    });

    it("handles non-Error objects", () => {
        const result = classifyError("string error");
        
        expect(result.type).toBe("unknown");
        expect(result.userMessage).toBeDefined();
    });
});

// ===== Retry Logic Tests =====

describe("withRetry", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it("returns result on first success", async () => {
        const fn = vi.fn().mockResolvedValue("success");
        
        const result = await withRetry(fn);
        
        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on transient errors", async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error("500 Server Error"))
            .mockResolvedValue("success");
        
        const promise = withRetry(fn, { maxAttempts: 3 });
        
        // Fast-forward through the retry delay
        await vi.runAllTimersAsync();
        
        const result = await promise;
        
        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws after max attempts", async () => {
        vi.useRealTimers(); // Use real timers for this test to avoid unhandled rejection
        
        const fn = vi.fn().mockRejectedValue(new Error("500 Server Error"));
        
        // The promise should reject after max attempts
        await expect(
            withRetry(fn, { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 20 })
        ).rejects.toThrow("500 Server Error");
        
        expect(fn).toHaveBeenCalledTimes(2);
        
        vi.useFakeTimers(); // Restore fake timers for other tests
    });

    it("does not retry on validation errors", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("validation failed"));
        
        await expect(withRetry(fn)).rejects.toThrow("validation failed");
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

// ===== Context Window Management Tests =====

describe("estimateTokens", () => {
    it("estimates tokens for short text", () => {
        const tokens = estimateTokens("Hello World");
        
        // ~11 chars / 4 = ~3 tokens
        expect(tokens).toBeGreaterThan(0);
        expect(tokens).toBeLessThan(10);
    });

    it("estimates tokens for longer text", () => {
        const text = "a".repeat(1000);
        const tokens = estimateTokens(text);
        
        // 1000 chars / 4 = 250 tokens
        expect(tokens).toBe(250);
    });

    it("handles empty string", () => {
        expect(estimateTokens("")).toBe(0);
    });
});

describe("truncateMessages", () => {
    it("keeps all messages when under limit", () => {
        const messages = [
            { role: "system", content: "You are helpful" },
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there!" },
        ];
        
        const result = truncateMessages(messages, 1000);
        
        expect(result).toHaveLength(3);
    });

    it("always keeps system message", () => {
        const messages = [
            { role: "system", content: "You are helpful" },
            { role: "user", content: "a".repeat(100) },
            { role: "assistant", content: "b".repeat(100) },
        ];
        
        const result = truncateMessages(messages, 50); // Very small limit
        
        expect(result.some(m => m.role === "system")).toBe(true);
    });

    it("keeps most recent messages when truncating", () => {
        const messages = [
            { role: "system", content: "System" },
            { role: "user", content: "Old message" },
            { role: "assistant", content: "Old response" },
            { role: "user", content: "New message" },
            { role: "assistant", content: "New response" },
        ];
        
        // Limit that allows system + some recent messages
        const result = truncateMessages(messages, 100);
        
        // Should contain system message somewhere
        const hasSystem = result.some(m => m.role === "system");
        expect(hasSystem).toBe(true);
        
        // Should prefer newer messages when truncating
        // The function adds messages from the end, so newest should be included
        const hasNewResponse = result.some(m => m.content === "New response");
        expect(hasNewResponse).toBe(true);
    });

    it("handles empty messages array", () => {
        const result = truncateMessages([], 1000);
        
        expect(result).toHaveLength(0);
    });

    it("handles messages without system", () => {
        const messages = [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi" },
        ];
        
        const result = truncateMessages(messages, 1000);
        
        expect(result).toHaveLength(2);
    });
});
