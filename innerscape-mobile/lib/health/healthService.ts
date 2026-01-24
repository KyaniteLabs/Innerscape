import { Platform } from 'react-native';

/**
 * APEX Contract: Health Service
 * Purpose: Unified interface for HealthKit (iOS) and Health Connect (Android)
 * Status: Stubbed for Phase 1
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

export const healthService = {
  /**
   * Request health permissions
   */
  async requestPermissions(): Promise<boolean> {
    console.log('[APEX] Health permissions requested');
    // Implementation requires native modules and dev client
    return true;
  },

  /**
   * Fetch sleep data
   */
  async getSleepData(days: number = 7): Promise<SleepRecord[]> {
    console.log('[APEX] Fetching sleep data for', days, 'days');
    return [];
  },

  /**
   * Fetch steps
   */
  async getSteps(days: number = 7): Promise<HealthMetric[]> {
    console.log('[APEX] Fetching steps for', days, 'days');
    return [];
  },

  /**
   * Sync health data to backend
   */
  async syncToBackend(apiClient: any): Promise<void> {
    try {
      const sleepData = await this.getSleepData();
      
      for (const record of sleepData) {
        await apiClient.post('/health/sleep', {
          startTime: record.startTime.toISOString(),
          endTime: record.endTime.toISOString(),
          quality: record.quality,
          source: record.source,
        });
      }
      
      console.log('[APEX] Health data synced to backend');
    } catch (error) {
      console.error('[APEX] Health sync failed:', error);
    }
  },
};
