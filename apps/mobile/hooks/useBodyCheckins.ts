import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BodyCheckIn {
  id: string;
  bodyScan: Record<string, string>;
  emotionWheelFeeling: string;
  emotionWheelValence: string;
  reflectionRating: number | null;
  timestamp: string;
}

export function useBodyCheckins(limit = 20) {
  return useQuery({
    queryKey: ['body-checkins', limit],
    queryFn: () => api.get<BodyCheckIn[]>(`/api/v1/body-checkins?limit=${limit}`),
  });
}

export function useLatestBodyCheckin() {
  return useQuery({
    queryKey: ['body-checkins', 'latest'],
    queryFn: () => api.get<BodyCheckIn | { found: false }>('/api/v1/body-checkins/latest'),
  });
}

export function useCreateBodyCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      bodyScan: Record<string, string>;
      emotionWheelFeeling: string;
      emotionWheelValence: string;
      reflectionRating?: number;
    }) => api.post<BodyCheckIn>('/api/v1/body-checkins', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-checkins'] }),
  });
}
