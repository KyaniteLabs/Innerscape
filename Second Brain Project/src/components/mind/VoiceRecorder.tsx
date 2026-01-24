"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Save, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

/**
 * @fileoverview Web Voice Recorder with Transcription
 * @module components/mind/VoiceRecorder
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: Renders interactive voice recording and transcription interface
 * - Errors: Graceful handling of microphone access denial
 */

// APEX Constants (No Magic)
const SIMULATED_TRANSCRIPTION_DELAY = 2000;
const TIMER_INTERVAL = 1000;

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, TIMER_INTERVAL);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // Transcription simulation (APEX: Port to Deepgram later)
        setIsTranscribing(true);
        setTimeout(() => {
          setTranscription("This is a simulated transcription of your voice journal. In production, this would use the Deepgram API to provide high-accuracy text conversion of your spoken thoughts.");
          setIsTranscribing(false);
        }, SIMULATED_TRANSCRIPTION_DELAY);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setTranscription('');
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-12 text-center rounded-[48px] border-slate-100 shadow-2xl bg-white relative overflow-hidden">
      {/* Visualizer Background Placeholder */}
      {isRecording && (
        <div className="absolute inset-0 bg-indigo-50/30 flex items-center justify-center -z-0">
          <div className="flex gap-1 items-end h-32">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div 
                key={i} 
                className="w-2 bg-indigo-400 rounded-full animate-pulse" 
                style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} 
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 font-outfit">Voice Journal</h2>
          <p className="text-slate-500">Speak your thoughts, find clarity.</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl ${
              isRecording ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isRecording ? (
              <Square size={32} className="text-white fill-current" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </button>
          
          <div className="font-mono text-2xl font-bold text-indigo-600 tabular-nums">
            {formatDuration(duration)}
          </div>
        </div>

        {isTranscribing && (
          <div className="flex flex-col items-center gap-3 py-8 animate-in fade-in">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Transcribing...</p>
          </div>
        )}

        {transcription && !isTranscribing && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-8 bg-slate-50 rounded-[32px] text-left border border-slate-100 italic text-lg text-slate-700 leading-relaxed relative">
              <span className="absolute top-4 left-4 text-4xl text-indigo-200 font-serif opacity-50">&quot;</span>
              {transcription}
            </div>
            
            <div className="flex flex-col gap-3">
              <Button className="w-full py-6 rounded-2xl bg-green-600 text-white hover:bg-green-700 text-lg font-bold gap-2">
                <Save size={20} />
                Save Entry
              </Button>
              <Button className="text-slate-400 bg-transparent hover:bg-slate-50 border-none shadow-none" onClick={() => setTranscription('')}>
                Discard
              </Button>
            </div>
          </div>
        )}

        {!transcription && !isRecording && !isTranscribing && (
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 flex flex-row items-center gap-4 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Reflection Prompt</p>
              <p className="text-indigo-900 font-medium">What is one thing that surprised you today?</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
