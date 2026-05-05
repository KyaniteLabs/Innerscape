import { prisma } from '../db.js';
import type { EmotionalCheckIn, SleepLog, Habit } from '@prisma/client';

interface InsightCandidate {
  type: string;
  title: string;
  description: string;
  confidence: number;
  dataPoints: string[];
}

export async function generateInsights(userId: string): Promise<InsightCandidate[]> {
  const insights: InsightCandidate[] = [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [checkIns, habits, sleepLogs, journalCount] = await Promise.all([
    prisma.emotionalCheckIn.findMany({
      where: { userId, timestamp: { gte: twoWeeksAgo } },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.sleepLog.findMany({
      where: { userId, date: { gte: twoWeeksAgo } },
      orderBy: { date: 'desc' },
    }),
    prisma.journalEntry.count({
      where: { userId, createdAt: { gte: weekAgo } },
    }),
  ]);

  // --- Energy Pattern Detection ---
  insights.push(...detectEnergyPatterns(checkIns));

  // --- Sleep-Energy Correlation ---
  insights.push(...detectSleepEnergyCorrelation(checkIns, sleepLogs));

  // --- Habit Streak Insights ---
  insights.push(...detectHabitInsights(habits));

  // --- Journaling Consistency ---
  if (journalCount === 0) {
    insights.push({
      type: 'journal_prompt',
      title: 'No journal entries this week',
      description: 'Writing even a single sentence can help process emotions and spot patterns. Try a quick entry today.',
      confidence: 0.6,
      dataPoints: ['journal_count_0'],
    });
  } else if (journalCount >= 5) {
    insights.push({
      type: 'journal_consistency',
      title: 'Strong journaling streak',
      description: `You've written ${journalCount} entries this week. Consistent reflection builds self-awareness over time.`,
      confidence: 0.8,
      dataPoints: [`journal_count_${journalCount}`],
    });
  }

  // --- Emotional Valence Patterns ---
  insights.push(...detectValencePatterns(checkIns));

  // --- Check-in Frequency ---
  const recentCheckIns = checkIns.filter((c) => c.timestamp >= weekAgo);
  if (recentCheckIns.length === 0) {
    insights.push({
      type: 'checkin_reminder',
      title: 'No check-ins this week',
      description: 'Regular emotional check-ins help you track patterns. Even one check-in gives your future self valuable data.',
      confidence: 0.5,
      dataPoints: ['no_recent_checkins'],
    });
  }

  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

function detectEnergyPatterns(checkIns: EmotionalCheckIn[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];
  if (checkIns.length < 3) return insights;

  const recent = checkIns.slice(0, 7);
  const avgEnergy = recent.reduce((sum, c) => sum + c.energyLevel, 0) / recent.length;

  // Afternoon energy dip
  const afternoon = recent.filter((c) => {
    const h = new Date(c.timestamp).getHours();
    return h >= 13 && h <= 16;
  });
  const morning = recent.filter((c) => {
    const h = new Date(c.timestamp).getHours();
    return h >= 8 && h <= 12;
  });

  if (afternoon.length >= 2 && morning.length >= 2) {
    const afternoonAvg = afternoon.reduce((s, c) => s + c.energyLevel, 0) / afternoon.length;
    const morningAvg = morning.reduce((s, c) => s + c.energyLevel, 0) / morning.length;

    if (morningAvg - afternoonAvg > 20) {
      insights.push({
        type: 'energy_dip',
        title: 'Afternoon energy dip detected',
        description: `Your energy drops ~${Math.round(morningAvg - afternoonAvg)} points between morning and afternoon. Consider a dopamine menu activity or short break around 1-2pm.`,
        confidence: 0.75,
        dataPoints: [`morning_avg_${Math.round(morningAvg)}`, `afternoon_avg_${Math.round(afternoonAvg)}`],
      });
    }
  }

  // Sustained low energy
  if (avgEnergy < 35 && recent.length >= 3) {
    insights.push({
      type: 'low_energy_sustained',
      title: 'Energy has been low this week',
      description: `Average energy is ${Math.round(avgEnergy)}/100. This could indicate poor sleep, burnout, or a need for recovery activities. Check your sleep logs.`,
      confidence: 0.7,
      dataPoints: [`avg_energy_${Math.round(avgEnergy)}`, `samples_${recent.length}`],
    });
  }

  // Energy trend (improving or declining)
  if (checkIns.length >= 6) {
    const firstHalf = checkIns.slice(-3);
    const secondHalf = checkIns.slice(0, 3);
    const firstAvg = firstHalf.reduce((s, c) => s + c.energyLevel, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, c) => s + c.energyLevel, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;

    if (Math.abs(diff) > 15) {
      const direction = diff > 0 ? 'up' : 'down';
      insights.push({
        type: `energy_trend_${direction}`,
        title: `Energy trending ${direction}`,
        description: diff > 0
          ? `Your energy has been climbing (~${Math.round(diff)} points). Keep doing what's working.`
          : `Your energy has been declining (~${Math.abs(Math.round(diff))} points). Consider adjusting your routine or adding rest.`,
        confidence: 0.65,
        dataPoints: [`trend_${direction}`, `delta_${Math.round(diff)}`],
      });
    }
  }

  return insights;
}

function detectSleepEnergyCorrelation(checkIns: EmotionalCheckIn[], sleepLogs: SleepLog[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];
  if (sleepLogs.length < 3 || checkIns.length < 3) return insights;

  // Poor sleep → low energy next day
  const poorSleepDays = sleepLogs.filter((s) => s.qualityScore <= 2);
  if (poorSleepDays.length >= 2) {
    const avgPoorSleepDuration = poorSleepDays.reduce((s, l) => s + l.durationHours, 0) / poorSleepDays.length;

    insights.push({
      type: 'sleep_quality_low',
      title: 'Sleep quality has been poor',
      description: `${poorSleepDays.length} nights with low sleep quality in the past 2 weeks. Average duration: ${avgPoorSleepDuration.toFixed(1)}h. Poor sleep impacts focus and emotional regulation.`,
      confidence: 0.8,
      dataPoints: [`poor_nights_${poorSleepDays.length}`, `avg_duration_${avgPoorSleepDuration.toFixed(1)}`],
    });
  }

  // Short sleep pattern
  const shortSleep = sleepLogs.filter((s) => s.durationHours < 6);
  if (shortSleep.length >= 3) {
    insights.push({
      type: 'sleep_short',
      title: 'Consistently under 6 hours of sleep',
      description: `${shortSleep.length} nights under 6 hours in 2 weeks. Chronic sleep debt reduces cognitive performance and increases emotional reactivity.`,
      confidence: 0.85,
      dataPoints: [`short_nights_${shortSleep.length}`],
    });
  }

  return insights;
}

function detectHabitInsights(habits: Habit[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];
  if (habits.length === 0) return insights;

  // Streak milestones
  const longStreaks = habits.filter((h) => h.streak >= 7 && h.streak === h.longestStreak);
  if (longStreaks.length > 0) {
    const best = longStreaks.reduce((a, b) => (a.streak > b.streak ? a : b));
    insights.push({
      type: 'habit_record',
      title: `New record: ${best.name}`,
      description: `You're on a ${best.streak}-day streak — your all-time best! This consistency is building real neural pathways.`,
      confidence: 0.9,
      dataPoints: [`habit_${best.id}`, `streak_${best.streak}`],
    });
  }

  // Multiple active habits
  const activeHabits = habits.filter((h) => h.streak > 0);
  if (activeHabits.length >= 3) {
    insights.push({
      type: 'habit_momentum',
      title: 'Strong habit momentum',
      description: `You're maintaining ${activeHabits.length} active habits simultaneously. This is a sign of a solid routine.`,
      confidence: 0.7,
      dataPoints: [`active_habits_${activeHabits.length}`],
    });
  }

  // Recently broken streak
  const now = new Date();
  const yesterday = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const brokenStreaks = habits.filter((h) => {
    if (!h.lastCompletedAt) return false;
    const last = new Date(h.lastCompletedAt);
    return last < yesterday && h.streak === 0 && h.longestStreak >= 3;
  });

  if (brokenStreaks.length > 0) {
    insights.push({
      type: 'habit_broken',
      title: 'Streak broken recently',
      description: `${brokenStreaks.map((h) => h.name).join(', ')} — don't be discouraged. Restarting is part of building lasting habits.`,
      confidence: 0.65,
      dataPoints: brokenStreaks.map((h) => `habit_${h.id}`),
    });
  }

  return insights;
}

function detectValencePatterns(checkIns: EmotionalCheckIn[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];
  if (checkIns.length < 5) return insights;

  const recent = checkIns.slice(0, 7);
  const unpleasant = recent.filter((c) => c.valence === 'unpleasant');
  const pleasant = recent.filter((c) => c.valence === 'pleasant');

  // Sustained unpleasant
  if (unpleasant.length >= 4 && unpleasant.length / recent.length > 0.6) {
    insights.push({
      type: 'valence_unpleasant_sustained',
      title: 'Mostly unpleasant feelings lately',
      description: `${Math.round((unpleasant.length / recent.length) * 100)}% of recent check-ins were unpleasant. This is worth noting — consider what's changed and whether a dopamine menu activity or journal reflection could help.`,
      confidence: 0.7,
      dataPoints: [`unpleasant_${unpleasant.length}`, `total_${recent.length}`],
    });
  }

  // Positive shift
  if (recent.length >= 5) {
    const older = checkIns.slice(3, 7);
    const recentPleasant = pleasant.length / recent.length;
    const olderPleasant = older.filter((c) => c.valence === 'pleasant').length / Math.max(older.length, 1);

    if (recentPleasant - olderPleasant > 0.3) {
      insights.push({
        type: 'valence_improving',
        title: 'Mood has been improving',
        description: 'Your recent check-ins are more positive compared to last week. Keep up whatever is working.',
        confidence: 0.75,
        dataPoints: [`recent_pleasant_${Math.round(recentPleasant * 100)}`, `older_pleasant_${Math.round(olderPleasant * 100)}`],
      });
    }
  }

  return insights;
}
