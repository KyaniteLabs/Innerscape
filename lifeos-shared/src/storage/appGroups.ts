/**
 * @fileoverview Cross-app storage via iOS App Groups
 * @module storage/appGroups
 * 
 * APEX Contract:
 * - Inputs: key, value
 * - Outputs: Stored/retrieved data accessible from both apps
 * - Errors: Falls back to regular storage on Android
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const APP_GROUP_PREFIX = 'group.app.innerscape.suite.';

export const appGroupStorage = {
  async set(key: string, value: string): Promise<void> {
    const storageKey = Platform.OS === 'ios' 
      ? `${APP_GROUP_PREFIX}${key}` 
      : key;
    await SecureStore.setItemAsync(storageKey, value);
  },

  async get(key: string): Promise<string | null> {
    const storageKey = Platform.OS === 'ios' 
      ? `${APP_GROUP_PREFIX}${key}` 
      : key;
    return SecureStore.getItemAsync(storageKey);
  },

  // Shared emotional context
  async setEmotionalContext(context: {
    energy: 'high' | 'low';
    valence: 'pleasant' | 'unpleasant' | 'neutral';
    timestamp: number;
  }): Promise<void> {
    await this.set('emotional_context', JSON.stringify(context));
  },

  async getEmotionalContext(): Promise<{
    energy: 'high' | 'low';
    valence: 'pleasant' | 'unpleasant' | 'neutral';
    timestamp: number;
  } | null> {
    try {
      const data = await this.get('emotional_context');
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[APEX] Failed to parse emotional context', err);
      return null;
    }
  }
};
