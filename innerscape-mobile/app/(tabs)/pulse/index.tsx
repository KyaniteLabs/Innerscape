import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useApiClient } from '../../../lib/api/client';
import { EnergyChart } from '../../../components/EnergyChart';
import { RefreshCcw, Moon, Activity } from 'lucide-react-native';

export default function PulseScreen() {
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [energyData, setEnergyData] = useState<number[]>([40, 60, 85, 70, 50, 45, 80, 90]);
  const [refreshing, setRefreshing] = useState(false);
  const api = useApiClient();

  const fetchData = async () => {
    const res = await api.get<any[]>('/health/sleep');
    if (res.success) {
      setSleepData(res.data || []);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Pulse</Text>
        <TouchableOpacity style={styles.syncButton} onPress={onRefresh}>
          <RefreshCcw size={16} color="#4F46E5" />
          <Text style={styles.syncText}>Sync Health</Text>
        </TouchableOpacity>
      </View>

      <EnergyChart data={energyData} />

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Moon size={24} color="#6366F1" />
          <Text style={styles.statLabel}>Last Night</Text>
          <Text style={styles.statValue}>7h 20m</Text>
        </View>
        <View style={styles.statCard}>
          <Activity size={24} color="#EC4899" />
          <Text style={styles.statLabel}>Avg HRV</Text>
          <Text style={styles.statValue}>54 ms</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Sleep</Text>
      {sleepData.map((item) => (
        <View key={item.id} style={styles.sleepItem}>
          <Text style={styles.sleepDate}>{new Date(item.startTime).toLocaleDateString()}</Text>
          <Text style={styles.sleepTime}>
            {Math.round((new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 3600000)}h total
          </Text>
        </View>
      ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sleepItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sleepDate: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  sleepTime: {
    fontSize: 14,
    color: '#6B7280',
  }
});
