import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface TradeListing {
  id: string;
  item_label: string;
  description: string;
  condition: string;
  trade_value_credits: number;
  status: string;
  tags: string[];
  wants_in_return: string[];
  created_at: string;
}

export interface TradeCredits {
  balance: number;
  transactions: { id: string; amount: number; item_label: string; direction: string; created_at: string }[];
}

export function useListings(status = 'available') {
  return useQuery({
    queryKey: ['trade', 'listings', status],
    queryFn: () => api.get<{ listings: TradeListing[] }>(`/api/v1/trade/listings?status=${status}`),
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ['trade', 'listings', 'mine'],
    queryFn: () => api.get<{ listings: TradeListing[] }>('/api/v1/trade/listings/mine'),
  });
}

export function useCredits() {
  return useQuery({
    queryKey: ['trade', 'credits'],
    queryFn: () => api.get<TradeCredits>('/api/v1/trade/credits'),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      item_label: string;
      description?: string;
      condition?: string;
      trade_value_credits?: number;
      tags?: string[];
      wants_in_return?: string[];
    }) => api.post<TradeListing>('/api/v1/trade/listings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trade', 'listings'] }),
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      listing_id: string;
      offered_listing_id?: string;
      message?: string;
      use_credits?: boolean;
      credit_amount?: number;
    }) => api.post('/api/v1/trade/matches', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trade'] }),
  });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: (data: {
      trade_match_id: string;
      rated_user_id: string;
      rating: number;
      tags?: string[];
      comment?: string;
    }) => api.post('/api/v1/trade/reviews', data),
  });
}

export function useTradeRules() {
  return useQuery({
    queryKey: ['trade', 'rules'],
    queryFn: () => api.get<{ rules: string[] }>('/api/v1/trade/rules'),
    staleTime: Infinity,
  });
}

export function useTradeSafety() {
  return useQuery({
    queryKey: ['trade', 'safety'],
    queryFn: () => api.get<{ checklists: { id: string; title: string; items: string[] }[] }>('/api/v1/trade/safety'),
    staleTime: Infinity,
  });
}
