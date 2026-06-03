#!/usr/bin/env node
import { fileURLToPath } from "node:url";

export const modules = [
  {
    name: "Mind",
    scope: "journal entries, emotional check-ins, AI insights",
    agentUse: "Help organize reflection loops and turn vague inner state into inspectable notes.",
  },
  {
    name: "Flow",
    scope: "habits, goals, tasks, dopamine menu",
    agentUse: "Plan next actions while respecting energy, streaks, and motivation friction.",
  },
  {
    name: "Body",
    scope: "sleep logs, somatic mapping, space scanning",
    agentUse: "Connect physical state and environment signals to practical recovery steps.",
  },
  {
    name: "Hub",
    scope: "capture inbox, projects, knowledge base, daily and weekly reviews",
    agentUse: "Convert scattered inputs into projects, reviews, and reusable knowledge.",
  },
  {
    name: "Trade",
    scope: "listings, matches, credits, rules",
    agentUse: "Reason about fair exchanges and community contribution boundaries.",
  },
];

export function projectBrief() {
  return {
    name: "Innerscape",
    summary: "Personal growth OS for journaling, emotional check-ins, habits, goals, tasks, sleep, decluttering, and self-awareness workflows.",
    surfaces: {
      backend: "npm run dev:backend",
      mobile: "npm run dev:mobile",
      cli: "innerscape",
      mcp: "innerscape-mcp",
      skill: "skills/innerscape/SKILL.md",
    },
    modules,
    guardrail: "Keep support reflective and practical. Do not diagnose, moralize, or automate major life decisions without explicit human review.",
  };
}

export function moduleMap() {
  return { modules };
}

export function planningPrompt({ focus = "general", energy = "unknown", horizon = "today" } = {}) {
  return {
    focus,
    energy,
    horizon,
    prompt: [
      `Plan an Innerscape ${horizon} review for focus area: ${focus}.`,
      `Assume current energy is ${energy}.`,
      "Start with one grounding observation, then identify the smallest useful next move.",
      "Separate reflection, action, and follow-up capture so the user is not forced into a giant plan.",
    ],
  };
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

export function main(argv = process.argv.slice(2)) {
  const [command = "brief", ...rest] = argv;
  const getValue = (flag, fallback) => {
    const index = rest.indexOf(flag);
    return index >= 0 && rest[index + 1] ? rest[index + 1] : fallback;
  };

  if (command === "brief") {
    printJson(projectBrief());
    return;
  }
  if (command === "modules") {
    printJson(moduleMap());
    return;
  }
  if (command === "plan") {
    printJson(
      planningPrompt({
        focus: getValue("--focus", "general"),
        energy: getValue("--energy", "unknown"),
        horizon: getValue("--horizon", "today"),
      }),
    );
    return;
  }

  console.error("Usage: innerscape [brief|modules|plan --focus <area> --energy <level> --horizon <when>]");
  process.exitCode = 2;
}

const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (invokedPath) {
  main();
}
