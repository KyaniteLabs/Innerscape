/**
 * APEX Contract: Activities Route
 * Aggregates recent activity across all domains
 * GET / - Returns unified activity feed
 */
import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { captures, emotionalContext, journalEntries, goals } from '../db/schema';
import type { HonoEnv } from '../types';

// Named constants (APEX: No Magic)
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ITEMS_PER_SOURCE = 5;

interface Activity {
  id: string;
  userId: string;
  type: 'capture' | 'checkin' | 'journal' | 'goal';
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const activities = new Hono<HonoEnv>();

/**
 * APEX Contract: Get Recent Activities
 * Inputs: query.limit (optional, default 20, max 100)
 * Outputs: ApiResponse<Activity[]>
 * Errors: DATABASE_ERROR
 * Edge cases: Empty data, large limit values
 */
activities.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    
    // Input validation with safe bounds (APEX: Safe Defaults)
    const rawLimit = parseInt(c.req.query('limit') ?? String(DEFAULT_LIMIT));
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

    // Parallel fetch from all sources
    const [recentCaptures, recentCheckins, recentJournals, recentGoals] = await Promise.all([
      db.select().from(captures).where(eq(captures.userId, userId)).orderBy(desc(captures.createdAt)).limit(ITEMS_PER_SOURCE),
      db.select().from(emotionalContext).where(eq(emotionalContext.userId, userId)).orderBy(desc(emotionalContext.timestamp)).limit(ITEMS_PER_SOURCE),
      db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt)).limit(ITEMS_PER_SOURCE),
      db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt)).limit(ITEMS_PER_SOURCE),
    ]);

    // Transform to unified format
    const allActivities: Activity[] = [
      ...recentCaptures.map(c => ({
        id: c.id,
        userId: c.userId,
        type: 'capture' as const,
        description: `Captured: ${c.content.substring(0, 50)}${c.content.length > 50 ? '...' : ''}`,
        timestamp: c.createdAt,
        metadata: { captureType: c.type, status: c.status },
      })),
      ...recentCheckins.map(c => ({
        id: c.id,
        userId: c.userId,
        type: 'checkin' as const,
        description: `Check-in: ${c.dominantFeeling} (Energy: ${c.energy}/100)`,
        timestamp: c.timestamp,
        metadata: { energy: c.energy, valence: c.valence },
      })),
      ...recentJournals.map(j => ({
        id: j.id,
        userId: j.userId,
        type: 'journal' as const,
        description: `Journal: ${j.content.substring(0, 50)}${j.content.length > 50 ? '...' : ''}`,
        timestamp: j.createdAt,
        metadata: { source: j.transcriptionSource },
      })),
      ...recentGoals.map(g => ({
        id: g.id,
        userId: g.userId,
        type: 'goal' as const,
        description: `Goal: ${g.title} (${g.progress}%)`,
        timestamp: g.createdAt,
        metadata: { progress: g.progress, status: g.status },
      })),
    ];

    // Sort by timestamp and limit
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ success: true, data: allActivities.slice(0, limit) });

  } catch (error) {
    console.error('[APEX] GET /activities error:', error instanceof Error ? error.message : error);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to fetch activities' }
    }, 500);
  }
});

export default activities;
