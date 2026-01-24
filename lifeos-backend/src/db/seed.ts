import { createDb } from './index';
import * as schema from './schema';

/**
 * @fileoverview Database seed script for testing
 * @module db/seed
 * 
 * Usage: 
 * export TURSO_CONNECTION_URL=...
 * export TURSO_AUTH_TOKEN=...
 * npx tsx src/db/seed.ts
 */

async function seed() {
  console.log('[APEX] Starting database seed...');
  
  const env = {
    TURSO_CONNECTION_URL: process.env.TURSO_CONNECTION_URL!,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN!,
  };

  if (!env.TURSO_CONNECTION_URL) {
    console.error('[APEX] Missing TURSO_CONNECTION_URL');
    process.exit(1);
  }

  const db = createDb(env as any);

  const testUserId = 'user_2test_tester_12345'; // Example Clerk ID

  try {
    // 1. Seed User
    await db.insert(schema.users).values({
      id: testUserId,
      email: 'tester@innerscape.app',
      createdAt: new Date(),
    }).onConflictDoNothing();

    // 2. Seed Captures
    await db.insert(schema.captures).values([
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        content: 'Read "Atomic Habits" summary',
        type: 'task',
        status: 'inbox',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        content: 'Project Idea: AI-driven habit coach',
        type: 'idea',
        status: 'inbox',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // 3. Seed Habits
    await db.insert(schema.habits).values([
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        name: 'Morning Somatic Check-in',
        frequency: 'daily',
        preferredEnergy: 80,
        streak: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        name: 'Evening Reflection',
        frequency: 'daily',
        preferredEnergy: 30,
        streak: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // 4. Seed Goals
    await db.insert(schema.goals).values([
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        title: 'Launch Innerscape Suite',
        description: 'Complete all phases of the remediation plan',
        progress: 90,
        status: 'active',
        category: 'work',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // 5. Seed Initial Activity
    await db.insert(schema.activities).values([
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        action: 'captured',
        entityType: 'task',
        entityId: 'initial-task',
        content: 'Setup test account',
        timestamp: new Date(),
      }
    ]);

    console.log('[APEX] Seeding complete! Test user ID:', testUserId);
  } catch (error) {
    console.error('[APEX] Seeding failed:', error);
  }
}

seed();
