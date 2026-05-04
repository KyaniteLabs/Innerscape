import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

export const AnalyticsChart = ({ 
  title, 
  metric, 
  correlation 
}: { 
  title: string, 
  metric: string, 
  correlation: string 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 border-dashed">
          <p className="text-slate-400 text-sm italic">
            Visualizing {metric} vs. {correlation}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
