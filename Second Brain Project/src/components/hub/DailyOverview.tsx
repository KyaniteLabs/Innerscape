import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Brain, Zap, Heart, Flame } from 'lucide-react';

export const DailyOverview = () => {
  const stats = [
    { label: 'Energy', value: 'High', icon: Zap, color: 'text-amber-500' },
    { label: 'Mood', value: 'Pleasant', icon: Heart, color: 'text-emerald-500' },
    { label: 'Brain', value: '12 Captures', icon: Brain, color: 'text-indigo-500' },
    { label: 'Flow', value: '85% Done', icon: Flame, color: 'text-orange-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              {stat.label}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
