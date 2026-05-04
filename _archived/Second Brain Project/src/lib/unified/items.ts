import { db } from "@/lib/db";
import { projects, people, ideas, adminTasks } from "@/lib/db/schema";
import { desc, eq, and, isNull, or } from "drizzle-orm";

export type ItemType = "projects" | "people" | "ideas" | "admin";

export interface UnifiedItem {
    id: string;
    type: ItemType;
    name: string;
    content: string;
    metadata: Record<string, any>;
    temporal: {
        createdAt: string;
        lastTouched: string;
        dueDate: string | null;
        archivedAt: string | null;
    };
    tags: string[];
    userId: string;
}

export interface GetAllItemsOptions {
    userId: string;
    type?: ItemType;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: "createdAt" | "lastTouched" | "dueDate";
}

/**
 * Fetches and normalizes items from all core tables into a unified stream.
 */
export async function getAllItems(options: GetAllItemsOptions): Promise<UnifiedItem[]> {
    const { 
        userId, 
        type, 
        includeArchived = false, 
        limit = 50, 
        offset = 0,
        sortBy = "lastTouched" 
    } = options;

    const allItems: UnifiedItem[] = [];

    // Define helper to parse tags
    const parseTags = (tagsStr: string | null): string[] => {
        if (!tagsStr) return [];
        try {
            return JSON.parse(tagsStr);
        } catch {
            return [];
        }
    };

    // Helper to normalize data based on type
    const normalizeItem = (item: any, itemType: ItemType): UnifiedItem => {
        let content = "";
        const metadata: Record<string, any> = {};

        switch (itemType) {
            case "projects":
                content = item.notes || "";
                metadata.status = item.status;
                metadata.nextAction = item.nextAction;
                metadata.energyLevel = item.energyLevel;
                metadata.startDate = item.startDate;
                break;
            case "people":
                content = item.context || "";
                metadata.followUps = item.followUps;
                break;
            case "ideas":
                content = item.notes || "";
                metadata.oneLiner = item.oneLiner;
                break;
            case "admin":
                content = item.notes || "";
                metadata.status = item.status;
                break;
        }

        return {
            id: item.id,
            type: itemType,
            name: item.name,
            content: content.trim(),
            metadata,
            temporal: {
                createdAt: item.createdAt,
                lastTouched: item.lastTouched,
                dueDate: item.dueDate,
                archivedAt: item.archivedAt,
            },
            tags: parseTags(item.tags),
            userId: item.userId,
        };
    };

    // Fetch from tables based on filter
    const fetchPromises = [];

    if (!type || type === "projects") {
        fetchPromises.push(
            db.select().from(projects)
                .where(and(
                    eq(projects.userId, userId),
                    includeArchived ? undefined : isNull(projects.archivedAt)
                ))
                .then(rows => rows.map(r => normalizeItem(r, "projects")))
        );
    }

    if (!type || type === "people") {
        fetchPromises.push(
            db.select().from(people)
                .where(and(
                    eq(people.userId, userId),
                    includeArchived ? undefined : isNull(people.archivedAt)
                ))
                .then(rows => rows.map(r => normalizeItem(r, "people")))
        );
    }

    if (!type || type === "ideas") {
        fetchPromises.push(
            db.select().from(ideas)
                .where(and(
                    eq(ideas.userId, userId),
                    includeArchived ? undefined : isNull(ideas.archivedAt)
                ))
                .then(rows => rows.map(r => normalizeItem(r, "ideas")))
        );
    }

    if (!type || type === "admin") {
        fetchPromises.push(
            db.select().from(adminTasks)
                .where(and(
                    eq(adminTasks.userId, userId),
                    includeArchived ? undefined : isNull(adminTasks.archivedAt)
                ))
                .then(rows => rows.map(r => normalizeItem(r, "admin")))
        );
    }

    const results = await Promise.all(fetchPromises);
    const flattened = results.flat();

    // Sort the combined list
    flattened.sort((a, b) => {
        const valA = a.temporal[sortBy] || "";
        const valB = b.temporal[sortBy] || "";
        return valB.localeCompare(valA); // Descending (most recent first)
    });

    // Apply pagination
    return flattened.slice(offset, offset + limit);
}
