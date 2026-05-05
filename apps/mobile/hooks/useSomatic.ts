import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SomaticMapping {
  id: string;
  userId: string;
  sensationPattern: Record<string, unknown>;
  predictedEmotion: string;
  confidence: number;
  occurrences: number;
  lastValidatedAt: string | null;
}

export function useSomatic() {
  return useQuery({
    queryKey: ['somatic'],
    queryFn: () => api.get<SomaticMapping[]>('/api/v1/somatic'),
  });
}

export function useCreateSomatic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sensationPattern: Record<string, unknown>;
      predictedEmotion: string;
      confidence: number;
    }) => api.post<SomaticMapping>('/api/v1/somatic', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['somatic'] }),
  });
}
