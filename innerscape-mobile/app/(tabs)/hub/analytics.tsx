import React, { useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { TrendingUp, Award, Zap } from 'lucide-react-native';
import { useAnalytics } from '../../../lib/hooks/useAnalytics';
import { AnalyticsChart } from '../../../components/AnalyticsChart';

export default function AnalyticsScreen() {
  const { streaks, correlations, loading, fetchAnalytics } = useAnalytics();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const mockMoodData = [
    { x: 'Mon', y: 3 },
    { x: 'Tue', y: 4 },
    { x: 'Wed', y: 3.5 },
    { x: 'Thu', y: 5 },
    { x: 'Fri', y: 4.5 },
    { x: 'Sat', y: 4 },
    { x: 'Sun', y: 5 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView 
        className="flex-1 p-6"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAnalytics} />}
      >
        {/* Streak Stats */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white p-5 rounded-[28px] border border-gray-100 items-center">
            <Award size={24} color="#F59E0B" />
            <Text className="text-2xl font-bold text-gray-900 mt-2">
              {streaks?.currentStreak || 0}
            </Text>
            <Text className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Current Streak
            </Text>
          </View>
          <View className="flex-1 bg-white p-5 rounded-[28px] border border-gray-100 items-center">
            <TrendingUp size={24} color="#10B981" />
            <Text className="text-2xl font-bold text-gray-900 mt-2">
              {streaks?.longestStreak || 0}
            </Text>
            <Text className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Longest Streak
            </Text>
          </View>
        </View>

        <AnalyticsChart 
          title="Mood Trend (Weekly)" 
          data={mockMoodData} 
          color="#EC4899"
        />

        <Text className="text-sm font-bold text-gray-900 mb-4 ml-2 uppercase tracking-widest">
          Key Correlations
        </Text>

        {correlations.map((corr, i) => (
          <View key={i} className="bg-white p-6 rounded-[28px] border border-gray-100 mb-4 shadow-sm">
            <View className="flex-row items-center gap-3 mb-3">
              <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                corr.impact === 'positive' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <Zap size={16} color={corr.impact === 'positive' ? '#10B981' : '#EF4444'} />
              </View>
              <Text className="text-sm font-bold text-gray-900">{corr.factor}</Text>
            </View>
            <Text className="text-xs text-gray-600 leading-5">{corr.description}</Text>
            <View className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <View 
                className={`h-full ${corr.impact === 'positive' ? 'bg-green-400' : 'bg-red-400'}`}
                style={{ width: `${corr.strength * 100}%` }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
