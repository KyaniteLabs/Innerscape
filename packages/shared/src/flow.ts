export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type DopamineCategory = 'warm_up' | 'deep_work' | 'support' | 'rest';
export type EmotionalState = import('./emotional').EmotionalState;

export interface Habit {
  id: string;
  userId: string;
  name: string;
  frequency: HabitFrequency;
  streak: number;
  longestStreak: number;
  lastCompletedAt?: Date;
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  status: GoalStatus;
  parentGoalId?: string;
}

export interface Task {
  id: string;
  goalId?: string;
  userId: string;
  title: string;
  estimatedDuration: number;
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
  contextRequirements?: EmotionalState[];
}

export interface DopamineMenuItem {
  id: string;
  userId: string;
  category: DopamineCategory;
  name: string;
  instructions: string[];
  estimatedDuration: number;
  effectivenessScore?: number;
  lastUsedAt?: Date;
}
