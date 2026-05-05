import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContextGreeting } from '../../components/ContextGreeting';
import { QuickCheckIn } from '../../components/checkin/QuickCheckIn';
import { useEmotionalStore } from '../../stores/emotional';
import { useCurrentContext } from '../../hooks/useCheckins';
import { useDailySummary } from '../../hooks/useReview';

export default function HomeScreen() {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInComplete, setCheckInComplete] = useState(false);
  const computedState = useEmotionalStore((s) => s.computedState);
  const { data: context } = useCurrentContext();
  const { data: dailySummary } = useDailySummary();

  const handleCheckInComplete = () => {
    setCheckInComplete(true);
    setTimeout(() => {
      setShowCheckIn(false);
      setCheckInComplete(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ContextGreeting />

        {showCheckIn && !checkInComplete ? (
          <QuickCheckIn on_complete={handleCheckInComplete} />
        ) : checkInComplete ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmationText}>Got it ✓</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => setShowCheckIn(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInButtonText}>Quick Check-in</Text>
          </TouchableOpacity>
        )}

        {(computedState || context?.emotionalState) && (
          <View style={styles.stateCard}>
            <Text style={styles.stateLabel}>Current state</Text>
            <Text style={styles.stateValue}>
              {(context?.emotionalState || computedState || '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>
        )}

        {dailySummary && dailySummary.totalActivity > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today</Text>
            <View style={styles.summaryRow}>
              {[
                { label: 'Check-ins', value: dailySummary.emotionalCheckIns, emoji: '🫀' },
                { label: 'Habits', value: dailySummary.habitsCompleted, emoji: '✅' },
                { label: 'Tasks', value: dailySummary.tasksCompleted, emoji: '🎯' },
                { label: 'Captures', value: dailySummary.itemsCaptured, emoji: '📥' },
              ].map((stat) => (
                <View key={stat.label} style={styles.summaryItem}>
                  <Text style={styles.summaryEmoji}>{stat.emoji}</Text>
                  <Text style={styles.summaryValue}>{stat.value}</Text>
                  <Text style={styles.summaryLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.moduleGrid}>
          {[
            { name: 'Mind', emoji: '🧠', desc: 'Journal & Insights' },
            { name: 'Flow', emoji: '⚡', desc: 'Habits & Goals' },
            { name: 'Body', emoji: '🫀', desc: 'Scan & Sleep' },
            { name: 'Hub', emoji: '📥', desc: 'Capture & Review' },
          ].map((module) => (
            <View key={module.name} style={styles.moduleCard}>
              <Text style={styles.moduleEmoji}>{module.emoji}</Text>
              <Text style={styles.moduleName}>{module.name}</Text>
              <Text style={styles.moduleDesc}>{module.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: '#0f0f23',
  card: '#16213e',
  cardBorder: '#1a1a3e',
  text: '#e0e0e0',
  muted: '#666',
  accent: '#6c63ff',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingVertical: 16 },
  checkInButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  checkInButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  confirmation: {
    backgroundColor: '#1a2e1a',
    borderRadius: 16,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  confirmationText: { color: '#4caf50', fontSize: 20, fontWeight: '600' },
  stateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  stateLabel: { fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  stateValue: { fontSize: 16, color: COLORS.text, fontWeight: '500', marginTop: 4 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryTitle: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryEmoji: { fontSize: 18 },
  summaryValue: { color: COLORS.accent, fontSize: 18, fontWeight: '700', marginTop: 4 },
  summaryLabel: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  moduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  moduleEmoji: { fontSize: 24 },
  moduleName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 6 },
  moduleDesc: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
});
