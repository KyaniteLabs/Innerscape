import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * @fileoverview Shutdown Ritual logic and data
 * @module lib/hooks/useShutdownRitual
 */

export interface ShutdownStep {
  id: string;
  label: string;
  sub: string;
  source?: 'base' | 'dynamic';
  details?: string[];
}

const BASE_SHUTDOWN_STEPS: ShutdownStep[] = [
  { id: 'tabs', label: 'Close browser tabs', sub: 'Clear digital clutter', source: 'base' },
  { id: 'tasks', label: 'Review open tasks', sub: 'Update task status', source: 'base' },
  { id: 'highlight', label: 'Plan tomorrow', sub: 'Set primary focus', source: 'base' },
  { id: 'desk', label: 'Reset workspace', sub: 'Physical environment', source: 'base' },
];

const STORAGE_KEY = 'lifeos-shutdown-completed';

export function useShutdownRitual() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [isEvening, setIsEvening] = useState(false);
  const [isLateNight, setIsLateNight] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsEvening(hour >= 17 || hour < 5); // After 5 PM or before 5 AM
      setIsLateNight(hour >= 22 || hour < 5); // After 10 PM or before 5 AM
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    // Load completed steps
    const loadCompleted = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { date, steps } = JSON.parse(saved);
          if (date === new Date().toDateString()) {
            setCompleted(steps);
          }
        }
      } catch (err) {
        console.error('[APEX] Failed to load shutdown state:', err);
      }
    };

    loadCompleted();
    return () => clearInterval(interval);
  }, []);

  // Save completed steps
  useEffect(() => {
    const saveCompleted = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: new Date().toDateString(),
          steps: completed,
        }));
      } catch (err) {
        console.error('[APEX] Failed to save shutdown state:', err);
      }
    };
    saveCompleted();
  }, [completed]);

  const shutdownSteps = useMemo(() => {
    // For now, just return base steps. 
    // In future, can add dynamic steps based on activity.
    return BASE_SHUTDOWN_STEPS;
  }, []);

  const toggleStep = (id: string) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const progress = shutdownSteps.length > 0 
    ? (completed.length / shutdownSteps.length) * 100 
    : 0;
  
  const isComplete = shutdownSteps.length > 0 && completed.length === shutdownSteps.length;

  return {
    steps: shutdownSteps,
    completed,
    toggleStep,
    isEvening,
    isLateNight,
    progress,
    isComplete,
  };
}
