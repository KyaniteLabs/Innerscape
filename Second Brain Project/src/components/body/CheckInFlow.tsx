"use client";

import React, { useState } from 'react';
import { BodyScan } from './BodyScan';
import { EmotionWheel } from './EmotionWheel';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

/**
 * @fileoverview Multi-step somatic check-in flow for Web
 * @module components/body/CheckInFlow
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: Renders interactive check-in flow
 * - Errors: API failure handled with visible error message
 */

type Step = 'scan' | 'wheel' | 'reflection' | 'result';

export function CheckInFlow() {
  const [step, setStep] = useState<Step>('scan');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRegion = (id: string) => {
    setSelectedRegions(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const result = await apiClient.post('/feelings/check-in', {
        dominantFeeling: selectedEmotion,
        bodySensation: selectedRegions.join(','),
        reflection: reflection,
        energy: 50, // Default for now
        valence: 0,  // Default for now
      });

      if (result !== null) {
        setStep('result');
      } else {
        throw new Error('Failed to save check-in');
      }
    } catch (err) {
      setError('Something went wrong while saving. Please try again.');
      console.error('[APEX] Check-in save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden rounded-[40px] border-slate-100 shadow-xl">
      <div className="p-8">
        {step === 'scan' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 font-outfit uppercase tracking-wider">Body Scan</h2>
              <p className="text-slate-500">Where do you feel it in your body?</p>
            </div>
            <div className="h-[400px]">
              <BodyScan selectedRegions={selectedRegions} onRegionSelect={toggleRegion} />
            </div>
            <div className="flex justify-end">
              <Button 
                disabled={selectedRegions.length === 0}
                onClick={() => setStep('wheel')}
                className="gap-2 rounded-2xl px-8 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 'wheel' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 font-outfit uppercase tracking-wider">Emotion</h2>
              <p className="text-slate-500">
                {selectedEmotion ? `You're feeling ${selectedEmotion}` : 'Select your dominant feeling'}
              </p>
            </div>
            <div className="flex justify-center py-4">
              <EmotionWheel onEmotionSelect={setSelectedEmotion} />
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setStep('scan')} className="gap-2 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <ChevronLeft size={18} /> Back
              </Button>
              <Button 
                disabled={!selectedEmotion}
                onClick={() => setStep('reflection')}
                className="gap-2 rounded-2xl px-8 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 'reflection' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 font-outfit uppercase tracking-wider">Reflection</h2>
              <p className="text-slate-500">Anything else on your mind?</p>
            </div>
            <textarea
              className="w-full min-h-[200px] p-6 bg-slate-50 border-none rounded-3xl text-lg text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              placeholder="Tap to write..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              autoFocus
            />
            <div className="flex justify-between">
              <Button onClick={() => setStep('wheel')} className="gap-2 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <ChevronLeft size={18} /> Back
              </Button>
              <Button 
                onClick={handleFinish}
                disabled={isSaving}
                className="gap-2 rounded-2xl px-8 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    Saving <Loader2 size={18} className="animate-spin" />
                  </>
                ) : (
                  <>
                    Finish <Check size={18} />
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center animate-in fade-in">{error}</p>
            )}
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-8 py-12 text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-green-200">
              <Check size={48} strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 font-outfit">Check-in Complete</h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                Your somatic data has been synced across all your devices.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl inline-block text-left min-w-[250px] border border-slate-100">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feeling</p>
                  <p className="text-lg font-bold text-slate-800">{selectedEmotion}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In your</p>
                  <p className="text-lg font-bold text-slate-800">{selectedRegions.join(', ') || 'General'}</p>
                </div>
              </div>
            </div>
            <div>
              <Button 
                onClick={() => {
                  setStep('scan');
                  setSelectedRegions([]);
                  setSelectedEmotion(null);
                  setReflection('');
                }}
                className="gap-2 rounded-2xl px-12 bg-slate-900 hover:bg-slate-800"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
