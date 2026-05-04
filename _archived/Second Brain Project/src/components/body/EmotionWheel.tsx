"use client";

import React, { useState } from 'react';

/**
 * @fileoverview Plutchik Emotion Wheel for Web (CSS-based)
 * @module components/body/EmotionWheel
 * 
 * APEX Contract:
 * - Inputs: onEmotionSelect (callback)
 * - Outputs: Renders interactive emotion wheel with CSS animations
 * - Errors: Graceful handling of missing selections
 */

interface Emotion {
  name: string;
  color: string;
}

const EMOTIONS: Emotion[] = [
  { name: 'Joy', color: '#D4A853' },
  { name: 'Trust', color: '#90EE90' },
  { name: 'Fear', color: '#50C878' },
  { name: 'Surprise', color: '#22D3EE' },
  { name: 'Sadness', color: '#3B82F6' },
  { name: 'Disgust', color: '#9333EA' },
  { name: 'Anger', color: '#E8A49C' },
  { name: 'Anticipation', color: '#FB923C' },
];

interface Props {
  onEmotionSelect: (emotion: string) => void;
}

export function EmotionWheel({ onEmotionSelect }: Props) {
  const [rotation, setRotation] = useState(0);

  return (
    <div className="relative w-full aspect-square max-w-[400px] flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-slate-50 rounded-full border border-slate-100" />
      
      <div 
        className="relative w-[80%] aspect-square transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {EMOTIONS.map((emotion, i) => {
          const angle = (i * 360) / EMOTIONS.length;
          return (
            <div
              key={emotion.name}
              role="button"
              aria-label={`Select ${emotion.name}`}
              className="absolute top-0 left-1/2 w-1/2 h-full -ml-1/4 origin-bottom cursor-pointer group"
              style={{ transform: `rotate(${angle}deg)` }}
              onClick={() => {
                setRotation(-angle);
                onEmotionSelect(emotion.name);
              }}
            >
              <div 
                className="w-full h-1/2 rounded-t-full transition-all group-hover:scale-105"
                style={{ 
                  backgroundColor: emotion.color,
                  opacity: 0.6,
                  clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)'
                }}
              />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 -rotate-0">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest pointer-events-none">
                  {emotion.name}
                </span>
              </div>
            </div>
          );
        })}
        {/* Center Hole */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 aspect-square bg-white rounded-full shadow-inner border border-slate-100" />
      </div>
    </div>
  );
}
