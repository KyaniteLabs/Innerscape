import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

export const CorrelationTable = () => {
  const data = [
    { factor: 'Sleep Duration', correlation: '+0.82', impact: 'Strong Positive', result: 'High Energy' },
    { factor: 'Morning Pages', correlation: '+0.65', impact: 'Moderate Positive', result: 'Pleasant Mood' },
    { factor: 'Caffeine > 3pm', correlation: '-0.45', impact: 'Negative', result: 'Low Sleep Quality' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factor Correlations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Factor</th>
                <th className="px-6 py-3">Correlation</th>
                <th className="px-6 py-3">Impact</th>
                <th className="px-6 py-3">Primary Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.factor}>
                  <td className="px-6 py-4 font-medium text-slate-900">{row.factor}</td>
                  <td className="px-6 py-4 text-indigo-600 font-bold">{row.correlation}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.impact.includes('Positive') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.impact}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
