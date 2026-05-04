/**
 * Feelings APP Types
 * 
 * Types for emotional check-ins, reflections, and personal mappings.
 * These mirror the Feelings APP (Flutter) data models.
 */

export type EnergyLevel = 'high' | 'low';
export type Valence = 'pleasant' | 'unpleasant' | 'neutral';
export type ContextCategory = 'social' | 'sensory' | 'task' | 'unknown';
export type HelpfulnessRating = 'helped' | 'didntHelp' | 'notSure';
export type Confidence = 'low' | 'medium' | 'high';

export type BodyRegion =
  | 'headFace'
  | 'neckThroat'
  | 'shouldersArms'
  | 'chestHeart'
  | 'bellyGut'
  | 'back'
  | 'hipsGroin'
  | 'legsFeet';

export interface SensationToken {
  id: string;
  label: string;
  category: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  timestamp: string;
  regions: BodyRegion[];
  sensations: SensationToken[];
  intensity: number; // 1-5
  energy: EnergyLevel;
  valence: Valence;
  context?: ContextCategory;
  freeText?: string;
  hypothesisAccepted?: boolean;
  customHypothesis?: string;
  selectedAction?: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface Reflection {
  id: string;
  userId: string;
  checkInId: string;
  helped: HelpfulnessRating;
  postEnergy?: EnergyLevel;
  postValence?: Valence;
  timestamp: string;
  updatedAt?: string;
}

export interface PersonalMapping {
  id: string;
  userId: string;
  hypothesisName: string;
  regions: BodyRegion[];
  sensations: string[];
  confirmationCount: number;
  confidenceScore: number;
  lastConfirmed: string;
  updatedAt?: string;
}

export interface EmotionalContext {
  id: string;
  userId: string;
  checkInId: string;
  energy: EnergyLevel;
  valence: Valence;
  intensity: number;
  capturedAt: string;
  expiresAt: string;
  updatedAt?: string;
}

export interface Hypothesis {
  name: string;
  confidence: Confidence;
  suggestedActions: string[];
}
