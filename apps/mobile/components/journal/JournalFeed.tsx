import { View, Text, StyleSheet } from 'react-native';

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
  container: { gap: 8 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#555', fontSize: 14 },
  entryCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  content: { color: '#e0e0e0', fontSize: 14, lineHeight: 20 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  date: { color: '#555', fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: 4 },
  tag: {
    backgroundColor: '#1a1a3e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { color: '#6c63ff', fontSize: 11 },
});
