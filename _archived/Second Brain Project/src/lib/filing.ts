/**
 * Filing Logic - Creates records in destination tables based on classification
 */

import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks, inboxLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ClassificationResult } from "@/lib/ai/classifier";
import { CONFIG } from "@/lib/config";

export interface FilingResult {
    success: boolean;
    destinationId?: string;
    destination?: string;
    error?: string;
}

/**
 * File a classified item to its destination table
 */
export async function fileClassifiedItem(
    inboxId: string,
    classification: ClassificationResult
): Promise<FilingResult> {
    const { destination, confidence, data } = classification;

    try {
        return await db.transaction(async (tx) => {
            let destinationId: string | undefined;

            switch (destination) {
                case "projects":
                    destinationId = await fileToProjects(tx, data);
                    break;
                case "people":
                    destinationId = await fileToPeople(tx, data);
                    break;
                case "ideas":
                    destinationId = await fileToIdeas(tx, data);
                    break;
                case "admin":
                    destinationId = await fileToAdmin(tx, data);
                    break;
                case "needs_review":
                    // Don't create a destination record, just update inbox status
                    break;
                default:
                    console.warn(`[APEX] [Filing] Unknown destination: ${destination}`);
            }

            // Update the inbox log with classification results
            await tx.update(inboxLog)
                .set({
                    filedTo: destination,
                    destinationId: destinationId ?? null,
                    confidence: Math.round(confidence * 100), // Store as integer 0-100
                    status: destination === "needs_review" ? "needs_review" : "filed",
                })
                .where(eq(inboxLog.id, inboxId));

            console.info(`[APEX] [Filing] Item ${inboxId} filed to ${destination}${destinationId ? ` (${destinationId})` : ""}`);

            return {
                success: true,
                destinationId,
                destination,
            };
        });
    } catch (error) {
        console.error(`[APEX] [Filing] Failed to file item ${inboxId}:`, error instanceof Error ? error.message : "Unknown error");
        
        // Mark as needs_review on error (outside the failed transaction)
        try {
            await db.update(inboxLog)
                .set({
                    status: "needs_review",
                    filedTo: "needs_review",
                })
                .where(eq(inboxLog.id, inboxId));
        } catch (updateError) {
            console.error(`[APEX] [Filing] Failed to update inbox status for ${inboxId}:`, updateError instanceof Error ? updateError.message : "Unknown error");
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Create a project record
 */
async function fileToProjects(tx: any, data: ClassificationResult["data"]): Promise<string> {
    const [record] = await tx.insert(projects).values({
        name: data.name || "Untitled Project",
        status: (data.status as "active" | "waiting" | "blocked" | "someday" | "completed") || "active",
        nextAction: data.next_action,
        notes: data.notes || data.original_text,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        userId: CONFIG.SINGLE_USER_ID,
    }).returning();

    return record.id;
}

/**
 * Create a people record
 */
async function fileToPeople(tx: any, data: ClassificationResult["data"]): Promise<string> {
    const [record] = await tx.insert(people).values({
        name: data.name || "Unknown Person",
        context: data.context || data.original_text,
        followUps: data.follow_ups,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        userId: CONFIG.SINGLE_USER_ID,
    }).returning();

    return record.id;
}

/**
 * Create an idea record
 */
async function fileToIdeas(tx: any, data: ClassificationResult["data"]): Promise<string> {
    const [record] = await tx.insert(ideas).values({
        name: data.name || "Untitled Idea",
        oneLiner: data.one_liner,
        notes: data.notes || data.original_text,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        userId: CONFIG.SINGLE_USER_ID,
    }).returning();

    return record.id;
}

/**
 * Create an admin task record
 */
async function fileToAdmin(tx: any, data: ClassificationResult["data"]): Promise<string> {
    const [record] = await tx.insert(adminTasks).values({
        name: data.name || "Untitled Task",
        dueDate: data.due_date,
        notes: data.notes || data.original_text,
        status: "todo",
        userId: CONFIG.SINGLE_USER_ID,
    }).returning();

    return record.id;
}
