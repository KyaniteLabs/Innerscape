/**
 * APEX Contract: Body Page (Somatic Check-ins & Health)
 * Inputs: None (server component)
 * Outputs: Somatic check-in flow and health display
 */
import React from 'react';
import { CheckInFlow } from '@/components/body/CheckInFlow';
import { Heart, Activity, Moon, Smartphone } from 'lucide-react';
import { Card } from '@/components/Card';

export default function BodyPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <header className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
              <Heart size={20} className="text-rose-600" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-outfit">
              Body
            </h1>
          </div>
          <p className="text-lg text-slate-500">
            Connect with your physical sensations and track your vitality.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <CheckInFlow />
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Health Status</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
              <Smartphone size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Synced</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card className="p-6 border-slate-100 flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Moon size={24} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sleep (Last Night)</p>
                <p className="text-2xl font-bold text-slate-900">7h 20m</p>
              </div>
            </Card>

            <Card className="p-6 border-slate-100 flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Activity size={24} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg HRV</p>
                <p className="text-2xl font-bold text-slate-900">54 ms</p>
              </div>
            </Card>
          </div>

          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2">Health Sync</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your health data is automatically synced from Innerscape Mobile. Open the mobile app to refresh your vitals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
