import { View, Text, StyleSheet } from 'react-native';
import { useEmotionalStore } from '../stores/emotional';
import { useCurrentContext } from '../hooks/useCheckins';
import { COLORS, COPY, FONT, RADIUS, SPACING } from '../lib/theme';
import { Surface } from './design/System';

const STATE_COPY: Record<string, { label: string; guidance: string; tone: string }> = {
  high_energy_pleasant: {
    label: 'High capacity',
    guidance: 'Use this window for one meaningful push. Keep the scope finite.',
    tone: COLORS.highEnergy,
  },
  high_energy_unpleasant: {
    label: 'Activated',
    guidance: 'Reduce inputs. Pick one grounding action before hard tasks.',
    tone: COLORS.warning,
  },
  low_energy_pleasant: {
    label: 'Soft capacity',
    guidance: 'Choose an easy win or review mode. Do not force intensity.',
    tone: COLORS.lowEnergy,
  },
  low_energy_unpleasant: {
    label: 'Protection mode',
    guidance: 'One tiny step only. Capture the open loop, then stabilize.',
    tone: COLORS.soma,
  },
};

function timeLabel() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Night field';
  if (hour < 12) return 'Morning field';
  if (hour < 17) return 'Day field';
  if (hour < 21) return 'Evening field';
  return 'Late field';
}

export function ContextGreeting() {
  const computedState = useEmotionalStore((s) => s.computedState);
  const { data: context } = useCurrentContext();
  const state = context?.emotionalState || computedState || null;
  const stateCopy = state ? STATE_COPY[state] : null;

  return (
    <Surface tone={stateCopy?.tone ?? COLORS.primary} style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>{timeLabel()}</Text>
          <Text style={styles.title}>What does your system need?</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: stateCopy?.tone ?? COLORS.primary }]} />
      </View>

      <Text style={styles.subtitle}>{stateCopy?.guidance ?? COPY.productLine}</Text>

      <View style={styles.stateRow}>
        <View style={styles.statePill}>
          <Text style={styles.statePillLabel}>Current state</Text>
          <Text style={[styles.statePillValue, { color: stateCopy?.tone ?? COLORS.primary }]}>
            {stateCopy?.label ?? 'Unscanned'}
          </Text>
        </View>
        <View style={styles.statePill}>
          <Text style={styles.statePillLabel}>Interface mode</Text>
          <Text style={styles.statePillValue}>Low recall</Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING[4] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING[4] },
  eyebrow: { color: COLORS.primary, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: SPACING[2] },
  title: { color: COLORS.text.primary, fontSize: FONT.size['3xl'], lineHeight: 38, fontWeight: FONT.weight.black, letterSpacing: -0.8 },
  subtitle: { color: COLORS.text.secondary, fontSize: FONT.size.base, lineHeight: 23, marginTop: SPACING[3] },
  statusDot: { width: 14, height: 14, borderRadius: RADIUS.full, marginTop: SPACING[1] },
  stateRow: { flexDirection: 'row', gap: SPACING[2], marginTop: SPACING[4] },
  statePill: { flex: 1, borderRadius: RADIUS.lg, backgroundColor: COLORS.dark.elevated, borderWidth: 1, borderColor: COLORS.dark.border, padding: SPACING[3] },
  statePillLabel: { color: COLORS.text.dim, fontSize: FONT.size.xs, fontWeight: FONT.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  statePillValue: { color: COLORS.text.primary, fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, marginTop: SPACING[1] },
});
