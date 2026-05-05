import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JournalFeed } from '../../components/journal/JournalFeed';
import { useJournal, useCreateEntry } from '../../hooks/useJournal';
import { useInsights, useGenerateInsights, useDismissInsight } from '../../hooks/useInsights';
import type { JournalEntry } from '../../hooks/useJournal';

type MindTab = 'journal' | 'insights';

export default function MindScreen() {
  const [activeTab, setActiveTab] = useState<MindTab>('journal');
  const [isComposing, setIsComposing] = useState(false);
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const { data: entries, isLoading: entriesLoading } = useJournal();
  const createEntry = useCreateEntry();

  const handleCreate = () => {
    if (!content.trim()) return;
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createEntry.mutate(
      { content: content.trim(), tags },
      {
        onSuccess: () => {
          setContent('');
          setTagInput('');
          setIsComposing(false);
        },
        onError: () => {
          Alert.alert('Error', 'Failed to create entry. Please try again.');
        },
      },
    );
  };

  const journalEntries: JournalEntry[] = entries ?? [];

  const tabs: { key: MindTab; label: string }[] = [
    { key: 'journal', label: 'Journal' },
    { key: 'insights', label: 'Insights' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'journal' && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Journal</Text>
                <TouchableOpacity
                  style={styles.composeButton}
                  onPress={() => setIsComposing(!isComposing)}
                >
                  <Text style={styles.composeButtonText}>
                    {isComposing ? 'Cancel' : '+ New Entry'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isComposing && (
                <View style={styles.composeCard}>
                  <TextInput
                    style={styles.input}
                    placeholder="What's on your mind?"
                    placeholderTextColor="#555"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    autoFocus
                  />
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Tags (comma-separated)"
                    placeholderTextColor="#555"
                    value={tagInput}
                    onChangeText={setTagInput}
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, !content.trim() && styles.saveButtonDisabled]}
                    onPress={handleCreate}
                    disabled={!content.trim() || createEntry.isPending}
                  >
                    <Text style={styles.saveButtonText}>
                      {createEntry.isPending ? 'Saving...' : 'Save Entry'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {entriesLoading ? (
                <ActivityIndicator color="#6c63ff" style={{ marginTop: 40 }} />
              ) : (
                <JournalFeed entries={journalEntries} />
              )}
            </>
          )}

          {activeTab === 'insights' && <InsightsPanel />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InsightsPanel() {
  const { data: insights, isLoading } = useInsights();
  const generateInsights = useGenerateInsights();
  const dismissInsight = useDismissInsight();

  if (isLoading) return <ActivityIndicator color="#6c63ff" style={{ marginTop: 40 }} />;

  const items = insights ?? [];

  return (
    <View style={styles.insightsSection}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => generateInsights.mutate(undefined, {
            onError: () => {
              Alert.alert('Error', 'Failed to generate insights. Please try again.');
            },
          })}
          disabled={generateInsights.isPending}
        >
          <Text style={styles.composeButtonText}>
            {generateInsights.isPending ? 'Generating...' : 'Generate'}
          </Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyInsights}>
          <Text style={styles.emptyEmoji}>💡</Text>
          <Text style={styles.emptyText}>No insights yet. Keep journaling and checking in!</Text>
        </View>
      ) : (
        items.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightType}>{insight.type}</Text>
              <Text style={styles.insightConfidence}>
                {Math.round(insight.confidence * 100)}%
              </Text>
            </View>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDesc}>{insight.description}</Text>
            <View style={styles.insightActions}>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => dismissInsight.mutate(insight.id, {
                  onError: () => {
                    Alert.alert('Error', 'Failed to dismiss insight. Please try again.');
                  },
                })}
              >
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {generateInsights.data && (
        <Text style={styles.generatedText}>
          Generated {generateInsights.data.generated} new insight{generateInsights.data.generated !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const COLORS = {
  bg: '#0f0f23',
  card: '#16213e',
  cardBorder: '#1a1a3e',
  text: '#e0e0e0',
  muted: '#666',
  accent: '#6c63ff',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  composeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  composeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  composeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInput: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: COLORS.cardBorder,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  insightsSection: { gap: 12 },
  insightCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  insightType: {
    color: COLORS.accent,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  insightConfidence: {
    color: COLORS.muted,
    fontSize: 11,
  },
  insightTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDesc: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  insightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dismissBtnText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  emptyInsights: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 240,
  },
  generatedText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
