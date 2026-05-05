import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationAsync } from '../../lib/haptics';
import { NotificationFeedbackType } from 'expo-haptics';

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
  container: { gap: 8 },
  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyText: { color: '#888', fontSize: 16, fontWeight: '500' },
  emptyHint: { color: '#555', fontSize: 13, marginTop: 4 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  completedCard: { backgroundColor: '#1a2e1a' },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  habitName: { color: '#e0e0e0', fontSize: 15, fontWeight: '500' },
  habitNameDone: { color: '#888' },
  streakContainer: { alignItems: 'center' },
  streakCount: { color: '#6c63ff', fontSize: 20, fontWeight: '700' },
  streakLabel: { color: '#555', fontSize: 10 },
  fireBadge: { position: 'absolute', top: -4, right: -4 },
  fireEmoji: { fontSize: 16 },
  recordLabel: { color: '#ffd700', fontSize: 10, fontWeight: '600' },
});
