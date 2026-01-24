/**
 * APEX Contract: Flow Page (Habits & Routines)
 * Inputs: None (server component)
 * Outputs: Habit tracking and routine management
 */
import React from 'react';
import { api } from '@/lib/api';
import { HabitCard } from '@/components/flow/HabitCard';
import { Zap, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/Button';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  frequency: string;
  category: string;
}

export default async function FlowPage() {
  const habitsResult = await api.get<Habit[]>('/flow/habits').catch(() => null);
  const habits = habitsResult?.data ?? [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Zap size={20} className="text-amber-600" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-outfit">
              Flow
            </h1>
          </div>
          <p className="text-lg text-slate-500">
            Build sustainable habits and master your routines.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter size={16} />
            Filter
          </Button>
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 border-amber-500">
            <Plus size={16} />
            Add Habit
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Daily Habits
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {habits.filter(h => h.completedToday).length}/{habits.length} Done
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.length > 0 ? (
              habits.map((habit) => (
                <HabitCard 
                  key={habit.id} 
                  habit={habit} 
                  onToggle={async () => {
                    "use server";
                    // Toggle implementation would go here
                  }} 
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                <p className="text-slate-500">No habits set up yet. Start your flow today!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Your Routines</h2>
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 min-h-[300px] flex items-center justify-center italic text-slate-400">
            Routines coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
