import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  dismissedAt: string | null;
  actedUponAt: string | null;
}

interface InsightCardProps {
  insight: Insight;
  on_dismiss?: (id: string) => void;
  on_act?: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  energy_dip: '🔋',
  low_energy_sustained: '😴',
  energy_trend_up: '📈',
  energy_trend_down: '📉',
  sleep_quality_low: '🛌',
  sleep_short: '⏰',
  habit_record: '🏆',
  habit_momentum: '💪',
  habit_broken: '💔',
  journal_prompt: '📝',
  journal_consistency: '📓',
  valence_unpleasant_sustained: '🌧️',
  valence_improving: '☀️',
  checkin_reminder: '🔔',
};

export function InsightCard({ insight, on_dismiss, on_act }: InsightCardProps) {
  const icon = TYPE_ICONS[insight.type] || '💡';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{insight.title}</Text>
      </View>
      <Text style={styles.description}>{insight.description}</Text>
      <View style={styles.actions}>
        {on_act && !insight.actedUponAt && (
          <TouchableOpacity style={styles.actButton} onPress={() => on_act(insight.id)}>
            <Text style={styles.actText}>Take Action</Text>
          </TouchableOpacity>
        )}
        {on_dismiss && !insight.dismissedAt && (
          <TouchableOpacity onPress={() => on_dismiss(insight.id)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2], marginBottom: SPACING[2] },
  icon: { fontSize: FONT.size.xl },
  title: { color: COLORS.text.primary, fontSize: FONT.size.base - 1, fontWeight: FONT.weight.semibold, flex: 1 },
  description: { color: COLORS.text.secondary, fontSize: FONT.size.sm - 1, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: SPACING[4], marginTop: SPACING[3] },
  actButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: SPACING[3],
    paddingVertical: 6,
  },
  actText: { color: COLORS.text.inverse, fontSize: FONT.size.xs, fontWeight: FONT.weight.semibold },
  dismissText: { color: COLORS.text.muted, fontSize: FONT.size.xs, paddingVertical: 6 },
});
