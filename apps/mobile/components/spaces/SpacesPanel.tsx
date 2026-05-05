import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  useSpaces,
  useCreateSpace,
  useStartScan,
  useCompleteScan,
  useAddDetectedItem,
} from '../../hooks/useSpaces';

const COLORS = {
  bg: '#0f0f23',
  card: '#16213e',
  cardBorder: '#1a1a3e',
  text: '#e0e0e0',
  muted: '#666',
  accent: '#6c63ff',
  success: '#51cf66',
  warning: '#ffd43b',
};

const SCAN_STATUS_LABELS: Record<string, string> = {
  pending: 'In Progress',
  completed: 'Completed',
};

interface Props {
  onBack: () => void;
}

export function SpacesPanel({ onBack }: Props) {
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [showNewSpace, setShowNewSpace] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeSpaceId ? 'Space Details' : 'My Spaces'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {activeSpaceId ? (
        <SpaceDetail spaceId={activeSpaceId} />
      ) : (
        <SpaceList onSelect={setActiveSpaceId} />
      )}

      {showNewSpace && !activeSpaceId && (
        <NewSpaceOverlay onDone={() => setShowNewSpace(false)} />
      )}

      {!activeSpaceId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowNewSpace(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.fabText}>+ New Space</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SpaceList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: spaces, isLoading } = useSpaces();

  if (isLoading) {
    return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;
  }

  if (!spaces || spaces.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🏠</Text>
        <Text style={styles.emptyText}>No spaces yet</Text>
        <Text style={styles.emptyHint}>Create a space to start scanning</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 80 }}>
      {spaces.map((space) => {
        const latestScan = space.scans?.[0];
        return (
          <TouchableOpacity
            key={space.id}
            style={styles.spaceCard}
            onPress={() => onSelect(space.id)}
            activeOpacity={0.7}
          >
            <View style={styles.spaceInfo}>
              <Text style={styles.spaceName}>{space.name}</Text>
              <Text style={styles.spaceDate}>
                Created {new Date(space.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {latestScan && (
              <View style={styles.scanBadge}>
                <Text style={styles.scanBadgeText}>
                  {SCAN_STATUS_LABELS[latestScan.status] ?? latestScan.status}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function SpaceDetail({ spaceId }: { spaceId: string }) {
  const { data: spaces } = useSpaces();
  const space = spaces?.find((s) => s.id === spaceId);
  const startScan = useStartScan();
  const [showAddItem, setShowAddItem] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  if (!space) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Space not found</Text>
      </View>
    );
  }

  const latestScan = space.scans?.[0];

  const handleStartScan = () => {
    startScan.mutate(
      { spaceId, beforePhotoUri: 'camera://placeholder' },
      {
        onSuccess: (scan) => setActiveScanId(scan.id),
        onError: () => Alert.alert('Error', 'Failed to start scan. Please try again.'),
      },
    );
  };

  return (
    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.sectionTitle}>{space.name}</Text>

      {!activeScanId && (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleStartScan}
          disabled={startScan.isPending}
          activeOpacity={0.7}
        >
          {startScan.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Start Scan</Text>
          )}
        </TouchableOpacity>
      )}

      {activeScanId && (
        <ActiveScanView
          scanId={activeScanId}
          onAddItem={() => setShowAddItem(true)}
          onClose={() => setActiveScanId(null)}
        />
      )}

      {latestScan && !activeScanId && (
        <View style={styles.scanCard}>
          <Text style={styles.scanCardLabel}>Latest Scan</Text>
          <Text style={styles.scanCardStatus}>
            {SCAN_STATUS_LABELS[latestScan.status] ?? latestScan.status}
          </Text>
          <Text style={styles.scanCardDate}>
            {new Date(latestScan.scannedAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      {showAddItem && activeScanId && (
        <AddItemOverlay
          scanId={activeScanId}
          onDone={() => setShowAddItem(false)}
        />
      )}
    </ScrollView>
  );
}

function ActiveScanView({
  scanId,
  onAddItem,
  onClose,
}: {
  scanId: string;
  onAddItem: () => void;
  onClose: () => void;
}) {
  const completeScan = useCompleteScan();

  const handleComplete = () => {
    completeScan.mutate(
      { scanId },
      {
        onSuccess: onClose,
        onError: () => Alert.alert('Error', 'Failed to complete scan. Please try again.'),
      },
    );
  };

  return (
    <View style={styles.activeScanSection}>
      <Text style={styles.activeScanTitle}>Scan in Progress</Text>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onAddItem} activeOpacity={0.7}>
        <Text style={styles.secondaryBtnText}>+ Add Item</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.completeBtn}
        onPress={handleComplete}
        disabled={completeScan.isPending}
        activeOpacity={0.7}
      >
        {completeScan.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.completeBtnText}>Complete Scan</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function AddItemOverlay({ scanId, onDone }: { scanId: string; onDone: () => void }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const addDetectedItem = useAddDetectedItem();

  const handleAdd = () => {
    if (!label.trim()) return;
    addDetectedItem.mutate(
      { scanId, label: label.trim(), confidence: 1.0, category: category.trim() || undefined },
      {
        onSuccess: () => {
          setLabel('');
          setCategory('');
          onDone();
        },
        onError: () => Alert.alert('Error', 'Failed to add item. Please try again.'),
      },
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <Text style={styles.overlayTitle}>Add Detected Item</Text>
        <TextInput
          style={styles.input}
          placeholder="Item label (e.g. old jacket)"
          placeholderTextColor={COLORS.muted}
          value={label}
          onChangeText={setLabel}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Category (optional)"
          placeholderTextColor={COLORS.muted}
          value={category}
          onChangeText={setCategory}
        />
        <View style={styles.overlayActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={handleAdd}
            disabled={!label.trim() || addDetectedItem.isPending}
            activeOpacity={0.7}
          >
            {addDetectedItem.isPending ? (
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

function NewSpaceOverlay({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const createSpace = useCreateSpace();

  const handleCreate = () => {
    if (!name.trim()) return;
    createSpace.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName('');
          onDone();
        },
        onError: () => Alert.alert('Error', 'Failed to create space. Please try again.'),
      },
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <Text style={styles.overlayTitle}>New Space</Text>
        <TextInput
          style={styles.input}
          placeholder="Space name (e.g. Garage, Closet)"
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <View style={styles.overlayActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={handleCreate}
            disabled={!name.trim() || createSpace.isPending}
            activeOpacity={0.7}
          >
            {createSpace.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create</Text>
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
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  spaceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spaceInfo: { flex: 1 },
  spaceName: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  spaceDate: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  scanBadge: {
    backgroundColor: '#1a2744',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scanBadgeText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  completeBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  activeScanSection: { marginTop: 12 },
  activeScanTitle: { color: COLORS.warning, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  scanCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  scanCardLabel: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  scanCardStatus: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 4 },
  scanCardDate: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
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
  overlayTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#0d1b36',
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 8,
  },
  overlayActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: COLORS.muted, fontSize: 16 },
});
