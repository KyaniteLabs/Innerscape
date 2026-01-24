/**
 * Zod Validation Schemas
 * 
 * Shared validation schemas for API input validation.
 * Using Zod v4 for type-safe runtime validation.
 */

import { z } from "zod";
import { ValidationError } from "./errors";

// ===== Common Schemas =====

/** ID validation - accepts UUIDs or other string IDs for flexibility */
export const idSchema = z.string().min(1, "ID is required").max(100, "ID too long");

/** Tags array - strings only, max 10 tags, max 50 chars each */
export const tagsSchema = z.array(
    z.string().max(50, "Tag too long (max 50 chars)")
).max(10, "Too many tags (max 10)").optional();

/** Date string - accepts ISO datetime OR just date (YYYY-MM-DD) */
export const isoDateSchema = z.string()
    .refine((val) => {
        // Accept ISO datetime (2026-01-30T00:00:00.000Z) or date only (2026-01-30)
        const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
        return isoRegex.test(val);
    }, { message: "Invalid date format" })
    .transform((val) => {
        // Convert date-only to ISO datetime
        if (val && !val.includes("T")) {
            return `${val}T00:00:00.000Z`;
        }
        return val;
    })
    .optional();

/** Name field - required, 1-200 chars */
export const nameSchema = z.string()
    .min(1, "Name is required")
    .max(200, "Name too long (max 200 chars)");

/** Notes field - optional, max 10000 chars */
export const notesSchema = z.string().max(10000, "Notes too long (max 10000 chars)").optional();

// ===== Projects =====

export const projectStatusSchema = z.enum(["active", "waiting", "blocked", "someday", "completed"]);

export const createProjectSchema = z.object({
    name: nameSchema,
    status: projectStatusSchema.optional().default("active"),
    nextAction: z.string().max(500, "Next action too long (max 500 chars)").optional(),
    notes: notesSchema,
    tags: tagsSchema,
    dueDate: isoDateSchema,
    startDate: isoDateSchema,
    energyLevel: z.number().int().min(1).max(5).optional(),
});

export const updateProjectSchema = z.object({
    id: idSchema.optional(), // Can come from query or body
    name: nameSchema.optional(),
    status: projectStatusSchema.optional(),
    nextAction: z.string().max(500).optional().nullable(),
    notes: notesSchema.nullable(),
    tags: tagsSchema,
    dueDate: isoDateSchema.nullable(),
    startDate: isoDateSchema.nullable(),
    energyLevel: z.number().int().min(1).max(5).optional().nullable(),
}).refine(data => Object.keys(data).some(k => k !== "id"), {
    message: "At least one field to update is required",
});

// ===== People =====

export const createPersonSchema = z.object({
    name: nameSchema,
    context: z.string().max(5000, "Context too long (max 5000 chars)").optional(),
    followUps: z.string().max(2000, "Follow-ups too long (max 2000 chars)").optional(),
    tags: tagsSchema,
    dueDate: isoDateSchema,
});

export const updatePersonSchema = z.object({
    id: idSchema.optional(),
    name: nameSchema.optional(),
    context: z.string().max(5000).optional().nullable(),
    followUps: z.string().max(2000).optional().nullable(),
    tags: tagsSchema,
    dueDate: isoDateSchema.nullable(),
}).refine(data => Object.keys(data).some(k => k !== "id"), {
    message: "At least one field to update is required",
});

// ===== Ideas =====

export const createIdeaSchema = z.object({
    name: nameSchema,
    oneLiner: z.string().max(280, "One-liner too long (max 280 chars)").optional(),
    notes: notesSchema,
    tags: tagsSchema,
    dueDate: isoDateSchema,
});

export const updateIdeaSchema = z.object({
    id: idSchema.optional(),
    name: nameSchema.optional(),
    oneLiner: z.string().max(280).optional().nullable(),
    notes: notesSchema.nullable(),
    tags: tagsSchema,
    dueDate: isoDateSchema.nullable(),
}).refine(data => Object.keys(data).some(k => k !== "id"), {
    message: "At least one field to update is required",
});

// ===== Admin Tasks =====

export const taskStatusSchema = z.enum(["todo", "done"]);

export const createTaskSchema = z.object({
    name: nameSchema,
    dueDate: isoDateSchema,
    status: taskStatusSchema.optional().default("todo"),
    notes: notesSchema,
});

export const updateTaskSchema = z.object({
    id: idSchema.optional(),
    name: nameSchema.optional(),
    dueDate: isoDateSchema.nullable(),
    status: taskStatusSchema.optional(),
    notes: notesSchema.nullable(),
}).refine(data => Object.keys(data).some(k => k !== "id"), {
    message: "At least one field to update is required",
});

// ===== Validation Helper =====

/**
 * Validates request body against a Zod schema.
 * Returns parsed data or throws a ValidationError.
 */
export function validateBody<T extends z.ZodSchema>(
    schema: T,
    body: unknown
): z.infer<T> {
    const result = schema.safeParse(body);
    
    if (!result.success) {
        // Zod v4 uses 'issues' instead of 'errors'
        const issues = result.error.issues || [];
        const errors = issues.map((e: { path: (string | number)[]; message: string }) => 
            e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message
        );
        throw new ValidationError(errors.join("; ") || "Validation failed");
    }
    
    return result.data;
}

// ===== Type Exports =====

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreatePerson = z.infer<typeof createPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;
export type CreateIdea = z.infer<typeof createIdeaSchema>;
export type UpdateIdea = z.infer<typeof updateIdeaSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
