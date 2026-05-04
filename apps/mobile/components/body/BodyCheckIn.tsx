import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

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
      Haptics.selectionAsync();
    }
  };

  const handleValence = (valence: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
              onPress={() => { setFeeling(s); Haptics.selectionAsync(); }}
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
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
  },
  title: { color: '#e0e0e0', fontSize: 20, fontWeight: '600', textAlign: 'center' },
  subtitle: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  regionButton: {
    backgroundColor: '#1a1a3e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: 90,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  regionSelected: { borderColor: '#6c63ff', backgroundColor: '#1a1a4e' },
  regionEmoji: { fontSize: 28 },
  regionLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  regionLabelSelected: { color: '#6c63ff' },
  nextButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  feelingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  feelingChip: {
    backgroundColor: '#1a1a3e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feelingChipActive: { borderColor: '#6c63ff', backgroundColor: '#1a1a4e' },
  feelingText: { color: '#888', fontSize: 14 },
  feelingTextActive: { color: '#6c63ff' },
  valenceRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 },
  valenceButton: {
    backgroundColor: '#1a1a3e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 100,
  },
  valenceEmoji: { fontSize: 40 },
  valenceLabel: { color: '#888', fontSize: 12, marginTop: 8 },
});
