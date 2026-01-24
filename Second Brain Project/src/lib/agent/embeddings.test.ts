/**
 * Embeddings Tests
 * 
 * Tests for vector operations and embedding utilities.
 * Note: Tests for functions that require the ML model are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ===== Direct Math Tests =====
// Since cosineSimilarity is not exported, we test the algorithm directly
// to ensure correctness, then test the public API with mocks.

describe("Embeddings Math", () => {
    // Reference implementation for testing
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

    describe("cosineSimilarity", () => {
        it("returns 1 for identical normalized vectors", () => {
            const vec = new Float32Array([0.5, 0.5, 0.5, 0.5]);
            // Normalize
            const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
            const normalized = new Float32Array(vec.map(v => v / norm));
            
            const similarity = cosineSimilarity(normalized, normalized);
            expect(similarity).toBeCloseTo(1.0, 5);
        });

        it("returns -1 for opposite vectors", () => {
            const vec1 = new Float32Array([1, 0, 0]);
            const vec2 = new Float32Array([-1, 0, 0]);
            
            const similarity = cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(-1.0, 5);
        });

        it("returns 0 for orthogonal vectors", () => {
            const vec1 = new Float32Array([1, 0, 0]);
            const vec2 = new Float32Array([0, 1, 0]);
            
            const similarity = cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(0.0, 5);
        });

        it("returns 0 for zero vector", () => {
            const vec1 = new Float32Array([1, 2, 3]);
            const vec2 = new Float32Array([0, 0, 0]);
            
            const similarity = cosineSimilarity(vec1, vec2);
            expect(similarity).toBe(0);
        });

        it("throws for vectors of different lengths", () => {
            const vec1 = new Float32Array([1, 2, 3]);
            const vec2 = new Float32Array([1, 2]);
            
            expect(() => cosineSimilarity(vec1, vec2)).toThrow("Vectors must have same length");
        });

        it("handles large vectors efficiently", () => {
            const size = 384; // Typical embedding size
            const vec1 = new Float32Array(size);
            const vec2 = new Float32Array(size);
            
            for (let i = 0; i < size; i++) {
                vec1[i] = Math.random();
                vec2[i] = Math.random();
            }
            
            const start = performance.now();
            const similarity = cosineSimilarity(vec1, vec2);
            const end = performance.now();
            
            expect(similarity).toBeGreaterThanOrEqual(-1);
            expect(similarity).toBeLessThanOrEqual(1);
            expect(end - start).toBeLessThan(10); // Should be fast
        });

        it("returns expected similarity for known vectors", () => {
            // Known example: vec1 = [1,2,3], vec2 = [4,5,6]
            // dot = 1*4 + 2*5 + 3*6 = 32
            // |a| = sqrt(14), |b| = sqrt(77)
            // cos = 32 / sqrt(14*77) = 32 / sqrt(1078) ≈ 0.9746
            const vec1 = new Float32Array([1, 2, 3]);
            const vec2 = new Float32Array([4, 5, 6]);
            
            const similarity = cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(0.9746, 3);
        });

        it("is symmetric", () => {
            const vec1 = new Float32Array([1, 2, 3, 4, 5]);
            const vec2 = new Float32Array([5, 4, 3, 2, 1]);
            
            const sim1 = cosineSimilarity(vec1, vec2);
            const sim2 = cosineSimilarity(vec2, vec1);
            
            expect(sim1).toBeCloseTo(sim2, 10);
        });

        it("handles negative values correctly", () => {
            const vec1 = new Float32Array([-1, 2, -3]);
            const vec2 = new Float32Array([1, -2, 3]);
            
            const similarity = cosineSimilarity(vec1, vec2);
            // These are opposite direction, should be negative
            expect(similarity).toBeLessThan(0);
        });

        it("handles very small values without underflow", () => {
            const vec1 = new Float32Array([1e-10, 1e-10, 1e-10]);
            const vec2 = new Float32Array([1e-10, 1e-10, 1e-10]);
            
            const similarity = cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(1.0, 5);
        });
    });

    describe("Vector normalization", () => {
        // Helper to normalize
        function normalize(vec: Float32Array): Float32Array {
            const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
            return new Float32Array(vec.map(v => v / norm));
        }

        it("normalized vectors have unit length", () => {
            const vec = new Float32Array([3, 4, 0]); // 3-4-5 triangle
            const normalized = normalize(vec);
            
            const length = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
            expect(length).toBeCloseTo(1.0, 5);
        });

        it("preserves direction after normalization", () => {
            const vec = new Float32Array([2, 4, 6]);
            const normalized = normalize(vec);
            
            // Ratios should be preserved
            expect(normalized[1] / normalized[0]).toBeCloseTo(2, 5);
            expect(normalized[2] / normalized[0]).toBeCloseTo(3, 5);
        });

        it("normalized vectors have cosine similarity 1 with themselves", () => {
            const vec = new Float32Array([1, 2, 3, 4, 5]);
            const normalized = normalize(vec);
            
            const similarity = cosineSimilarity(normalized, normalized);
            expect(similarity).toBeCloseTo(1.0, 5);
        });
    });
});

describe("Embeddings Service", () => {
    // Mock the database and transformers
    beforeEach(() => {
        vi.mock("@/lib/db", () => ({
            db: {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
                    }),
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(undefined),
                    }),
                }),
                delete: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            },
        }));

        vi.mock("@xenova/transformers", () => ({
            pipeline: vi.fn().mockResolvedValue(
                vi.fn().mockResolvedValue({
                    data: new Float32Array(384).fill(0.1),
                })
            ),
            env: {
                allowLocalModels: true,
                useBrowserCache: true,
            },
        }));

        vi.mock("@/lib/config", () => ({
            CONFIG: {
                AGENT: {
                    EMBEDDING_MODEL: "test-model",
                    SIMILARITY_THRESHOLD: 0.5,
                    MAX_SEARCH_RESULTS: 5,
                },
                HTTP: {
                    BAD_REQUEST: 400,
                    NOT_FOUND: 404,
                    INTERNAL_SERVER_ERROR: 500,
                },
            },
        }));
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe("isEmbeddingsReady", () => {
        it("returns true when model loads successfully", async () => {
            const { isEmbeddingsReady } = await import("./embeddings");
            
            // This will try to load the model
            const ready = await isEmbeddingsReady();
            
            // With our mock, it should succeed
            expect(ready).toBe(true);
        });
    });

    describe("Buffer conversion", () => {
        it("converts Float32Array to Buffer correctly", () => {
            const vec = new Float32Array([1.0, 2.0, 3.0, 4.0]);
            const buffer = Buffer.from(vec.buffer);
            
            expect(buffer.length).toBe(16); // 4 floats * 4 bytes
            
            // Convert back
            const recovered = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
            expect(Array.from(recovered)).toEqual([1.0, 2.0, 3.0, 4.0]);
        });

        it("handles empty Float32Array", () => {
            const vec = new Float32Array([]);
            const buffer = Buffer.from(vec.buffer);
            
            expect(buffer.length).toBe(0);
        });

        it("preserves precision through conversion", () => {
            const vec = new Float32Array([0.123456789, -0.987654321, 1e-10, 1e10]);
            const buffer = Buffer.from(vec.buffer);
            const recovered = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
            
            for (let i = 0; i < vec.length; i++) {
                expect(recovered[i]).toBeCloseTo(vec[i], 5);
            }
        });
    });
});
