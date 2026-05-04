import { drizzle } from "drizzle-orm/libsql";
import { createClient, Client } from "@libsql/client";
import * as schema from "./schema";
import { CONFIG } from "@/lib/config";

let client: Client | null = null;
let connectionAttempts = 0;

/**
 * Creates a database client with retry logic
 * Handles SQLite file corruption, lock issues, and connection failures
 */
async function createDbClient(): Promise<Client> {
    if (client) return client;

    while (connectionAttempts < CONFIG.DB.MAX_RETRIES) {
        try {
            connectionAttempts++;
            client = createClient({ url: CONFIG.DB.URL });
            
            // Test the connection with a simple query
            await client.execute("SELECT 1");
            
            console.info(`[APEX] [DB] Connected to database`);
            connectionAttempts = 0; // Reset on success
            return client;
        } catch (error) {
            const isLastAttempt = connectionAttempts >= CONFIG.DB.MAX_RETRIES;
            
            console.error(
                `[APEX] [DB] Connection attempt ${connectionAttempts}/${CONFIG.DB.MAX_RETRIES} failed:`,
                error instanceof Error ? error.message : "Unknown error"
            );

            if (isLastAttempt) {
                throw new DatabaseConnectionError(
                    `Failed to connect to database after ${CONFIG.DB.MAX_RETRIES} attempts`,
                    error
                );
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, CONFIG.DB.RETRY_DELAY_MS));
        }
    }

    throw new DatabaseConnectionError("Unexpected connection failure");
}

/**
 * Custom error class for database connection issues
 */
export class DatabaseConnectionError extends Error {
    public readonly cause: unknown;
    
    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = "DatabaseConnectionError";
        this.cause = cause;
    }
}

/**
 * Custom error class for database query issues
 */
export class DatabaseQueryError extends Error {
    public readonly cause: unknown;
    public readonly query: string;
    
    constructor(message: string, query: string, cause?: unknown) {
        super(message);
        this.name = "DatabaseQueryError";
        this.query = query;
        this.cause = cause;
    }
}

// Initialize client synchronously for drizzle (it handles async internally)
// For production, you'd want to call ensureConnection() before first use
const syncClient = createClient({ url: CONFIG.DB.URL });

export const db = drizzle(syncClient, { schema });

/**
 * Ensures database connection is healthy
 * Call this at app startup or before critical operations
 */
export async function ensureConnection(): Promise<void> {
    await createDbClient();
}

/**
 * Gracefully close database connection
 * Call this on app shutdown
 */
export function closeConnection(): void {
    if (client) {
        client.close();
        client = null;
        console.info("[APEX] [DB] Connection closed");
    }
}

/**
 * Health check for database
 */
export async function healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
        await syncClient.execute("SELECT 1");
        return { ok: true, latencyMs: Date.now() - start };
    } catch (error) {
        return {
            ok: false,
            latencyMs: Date.now() - start,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
