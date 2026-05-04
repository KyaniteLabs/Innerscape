/**
 * APEX Contract: Voice Journal Page (Web)
 * Inputs: None (server component)
 * Outputs: Voice journaling interface
 */
import React from 'react';
import { VoiceRecorder } from '@/components/mind/VoiceRecorder';
import { Brain, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function VoiceJournalPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      <header className="flex flex-col gap-6">
        <Link 
          href="/brain" 
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors group"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Brain</span>
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Brain size={20} className="text-indigo-600" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-outfit">
              Mind Journal
            </h1>
          </div>
          <p className="text-lg text-slate-500">
            Voice-to-text journaling for rapid reflection and mental clarity.
          </p>
        </div>
      </header>

      <VoiceRecorder />
    </div>
  );
}
