/**
 * @fileoverview Background health data sync task
 * @module lib/health/backgroundSync
 * 
 * APEX Contract:
 * - Inputs: None (runs automatically via TaskManager)
 * - Outputs: Health data synced to backend
 * - Errors: Failed syncs logged, retried on next cycle
 * 
 * Setup:
 * 1. Call registerBackgroundSync() on app launch
 * 2. Task runs every 60 minutes in background
 * 3. Works when app is suspended or terminated
 * 4. Requires development build (not Expo Go)
 * 
 * TODO Phase 3: Install expo-background-fetch and expo-task-manager
 */

// @ts-ignore - Packages installed in Phase 3
import * as BackgroundFetch from 'expo-background-fetch';
// @ts-ignore - Packages installed in Phase 3
import * as TaskManager from 'expo-task-manager';
import { healthService } from './healthService';

// APEX: Task name must be unique across the app
const HEALTH_SYNC_TASK = 'LIFEOS_HEALTH_SYNC_TASK';

/**
 * Define the background task
 */
TaskManager.defineTask(HEALTH_SYNC_TASK, async () => {
  try {
    console.log(`[APEX] Background health sync started at ${new Date().toISOString()}`);

    // Create a minimal API client in background context
    // Note: In production, you'd want to use a proper API client with auth
    const mockApiClient = {
      async post(path: string, data: unknown) {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL || 'https://api.innerscape.app/api'}${path}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // TODO: Add auth token from secure storage
            },
            body: JSON.stringify(data),
          }
        );
        return response.ok;
      },
    };

    // Sync health data
    const result = await healthService.syncToBackend(mockApiClient);

    console.log(
      `[APEX] Background health sync complete: ${result.synced} records synced, ${result.errors.length} errors`
    );

    // Return success if any data was synced or no errors
    return result.synced > 0 || result.errors.length === 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.Failed;
  } catch (error) {
    console.error('[APEX] Background health sync error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background health sync task
 * Call this on app launch
 */
export async function registerBackgroundSync() {
  try {
    // Check if background fetch is available
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      console.log('[APEX] Registering background health sync task');

      await BackgroundFetch.registerTaskAsync(HEALTH_SYNC_TASK, {
        minimumInterval: 60 * 60, // 60 minutes
        stopOnTerminate: false, // Continue after app termination
        startOnBoot: true, // Start after device restart
      });

      console.log('[APEX] Background health sync registered successfully');
    } else if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.warn('[APEX] Background fetch restricted by system');
    } else {
      console.warn('[APEX] Background fetch not available');
    }
  } catch (error) {
    console.error('[APEX] Failed to register background sync:', error);
  }
}

/**
 * Unregister the background task (e.g., on logout)
 */
export async function unregisterBackgroundSync() {
  try {
    console.log('[APEX] Unregistering background health sync task');
    await BackgroundFetch.unregisterTaskAsync(HEALTH_SYNC_TASK);
  } catch (error) {
    console.error('[APEX] Failed to unregister background sync:', error);
  }
}
