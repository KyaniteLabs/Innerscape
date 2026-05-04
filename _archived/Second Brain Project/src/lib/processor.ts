/**
 * Classification Processor
 * Handles the full classification pipeline: classify -> file -> update
 * 
 * Supports two modes:
 * 1. Legacy: Direct GLM classification -> file
 * 2. Agent: Multi-step reasoning with tools -> file
 */

import { classifyWithGLM, ClassificationResult } from "@/lib/ai/classifier";
import { processWithAgent } from "@/lib/agent";
import { fileClassifiedItem } from "@/lib/filing";
import { db } from "@/lib/db";
import { inboxLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { queueEmbeddingGeneration } from "@/lib/queue";

export interface ProcessingResult {
    success: boolean;
    inboxId: string;
    destination?: string;
    destinationId?: string;
    confidence?: number;
    summary?: string;
    firstStep?: string;
    error?: string;
}

/**
 * Process a single inbox item through classification and filing
 * Uses agent or legacy classifier based on config
 */
export async function processInboxItem(
    inboxId: string,
    text: string
): Promise<ProcessingResult> {
    console.info(`[APEX] [Processor] Processing inbox item: ${inboxId}`);

    const useAgent = CONFIG.AGENT.ENABLED && !CONFIG.AGENT.USE_LEGACY_CLASSIFIER;

    try {
        if (useAgent) {
            return await processWithAgentPipeline(inboxId, text);
        } else {
            return await processWithLegacyPipeline(inboxId, text);
        }
    } catch (error) {
        console.error(`[APEX] [Processor] Failed to process item ${inboxId}:`, error instanceof Error ? error.message : "Unknown error");
        
        return {
            success: false,
            inboxId,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Process using the new agent system
 */
async function processWithAgentPipeline(
    inboxId: string,
    text: string
): Promise<ProcessingResult> {
    console.info(`[APEX] [Processor] Using agent pipeline for ${inboxId}`);

    const response = await processWithAgent(text, {
        model: CONFIG.AI.DEFAULT_MODEL,
        includeContext: true,
    });

    // Agent handles filing internally via tools, so we just need to update inbox
    if (response.action === "filed" && response.destination) {
        await db
            .update(inboxLog)
            .set({
                filedTo: response.destination,
                destinationId: response.destinationId,
                confidence: response.confidence ? Math.round(response.confidence * 100) : null,
                status: "filed",
            })
            .where(eq(inboxLog.id, inboxId));

        // Queue embedding generation for the new item
        if (response.destinationId && response.destination !== "needs_review") {
            await queueEmbeddingGeneration(
                response.destination as "projects" | "people" | "ideas" | "admin",
                response.destinationId,
                text
            );
        }

        return {
            success: true,
            inboxId,
            destination: response.destination,
            destinationId: response.destinationId,
            confidence: response.confidence,
            summary: response.summary,
            firstStep: response.firstStep,
        };
    }

    // Agent couldn't file - mark as needs_review
    await db
        .update(inboxLog)
        .set({ status: "needs_review" })
        .where(eq(inboxLog.id, inboxId));

    return {
        success: true,
        inboxId,
        destination: "needs_review",
        summary: response.summary,
    };
}

/**
 * Process using the legacy classifier
 */
async function processWithLegacyPipeline(
    inboxId: string,
    text: string
): Promise<ProcessingResult> {
    console.info(`[APEX] [Processor] Using legacy pipeline for ${inboxId}`);

    // Step 1: Classify the text with AI
    const classification = await classifyWithGLM(text);
    console.info(`[APEX] [Processor] Item ${inboxId} classified as ${classification.destination} (confidence: ${classification.confidence})`);

    // Step 2: File to destination table and update inbox
    const filingResult = await fileClassifiedItem(inboxId, classification);

    if (!filingResult.success) {
        return {
            success: false,
            inboxId,
            error: filingResult.error,
        };
    }

    // Queue embedding generation
    if (filingResult.destinationId && filingResult.destination !== "needs_review") {
        await queueEmbeddingGeneration(
            filingResult.destination as "projects" | "people" | "ideas" | "admin",
            filingResult.destinationId,
            text
        );
    }

    return {
        success: true,
        inboxId,
        destination: filingResult.destination,
        destinationId: filingResult.destinationId,
        confidence: classification.confidence,
    };
}

/**
 * Process all pending inbox items
 * Useful for batch processing or catching up after downtime
 */
export async function processPendingItems(limit = 10): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    results: ProcessingResult[];
}> {
    // Get pending items
    const pendingItems = await db
        .select()
        .from(inboxLog)
        .where(eq(inboxLog.status, "pending"))
        .limit(limit);

    console.info(`[APEX] [Processor] Found ${pendingItems.length} pending items`);

    const results: ProcessingResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems) {
        const result = await processInboxItem(item.id, item.originalText);
        results.push(result);

        if (result.success) {
            succeeded++;
        } else {
            failed++;
        }
    }

    return {
        processed: pendingItems.length,
        succeeded,
        failed,
        results,
    };
}
