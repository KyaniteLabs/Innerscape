import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SleepLog {
  id: string;
  date: string;
  durationHours: number;
  qualityScore: number;
  createdAt: string;
}

export interface SleepSummary {
  nights: number;
  avgDuration: number;
  avgQuality: number;
}

export interface SleepResponse {
  logs: SleepLog[];
  summary: SleepSummary;
}

export function useSleep(days = 7) {
  return useQuery({
    queryKey: ['sleep', days],
    queryFn: () => api.get<SleepResponse>(`/api/v1/sleep?days=${days}`),
  });
}

export function useCreateSleepLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; durationHours: number; qualityScore: number }) =>
      api.post<SleepLog>('/api/v1/sleep', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sleep'] }),
  });
}
