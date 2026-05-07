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
import { COLORS, RADIUS, FONT, SPACING } from '../../lib/theme';

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
    return <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[10] }} />;
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
    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: SPACING[6] }}>
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
    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: SPACING[6] }}>
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
          placeholderTextColor={COLORS.text.muted}
          value={label}
          onChangeText={setLabel}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Category (optional)"
          placeholderTextColor={COLORS.text.muted}
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
          placeholderTextColor={COLORS.text.muted}
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
  container: { flex: 1, backgroundColor: COLORS.dark.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.elevated,
  },
  backBtn: { padding: SPACING[2] },
  backText: { color: COLORS.primary, fontSize: FONT.size.base },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold },
  list: { flex: 1, paddingHorizontal: SPACING[4], paddingTop: SPACING[4] },
  spaceCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  spaceInfo: { flex: 1 },
  spaceName: { color: COLORS.text.primary, fontSize: FONT.size.base, fontWeight: FONT.weight.semibold },
  spaceDate: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginTop: SPACING[1] },
  scanBadge: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[2] + 2,
    paddingVertical: SPACING[1],
  },
  scanBadgeText: { color: COLORS.primary, fontSize: FONT.size.xs, fontWeight: FONT.weight.semibold },
  sectionTitle: {
    color: COLORS.text.muted,
    fontSize: FONT.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[3],
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT.size.base, fontWeight: FONT.weight.semibold },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: FONT.weight.semibold },
  completeBtn: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  completeBtnText: { color: '#fff', fontSize: FONT.size.base, fontWeight: FONT.weight.semibold },
  activeScanSection: { marginTop: SPACING[3] },
  activeScanTitle: { color: COLORS.warning, fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, marginBottom: SPACING[2] },
  scanCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    marginTop: SPACING[4],
  },
  scanCardLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs, textTransform: 'uppercase', letterSpacing: 1 },
  scanCardStatus: { color: COLORS.text.primary, fontSize: FONT.size.base, fontWeight: FONT.weight.semibold, marginTop: SPACING[1] },
  scanCardDate: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginTop: SPACING[1] },
  fab: {
    position: 'absolute',
    bottom: SPACING[6],
    left: SPACING[4],
    right: SPACING[4],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING[4],
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: FONT.size.base, fontWeight: FONT.weight.bold },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: FONT.size['5xl'], marginBottom: SPACING[3] },
  emptyText: { color: COLORS.text.primary, fontSize: FONT.size.base, fontWeight: FONT.weight.semibold },
  emptyHint: { color: COLORS.text.muted, fontSize: 13, marginTop: SPACING[1] },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING[6],
  },
  overlayCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.xl,
    padding: SPACING[5],
  },
  overlayTitle: { color: COLORS.text.primary, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, marginBottom: SPACING[4] },
  input: {
    backgroundColor: COLORS.dark.background,
    borderRadius: 10,
    padding: 14,
    color: COLORS.text.primary,
    fontSize: FONT.size.base,
    marginBottom: SPACING[2],
  },
  overlayActions: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[2] },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: COLORS.text.muted, fontSize: FONT.size.base },
});
