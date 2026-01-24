/**
 * NeuroSecond Agent Orchestrator
 * 
 * A GLM-4.7 powered agent designed as an executive function prosthetic
 * for neurodivergent users. Implements the agent loop:
 * 
 *   Gather Context → Reason → Execute Tools → Verify → Respond
 * 
 * Key features:
 * - Multi-step reasoning with GLM-4.7 deep thinking
 * - Tool use for semantic search, database ops, context
 * - ADHD-optimized responses (BLUF, chunked, non-judgmental)
 * - Session memory for context persistence
 */

import { CONFIG } from "@/lib/config";
import { SYSTEM_PROMPT, formatAgentResponse } from "./prompts/system";
import { getOptimizedSystemPrompt, invalidatePromptCache } from "./prompts/cache";
import { createToolRegistry, AGENT_TOOL_DEFINITIONS } from "./tools";
import type {
    AgentMessage,
    AgentOptions,
    AgentResponse,
    ToolCall,
    ToolRegistry,
    StreamChunk,
    GLMChatResponse,
    GLMStreamChunk,
} from "./types";

// ===== Constants =====

const MAX_TOOL_ITERATIONS = 5;  // Prevent infinite loops
const DEFAULT_TIMEOUT_MS = 30000;

// ===== Agent Class =====

export class Agent {
    private apiKey: string;
    private baseUrl: string;
    private toolRegistry: ToolRegistry;
    private userId: string;

    constructor(userId: string = CONFIG.SINGLE_USER_ID) {
        const apiKey = process.env.GLM_API_KEY;
        if (!apiKey) {
            throw new Error("[APEX] [Agent] Missing GLM_API_KEY");
        }
        
        this.apiKey = apiKey;
        this.baseUrl = CONFIG.AI.API_BASE_URL;
        this.userId = userId;
        this.toolRegistry = createToolRegistry(userId);
    }

