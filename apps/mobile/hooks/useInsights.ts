import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  dataPoints: string[];
  dismissedAt: string | null;
  actedUponAt: string | null;
  createdAt: string;
}

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => api.get<Insight[]>('/api/v1/insights?dismissed=false'),
  });
}

export function useGenerateInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ generated: number; insights: Insight[] }>('/api/v1/insights/generate'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });
}

export function useDismissInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Insight>(`/api/v1/insights/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });
}

export function useActOnInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Insight>(`/api/v1/insights/${id}/act`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });
}
