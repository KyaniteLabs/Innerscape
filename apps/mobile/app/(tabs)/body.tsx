import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyCheckIn } from '../../components/body/BodyCheckIn';
import { SleepLogger } from '../../components/body/SleepLogger';
import { SpacesPanel } from '../../components/spaces/SpacesPanel';
import { useCreateBodyCheckin } from '../../hooks/useBodyCheckins';
import { useSleep, useCreateSleepLog } from '../../hooks/useSleep';
import { useSomatic, useCreateSomatic } from '../../hooks/useSomatic';

type BodyMode = 'checkin' | 'sleep' | 'spaces' | 'somatic';

export default function BodyScreen() {
  const [mode, setMode] = useState<BodyMode | null>(null);

  const [somaticEmotion, setSomaticEmotion] = useState('');
  const [somaticConfidence, setSomaticConfidence] = useState('0.5');

  const createCheckin = useCreateBodyCheckin();
  const createSleepLog = useCreateSleepLog();
  const { data: sleepData, isLoading: sleepLoading } = useSleep(7);
  const { data: somaticData, isLoading: somaticLoading } = useSomatic();
  const createSomatic = useCreateSomatic();

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

  const handleSomaticSubmit = () => {
    if (!somaticEmotion.trim()) {
      Alert.alert('Validation', 'Please enter a predicted emotion.');
      return;
    }
    const confidence = parseFloat(somaticConfidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      Alert.alert('Validation', 'Confidence must be a number between 0 and 1.');
      return;
    }
    createSomatic.mutate(
      {
        sensationPattern: {},
        predictedEmotion: somaticEmotion.trim(),
        confidence,
      },
      {
        onSuccess: () => {
          setSomaticEmotion('');
          setSomaticConfidence('0.5');
          setMode(null);
        },
        onError: () => Alert.alert('Error', 'Failed to save somatic mapping. Please try again.'),
      },
    );
  };

  const somaticMappings = somaticData ?? [];

  const modes: { key: BodyMode; emoji: string; title: string; desc: string }[] = [
    { key: 'checkin', emoji: '🫀', title: 'Body Scan', desc: 'Tune into physical sensations' },
    { key: 'sleep', emoji: '🌙', title: 'Sleep Log', desc: 'Track last night\'s rest' },
    { key: 'spaces', emoji: '🏠', title: 'Spaces', desc: 'Scan & declutter your environment' },
    { key: 'somatic', emoji: '🧠', title: 'Somatic', desc: 'Map sensations to emotions' },
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
          <SpacesPanel onBack={() => setMode(null)} />
        ) : mode === 'somatic' ? (
          <View style={styles.somaticForm}>
            <TouchableOpacity onPress={() => setMode(null)} activeOpacity={0.7}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>New Somatic Mapping</Text>
            <Text style={styles.formLabel}>Predicted Emotion</Text>
            <TextInput
              style={styles.formInput}
              value={somaticEmotion}
              onChangeText={setSomaticEmotion}
              placeholder="e.g. anxiety, calm, joy"
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.formLabel}>Confidence (0 - 1)</Text>
            <TextInput
              style={styles.formInput}
              value={somaticConfidence}
              onChangeText={setSomaticConfidence}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.muted}
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSomaticSubmit}
              disabled={createSomatic.isPending}
              activeOpacity={0.7}
            >
              {createSomatic.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Mapping</Text>
              )}
            </TouchableOpacity>
          </View>
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

            {somaticMappings.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Somatic Mappings</Text>
                {somaticMappings.slice(0, 5).map((entry) => (
                  <View key={entry.id} style={styles.sleepRow}>
                    <Text style={styles.somaticEmotion} numberOfLines={1}>
                      {entry.predictedEmotion}
                    </Text>
                    <Text style={styles.somaticConfidence}>
                      {(entry.confidence * 100).toFixed(0)}%
                    </Text>
                    <Text style={styles.somaticOccurrences}>x{entry.occurrences}</Text>
                  </View>
                ))}
              </View>
            )}

            {(sleepLoading || somaticLoading) && (
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
  somaticForm: { paddingHorizontal: 16, gap: 12 },
  backText: { color: COLORS.accent, fontSize: 14, marginBottom: 8 },
  formTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  formLabel: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  formInput: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  somaticEmotion: { color: COLORS.text, fontSize: 14, fontWeight: '500', flex: 1 },
  somaticConfidence: { color: COLORS.accent, fontSize: 14, fontWeight: '600', width: 44, textAlign: 'right' },
  somaticOccurrences: { color: COLORS.muted, fontSize: 13, width: 36, textAlign: 'right' },
});
