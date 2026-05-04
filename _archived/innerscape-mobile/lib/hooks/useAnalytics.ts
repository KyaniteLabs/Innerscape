import { useState, useCallback } from 'react';
import { useApiClient } from '../api/client';

/**
 * @fileoverview Analytics data hook (connected to real backend)
 * @module lib/hooks/useAnalytics
 * 
 * APEX Contract:
 * - Inputs: None (fetches from API)
 * - Outputs: Streaks, Correlations, Trends, loading status
 * - Errors: Handled gracefully with fallback data
 */

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastCompletedDate: string | null;
  history: string[]; // ISO dates
}

export interface CorrelationData {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-1
  description: string;
}

export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

export function useAnalytics() {
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // APEX: Fetch all analytics in parallel
      const [streaksRes, correlationsRes, trendsRes] = await Promise.all([
        api.get<{ success: boolean; data: StreakData }>('/analytics/streaks'),
        api.get<{ success: boolean; data: CorrelationData[] }>('/analytics/correlations'),
        api.get<{ success: boolean; data: TrendPoint[] }>('/analytics/trends?metric=habits&days=7'),
      ]);

      // Extract data from responses
      if (streaksRes?.data?.success) {
        setStreaks(streaksRes.data.data);
      }
      if (correlationsRes?.data?.success) {
        setCorrelations(correlationsRes.data.data || []);
      }
      if (trendsRes?.data?.success) {
        setTrends(trendsRes.data.data || []);
      }

      // If all failed, show error
      if (!streaksRes && !correlationsRes && !trendsRes) {
        setError('Failed to load analytics');
      }
    } catch (err) {
      console.error('[APEX] Analytics fetch error:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [api]);

  /**
   * Fetch trend data for a specific metric
   */
  const fetchTrends = useCallback(async (metric: 'mood' | 'energy' | 'habits' | 'sleep', days: number = 7) => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: TrendPoint[] }>(`/analytics/trends?metric=${metric}&days=${days}`);
      if (res?.data?.success) {
        setTrends(res.data.data || []);
      }
    } catch (err) {
      console.error(`[APEX] Trends fetch error for ${metric}:`, err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    streaks,
    correlations,
    trends,
    loading,
    error,
    fetchAnalytics,
    fetchTrends,
  };
}
