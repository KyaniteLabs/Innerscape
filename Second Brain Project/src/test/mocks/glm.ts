/**
 * GLM API Mock Helpers
 * 
 * Utilities for mocking the GLM-4.7 API in tests.
 * Supports both streaming and non-streaming responses.
 */

import { vi } from "vitest";
import { createMockGLMResponse, createMockGLMToolResponse, createMockToolCall } from "../factories";
import type { GLMChatResponse, ToolCall } from "@/lib/agent/types";

// ===== Non-Streaming Mocks =====

/**
 * Mock a successful GLM API response
 */
export function mockGLMSuccess(content: string, options?: {
    reasoning?: string;
    toolCalls?: ToolCall[];
}): void {
    const response = createMockGLMResponse(content, options);
    
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(response),
    }));
}

/**
 * Mock a GLM API response with tool calls
 */
export function mockGLMWithTools(toolCalls: ToolCall[], reasoning?: string): void {
    const response = createMockGLMToolResponse(toolCalls, reasoning);
    
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(response),
    }));
}

/**
 * Mock a sequence of GLM responses (for tool iteration testing)
 */
export function mockGLMSequence(responses: GLMChatResponse[]): void {
    const mockFetch = vi.fn();
    
    responses.forEach((response, index) => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(response),
        });
    });
    
    vi.stubGlobal("fetch", mockFetch);
}

/**
 * Mock a GLM API error response
 */
export function mockGLMError(status: number, message: string): void {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status,
        text: () => Promise.resolve(message),
    }));
}

/**
 * Mock a GLM API timeout
 */
export function mockGLMTimeout(): void {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            setTimeout(() => reject(error), 100);
        });
    }));
}

/**
 * Mock a network error
 */
export function mockGLMNetworkError(message: string = "Network error"): void {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(message)));
}

/**
 * Mock malformed JSON response
 */
export function mockGLMMalformedJSON(): void {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
    }));
}

// ===== Streaming Mocks =====

/**
 * Create a mock ReadableStream for SSE responses
 */
function createMockSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    let index = 0;
    
    return new ReadableStream({
        pull(controller) {
            if (index < chunks.length) {
                const data = `data: ${chunks[index]}\n\n`;
                controller.enqueue(encoder.encode(data));
                index++;
            } else {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            }
        },
    });
}

/**
 * Mock a streaming GLM API response
 */
export function mockGLMStream(chunks: Array<{
    content?: string;
    reasoning?: string;
    toolCalls?: Array<{
        index: number;
        id?: string;
        name?: string;
        arguments?: string;
    }>;
}>): void {
    const sseChunks = chunks.map((chunk, i) => JSON.stringify({
        id: `chunk-${i}`,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: "glm-4.7",
        choices: [{
            index: 0,
            delta: {
                content: chunk.content,
                reasoning_content: chunk.reasoning,
                tool_calls: chunk.toolCalls?.map(tc => ({
                    index: tc.index,
                    id: tc.id,
                    type: tc.id ? "function" : undefined,
                    function: {
                        name: tc.name,
                        arguments: tc.arguments,
                    },
                })),
            },
            finish_reason: null,
        }],
    }));
    
    // Add final chunk with finish_reason
    sseChunks.push(JSON.stringify({
        id: `chunk-final`,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: "glm-4.7",
        choices: [{
            index: 0,
            delta: {},
            finish_reason: "stop",
        }],
    }));
    
    const stream = createMockSSEStream(sseChunks);
    
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        body: stream,
    }));
}

/**
 * Mock a streaming response with content
 */
export function mockGLMStreamContent(content: string, chunkSize: number = 10): void {
    const chunks: Array<{ content: string }> = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push({ content: content.slice(i, i + chunkSize) });
    }
    
    mockGLMStream(chunks);
}

// ===== Helper Functions =====

/**
 * Create a classification response JSON
 */
export function createClassificationJSON(
    destination: string,
    confidence: number,
    data: Record<string, unknown>
): string {
    return JSON.stringify({
        action: "filed",
        destination,
        confidence,
        summary: `Filed to ${destination}`,
        firstStep: "Start working on it",
        data,
    });
}

/**
 * Create a clarification response JSON
 */
export function createClarificationJSON(
    question: string,
    options: string[]
): string {
    return JSON.stringify({
        action: "clarify",
        summary: "Need more information",
        question,
        options,
    });
}

/**
 * Reset all fetch mocks
 */
export function resetGLMMocks(): void {
    vi.unstubAllGlobals();
}

// ===== Pre-built Response Helpers =====

/**
 * Mock a successful project classification
 */
export function mockGLMProjectClassification(name: string = "Test Project"): void {
    mockGLMSuccess(createClassificationJSON("projects", 0.9, {
        name,
        status: "active",
        next_action: "Get started",
    }));
}

/**
 * Mock a successful person classification
 */
export function mockGLMPersonClassification(name: string = "John Doe"): void {
    mockGLMSuccess(createClassificationJSON("people", 0.85, {
        name,
        context: "Met at work",
        follow_ups: "Schedule meeting",
    }));
}

/**
 * Mock a needs_review response (low confidence)
 */
export function mockGLMLowConfidence(): void {
    mockGLMSuccess(createClassificationJSON("needs_review", 0.4, {
        original_text: "ambiguous text",
        reason: "Could not determine category",
    }));
}

/**
 * Mock a clarification request
 */
export function mockGLMClarification(question: string, options: string[]): void {
    mockGLMSuccess(createClarificationJSON(question, options));
}
