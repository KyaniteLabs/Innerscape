import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationAsync } from '../../lib/haptics';
import { NotificationFeedbackType } from 'expo-haptics';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

interface Habit {
  id: string;
  name: string;
  frequency: string;
  streak: number;
  longestStreak: number;
  lastCompletedAt?: string | null;
  completedToday: boolean;
}

interface HabitTrackerProps {
  habits: Habit[];
  on_complete: (id: string) => void;
}

export function HabitTracker({ habits, on_complete }: HabitTrackerProps) {
  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No habits yet</Text>
        <Text style={styles.emptyHint}>Add your first habit to start building streaks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {habits.map((habit) => (
        <TouchableOpacity
          key={habit.id}
          style={[styles.habitCard, habit.completedToday && styles.completedCard]}
          onPress={() => {
            if (!habit.completedToday) {
              notificationAsync(NotificationFeedbackType.Success);
              on_complete(habit.id);
            }
          }}
          activeOpacity={habit.completedToday ? 1 : 0.7}
        >
          <View style={styles.habitLeft}>
            <View style={[styles.checkCircle, habit.completedToday && styles.checkCircleDone]}>
              {habit.completedToday && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={[styles.habitName, habit.completedToday && styles.habitNameDone]}>
              {habit.name}
            </Text>
          </View>

          <View style={styles.streakContainer}>
            <Text style={styles.streakCount}>{habit.streak}</Text>
            <Text style={styles.streakLabel}>
              {habit.streak === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {habit.streak >= 7 && (
            <View style={styles.fireBadge}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </View>
          )}

          {habit.streak > 0 && habit.streak === habit.longestStreak && habit.streak >= 3 && (
            <Text style={styles.recordLabel}>Record!</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING[2] },
  emptyContainer: { alignItems: 'center', padding: SPACING[8] },
  emptyText: { color: COLORS.text.muted, fontSize: FONT.size.base, fontWeight: FONT.weight.medium },
  emptyHint: { color: COLORS.text.muted, fontSize: FONT.size.sm - 1, marginTop: SPACING[1] },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    justifyContent: 'space-between',
  },
  completedCard: { backgroundColor: '#1a2e1a' },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], flex: 1 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checkMark: { color: COLORS.text.inverse, fontSize: FONT.size.sm, fontWeight: FONT.weight.bold },
  habitName: { color: COLORS.text.primary, fontSize: FONT.size.base - 1, fontWeight: FONT.weight.medium },
  habitNameDone: { color: COLORS.text.muted },
  streakContainer: { alignItems: 'center' },
  streakCount: { color: COLORS.primary, fontSize: FONT.size.xl, fontWeight: FONT.weight.bold },
  streakLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs - 2 },
  fireBadge: { position: 'absolute', top: -4, right: -4 },
  fireEmoji: { fontSize: FONT.size.base },
  recordLabel: { color: '#ffd700', fontSize: FONT.size.xs - 2, fontWeight: FONT.weight.semibold },
});
