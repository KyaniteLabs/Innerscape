/**
 * Chat Assistant API Route
 * 
 * Conversational AI endpoint with full access to the Second Brain.
 * Uses the same tools as the capture agent for consistency.
 * 
 * 2026 Best Practices:
 * - Contract-style system prompt
 * - Tool calling for data access
 * - Semantic search integration
 * - Input validation & guardrails
 * - Structured conversation management
 */

import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";
import { 
    searchSecondBrain, 
    getRecentContext, 
    getRelatedItems,
    AGENT_TOOL_DEFINITIONS 
} from "@/lib/agent/tools";
import { 
    validateInput, 
    truncateMessages,
    createTraceContext,
    withRetry,
    classifyError 
} from "@/lib/agent/guardrails";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

// ===== Types =====

interface ChatMessage {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    tool_call_id?: string;
    name?: string;
}

interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}

// ===== Analytics Tool Definition =====

const ANALYTICS_TOOL_DEFINITION = {
    type: "function" as const,
    function: {
        name: "get_analytics_summary",
        description: "Get the user's analytics and activity patterns. Use this when the user asks about their productivity, patterns, accuracy, or wants to understand their data.",
        parameters: {
            type: "object",
            properties: {
                timeframe: {
                    type: "string",
                    enum: ["today", "week", "month"],
                    description: "Time period to analyze (default: week)",
                },
                focus: {
                    type: "string",
                    enum: ["activity", "productivity", "health", "all"],
                    description: "Which metrics to focus on (default: all)",
                },
            },
            required: [],
        },
    },
};

// ===== Chat-Specific Tool Definitions =====
// Subset of tools that make sense for chat (no create_item - that's capture's job)

const CHAT_TOOL_DEFINITIONS = [
    ...AGENT_TOOL_DEFINITIONS.filter(tool => 
        ["search_second_brain", "get_related_items", "get_recent_context"].includes(tool.function.name)
    ),
    ANALYTICS_TOOL_DEFINITION,
];

// ===== Auto-Context Injection =====

/**
 * Automatically retrieve relevant context based on user's message
 * This is injected into the system prompt to give the AI immediate context
 * without requiring a tool call roundtrip.
 */
async function getAutoContext(userMessage: string, userId: string): Promise<string | null> {
    try {
        // Search for relevant items using hybrid search
        const searchResult = await searchSecondBrain(userMessage, {
            limit: 5,
            type: "all",
            userId,
            useHybrid: true,
        });

        if (!searchResult.success || !searchResult.data) {
            return null;
        }

        const items = searchResult.data as Array<{
            id: string;
            type: string;
            name: string;
            snippet: string;
            score: number;
        }>;

        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }

        // Only include items with reasonable relevance
        const relevantItems = items.filter(item => item.score > 0.2);
        
        if (relevantItems.length === 0) {
            return null;
        }

        // Format context for the AI
        const contextLines = relevantItems.map(item => {
            const typeLabel = {
                projects: "Project",
                people: "Person",
                ideas: "Idea",
                admin: "Task",
            }[item.type] || item.type;
            
            return `- **${typeLabel}**: "${item.name}" — ${item.snippet || "(no details)"}`;
        });

        return contextLines.join("\n");
    } catch (error) {
        console.warn("[APEX] [Chat] getAutoContext error:", error);
        return null;
    }
}

// ===== Analytics Helper =====

