import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

interface JournalEntry {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface JournalFeedProps {
  entries: JournalEntry[];
}

export function JournalFeed({ entries }: JournalFeedProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No journal entries yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entryCard}>
          <Text style={styles.content} numberOfLines={3}>{entry.content}</Text>
          <View style={styles.meta}>
            <Text style={styles.date}>
              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            {entry.tags.length > 0 && (
              <View style={styles.tagRow}>
                {entry.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING[2] },
  empty: { alignItems: 'center', padding: SPACING[6] },
  emptyText: { color: COLORS.text.muted, fontSize: FONT.size.sm },
  entryCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
  },
  content: { color: COLORS.text.primary, fontSize: FONT.size.sm, lineHeight: FONT.size.xl },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[2],
  },
  date: { color: COLORS.text.muted, fontSize: FONT.size.xs },
  tagRow: { flexDirection: 'row', gap: SPACING[1] },
  tag: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
  },
  tagText: { color: COLORS.primary, fontSize: FONT.size.xs - 1 },
});
