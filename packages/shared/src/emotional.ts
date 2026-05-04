export type EmotionalValence = 'pleasant' | 'unpleasant' | 'neutral';

export type EmotionalState =
  | 'high_energy_pleasant'
  | 'high_energy_unpleasant'
  | 'low_energy_pleasant'
  | 'low_energy_unpleasant';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface EmotionalCheckIn {
  id: string;
  userId: string;
  timestamp: Date;
  energyLevel: number;
  valence: EmotionalValence;
  feelingLabel?: string;
  bodySensationNote?: string;
  source: 'manual' | 'inferred';
}

export interface CurrentEmotionalContext {
  userId: string;
  checkIn: EmotionalCheckIn;
  inferredFactors: {
    timeOfDay: TimeOfDay;
    sleepQuality?: number;
    consecutiveLowEnergyDays: number;
  };
  computedState: EmotionalState;
}
