import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationAsync, selectionAsync } from '../../lib/haptics';
import { NotificationFeedbackType } from 'expo-haptics';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

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
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.xl,
    padding: SPACING[5],
    marginHorizontal: SPACING[4],
  },
  title: { color: COLORS.text.primary, fontSize: FONT.size.xl, fontWeight: FONT.weight.semibold, textAlign: 'center', marginBottom: SPACING[5] },
  section: { marginBottom: SPACING[5] },
  label: { color: COLORS.text.muted, fontSize: FONT.size.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING[2] },
  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING[6] },
  adjustButton: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: { color: COLORS.primary, fontSize: 24, fontWeight: '300' },
  hourValue: { color: COLORS.text.primary, fontSize: 36, fontWeight: FONT.weight.bold },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  qualityDot: { alignItems: 'center', opacity: 0.4 },
  qualityDotActive: { opacity: 1 },
  qualityEmoji: { fontSize: 28 },
  qualityEmojiActive: {},
  qualityLabel: { color: COLORS.text.secondary, fontSize: 10, marginTop: SPACING[1] },
  qualityLabelActive: { color: COLORS.text.primary },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: SPACING[3],
    alignItems: 'center',
    marginTop: SPACING[1],
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: FONT.weight.semibold },
});
