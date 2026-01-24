/**
 * @fileoverview Hook to access emotional context from App Groups
 * @module hooks/useEmotionalContext
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: Current emotional state or null
 * - Errors: Returns null on failure
 */

import { useState, useEffect } from 'react';
import { appGroupStorage } from '../storage/appGroups';

interface EmotionalContext {
  energy: 'high' | 'low';
  valence: 'pleasant' | 'unpleasant' | 'neutral';
  timestamp: number;
}

export function useEmotionalContext() {
  const [context, setContext] = useState<EmotionalContext | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const data = await appGroupStorage.getEmotionalContext();
        setContext(data);
      } catch (error) {
        console.warn('[APEX] Failed to load emotional context:', error);
        setContext(null);
      }
    };

    loadContext();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadContext, 30_000);
    return () => clearInterval(interval);
  }, []);

  return {
    energy: context?.energy ?? null,
    valence: context?.valence ?? null,
    timestamp: context?.timestamp ?? null,
    isLoaded: context !== null,
  };
}
