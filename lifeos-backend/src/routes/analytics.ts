import { Hono } from 'hono';
import { habitCompletions, habits, emotionalContext, sleepRecords } from '../db/schema';
import { eq, desc, and, gte, count, sql } from 'drizzle-orm';
import type { HonoEnv, ApiResponse } from '../types';

const analytics = new Hono<HonoEnv>();

/**
 * APEX Contract: Analytics Routes
 * 
 * Purpose: Compute and deliver analytics insights from historical data
 * - Streaks: Compute habit consistency metrics
 * - Correlations: Identify relationships between health, mood, and habits
 * - Trends: Time-series data for visualization
 */

// ============================================================================
// TYPES
// ============================================================================

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastCompletedDate: string | null;
  history: string[]; // ISO dates of completed days
}

interface CorrelationData {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-1, Pearson correlation coefficient approximation
  description: string;
}

interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate streak from completion dates
 * Returns current streak from today going backwards
 */
function calculateCurrentStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates
    .map(d => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .sort((a, b) => b - a);

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const completedTime of sortedDates) {
    if (currentDate.getTime() - completedTime === 24 * 60 * 60 * 1000 || streak === 0) {
      // Either this is the first match or it's the day before the previous match
      if (streak === 0 && currentDate.getTime() !== completedTime) {
        // Current day not completed, so streak is 0
        break;
      }
      streak++;
      currentDate.setTime(completedTime);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Simple Pearson correlation coefficient (0-1, where 1 = perfect correlation)
 * For demo purposes, using simplified calculation
 */
function correlationCoefficient(x: number[], y: number[]): number {
  if (x.length < 3 || x.length !== y.length) return 0;

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
  const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));

  if (denomX === 0 || denomY === 0) return 0;
  return Math.abs(numerator / (denomX * denomY));
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /analytics/streaks
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: { currentStreak, longestStreak, totalDays, lastCompletedDate, history[] }
 * - Errors: DATABASE_ERROR
 */
analytics.get('/streaks', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');

    // Fetch all habit completions for this user
    const completions = await db
      .select({
        completedAt: habitCompletions.completedAt,
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
      .where(eq(habits.userId, userId))
      .orderBy(desc(habitCompletions.completedAt));

    // Group by date and get unique dates
    const completedDates = completions.map((c) => new Date(c.completedAt));
    const uniqueDates = Array.from(
      new Map(
        completedDates.map((d) => {
          const dateStr = d.toISOString().split('T')[0];
          return [dateStr, d];
        })
      ).values()
    );

    // Calculate streaks
    const currentStreak = calculateCurrentStreak(completedDates);
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = uniqueDates
      .map((d) => {
        const copy = new Date(d);
        copy.setHours(0, 0, 0, 0);
        return copy.getTime();
      })
      .sort((a, b) => a - b);

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0 || sortedDates[i] - sortedDates[i - 1] === 24 * 60 * 60 * 1000) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Last 30 dates
    const historyDates = uniqueDates
      .slice(0, 30)
      .map((d) => d.toISOString().split('T')[0]);

    const lastCompletedDate =
      completedDates.length > 0 ? completedDates[0].toISOString().split('T')[0] : null;

    const data: StreakData = {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalDays: uniqueDates.length,
      lastCompletedDate,
      history: historyDates,
    };

    return c.json({ success: true, data });
  } catch (error) {
    console.error('[APEX] GET /analytics/streaks error:', error);
    return c.json(
      {
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to compute streaks' },
      },
      500
    );
  }
});

/**
 * GET /analytics/correlations
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: CorrelationData[]
 * - Errors: DATABASE_ERROR, INSUFFICIENT_DATA
 */
