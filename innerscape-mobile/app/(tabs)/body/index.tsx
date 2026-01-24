import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, Moon, Activity, ArrowRight, RefreshCcw } from 'lucide-react-native';
import { useApiClient } from '../../../lib/api/client';
import { EnergyChart } from '../../../components/EnergyChart';

interface HealthSummary {
  lastCheckIn: {
    emotion: string;
    regions: string[];
    timestamp: string;
  } | null;
  sleep: {
    duration: string;
    quality: number;
  } | null;
  hrv: number | null;
}

export default function BodyScreen() {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const api = useApiClient();

  const fetchData = async () => {
    try {
      setError(null);
      const [feelingsRes, healthRes] = await Promise.all([
        api.get<any>('/feelings/recent'),
        api.get<any[]>('/health/sleep?days=1'),
      ]);
      
      setSummary({
        lastCheckIn: feelingsRes.data ? {
          emotion: feelingsRes.data.dominantFeeling,
          regions: feelingsRes.data.bodySensation?.split(',') || [],
          timestamp: feelingsRes.data.timestamp,
        } : null,
        sleep: healthRes.data?.[0] ? {
          duration: formatDuration(healthRes.data[0]),
          quality: healthRes.data[0].quality || 0,
        } : null,
        hrv: null, // TODO: Add HRV endpoint
      });
    } catch (err) {
      setError('Failed to load health data');
      console.error('[APEX] Body data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDuration = (sleep: any) => {
    const diff = new Date(sleep.endTime).getTime() - new Date(sleep.startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Body</Text>
        <TouchableOpacity style={styles.syncButton} onPress={onRefresh}>
          <RefreshCcw size={16} color="#4F46E5" />
          <Text style={styles.syncText}>Sync</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Check-in CTA Card */}
      <TouchableOpacity 
        style={styles.checkInCard}
        onPress={() => router.push('/(tabs)/body/check-in')}
      >
        <View style={styles.checkInContent}>
          <View style={styles.checkInIcon}>
            <Heart size={32} color="white" />
          </View>
          <View style={styles.checkInTextContainer}>
            <Text style={styles.checkInTitle}>How are you feeling?</Text>
            <Text style={styles.checkInSubtitle}>Start your somatic check-in</Text>
          </View>
          <ArrowRight size={24} color="#4F46E5" />
        </View>
      </TouchableOpacity>

      {summary?.lastCheckIn && (
        <View style={styles.lastCheckInCard}>
          <Text style={styles.sectionTitle}>Last Check-in</Text>
          <View style={styles.checkInSummary}>
            <Text style={styles.feelingBadge}>{summary.lastCheckIn.emotion}</Text>
            <Text style={styles.regionsText}>
              in {summary.lastCheckIn.regions.join(', ') || 'general'}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Vitals</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Moon size={24} color="#6366F1" />
          <Text style={styles.statLabel}>Sleep</Text>
          <Text style={styles.statValue}>{summary?.sleep?.duration || 'N/A'}</Text>
        </View>
        <View style={styles.statCard}>
          <Activity size={24} color="#EC4899" />
          <Text style={styles.statLabel}>Avg HRV</Text>
          <Text style={styles.statValue}>{summary?.hrv ? `${summary.hrv} ms` : 'N/A'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Energy Trend</Text>
      <EnergyChart data={[40, 60, 85, 70, 50, 45, 80, 90]} />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorCard: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  retryText: {
    color: '#B91C1C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  checkInCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 28,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  checkInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkInIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInTextContainer: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  checkInSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  lastCheckInCard: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  checkInSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feelingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#8B5CF6',
    color: 'white',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  regionsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
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
});
