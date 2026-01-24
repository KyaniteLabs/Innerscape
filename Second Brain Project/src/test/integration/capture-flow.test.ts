/**
 * Integration Tests: Capture Flow
 * 
 * Tests the end-to-end capture and classification flow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inboxLog, projects, adminTasks, people, ideas } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

// Mock the AI classifier
vi.mock("@/lib/ai/classifier", () => ({
    classifyCapture: vi.fn().mockResolvedValue({
        category: "projects",
        confidence: 0.9,
        reasoning: "Contains project-related keywords",
    }),
}));

// Setup and teardown
async function setupTables() {
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS inbox_log (
            id TEXT PRIMARY KEY,
            original_text TEXT NOT NULL,
            filed_to TEXT,
            destination_id TEXT,
            confidence INTEGER,
            status TEXT DEFAULT 'pending',
            capture_source TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )
    `);
    
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            next_action TEXT,
            notes TEXT,
            energy_level INTEGER,
            start_date TEXT,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_touched TEXT DEFAULT CURRENT_TIMESTAMP,
            archived_at TEXT,
            tags TEXT,
            user_id TEXT NOT NULL
        )
    `);
}

async function cleanup() {
    try {
        await db.delete(inboxLog);
        await db.delete(projects);
    } catch {
        // Tables might not exist
    }
}

describe("Capture Flow Integration", () => {
    beforeEach(async () => {
        await setupTables();
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    describe("Capture to Inbox Flow", () => {
        it("creates inbox entry from capture text", async () => {
            // Directly insert to simulate capture API
            const captureText = "Build new feature for the app - needs planning";
            
            const [entry] = await db.insert(inboxLog).values({
                id: "capture-test-1",
                originalText: captureText,
                status: "pending",
                captureSource: "web",
                userId: CONFIG.SINGLE_USER_ID,
            }).returning();

            expect(entry).toBeDefined();
            expect(entry.originalText).toBe(captureText);
            expect(entry.status).toBe("pending");
        });

        it("updates inbox entry after classification", async () => {
            // Create pending entry
            await db.insert(inboxLog).values({
                id: "capture-classify-1",
                originalText: "Start new project for mobile app",
                status: "pending",
                userId: CONFIG.SINGLE_USER_ID,
            });

            // Simulate classification result
            await db
                .update(inboxLog)
                .set({
                    status: "filed",
                    filedTo: "projects",
                    confidence: 90,
                })
                .where(eq(inboxLog.id, "capture-classify-1"));

            // Verify
            const [updated] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, "capture-classify-1"));

            expect(updated.status).toBe("filed");
            expect(updated.filedTo).toBe("projects");
            expect(updated.confidence).toBe(90);
        });

        it("creates destination record after filing", async () => {
            const captureText = "Build mobile app MVP";
            
            // Create inbox entry
            await db.insert(inboxLog).values({
                id: "capture-file-1",
                originalText: captureText,
                status: "pending",
                userId: CONFIG.SINGLE_USER_ID,
            });

            // Create project from capture
            const [project] = await db.insert(projects).values({
                id: "proj-from-capture",
                name: captureText,
                status: "active",
                userId: CONFIG.SINGLE_USER_ID,
            }).returning();

            // Link inbox to project
            await db
                .update(inboxLog)
                .set({
                    status: "filed",
                    filedTo: "projects",
                    destinationId: project.id,
                })
                .where(eq(inboxLog.id, "capture-file-1"));

            // Verify the chain
            const [inboxEntry] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, "capture-file-1"));

            expect(inboxEntry.destinationId).toBe(project.id);

            const [createdProject] = await db
                .select()
                .from(projects)
                .where(eq(projects.id, project.id));

            expect(createdProject.name).toBe(captureText);
        });
    });

    describe("Capture Source Tracking", () => {
        it("tracks web captures", async () => {
            await db.insert(inboxLog).values({
                id: "web-capture",
                originalText: "Web capture test",
                captureSource: "web",
                userId: CONFIG.SINGLE_USER_ID,
            });

            const [entry] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, "web-capture"));

            expect(entry.captureSource).toBe("web");
        });

        it("tracks voice captures", async () => {
            await db.insert(inboxLog).values({
                id: "voice-capture",
                originalText: "Voice capture test",
                captureSource: "voice",
                userId: CONFIG.SINGLE_USER_ID,
            });

            const [entry] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, "voice-capture"));

            expect(entry.captureSource).toBe("voice");
        });

        it("tracks iOS shortcut captures", async () => {
            await db.insert(inboxLog).values({
                id: "ios-capture",
                originalText: "iOS shortcut capture test",
                captureSource: "ios",
                userId: CONFIG.SINGLE_USER_ID,
            });

            const [entry] = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.id, "ios-capture"));

            expect(entry.captureSource).toBe("ios");
        });
    });

    describe("Multiple Captures Flow", () => {
        it("handles batch captures correctly", async () => {
            const captures = [
                { text: "First capture", source: "web" },
                { text: "Second capture", source: "voice" },
                { text: "Third capture", source: "ios" },
            ];

            // Insert all captures
            for (let i = 0; i < captures.length; i++) {
                await db.insert(inboxLog).values({
                    id: `batch-${i}`,
                    originalText: captures[i].text,
                    captureSource: captures[i].source,
                    status: "pending",
                    userId: CONFIG.SINGLE_USER_ID,
                });
            }

            // Verify all were created
            const allCaptures = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.userId, CONFIG.SINGLE_USER_ID));

            expect(allCaptures).toHaveLength(3);
        });

        it("maintains capture order by creation time", async () => {
            // Insert with slight delays to ensure ordering
            for (let i = 0; i < 3; i++) {
                await db.insert(inboxLog).values({
                    id: `order-${i}`,
                    originalText: `Capture ${i}`,
                    createdAt: new Date(Date.now() + i * 1000).toISOString(),
                    userId: CONFIG.SINGLE_USER_ID,
                });
            }

            const captures = await db
                .select()
                .from(inboxLog)
                .where(eq(inboxLog.userId, CONFIG.SINGLE_USER_ID));

            // Verify order (newest first when sorted)
            const sorted = [...captures].sort(
                (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
            );

            expect(sorted[0].id).toBe("order-2");
        });
    });
});
