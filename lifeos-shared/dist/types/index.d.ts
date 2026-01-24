/**
 * Innerscape Suite — Canonical Type Definitions
 * Single source of truth for all data models
 */
export * from './brain';
export * from './feelings';
export * from './habits';
export * from './insights';
export * from './sync';
export interface User {
    id: string;
    email: string;
    createdAt: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
export interface EmotionalContext {
    id: string;
    userId: string;
    energy: number;
    valence: number;
    dominantFeeling: string;
    bodySensation?: string;
    timestamp: Date;
}
export interface Capture {
    id: string;
    userId: string;
    content: string;
    type: 'task' | 'idea' | 'journal' | 'person';
    status: 'inbox' | 'processed' | 'archived';
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
export interface Habit {
    id: string;
    userId: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'custom';
    preferredEnergy?: number;
    streak: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface JournalEntry {
    id: string;
    userId: string;
    content: string;
    transcriptionSource: 'whisper' | 'deepgram' | 'typed';
    moodId?: string;
    tags?: string[];
    createdAt: Date;
}
export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    progress: number;
    status: 'active' | 'completed' | 'archived';
    category?: string;
    targetDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Insight {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: 'pattern' | 'correlation' | 'suggestion';
    createdAt: Date;
}
export interface Activity {
    id: string;
    userId: string;
    description: string;
    type: 'capture' | 'checkin' | 'habit' | 'journal' | 'goal';
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
