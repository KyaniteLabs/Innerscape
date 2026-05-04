import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ===== Core Second Brain Tables =====

export const projects = sqliteTable("projects", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    status: text("status", { enum: ["active", "waiting", "blocked", "someday", "completed"] }).default("active"),
    nextAction: text("next_action"),
    notes: text("notes"),
    energyLevel: integer("energy_level"),
    startDate: text("start_date"), // Store ISO string
    dueDate: text("due_date"), // Store ISO string
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    lastTouched: text("last_touched").default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    tags: text("tags"), // SQLite doesn't have native arrays, store as stringified JSON
    userId: text("user_id").notNull(),
});

export const people = sqliteTable("people", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    context: text("context"),
    followUps: text("follow_ups"),
    dueDate: text("due_date"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    lastTouched: text("last_touched").default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    tags: text("tags"),
    userId: text("user_id").notNull(),
});

export const ideas = sqliteTable("ideas", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    oneLiner: text("one_liner"),
    notes: text("notes"),
    dueDate: text("due_date"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    lastTouched: text("last_touched").default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    tags: text("tags"),
    userId: text("user_id").notNull(),
});

export const adminTasks = sqliteTable("admin_tasks", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    dueDate: text("due_date"),
    status: text("status").default("todo"), // todo, done
    notes: text("notes"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    lastTouched: text("last_touched").default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    userId: text("user_id").notNull(),
});

export const inboxLog = sqliteTable("inbox_log", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    originalText: text("original_text").notNull(),
    filedTo: text("filed_to", { enum: ["people", "projects", "ideas", "admin", "needs_review"] }),
    destinationId: text("destination_id"),
    confidence: integer("confidence"), // SQLite prefers integer for scores or real
    status: text("status", { enum: ["pending", "filed", "needs_review", "fixed"] }).default("pending"),
    captureSource: text("capture_source"), // slack, voice, web, etc.
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    userId: text("user_id").notNull(),
});

// ===== Agent Tables =====

/**
 * Vector embeddings for semantic search
 * Stores embeddings for all items to enable similarity-based retrieval
 */
export const embeddings = sqliteTable("embeddings", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    itemType: text("item_type", { enum: ["projects", "people", "ideas", "admin"] }).notNull(),
    itemId: text("item_id").notNull(),
    embedding: blob("embedding").notNull(), // Float32Array stored as blob
    textContent: text("text_content").notNull(), // Original text for display
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Agent memory for user preferences and learned patterns
 * Key-value store for persistent agent context
 */
export const agentMemory = sqliteTable("agent_memory", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    key: text("key").notNull(), // e.g., 'preferred_project_format', 'common_tags'
    value: text("value").notNull(), // JSON stringified value
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Agent conversation sessions
 * Stores message history for context persistence across interactions
 */
export const agentSessions = sqliteTable("agent_sessions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    messages: text("messages").notNull(), // JSON array of messages
    summary: text("summary"), // Compacted summary when context is long
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ===== META Self-Improvement Tables =====

/**
 * Corrections tracking for self-improvement loop
 * Records when users correct agent classifications to learn from mistakes
 */
export const corrections = sqliteTable("corrections", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    inboxId: text("inbox_id").notNull(),
    originalDestination: text("original_destination").notNull(),
    correctedDestination: text("corrected_destination").notNull(),
    originalConfidence: integer("original_confidence"),
    textSnippet: text("text_snippet"), // First 200 chars for pattern analysis
    correctedAt: text("corrected_at").default(sql`CURRENT_TIMESTAMP`),
    userId: text("user_id").notNull(),
});

/**
 * Optimization run history
 * Tracks when optimization cycles run and what changes were made
 */
export const optimizationRuns = sqliteTable("optimization_runs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accuracyBefore: integer("accuracy_before"), // Percentage 0-100
    accuracyAfter: integer("accuracy_after"),
    changes: text("changes").notNull(), // JSON array of change descriptions
    metrics: text("metrics").notNull(), // JSON snapshot of metrics at time of run
    runAt: text("run_at").default(sql`CURRENT_TIMESTAMP`),
    userId: text("user_id").notNull(),
});

// ===== Type Exports for TypeScript =====

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

export type AdminTask = typeof adminTasks.$inferSelect;
export type NewAdminTask = typeof adminTasks.$inferInsert;

export type InboxLogEntry = typeof inboxLog.$inferSelect;
export type NewInboxLogEntry = typeof inboxLog.$inferInsert;

export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;

export type AgentMemoryEntry = typeof agentMemory.$inferSelect;
export type NewAgentMemoryEntry = typeof agentMemory.$inferInsert;

export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;

export type Correction = typeof corrections.$inferSelect;
export type NewCorrection = typeof corrections.$inferInsert;

export type OptimizationRun = typeof optimizationRuns.$inferSelect;
export type NewOptimizationRun = typeof optimizationRuns.$inferInsert;
