/**
 * Innerscape Suite — Shared Model Contracts
 * This file defines the single source of truth for all data models.
 * Compliance: APEX Engineering Rules § Single Source
 */

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

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
}

export interface Insight {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'pattern' | 'correlation' | 'suggestion';
  createdAt: Date;
}
