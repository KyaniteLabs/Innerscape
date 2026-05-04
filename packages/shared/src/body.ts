export type BodyRegion =
  | 'head_face'
  | 'neck_throat'
  | 'shoulders_arms'
  | 'chest_heart'
  | 'belly_gut'
  | 'back'
  | 'hips_groin'
  | 'legs_feet';

export type SensationType = 'tension' | 'warmth' | 'numbness' | 'tingling' | 'pain' | 'neutral';
export type EmotionalValence = import('./emotional').EmotionalValence;

export interface BodyRegionSensation {
  region: BodyRegion;
  sensationType?: SensationType;
  intensity: number;
}

export interface BodyCheckIn {
  id: string;
  userId: string;
  timestamp: Date;
  bodyScan: BodyRegionSensation[];
  emotionWheelSelection: {
    feeling: string;
    valence: EmotionalValence;
  };
  aiHypothesis?: string;
  reflectionRating?: number;
}

export interface SomaticMapping {
  id: string;
  userId: string;
  sensationPattern: BodyRegionSensation[];
  predictedEmotion: string;
  confidence: number;
  occurrences: number;
  lastValidatedAt?: Date;
}

export interface SleepLog {
  id: string;
  userId: string;
  date: Date;
  durationHours: number;
  qualityScore: number;
  source: 'manual' | 'apple_health' | 'google_fit';
}

export interface Space {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export interface SpaceScan {
  id: string;
  spaceId: string;
  userId: string;
  beforePhotoUri: string;
  afterPhotoUri?: string;
  scannedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface DetectedItem {
  id: string;
  scanId: string;
  label: string;
  confidence: number;
  decision: 'keep' | 'donate' | 'trash' | 'sell' | 'undecided';
  decidedAt?: Date;
  estimatedValueCents?: number;
  category?: string;
}

export interface DeclutterSprint {
  id: string;
  userId: string;
  scanId: string;
  startedAt: Date;
  completedAt?: Date;
  itemsKept: number;
  itemsDonated: number;
  itemsTrashed: number;
  itemsSold: number;
  totalItems: number;
  emotionalCheckInBeforeId?: string;
  emotionalCheckInAfterId?: string;
  celebrationTriggered: boolean;
}
