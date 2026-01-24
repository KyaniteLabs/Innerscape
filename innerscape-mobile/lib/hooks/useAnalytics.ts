import { useState, useCallback } from 'react';
import { useApiClient } from '../api/client';

/**
 * @fileoverview Analytics data hook
 * @module lib/hooks/useAnalytics
 */

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  history: string[]; // ISO dates
}

export interface CorrelationData {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-1
  description: string;
}

export function useAnalytics() {
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(false);
  const api = useApiClient();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      // In a real app, these would be separate API calls or one analytics call
      // Mocking for now as the backend might not have these yet
      setStreaks({
        currentStreak: 5,
        longestStreak: 12,
        totalDays: 45,
        history: ['2026-01-20', '2026-01-21', '2026-01-22', '2026-01-23', '2026-01-24'],
      });

      setCorrelations([
        { 
          factor: 'Sleep vs Energy', 
          impact: 'positive', 
          strength: 0.85, 
          description: 'Higher sleep quality consistently leads to 30% more habit completions.' 
        },
        { 
          factor: 'Morning Sunlight', 
          impact: 'positive', 
          strength: 0.6, 
          description: 'Early sunlight exposure correlates with more stable evening moods.' 
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    streaks,
    correlations,
    loading,
    fetchAnalytics,
  };
}
