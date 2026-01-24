"use client";

import React from 'react';

/**
 * @fileoverview Body Scan interaction with SVG for Web
 * @module components/body/BodyScan
 */

interface Region {
  id: string;
  name: string;
  path: string;
}

const REGIONS: Region[] = [
  { id: 'head', name: 'Head', path: 'M45,5 C55,5 60,15 60,25 C60,35 55,45 45,45 C35,45 30,35 30,25 C30,15 35,5 45,5 Z' },
  { id: 'neck', name: 'Neck', path: 'M40,45 L50,45 L50,55 L40,55 Z' },
  { id: 'chest', name: 'Chest', path: 'M25,55 L65,55 L70,100 L20,100 Z' },
  { id: 'belly', name: 'Belly', path: 'M20,100 L70,100 L65,140 L25,140 Z' },
  { id: 'arms', name: 'Arms', path: 'M25,55 L10,120 M65,55 L80,120' },
  { id: 'hips', name: 'Hips', path: 'M25,140 L65,140 L70,165 L20,165 Z' },
  { id: 'legs', name: 'Legs', path: 'M25,165 L35,240 M65,165 L55,240' },
];

interface Props {
  selectedRegions: string[];
  onRegionSelect: (regionId: string) => void;
}

export function BodyScan({ selectedRegions, onRegionSelect }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-slate-50 rounded-[40px]">
      <svg 
        viewBox="0 0 100 250" 
        className="w-full max-w-[300px] h-auto drop-shadow-sm"
      >
        <g>
          {REGIONS.map((region) => {
            const isSelected = selectedRegions.includes(region.id);
            return (
              <path
                key={region.id}
                d={region.path}
                fill={isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.8)'}
                stroke={isSelected ? '#8B5CF6' : '#E2E8F0'}
                strokeWidth={2}
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={() => onRegionSelect(region.id)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
