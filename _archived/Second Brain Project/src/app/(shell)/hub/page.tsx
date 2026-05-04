/**
 * APEX Contract: Hub Dashboard Page
 * Inputs: None (server component)
 * Outputs: Dashboard with insights and activities
 * Errors: Graceful fallback to empty state
 * Edge cases: API failure, empty data
 */
import React from 'react';
import { DailyOverview } from '@/components/hub/DailyOverview';
import { InsightGrid } from '@/components/hub/InsightGrid';
import { RecentActivity } from '@/components/hub/RecentActivity';
import { api } from '@/lib/api';
import type { Insight, Activity } from '@/types';

export default async function HubPage() {
  // Parallel fetch with proper await (APEX: Safe Defaults)
  const [insightsResult, activitiesResult] = await Promise.all([
    api.get<Insight[]>('/insights').catch(() => null),
    api.get<Activity[]>('/activities').catch(() => null),
  ]);

  // Safe fallbacks after await
  const insights = insightsResult ?? [];
  const activities = activitiesResult ?? [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-outfit">
          Innerscape Hub
        </h1>
        <p className="text-lg text-slate-500">
          Your command center for self-awareness and productivity.
        </p>
      </header>

      <DailyOverview />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <h2 className="text-xl font-bold text-slate-800">Your Insights</h2>
          {insights.length > 0 ? (
            <InsightGrid insights={insights} />
          ) : (
            <p className="text-slate-500">No insights yet. Check back after a few check-ins!</p>
          )}
        </div>
        <div className="md:col-span-1">
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}
