import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6c63ff',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  icon: { fontSize: 20 },
  title: { color: '#e0e0e0', fontSize: 15, fontWeight: '600', flex: 1 },
  description: { color: '#aaa', fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dismissText: { color: '#555', fontSize: 12, paddingVertical: 6 },
});
