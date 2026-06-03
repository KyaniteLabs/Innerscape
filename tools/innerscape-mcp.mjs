#!/usr/bin/env node
import readline from "node:readline";
import { moduleMap, planningPrompt, projectBrief } from "./innerscape-cli.mjs";

const protocolVersion = "2024-11-05";

const tools = {
  innerscape_project_brief: {
    description: "Return Innerscape project identity, modules, surfaces, and support guardrail.",
    inputSchema: { type: "object", properties: {} },
    handler: () => projectBrief(),
  },
  innerscape_module_map: {
    description: "List Innerscape modules and how agents should use each one.",
    inputSchema: { type: "object", properties: {} },
    handler: () => moduleMap(),
  },
  innerscape_planning_prompt: {
    description: "Create a bounded reflective planning prompt for an Innerscape workflow.",
    inputSchema: {
      type: "object",
      properties: {
        focus: { type: "string" },
        energy: { type: "string" },
        horizon: { type: "string" },
      },
    },
    handler: planningPrompt,
  },
};

export function handleToolCall(name, args = {}) {
  const tool = tools[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(args);
}

function toolList() {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

function response(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function error(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export function handleMessage(message) {
  const { id, method } = message;
  const params = message.params ?? {};
  if (id === undefined || id === null) return null;

  if (method === "initialize") {
    return response(id, {
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: { name: "innerscape", version: "0.1.0" },
    });
  }
  if (method === "tools/list") {
    return response(id, { tools: toolList() });
  }
  if (method === "tools/call") {
    try {
      const result = handleToolCall(params.name, params.arguments ?? {});
      return response(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
    } catch (err) {
      return error(id, -32602, err.message);
    }
  }
  return error(id, -32601, `Unsupported method: ${method}`);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  if (!line.trim()) return;
  let reply;
  try {
    reply = handleMessage(JSON.parse(line));
  } catch (err) {
    reply = error(null, -32700, `Invalid JSON: ${err.message}`);
  }
  if (reply) {
    process.stdout.write(`${JSON.stringify(reply)}\n`);
  }
});
