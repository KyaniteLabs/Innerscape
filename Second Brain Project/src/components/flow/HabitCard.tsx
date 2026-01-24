"use client";

import React from 'react';
import { Check, Flame, Clock } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

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
  onToggle: (id: string) => void;
}

export function HabitCard({ habit, onToggle }: Props) {
  return (
    <Card className="p-6 transition-all hover:shadow-md border-slate-100 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => onToggle(habit.id)}
            variant={habit.completedToday ? "primary" : "outline"}
            className={`w-12 h-12 rounded-2xl p-0 transition-transform active:scale-95 ${
              habit.completedToday ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''
            }`}
          >
            <Check size={24} className={habit.completedToday ? "text-white" : "text-slate-300 group-hover:text-slate-400"} />
          </Button>
          <div>
            <h3 className={`font-bold ${habit.completedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
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
