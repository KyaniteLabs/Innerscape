import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface DopamineMenuItem {
  id: string;
  category: 'warm_up' | 'deep_work' | 'support' | 'rest';
  name: string;
  instructions: string[];
  estimatedDuration: number;
  lastUsedAt: string | null;
}

export function useDopamineMenu(category?: string) {
  return useQuery({
    queryKey: ['dopamine-menu', category],
    queryFn: () =>
      api.get<DopamineMenuItem[]>(
        `/api/v1/dopamine-menu${category ? `?category=${category}` : ''}`,
      ),
  });
}

export function useCreateDopamineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      category: string;
      name: string;
      instructions: string[];
      estimatedDuration?: number;
    }) => api.post<DopamineMenuItem>('/api/v1/dopamine-menu', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dopamine-menu'] }),
  });
}

export function useMarkDopamineUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<DopamineMenuItem>(`/api/v1/dopamine-menu/${id}/use`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dopamine-menu'] }),
  });
}
