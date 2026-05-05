import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface DeclutterSession {
  session_id: string;
  image_storage_key: string | null;
  created_at: string;
  total_items: number;
  decided_items: number;
  money_on_table_low_usd: number;
  money_on_table_high_usd: number;
}

export interface DeclutterItem {
  item_id: string;
  label: string;
  condition: string;
  valuation: {
    label?: string;
    estimated_low_usd?: number;
    estimated_high_usd?: number;
    confidence?: string;
    source?: string;
  } | null;
  listing_draft: {
    title: string;
    description: string;
    price_usd: number;
    category_hint: string;
  } | null;
  decision: {
    item_id: string;
    decision: string;
    note: string | null;
    decided_at: string;
  } | null;
  created_at: string;
}

export interface SessionDetail extends DeclutterSession {
  items: DeclutterItem[];
}

export interface SessionSummary extends DeclutterSession {
  decision_counts: Record<string, number>;
  total_estimated_low_usd: number;
  total_estimated_high_usd: number;
  public_listings: { item_id: string; listing_id: string; title: string }[];
}

export function useSessions() {
  return useQuery({
    queryKey: ['declutter', 'sessions'],
    queryFn: () => api.get<{ sessions: DeclutterSession[] }>('/api/v1/declutter/sessions'),
  });
}

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['declutter', 'sessions', sessionId],
    queryFn: () => api.get<SessionDetail>(`/api/v1/declutter/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useSessionSummary(sessionId: string | null) {
  return useQuery({
    queryKey: ['declutter', 'sessions', sessionId, 'summary'],
    queryFn: () => api.get<SessionSummary>(`/api/v1/declutter/sessions/${sessionId}/summary`),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<SessionDetail>('/api/v1/declutter/sessions', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['declutter', 'sessions'] }),
  });
}

export function useAddItem(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { label: string; condition?: string }) =>
      api.post<DeclutterItem>(`/api/v1/declutter/sessions/${sessionId}/items`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['declutter', 'sessions', sessionId] });
    },
  });
}

export function useMakeDecision(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { item_id: string; decision: string; note?: string }) =>
      api.post(`/api/v1/declutter/sessions/${sessionId}/decisions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['declutter', 'sessions', sessionId] });
      qc.invalidateQueries({ queryKey: ['declutter', 'sessions', sessionId, 'summary'] });
    },
  });
}

export function useValuationEstimate() {
  return useMutation({
    mutationFn: (data: { label: string; condition?: string }) =>
      api.post<{ label: string; estimated_low_usd: number; estimated_high_usd: number; confidence: string; source: string }>(
        '/api/v1/declutter/valuation/estimate',
        data,
      ),
  });
}