async function getAnalyticsSummary(timeframe: string = "week", focus: string = "all"): Promise<{
    success: boolean;
    summary?: string;
    data?: Record<string, unknown>;
    error?: string;
}> {
    try {
        const days = timeframe === "today" ? 1 : timeframe === "week" ? 7 : 30;
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/detailed?days=${days}`);
        
        if (!response.ok) {
            return { success: false, error: "Failed to fetch analytics" };
        }
        
        const data = await response.json();
        if (!data.success) {
            return { success: false, error: data.error || "Unknown error" };
        }
        
        // Build a summary based on focus
        const parts: string[] = [];
        
        if (focus === "all" || focus === "activity") {
            parts.push(`**Activity (${timeframe}):**`);
            parts.push(`- ${data.activity.totalThisWeek} captures this week (${data.activity.averagePerDay}/day average)`);
            parts.push(`- ${data.activity.streakDays} day streak`);
            parts.push(`- Trend: ${data.activity.trend}`);
            if (data.activity.peakHours?.length > 0) {
                parts.push(`- Peak hours: ${data.activity.peakHours.map((h: number) => `${h}:00`).join(", ")}`);
            }
            parts.push(`- Voice: ${data.activity.voiceVsText.voice}, Text: ${data.activity.voiceVsText.text}`);
        }
        
        if (focus === "all" || focus === "productivity") {
            parts.push(`\n**Productivity:**`);
            parts.push(`- Task completion rate: ${data.productivity.completionRate}%`);
            parts.push(`- Tasks completed this week: ${data.productivity.tasksCompletedThisWeek}`);
            parts.push(`- Active projects: ${data.productivity.projectsWithActivity}`);
        }
        
        if (focus === "all" || focus === "health") {
            parts.push(`\n**System Health:**`);
            parts.push(`- Health score: ${data.health.healthScore}%`);
            parts.push(`- Classification accuracy: ${data.health.accuracy.toFixed(1)}%`);
            parts.push(`- Trend: ${data.health.trend}`);
            if (data.health.recommendations?.length > 0) {
                parts.push(`- Top recommendation: ${data.health.recommendations[0]}`);
            }
        }
        
        if (data.insights?.length > 0) {
            parts.push(`\n**Insights:**`);
            data.insights.slice(0, 3).forEach((insight: { title: string; description: string }) => {
                parts.push(`- ${insight.title}: ${insight.description}`);
            });
        }
        
        return {
            success: true,
            summary: parts.join("\n"),
            data: {
                activity: data.activity,
                productivity: data.productivity,
                health: data.health,
                insights: data.insights,
            },
        };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ===== System Prompt (Contract-Style) =====

const CHAT_SYSTEM_PROMPT = `# Role
You are the NeuroSecond Assistant, a helpful companion for a Second Brain app designed for neurodivergent users.

# Capabilities
You CAN:
1. Search the user's Second Brain (projects, people, ideas, tasks)
2. Find related information across categories
3. Answer questions about how to use the app
4. Provide context from recent captures
5. **Explain analytics and user patterns** - Use get_analytics_summary for questions about productivity, patterns, or how they're doing

You CANNOT (be upfront about this):
- Create new items (tell user: use the capture input at the top of the page)
- Delete items directly (I can't do this for you)
- Modify existing items

# Where to Delete Items (IMPORTANT - be accurate!)
- **Admin Tasks (pending tasks)**: On the home dashboard, look for the "Pending Tasks" card on the right side. Hover over any task to see the trash icon, or click the checkmark to complete it.
- **Inbox items**: Go to /inbox page. Each item has a trash icon on the right.
- **Projects**: Go to /projects page. Hover over any project card to see edit/delete icons.
- **People**: Go to /people page. Hover over any person card to see edit/delete icons.
- **Ideas**: Go to /ideas page. Hover over any idea card to see edit/delete icons.

When users ask to do something you can't do, tell them EXACTLY where in the app to do it.

# Tools Available
- \`search_second_brain\`: Semantic search across all data
- \`get_related_items\`: Find connections between items  
- \`get_recent_context\`: See recent captures
- \`get_analytics_summary\`: Get user's analytics, patterns, and insights

# Analytics Explanations
When users ask about their data, patterns, or how they're doing:
1. Use \`get_analytics_summary\` first to get current data
2. Explain the numbers in a supportive, non-judgmental way
3. Highlight positive patterns first
4. For concerns (low accuracy, declining trends), explain what it means and suggest gentle actions
5. Common questions:
   - "When am I most productive?" → Show peak hours from activity data
   - "How am I doing this week?" → Summarize activity and completion rate
   - "Why is my accuracy low?" → Explain corrections and how they help the system learn
   - "What should I focus on?" → Use insights and recommendations

# App Knowledge

## Features
- **Quick Capture**: Type/speak thoughts, AI classifies and files automatically
- **Voice Mode** (/voice): Hands-free capture with auto-start recording
- **Projects**: Track multi-step work with next actions
- **People**: Notes about relationships and follow-ups
- **Ideas**: Thoughts to explore later
- **Admin Tasks**: One-off to-dos with due dates
- **Inbox** (/inbox): Items needing manual review

## Navigation
- Home (/): Dashboard with capture input, pending tasks
- Voice (/voice): Voice-first capture
- Projects (/projects): All projects with edit/delete
- People (/people): All contacts with edit/delete
- Ideas (/ideas): All ideas with edit/delete
- Inbox (/inbox): Items to review with delete
- Analytics (/analytics): META self-improvement dashboard, accuracy metrics, optimization

## PWA Installation
- Safari: File > Add to Dock
- iOS: Share > Add to Home Screen

## Siri Integration
Create a Shortcut that opens /voice, then trigger with "Hey Siri"

# Response Guidelines

1. **Be Concise**: 2-3 sentences when possible
2. **Use Tools**: Always search before saying "I don't know"
3. **Be Supportive**: No shame, no guilt, celebrate small wins
4. **Chunk Information**: Max 3 items in any list
5. **Suggest Actions**: End with a helpful next step when appropriate

# Output Format
- Use bullet points for lists
- Bold key terms with **asterisks**
- Keep responses scannable
- Never overwhelm with information

# Anti-Patterns (Never Do)
- Long paragraphs
- "You should..." or "You need to..."
- Assuming they remember context
- More than 3 items in a list
- Technical jargon without explanation
`;

// ===== Tool Execution =====

async function executeTool(
    toolCall: ToolCall, 
    userId: string,
    trace: ReturnType<typeof createTraceContext>
): Promise<string> {
    const { name, arguments: argsString } = toolCall.function;
    const startTime = Date.now();
    
    try {
        const args = JSON.parse(argsString);
        trace.log("tool_call", { name, args });
        
        let result;
        
        switch (name) {
            case "search_second_brain":
                result = await searchSecondBrain(args.query, {
                    limit: parseInt(args.limit) || 5,
                    type: args.type || "all",
                    userId,
                });
                break;
                
            case "get_related_items":
                result = await getRelatedItems(args.itemId, args.itemType, {
                    limit: parseInt(args.limit) || 3,
                    userId,
                });
                break;
                
            case "get_recent_context":
                result = await getRecentContext({
                    limit: parseInt(args.limit) || 10,
                    type: args.type || "all",
                    userId,
                });
                break;
                
            case "get_analytics_summary":
                result = await getAnalyticsSummary(
                    args.timeframe || "week",
                    args.focus || "all"
                );
                break;
                
            default:
                result = { success: false, error: `Unknown tool: ${name}` };
        }
        
        const duration = Date.now() - startTime;
        trace.log("tool_result", { name, success: result.success }, duration);
        
        return JSON.stringify(result);
    } catch (error) {
        const duration = Date.now() - startTime;
        trace.log("error", { name, error: String(error) }, duration);
        return JSON.stringify({ success: false, error: String(error) });
    }
}

// ===== Main Handler =====

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit("chat");
    if (!rateLimitResult.success) {
        return rateLimitedResponse(rateLimitResult);
    }

    const trace = createTraceContext("chat-assistant");
    
    try {
        const body = await request.json();
        const { messages, userId = CONFIG.SINGLE_USER_ID } = body as { 
            messages: ChatMessage[]; 
            userId?: string;
        };
        
        // Input validation
        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: CONFIG.HTTP.BAD_REQUEST });
        }
        
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== "user") {
            return NextResponse.json({ error: "Last message must be from user" }, { status: CONFIG.HTTP.BAD_REQUEST });
        }
        
        // Validate user input
        const { valid, sanitized, error: validationError } = validateInput(lastMessage.content);
        if (!valid) {
            return NextResponse.json({ error: validationError }, { status: CONFIG.HTTP.BAD_REQUEST });
        }
        
        trace.log("input", { messageCount: messages.length, userMessage: sanitized.slice(0, 100) });
        
        // Prepare messages (truncate if needed)
        const truncatedMessages = truncateMessages(
            messages.map(m => ({ role: m.role, content: m.content })),
            5000 // Leave room for system prompt, tools, and auto-context
        );
        
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        const temporalGrounding = `\n# Temporal Grounding\n- **Today's Date**: ${dateString}\n- **Current Time**: ${timeString}\n`;

        // Auto-inject relevant context based on user's message
        // This reduces tool call overhead and gives the AI immediate context
        let autoContextSection = "";
        try {
            const autoContext = await getAutoContext(sanitized, userId);
            if (autoContext) {
                autoContextSection = `\n# Auto-Retrieved Context\nThese items from the user's Second Brain may be relevant to their question:\n\n${autoContext}\n\n(You can still use tools for more detailed searches if needed)\n`;
                console.info("[APEX] [Chat] Auto-context injected:", autoContext.split("\n").length, "items");
            }
        } catch (error) {
            console.warn("[APEX] [Chat] Auto-context injection failed:", error);
        }

        // Build conversation with system prompt + auto-context
        const conversationMessages: ChatMessage[] = [
            { role: "system", content: CHAT_SYSTEM_PROMPT + temporalGrounding + autoContextSection },
            ...truncatedMessages
                .filter(m => m.role !== "system")
                .map(m => ({ role: m.role as ChatMessage["role"], content: m.content })),
        ];
        
        // Agent loop with tool calling
        const MAX_ITERATIONS = 5;
        let iterations = 0;
        let finalResponse: string | null = null;
        
        while (iterations < MAX_ITERATIONS && !finalResponse) {
            iterations++;
            
            // Call GLM API with tools
            const response = await withRetry(async () => {
                const res = await fetch(`${CONFIG.AI.API_BASE_URL}chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${CONFIG.AI.API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: CONFIG.AI.FAST_MODEL,
                        messages: conversationMessages.map(m => ({
                            role: m.role,
                            content: m.content,
                            ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
                            ...(m.name && { name: m.name }),
                        })),
                        tools: CHAT_TOOL_DEFINITIONS,
                        tool_choice: "auto",
                        temperature: 0.7,
                        max_tokens: 1024,
                    }),
                });
                
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`API Error: ${res.status} - ${errorText}`);
                }
                
                return res.json();
            });
            
            const choice = response.choices?.[0];
            const message = choice?.message;
            
            if (!message) {
                throw new Error("No response from AI");
            }
            
            // Check for tool calls
            if (message.tool_calls && message.tool_calls.length > 0) {
                // Add assistant message with tool calls to conversation
                conversationMessages.push({
                    role: "assistant",
                    content: message.content || "",
                });
                
                // Execute each tool and add results
                for (const toolCall of message.tool_calls) {
                    const result = await executeTool(toolCall, userId, trace);
                    conversationMessages.push({
                        role: "tool",
                        content: result,
                        tool_call_id: toolCall.id,
                        name: toolCall.function.name,
                    });
                }
                
                // Continue loop to let AI process tool results
                continue;
            }
            
            // No tool calls - this is the final response
            finalResponse = message.content;
        }
        
        if (!finalResponse) {
            throw new Error("Failed to get response after max iterations");
        }
        
        trace.log("output", { response: finalResponse.slice(0, 200) });
        
        return NextResponse.json({
            message: {
                role: "assistant",
                content: finalResponse,
            },
        });
        
    } catch (error) {
        console.error("[APEX] [Chat] Error:", error);
        trace.log("error", { error: String(error) });
        
        const { userMessage } = classifyError(error);
        
        return NextResponse.json({
            message: {
                role: "assistant",
                content: userMessage,
            },
        });
    }
}
