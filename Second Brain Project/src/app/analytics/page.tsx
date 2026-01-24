import React from 'react';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { CorrelationTable } from '@/components/analytics/CorrelationTable';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-outfit">
          Deep Analytics
        </h1>
        <p className="text-lg text-slate-500 mt-2">
          Discover the invisible patterns in your life.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnalyticsChart title="Energy vs. Sleep" metric="energy" correlation="sleep" />
        <AnalyticsChart title="Habit Consistency vs. Valence" metric="habits" correlation="valence" />
      </div>

      <CorrelationTable />
    </div>
  );
}
