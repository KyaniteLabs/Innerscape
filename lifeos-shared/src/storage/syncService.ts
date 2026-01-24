import { PowerSyncDatabase } from '@powersync/react-native';
import { SCHEMA } from '../../../innerscape-soma/lib/sync/schema'; // Reference the schema

/**
 * @fileoverview Shared PowerSync Service
 * @module storage/syncService
 * 
 * APEX Contract:
 * - Provides unified sync logic for Turso/PowerSync
 */

export const createSyncService = (db: PowerSyncDatabase) => {
  return {
    async connect(token: string) {
      console.log('[APEX] Connecting to PowerSync');
      try {
        await (db as any).connect({
          fetchToken: async () => token,
          endpoint: 'https://powersync.innerscape.app'
        });
      } catch (err) {
        console.error('[APEX] PowerSync connection failed', err);
      }
    },

    async disconnect() {
      await db.disconnect();
    },

    // Helper to log activities cross-app
    async recordActivity(activity: {
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      content?: string;
    }) {
      await db.execute(
        'INSERT INTO activities (id, user_id, action, entity_type, entity_id, content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          crypto.randomUUID(),
          activity.userId,
          activity.action,
          activity.entityType,
          activity.entityId,
          activity.content || null,
          Date.now()
        ]
      );
    }
  };
};
