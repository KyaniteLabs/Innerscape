/**
 * User Preferences Memory
 * 
 * Persistent storage for learned user preferences and patterns
 */

import { db } from "@/lib/db";
import { agentMemory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserPreferences } from "../types";

// ===== Preference Keys =====

const PREF_KEYS = {
    PROJECT_FORMAT: "preferred_project_format",
    DEFAULT_TAGS: "default_tags",
    WORK_HOURS: "typical_work_hours",
    DUE_DATE_BUFFER: "preferred_due_date_buffer",
    COMMON_PEOPLE: "common_people",
    COMMON_PROJECTS: "common_projects",
} as const;

// ===== Get/Set Preferences =====

/**
 * Get all preferences for a user
 */
export async function getPreferences(userId: string): Promise<UserPreferences> {
    const entries = await db
        .select({ key: agentMemory.key, value: agentMemory.value })
        .from(agentMemory)
        .where(eq(agentMemory.userId, userId));

    const prefs: UserPreferences = {};

    for (const entry of entries) {
        try {
            const value = JSON.parse(entry.value);
            
            switch (entry.key) {
                case PREF_KEYS.PROJECT_FORMAT:
                    prefs.preferredProjectFormat = value;
                    break;
                case PREF_KEYS.DEFAULT_TAGS:
                    prefs.defaultTags = value;
                    break;
                case PREF_KEYS.WORK_HOURS:
                    prefs.typicalWorkHours = value;
                    break;
                case PREF_KEYS.DUE_DATE_BUFFER:
                    prefs.preferredDueDateBuffer = value;
                    break;
            }
        } catch {
            // Ignore parse errors
        }
    }

    return prefs;
}

/**
 * Set a preference value
 */
export async function setPreference(
    userId: string,
    key: string,
    value: unknown
): Promise<void> {
    const jsonValue = JSON.stringify(value);
    const now = new Date().toISOString();

    // Upsert using conflict handling
    const existing = await db
        .select({ id: agentMemory.id })
        .from(agentMemory)
        .where(and(eq(agentMemory.userId, userId), eq(agentMemory.key, key)))
        .limit(1);

    if (existing[0]) {
        await db
            .update(agentMemory)
            .set({ value: jsonValue, updatedAt: now })
            .where(eq(agentMemory.id, existing[0].id));
    } else {
        await db.insert(agentMemory).values({
            userId,
            key,
            value: jsonValue,
        });
    }
}

/**
 * Get a single preference value
 */
export async function getPreference<T>(
    userId: string,
    key: string,
    defaultValue?: T
): Promise<T | undefined> {
    const entry = await db
        .select({ value: agentMemory.value })
        .from(agentMemory)
        .where(and(eq(agentMemory.userId, userId), eq(agentMemory.key, key)))
        .limit(1);

    if (!entry[0]) {
        return defaultValue;
    }

    try {
        return JSON.parse(entry[0].value) as T;
    } catch {
        return defaultValue;
    }
}

// ===== Learning from User Behavior =====

/**
 * Learn from a user correction
 * Updates preferences based on how user modifies agent classifications
 */
export async function learnFromCorrection(
    userId: string,
    correction: {
        originalDestination: string;
        correctedDestination: string;
        originalData: Record<string, unknown>;
        correctedData: Record<string, unknown>;
    }
): Promise<void> {
    // Track correction patterns (could be used for model fine-tuning signals)
    console.info(
        `[APEX] [Memory] Correction: ${correction.originalDestination} → ${correction.correctedDestination}`
    );

    // If user consistently uses certain tags, learn them
    const correctedTags = correction.correctedData.tags as string[] | undefined;
    if (correctedTags && correctedTags.length > 0) {
        const currentDefault = await getPreference<string[]>(userId, PREF_KEYS.DEFAULT_TAGS, []);
        const merged = [...new Set([...(currentDefault || []), ...correctedTags])].slice(0, 10);
        await setPreference(userId, PREF_KEYS.DEFAULT_TAGS, merged);
    }
}

/**
 * Track commonly referenced people
 */
export async function trackPerson(userId: string, personName: string): Promise<void> {
    const current = await getPreference<Record<string, number>>(
        userId,
        PREF_KEYS.COMMON_PEOPLE,
        {}
    );

    const updated = { ...current };
    updated[personName] = (updated[personName] || 0) + 1;

    // Keep only top 20
    const sorted = Object.entries(updated)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    
    await setPreference(userId, PREF_KEYS.COMMON_PEOPLE, Object.fromEntries(sorted));
}

/**
 * Get common people for autocomplete/suggestions
 */
export async function getCommonPeople(userId: string): Promise<string[]> {
    const common = await getPreference<Record<string, number>>(
        userId,
        PREF_KEYS.COMMON_PEOPLE,
        {}
    );

    return Object.entries(common || {})
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 10);
}
