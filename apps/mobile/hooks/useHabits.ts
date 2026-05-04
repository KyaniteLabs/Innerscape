import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Habit {
  id: string;
  name: string;
  frequency: string;
  streak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  completedToday: boolean;
}

interface CompleteResponse extends Habit {
  celebration: boolean;
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get<Habit[]>('/api/v1/habits'),
    select: (habits) =>
      habits.map((h) => ({
        ...h,
        completedToday: isToday(h.lastCompletedAt),
      })),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; frequency?: string }) =>
      api.post<Habit>('/api/v1/habits', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<CompleteResponse>(`/api/v1/habits/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/habits/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
