/**
 * @fileoverview Shared health service types
 * @module lib/health/types
 */

export interface SleepRecord {
  startTime: Date;
  endTime: Date;
  quality?: number;
  source: 'apple_health' | 'google_fit' | 'manual';
}

export interface HealthMetric {
  type: 'steps' | 'hrv' | 'heart_rate';
  value: number;
  timestamp: Date;
}

export interface HealthSyncResult {
  synced: number;
  errors: string[];
  timestamp: Date;
}
