import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  parentGoalId: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  goalId: string | null;
  estimatedDuration: number;
  dueDate: string | null;
}

export function useGoals(status = 'active') {
  return useQuery({
    queryKey: ['goals', status],
    queryFn: () => api.get<Goal[]>(`/api/v1/goals?status=${status}`),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; deadline?: string }) =>
      api.post<Goal>('/api/v1/goals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useTasks(goalId?: string) {
  return useQuery({
    queryKey: ['tasks', goalId],
    queryFn: () =>
      api.get<Task[]>(`/api/v1/tasks${goalId ? `?goalId=${goalId}` : ''}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; goalId?: string; estimatedDuration?: number }) =>
      api.post<Task>('/api/v1/tasks', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Task>(`/api/v1/tasks/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
