import { useState, useCallback } from 'react';
import { useApiClient } from '../api/client';

/**
 * @fileoverview Goals management hook
 * @module lib/hooks/useGoals
 * 
 * APEX Contract:
 * - Inputs: None (for fetch), Partial<Goal> (for create/update)
 * - Outputs: List of goals, status (loading, error), and management functions
 * - Errors: API failure handled with visible error message
 */

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  category: string;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Goal[]>('/goals');
      if (res.success) {
        setGoals(res.data || []);
      } else {
        setError(res.error?.message || 'Failed to fetch goals');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createGoal = async (data: Partial<Goal>) => {
    try {
      const res = await api.post<Goal>('/goals', data);
      if (res.success) {
        setGoals(prev => [res.data!, ...prev]);
        return res.data;
      }
      throw new Error(res.error?.message || 'Failed to create goal');
    } catch (err) {
      throw err;
    }
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    try {
      const res = await api.patch(`/goals/${id}`, data);
      if (res.success) {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
      } else {
        throw new Error(res.error?.message || 'Failed to update goal');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
  };
}
