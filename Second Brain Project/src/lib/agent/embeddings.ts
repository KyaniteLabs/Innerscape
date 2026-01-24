/**
 * Embeddings Service
 * 
 * Generates and manages vector embeddings for semantic search
 * Uses @xenova/transformers for client-side embedding generation
 */

import { db } from "@/lib/db";
import { embeddings, projects, people, ideas, adminTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// ===== Types =====

interface EmbeddingModel {
    embed(text: string): Promise<Float32Array>;
}

// ===== Singleton Embedding Model =====

let model: EmbeddingModel | null = null;
let modelLoading: Promise<EmbeddingModel> | null = null;

/**
 * Get or initialize the embedding model
 * Uses lazy loading to avoid blocking startup
 */
async function getModel(): Promise<EmbeddingModel> {
    if (model) return model;

    if (modelLoading) {
        return modelLoading;
    }

    modelLoading = initializeModel();
    model = await modelLoading;
    modelLoading = null;

    return model;
}

async function initializeModel(): Promise<EmbeddingModel> {
    console.info("[APEX] [Embeddings] Loading embedding model...");

    try {
        const { pipeline, env } = await import("@xenova/transformers");
        
        // Configure for server-side usage
        env.allowLocalModels = false;
        env.useBrowserCache = false;

        const extractor = await pipeline(
            "feature-extraction",
            CONFIG.AGENT.EMBEDDING_MODEL,
            { quantized: true }
        );

        console.info("[APEX] [Embeddings] Model loaded successfully");

        return {
            embed: async (text: string): Promise<Float32Array> => {
                const output = await extractor(text, {
                    pooling: "mean",
                    normalize: true,
                });
                // Handle various output formats from transformers
                const data = output.data;
                if (data instanceof Float32Array) {
                    return data;
                }
                // Convert other array types to Float32Array
                return new Float32Array(Array.from(data as ArrayLike<number>));
            },
        };
    } catch (error) {
        console.error("[APEX] [Embeddings] Failed to load model:", error);
        throw error;
    }
}

// ===== Embedding Generation =====

/**
 * Generate embedding for a text
 */
export async function generateEmbedding(text: string): Promise<Float32Array> {
    const embeddingModel = await getModel();
    return embeddingModel.embed(text);
}

/**
 * Store an embedding in the database
 */
export async function storeEmbedding(
    itemType: "projects" | "people" | "ideas" | "admin",
    itemId: string,
    textContent: string
): Promise<void> {
    try {
        const vector = await generateEmbedding(textContent);
        
        // Convert Float32Array to Buffer for SQLite blob storage
        const buffer = Buffer.from(vector.buffer);

        // Check if embedding exists
        const existing = await db
            .select({ id: embeddings.id })
            .from(embeddings)
            .where(and(
                eq(embeddings.itemType, itemType),
                eq(embeddings.itemId, itemId)
            ))
            .limit(1);

        if (existing[0]) {
            // Update existing
            await db
                .update(embeddings)
                .set({
                    embedding: buffer,
                    textContent,
                    createdAt: new Date().toISOString(),
                })
                .where(eq(embeddings.id, existing[0].id));
        } else {
            // Insert new
            await db.insert(embeddings).values({
                itemType,
                itemId,
                embedding: buffer,
                textContent,
            });
        }

        console.info(`[APEX] [Embeddings] Stored embedding for ${itemType}/${itemId}`);
    } catch (error) {
        console.error("[APEX] [Embeddings] Failed to store embedding:", error);
        throw error;
    }
}

/**
 * Delete embeddings for an item
 */
export async function deleteEmbedding(
    itemType: "projects" | "people" | "ideas" | "admin",
    itemId: string
): Promise<void> {
    await db
        .delete(embeddings)
        .where(and(
            eq(embeddings.itemType, itemType),
            eq(embeddings.itemId, itemId)
        ));
}

// ===== Similarity Search =====

/**
 * Search for similar items using cosine similarity
 */
export async function searchSimilar(
    query: string,
    options: {
        limit?: number;
        type?: "all" | "projects" | "people" | "ideas" | "admin";
        threshold?: number;
    } = {}
): Promise<Array<{
    id: string;
    itemType: string;
    itemId: string;
    textContent: string;
    similarity: number;
}>> {
    const {
        limit = CONFIG.AGENT.MAX_SEARCH_RESULTS,
        type = "all",
        threshold = CONFIG.AGENT.SIMILARITY_THRESHOLD,
    } = options;

    try {
        // Generate query embedding
        const queryVector = await generateEmbedding(query);

        // Get all embeddings (filtered by type if specified)
        let dbQuery = db
            .select({
                id: embeddings.id,
                itemType: embeddings.itemType,
                itemId: embeddings.itemId,
                embedding: embeddings.embedding,
                textContent: embeddings.textContent,
            })
            .from(embeddings);

        if (type !== "all") {
            dbQuery = dbQuery.where(eq(embeddings.itemType, type)) as typeof dbQuery;
        }

        const allEmbeddings = await dbQuery;

        // Calculate similarities
        const results = allEmbeddings
            .map(item => {
                const storedVector = new Float32Array(item.embedding as ArrayBuffer);
                const similarity = cosineSimilarity(queryVector, storedVector);
                return {
                    id: item.id,
                    itemType: item.itemType,
                    itemId: item.itemId,
                    textContent: item.textContent,
                    similarity,
                };
            })
            .filter(item => item.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        return results;
    } catch (error) {
        console.error("[APEX] [Embeddings] Search failed:", error);
        return [];
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
        throw new Error("Vectors must have same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

// ===== Batch Operations =====

/**
 * Generate embeddings for all items that don't have them
 * Useful for initial setup or rebuilding index
 */
export async function generateMissingEmbeddings(userId: string): Promise<{
    processed: number;
    errors: number;
}> {
    let processed = 0;
    let errors = 0;

    // Get existing embedding item IDs
    const existingEmbeddings = await db
        .select({ itemId: embeddings.itemId, itemType: embeddings.itemType })
        .from(embeddings);

    const existingSet = new Set(
        existingEmbeddings.map(e => `${e.itemType}:${e.itemId}`)
    );

    // Process projects
    const allProjects = await db
        .select({ id: projects.id, name: projects.name, notes: projects.notes })
        .from(projects)
        .where(eq(projects.userId, userId));

    for (const p of allProjects) {
        if (existingSet.has(`projects:${p.id}`)) continue;
        try {
            const text = `${p.name} ${p.notes || ""}`.trim();
            await storeEmbedding("projects", p.id, text);
            processed++;
        } catch {
            errors++;
        }
    }

    // Process people
    const allPeople = await db
        .select({ id: people.id, name: people.name, context: people.context })
        .from(people)
        .where(eq(people.userId, userId));

    for (const p of allPeople) {
        if (existingSet.has(`people:${p.id}`)) continue;
        try {
            const text = `${p.name} ${p.context || ""}`.trim();
            await storeEmbedding("people", p.id, text);
            processed++;
        } catch {
            errors++;
        }
    }

    // Process ideas
    const allIdeas = await db
        .select({ id: ideas.id, name: ideas.name, oneLiner: ideas.oneLiner })
        .from(ideas)
        .where(eq(ideas.userId, userId));

    for (const i of allIdeas) {
        if (existingSet.has(`ideas:${i.id}`)) continue;
        try {
            const text = `${i.name} ${i.oneLiner || ""}`.trim();
            await storeEmbedding("ideas", i.id, text);
            processed++;
        } catch {
            errors++;
        }
    }

    // Process admin tasks
    const allAdmin = await db
        .select({ id: adminTasks.id, name: adminTasks.name, notes: adminTasks.notes })
        .from(adminTasks)
        .where(eq(adminTasks.userId, userId));

    for (const a of allAdmin) {
        if (existingSet.has(`admin:${a.id}`)) continue;
        try {
            const text = `${a.name} ${a.notes || ""}`.trim();
            await storeEmbedding("admin", a.id, text);
            processed++;
        } catch {
            errors++;
        }
    }

    console.info(`[APEX] [Embeddings] Generated ${processed} embeddings, ${errors} errors`);
    return { processed, errors };
}

/**
 * Check if embeddings are available (model loaded)
 */
export async function isEmbeddingsReady(): Promise<boolean> {
    try {
        await getModel();
        return true;
    } catch {
        return false;
    }
}
