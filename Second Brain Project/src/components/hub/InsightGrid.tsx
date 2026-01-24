import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Lightbulb, Info, AlertTriangle } from 'lucide-react';

export const InsightGrid = ({ insights }: { insights: any[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {insights.map((insight) => (
        <Card key={insight.id} className="border-indigo-100 bg-indigo-50/30">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            {insight.type === 'pattern' ? <Lightbulb className="h-5 w-5 text-indigo-500" /> : 
             insight.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-500" /> :
             <Info className="h-5 w-5 text-blue-500" />}
            <CardTitle className="text-base font-semibold text-indigo-900">
              {insight.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-700 leading-relaxed">
              {insight.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
