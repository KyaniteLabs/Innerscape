import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationAsync, selectionAsync } from '../../lib/haptics';
import { NotificationFeedbackType } from 'expo-haptics';

const QUALITY_LABELS = ['Poor', 'Fair', 'OK', 'Good', 'Great'];

interface SleepLoggerProps {
  on_save: (data: { durationHours: number; qualityScore: number }) => void;
}

export function SleepLogger({ on_save }: SleepLoggerProps) {
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);

  const handleSave = () => {
    notificationAsync(NotificationFeedbackType.Success);
    on_save({ durationHours: hours, qualityScore: quality });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last Night's Sleep</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Duration</Text>
        <View style={styles.hourRow}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => setHours(Math.max(3, hours - 0.5))}
          >
            <Text style={styles.adjustText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.hourValue}>{hours}h</Text>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => setHours(Math.min(15, hours + 0.5))}
          >
            <Text style={styles.adjustText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Quality</Text>
        <View style={styles.qualityRow}>
          {QUALITY_LABELS.map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.qualityDot, quality === i + 1 && styles.qualityDotActive]}
              onPress={() => { setQuality(i + 1); selectionAsync(); }}
            >
              <Text style={[styles.qualityEmoji, quality === i + 1 && styles.qualityEmojiActive]}>
                {['😫', '😟', '😐', '😊', '😴'][i]}
              </Text>
              <Text style={[styles.qualityLabel, quality === i + 1 && styles.qualityLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Log Sleep</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
  },
  title: { color: '#e0e0e0', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 20 },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  adjustButton: {
    backgroundColor: '#1a1a3e',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: { color: '#6c63ff', fontSize: 24, fontWeight: '300' },
  hourValue: { color: '#e0e0e0', fontSize: 36, fontWeight: '700' },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  qualityDot: { alignItems: 'center', opacity: 0.4 },
  qualityDotActive: { opacity: 1 },
  qualityEmoji: { fontSize: 28 },
  qualityEmojiActive: {},
  qualityLabel: { color: '#666', fontSize: 10, marginTop: 4 },
  qualityLabelActive: { color: '#e0e0e0' },
  saveButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
