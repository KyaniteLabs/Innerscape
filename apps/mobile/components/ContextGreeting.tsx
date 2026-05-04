import { View, Text, StyleSheet } from 'react-native';
import { useEmotionalStore } from '../stores/emotional';
import type { EmotionalState } from '@innerscape/shared';

const GREETINGS: Record<EmotionalState, { title: string; subtitle: string }> = {
  high_energy_pleasant: {
    title: 'Great energy today',
    subtitle: 'Ready for challenging work?',
  },
  high_energy_unpleasant: {
    title: 'Feeling wired',
    subtitle: 'A few grounding options below',
  },
  low_energy_pleasant: {
    title: 'Calm and steady',
    subtitle: 'Easy wins are the move',
  },
  low_energy_unpleasant: {
    title: 'Tough moment',
    subtitle: 'One thing at a time',
  },
};

const DEFAULT_GREETING = { title: 'How are you?', subtitle: 'Check in to get started' };

export function ContextGreeting() {
  const computedState = useEmotionalStore((s) => s.computedState);
  const checkIn = useEmotionalStore((s) => s.currentCheckIn);

  const greeting = computedState ? GREETINGS[computedState] : DEFAULT_GREETING;

  const timeLabel = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  })();

  return (
    <View style={styles.container}>
      <Text style={styles.timeLabel}>{timeLabel}</Text>
      <Text style={styles.title}>{greeting.title}</Text>
      <Text style={styles.subtitle}>{greeting.subtitle}</Text>
      {checkIn && (
        <Text style={styles.lastCheckIn}>
          Energy: {checkIn.energyLevel}% · {checkIn.valence}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#6c63ff',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  lastCheckIn: {
    fontSize: 12,
    color: '#555',
    marginTop: 12,
  },
});
