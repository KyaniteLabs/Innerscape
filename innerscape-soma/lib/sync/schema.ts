import { Schema, Table, Column, ColumnType } from '@powersync/react-native';

/**
 * @fileoverview PowerSync Schema for Soma
 * @module lib/sync/schema
 * 
 * APEX Contract:
 * - Syncs somatic data with Turso via PowerSync
 * - Matches lifeos-backend/src/db/schema.ts
 */

export const SCHEMA = new Schema([
  new Table({
    name: 'emotional_context',
    columns: [
      new Column({ name: 'user_id', type: ColumnType.TEXT }),
      new Column({ name: 'energy', type: ColumnType.INTEGER }),
      new Column({ name: 'valence', type: ColumnType.INTEGER }),
      new Column({ name: 'dominant_feeling', type: ColumnType.TEXT }),
      new Column({ name: 'body_sensation', type: ColumnType.TEXT }),
      new Column({ name: 'timestamp', type: ColumnType.INTEGER }),
    ],
  }),
  new Table({
    name: 'activities',
    columns: [
      new Column({ name: 'user_id', type: ColumnType.TEXT }),
      new Column({ name: 'action', type: ColumnType.TEXT }),
      new Column({ name: 'entity_type', type: ColumnType.TEXT }),
      new Column({ name: 'entity_id', type: ColumnType.TEXT }),
      new Column({ name: 'content', type: ColumnType.TEXT }),
      new Column({ name: 'timestamp', type: ColumnType.INTEGER }),
    ],
  }),
]);
