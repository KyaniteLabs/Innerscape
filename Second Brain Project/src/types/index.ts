/**
 * APEX Contract: Shared Type Definitions
 * Single Source of Truth for all data models
 */

export interface Insight {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'pattern' | 'correlation' | 'suggestion';
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  description: string;
  type: 'capture' | 'checkin' | 'habit' | 'journal' | 'goal';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  category?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionalContext {
  id: string;
  userId: string;
  energy: number;
  valence: number;
  dominantFeeling: string;
  bodySensation?: string;
  timestamp: string;
}

export interface Capture {
  id: string;
  userId: string;
  content: string;
  type: 'task' | 'idea' | 'journal' | 'person';
  status: 'inbox' | 'processed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'custom';
  preferredEnergy?: number;
  streak: number;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  transcriptionSource: 'whisper' | 'deepgram' | 'typed';
  moodId?: string;
  tags?: string[];
  createdAt: string;
}
