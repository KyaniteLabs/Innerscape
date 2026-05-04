/**
 * Chat API Tests
 * 
 * Tests the chat assistant endpoint with mocked AI responses.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock rate limiter to always allow in tests
vi.mock("@/lib/rate-limit", () => ({
    rateLimit: vi.fn().mockReturnValue({ success: true, limit: 30, remaining: 29, reset: Date.now() + 60000 }),
    rateLimitedResponse: vi.fn(),
}));

// Mock the global fetch for AI API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the tools module
vi.mock("@/lib/agent/tools", () => ({
    searchSecondBrain: vi.fn().mockResolvedValue({
        success: true,
        data: [
            { id: "1", type: "projects", name: "Test Project", snippet: "Test notes" },
        ],
    }),
    getRecentContext: vi.fn().mockResolvedValue({
        success: true,
        data: { recentItems: [], totalCaptures: 10 },
    }),
    getRelatedItems: vi.fn().mockResolvedValue({
        success: true,
        data: [],
    }),
    AGENT_TOOL_DEFINITIONS: [
        {
            type: "function",
            function: {
                name: "search_second_brain",
                description: "Search the second brain",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                    },
                },
            },
        },
    ],
}));

describe("POST /api/chat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default AI response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        role: "assistant",
                        content: "Here are your active projects...",
                    },
                    finish_reason: "stop",
                }],
            }),
        });
    });

    it("returns chat response for valid message", async () => {
        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "What are my active projects?" },
                ],
            }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBeDefined();
        expect(data.message.role).toBe("assistant");
        expect(data.message.content).toBeDefined();
    });

    it("rejects empty messages array", async () => {
        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [] }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
    });

    it("rejects when last message is not from user", async () => {
        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "Hello" },
                    { role: "assistant", content: "Hi" },
                ],
            }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("user");
    });

    it("handles tool calls in response", async () => {
        // First response with tool call
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            role: "assistant",
                            content: null,
                            tool_calls: [{
                                id: "call_1",
                                type: "function",
                                function: {
                                    name: "search_second_brain",
                                    arguments: JSON.stringify({ query: "projects" }),
                                },
                            }],
                        },
                        finish_reason: "tool_calls",
                    }],
                }),
            })
            // Second response after tool execution
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            role: "assistant",
                            content: "I found 1 project: Test Project",
                        },
                        finish_reason: "stop",
                    }],
                }),
            });

        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "Search for my projects" },
                ],
            }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message.content).toContain("project");
    });

    it("handles AI API errors gracefully", async () => {
        mockFetch.mockRejectedValueOnce(new Error("500 Internal Server Error"));

        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "Hello" },
                ],
            }),
        });

        const response = await POST(req);
        const data = await response.json();

        // Should still return 200 with a user-friendly error message
        expect(response.status).toBe(200);
        expect(data.message.content).toBeDefined();
    });

    it("validates input length", async () => {
        const longMessage = "a".repeat(10000);
        
        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: longMessage },
                ],
            }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Input too long");
    });

    it("handles conversation context", async () => {
        const req = new NextRequest("http://localhost/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "What are my projects?" },
                    { role: "assistant", content: "You have 3 active projects." },
                    { role: "user", content: "Tell me more about the first one" },
                ],
            }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        // Verify fetch was called (AI was invoked)
        expect(mockFetch).toHaveBeenCalled();
    });
});
