/**
 * Session Memory Management
 * 
 * Handles conversation context persistence across agent interactions
 */

import { db } from "@/lib/db";
import { agentSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AgentMessage, AgentSession } from "../types";
import { CONFIG } from "@/lib/config";

// ===== Session Management =====

/**
 * Get or create a session for the user
 */
export async function getOrCreateSession(
    userId: string,
    sessionId?: string
): Promise<{ id: string; messages: AgentMessage[] }> {
    // If session ID provided, try to load it
    if (sessionId) {
        const existing = await db
            .select()
            .from(agentSessions)
            .where(eq(agentSessions.id, sessionId))
            .limit(1);

        if (existing[0]) {
            const messages = JSON.parse(existing[0].messages) as AgentMessage[];
            return { id: existing[0].id, messages };
        }
    }

    // Check for recent active session (within timeout)
    const timeoutMs = CONFIG.AGENT.SESSION_TIMEOUT_MS;
    const cutoff = new Date(Date.now() - timeoutMs).toISOString();

    const recent = await db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.userId, userId))
        .orderBy(desc(agentSessions.updatedAt))
        .limit(1);

    if (recent[0] && recent[0].updatedAt && recent[0].updatedAt > cutoff) {
        const messages = JSON.parse(recent[0].messages) as AgentMessage[];
        return { id: recent[0].id, messages };
    }

    // Create new session
    const id = crypto.randomUUID();
    await db.insert(agentSessions).values({
        id,
        userId,
        messages: "[]",
    });

    return { id, messages: [] };
}

/**
 * Add messages to a session
 */
export async function addToSession(
    sessionId: string,
    newMessages: AgentMessage[]
): Promise<void> {
    const session = await db
        .select({ messages: agentSessions.messages })
        .from(agentSessions)
        .where(eq(agentSessions.id, sessionId))
        .limit(1);

    if (!session[0]) {
        throw new Error(`Session not found: ${sessionId}`);
    }

    const messages = JSON.parse(session[0].messages) as AgentMessage[];
    messages.push(...newMessages);

    // Compact if too long
    const compacted = await compactIfNeeded(messages);

    await db
        .update(agentSessions)
        .set({
            messages: JSON.stringify(compacted.messages),
            summary: compacted.summary,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(agentSessions.id, sessionId));
}

/**
 * Clear a session
 */
export async function clearSession(sessionId: string): Promise<void> {
    await db
        .update(agentSessions)
        .set({
            messages: "[]",
            summary: null,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(agentSessions.id, sessionId));
}

// ===== Context Compaction =====

const MAX_MESSAGES = 20;

interface CompactionResult {
    messages: AgentMessage[];
    summary: string | null;
}

async function compactIfNeeded(messages: AgentMessage[]): Promise<CompactionResult> {
    if (messages.length <= MAX_MESSAGES) {
        return { messages, summary: null };
    }

    // Keep system messages and recent messages
    const systemMessages = messages.filter(m => m.role === "system");
    const recentMessages = messages.slice(-10);

    // Create summary of older messages
    const olderMessages = messages.slice(systemMessages.length, -10);
    const summary = createSummary(olderMessages);

    return {
        messages: [
            ...systemMessages,
            { role: "system", content: `Previous conversation summary:\n${summary}` },
            ...recentMessages,
        ],
        summary,
    };
}

function createSummary(messages: AgentMessage[]): string {
    // Simple summary: extract key points from user messages
    const userMessages = messages.filter(m => m.role === "user");
    const assistantResponses = messages.filter(m => m.role === "assistant");

    const captures = userMessages.map(m => m.content.substring(0, 50)).join("; ");
    
    return `User captured: ${captures}. Agent processed ${userMessages.length} items.`;
}
