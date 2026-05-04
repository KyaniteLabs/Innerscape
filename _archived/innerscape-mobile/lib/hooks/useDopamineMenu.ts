import { useState, useMemo, useEffect } from 'react';

/**
 * @fileoverview Dopamine Menu logic and data
 * @module lib/hooks/useDopamineMenu
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: Menu data, recommendations, time-of-day context
 */

export type CategoryId = 'appetizers' | 'entrees' | 'sides' | 'desserts';

export interface RegulationItem {
  name: string;
  duration: string;
  instructions: string[];
  tip?: string;
}

export interface RegulationSection {
  id: CategoryId;
  category: string;
  icon: string; // Lucide icon name
  color: string;
  description: string;
  items: RegulationItem[];
}

export const DOPAMINE_MENU: RegulationSection[] = [
  {
    id: 'appetizers',
    category: 'Warm Up',
    icon: 'Coffee',
    color: '#10B981',
    description: 'Gentle activation to ease into focus',
    items: [
      {
        name: 'Pet the dog',
        duration: '2-5 min',
        instructions: [
          'Find your pet (or a soft pillow/blanket)',
          'Sit or lie down in a comfortable position',
          'Focus on the texture under your hands',
          'Match your breathing to slow, gentle strokes',
        ],
        tip: 'No pet? A weighted blanket or soft fabric works too',
      },
      {
        name: 'Gentle movement',
        duration: '3-5 min',
        instructions: [
          'Stand up and shake out your hands',
          'Roll your shoulders backward 5 times',
          'Roll your neck gently side to side',
          'Stretch arms overhead',
        ],
      },
      {
        name: 'Hydration',
        duration: '1 min',
        instructions: [
          'Get a full glass of water',
          'Take 3 deep breaths before drinking',
          'Drink slowly, feeling the water go down',
        ],
      },
    ],
  },
  {
    id: 'entrees',
    category: 'Deep Work',
    icon: 'Activity',
    color: '#4F46E5',
    description: 'Structured focus techniques',
    items: [
      {
        name: 'Deep focus',
        duration: '25-50 min',
        instructions: [
          'Choose ONE task to focus on',
          'Set a timer for 25 minutes',
          'Put phone in another room',
          'Work until the timer rings',
        ],
      },
      {
        name: 'Creative flow',
        duration: '30-60 min',
        instructions: [
          'Gather your creative tools',
          'Put on instrumental music',
          'Start without a goal',
        ],
      },
    ],
  },
  {
    id: 'sides',
    category: 'Support',
    icon: 'Heart',
    color: '#F59E0B',
    description: 'Environmental aids for regulation',
    items: [
      {
        name: 'Ambient sounds',
        duration: 'Ongoing',
        instructions: [
          'Open a brown noise or nature sounds app',
          'Start at low volume',
          'Use headphones for better immersion',
        ],
      },
      {
        name: 'Tactile focus',
        duration: 'As needed',
        instructions: [
          'Get a fidget toy or stress ball',
          'Hold it in your non-dominant hand',
        ],
      },
    ],
  },
  {
    id: 'desserts',
    category: 'Rest',
    icon: 'Star',
    color: '#EC4899',
    description: 'Intentional recovery and play',
    items: [
      {
        name: 'Digital drift',
        duration: '10-20 min',
        instructions: [
          'Set a timer',
          'Open your favorite app guilt-free',
          'Stop when the timer rings',
        ],
      },
      {
        name: 'Visual rest',
        duration: '5-10 min',
        instructions: [
          'Look away from all screens',
          'Find something 20+ feet away to focus on',
          'Stay in darkness for 1 minute',
        ],
      },
    ],
  },
];

export function useDopamineMenu() {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  const recommendations = useMemo(() => {
    // Simplified: Return one from each of the first 3 categories
    return DOPAMINE_MENU.slice(0, 3).map(section => ({
      section,
      item: section.items[0],
    }));
  }, []);

  const getGreeting = () => {
    switch (timeOfDay) {
      case 'morning': return 'Good morning! Ready for a fresh start?';
      case 'afternoon': return 'Good afternoon! Keeping the momentum?';
      case 'evening': return 'Good evening! Winding down?';
      case 'night': return 'Working late? Remember to rest.';
    }
  };

  return {
    menu: DOPAMINE_MENU,
    recommendations,
    timeOfDay,
    getGreeting,
  };
}
