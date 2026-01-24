/**
 * Agent Types for NeuroSecond
 * Executive Function Prosthetic
 */

// ===== Core Agent Types =====

export type AgentDestination = "people" | "projects" | "ideas" | "admin" | "needs_review";

export interface AgentMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string;           // Tool name for tool messages
    tool_call_id?: string;   // For tool responses
    reasoning_content?: string; // GLM-4.7 thinking output
}

export interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;  // JSON string
    };
}

export interface AgentToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, {
                type: string;
                description: string;
                enum?: string[];
            }>;
            required: string[];
        };
    };
}

// ===== Agent Response Types =====

export interface AgentResponse {
    // What was done
    action: "filed" | "clarify" | "error" | "pending";
    
    // Classification result (if filed)
    destination?: AgentDestination;
    destinationId?: string;
    confidence?: number;
    
    // ADHD-friendly response components
    summary: string;           // What was captured (1 line)
    firstStep?: string;        // Tiny action to start
    related?: RelatedItem[];   // Connected items (max 3)
    
    // For clarification
    question?: string;
    options?: string[];        // Max 3 options
    
    // Agent reasoning (for debugging)
    reasoning?: string;
    
    // Extracted data
    data?: Record<string, unknown>;
    
    // Error info
    error?: string;
}

export interface RelatedItem {
    id: string;
    type: AgentDestination;
    name: string;
    relevance: string;  // Why it's related (1 line)
}

// ===== Session Types =====

export interface AgentSession {
    id: string;
    userId: string;
    messages: AgentMessage[];
    context: SessionContext;
    createdAt: Date;
    updatedAt: Date;
}

export interface SessionContext {
    // Recent items for context
    recentCaptures: RecentCapture[];
    
    // User preferences (learned over time)
    preferences: UserPreferences;
    
    // Current conversation state
    pendingClarification?: {
        originalText: string;
        question: string;
        options?: string[];
    };
}

export interface RecentCapture {
    id: string;
    type: AgentDestination;
    name: string;
    capturedAt: Date;
}

export interface UserPreferences {
    // Learned from user corrections
    preferredProjectFormat?: "simple" | "detailed";
    defaultTags?: string[];
    
    // Time preferences
    typicalWorkHours?: { start: number; end: number };
    preferredDueDateBuffer?: number; // days
}

// ===== Tool Execution Types =====

export interface ToolExecutionResult {
    success: boolean;
    data?: unknown;
    error?: string;
    warning?: string;  // Non-fatal issue that should be surfaced to user
}

export type ToolExecutor = (args: Record<string, unknown>) => Promise<ToolExecutionResult>;

export interface ToolRegistry {
    [toolName: string]: {
        definition: AgentToolDefinition;
        execute: ToolExecutor;
    };
}

// ===== Streaming Types =====

export interface StreamChunk {
    type: "thinking" | "content" | "tool_call" | "tool_result" | "done";
    content?: string;
    toolCall?: ToolCall;
    toolResult?: ToolExecutionResult;
    finalResponse?: AgentResponse;
}

export type StreamCallback = (chunk: StreamChunk) => void;

// ===== Agent Options =====

export interface AgentOptions {
    // Model settings
    model?: string;
    temperature?: number;
    maxTokens?: number;
    
    // Thinking mode
    thinkingMode?: "enabled" | "disabled";
    
    // Streaming
    stream?: boolean;
    onStream?: StreamCallback;
    
    // Context
    sessionId?: string;
    includeContext?: boolean;
    maxContextItems?: number;
    
    // Tools
    enabledTools?: string[];
    
    // Timeout
    timeoutMs?: number;
}

// ===== API Response Types =====

export interface GLMChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string | null;
            reasoning_content?: string;
            tool_calls?: ToolCall[];
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface GLMStreamChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
            reasoning_content?: string;
            tool_calls?: Array<{
                index: number;
                id?: string;
                type?: string;
                function?: {
                    name?: string;
                    arguments?: string;
                };
            }>;
        };
        finish_reason: string | null;
    }>;
}