analytics.get('/correlations', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');

    const correlations: CorrelationData[] = [];

    // Require at least 14 days of data
    const today = new Date();
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // ========================================================================
    // CORRELATION 1: Sleep Quality vs Next Day Habit Completion Rate
    // ========================================================================
    const sleepData = await db
      .select({
        date: sql`DATE(${sleepRecords.startTime})`,
        quality: sleepRecords.quality,
      })
      .from(sleepRecords)
      .where(and(eq(sleepRecords.userId, userId), gte(sleepRecords.startTime, twoWeeksAgo)))
      .orderBy(sql`DATE(${sleepRecords.startTime})`);

    const habitCompletionsByDay = await db
      .select({
        date: sql`DATE(${habitCompletions.completedAt})`,
        count: count(),
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
      .where(and(eq(habits.userId, userId), gte(habitCompletions.completedAt, twoWeeksAgo)))
      .groupBy(sql`DATE(${habitCompletions.completedAt})`);

    // Build arrays for correlation calculation
    const sleepQualities = sleepData.map((s) => (s.quality ?? 50) / 100);
    const completionCounts = habitCompletionsByDay.map((h) => (h.count ?? 0) / 5); // Normalize to 0-1

    if (sleepQualities.length >= 3 && completionCounts.length >= 3) {
      const strength = correlationCoefficient(sleepQualities, completionCounts);
      if (strength > 0.3) {
        correlations.push({
          factor: 'Sleep Quality vs Habit Completion',
          impact: strength > 0.5 ? 'positive' : 'positive',
          strength: Math.min(strength, 1),
          description:
            strength > 0.7
              ? 'Higher sleep quality strongly correlates with more completed habits the next day.'
              : strength > 0.5
                ? 'Better sleep tends to lead to more habit completions.'
                : 'There is a moderate relationship between sleep and habit completion rate.',
        });
      }
    }

    // ========================================================================
    // CORRELATION 2: Energy Level vs Habit Preference
    // ========================================================================
    const energyByHabit = await db
      .select({
        preferredEnergy: habits.preferredEnergy,
        count: count(),
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
      .where(and(eq(habits.userId, userId), gte(habitCompletions.completedAt, twoWeeksAgo)))
      .groupBy(habits.preferredEnergy);

    if (energyByHabit.length >= 2) {
      const avgEnergyMatch = energyByHabit
        .filter((h) => h.preferredEnergy !== null)
        .reduce((sum, h) => sum + (h.count ?? 0), 0) / (energyByHabit.reduce((sum, h) => sum + (h.count ?? 0), 0) || 1);

      if (avgEnergyMatch > 0.3) {
        correlations.push({
          factor: 'Energy Alignment',
          impact: 'positive',
          strength: Math.min(avgEnergyMatch, 1),
          description:
            'You tend to complete habits that match your current energy level. Consider aligning more tasks with your natural rhythm.',
        });
      }
    }

    // ========================================================================
    // CORRELATION 3: Mood Stability vs Weekly Consistency
    // ========================================================================
    const moodData = await db
      .select({
        valence: emotionalContext.valence,
        energy: emotionalContext.energy,
        timestamp: emotionalContext.timestamp,
      })
      .from(emotionalContext)
      .where(and(eq(emotionalContext.userId, userId), gte(emotionalContext.timestamp, twoWeeksAgo)))
      .orderBy(emotionalContext.timestamp);

    if (moodData.length >= 5) {
      const moodStability = moodData.reduce((sum, m) => sum + Math.abs(m.valence ?? 0), 0) / moodData.length;
      const moodVariability = 1 - Math.min(moodStability / 100, 1);

      if (moodVariability < 0.8) {
        correlations.push({
          factor: 'Mood Stability',
          impact: 'positive',
          strength: 1 - moodVariability,
          description:
            'You maintain relatively stable moods throughout the week, which supports consistent habit completion and well-being.',
        });
      }
    }

    // If we have fewer than 2 correlations, return with a message
    if (correlations.length === 0) {
      return c.json({
        success: true,
        data: [],
        message: 'Insufficient data to compute correlations. Continue logging for 2+ weeks.',
      });
    }

    return c.json({ success: true, data: correlations });
  } catch (error) {
    console.error('[APEX] GET /analytics/correlations error:', error);
    return c.json(
      {
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to compute correlations' },
      },
      500
    );
  }
});

/**
 * GET /analytics/trends?metric=mood|energy|habits&days=7|30|90
 * 
 * APEX Contract:
 * - Inputs: metric (query), days (query, default=7)
 * - Outputs: TrendPoint[] (with date and value)
 * - Errors: VALIDATION_ERROR, DATABASE_ERROR
 */
analytics.get('/trends', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.get('db');
    const metric = (c.req.query('metric') || 'habits') as string;
    const daysParam = parseInt(c.req.query('days') || '7');
    const days = Math.min(Math.max(daysParam, 1), 365); // Clamp 1-365

    // Validate metric
    const validMetrics = ['mood', 'energy', 'habits', 'sleep'];
    if (!validMetrics.includes(metric)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
          },
        },
        400
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trends: TrendPoint[] = [];

    if (metric === 'habits') {
      // Habit completions per day
      const data = await db
        .select({
          date: sql`DATE(${habitCompletions.completedAt})`,
          count: count(),
        })
        .from(habitCompletions)
        .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
        .where(and(eq(habits.userId, userId), gte(habitCompletions.completedAt, startDate)))
        .groupBy(sql`DATE(${habitCompletions.completedAt})`);

      // Fill in missing dates with 0
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = data.find((d) => d.date === dateStr);
        trends.push({
          date: dateStr,
          value: found ? (found.count ?? 0) : 0,
          label: found ? `${found.count} completed` : 'No habits',
        });
      }
    } else if (metric === 'mood') {
      // Average valence (mood positivity) per day
      const data = await db
        .select({
          date: sql`DATE(${emotionalContext.timestamp})`,
          avgValence: sql<number>`AVG(${emotionalContext.valence})`,
        })
        .from(emotionalContext)
        .where(and(eq(emotionalContext.userId, userId), gte(emotionalContext.timestamp, startDate)))
        .groupBy(sql`DATE(${emotionalContext.timestamp})`);

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = data.find((d) => d.date === dateStr);
        // Normalize valence from -100..100 to 0..1
        const normalizedValue = found ? ((found.avgValence ?? 0) + 100) / 200 : 0.5;
        trends.push({
          date: dateStr,
          value: Math.round(normalizedValue * 100) / 100,
          label: found ? `Valence: ${Math.round(found.avgValence ?? 0)}` : 'No data',
        });
      }
    } else if (metric === 'energy') {
      // Average energy level per day
      const data = await db
        .select({
          date: sql`DATE(${emotionalContext.timestamp})`,
          avgEnergy: sql<number>`AVG(${emotionalContext.energy})`,
        })
        .from(emotionalContext)
        .where(and(eq(emotionalContext.userId, userId), gte(emotionalContext.timestamp, startDate)))
        .groupBy(sql`DATE(${emotionalContext.timestamp})`);

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = data.find((d) => d.date === dateStr);
        // Normalize energy from 0..100 to 0..1
        const normalizedValue = found ? (found.avgEnergy ?? 50) / 100 : 0.5;
        trends.push({
          date: dateStr,
          value: Math.round(normalizedValue * 100) / 100,
          label: found ? `Energy: ${Math.round(found.avgEnergy ?? 0)}` : 'No data',
        });
      }
    } else if (metric === 'sleep') {
      // Average sleep duration (hours) per day
      const data = await db
        .select({
          date: sql`DATE(${sleepRecords.startTime})`,
          avgDuration: sql<number>`AVG((CAST(julianday(${sleepRecords.endTime}) AS REAL) - CAST(julianday(${sleepRecords.startTime}) AS REAL)) * 24)`,
        })
        .from(sleepRecords)
        .where(and(eq(sleepRecords.userId, userId), gte(sleepRecords.startTime, startDate)))
        .groupBy(sql`DATE(${sleepRecords.startTime})`);

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = data.find((d) => d.date === dateStr);
        const value = found ? (found.avgDuration ?? 0) : 0;
        trends.push({
          date: dateStr,
          value: Math.round(value * 10) / 10, // Round to 1 decimal
          label: found ? `${Math.round(value * 10) / 10}h` : 'No data',
        });
      }
    }

    return c.json({ success: true, data: trends });
  } catch (error) {
    console.error('[APEX] GET /analytics/trends error:', error);
    return c.json(
      {
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch trends' },
      },
      500
    );
  }
});

export default analytics;
