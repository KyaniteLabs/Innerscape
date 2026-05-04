"use client";

import React, { useState, useTransition } from 'react';
import { Check, Flame, Clock, Loader2 } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

/**
 * @fileoverview Habit item card for Web
 * @module components/flow/HabitCard
 * 
 * APEX Contract:
 * - Inputs: habit (Habit object), toggleAction (server action)
 * - Outputs: Renders a card with habit status and streak
 * - Errors: Graceful fallback for missing habit data, shows loading state
 */

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  frequency: string;
  category: string;
}

interface Props {
  habit: Habit;
  toggleAction: (habitId: string, isCompleted: boolean) => Promise<{ success: boolean; error?: string }>;
}

export function HabitCard({ habit, toggleAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useState(habit.completedToday);
  
  const handleToggle = () => {
    // Optimistic update
    setOptimisticCompleted(!optimisticCompleted);
    
    startTransition(async () => {
      const result = await toggleAction(habit.id, habit.completedToday);
      if (!result.success) {
        // Revert on error
        setOptimisticCompleted(habit.completedToday);
        console.error('[APEX] Habit toggle failed:', result.error);
      }
    });
  };
  
  const isCompleted = optimisticCompleted;
  
  return (
    <Card className="p-6 transition-all hover:shadow-md border-slate-100 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleToggle}
            disabled={isPending}
            aria-label={`Mark ${habit.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
            className={`w-12 h-12 rounded-2xl p-0 transition-transform active:scale-95 ${
              isCompleted 
                ? 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500' 
                : 'bg-white text-slate-300 hover:text-slate-400 border border-slate-200'
            } ${isPending ? 'opacity-50' : ''}`}
          >
            {isPending ? (
              <Loader2 size={24} className="animate-spin text-slate-400" />
            ) : (
              <Check size={24} className={isCompleted ? "text-white" : "text-slate-300 group-hover:text-slate-400"} />
            )}
          </Button>
          <div>
            <h3 className={`font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {habit.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {habit.category}
              </span>
              <span className="text-slate-200 text-xs">•</span>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock size={12} />
                <span className="text-xs">{habit.frequency}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          <Flame size={14} className="text-amber-500" fill="currentColor" />
          <span className="text-sm font-bold text-amber-700">{habit.streak}</span>
        </div>
      </div>
    </Card>
  );
}
