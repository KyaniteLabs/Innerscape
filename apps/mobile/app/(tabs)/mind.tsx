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
import { COLORS, SPACING, RADIUS, MODULE } from '../../lib/theme';

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
                    placeholderTextColor={COLORS.text.muted}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    autoFocus
                  />
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Tags (comma-separated)"
                    placeholderTextColor={COLORS.text.muted}
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
                <ActivityIndicator color={MODULE.mind.color} style={{ marginTop: SPACING[10] }} />
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

  if (isLoading) return <ActivityIndicator color={MODULE.mind.color} style={{ marginTop: SPACING[10] }} />;

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
          <Text style={styles.emptyKicker}>Pattern engine</Text>
          <Text style={styles.emptyTitle}>No pattern has enough signal yet.</Text>
          <Text style={styles.emptyText}>A few check-ins or entries will give the system something real to correlate.</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.dark.background },
  flex: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING[4],
    marginTop: SPACING[2],
    marginBottom: SPACING[4],
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING[2],
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: { backgroundColor: MODULE.mind.color },
  tabText: { color: COLORS.text.secondary, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: COLORS.text.primary },
  content: { paddingHorizontal: SPACING[4], paddingBottom: SPACING[8] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  title: { color: COLORS.text.primary, fontSize: 24, fontWeight: '700' },
  composeButton: {
    backgroundColor: MODULE.mind.color,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: SPACING[2],
  },
  composeButtonText: { color: COLORS.text.primary, fontSize: 14, fontWeight: '600' },
  composeCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  input: {
    color: COLORS.text.primary,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInput: {
    color: COLORS.text.primary,
    fontSize: 13,
    marginTop: SPACING[2],
    paddingTop: SPACING[2],
    borderTopColor: COLORS.dark.border,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: MODULE.mind.color,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: COLORS.text.primary, fontSize: 14, fontWeight: '600' },
  insightsSection: { gap: SPACING[3] },
  insightCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING[2],
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  insightType: {
    color: MODULE.mind.color,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  insightConfidence: {
    color: COLORS.text.muted,
    fontSize: 11,
  },
  insightTitle: {
    color: COLORS.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDesc: {
    color: COLORS.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  insightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING[2],
  },
  dismissBtn: {
    paddingHorizontal: SPACING[3],
    paddingVertical: 4,
  },
  dismissBtnText: {
    color: COLORS.text.muted,
    fontSize: 12,
  },
  emptyInsights: { backgroundColor: COLORS.dark.card, borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: MODULE.mind.border, padding: SPACING[5], marginTop: SPACING[3] },
  emptyEmoji: { fontSize: 48 },
  emptyKicker: { color: MODULE.mind.color, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyTitle: { color: COLORS.text.primary, fontSize: 20, fontWeight: '800', marginTop: SPACING[2] },
  emptyText: { color: COLORS.text.secondary, fontSize: 14, lineHeight: 20, marginTop: SPACING[2] },
  generatedText: {
    color: COLORS.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
});