    /**
     * Process a capture through the agent
     * Main entry point for the agent system
     */
    async process(
        text: string,
        options: AgentOptions = {}
    ): Promise<AgentResponse> {
        const {
            model = CONFIG.AI.DEFAULT_MODEL,
            temperature = CONFIG.AI.TEMPERATURE,
            maxTokens = CONFIG.AI.MAX_TOKENS,
            thinkingMode = CONFIG.AI.THINKING_MODE,
            stream = false,
            onStream,
            includeContext = true,
            maxContextItems = CONFIG.AGENT.MAX_CONTEXT_ITEMS,
            enabledTools,
            timeoutMs = DEFAULT_TIMEOUT_MS,
        } = options;

        console.info(`[APEX] [Agent] Processing capture: "${text.substring(0, 50)}..."`);

        try {
            // 1. Build initial messages with context
            // META: Use optimized cached prompt with learned patterns
            const systemPrompt = await getOptimizedSystemPrompt();
            const messages: AgentMessage[] = [
                { role: "system", content: systemPrompt },
            ];

            // Add context from recent captures if enabled
            if (includeContext) {
                const context = await this.gatherContext(maxContextItems);
                if (context) {
                    messages.push({
                        role: "system",
                        content: `\n<recent_context>\n${context}\n</recent_context>`,
                    });
                }
            }

            // Add user message
            messages.push({ role: "user", content: text });

            // 2. Run agent loop
            const tools = this.getEnabledTools(enabledTools);
            let iterations = 0;
            let response: GLMChatResponse | null = null;

            while (iterations < MAX_TOOL_ITERATIONS) {
                iterations++;
                console.info(`[APEX] [Agent] Iteration ${iterations}/${MAX_TOOL_ITERATIONS}`);

                // Call GLM-4.7
                if (stream && onStream) {
                    response = await this.callGLMStreaming(
                        messages,
                        tools,
                        { model, temperature, maxTokens, thinkingMode, timeoutMs },
                        onStream
                    );
                } else {
                    response = await this.callGLM(
                        messages,
                        tools,
                        { model, temperature, maxTokens, thinkingMode, timeoutMs }
                    );
                }

                const choice = response.choices[0];
                const message = choice.message;

                // Check if agent wants to use tools
                if (message.tool_calls && message.tool_calls.length > 0) {
                    // Add assistant message with tool calls
                    messages.push({
                        role: "assistant",
                        content: message.content || "",
                        reasoning_content: message.reasoning_content,
                    });

                    // Execute tools and add results
                    for (const toolCall of message.tool_calls) {
                        const result = await this.executeTool(toolCall);
                        
                        if (stream && onStream) {
                            onStream({
                                type: "tool_result",
                                toolResult: result,
                            });
                        }

                        messages.push({
                            role: "tool",
                            content: JSON.stringify(result),
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                        });
                    }

                    // Continue loop to let agent process tool results
                    continue;
                }

                // No tool calls - agent has final response
                break;
            }

            if (!response) {
                throw new Error("No response from agent");
            }

            // 3. Parse and format response
            const agentResponse = this.parseAgentResponse(
                response.choices[0].message.content || "",
                response.choices[0].message.reasoning_content
            );

            if (stream && onStream) {
                onStream({
                    type: "done",
                    finalResponse: agentResponse,
                });
            }

            console.info(`[APEX] [Agent] Completed: ${agentResponse.action} → ${agentResponse.destination || "n/a"}`);
            return agentResponse;

        } catch (error) {
            console.error("[APEX] [Agent] Error:", error instanceof Error ? error.message : "Unknown error");
            
            return {
                action: "error",
                summary: "Something went wrong processing your capture.",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Gather context from recent captures
     */
    private async gatherContext(limit: number): Promise<string | null> {
        try {
            const contextTool = this.toolRegistry["get_recent_context"];
            if (!contextTool) return null;

            const result = await contextTool.execute({ limit });
            if (!result.success || !result.data) return null;

            const items = result.data as Array<{ type: string; name: string; capturedAt: string }>;
            if (items.length === 0) return null;

            return items
                .map(item => `- ${item.type}: ${item.name} (${item.capturedAt})`)
                .join("\n");
        } catch {
            return null;
        }
    }

    /**
     * Get enabled tools based on options
     */
    private getEnabledTools(enabledToolNames?: string[]) {
        const allTools = AGENT_TOOL_DEFINITIONS;
        
        if (!enabledToolNames) {
            return allTools;
        }

        return allTools.filter(tool => 
            enabledToolNames.includes(tool.function.name)
        );
    }

    /**
     * Call GLM-4.7 API (non-streaming)
     */
    private async callGLM(
        messages: AgentMessage[],
        tools: typeof AGENT_TOOL_DEFINITIONS,
        options: {
            model: string;
            temperature: number;
            maxTokens: number;
            thinkingMode: "enabled" | "disabled";
            timeoutMs: number;
        }
    ): Promise<GLMChatResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                        ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
                        ...(m.name && { name: m.name }),
                    })),
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: tools.length > 0 ? "auto" : undefined,
                    thinking: { type: options.thinkingMode },
                    temperature: options.temperature,
                    max_tokens: options.maxTokens,
                    response_format: { type: "json_object" },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(`GLM API Error: ${response.status} - ${errorBody}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Call GLM-4.7 API with streaming
     */
    private async callGLMStreaming(
        messages: AgentMessage[],
        tools: typeof AGENT_TOOL_DEFINITIONS,
        options: {
            model: string;
            temperature: number;
            maxTokens: number;
            thinkingMode: "enabled" | "disabled";
            timeoutMs: number;
        },
        onStream: (chunk: StreamChunk) => void
    ): Promise<GLMChatResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                        ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
                        ...(m.name && { name: m.name }),
                    })),
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: tools.length > 0 ? "auto" : undefined,
                    thinking: { type: options.thinkingMode },
                    temperature: options.temperature,
                    max_tokens: options.maxTokens,
                    stream: true,
                    tool_stream: CONFIG.AI.TOOL_STREAM,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(`GLM API Error: ${response.status} - ${errorBody}`);
            }

            // Process SSE stream
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body");
            }

            const decoder = new TextDecoder();
            let buffer = "";
            let accumulatedContent = "";
            let accumulatedReasoning = "";
            const accumulatedToolCalls: ToolCall[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") continue;

                        try {
                            const chunk: GLMStreamChunk = JSON.parse(data);
                            const delta = chunk.choices[0]?.delta;

                            if (delta?.reasoning_content) {
                                accumulatedReasoning += delta.reasoning_content;
                                onStream({ type: "thinking", content: delta.reasoning_content });
                            }

                            if (delta?.content) {
                                accumulatedContent += delta.content;
                                onStream({ type: "content", content: delta.content });
                            }

                            if (delta?.tool_calls) {
                                for (const tc of delta.tool_calls) {
                                    if (tc.id) {
                                        // New tool call
                                        accumulatedToolCalls[tc.index] = {
                                            id: tc.id,
                                            type: "function",
                                            function: {
                                                name: tc.function?.name || "",
                                                arguments: tc.function?.arguments || "",
                                            },
                                        };
                                    } else if (tc.function?.arguments) {
                                        // Continuation of arguments
                                        accumulatedToolCalls[tc.index].function.arguments += tc.function.arguments;
                                    }

                                    onStream({
                                        type: "tool_call",
                                        toolCall: accumulatedToolCalls[tc.index],
                                    });
                                }
                            }
                        } catch {
                            // Ignore parse errors in stream
                        }
                    }
                }
            }

            // Construct final response
            return {
                id: "stream-response",
                object: "chat.completion",
                created: Date.now(),
                model: options.model,
                choices: [{
                    index: 0,
                    message: {
                        role: "assistant",
                        content: accumulatedContent,
                        reasoning_content: accumulatedReasoning || undefined,
                        tool_calls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
                    },
                    finish_reason: "stop",
                }],
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Execute a tool call
     */
    private async executeTool(toolCall: ToolCall): Promise<{ success: boolean; data?: unknown; error?: string }> {
        const toolName = toolCall.function.name;
        const tool = this.toolRegistry[toolName];

        if (!tool) {
            console.warn(`[APEX] [Agent] Unknown tool: ${toolName}`);
            return { success: false, error: `Unknown tool: ${toolName}` };
        }

        try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`[APEX] [Agent] Executing tool: ${toolName}`, args);
            
            const result = await tool.execute(args);
            return result;
        } catch (error) {
            console.error(`[APEX] [Agent] Tool execution error (${toolName}):`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Tool execution failed",
            };
        }
    }

    /**
     * Parse agent's JSON response into AgentResponse
     */
    private parseAgentResponse(content: string, reasoning?: string): AgentResponse {
        try {
            // Clean any markdown formatting
            const cleaned = content
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const parsed = JSON.parse(cleaned);
            
            return {
                action: parsed.action || "filed",
                destination: parsed.destination,
                destinationId: parsed.destinationId,
                confidence: parsed.confidence,
                summary: parsed.summary || "Capture processed.",
                firstStep: parsed.firstStep || parsed.first_step,
                related: parsed.related,
                question: parsed.question,
                options: parsed.options,
                reasoning,
                data: parsed.data,
            };
        } catch {
            // If JSON parsing fails, treat content as summary
            return {
                action: "filed",
                summary: content || "Capture processed.",
                reasoning,
            };
        }
    }
}

// ===== Convenience Functions =====

/**
 * Process a capture using the agent
 * Simplified interface for common use case
 */
export async function processWithAgent(
    text: string,
    options?: AgentOptions
): Promise<AgentResponse> {
    const agent = new Agent();
    return agent.process(text, options);
}

/**
 * Process a capture with streaming
 */
export async function processWithAgentStreaming(
    text: string,
    onStream: (chunk: StreamChunk) => void,
    options?: Omit<AgentOptions, "stream" | "onStream">
): Promise<AgentResponse> {
    const agent = new Agent();
    return agent.process(text, {
        ...options,
        stream: true,
        onStream,
    });
}

// Export types
export type { AgentResponse, AgentOptions, StreamChunk } from "./types";
