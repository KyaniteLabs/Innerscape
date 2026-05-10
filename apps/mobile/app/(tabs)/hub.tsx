import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuickCapture } from '../../components/hub/QuickCapture';
import { useCaptures, useCreateCapture, useDeleteCapture } from '../../hooks/useCapture';
import { useProjects, useCreateProject, useArchiveProject } from '../../hooks/useProjects';
import { useKnowledge, useCreateKnowledge, useDeleteKnowledge } from '../../hooks/useKnowledge';
import { useDailySummary, useWeeklyReview } from '../../hooks/useReview';
import { TradeMarketplace } from '../../components/trade/TradeMarketplace';
import { COLORS, SPACING, RADIUS, MODULE } from '../../lib/theme';

type HubMode = 'inbox' | 'projects' | 'knowledge' | 'review' | 'trade';

export default function HubScreen() {
  const [mode, setMode] = useState<HubMode>('inbox');
  const { data: captures } = useCaptures();
  const pendingCount = (captures ?? []).filter((c) => c.classificationStatus === 'pending').length;

  const modes: { key: HubMode; label: string; icon: string; count?: number }[] = [
    { key: 'inbox', label: 'Inbox', icon: '📥', count: pendingCount || undefined },
    { key: 'projects', label: 'Projects', icon: '📁' },
    { key: 'knowledge', label: 'Knowledge', icon: '📚' },
    { key: 'review', label: 'Review', icon: '📊' },
    { key: 'trade', label: 'Trade', icon: '🔄' },
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
        {mode === 'inbox' && <InboxPanel />}
        {mode === 'projects' && <ProjectsPanel />}
        {mode === 'knowledge' && <KnowledgePanel />}
        {mode === 'review' && <ReviewPanel />}
        {mode === 'trade' && <TradeMarketplace onBack={() => setMode('inbox')} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function InboxPanel() {
  const { data: captures, isLoading } = useCaptures();
  const createCapture = useCreateCapture();
  const deleteCapture = useDeleteCapture();

  const handleCapture = (data: { content: string; tags: string[] }) => {
    createCapture.mutate(
      { content: data.content, tags: data.tags },
      { onError: () => Alert.alert('Error', 'Failed to create capture. Please try again.') },
    );
  };

  if (isLoading) return <ActivityIndicator color={MODULE.hub.color} style={{ marginTop: 40 }} />;

  const items = captures ?? [];

  return (
    <>
      <QuickCapture on_capture={handleCapture} />
      <View style={styles.feedContainer}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyKicker}>Capture field</Text>
            <Text style={styles.emptyTitle}>No open loops in the inbox.</Text>
            <Text style={styles.emptyText}>When something appears in working memory, capture it before it decays.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.captureCard}>
              <View style={styles.captureHeader}>
                <Text style={styles.captureTime}>
                  {new Date(item.capturedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
                <TouchableOpacity onPress={() => deleteCapture.mutate(item.id, { onError: () => Alert.alert('Error', 'Failed to delete capture. Please try again.') })}>
                  <Text style={styles.dismissText}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.captureContent} numberOfLines={3}>{item.content}</Text>
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
                <Text style={styles.pendingLabel}>Unsorted</Text>
              )}
            </View>
          ))
        )}
      </View>
    </>
  );
}

