import { create } from 'zustand';
import type { EmotionalState, EmotionalValence, TimeOfDay } from '@innerscape/shared';

interface EmotionalContext {
  currentCheckIn: {
    energyLevel: number;
    valence: EmotionalValence;
    feelingLabel?: string;
    timestamp: Date;
  } | null;
  inferredFactors: {
    timeOfDay: TimeOfDay;
    sleepQuality?: number;
    consecutiveLowEnergyDays: number;
  };
  computedState: EmotionalState | null;

  setCheckIn: (checkIn: {
    energyLevel: number;
    valence: EmotionalValence;
    feelingLabel?: string;
  }) => void;
  clearCheckIn: () => void;
}

function computeEmotionalState(
  energyLevel: number,
  valence: EmotionalValence
): EmotionalState {
  const highEnergy = energyLevel >= 50;
  if (highEnergy && valence === 'pleasant') return 'high_energy_pleasant';
  if (highEnergy && valence !== 'pleasant') return 'high_energy_unpleasant';
  if (!highEnergy && valence === 'pleasant') return 'low_energy_pleasant';
  return 'low_energy_unpleasant';
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export const useEmotionalStore = create<EmotionalContext>((set) => ({
  currentCheckIn: null,
  inferredFactors: {
    timeOfDay: getTimeOfDay(),
    consecutiveLowEnergyDays: 0,
  },
  computedState: null,

  setCheckIn: (checkIn) =>
    set({
      currentCheckIn: { ...checkIn, timestamp: new Date() },
      inferredFactors: {
        timeOfDay: getTimeOfDay(),
        consecutiveLowEnergyDays: 0,
      },
      computedState: computeEmotionalState(checkIn.energyLevel, checkIn.valence),
    }),

  clearCheckIn: () =>
    set({
      currentCheckIn: null,
      computedState: null,
    }),
}));
