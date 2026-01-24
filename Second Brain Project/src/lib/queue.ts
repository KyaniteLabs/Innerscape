import { Queue, Job, Worker, ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { CONFIG } from "@/lib/config";

/**
 * Custom error for queue operations
 */
export class QueueError extends Error {
    public readonly cause: unknown;
    public readonly jobData: unknown;

    constructor(message: string, jobData?: unknown, cause?: unknown) {
        super(message);
        this.name = "QueueError";
        this.jobData = jobData;
        this.cause = cause;
    }
}

// Job types for the queue
export type JobType = "classify" | "agent-process" | "generate-embeddings";

// Redis connection - only create if URL is configured
let redisConnection: IORedis | null = null;
let classificationQueue: Queue | null = null;

function getRedisConnection(): IORedis | null {
    if (!process.env.REDIS_URL) {
        return null;
    }

    if (!redisConnection) {
        redisConnection = new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > CONFIG.QUEUE.REDIS_MAX_RETRIES) {
                    console.error(`[APEX] [Queue] Redis connection failed after ${times} attempts`);
                    return null; // Stop retrying
                }
                return Math.min(times * CONFIG.QUEUE.REDIS_BASE_DELAY_MS, CONFIG.QUEUE.REDIS_MAX_DELAY_MS); // Exponential backoff
            },
        });

        redisConnection.on("error", (err) => {
            console.error("[APEX] [Queue] Redis connection error:", err.message);
        });

        redisConnection.on("connect", () => {
            console.info("[APEX] [Queue] Redis connected");
        });
    }

    return redisConnection;
}

function getQueue(): Queue | null {
    const redis = getRedisConnection();
    if (!redis) return null;

    if (!classificationQueue) {
        classificationQueue = new Queue("classification", {
            // IORedis is compatible with BullMQ's ConnectionOptions
            connection: redis as unknown as ConnectionOptions,
            defaultJobOptions: {
                attempts: CONFIG.QUEUE.JOB_MAX_ATTEMPTS,
                backoff: {
                    type: "exponential",
                    delay: CONFIG.QUEUE.JOB_BACKOFF_DELAY_MS,
                },
                removeOnComplete: CONFIG.QUEUE.COMPLETED_JOBS_TO_KEEP,
                removeOnFail: CONFIG.QUEUE.FAILED_JOBS_TO_KEEP,
            },
        });
    }

    return classificationQueue;
}

export interface ClassificationJobData {
    inboxId: string;
    text: string;
}

export interface AgentJobData {
    inboxId: string;
    text: string;
    options?: {
        includeContext?: boolean;
        model?: string;
    };
}

export interface EmbeddingJobData {
    itemType: "projects" | "people" | "ideas" | "admin";
    itemId: string;
    textContent: string;
}

export type JobData = ClassificationJobData | AgentJobData | EmbeddingJobData;

export interface QueueResult {
    queued: boolean;
    jobId?: string;
    reason?: string;
}

/**
 * Queue a classification job
 * Returns result object instead of throwing - caller decides how to handle
 */
export async function queueClassification(
    inboxId: string,
    text: string
): Promise<QueueResult> {
    const queue = getQueue();

    // If Redis is not configured, return gracefully (classification will happen synchronously)
    if (!queue) {
        console.warn("[APEX] [Queue] Redis not configured - classification will be synchronous");
        return { queued: false, reason: "REDIS_NOT_CONFIGURED" };
    }

    const jobData: ClassificationJobData = { inboxId, text };

    try {
        const job = await queue.add("classify", jobData, {
            jobId: `classify-${inboxId}`, // Prevent duplicate jobs for same inbox item
        });

        console.info(`[APEX] [Queue] Classification job queued: ${job.id} for inbox item ${inboxId}`);
        return { queued: true, jobId: job.id };
    } catch (error) {
        // Log the error but don't crash - return failure result
        console.error(`[APEX] [Queue] Failed to queue classification for inbox item ${inboxId}:`, error instanceof Error ? error.message : "Unknown error");
        
        // Throw a proper error so caller can handle it
        throw new QueueError(
            "Failed to queue classification job",
            { inboxId, textLength: text.length },
            error
        );
    }
}

