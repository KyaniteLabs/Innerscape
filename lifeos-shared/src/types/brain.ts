/**
 * Second Brain Types
 * 
 * Types for projects, people, ideas, and admin tasks.
 * These mirror the Second Brain (Next.js) data models.
 */

export type ProjectStatus = 'active' | 'waiting' | 'blocked' | 'someday' | 'completed';
export type TaskStatus = 'todo' | 'done';
export type InboxStatus = 'pending' | 'filed' | 'needs_review' | 'fixed';
export type CaptureSource = 'web' | 'mobile' | 'voice' | 'webhook' | 'email';
export type FiledTo = 'projects' | 'people' | 'ideas' | 'admin_tasks';

export interface Project {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  nextAction?: string;
  notes?: string;
  energyLevel?: string;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface Person {
  id: string;
  userId: string;
  name: string;
  context?: string;
  followUps?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface Idea {
  id: string;
  userId: string;
  name: string;
  oneLiner?: string;
  notes?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface AdminTask {
  id: string;
  userId: string;
  name: string;
  dueDate?: string;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface InboxItem {
  id: string;
  userId: string;
  originalText: string;
  filedTo?: FiledTo;
  destinationId?: string;
  confidence?: number;
  status: InboxStatus;
  captureSource: CaptureSource;
  createdAt: string;
  updatedAt?: string;
}

export interface Capture {
  text: string;
  source: CaptureSource;
  emotionalContext?: {
    energy: string;
    valence: string;
    intensity: number;
  };
}

export interface ClassificationResult {
  filedTo: FiledTo;
  confidence: number;
  reasoning: string;
  extractedData: {
    name: string;
    [key: string]: unknown;
  };
}
