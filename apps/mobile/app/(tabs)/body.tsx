import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyCheckIn } from '../../components/body/BodyCheckIn';
import { SleepLogger } from '../../components/body/SleepLogger';

type BodyMode = 'checkin' | 'sleep' | 'spaces';

interface SleepEntry {
  id: string;
  durationHours: number;
  qualityScore: number;
  date: string;
}

export default function BodyScreen() {
  const [mode, setMode] = useState<BodyMode | null>(null);
  const [recentSleep, setRecentSleep] = useState<SleepEntry[]>([]);

  const handleBodyCheckIn = (_data: {
    bodyScan: Record<string, string>;
    emotionWheelFeeling: string;
    emotionWheelValence: string;
  }) => {
    // TODO: wire to API
    setMode(null);
  };

  const handleSleepSave = (data: { durationHours: number; qualityScore: number }) => {
    const entry: SleepEntry = {
      id: `local-${Date.now()}`,
      durationHours: data.durationHours,
      qualityScore: data.qualityScore,
      date: new Date().toISOString(),
    };
    setRecentSleep((prev) => [entry, ...prev]);
    setMode(null);
  };

  const modes: { key: BodyMode; emoji: string; title: string; desc: string }[] = [
    { key: 'checkin', emoji: '🫀', title: 'Body Scan', desc: 'Tune into physical sensations' },
    { key: 'sleep', emoji: '🌙', title: 'Sleep Log', desc: 'Track last night\'s rest' },
    { key: 'spaces', emoji: '🏠', title: 'Spaces', desc: 'Scan & declutter your environment' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Body</Text>

        {mode === 'checkin' ? (
          <BodyCheckIn on_complete={handleBodyCheckIn} />
        ) : mode === 'sleep' ? (
          <SleepLogger on_save={handleSleepSave} />
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

            {recentSleep.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Recent Sleep</Text>
                {recentSleep.slice(0, 5).map((entry) => (
                  <View key={entry.id} style={styles.sleepRow}>
                    <Text style={styles.sleepDuration}>{entry.durationHours}h</Text>
                    <Text style={styles.sleepQuality}>
                      {['', '😫', '😟', '😐', '😊', '😴'][entry.qualityScore]}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f23' },
  content: { paddingVertical: 16 },
  pageTitle: {
    color: '#e0e0e0',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modesGrid: { paddingHorizontal: 16, gap: 12 },
  modeCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modeEmoji: { fontSize: 36 },
  modeTitle: { color: '#e0e0e0', fontSize: 17, fontWeight: '600' },
  modeDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  historySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sleepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  sleepDuration: { color: '#e0e0e0', fontSize: 16, fontWeight: '600' },
  sleepQuality: { fontSize: 20 },
});
