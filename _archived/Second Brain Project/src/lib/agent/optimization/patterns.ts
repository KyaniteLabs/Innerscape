/**
 * Pattern Detection for META Self-Improvement
 * 
 * Analyzes correction data to detect common misclassification patterns
 * and generates disambiguation examples for prompt enhancement.
 */

import { db } from "@/lib/db";
import { corrections, agentMemory } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// ===== Types =====

export interface LearnedPattern {
    trigger: string;         // Word or phrase that triggers confusion
    wrongCategory: string;   // Category it's often wrongly assigned to
    rightCategory: string;   // Correct category based on corrections
    confidence: number;      // How confident we are (based on sample size)
    examples: string[];      // Example texts
}

export interface DisambiguationExample {
    text: string;
    correctCategory: string;
    wrongCategory: string;
    reason: string;
}

// ===== Pattern Detection =====

/**
 * Detect patterns in correction history
 * Finds words/phrases that commonly lead to misclassification
 */
export async function detectPatterns(): Promise<LearnedPattern[]> {
    const userId = CONFIG.SINGLE_USER_ID;

    // Get recent corrections with text
    const recentCorrections = await db
        .select()
        .from(corrections)
        .where(eq(corrections.userId, userId))
        .orderBy(desc(corrections.correctedAt))
        .limit(100);

    if (recentCorrections.length < 5) {
        return []; // Not enough data
    }

    // Extract common words/phrases from corrections
    const patternCandidates = new Map<string, {
        wrongCat: string;
        rightCat: string;
        count: number;
        examples: string[];
    }>();

    // Keywords that often cause confusion
    const significantWords = [
        "meeting", "call", "email", "talk", "discuss", "chat",
        "project", "task", "todo", "deadline", "due",
        "idea", "thought", "maybe", "could", "should",
        "remember", "follow up", "check", "review",
        "buy", "get", "pick up", "schedule", "book",
    ];

    for (const corr of recentCorrections) {
        if (!corr.textSnippet) continue;
        
        const textLower = corr.textSnippet.toLowerCase();
        
        for (const word of significantWords) {
            if (textLower.includes(word)) {
                const key = `${word}:${corr.originalDestination}→${corr.correctedDestination}`;
                const existing = patternCandidates.get(key) || {
                    wrongCat: corr.originalDestination,
                    rightCat: corr.correctedDestination,
                    count: 0,
                    examples: [],
                };
                existing.count++;
                if (existing.examples.length < 3) {
                    existing.examples.push(corr.textSnippet);
                }
                patternCandidates.set(key, existing);
            }
        }
    }

    // Convert to patterns (only those with sufficient evidence)
    const patterns: LearnedPattern[] = [];
    
    for (const [key, data] of patternCandidates) {
        if (data.count >= 2) { // At least 2 occurrences
            const trigger = key.split(":")[0];
            patterns.push({
                trigger,
                wrongCategory: data.wrongCat,
                rightCategory: data.rightCat,
                confidence: Math.min(data.count / 5, 1), // 5+ = full confidence
                examples: data.examples,
            });
        }
    }

    // Sort by confidence/count
    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

/**
 * Generate disambiguation examples for the system prompt
 * Creates clear examples of how to handle confusing cases
 */
export async function generateDisambiguationExamples(): Promise<DisambiguationExample[]> {
    const patterns = await detectPatterns();
    const examples: DisambiguationExample[] = [];

    for (const pattern of patterns) {
        if (pattern.examples.length > 0) {
            // Generate reason based on categories
            const reason = generateDisambiguationReason(
                pattern.trigger,
                pattern.wrongCategory,
                pattern.rightCategory
            );

            examples.push({
                text: pattern.examples[0],
                correctCategory: pattern.rightCategory,
                wrongCategory: pattern.wrongCategory,
                reason,
            });
        }
    }

    return examples.slice(0, 5); // Top 5 most important
}

/**
 * Generate explanation for why a category is correct
 */
function generateDisambiguationReason(
    trigger: string,
    wrongCat: string,
    rightCat: string
): string {
    const reasons: Record<string, string> = {
        "people→admin": `Contains "${trigger}" but focus is on the person, not the task`,
        "admin→people": `Contains "${trigger}" but is about scheduling/tasks, not relationships`,
        "projects→ideas": `Contains "${trigger}" but is exploratory, not actionable yet`,
        "ideas→projects": `Contains "${trigger}" but has concrete next steps`,
        "admin→projects": `Contains "${trigger}" but is a larger initiative, not a quick task`,
        "projects→admin": `Contains "${trigger}" but is a simple action item`,
    };

    const key = `${wrongCat}→${rightCat}`;
    return reasons[key] || `"${trigger}" in this context belongs in ${rightCat}, not ${wrongCat}`;
}

/**
 * Get learned patterns formatted for system prompt injection
 */
export async function getLearnedPatternsForPrompt(): Promise<string> {
    const patterns = await detectPatterns();
    
    if (patterns.length === 0) {
        return ""; // No patterns learned yet
    }

    const lines = patterns.slice(0, 5).map(p => 
        `- "${p.trigger}" often means ${p.rightCategory} (not ${p.wrongCategory})`
    );

    return lines.join("\n");
}

/**
 * Get disambiguation examples formatted for system prompt
 */
export async function getDisambiguationExamplesForPrompt(): Promise<string> {
    const examples = await generateDisambiguationExamples();
    
    if (examples.length === 0) {
        return ""; // No examples yet
    }

    const lines = examples.map(e => 
        `- "${e.text.slice(0, 50)}..." → ${e.correctCategory} (not ${e.wrongCategory}): ${e.reason}`
    );

    return lines.join("\n");
}

/**
 * Get recent corrections as direct few-shot examples for classifier
 * This is the most direct form of learning - showing exact corrections
 */
export async function getRecentCorrectionsAsExamples(limit: number = 10): Promise<string> {
    const userId = CONFIG.SINGLE_USER_ID;

    const recentCorrections = await db
        .select()
        .from(corrections)
        .where(eq(corrections.userId, userId))
        .orderBy(desc(corrections.correctedAt))
        .limit(limit);

    if (recentCorrections.length === 0) {
        return "";
    }

    const examples = recentCorrections
        .filter(c => c.textSnippet && c.originalDestination !== c.correctedDestination)
        .slice(0, 5) // Top 5 most recent corrections
        .map(c => {
            const text = c.textSnippet!.length > 80 
                ? c.textSnippet!.slice(0, 77) + "..." 
                : c.textSnippet;
            return `Input: "${text}"
WRONG: ${c.originalDestination} ❌
CORRECT: ${c.correctedDestination} ✓
Remember: This type of input should be ${c.correctedDestination}, not ${c.originalDestination}.`;
        });

    if (examples.length === 0) {
        return "";
    }

    return `
## Recent User Corrections (IMPORTANT - learn from these!)

These are REAL corrections the user made. Apply these lessons:

${examples.join("\n\n")}

Use these corrections to improve your classification accuracy.`;
}

/**
 * Get correction statistics for analytics
 */
export async function getCorrectionStats(): Promise<{
    total: number;
    byCategory: Record<string, { from: number; to: number }>;
    accuracy: number;
}> {
    const userId = CONFIG.SINGLE_USER_ID;

    const allCorrections = await db
        .select()
        .from(corrections)
        .where(eq(corrections.userId, userId));

    const byCategory: Record<string, { from: number; to: number }> = {
        projects: { from: 0, to: 0 },
        people: { from: 0, to: 0 },
        ideas: { from: 0, to: 0 },
        admin: { from: 0, to: 0 },
    };

    for (const c of allCorrections) {
        if (c.originalDestination && byCategory[c.originalDestination]) {
            byCategory[c.originalDestination].from++;
        }
        if (c.correctedDestination && byCategory[c.correctedDestination]) {
            byCategory[c.correctedDestination].to++;
        }
    }

    // Estimate accuracy: 1 - (corrections / total classified)
    // This is approximate since we don't track total classifications
    const accuracy = allCorrections.length > 0 ? Math.max(0, 1 - (allCorrections.length / 100)) : 1;

    return {
        total: allCorrections.length,
        byCategory,
        accuracy,
    };
}

// ===== Memory Storage =====

/**
 * Save learned patterns to agent memory for persistence
 */
export async function saveLearnedPatterns(patterns: LearnedPattern[]): Promise<void> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = "learned_patterns";
    const value = JSON.stringify(patterns);

    // Upsert pattern
    const existing = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(agentMemory)
            .set({ value, updatedAt: new Date().toISOString() })
            .where(eq(agentMemory.id, existing[0].id));
    } else {
        await db.insert(agentMemory).values({
            userId,
            key,
            value,
        });
    }
}

/**
 * Load learned patterns from agent memory
 */
export async function loadLearnedPatterns(): Promise<LearnedPattern[]> {
    const userId = CONFIG.SINGLE_USER_ID;
    const key = "learned_patterns";

    const [entry] = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    if (!entry) {
        return [];
    }

    try {
        return JSON.parse(entry.value);
    } catch {
        return [];
    }
}
