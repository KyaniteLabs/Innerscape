/**
 * @fileoverview Unified Health Service
 * @module lib/health/healthService
 * 
 * APEX Contract:
 * - Inputs: None (reads from native health APIs)
 * - Outputs: SleepRecord[], HealthMetric[], or empty arrays on error
 * - Errors: Handled gracefully with console logging
 * 
 * Platform Support:
 * - iOS: HealthKit via react-native-health
 * - Android: Health Connect via expo-health-connect
 * - Fallback: Empty arrays for unsupported platforms
 * 
 * Note: Requires development build (not Expo Go)
 */

import { Platform } from 'react-native';
import { SleepRecord, HealthMetric, HealthSyncResult } from './types';

// Platform-specific imports
let platformService: any;

if (Platform.OS === 'ios') {
  // Use require to avoid import errors on Android
  try {
    platformService = require('./healthService.ios').default;
  } catch {
    platformService = null;
  }
} else if (Platform.OS === 'android') {
  // Use require to avoid import errors on iOS
  try {
    platformService = require('./healthService.android').default;
  } catch {
    platformService = null;
  }
}

/**
 * Unified health service with platform-specific implementations
 */
export const healthService = {
  /**
   * Request health data permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (platformService?.requestPermissions) {
        return await platformService.requestPermissions();
      }
      console.log('[APEX] Platform not supported for health permissions');
      return false;
    } catch (error) {
      console.error('[APEX] Health permission error:', error);
      return false;
    }
  },

  /**
   * Fetch sleep records
   */
  async getSleepData(days: number = 7): Promise<SleepRecord[]> {
    try {
      if (platformService?.getSleepData) {
        return await platformService.getSleepData(days);
      }
      return [];
    } catch (error) {
      console.error('[APEX] Sleep data fetch error:', error);
      return [];
    }
  },

  /**
   * Fetch heart rate variability data
   */
  async getHRV(days: number = 7): Promise<HealthMetric[]> {
    try {
      if (platformService?.getHRV) {
        return await platformService.getHRV(days);
      }
      return [];
    } catch (error) {
      console.error('[APEX] HRV fetch error:', error);
      return [];
    }
  },

  /**
   * Fetch step count data
   */
  async getSteps(days: number = 7): Promise<HealthMetric[]> {
    try {
      if (platformService?.getSteps) {
        return await platformService.getSteps(days);
      }
      return [];
    } catch (error) {
      console.error('[APEX] Steps fetch error:', error);
      return [];
    }
  },

  /**
   * Sync all health data to backend
   */
  async syncToBackend(apiClient: any): Promise<HealthSyncResult> {
    try {
      console.log('[APEX] Starting health data sync to backend');

      const timestamp = new Date();
      let synced = 0;
      const errors: string[] = [];

      // Fetch health data from native APIs
      const [sleepData, hrvData, stepsData] = await Promise.all([
        this.getSleepData(7),
        this.getHRV(7),
        this.getSteps(7),
      ]);

      // Sync sleep data
      for (const record of sleepData) {
        try {
          await apiClient.post('/health/sleep', {
            startTime: record.startTime.toISOString(),
            endTime: record.endTime.toISOString(),
            quality: record.quality ?? null,
            source: record.source,
          });
          synced++;
        } catch (error) {
          errors.push(`Sleep sync failed: ${error}`);
        }
      }

      // Sync metrics (HRV + Steps)
      const allMetrics = [...hrvData, ...stepsData];
      for (const metric of allMetrics) {
        try {
          await apiClient.post('/health/metrics', {
            type: metric.type,
            value: metric.value,
            timestamp: metric.timestamp.toISOString(),
          });
          synced++;
        } catch (error) {
          errors.push(`Metric sync failed: ${error}`);
        }
      }

      console.log(`[APEX] Health sync complete: ${synced} records, ${errors.length} errors`);

      return { synced, errors, timestamp };
    } catch (error) {
      console.error('[APEX] Health sync error:', error);
      return { synced: 0, errors: [String(error)], timestamp: new Date() };
    }
  },

  /**
   * Check if health services are available
   */
  async isAvailable(): Promise<boolean> {
    if (!platformService) {
      console.log('[APEX] No platform health service available');
      return false;
    }

    try {
      if (Platform.OS === 'ios') {
        return await platformService.isHealthKitAvailable?.();
      } else if (Platform.OS === 'android') {
        return await platformService.isHealthConnectAvailable?.();
      }
      return false;
    } catch (error) {
      console.error('[APEX] Health service availability check failed:', error);
      return false;
    }
  },
};

export type { SleepRecord, HealthMetric, HealthSyncResult };
