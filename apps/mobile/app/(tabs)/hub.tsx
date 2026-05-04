import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuickCapture } from '../../components/hub/QuickCapture';
import { CaptureFeed } from '../../components/hub/CaptureFeed';

interface CaptureItem {
  id: string;
  content: string;
  contentType: string;
  tags: string[];
  capturedAt: string;
  classificationStatus: string;
}

interface Project {
  id: string;
  name: string;
  area: string;
  status: string;
  deadline: string;
}

type HubMode = 'inbox' | 'projects' | 'knowledge' | 'review';

export default function HubScreen() {
  const [mode, setMode] = useState<HubMode>('inbox');
  const [captures, setCaptures] = useState<CaptureItem[]>([]);

  const handleCapture = (data: { content: string; tags: string[] }) => {
    const item: CaptureItem = {
      id: `local-${Date.now()}`,
      content: data.content,
      contentType: 'text',
      tags: data.tags,
      capturedAt: new Date().toISOString(),
      classificationStatus: 'pending',
    };
    setCaptures((prev) => [item, ...prev]);
  };

  const handleDismiss = (id: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  };

  const modes: { key: HubMode; label: string; icon: string; count?: number }[] = [
    { key: 'inbox', label: 'Inbox', icon: '📥', count: captures.filter((c) => c.classificationStatus === 'pending').length },
    { key: 'projects', label: 'Projects', icon: '📁' },
    { key: 'knowledge', label: 'Knowledge', icon: '📚' },
    { key: 'review', label: 'Review', icon: '📊' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.pageTitle}>Hub</Text>

      <View style={styles.modeBar}>
        {modes.map((m) => (
          <View key={m.key} style={styles.modeWrapper}>
            <Text
              style={[styles.modeLabel, mode === m.key && styles.modeLabelActive]}
              onPress={() => setMode(m.key)}
            >
              {m.label}
            </Text>
            {m.count ? <View style={styles.badge}><Text style={styles.badgeText}>{m.count}</Text></View> : null}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === 'inbox' && (
          <>
            <QuickCapture on_capture={handleCapture} />
            <CaptureFeed items={captures} on_dismiss={handleDismiss} />
          </>
        )}

        {mode === 'projects' && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📁</Text>
            <Text style={styles.placeholderTitle}>PARA Projects</Text>
            <Text style={styles.placeholderHint}>
              Organize by Projects, Areas, Resources, Archives
            </Text>
          </View>
        )}

        {mode === 'knowledge' && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📚</Text>
            <Text style={styles.placeholderTitle}>Knowledge Base</Text>
            <Text style={styles.placeholderHint}>
              Notes, references, and insights organized by PARA
            </Text>
          </View>
        )}

        {mode === 'review' && (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Daily Summary</Text>
            <View style={styles.reviewStats}>
              {[
                { label: 'Check-ins', value: '—' },
                { label: 'Habits', value: '—' },
                { label: 'Tasks', value: '—' },
                { label: 'Captures', value: String(captures.length) },
              ].map((stat) => (
                <View key={stat.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.reviewHint}>Connect to backend for live stats</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f23' },
  pageTitle: {
    color: '#e0e0e0',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  modeWrapper: { position: 'relative' },
  modeLabel: { color: '#555', fontSize: 14, fontWeight: '500', paddingBottom: 4 },
  modeLabelActive: { color: '#6c63ff', textDecorationLine: 'underline' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  content: { paddingBottom: 32 },
  placeholder: { alignItems: 'center', paddingTop: 48 },
  placeholderEmoji: { fontSize: 48 },
  placeholderTitle: { color: '#e0e0e0', fontSize: 20, fontWeight: '600', marginTop: 16 },
  placeholderHint: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8, maxWidth: 240, lineHeight: 20 },
  reviewCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
  },
  reviewTitle: { color: '#e0e0e0', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  reviewStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#6c63ff', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 4 },
  reviewHint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
