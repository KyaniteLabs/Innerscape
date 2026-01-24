/**
 * Background Worker for NeuroSecond
 * 
 * Processes queued jobs for:
 * - Agent classification
 * - Legacy classification
 * - Embedding generation
 * 
 * Run with: npx tsx src/lib/worker.ts
 * Or add to package.json scripts
 */

import { Job } from "bullmq";
import { createWorker, JobData, ClassificationJobData, AgentJobData, EmbeddingJobData } from "./queue";
import { processInboxItem } from "./processor";
import { processWithAgent } from "./agent";
import { storeEmbedding } from "./agent/embeddings";
import { db } from "./db";
import { inboxLog } from "./db/schema";
import { eq } from "drizzle-orm";
import { CONFIG } from "./config";

/**
 * Main job processor
 */
async function processJob(job: Job<JobData>): Promise<void> {
    switch (job.name) {
        case "classify":
            await processClassificationJob(job.data as ClassificationJobData);
            break;
        case "agent-process":
            await processAgentJob(job.data as AgentJobData);
            break;
        case "generate-embeddings":
            await processEmbeddingJob(job.data as EmbeddingJobData);
            break;
        default:
            console.warn(`[APEX] [Worker] Unknown job type: ${job.name}`);
    }
}

/**
 * Process legacy classification job
 */
async function processClassificationJob(data: ClassificationJobData): Promise<void> {
    const { inboxId, text } = data;
    console.info(`[APEX] [Worker] Processing classification for ${inboxId}`);
    
    try {
        await processInboxItem(inboxId, text);
    } catch (error) {
        console.error(`[APEX] [Worker] Classification failed for ${inboxId}:`, error);
        throw error; // Re-throw to trigger retry
    }
}

/**
 * Process agent job
 */
async function processAgentJob(data: AgentJobData): Promise<void> {
    const { inboxId, text, options } = data;
    console.info(`[APEX] [Worker] Processing agent job for ${inboxId}`);
    
    try {
        const response = await processWithAgent(text, {
            model: options?.model || CONFIG.AI.DEFAULT_MODEL,
            includeContext: options?.includeContext ?? true,
        });

        // Update inbox with results
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
        } else {
            await db
                .update(inboxLog)
                .set({
                    status: "needs_review",
                })
                .where(eq(inboxLog.id, inboxId));
        }

        console.info(`[APEX] [Worker] Agent job completed for ${inboxId}: ${response.action}`);
    } catch (error) {
        console.error(`[APEX] [Worker] Agent job failed for ${inboxId}:`, error);
        
        // Mark as needs review on failure
        await db
            .update(inboxLog)
            .set({ status: "needs_review" })
            .where(eq(inboxLog.id, inboxId));
        
        throw error; // Re-throw to trigger retry
    }
}

/**
 * Process embedding generation job
 */
async function processEmbeddingJob(data: EmbeddingJobData): Promise<void> {
    const { itemType, itemId, textContent } = data;
    console.info(`[APEX] [Worker] Generating embedding for ${itemType}/${itemId}`);
    
    try {
        await storeEmbedding(itemType, itemId, textContent);
        console.info(`[APEX] [Worker] Embedding generated for ${itemType}/${itemId}`);
    } catch (error) {
        console.error(`[APEX] [Worker] Embedding generation failed for ${itemType}/${itemId}:`, error);
        // Don't re-throw - embedding failure shouldn't block the queue
    }
}

// ===== Main Entry Point =====

async function main() {
    console.info("[APEX] [Worker] Starting background worker...");
    
    const worker = createWorker(processJob);
    
    if (!worker) {
        console.error("[APEX] [Worker] Failed to create worker - is Redis configured?");
        process.exit(1);
    }

    // Graceful shutdown
    process.on("SIGTERM", async () => {
        console.info("[APEX] [Worker] Shutting down...");
        await worker.close();
        process.exit(0);
    });

    process.on("SIGINT", async () => {
        console.info("[APEX] [Worker] Shutting down...");
        await worker.close();
        process.exit(0);
    });

    console.info("[APEX] [Worker] Worker is running. Press Ctrl+C to stop.");
}

// Run if this is the main module
main().catch((error) => {
    console.error("[APEX] [Worker] Fatal error:", error);
    process.exit(1);
});
