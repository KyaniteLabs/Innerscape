import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface CheckIn {
  id: string;
  energy: number;
  valence: string;
  feeling: string | null;
  notes: string | null;
  createdAt: string;
}

export interface EmotionalContext {
  latestCheckIn: CheckIn | null;
  inferredFactors: string[];
  emotionalState: string;
}

export function useCheckins(limit = 20) {
  return useQuery({
    queryKey: ['checkins', limit],
    queryFn: () => api.get<CheckIn[]>(`/api/v1/checkins?limit=${limit}`),
  });
}

export function useCurrentContext() {
  return useQuery({
    queryKey: ['emotional-context'],
    queryFn: () => api.get<EmotionalContext>('/api/v1/context/current'),
    refetchInterval: 60_000,
  });
}

export function useCreateCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { energy: number; valence: string; feeling?: string }) =>
      api.post<CheckIn>('/api/v1/checkins', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkins'] });
      qc.invalidateQueries({ queryKey: ['emotional-context'] });
    },
  });
}
