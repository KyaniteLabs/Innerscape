import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
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

type TradeView = 'browse' | 'mine' | 'credits' | 'create' | 'rules';

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

  if (isLoading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;

  const listings = data?.listings ?? [];

  if (listings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🛍️</Text>
        <Text style={styles.emptyText}>No items available right now. Check back later!</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {listings.map((item) => (
        <ListingCard
          key={item.id}
          item={item}
          onAction={() => createMatch.mutate({ listing_id: item.id, use_credits: true })}
          actionLabel="Offer Credits"
        />
      ))}
    </View>
  );
}

function MyListingsView() {
  const { data, isLoading } = useMyListings();

  if (isLoading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;

  const listings = data?.listings ?? [];

  if (listings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyText}>You haven't listed any items yet.</Text>
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
      { onSuccess: onCreated },
    );
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>List an Item for Trade</Text>

      <TextInput
        style={styles.formInput}
        placeholder="Item name (e.g. bluetooth speaker)"
        placeholderTextColor={COLORS.muted}
        value={label}
        onChangeText={setLabel}
        autoFocus
      />

      <TextInput
        style={[styles.formInput, { minHeight: 60 }]}
        placeholder="Description (optional)"
        placeholderTextColor={COLORS.muted}
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
        placeholderTextColor={COLORS.muted}
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

  if (isLoading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;

  const transactions = data?.transactions ?? [];

  return (
    <View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>{data?.balance ?? 0} credits</Text>
      </View>

      {transactions.length > 0 ? (
        <View style={{ marginTop: 16 }}>
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
        <Text style={styles.emptyText}>No transactions yet. List items to earn credits!</Text>
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
        <Text style={styles.emptyText}>Community guidelines coming soon.</Text>
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
  creditsBadge: {
    backgroundColor: '#1a2744',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  creditsBadgeText: { color: COLORS.warning, fontSize: 13, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  // Listings
  listContainer: { gap: 8 },
  listingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listingInfo: { flex: 1, marginRight: 12 },
  listingLabel: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  listingCondition: { color: COLORS.muted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  listingDesc: { color: COLORS.muted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  listingRight: { alignItems: 'flex-end', justifyContent: 'center' },
  listingCredits: { color: COLORS.success, fontSize: 16, fontWeight: '700' },
  listingStatus: { color: COLORS.muted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  statusAvailable: { color: COLORS.success },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: '#1a1a3e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { color: COLORS.accent, fontSize: 11 },
  actionBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  // Form
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  formTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  formInput: {
    backgroundColor: '#0d1b36',
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 12,
  },
  formLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  conditionRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  conditionBtn: {
    backgroundColor: '#0d1b36',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conditionBtnActive: { backgroundColor: COLORS.accent },
  conditionText: { color: COLORS.muted, fontSize: 12, textTransform: 'capitalize' },
  conditionTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  // Credits
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { color: COLORS.warning, fontSize: 32, fontWeight: '700', marginTop: 4 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  txInfo: { flex: 1 },
  txItem: { color: COLORS.text, fontSize: 14 },
  txDate: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '600' },
  txCredit: { color: COLORS.success },
  txDebit: { color: '#ff6b6b' },
  // Rules
  rulesSection: { marginBottom: 16 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  ruleRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  ruleBullet: { color: COLORS.accent, fontSize: 14 },
  ruleText: { color: COLORS.text, fontSize: 14, flex: 1, lineHeight: 20 },
  // Shared
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 12, maxWidth: 240 },
});
