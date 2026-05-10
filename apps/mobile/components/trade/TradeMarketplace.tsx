import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {
  useListings,
  useMyListings,
  useCredits,
  useCreateListing,
  useCreateMatch,
  useTradeRules,
  useTradeSafety,
} from '../../hooks/useTrade';
import type { TradeListing } from '../../hooks/useTrade';
import { COLORS, RADIUS, FONT, SPACING } from '../../lib/theme';

type TradeView = 'browse' | 'mine' | 'credits' | 'create' | 'rules';

interface Props {
  onBack: () => void;
}

export function TradeMarketplace({ onBack }: Props) {
  const [view, setView] = useState<TradeView>('browse');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trade</Text>
        <CreditsBadge />
      </View>

      <View style={styles.tabBar}>
        {([
          { key: 'browse', label: 'Browse' },
          { key: 'mine', label: 'My Items' },
          { key: 'create', label: '+ List' },
          { key: 'credits', label: 'Credits' },
          { key: 'rules', label: 'Guide' },
        ] as { key: TradeView; label: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, view === tab.key && styles.tabActive]}
            onPress={() => setView(tab.key)}
          >
            <Text style={[styles.tabText, view === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {view === 'browse' && <BrowseListings />}
        {view === 'mine' && <MyListingsView />}
        {view === 'create' && <CreateListingView onCreated={() => setView('mine')} />}
        {view === 'credits' && <CreditsView />}
        {view === 'rules' && <RulesView />}
      </ScrollView>
    </View>
  );
}

function CreditsBadge() {
  const { data } = useCredits();
  return (
    <View style={styles.creditsBadge}>
      <Text style={styles.creditsBadgeText}>{data?.balance ?? 0} cr</Text>
    </View>
  );
}

function BrowseListings() {
  const { data, isLoading } = useListings();
  const createMatch = useCreateMatch();

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[10] }} />;

  const listings = data?.listings ?? [];

  if (listings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyKicker}>Market signal</Text>
        <Text style={styles.emptyTitle}>No available trades yet.</Text>
        <Text style={styles.emptyText}>Use this space to convert clutter into low-friction exchange when listings exist.</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {listings.map((item) => (
        <ListingCard
          key={item.id}
          item={item}
          onAction={() => createMatch.mutate(
            { listing_id: item.id, use_credits: true },
            { onError: () => Alert.alert('Error', 'Failed to offer credits. Please try again.') },
          )}
          actionLabel="Offer Credits"
        />
      ))}
    </View>
  );
}

