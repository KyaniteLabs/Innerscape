import React from 'react';
import { GoalList } from '@/components/goals/GoalList';
import { GoalForm } from '@/components/goals/GoalForm';

export default function GoalsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-outfit">
            Goals & OKRs
          </h1>
          <p className="text-lg text-slate-500 mt-2">
            Align your daily actions with your long-term vision.
          </p>
        </div>
        <GoalForm />
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
          <GoalList status="active" />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-400">Completed</h2>
          <GoalList status="completed" />
        </section>
      </div>
    </div>
  );
}
