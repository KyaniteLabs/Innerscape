import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { EmotionalValence } from '@innerscape/shared';
import { useEmotionalStore } from '../../stores/emotional';

const VALENCE_OPTIONS: { value: EmotionalValence; label: string; emoji: string }[] = [
  { value: 'pleasant', label: 'Good', emoji: '☀️' },
  { value: 'neutral', label: 'Okay', emoji: '⛅' },
  { value: 'unpleasant', label: 'Rough', emoji: '🌪️' },
];

const FEELING_LABELS = [
  'calm', 'focused', 'anxious', 'tired', 'restless',
  'happy', 'overwhelmed', 'bored', 'creative', 'foggy',
];

interface QuickCheckInProps {
  on_complete?: () => void;
}

export function QuickCheckIn({ on_complete }: QuickCheckInProps) {
  const [step, setStep] = useState<'energy' | 'valence' | 'feeling'>('energy');
  const [energyLevel, setEnergyLevel] = useState(50);
  const [valence, setValence] = useState<EmotionalValence | null>(null);
  const setCheckIn = useEmotionalStore((s) => s.setCheckIn);

  const handleEnergySelect = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnergyLevel(level);
    setStep('valence');
  };

  const handleValenceSelect = (v: EmotionalValence) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setValence(v);
    setStep('feeling');
  };

  const handleFeelingSelect = (feeling: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCheckIn({ energyLevel, valence: valence!, feelingLabel: feeling });
    on_complete?.();
  };

  const handleSkipFeeling = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCheckIn({ energyLevel, valence: valence! });
    on_complete?.();
  };

  if (step === 'energy') {
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>How is your energy right now?</Text>
        <View style={styles.energyRow}>
          {[0, 25, 50, 75, 100].map((level) => (
            <TouchableOpacity
              key={level}
              style={styles.energyButton}
              onPress={() => handleEnergySelect(level)}
              activeOpacity={0.7}
            >
              <Text style={styles.energyLabel}>
                {level === 0 ? 'Empty' : level === 25 ? 'Low' : level === 50 ? 'Mid' : level === 75 ? 'High' : 'Full'}
              </Text>
              <View style={[styles.energyBar, { height: `${level || 10}%` }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (step === 'valence') {
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>How does it feel?</Text>
        <View style={styles.valenceRow}>
          {VALENCE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.valenceButton}
              onPress={() => handleValenceSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.valenceEmoji}>{opt.emoji}</Text>
              <Text style={styles.valenceLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Any specific feeling? (optional)</Text>
      <View style={styles.feelingGrid}>
        {FEELING_LABELS.map((feeling) => (
          <TouchableOpacity
            key={feeling}
            style={styles.feelingChip}
            onPress={() => handleFeelingSelect(feeling)}
            activeOpacity={0.7}
          >
            <Text style={styles.feelingText}>{feeling}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={handleSkipFeeling} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginHorizontal: 16,
  },
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 24,
  },
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  energyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 100,
  },
  energyLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  energyBar: {
    width: '60%',
    backgroundColor: '#6c63ff',
    borderRadius: 4,
    minHeight: 4,
  },
  valenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  valenceButton: {
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    minWidth: 90,
  },
  valenceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  valenceLabel: {
    fontSize: 14,
    color: '#e0e0e0',
    fontWeight: '500',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  feelingChip: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  feelingText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  skipButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
});
