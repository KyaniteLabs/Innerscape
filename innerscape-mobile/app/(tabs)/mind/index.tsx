import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useApiClient } from '../../../lib/api/client';
import { CaptureInput } from '../../../components/CaptureInput';

export default function MindScreen() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const api = useApiClient();

  const fetchInbox = async () => {
    const res = await api.get<any[]>('/brain/inbox');
    if (res.success) {
      setInbox(res.data || []);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInbox();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={inbox}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Your Mind</Text>
            <CaptureInput onCapture={fetchInbox} />
            <Text style={styles.sectionTitle}>Inbox</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.content}</Text>
            <Text style={styles.itemMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nothing in your inbox. Capture a thought!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  listContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
  },
  item: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  itemMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  }
});
