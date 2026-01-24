import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyWithGLM, CLASSIFICATION_PROMPT } from "./classifier";
import { CONFIG } from "@/lib/config";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("classifyWithGLM", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        process.env.GLM_API_KEY = "test-key";
    });

    it("classifies project-related input correctly", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            destination: "projects",
                            confidence: 0.92,
                            data: { name: "Website Redesign", next_action: "Email Sarah" }
                        })
                    }
                }]
            })
        });

        const result = await classifyWithGLM("Email Sarah about the website deadline");

        expect(result.destination).toBe("projects");
        expect(result.confidence).toBeGreaterThan(CONFIG.AI.CONFIDENCE_THRESHOLD);
        expect(result.data.name).toBe("Website Redesign");
        expect(console.error).not.toHaveBeenCalled();
    });

    it("routes to needs_review when confidence is low", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            destination: "ideas",
                            confidence: 0.45,
                            data: { name: "Something vague" }
                        })
                    }
                }]
            })
        });

        const result = await classifyWithGLM("maybe something");
        
        expect(result.destination).toBe("needs_review");
        expect(result.confidence).toBeLessThan(CONFIG.AI.CONFIDENCE_THRESHOLD);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("handles API errors gracefully and logs error", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));

        const result = await classifyWithGLM("test input");
        
        expect(result.destination).toBe("needs_review");
        expect(result.confidence).toBe(0);
        expect(result.data.error).toBe("Network error");
        // Verify error WAS logged
        expect(console.error).toHaveBeenCalledWith("[APEX] [Classifier] Classification failed after retries:", "Network error");
    });

    it("handles missing API key and logs error", async () => {
        delete process.env.GLM_API_KEY;

        const result = await classifyWithGLM("test input");
        
        expect(result.destination).toBe("needs_review");
        expect(result.confidence).toBe(0);
        expect(result.data.reason).toBe("Missing API Key");
        expect(console.error).toHaveBeenCalledWith("[APEX] [Classifier] Missing GLM_API_KEY");
    });

    it("handles non-ok API response and logs error", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 429,
            text: async () => "Rate limited",
        });

        const result = await classifyWithGLM("test input");
        
        expect(result.destination).toBe("needs_review");
        expect(result.data.error).toContain("429");
        expect(console.error).toHaveBeenCalled();
    });

    it("handles empty AI response and logs error", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: null } }]
            })
        });

        const result = await classifyWithGLM("test input");
        
        expect(result.destination).toBe("needs_review");
        expect(console.error).toHaveBeenCalled();
    });

    it("handles markdown-wrapped JSON response", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        content: "```json\n{\"destination\": \"admin\", \"confidence\": 0.8, \"data\": {}}\n```"
                    }
                }]
            })
        });

        const result = await classifyWithGLM("pay electric bill");
        
        expect(result.destination).toBe("admin");
        expect(result.confidence).toBe(0.8);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("sends correct request to GLM API", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            destination: "ideas",
                            confidence: 0.85,
                            data: {}
                        })
                    }
                }]
            })
        });

        await classifyWithGLM("test input");

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("chat/completions"),
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Authorization": "Bearer test-key",
                    "Content-Type": "application/json",
                }),
            })
        );

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.messages[0].content).toBe(CLASSIFICATION_PROMPT);
        expect(body.messages[1].content).toBe("test input");
    });

    describe("retry logic", () => {
        it("retries on transient 500 errors", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "Server error" })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    destination: "projects",
                                    confidence: 0.9,
                                    data: { name: "Test" }
                                })
                            }
                        }]
                    })
                });

            const result = await classifyWithGLM("test input");

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result.destination).toBe("projects");
            expect(console.warn).toHaveBeenCalled();
        });

        it("retries on 502 bad gateway", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: false, status: 502, text: async () => "Bad Gateway" })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    destination: "ideas",
                                    confidence: 0.8,
                                    data: {}
                                })
                            }
                        }]
                    })
                });

            const result = await classifyWithGLM("test input");

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result.destination).toBe("ideas");
        });

        it("retries on 503 service unavailable", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: false, status: 503, text: async () => "Service Unavailable" })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    destination: "admin",
                                    confidence: 0.85,
                                    data: {}
                                })
                            }
                        }]
                    })
                });

            const result = await classifyWithGLM("test input");

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result.destination).toBe("admin");
        });

        it("stops retrying after max attempts", async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => "Server error" });

            const result = await classifyWithGLM("test input");

            // Initial + MAX_RETRIES (2) = 3 calls
            expect(mockFetch).toHaveBeenCalledTimes(3);
            expect(result.destination).toBe("needs_review");
            expect(result.data.error).toContain("500");
        });

        it("does not retry on 400 client errors", async () => {
            mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => "Bad Request" });

            const result = await classifyWithGLM("test input");

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result.destination).toBe("needs_review");
        });

        it("does not retry on 401 unauthorized", async () => {
            mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "Unauthorized" });

            const result = await classifyWithGLM("test input");

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result.destination).toBe("needs_review");
        });
    });

    describe("timeout handling", () => {
        it("handles timeout with AbortError", async () => {
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            
            mockFetch.mockRejectedValue(abortError);

            const result = await classifyWithGLM("test input");

            // Timeouts are transient, so it should retry
            expect(mockFetch).toHaveBeenCalledTimes(3);
            expect(result.destination).toBe("needs_review");
        });
    });

    describe("malformed response handling", () => {
        it("handles completely invalid JSON", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: "not valid json at all {{{}"
                        }
                    }]
                })
            });

            const result = await classifyWithGLM("test input");

            expect(result.destination).toBe("needs_review");
            expect(console.error).toHaveBeenCalled();
        });

        it("handles JSON with missing required fields", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                // Missing destination and confidence
                                data: { name: "Test" }
                            })
                        }
                    }]
                })
            });

            const result = await classifyWithGLM("test input");

            // Should default to needs_review when destination is undefined
            expect(result.destination).toBe("needs_review");
        });

        it("handles empty choices array", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: []
                })
            });

            const result = await classifyWithGLM("test input");

            expect(result.destination).toBe("needs_review");
            expect(console.error).toHaveBeenCalled();
        });

        it("handles missing choices field", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            const result = await classifyWithGLM("test input");

            expect(result.destination).toBe("needs_review");
            expect(console.error).toHaveBeenCalled();
        });
    });
});
