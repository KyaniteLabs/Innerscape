/**
 * Innerscape Suite — Canonical Type Definitions
 * Single source of truth for all data models
 */

// Re-export from individual files for backwards compatibility
export * from './brain';
export * from './feelings';
export * from './habits';
export * from './insights';
export * from './sync';

// Core types used across all apps
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

// Consolidate core domain types here to ensure single source of truth
export interface EmotionalContext {
  id: string;
  userId: string;
  energy: number; // 0-100
  valence: number; // -100 to 100
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
  progress: number; // 0-100
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