function ProjectsPanel() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const archiveProject = useArchiveProject();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim() },
      { onSuccess: () => { setName(''); setShowNew(false); }, onError: () => Alert.alert('Error', 'Failed to create project. Please try again.') },
    );
  };

  if (isLoading) return <ActivityIndicator color={MODULE.hub.color} style={{ marginTop: 40 }} />;

  const projectList = projects ?? [];

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Projects</Text>
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
          <Text style={styles.addBtnText}>{showNew ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {showNew && (
        <View style={styles.addCard}>
          <TextInput
            style={styles.addInput}
            placeholder="Project name..."
            placeholderTextColor={COLORS.text.muted}
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={handleCreate}
          />
        </View>
      )}

      {projectList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyKicker}>Projects</Text>
          <Text style={styles.emptyTitle}>No active containers yet.</Text>
          <Text style={styles.emptyText}>Create a project only when there is a real finish line.</Text>
        </View>
      ) : (
        projectList.map((p) => (
          <View key={p.id} style={styles.projectCard}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{p.name}</Text>
              <Text style={styles.projectMeta}>{p.area} · {p.status}</Text>
            </View>
            {p.status !== 'archived' && (
              <TouchableOpacity onPress={() => archiveProject.mutate(p.id, { onError: () => Alert.alert('Error', 'Failed to archive project. Please try again.') })}>
                <Text style={styles.archiveBtn}>Archive</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </>
  );
}

function KnowledgePanel() {
  const { data: items, isLoading } = useKnowledge();
  const createKnowledge = useCreateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    createKnowledge.mutate(
      { title: title.trim(), content: content.trim() },
      { onSuccess: () => { setTitle(''); setContent(''); setShowNew(false); }, onError: () => Alert.alert('Error', 'Failed to create knowledge. Please try again.') },
    );
  };

  if (isLoading) return <ActivityIndicator color={MODULE.hub.color} style={{ marginTop: 40 }} />;

  const knowledgeItems = items ?? [];

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Knowledge Base</Text>
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
          <Text style={styles.addBtnText}>{showNew ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {showNew && (
        <View style={styles.addCard}>
          <TextInput
            style={styles.addInput}
            placeholder="Title..."
            placeholderTextColor={COLORS.text.muted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={[styles.addInput, { minHeight: 60, marginTop: 8 }]}
            placeholder="Content..."
            placeholderTextColor={COLORS.text.muted}
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity
            style={[styles.saveBtn, (!title.trim() || !content.trim()) && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={!title.trim() || !content.trim()}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {knowledgeItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyKicker}>Knowledge</Text>
          <Text style={styles.emptyTitle}>Nothing archived for resurfacing yet.</Text>
          <Text style={styles.emptyText}>Store references here when they should return later without recall.</Text>
        </View>
      ) : (
        knowledgeItems.map((item) => (
          <View key={item.id} style={styles.knowledgeCard}>
            <View style={styles.knowledgeHeader}>
              <Text style={styles.knowledgeTitle}>{item.title}</Text>
              <TouchableOpacity onPress={() => deleteKnowledge.mutate(item.id, { onError: () => Alert.alert('Error', 'Failed to delete knowledge. Please try again.') })}>
                <Text style={styles.dismissText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.knowledgeContent} numberOfLines={2}>{item.content}</Text>
            {item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.knowledgeCategory}>{item.paraCategory}</Text>
          </View>
        ))
      )}
    </>
  );
}

function ReviewPanel() {
  const { data: daily, isLoading: dailyLoading } = useDailySummary();
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyReview();

  if (dailyLoading || weeklyLoading) return <ActivityIndicator color={MODULE.hub.color} style={{ marginTop: 40 }} />;

  return (
    <>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Daily Summary</Text>
        <View style={styles.reviewStats}>
          {daily ? [
            { label: 'Check-ins', value: String(daily.emotionalCheckIns) },
            { label: 'Habits', value: String(daily.habitsCompleted) },
            { label: 'Tasks', value: String(daily.tasksCompleted) },
            { label: 'Captures', value: String(daily.itemsCaptured) },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          )) : (
            <Text style={styles.emptyText}>No data yet</Text>
          )}
        </View>
        {daily && daily.totalActivity > 0 && (
          <Text style={styles.totalActivity}>{daily.totalActivity} total actions today</Text>
        )}
      </View>

      {weekly && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Weekly Overview</Text>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Avg Energy</Text>
            <Text style={styles.weeklyValue}>{weekly.avgEnergy}/5</Text>
          </View>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Check-ins</Text>
            <Text style={styles.weeklyValue}>{weekly.checkInCount}</Text>
          </View>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Tasks Done</Text>
            <Text style={styles.weeklyValue}>{weekly.tasksCompleted}</Text>
          </View>

          {weekly.topTags.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.weeklyLabel}>Top Tags</Text>
              <View style={styles.tagRow}>
                {weekly.topTags.map((t) => (
                  <View key={t.tag} style={styles.tag}>
                    <Text style={styles.tagText}>{t.tag} ({t.count})</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {weekly.habits.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.weeklyLabel}>Habit Streaks</Text>
              {weekly.habits.map((h) => (
                <View key={h.name} style={styles.weeklyRow}>
                  <Text style={styles.weeklyValue}>{h.name}</Text>
                  <Text style={styles.streakText}>{h.streak}🔥 (best: {h.longestStreak})</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.dark.background },
  pageTitle: { color: COLORS.text.primary, fontSize: 24, fontWeight: '700', paddingHorizontal: SPACING[4], marginBottom: SPACING[3] },
  modeBar: { flexDirection: 'row', paddingHorizontal: SPACING[4], marginBottom: SPACING[4], gap: SPACING[4] },
  modeWrapper: { position: 'relative' },
  modeLabel: { color: COLORS.text.muted, fontSize: 14, fontWeight: '500', paddingBottom: 4 },
  modeLabelActive: { color: MODULE.hub.color, textDecorationLine: 'underline' },
  badge: { position: 'absolute', top: -6, right: -12, backgroundColor: MODULE.hub.color, borderRadius: RADIUS.md, paddingHorizontal: 5, paddingVertical: 1, minWidth: SPACING[4], alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  content: { paddingBottom: SPACING[8] },
  // Shared
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[3], paddingHorizontal: SPACING[4] },
  sectionTitle: { color: COLORS.text.primary, fontSize: 18, fontWeight: '600' },
  addBtnText: { color: MODULE.hub.color, fontSize: 14, fontWeight: '600' },
  addCard: { backgroundColor: COLORS.dark.card, borderRadius: RADIUS.lg, padding: SPACING[3], marginBottom: SPACING[3], marginHorizontal: SPACING[4] },
  addInput: { color: COLORS.text.primary, fontSize: 15 },
  saveBtn: { backgroundColor: MODULE.hub.color, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center', marginTop: SPACING[2] },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { backgroundColor: COLORS.dark.card, borderWidth: 1, borderColor: MODULE.hub.border, borderRadius: RADIUS['2xl'], padding: SPACING[5], marginTop: SPACING[3] },
  emptyKicker: { color: MODULE.hub.color, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyTitle: { color: COLORS.text.primary, fontSize: 20, fontWeight: '800', marginTop: SPACING[2] },
  emptyText: { color: COLORS.text.secondary, fontSize: 14, lineHeight: 20, marginTop: SPACING[2] },
  // Inbox
  feedContainer: { paddingHorizontal: SPACING[4] },
  captureCard: { backgroundColor: COLORS.dark.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: SPACING[2] },
  captureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  captureTime: { color: COLORS.text.muted, fontSize: 11 },
  dismissText: { color: MODULE.hub.color, fontSize: 16 },
  captureContent: { color: COLORS.text.primary, fontSize: 14, lineHeight: 20 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: SPACING[2] },
  tag: { backgroundColor: COLORS.dark.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING[2], paddingVertical: 2 },
  tagText: { color: MODULE.hub.color, fontSize: 11 },
  pendingLabel: { color: COLORS.text.muted, fontSize: 11, fontStyle: 'italic', marginTop: 6 },
  // Projects
  projectCard: { backgroundColor: COLORS.dark.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: SPACING[2], marginHorizontal: SPACING[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectInfo: { flex: 1 },
  projectName: { color: COLORS.text.primary, fontSize: 15, fontWeight: '600' },
  projectMeta: { color: COLORS.text.secondary, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  archiveBtn: { color: COLORS.text.secondary, fontSize: 12 },
  // Knowledge
  knowledgeCard: { backgroundColor: COLORS.dark.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: SPACING[2], marginHorizontal: SPACING[4] },
  knowledgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  knowledgeTitle: { color: COLORS.text.primary, fontSize: 15, fontWeight: '600', flex: 1 },
  knowledgeContent: { color: COLORS.text.secondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  knowledgeCategory: { color: COLORS.text.muted, fontSize: 11, marginTop: 6, textTransform: 'capitalize' },
  // Review
  reviewCard: { backgroundColor: COLORS.dark.card, borderRadius: RADIUS.xl, padding: SPACING[5], marginHorizontal: SPACING[4], marginBottom: SPACING[4] },
  reviewTitle: { color: COLORS.text.primary, fontSize: 18, fontWeight: '600', marginBottom: SPACING[4] },
  reviewStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: MODULE.hub.color, fontSize: 24, fontWeight: '700' },
  statLabel: { color: COLORS.text.secondary, fontSize: 11, marginTop: 4 },
  totalActivity: { color: COLORS.text.secondary, fontSize: 12, textAlign: 'center', marginTop: SPACING[3] },
  weeklyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  weeklyLabel: { color: COLORS.text.secondary, fontSize: 13 },
  weeklyValue: { color: COLORS.text.primary, fontSize: 14, fontWeight: '500' },
  streakText: { color: COLORS.text.primary, fontSize: 13 },
});
