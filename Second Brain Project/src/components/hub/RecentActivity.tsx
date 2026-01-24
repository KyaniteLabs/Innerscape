import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { CheckCircle2, MessageSquare, PlusCircle } from 'lucide-react';

export const RecentActivity = ({ activities }: { activities: any[] }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4 items-start">
            <div className="mt-1">
              {activity.type === 'habit' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
               activity.type === 'journal' ? <MessageSquare size={16} className="text-indigo-500" /> :
               <PlusCircle size={16} className="text-slate-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{activity.description}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
