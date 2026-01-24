/**
 * Test Factories
 * 
 * Helpers for generating test data with sensible defaults
 * and easy overrides for specific test scenarios.
 */

import type { AgentResponse, AgentMessage, ToolCall, GLMChatResponse } from "@/lib/agent/types";

// ===== Database Entity Factories =====

export interface MockProject {
    id: string;
    name: string;
    status: "active" | "waiting" | "blocked" | "someday" | "completed";
    nextAction: string | null;
    notes: string | null;
    tags: string | null;
    lastTouched: Date;
    userId: string;
}

export function createMockProject(overrides: Partial<MockProject> = {}): MockProject {
    return {
        id: `project-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: "Test Project",
        status: "active",
        nextAction: "Review requirements",
        notes: "Test project notes",
        tags: JSON.stringify(["test", "mock"]),
        lastTouched: new Date(),
        userId: "test-user",
        ...overrides,
    };
}

export interface MockPerson {
    id: string;
    name: string;
    context: string | null;
    followUps: string | null;
    tags: string | null;
    lastTouched: Date;
    userId: string;
}

export function createMockPerson(overrides: Partial<MockPerson> = {}): MockPerson {
    return {
        id: `person-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: "Test Person",
        context: "Met at conference",
        followUps: "Follow up next week",
        tags: JSON.stringify(["work", "contact"]),
        lastTouched: new Date(),
        userId: "test-user",
        ...overrides,
    };
}

export interface MockIdea {
    id: string;
    name: string;
    oneLiner: string | null;
    notes: string | null;
    tags: string | null;
    lastTouched: Date;
    userId: string;
}

export function createMockIdea(overrides: Partial<MockIdea> = {}): MockIdea {
    return {
        id: `idea-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: "Test Idea",
        oneLiner: "A revolutionary concept",
        notes: "More details about the idea",
        tags: JSON.stringify(["innovation"]),
        lastTouched: new Date(),
        userId: "test-user",
        ...overrides,
    };
}

export interface MockAdminTask {
    id: string;
    name: string;
    dueDate: string | null;
    status: string;
    notes: string | null;
    createdAt: Date;
    userId: string;
}

export function createMockAdminTask(overrides: Partial<MockAdminTask> = {}): MockAdminTask {
    return {
        id: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: "Test Task",
        dueDate: null,
        status: "todo",
        notes: "Task notes",
        createdAt: new Date(),
        userId: "test-user",
        ...overrides,
    };
}

export interface MockInboxItem {
    id: string;
    originalText: string;
    filedTo: string | null;
    destinationId: string | null;
    confidence: number | null;
    status: "pending" | "filed" | "needs_review" | "fixed";
    captureSource: string | null;
    createdAt: Date;
    userId: string;
}

export function createMockInboxItem(overrides: Partial<MockInboxItem> = {}): MockInboxItem {
    return {
        id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalText: "Test capture text",
        filedTo: null,
        destinationId: null,
        confidence: null,
        status: "pending",
        captureSource: "web",
        createdAt: new Date(),
        userId: "test-user",
        ...overrides,
    };
}

// ===== Agent Response Factories =====

export function createMockAgentResponse(overrides: Partial<AgentResponse> = {}): AgentResponse {
    return {
        action: "filed",
        destination: "projects",
        confidence: 0.85,
        summary: "Test capture processed",
        firstStep: "Open the document",
        related: [],
        data: { name: "Test Item" },
        ...overrides,
    };
}

export function createMockClarifyResponse(overrides: Partial<AgentResponse> = {}): AgentResponse {
    return {
        action: "clarify",
        summary: "Need more information",
        question: "Is this a project or a task?",
        options: ["Project", "Task", "Idea"],
        ...overrides,
    };
}

export function createMockErrorResponse(overrides: Partial<AgentResponse> = {}): AgentResponse {
    return {
        action: "error",
        summary: "Something went wrong",
        error: "Test error message",
        ...overrides,
    };
}

// ===== Agent Message Factories =====

export function createMockUserMessage(content: string): AgentMessage {
    return {
        role: "user",
        content,
    };
}

export function createMockAssistantMessage(
    content: string,
    reasoning?: string
): AgentMessage {
    return {
        role: "assistant",
        content,
        reasoning_content: reasoning,
    };
}

export function createMockToolMessage(
    toolCallId: string,
    name: string,
    content: string
): AgentMessage {
    return {
        role: "tool",
        content,
        tool_call_id: toolCallId,
        name,
    };
}

// ===== Tool Call Factories =====

export function createMockToolCall(
    name: string,
    args: Record<string, unknown>,
    id?: string
): ToolCall {
    return {
        id: id || `call-${Date.now()}`,
        type: "function",
        function: {
            name,
            arguments: JSON.stringify(args),
        },
    };
}

// ===== GLM API Response Factories =====

export function createMockGLMResponse(
    content: string,
    options: {
        reasoning?: string;
        toolCalls?: ToolCall[];
        finishReason?: string;
    } = {}
): GLMChatResponse {
    return {
        id: `resp-${Date.now()}`,
        object: "chat.completion",
        created: Date.now(),
        model: "glm-4.7",
        choices: [{
            index: 0,
            message: {
                role: "assistant",
                content,
                reasoning_content: options.reasoning,
                tool_calls: options.toolCalls,
            },
            finish_reason: options.finishReason || "stop",
        }],
        usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
        },
    };
}

export function createMockGLMToolResponse(
    toolCalls: ToolCall[],
    reasoning?: string
): GLMChatResponse {
    return createMockGLMResponse("", {
        toolCalls,
        reasoning,
        finishReason: "tool_calls",
    });
}

// ===== Classification Result Factories =====

export interface MockClassificationResult {
    destination: "people" | "projects" | "ideas" | "admin" | "needs_review";
    confidence: number;
    data: Record<string, unknown>;
}

export function createMockClassificationResult(
    overrides: Partial<MockClassificationResult> = {}
): MockClassificationResult {
    return {
        destination: "projects",
        confidence: 0.85,
        data: {
            name: "Test Project",
            status: "active",
            next_action: "Review requirements",
        },
        ...overrides,
    };
}

// ===== Embedding Factories =====

export function createMockEmbedding(dimensions: number = 384): Float32Array {
    const embedding = new Float32Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
        embedding[i] = Math.random() * 2 - 1; // Random values between -1 and 1
    }
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < dimensions; i++) {
        embedding[i] /= norm;
    }
    return embedding;
}

export function createSimilarEmbedding(
    base: Float32Array,
    similarity: number = 0.9
): Float32Array {
    const noise = createMockEmbedding(base.length);
    const result = new Float32Array(base.length);
    
    for (let i = 0; i < base.length; i++) {
        result[i] = base[i] * similarity + noise[i] * (1 - similarity);
    }
    
    // Normalize
    const norm = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < result.length; i++) {
        result[i] /= norm;
    }
    
    return result;
}
