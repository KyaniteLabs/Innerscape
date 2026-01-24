import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useApiClient } from '../../../lib/api/client';
import { Brain, Zap, Heart, CheckCircle2, RefreshCcw } from 'lucide-react-native';
import { DopamineMenu } from '../../../components/DopamineMenu';
import { ShutdownRitual } from '../../../components/ShutdownRitual';

export default function HubScreen() {
  const [summary, setSummary] = useState({
    captures: 0,
    habitsDone: 0,
    energy: 'Moderate',
    mood: 'Neutral'
  });
  const [refreshing, setRefreshing] = useState(false);
  const api = useApiClient();

  const fetchSummary = async () => {
    // In production, this would be a single Hub API call
    const [captures, habits, feelings] = await Promise.all([
      api.get<any[]>('/brain/inbox'),
      api.get<any[]>('/flow/habits'),
      api.get<any>('/feelings/recent')
    ]);

    setSummary({
      captures: captures.data?.length || 0,
      habitsDone: habits.data?.filter(h => h.completedToday).length || 0,
      energy: feelings.data?.energy > 70 ? 'High' : feelings.data?.energy < 30 ? 'Low' : 'Moderate',
      mood: feelings.data?.valence > 0 ? 'Pleasant' : feelings.data?.valence < 0 ? 'Unpleasant' : 'Neutral'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Today&apos;s Snapshot</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Brain size={24} color="#6366F1" />
          <Text style={styles.cardValue}>{summary.captures}</Text>
          <Text style={styles.cardLabel}>Captures</Text>
        </View>
        <View style={styles.summaryCard}>
          <CheckCircle2 size={24} color="#10B981" />
          <Text style={styles.cardValue}>{summary.habitsDone}</Text>
          <Text style={styles.cardLabel}>Habits Done</Text>
        </View>
        <View style={styles.summaryCard}>
          <Zap size={24} color="#F59E0B" />
          <Text style={styles.cardValue}>{summary.energy}</Text>
          <Text style={styles.cardLabel}>Energy</Text>
        </View>
        <View style={styles.summaryCard}>
          <Heart size={24} color="#EC4899" />
          <Text style={styles.cardValue}>{summary.mood}</Text>
          <Text style={styles.cardLabel}>Mood</Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Daily Insight</Text>
        <Text style={styles.tipText}>
          Your focus peaks between 10 AM and 12 PM. Use this time for your most challenging habits!
        </Text>
      </View>

      <ShutdownRitual />
      <DopamineMenu />

      <Text style={styles.sectionTitle}>Upcoming Goals</Text>
      <View style={styles.goalPlaceholder}>
        <Text style={styles.placeholderText}>Syncing with Innerscape Hub (Web)...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tipCard: {
    padding: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 32,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  goalPlaceholder: {
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  }
});
