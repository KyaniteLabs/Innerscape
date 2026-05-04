/**
 * @fileoverview Background health data sync task (STUB)
 * @module lib/health/backgroundSync
 * 
 * APEX Contract:
 * - This is a stub for Expo Go compatibility
 * - Real implementation requires expo-background-fetch and expo-task-manager
 * - Those packages require a development build (not Expo Go)
 * 
 * TODO Phase 3: Install native packages and implement real background sync
 */

/**
 * Register the background health sync task (STUB)
 * In Expo Go, this is a no-op
 */
export async function registerBackgroundSync(): Promise<void> {
  console.log('[APEX] Background sync is disabled in Expo Go');
  // Real implementation requires development build
}

/**
 * Unregister the background task (STUB)
 */
export async function unregisterBackgroundSync(): Promise<void> {
  console.log('[APEX] Background sync unregister is a no-op in Expo Go');
}
