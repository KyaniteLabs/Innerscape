import { CONFIG } from "./config";

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly status: number;
    public readonly details?: Record<string, unknown>;

    constructor(
        code: string,
        message: string,
        status = 500,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.status = status;
        this.details = details;
    }

    toJSON() {
        return {
            success: false,
            error: this.code,
            message: this.message,
            ...(this.details && { details: this.details }),
        };
    }
}

/**
 * Validation error - 400
 */
export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>) {
        super("VALIDATION_ERROR", message, CONFIG.HTTP.BAD_REQUEST, details);
        this.name = "ValidationError";
    }
}

/**
 * Not found error - 404
 */
export class NotFoundError extends AppError {
    constructor(resource: string, id?: string) {
        super(
            "NOT_FOUND",
            id ? `${resource} with id '${id}' not found` : `${resource} not found`,
            CONFIG.HTTP.NOT_FOUND
        );
        this.name = "NotFoundError";
    }
}

/**
 * Database error - 500
 */
export class DatabaseError extends AppError {
    constructor(message: string, details?: Record<string, unknown>) {
        super("DATABASE_ERROR", message, CONFIG.HTTP.INTERNAL_SERVER_ERROR, details);
        this.name = "DatabaseError";
    }
}

/**
 * External service error - 502
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, message: string) {
        super("EXTERNAL_SERVICE_ERROR", `${service}: ${message}`, CONFIG.HTTP.BAD_GATEWAY);
        this.name = "ExternalServiceError";
    }
}

/**
 * Safely parse JSON from a Response object
 * Returns parsed data or throws a user-friendly error
 */
export async function safeJsonParse<T = unknown>(response: Response): Promise<T> {
    const text = await response.text();
    
    try {
        return JSON.parse(text) as T;
    } catch {
        // Log the actual response for debugging
        console.error("[APEX] Failed to parse JSON response:", text.substring(0, 200));
        throw new ValidationError("Server returned invalid response");
    }
}

/**
 * Sanitize error message for client response
 * Removes sensitive internal details while preserving useful information
 */
export function sanitizeErrorMessage(error: unknown): string {
    if (error instanceof AppError) {
        return error.message; // Our errors are already safe
    }
    
    if (error instanceof Error) {
        // List of patterns that indicate internal details
        const sensitivePatterns = [
            /at\s+.+\(.+:\d+:\d+\)/i,  // Stack trace lines
            /node_modules/i,            // Internal paths
            /\/Users\//i,               // Absolute paths
            /\/home\//i,                // Linux paths
            /SQLITE_/i,                 // Database errors
            /ECONNREFUSED/i,            // Connection errors
            /ETIMEDOUT/i,               // Timeout internal
            /password/i,                // Credentials
            /api[_-]?key/i,             // API keys
            /secret/i,                  // Secrets
            /token/i,                   // Tokens (unless in "missing token" context)
        ];
        
        const message = error.message;
        for (const pattern of sensitivePatterns) {
            if (pattern.test(message)) {
                return "An error occurred. Please try again.";
            }
        }
        
        // If message is too long, it might contain debug info
        if (message.length > 200) {
            return "An error occurred. Please try again.";
        }
        
        return message;
    }
    
    return "An unexpected error occurred";
}

/**
 * Format error response for API
 * Returns an object with body and status that can be used with NextResponse.json()
 */
export function formatErrorResponse(error: unknown): {
    body: Record<string, unknown>;
    status: number;
} {
    if (error instanceof AppError) {
        return {
            body: error.toJSON(),
            status: error.status,
        };
    }

    // Handle Zod validation errors (has flatten method)
    if (error && typeof error === "object" && "flatten" in error && typeof (error as { flatten: unknown }).flatten === "function") {
        const zodError = error as { flatten: () => Record<string, unknown> };
        return {
            body: {
                success: false,
                error: "VALIDATION_ERROR",
                details: zodError.flatten(),
            },
            status: CONFIG.HTTP.BAD_REQUEST,
        };
    }

    // Unknown errors - don't leak internal details
    console.error("[APEX] Unhandled error:", error);
    return {
        body: {
            success: false,
            error: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
        status: CONFIG.HTTP.INTERNAL_SERVER_ERROR,
    };
}
