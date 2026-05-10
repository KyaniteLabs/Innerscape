import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { selectionAsync, notificationAsync } from '../../lib/haptics';
import { NotificationFeedbackType } from 'expo-haptics';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

interface BodyRegion {
  id: string;
  label: string;
  emoji: string;
}

const REGIONS: BodyRegion[] = [
  { id: 'head', label: 'Head', emoji: '🧠' },
  { id: 'neck', label: 'Neck', emoji: '🔗' },
  { id: 'chest', label: 'Chest', emoji: '💗' },
  { id: 'belly', label: 'Belly', emoji: '🌀' },
  { id: 'hands', label: 'Hands', emoji: '🤲' },
  { id: 'legs', label: 'Legs', emoji: '🦵' },
];

const SENSATIONS = ['tension', 'warmth', 'numbness', 'tingling', 'relaxation', 'pressure'];

interface BodyCheckInProps {
  on_complete: (data: {
    bodyScan: Record<string, string>;
    emotionWheelFeeling: string;
    emotionWheelValence: string;
  }) => void;
}

export function BodyCheckIn({ on_complete }: BodyCheckInProps) {
  const [step, setStep] = useState<'scan' | 'feeling' | 'valence'>('scan');
  const [selectedRegions, setSelectedRegions] = useState<Record<string, string>>({});
  const [feeling, setFeeling] = useState('');

  const toggleRegion = (region: BodyRegion) => {
    if (selectedRegions[region.id]) {
      const next = { ...selectedRegions };
      delete next[region.id];
      setSelectedRegions(next);
    } else {
      setSelectedRegions((prev) => ({ ...prev, [region.id]: 'aware' }));
      selectionAsync();
    }
  };

  const handleValence = (valence: string) => {
    notificationAsync(NotificationFeedbackType.Success);
    on_complete({
      bodyScan: selectedRegions,
      emotionWheelFeeling: feeling || 'neutral',
      emotionWheelValence: valence,
    });
  };

  if (step === 'scan') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Where do you feel it?</Text>
        <Text style={styles.subtitle}>Tap the areas you notice</Text>
        <View style={styles.regionGrid}>
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region.id}
              style={[styles.regionButton, selectedRegions[region.id] && styles.regionSelected]}
              onPress={() => toggleRegion(region)}
            >
              <Text style={styles.regionEmoji}>{region.emoji}</Text>
              <Text style={[styles.regionLabel, selectedRegions[region.id] && styles.regionLabelSelected]}>
                {region.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep('feeling')}>
          <Text style={styles.nextButtonText}>
            {Object.keys(selectedRegions).length > 0 ? 'Continue' : 'Skip Scan'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'feeling') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>What feeling comes up?</Text>
        <View style={styles.feelingGrid}>
          {SENSATIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.feelingChip, feeling === s && styles.feelingChipActive]}
              onPress={() => { setFeeling(s); selectionAsync(); }}
            >
              <Text style={[styles.feelingText, feeling === s && styles.feelingTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => setStep('valence')}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Is it pleasant or unpleasant?</Text>
      <View style={styles.valenceRow}>
        {[
          { key: 'pleasant', emoji: '😊', label: 'Pleasant' },
          { key: 'neutral', emoji: '😐', label: 'Neutral' },
          { key: 'unpleasant', emoji: '😟', label: 'Unpleasant' },
        ].map((v) => (
          <TouchableOpacity
            key={v.key}
            style={styles.valenceButton}
            onPress={() => handleValence(v.key)}
          >
            <Text style={styles.valenceEmoji}>{v.emoji}</Text>
            <Text style={styles.valenceLabel}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  title: { color: COLORS.text.primary, fontSize: FONT.size.xl, fontWeight: FONT.weight.semibold, textAlign: 'center' },
  subtitle: { color: COLORS.text.secondary, fontSize: 13, textAlign: 'center', marginTop: SPACING[1], marginBottom: SPACING[5] },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  regionButton: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    alignItems: 'center',
    width: 90,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  regionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.dark.elevated },
  regionEmoji: { fontSize: 28 },
  regionLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginTop: SPACING[1] },
  regionLabelSelected: { color: COLORS.primary },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: SPACING[3],
    alignItems: 'center',
    marginTop: SPACING[5],
  },
  nextButtonText: { color: '#fff', fontSize: 15, fontWeight: FONT.weight.semibold },
  feelingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING[2], marginTop: SPACING[4] },
  feelingChip: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: SPACING[2],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feelingChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.dark.elevated },
  feelingText: { color: COLORS.text.muted, fontSize: FONT.size.sm },
  feelingTextActive: { color: COLORS.primary },
  valenceRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING[4], marginTop: SPACING[6] },
  valenceButton: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: RADIUS.xl,
    padding: SPACING[5],
    alignItems: 'center',
    width: 100,
  },
  valenceEmoji: { fontSize: 40 },
  valenceLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginTop: SPACING[2] },
});
