/**
 * Habit Tracker Types
 * 
 * Types for habits, completions, and routines.
 */

export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type HabitCategory = 'morning' | 'evening' | 'anytime';
export type EnergyCost = 'low' | 'medium' | 'high';

export interface FrequencyConfig {
  // For weekly: which days (0 = Sunday, 6 = Saturday)
  daysOfWeek?: number[];
  // For custom: every N days
  interval?: number;
  // For custom: specific dates
  specificDates?: string[];
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  frequencyConfig?: FrequencyConfig;
  category: HabitCategory;
  energyCost: EnergyCost;
  streakCurrent: number;
  streakBest: number;
  archived: boolean;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface HabitCompletion {
  id: string;
  userId: string;
  habitId: string;
  completedAt: string;
  energyBefore?: string;
  energyAfter?: string;
  notes?: string;
  updatedAt?: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  habitIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface HabitWithCompletion extends Habit {
  completedToday: boolean;
  lastCompletion?: HabitCompletion;
}

export interface DailyHabitSummary {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  habits: HabitWithCompletion[];
}
