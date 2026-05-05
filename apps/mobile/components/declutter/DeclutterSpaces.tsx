import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSessions, useSession, useCreateSession, useAddItem, useMakeDecision } from '../../hooks/useDeclutter';
import type { DeclutterItem } from '../../hooks/useDeclutter';

const DECISION_OPTIONS = [
  { value: 'keep', label: 'Keep', emoji: '❤️' },
  { value: 'donate', label: 'Donate', emoji: '🎁' },
  { value: 'trash', label: 'Trash', emoji: '🗑️' },
  { value: 'recycle', label: 'Recycle', emoji: '♻️' },
  { value: 'sell', label: 'Sell', emoji: '💰' },
  { value: 'maybe', label: 'Maybe', emoji: '🤔' },
] as const;

const COLORS = {
  bg: '#0f0f23',
  card: '#16213e',
  cardBorder: '#1a1a3e',
  text: '#e0e0e0',
  muted: '#666',
  accent: '#6c63ff',
  accentLight: '#8b83ff',
  danger: '#ff6b6b',
  success: '#51cf66',
  warning: '#ffd43b',
};

interface Props {
  onBack: () => void;
}

export function DeclutterSpaces({ onBack }: Props) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeSessionId ? 'Session' : 'Declutter'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {activeSessionId ? (
        <SessionView
          sessionId={activeSessionId}
          onAddItem={() => setShowAddItem(true)}
          onClose={() => setActiveSessionId(null)}
        />
      ) : (
        <SessionList onSelect={setActiveSessionId} />
      )}

      {showAddItem && activeSessionId && (
        <AddItemOverlay
          sessionId={activeSessionId}
          onDone={() => setShowAddItem(false)}
        />
      )}
    </View>
  );
}

function SessionList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading } = useSessions();
  const createSession = useCreateSession();

  const sessions = data?.sessions ?? [];

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() =>
          createSession.mutate(undefined, {
            onSuccess: (res) => onSelect(res.session_id),
          })
        }
        disabled={createSession.isPending}
      >
        {createSession.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>+ New Session</Text>
        )}
      </TouchableOpacity>

      {isLoading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />}

      {sessions.length > 0 && (
        <Text style={styles.sectionTitle}>Previous Sessions</Text>
      )}

      {sessions.map((s) => (
        <TouchableOpacity
          key={s.session_id}
          style={styles.sessionCard}
          onPress={() => onSelect(s.session_id)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionDate}>
              {new Date(s.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.sessionStats}>
              {s.decided_items}/{s.total_items} decided
            </Text>
          </View>
          {s.money_on_table_high_usd > 0 && (
            <Text style={styles.moneyText}>
              ${s.money_on_table_low_usd}–${s.money_on_table_high_usd}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SessionView({
  sessionId,
  onAddItem,
  onClose,
}: {
  sessionId: string;
  onAddItem: () => void;
  onClose: () => void;
}) {
  const { data: session, isLoading } = useSession(sessionId);

  if (isLoading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;
  if (!session) return <Text style={styles.emptyText}>Session not found</Text>;

  const undicided = session.items.filter((i) => !i.decision);

  return (
    <View style={styles.section}>
      <View style={styles.sessionHeader}>
        <View>
          <Text style={styles.sessionDate}>
            {new Date(session.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.sessionStats}>
            {session.items.length} items · {session.items.filter((i) => i.decision).length} decided
          </Text>
        </View>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <Text style={styles.secondaryBtnText}>Close</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addItemBtn} onPress={onAddItem}>
        <Text style={styles.addItemBtnText}>+ Add Item</Text>
      </TouchableOpacity>

      {undicided.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Needs Decision</Text>
          {undicided.map((item) => (
            <ItemCard key={item.item_id} item={item} sessionId={sessionId} />
          ))}
        </>
      )}

      {session.items.filter((i) => i.decision).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Decided</Text>
          {session.items
            .filter((i) => i.decision)
            .map((item) => (
              <ItemCard key={item.item_id} item={item} sessionId={sessionId} />
            ))}
        </>
      )}

      {session.items.length === 0 && (
        <Text style={styles.emptyText}>No items yet. Add something to start!</Text>
      )}
    </View>
  );
}

function ItemCard({ item, sessionId }: { item: DeclutterItem; sessionId: string }) {
  const makeDecision = useMakeDecision(sessionId);
  const [expanded, setExpanded] = useState(false);

  const valLow = item.valuation?.estimated_low_usd;
  const valHigh = item.valuation?.estimated_high_usd;

  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemCondition}>{item.condition}</Text>
        </View>
        {item.decision ? (
          <Text style={styles.decidedBadge}>
            {DECISION_OPTIONS.find((d) => d.value === item.decision!.decision)?.emoji}{' '}
            {item.decision.decision}
          </Text>
        ) : valLow != null && valHigh != null ? (
          <Text style={styles.valueText}>${valLow}–${valHigh}</Text>
        ) : null}
      </View>

      {expanded && !item.decision && (
        <View style={styles.decisionRow}>
          {DECISION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.decisionBtn}
              onPress={() => makeDecision.mutate({ item_id: item.item_id, decision: opt.value })}
              disabled={makeDecision.isPending}
            >
              <Text style={styles.decisionEmoji}>{opt.emoji}</Text>
              <Text style={styles.decisionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function AddItemOverlay({
  sessionId,
  onDone,
}: {
  sessionId: string;
  onDone: () => void;
}) {
  const [label, setLabel] = useState('');
  const addItem = useAddItem(sessionId);

  const handleAdd = () => {
    if (!label.trim()) return;
    addItem.mutate(
      { label: label.trim(), condition: 'unknown' },
      { onSuccess: onDone },
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <Text style={styles.overlayTitle}>Add Item</Text>
        <TextInput
          style={styles.input}
          placeholder="What is it? (e.g. bluetooth speaker)"
          placeholderTextColor={COLORS.muted}
          value={label}
          onChangeText={setLabel}
          autoFocus
        />
        <View style={styles.overlayActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={handleAdd}
            disabled={!label.trim() || addItem.isPending}
          >
            {addItem.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontSize: 16 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondaryBtnText: { color: COLORS.accent, fontSize: 14 },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionInfo: { flex: 1 },
  sessionDate: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  sessionStats: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  moneyText: { color: COLORS.warning, fontSize: 14, fontWeight: '600' },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemBtn: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  addItemBtnText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemLabel: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  itemCondition: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  valueText: { color: COLORS.success, fontSize: 14, fontWeight: '600' },
  decidedBadge: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  decisionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  decisionBtn: {
    backgroundColor: '#1a2744',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 56,
  },
  decisionEmoji: { fontSize: 18 },
  decisionLabel: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  overlayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  overlayTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0d1b36',
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  overlayActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.muted, fontSize: 16 },
});
