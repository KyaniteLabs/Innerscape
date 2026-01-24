/**
 * @fileoverview Unified types for Innerscape Suite
 * @module types
 */
export interface User {
    id: string;
    email: string;
    createdAt: Date;
}
export interface EmotionalContext {
    id: string;
    userId: string;
    energy: number;
    valence: number;
    dominantFeeling: string;
    bodySensation?: string | null;
    timestamp: Date;
}
export interface Capture {
    id: string;
    userId: string;
    content: string;
    type: 'task' | 'idea' | 'journal' | 'person';
    status: 'inbox' | 'processed' | 'archived';
    metadata?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Project {
    id: string;
    userId: string;
    name: string;
    status: 'active' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}
export interface Habit {
    id: string;
    userId: string;
    name: string;
    frequency: string;
    preferredEnergy?: number | null;
    streak: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string | null;
    targetDate?: Date | null;
    progress: number;
    status: 'active' | 'completed' | 'archived';
    category?: string | null;
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
    action: string;
    entityType: string;
    entityId: string;
    content?: string | null;
    metadata?: string | null;
    timestamp: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
