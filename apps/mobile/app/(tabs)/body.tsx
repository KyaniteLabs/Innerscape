import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyCheckIn } from '../../components/body/BodyCheckIn';
import { SleepLogger } from '../../components/body/SleepLogger';
import { DeclutterSpaces } from '../../components/declutter/DeclutterSpaces';
import { useCreateBodyCheckin } from '../../hooks/useBodyCheckins';
import { useSleep, useCreateSleepLog } from '../../hooks/useSleep';

type BodyMode = 'checkin' | 'sleep' | 'spaces';

export default function BodyScreen() {
  const [mode, setMode] = useState<BodyMode | null>(null);

  const createCheckin = useCreateBodyCheckin();
  const createSleepLog = useCreateSleepLog();
  const { data: sleepData, isLoading: sleepLoading } = useSleep(7);

  const handleBodyCheckIn = (data: {
    bodyScan: Record<string, string>;
    emotionWheelFeeling: string;
    emotionWheelValence: string;
  }) => {
    createCheckin.mutate(data, {
      onSuccess: () => setMode(null),
      onError: () => Alert.alert('Error', 'Failed to save check-in. Please try again.'),
    });
  };

  const handleSleepSave = (data: { durationHours: number; qualityScore: number }) => {
    createSleepLog.mutate(
      { date: new Date().toISOString(), durationHours: data.durationHours, qualityScore: data.qualityScore },
      {
        onSuccess: () => setMode(null),
        onError: () => Alert.alert('Error', 'Failed to log sleep. Please try again.'),
      },
    );
  };

  const modes: { key: BodyMode; emoji: string; title: string; desc: string }[] = [
    { key: 'checkin', emoji: '🫀', title: 'Body Scan', desc: 'Tune into physical sensations' },
    { key: 'sleep', emoji: '🌙', title: 'Sleep Log', desc: 'Track last night\'s rest' },
    { key: 'spaces', emoji: '🏠', title: 'Spaces', desc: 'Scan & declutter your environment' },
  ];

  const sleepLogs = sleepData?.logs ?? [];
  const sleepSummary = sleepData?.summary;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Body</Text>

        {mode === 'checkin' ? (
          <BodyCheckIn on_complete={handleBodyCheckIn} />
        ) : mode === 'sleep' ? (
          <SleepLogger on_save={handleSleepSave} />
        ) : mode === 'spaces' ? (
          <DeclutterSpaces onBack={() => setMode(null)} />
        ) : (
          <>
            <View style={styles.modesGrid}>
              {modes.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={styles.modeCard}
                  onPress={() => setMode(m.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modeEmoji}>{m.emoji}</Text>
                  <Text style={styles.modeTitle}>{m.title}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {sleepSummary && sleepSummary.nights > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Sleep Summary (7 days)</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{sleepSummary.avgDuration}h</Text>
                    <Text style={styles.summaryLabel}>Avg Duration</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {['', '😫', '😟', '😐', '😊', '😴'][Math.round(sleepSummary.avgQuality)]}
                    </Text>
                    <Text style={styles.summaryLabel}>Avg Quality</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{sleepSummary.nights}</Text>
                    <Text style={styles.summaryLabel}>Nights Logged</Text>
                  </View>
                </View>
              </View>
            )}

            {sleepLogs.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Recent Sleep</Text>
                {sleepLogs.slice(0, 5).map((entry) => (
                  <View key={entry.id} style={styles.sleepRow}>
                    <Text style={styles.sleepDate}>
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={styles.sleepDuration}>{entry.durationHours}h</Text>
                    <Text style={styles.sleepQuality}>
                      {['', '😫', '😟', '😐', '😊', '😴'][entry.qualityScore]}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {sleepLoading && (
              <ActivityIndicator color="#6c63ff" style={{ marginTop: 20 }} />
            )}
          </>
        )}
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
  pageTitle: { color: COLORS.text, fontSize: 24, fontWeight: '700', paddingHorizontal: 16, marginBottom: 20 },
  modesGrid: { paddingHorizontal: 16, gap: 12 },
  modeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modeEmoji: { fontSize: 36 },
  modeTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  modeDesc: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: COLORS.accent, fontSize: 20, fontWeight: '700' },
  summaryLabel: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  historySection: { marginTop: 24, paddingHorizontal: 16 },
  sleepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  sleepDate: { color: COLORS.muted, fontSize: 13, width: 40 },
  sleepDuration: { color: COLORS.text, fontSize: 16, fontWeight: '600', flex: 1 },
  sleepQuality: { fontSize: 20 },
});
