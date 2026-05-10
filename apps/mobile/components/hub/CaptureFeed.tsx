import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

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
  container: { gap: SPACING[2] },
  empty: { alignItems: 'center', padding: SPACING[6] },
  emptyText: { color: COLORS.text.muted, fontSize: FONT.size.sm },
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeIcon: { fontSize: FONT.size.sm },
  timestamp: { color: COLORS.text.muted, fontSize: FONT.size.xs - 1 },
  content: { color: COLORS.text.primary, fontSize: FONT.size.sm, lineHeight: FONT.size.xl },
  tagRow: { flexDirection: 'row', gap: SPACING[1], marginTop: SPACING[2] },
  tag: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: 6,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
  },
  tagText: { color: COLORS.primary, fontSize: FONT.size.xs - 1 },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[2],
    paddingTop: SPACING[2],
    borderTopColor: COLORS.dark.elevated,
    borderTopWidth: 1,
  },
  pendingLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs - 1, fontStyle: 'italic' },
  dismissText: { color: COLORS.primary, fontSize: FONT.size.xs },
});
