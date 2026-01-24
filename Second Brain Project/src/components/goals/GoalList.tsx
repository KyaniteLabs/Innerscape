import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Target, TrendingUp, Clock } from 'lucide-react';

export const GoalList = ({ status }: { status: 'active' | 'completed' }) => {
  // Mock data for goals
  const goals = status === 'active' ? [
    { id: '1', title: 'Launch Innerscape Suite', progress: 65, category: 'Work', deadline: 'Mar 15, 2026' },
    { id: '2', title: 'Complete 30-Day Mindfulness Habit', progress: 40, category: 'Personal', deadline: 'Feb 10, 2026' },
  ] : [
    { id: '3', title: 'Read 5 Books in Q4', progress: 100, category: 'Learning', deadline: 'Dec 31, 2025' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {goals.map((goal) => (
        <Card key={goal.id} className={status === 'completed' ? 'opacity-60' : ''}>
          <CardContent className="flex items-center gap-6 py-6">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-lg">{goal.title}</h3>
                <span className="text-sm px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">
                  {goal.category}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-indigo-600">{goal.progress}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm min-w-[120px]">
              <Clock className="h-4 w-4" />
              <span>{goal.deadline}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
