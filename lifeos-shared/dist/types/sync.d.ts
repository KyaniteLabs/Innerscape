/**
 * Sync Metadata Types
 *
 * Types for PowerSync synchronization.
 */
export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error';
export type ConflictResolution = 'client_wins' | 'server_wins' | 'manual';
export interface SyncMetadata {
    id: string;
    userId: string;
    tableName: string;
    lastSyncedAt?: string;
    syncToken?: string;
}
export interface SyncCheckpoint {
    checkpoint: string;
    tables: {
        [tableName: string]: {
            lastId: string;
            count: number;
        };
    };
}
export interface SyncChange {
    table: string;
    operation: 'insert' | 'update' | 'delete';
    id: string;
    data?: Record<string, unknown>;
    timestamp: string;
}
export interface SyncBatch {
    userId: string;
    checkpoint: string;
    changes: SyncChange[];
}
export interface SyncConflict {
    id: string;
    table: string;
    clientData: Record<string, unknown>;
    serverData: Record<string, unknown>;
    clientTimestamp: string;
    serverTimestamp: string;
}
export interface SyncResult {
    success: boolean;
    checkpoint: string;
    appliedChanges: number;
    conflicts?: SyncConflict[];
    errors?: string[];
}
export interface SyncState {
    status: SyncStatus;
    lastSyncedAt?: string;
    pendingChanges: number;
    error?: string;
}