function MyListingsView() {
  const { data, isLoading } = useMyListings();

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[10] }} />;

  const listings = data?.listings ?? [];

  if (listings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyKicker}>Your listings</Text>
        <Text style={styles.emptyTitle}>Nothing listed yet.</Text>
        <Text style={styles.emptyText}>Start with one object that no longer earns its space.</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {listings.map((item) => (
        <View key={item.id} style={styles.listingCard}>
          <View style={styles.listingInfo}>
            <Text style={styles.listingLabel}>{item.item_label}</Text>
            <Text style={styles.listingCondition}>{item.condition}</Text>
            {item.description ? (
              <Text style={styles.listingDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </View>
          <View style={styles.listingRight}>
            <Text style={styles.listingCredits}>{item.trade_value_credits} cr</Text>
            <Text style={[styles.listingStatus, item.status === 'available' && styles.statusAvailable]}>
              {item.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CreateListingView({ onCreated }: { onCreated: () => void }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('good');
  const [credits, setCredits] = useState('');
  const createListing = useCreateListing();

  const conditions = ['new', 'like_new', 'good', 'fair', 'poor'];

  const handleSubmit = () => {
    if (!label.trim()) return;
    createListing.mutate(
      {
        item_label: label.trim(),
        description: description.trim() || undefined,
        condition,
        trade_value_credits: credits ? Number(credits) : undefined,
      },
      { onSuccess: onCreated, onError: () => Alert.alert('Error', 'Failed to list item. Please try again.') },
    );
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>List an Item for Trade</Text>

      <TextInput
        style={styles.formInput}
        placeholder="Item name (e.g. bluetooth speaker)"
        placeholderTextColor={COLORS.text.muted}
        value={label}
        onChangeText={setLabel}
        autoFocus
      />

      <TextInput
        style={[styles.formInput, { minHeight: 60 }]}
        placeholder="Description (optional)"
        placeholderTextColor={COLORS.text.muted}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.formLabel}>Condition</Text>
      <View style={styles.conditionRow}>
        {conditions.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
            onPress={() => setCondition(c)}
          >
            <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
              {c.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.formInput}
        placeholder="Credit value (optional)"
        placeholderTextColor={COLORS.text.muted}
        value={credits}
        onChangeText={setCredits}
        keyboardType="number-pad"
      />

      <TouchableOpacity
        style={[styles.submitBtn, !label.trim() && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!label.trim() || createListing.isPending}
      >
        {createListing.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>List Item</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function CreditsView() {
  const { data, isLoading } = useCredits();

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[10] }} />;

  const transactions = data?.transactions ?? [];

  return (
    <View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>{data?.balance ?? 0} credits</Text>
      </View>

      {transactions.length > 0 ? (
        <View style={{ marginTop: SPACING[4] }}>
          <Text style={styles.sectionLabel}>Transaction History</Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txInfo}>
                <Text style={styles.txItem}>{tx.item_label}</Text>
                <Text style={styles.txDate}>
                  {new Date(tx.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.txAmount, tx.direction === 'credit' ? styles.txCredit : styles.txDebit]}>
                {tx.direction === 'credit' ? '+' : '-'}{tx.amount}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyKicker}>Credits</Text>
          <Text style={styles.emptyTitle}>No credit motion yet.</Text>
          <Text style={styles.emptyText}>Credits become useful once trades start moving.</Text>
        </View>
      )}
    </View>
  );
}

function RulesView() {
  const { data: rulesData } = useTradeRules();
  const { data: safetyData } = useTradeSafety();

  const rules = rulesData?.rules ?? [];
  const checklists = safetyData?.checklists ?? [];

  return (
    <View>
      {rules.length > 0 && (
        <View style={styles.rulesSection}>
          <Text style={styles.sectionLabel}>Community Rules</Text>
          {rules.map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleBullet}>•</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      )}

      {checklists.map((cl) => (
        <View key={cl.id} style={styles.rulesSection}>
          <Text style={styles.sectionLabel}>{cl.title}</Text>
          {cl.items.map((item, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleBullet}>☐</Text>
              <Text style={styles.ruleText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}

      {rules.length === 0 && checklists.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyKicker}>Guide</Text>
          <Text style={styles.emptyTitle}>Trade without cognitive load.</Text>
          <Text style={styles.emptyText}>Keep exchanges local, explicit, and low-pressure.</Text>
        </View>
      )}
    </View>
  );
}

function ListingCard({ item, onAction, actionLabel }: { item: TradeListing; onAction: () => void; actionLabel: string }) {
  return (
    <View style={styles.listingCard}>
      <View style={styles.listingInfo}>
        <Text style={styles.listingLabel}>{item.item_label}</Text>
        <Text style={styles.listingCondition}>{item.condition}</Text>
        {item.description ? (
          <Text style={styles.listingDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.listingRight}>
        <Text style={styles.listingCredits}>{item.trade_value_credits} cr</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
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
  creditsBadge: {
    backgroundColor: COLORS.dark.elevated,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING[2] + 2,
    paddingVertical: SPACING[1],
  },
  creditsBadgeText: { color: COLORS.warning, fontSize: 13, fontWeight: FONT.weight.semibold },
  tabBar: {
    flexDirection: 'row',
    gap: SPACING[1],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
  },
  tab: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1] + 2,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.dark.card,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.text.muted, fontSize: FONT.size.xs, fontWeight: FONT.weight.medium },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: SPACING[4], paddingBottom: SPACING[8] },
  // Listings
  listContainer: { gap: SPACING[2] },
  listingCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listingInfo: { flex: 1, marginRight: SPACING[3] },
  listingLabel: { color: COLORS.text.primary, fontSize: 15, fontWeight: FONT.weight.semibold },
  listingCondition: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginTop: 2, textTransform: 'capitalize' },
  listingDesc: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginTop: SPACING[1], lineHeight: FONT.size.base },
  listingRight: { alignItems: 'flex-end', justifyContent: 'center' },
  listingCredits: { color: COLORS.success, fontSize: FONT.size.base, fontWeight: FONT.weight.bold },
  listingStatus: { color: COLORS.text.muted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  statusAvailable: { color: COLORS.success },
  tagRow: { flexDirection: 'row', gap: SPACING[1], marginTop: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: COLORS.dark.elevated, borderRadius: 6, paddingHorizontal: SPACING[2], paddingVertical: 2 },
  tagText: { color: COLORS.primary, fontSize: 11 },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[2] + 2,
    paddingVertical: SPACING[1] + 2,
    marginTop: SPACING[2],
  },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: FONT.weight.semibold },
  // Form
  formCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
  },
  formTitle: { color: COLORS.text.primary, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, marginBottom: SPACING[4] },
  formInput: {
    backgroundColor: COLORS.dark.background,
    borderRadius: 10,
    padding: SPACING[3],
    color: COLORS.text.primary,
    fontSize: 15,
    marginBottom: SPACING[3],
  },
  formLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  conditionRow: { flexDirection: 'row', gap: 6, marginBottom: SPACING[3], flexWrap: 'wrap' },
  conditionBtn: {
    backgroundColor: COLORS.dark.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[2] + 2,
    paddingVertical: SPACING[1] + 2,
  },
  conditionBtnActive: { backgroundColor: COLORS.primary },
  conditionText: { color: COLORS.text.muted, fontSize: FONT.size.xs, textTransform: 'capitalize' },
  conditionTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: SPACING[3],
    alignItems: 'center',
    marginTop: SPACING[1],
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: FONT.weight.semibold },
  // Credits
  balanceCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.xl,
    padding: SPACING[5],
    alignItems: 'center',
  },
  balanceLabel: { color: COLORS.text.muted, fontSize: FONT.size.xs, textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { color: COLORS.warning, fontSize: FONT.size['4xl'], fontWeight: FONT.weight.bold, marginTop: SPACING[1] },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.dark.card,
    borderRadius: 10,
    padding: SPACING[3],
    marginBottom: 6,
  },
  txInfo: { flex: 1 },
  txItem: { color: COLORS.text.primary, fontSize: FONT.size.sm },
  txDate: { color: COLORS.text.muted, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: FONT.size.base, fontWeight: FONT.weight.semibold },
  txCredit: { color: COLORS.success },
  txDebit: { color: COLORS.error },
  // Rules
  rulesSection: { marginBottom: SPACING[4] },
  sectionLabel: {
    color: COLORS.text.muted,
    fontSize: FONT.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
  },
  ruleRow: { flexDirection: 'row', gap: SPACING[2], marginBottom: 6 },
  ruleBullet: { color: COLORS.primary, fontSize: FONT.size.sm },
  ruleText: { color: COLORS.text.primary, fontSize: FONT.size.sm, flex: 1, lineHeight: 20 },
  // Shared
  emptyState: { backgroundColor: COLORS.dark.card, borderWidth: 1, borderColor: COLORS.dark.border, borderRadius: RADIUS['2xl'], padding: SPACING[5], marginTop: SPACING[4] },
  emptyEmoji: { fontSize: FONT.size['5xl'] },
  emptyKicker: { color: COLORS.hub, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyTitle: { color: COLORS.text.primary, fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, marginTop: SPACING[2] },
  emptyText: { color: COLORS.text.muted, fontSize: FONT.size.sm, lineHeight: FONT.size.xl, marginTop: SPACING[2] },
});
