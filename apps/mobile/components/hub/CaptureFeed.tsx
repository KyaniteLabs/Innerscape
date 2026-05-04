import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CaptureItem {
  id: string;
  content: string;
  contentType: string;
  tags: string[];
  capturedAt: string;
  classificationStatus: string;
}

interface CaptureFeedProps {
  items: CaptureItem[];
  on_dismiss?: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  text: '📝',
  voice: '🎙️',
  image: '📷',
  link: '🔗',
};

export function CaptureFeed({ items, on_dismiss }: CaptureFeedProps) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Inbox is clear</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.typeIcon}>{TYPE_ICONS[item.contentType] || '📝'}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.capturedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
          {item.tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {item.classificationStatus === 'pending' && (
            <View style={styles.pendingRow}>
              <Text style={styles.pendingLabel}>Unsorted</Text>
              {on_dismiss && (
                <TouchableOpacity onPress={() => on_dismiss(item.id)}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#555', fontSize: 14 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeIcon: { fontSize: 14 },
  timestamp: { color: '#444', fontSize: 11 },
  content: { color: '#e0e0e0', fontSize: 14, lineHeight: 20 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  tag: {
    backgroundColor: '#1a1a3e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { color: '#6c63ff', fontSize: 11 },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: '#1a1a3e',
    borderTopWidth: 1,
  },
  pendingLabel: { color: '#555', fontSize: 11, fontStyle: 'italic' },
  dismissText: { color: '#6c63ff', fontSize: 12 },
});
