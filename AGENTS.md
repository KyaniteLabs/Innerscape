# AGENTS.md instructions for KyaniteLabs/Innerscape

## Agent Surfaces

- CLI: `npm run cli -- brief`, `npm run cli -- modules`, or `npm run cli -- plan --focus "weekly review" --energy low`.
- MCP: `node tools/innerscape-mcp.mjs` starts the stdio MCP server. Launch it with `node`, not `npm run mcp`: npm's banner goes to stdout and breaks the JSON-RPC stream.
- Skill: `skills/innerscape/SKILL.md` is the public skill for reflective Innerscape workflows.

Keep these surfaces aligned with README, package scripts, and module boundaries when they change.

