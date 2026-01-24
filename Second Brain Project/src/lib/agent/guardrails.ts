/**
 * Agent Guardrails & Validation
 * 
 * 2026 Best Practices Implementation:
 * - Input sanitization and validation
 * - Output schema validation
 * - Content safety checks
 * - Rate limiting hints
 * - Tracing and observability
 */

import { z } from "zod";

// ===== Input Validation =====

/**
 * Maximum input length to prevent abuse
 */
export const MAX_INPUT_LENGTH = 4000;
export const MIN_INPUT_LENGTH = 1;

/**
 * Validate and sanitize user input
 */
export function validateInput(text: string): { 
    valid: boolean; 
    sanitized: string; 
    error?: string;
} {
    // Check length
    if (!text || text.length < MIN_INPUT_LENGTH) {
        return { valid: false, sanitized: "", error: "Input is required" };
    }
    
    if (text.length > MAX_INPUT_LENGTH) {
        return { 
            valid: false, 
            sanitized: text.slice(0, MAX_INPUT_LENGTH), 
            error: `Input too long (max ${MAX_INPUT_LENGTH} characters)` 
        };
    }
    
    // Sanitize - remove potential injection attempts
    const sanitized = text
        .replace(/```/g, "'''")  // Prevent markdown code block injection
        .replace(/<[^>]*>/g, "") // Strip HTML tags
        .trim();
    
    return { valid: true, sanitized };
}

// ===== Output Schemas (Zod) =====

/**
 * Schema for capture agent response
 * Strict validation ensures reliable downstream processing
 */
export const CaptureResponseSchema = z.object({
    action: z.enum(["filed", "clarify", "error"]),
    destination: z.enum(["people", "projects", "ideas", "admin", "needs_review"]).optional(),
    destinationId: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    summary: z.string().max(100),
    firstStep: z.string().max(80).optional(),
    related: z.array(z.object({
        id: z.string().optional(),
        type: z.string(),
        name: z.string(),
        relevance: z.string().max(50),
    })).max(3).optional(),
    question: z.string().max(100).optional(),
    options: z.array(z.string().max(50)).max(3).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    reasoning: z.string().optional(),
});

export type CaptureResponse = z.infer<typeof CaptureResponseSchema>;

/**
 * Schema for chat assistant response
 */
export const ChatResponseSchema = z.object({
    content: z.string().max(2000),
    suggestions: z.array(z.string().max(100)).max(3).optional(),
    dataReferenced: z.array(z.string()).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Validate agent output against schema
 */
export function validateOutput<T>(
    output: unknown, 
    schema: z.ZodSchema<T>
): { valid: boolean; data?: T; errors?: string[] } {
    const result = schema.safeParse(output);
    
    if (result.success) {
        return { valid: true, data: result.data };
    }
    
    // Extract error messages from Zod v4 format
    const errors = result.error.issues.map(issue => 
        `${issue.path.join(".")}: ${issue.message}`
    );
    
    return { valid: false, errors };
}

// ===== Content Safety =====

/**
 * Sensitive patterns that should not be logged or stored
 */
const SENSITIVE_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/,  // SSN
    /\b\d{16}\b/,             // Credit card
    /\bpassword\s*[:=]\s*\S+/i, // Passwords
    /\bapi[_-]?key\s*[:=]\s*\S+/i, // API keys
    /\bsecret\s*[:=]\s*\S+/i, // Secrets
];

/**
 * Check if content contains sensitive information
 */
export function containsSensitiveInfo(text: string): boolean {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Redact sensitive information from text
 */
export function redactSensitiveInfo(text: string): string {
    let redacted = text;
    SENSITIVE_PATTERNS.forEach(pattern => {
        redacted = redacted.replace(pattern, "[REDACTED]");
    });
    return redacted;
}

// ===== Tracing & Observability =====

export interface TraceEvent {
    timestamp: string;
    agentId: string;
    eventType: "input" | "tool_call" | "tool_result" | "output" | "error";
    data: Record<string, unknown>;
    durationMs?: number;
}

/**
 * Create a trace context for agent execution
 */
export function createTraceContext(agentId: string): {
    traceId: string;
    events: TraceEvent[];
    log: (eventType: TraceEvent["eventType"], data: Record<string, unknown>, durationMs?: number) => void;
    getTrace: () => TraceEvent[];
} {
    const traceId = crypto.randomUUID();
    const events: TraceEvent[] = [];
    
    return {
        traceId,
        events,
        log: (eventType, data, durationMs) => {
            const event: TraceEvent = {
                timestamp: new Date().toISOString(),
                agentId,
                eventType,
                data: containsSensitiveInfo(JSON.stringify(data)) 
                    ? { ...data, _redacted: true }
                    : data,
                durationMs,
            };
            events.push(event);
            
            // Log to console in development
            if (process.env.NODE_ENV === "development") {
                console.log(`[TRACE:${traceId.slice(0, 8)}] [${agentId}] ${eventType}:`, 
                    JSON.stringify(data).slice(0, 200));
            }
        },
        getTrace: () => events,
    };
}

// ===== Error Recovery =====

/**
 * Classify error type for appropriate handling
 */
export function classifyError(error: unknown): {
    type: "transient" | "permanent" | "validation" | "timeout" | "unknown";
    shouldRetry: boolean;
    userMessage: string;
} {
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes("timeout") || message.includes("AbortError")) {
        return {
            type: "timeout",
            shouldRetry: true,
            userMessage: "Request took too long. Please try again.",
        };
    }
    
    if (message.includes("429") || message.includes("rate limit")) {
        return {
            type: "transient",
            shouldRetry: true,
            userMessage: "System is busy. Please wait a moment and try again.",
        };
    }
    
    if (message.includes("500") || message.includes("502") || message.includes("503")) {
        return {
            type: "transient",
            shouldRetry: true,
            userMessage: "Temporary issue. Please try again.",
        };
    }
    
    if (message.includes("validation") || message.includes("invalid")) {
        return {
            type: "validation",
            shouldRetry: false,
            userMessage: "I couldn't understand that. Could you rephrase?",
        };
    }
    
    return {
        type: "unknown",
        shouldRetry: false,
        userMessage: "Something went wrong. Please try again.",
    };
}

// ===== Retry Logic =====

export interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
};

/**
 * Execute with exponential backoff retry
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULT_RETRY_OPTIONS, ...options };
    
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const { shouldRetry } = classifyError(error);
            
            if (!shouldRetry || attempt === maxAttempts) {
                throw error;
            }
            
            const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
            console.warn(`[APEX] [Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

// ===== Context Window Management =====

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
}

/**
 * Truncate messages to fit context window
 */
export function truncateMessages(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number
): Array<{ role: string; content: string }> {
    let totalTokens = 0;
    const result: Array<{ role: string; content: string }> = [];
    
    // Always keep system message
    const systemMessages = messages.filter(m => m.role === "system");
    const otherMessages = messages.filter(m => m.role !== "system");
    
    for (const msg of systemMessages) {
        totalTokens += estimateTokens(msg.content);
        result.push(msg);
    }
    
    // Add recent messages from the end
    for (let i = otherMessages.length - 1; i >= 0 && totalTokens < maxTokens; i--) {
        const msgTokens = estimateTokens(otherMessages[i].content);
        if (totalTokens + msgTokens > maxTokens) break;
        result.unshift(otherMessages[i]);
        totalTokens += msgTokens;
    }
    
    return result;
}
