/**
 * @fileoverview Emotional context widget for web shell
 * @module components/shell/EmotionalContextWidget
 * 
 * APEX Contract:
 * - Inputs: None (fetches from API)
 * - Outputs: Current emotional state badge
 * - Errors: Hidden when data unavailable
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Battery } from 'lucide-react';

interface EmotionalContext {
  energy: 'high' | 'low';
  valence: 'pleasant' | 'unpleasant' | 'neutral';
  timestamp: string;
}

async function fetchEmotionalContext(): Promise<EmotionalContext | null> {
  try {
    const res = await fetch('/api/feelings/context');
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export function EmotionalContextWidget() {
  const { data: context } = useQuery({
    queryKey: ['emotional-context'],
    queryFn: fetchEmotionalContext,
    refetchInterval: 60_000, // Refresh every minute
    staleTime: 30_000,
  });

  if (!context) return null;

  const EnergyIcon = context.energy === 'high' ? Zap : Battery;
  const energyColor = context.energy === 'high' ? '#F59E0B' : '#60A5FA';
  
  const valenceEmoji = {
    pleasant: '😊',
    unpleasant: '😔',
    neutral: '😐',
  }[context.valence];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
      <EnergyIcon size={16} color={energyColor} />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {context.energy === 'high' ? 'High' : 'Low'} Energy
      </span>
      <span className="text-base">{valenceEmoji}</span>
    </div>
  );
}
