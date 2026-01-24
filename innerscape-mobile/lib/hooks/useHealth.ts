/**
 * @fileoverview Health data management hook
 * @module lib/hooks/useHealth
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: Health data, sync status, functions to request permissions and sync
 * - Errors: Graceful fallback to empty data on permission denied
 */

import { useState, useCallback, useEffect } from 'react';
import { healthService, HealthMetric, SleepRecord } from '../health/healthService';
import { useApiClient } from '../api/client';

interface HealthState {
  sleepRecords: SleepRecord[];
  hrv: HealthMetric[];
  steps: HealthMetric[];
  permissionsGranted: boolean;
  isAvailable: boolean;
  lastSyncTime: Date | null;
}

export function useHealth() {
  const api = useApiClient();
  const [state, setState] = useState<HealthState>({
    sleepRecords: [],
    hrv: [],
    steps: [],
    permissionsGranted: false,
    isAvailable: false,
    lastSyncTime: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check health service availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await healthService.isAvailable();
      setState((prev) => ({ ...prev, isAvailable: available }));

      if (available) {
        // Try to request permissions automatically
        const granted = await healthService.requestPermissions();
        setState((prev) => ({ ...prev, permissionsGranted: granted }));
      }
    };

    checkAvailability();
  }, []);

  /**
   * Request health data permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      setError(null);
      const granted = await healthService.requestPermissions();
      setState((prev) => ({ ...prev, permissionsGranted: granted }));

      if (!granted) {
        setError('Health permissions denied');
      }

      return granted;
    } catch (err) {
      const message = `Failed to request permissions: ${err}`;
      setError(message);
      return false;
    }
  }, []);

  /**
   * Fetch latest health data from native APIs
   */
  const fetchHealthData = useCallback(async (days: number = 7) => {
    try {
      setLoading(true);
      setError(null);

      const [sleepData, hrvData, stepsData] = await Promise.all([
        healthService.getSleepData(days),
        healthService.getHRV(days),
        healthService.getSteps(days),
      ]);

      setState((prev) => ({
        ...prev,
        sleepRecords: sleepData,
        hrv: hrvData,
        steps: stepsData,
      }));
    } catch (err) {
      const message = `Failed to fetch health data: ${err}`;
      setError(message);
      console.error('[APEX] Health data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sync health data to backend
   */
  const syncHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await healthService.syncToBackend(api);

      if (result.errors.length > 0) {
        console.warn('[APEX] Health sync errors:', result.errors);
      }

      setState((prev) => ({
        ...prev,
        lastSyncTime: new Date(),
      }));

      return result;
    } catch (err) {
      const message = `Failed to sync health data: ${err}`;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  /**
   * Get latest HRV value
   */
  const getLatestHRV = useCallback(() => {
    return state.hrv.length > 0 ? state.hrv[0].value : null;
  }, [state.hrv]);

  /**
   * Get latest sleep duration (in hours)
   */
  const getLatestSleepDuration = useCallback(() => {
    if (state.sleepRecords.length === 0) return null;

    const latest = state.sleepRecords[0];
    const duration =
      (latest.endTime.getTime() - latest.startTime.getTime()) / (1000 * 60 * 60);
    return Math.round(duration * 10) / 10;
  }, [state.sleepRecords]);

  /**
   * Get latest step count
   */
  const getLatestSteps = useCallback(() => {
    return state.steps.length > 0 ? state.steps[0].value : null;
  }, [state.steps]);

  return {
    // State
    sleepRecords: state.sleepRecords,
    hrv: state.hrv,
    steps: state.steps,
    permissionsGranted: state.permissionsGranted,
    isAvailable: state.isAvailable,
    lastSyncTime: state.lastSyncTime,
    loading,
    error,

    // Methods
    requestPermissions,
    fetchHealthData,
    syncHealthData,
    getLatestHRV,
    getLatestSleepDuration,
    getLatestSteps,
  };
}
