---
name: innerscape
description: Use Innerscape for personal-growth OS workflows: journaling, emotional check-ins, habits, goals, tasks, sleep logs, decluttering, capture inboxes, reviews, and gentle self-awareness planning. Trigger when an agent needs to help with reflective organization without overstepping into diagnosis or life automation.
---

# Innerscape

Use this skill when a task involves Innerscape product work or when a user asks for structured self-awareness, journaling, review, habit, goal, or decluttering support using Innerscape's model.

## Start Here

- Read `../../README.md` for repo structure and modules.
- Use the CLI for quick module and planning context: `innerscape brief`, `innerscape modules`, or `innerscape plan`.
- Use the MCP server when an agent host should call project tools directly: `innerscape-mcp`.
- Backend work lives in `../../apps/backend`; mobile work lives in `../../apps/mobile`; shared types live in `../../packages/shared`.

## Workflow

1. Classify the task by module: Mind, Flow, Body, Hub, or Trade.
2. Keep output practical and small. Prefer one grounding observation, one next move, and one follow-up capture point.
3. Use Innerscape's API and shared types when implementing product behavior; do not invent a parallel data model.
4. For reflective workflows, separate observation, interpretation, and action so the user can disagree with the interpretation.
5. Keep personal-growth language gentle. Do not diagnose, moralize, or claim certainty about the user's inner state.

## CLI Examples

```bash
innerscape brief
innerscape modules
innerscape plan --focus "weekly review" --energy low --horizon today
```

## MCP Setup

```json
{
  "mcpServers": {
    "innerscape": {
      "command": "innerscape-mcp"
    }
  }
}
```

## Guardrails

- Do not provide medical or mental-health diagnosis.
- Do not automate major personal decisions.
- Ask for consent before turning sensitive reflection into durable tasks, records, or plans.
- Prefer reversible, small steps when the user is overwhelmed.
