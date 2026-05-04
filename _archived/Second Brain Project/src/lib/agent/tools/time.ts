/**
 * Time Tools for Agent
 * 
 * Due date suggestions and time-related utilities
 * Designed to help combat time blindness (common in ADHD)
 */

import type { ToolExecutionResult } from "../types";

// ===== Urgency Indicators =====

const URGENCY_KEYWORDS = {
    urgent: [
        "urgent", "asap", "immediately", "right now", "emergency",
        "today", "tonight", "this morning", "this afternoon"
    ],
    soon: [
        "soon", "quickly", "this week", "tomorrow", "next few days",
        "by friday", "by monday", "end of week"
    ],
    normal: [
        "when you can", "sometime", "get around to", "would be nice",
        "next week", "this month"
    ],
    someday: [
        "someday", "eventually", "when possible", "no rush",
        "whenever", "at some point", "maybe"
    ],
};

// ===== Due Date Suggestion =====

export async function suggestDueDate(
    taskDescription: string,
    urgencyIndicator: string = "normal"
): Promise<ToolExecutionResult> {
    try {
        const today = new Date();
        let suggestedDate: Date;
        let reasoning: string;

        // Detect urgency from description if not explicitly provided
        const detectedUrgency = detectUrgency(taskDescription) || urgencyIndicator;

        switch (detectedUrgency) {
            case "urgent":
                suggestedDate = today;
                reasoning = "Urgent task - due today";
                break;

            case "soon":
                // 2-3 days from now
                suggestedDate = addDays(today, 2);
                reasoning = "Near-term task - 2 days buffer";
                break;

            case "normal":
                // 1 week from now (standard buffer for ADHD-friendly planning)
                suggestedDate = addDays(today, 7);
                reasoning = "Normal priority - 1 week buffer";
                break;

            case "someday":
                // No due date for someday/maybe items
                return {
                    success: true,
                    data: {
                        dueDate: null,
                        reasoning: "No deadline - this is a someday/maybe item",
                        urgencyDetected: detectedUrgency,
                    },
                };

            default:
                suggestedDate = addDays(today, 7);
                reasoning = "Default - 1 week buffer";
        }

        // Avoid weekends for work-related tasks
        if (looksLikeWorkTask(taskDescription)) {
            suggestedDate = skipWeekend(suggestedDate);
            reasoning += " (adjusted to skip weekend)";
        }

        return {
            success: true,
            data: {
                dueDate: formatDate(suggestedDate),
                reasoning,
                urgencyDetected: detectedUrgency,
                humanReadable: formatHumanReadable(suggestedDate),
            },
        };
    } catch (error) {
        console.error("[APEX] [Tools] suggestDueDate error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Date calculation error",
        };
    }
}

// ===== Helpers =====

function detectUrgency(text: string): string | null {
    const lowerText = text.toLowerCase();

    for (const [urgency, keywords] of Object.entries(URGENCY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return urgency;
            }
        }
    }

    return null;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function skipWeekend(date: Date): Date {
    const day = date.getDay();
    if (day === 0) {
        // Sunday -> Monday
        return addDays(date, 1);
    } else if (day === 6) {
        // Saturday -> Monday
        return addDays(date, 2);
    }
    return date;
}

function looksLikeWorkTask(text: string): boolean {
    const workKeywords = [
        "meeting", "call", "email", "report", "presentation",
        "deadline", "client", "project", "review", "submit",
        "office", "work", "boss", "team", "colleague"
    ];
    const lowerText = text.toLowerCase();
    return workKeywords.some(kw => lowerText.includes(kw));
}

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function formatHumanReadable(date: Date): string {
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[date.getDay()];
    }
    if (diffDays < 14) return "Next week";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
