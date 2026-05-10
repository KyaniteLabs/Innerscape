import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { selectionAsync, notificationAsync } from '../../lib/haptics';
import { NotificationFeedbackType } from 'expo-haptics';
import type { EmotionalValence } from '@innerscape/shared';
import { useEmotionalStore } from '../../stores/emotional';
import { COLORS, FONT, RADIUS, SPACING } from '../../lib/theme';
import { CTA, Surface } from '../design/System';

const VALENCE_OPTIONS: { value: EmotionalValence; label: string; detail: string; signal: string }[] = [
  { value: 'pleasant', label: 'Clear', detail: 'safe / open', signal: COLORS.pleasant },
  { value: 'neutral', label: 'Mixed', detail: 'observing', signal: COLORS.neutral },
  { value: 'unpleasant', label: 'Loaded', detail: 'support needed', signal: COLORS.unpleasant },
];

const FEELING_LABELS = ['calm', 'focused', 'anxious', 'tired', 'restless', 'happy', 'overwhelmed', 'bored', 'creative', 'foggy'];
const ENERGY_LEVELS = [
  { value: 0, label: 'Empty' },
  { value: 25, label: 'Low' },
  { value: 50, label: 'Usable' },
  { value: 75, label: 'High' },
  { value: 100, label: 'Full' },
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
    selectionAsync();
    setEnergyLevel(level);
    setStep('valence');
  };

  const handleValenceSelect = (v: EmotionalValence) => {
    selectionAsync();
    setValence(v);
    setStep('feeling');
  };

  const complete = (feelingLabel?: string) => {
    notificationAsync(NotificationFeedbackType.Success);
    setCheckIn({ energyLevel, valence: valence!, feelingLabel });
    on_complete?.();
  };

  return (
    <Surface tone={step === 'energy' ? COLORS.primary : step === 'valence' ? COLORS.hub : COLORS.mind} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Capacity scan</Text>
        <Text style={styles.step}>{step === 'energy' ? '1/3' : step === 'valence' ? '2/3' : '3/3'}</Text>
      </View>

      {step === 'energy' ? (
        <>
          <Text style={styles.prompt}>How much battery is available?</Text>
          <View style={styles.energyRow}>
            {ENERGY_LEVELS.map((level) => (
              <TouchableOpacity key={level.value} style={styles.energyButton} onPress={() => handleEnergySelect(level.value)} activeOpacity={0.82}>
                <View style={styles.energyTrack}>
                  <View style={[styles.energyFill, { height: `${Math.max(level.value, 8)}%` }]} />
                </View>
                <Text style={styles.energyLabel}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : step === 'valence' ? (
        <>
          <Text style={styles.prompt}>What is the emotional weather?</Text>
          <View style={styles.valenceRow}>
            {VALENCE_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.value} style={[styles.valenceButton, { borderColor: opt.signal }]} onPress={() => handleValenceSelect(opt.value)} activeOpacity={0.82}>
                <View style={[styles.signalDot, { backgroundColor: opt.signal }]} />
                <Text style={styles.valenceLabel}>{opt.label}</Text>
                <Text style={styles.valenceDetail}>{opt.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.prompt}>Name it if naming helps.</Text>
          <View style={styles.feelingGrid}>
            {FEELING_LABELS.map((feeling) => (
              <TouchableOpacity key={feeling} style={styles.feelingChip} onPress={() => complete(feeling)} activeOpacity={0.82}>
                <Text style={styles.feelingText}>{feeling}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <CTA variant="quiet" onPress={() => complete()} style={styles.skipButton}>Skip naming</CTA>
        </>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING[4] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[3] },
  kicker: { color: COLORS.primary, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
  step: { color: COLORS.text.dim, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold },
  prompt: { fontSize: FONT.size.xl, lineHeight: 27, fontWeight: FONT.weight.black, color: COLORS.text.primary, marginBottom: SPACING[5] },
  energyRow: { flexDirection: 'row', gap: SPACING[2] },
  energyButton: { flex: 1, alignItems: 'center', gap: SPACING[2] },
  energyTrack: { height: 112, width: '100%', justifyContent: 'flex-end', backgroundColor: COLORS.dark.elevated, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.dark.border, overflow: 'hidden' },
  energyFill: { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  energyLabel: { fontSize: FONT.size.xs, color: COLORS.text.muted, fontWeight: FONT.weight.bold },
  valenceRow: { gap: SPACING[3] },
  valenceButton: { borderWidth: 1, backgroundColor: COLORS.dark.elevated, borderRadius: RADIUS.xl, padding: SPACING[4] },
  signalDot: { width: 10, height: 10, borderRadius: RADIUS.full, marginBottom: SPACING[2] },
  valenceLabel: { fontSize: FONT.size.lg, color: COLORS.text.primary, fontWeight: FONT.weight.black },
  valenceDetail: { fontSize: FONT.size.sm, color: COLORS.text.muted, marginTop: 2 },
  feelingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  feelingChip: { backgroundColor: COLORS.dark.elevated, borderWidth: 1, borderColor: COLORS.dark.border, borderRadius: RADIUS.full, paddingHorizontal: SPACING[4], paddingVertical: 12 },
  feelingText: { color: COLORS.text.secondary, fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold },
  skipButton: { marginTop: SPACING[4] },
});
