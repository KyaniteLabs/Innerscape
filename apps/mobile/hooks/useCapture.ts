import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface CaptureItem {
  id: string;
  content: string;
  contentType: string;
  source: string;
  tags: string[];
  capturedAt: string;
  classificationStatus: string;
  classifiedModule: string | null;
  classifiedType: string | null;
}

export function useCaptures(status = 'pending') {
  return useQuery({
    queryKey: ['captures', status],
    queryFn: () => api.get<CaptureItem[]>(`/api/v1/capture?status=${status}`),
  });
}

export function useCreateCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; tags?: string[]; contentType?: string }) =>
      api.post<CaptureItem>('/api/v1/capture', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useClassifyCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; module: string; type: string; confidence?: number }) =>
      api.post(`/api/v1/capture/${data.id}/classify`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useDeleteCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/capture/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['captures'] }),
  });
}
