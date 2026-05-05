import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface DailySummary {
  date: string;
  emotionalCheckIns: number;
  habitsCompleted: number;
  tasksCompleted: number;
  itemsCaptured: number;
  journalEntries: number;
  totalActivity: number;
}

export interface WeeklyReview {
  weekStart: string;
  avgEnergy: number;
  checkInCount: number;
  habits: { name: string; streak: number; longestStreak: number }[];
  tasksCompleted: number;
  topTags: { tag: string; count: number }[];
}

export function useDailySummary() {
  return useQuery({
    queryKey: ['review', 'daily'],
    queryFn: () => api.get<DailySummary>('/api/v1/review/daily-summary'),
    refetchInterval: 60_000,
  });
}

export function useWeeklyReview() {
  return useQuery({
    queryKey: ['review', 'weekly'],
    queryFn: () => api.get<WeeklyReview>('/api/v1/review/weekly'),
  });
}
