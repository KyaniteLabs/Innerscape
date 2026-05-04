/**
 * Agent Tools Registry
 * 
 * Tools available to the NeuroSecond agent for:
 * - Semantic search across the second brain
 * - Database operations (CRUD)
 * - Context gathering
 * - Time/due date suggestions
 */

import type { AgentToolDefinition, ToolRegistry, ToolExecutor } from "../types";
import { searchSecondBrain } from "./search";
import { getRelatedItems, createItem, getRecentContext } from "./database";
import { suggestDueDate } from "./time";

// ===== Tool Definitions =====

export const AGENT_TOOL_DEFINITIONS: AgentToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "search_second_brain",
            description: "Search across all captured items (projects, people, ideas, tasks) using semantic similarity. Use this to find related information the user might have forgotten about.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Natural language search query describing what to find",
                    },
                    limit: {
                        type: "string",
                        description: "Maximum number of results (default: 5, max: 10)",
                    },
                    type: {
                        type: "string",
                        description: "Filter by item type",
                        enum: ["all", "projects", "people", "ideas", "admin"],
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_related_items",
            description: "Get items related to a specific person, project, or idea by tags, names, or content similarity.",
            parameters: {
                type: "object",
                properties: {
                    itemId: {
                        type: "string",
                        description: "ID of the item to find relations for",
                    },
                    itemType: {
                        type: "string",
                        description: "Type of the item",
                        enum: ["projects", "people", "ideas", "admin"],
                    },
                    limit: {
                        type: "string",
                        description: "Maximum number of related items (default: 3)",
                    },
                },
                required: ["itemId", "itemType"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_item",
            description: "Create a new item in the second brain. Use this to file captures after classification.",
            parameters: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        description: "Type of item to create",
                        enum: ["projects", "people", "ideas", "admin"],
                    },
                    data: {
                        type: "string",
                        description: "JSON string with item data matching the schema for the type",
                    },
                },
                required: ["type", "data"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_recent_context",
            description: "Get the user's recent captures to understand context and avoid duplicates.",
            parameters: {
                type: "object",
                properties: {
                    limit: {
                        type: "string",
                        description: "Number of recent items to retrieve (default: 10)",
                    },
                    type: {
                        type: "string",
                        description: "Filter by item type",
                        enum: ["all", "projects", "people", "ideas", "admin"],
                    },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "suggest_due_date",
            description: "Suggest an appropriate due date based on task type and urgency indicators.",
            parameters: {
                type: "object",
                properties: {
                    taskDescription: {
                        type: "string",
                        description: "Description of the task",
                    },
                    urgencyIndicator: {
                        type: "string",
                        description: "Urgency level detected from the capture",
                        enum: ["urgent", "soon", "normal", "someday"],
                    },
                },
                required: ["taskDescription"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "update_item",
            description: "Update an existing item in the second brain. Use this to merge new information into existing projects, people, or ideas instead of creating duplicates.",
            parameters: {
                type: "object",
                properties: {
                    itemId: {
                        type: "string",
                        description: "ID of the item to update",
                    },
                    itemType: {
                        type: "string",
                        description: "Type of item to update",
                        enum: ["projects", "people", "ideas", "admin"],
                    },
                    updates: {
                        type: "string",
                        description: "JSON string with fields to update or content to append",
                    },
                },
                required: ["itemId", "itemType", "updates"],
            },
        },
    },
];

// ===== Tool Registry Factory =====

/**
 * Create the tool registry with all executors bound to a user
 */
export function createToolRegistry(userId: string): ToolRegistry {
    return {
        search_second_brain: {
            definition: AGENT_TOOL_DEFINITIONS[0],
            execute: async (args) => searchSecondBrain(
                args.query as string,
                {
                    limit: parseInt(args.limit as string) || 5,
                    type: args.type as string || "all",
                    userId,
                }
            ),
        },
        get_related_items: {
            definition: AGENT_TOOL_DEFINITIONS[1],
            execute: async (args) => getRelatedItems(
                args.itemId as string,
                args.itemType as string,
                {
                    limit: parseInt(args.limit as string) || 3,
                    userId,
                }
            ),
        },
        create_item: {
            definition: AGENT_TOOL_DEFINITIONS[2],
            execute: async (args) => {
                const data = typeof args.data === "string" 
                    ? JSON.parse(args.data) 
                    : args.data;
                return createItem(
                    args.type as string,
                    data as Record<string, unknown>,
                    userId
                );
            },
        },
        get_recent_context: {
            definition: AGENT_TOOL_DEFINITIONS[3],
            execute: async (args) => getRecentContext({
                limit: parseInt(args.limit as string) || 10,
                type: args.type as string || "all",
                userId,
            }),
        },
        suggest_due_date: {
            definition: AGENT_TOOL_DEFINITIONS[4],
            execute: async (args) => suggestDueDate(
                args.taskDescription as string,
                args.urgencyIndicator as string || "normal"
            ),
        },
        update_item: {
            definition: AGENT_TOOL_DEFINITIONS[5],
            execute: async (args) => {
                const updates = typeof args.updates === "string" 
                    ? JSON.parse(args.updates) 
                    : args.updates;
                const { updateItem } = await import("./database");
                return updateItem(
                    args.itemId as string,
                    args.itemType as string,
                    updates as Record<string, unknown>,
                    userId
                );
            },
        },
    };
}

// Re-export individual tools for direct use
export { searchSecondBrain } from "./search";
export { getRelatedItems, createItem, getRecentContext, updateItem } from "./database";
export { suggestDueDate } from "./time";