/**
 * Get queue health status
 */
export async function queueHealth(): Promise<{
    available: boolean;
    waiting?: number;
    active?: number;
    failed?: number;
    error?: string;
}> {
    const queue = getQueue();

    if (!queue) {
        return { available: false, error: "Redis not configured" };
    }

    try {
        const [waiting, active, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getFailedCount(),
        ]);

        return { available: true, waiting, active, failed };
    } catch (error) {
        return {
            available: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Queue an agent processing job
 * Used for background agent processing of captures
 */
export async function queueAgentProcessing(
    inboxId: string,
    text: string,
    options?: AgentJobData["options"]
): Promise<QueueResult> {
    const queue = getQueue();

    if (!queue) {
        console.warn("[APEX] [Queue] Redis not configured - agent processing will be synchronous");
        return { queued: false, reason: "REDIS_NOT_CONFIGURED" };
    }

    const jobData: AgentJobData = { inboxId, text, options };

    try {
        const job = await queue.add("agent-process", jobData, {
            jobId: `agent-${inboxId}`,
            priority: 1, // Higher priority than embeddings
        });

        console.info(`[APEX] [Queue] Agent job queued: ${job.id} for inbox item ${inboxId}`);
        return { queued: true, jobId: job.id };
    } catch (error) {
        console.error(`[APEX] [Queue] Failed to queue agent job for item ${inboxId}:`, error instanceof Error ? error.message : "Unknown error");
        throw new QueueError("Failed to queue agent job", { inboxId }, error);
    }
}

/**
 * Queue an embedding generation job
 * Used for background embedding generation when items are created/updated
 */
export async function queueEmbeddingGeneration(
    itemType: EmbeddingJobData["itemType"],
    itemId: string,
    textContent: string
): Promise<QueueResult> {
    const queue = getQueue();

    if (!queue) {
        // Embeddings are optional - just log and continue
        console.info("[APEX] [Queue] Redis not configured - skipping embedding queue");
        return { queued: false, reason: "REDIS_NOT_CONFIGURED" };
    }

    const jobData: EmbeddingJobData = { itemType, itemId, textContent };

    try {
        const job = await queue.add("generate-embeddings", jobData, {
            jobId: `embed-${itemType}-${itemId}`,
            priority: 10, // Lower priority - can process later
            delay: 5000, // Delay 5s to batch with other operations
        });

        console.info(`[APEX] [Queue] Embedding job queued: ${job.id} for ${itemType}/${itemId}`);
        return { queued: true, jobId: job.id };
    } catch (error) {
        // Don't throw - embedding failure shouldn't block operations
        console.warn(`[APEX] [Queue] Failed to queue embedding for ${itemType}/${itemId}:`, error instanceof Error ? error.message : "Unknown error");
        return { queued: false, reason: "QUEUE_ERROR" };
    }
}

/**
 * Gracefully close queue connections
 */
export async function closeQueue(): Promise<void> {
    if (classificationQueue) {
        await classificationQueue.close();
        classificationQueue = null;
    }
    if (redisConnection) {
        redisConnection.disconnect();
        redisConnection = null;
    }
    console.info("[APEX] [Queue] Connections closed");
}

/**
 * Create a worker to process queue jobs
 * Call this to start background processing
 */
export function createWorker(
    processJob: (job: Job<JobData>) => Promise<void>
): Worker | null {
    const redis = getRedisConnection();
    if (!redis) {
        console.warn("[APEX] [Queue] Cannot create worker - Redis not configured");
        return null;
    }

    const worker = new Worker(
        "classification",
        async (job: Job<JobData>) => {
            console.info(`[APEX] [Worker] Processing job ${job.id} (${job.name})`);
            await processJob(job);
        },
        {
            connection: redis as unknown as ConnectionOptions,
            concurrency: 3, // Process up to 3 jobs concurrently
        }
    );

    worker.on("completed", (job) => {
        console.info(`[APEX] [Worker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[APEX] [Worker] Job ${job?.id} failed:`, err.message);
    });

    console.info("[APEX] [Worker] Background worker started");
    return worker;
}
