import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Space {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  scans: SpaceScan[];
}

export interface SpaceScan {
  id: string;
  spaceId: string;
  userId: string;
  beforePhotoUri: string;
  afterPhotoUri: string | null;
  status: string;
  durationSeconds: number | null;
  scannedAt: string;
  completedAt: string | null;
}

export interface DetectedItem {
  id: string;
  scanId: string;
  label: string;
  confidence: number;
  category: string | null;
  decision: string | null;
  decidedAt: string | null;
}

export function useSpaces() {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: () => api.get<Space[]>('/api/v1/spaces'),
  });
}

export function useCreateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post<Space>('/api/v1/spaces', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });
}

export function useStartScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, beforePhotoUri }: { spaceId: string; beforePhotoUri: string }) =>
      api.post<SpaceScan>(`/api/v1/spaces/${spaceId}/scans`, { beforePhotoUri }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });
}

export function useCompleteScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scanId,
      afterPhotoUri,
      durationSeconds,
    }: {
      scanId: string;
      afterPhotoUri?: string;
      durationSeconds?: number;
    }) => api.post<SpaceScan>(`/api/v1/scans/${scanId}/complete`, { afterPhotoUri, durationSeconds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });
}

export function useAddDetectedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scanId,
      label,
      confidence,
      category,
    }: {
      scanId: string;
      label: string;
      confidence: number;
      category?: string;
    }) => api.post<DetectedItem>(`/api/v1/scans/${scanId}/items`, { label, confidence, category }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });
}

export function useDecideItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      decision,
      notes,
    }: {
      itemId: string;
      decision: 'keep' | 'donate' | 'sell' | 'recycle' | 'trash';
      notes?: string;
    }) => api.post<DetectedItem>(`/api/v1/items/${itemId}/decide`, { decision, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });
}
