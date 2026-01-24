import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Target, Calendar, ChevronRight } from 'lucide-react-native';
import { Goal } from '../lib/hooks/useGoals';

/**
 * @fileoverview Goal item card
 * @module components/GoalCard
 */

interface Props {
  goal: Goal;
  onPress?: () => void;
}

export function GoalCard({ goal, onPress }: Props) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white p-5 rounded-[28px] border border-gray-100 mb-4 shadow-sm"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center">
            <Target size={20} color="#4F46E5" />
          </View>
          <View>
            <Text className="text-sm font-bold text-gray-900">{goal.title}</Text>
            <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
              {goal.category}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#D1D5DB" />
      </View>

      <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <View 
          className="h-full bg-indigo-500 rounded-full" 
          style={{ width: `${goal.progress}%` }} 
        />
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Calendar size={12} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">
            {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No deadline'}
          </Text>
        </View>
        <Text className="text-xs font-bold text-indigo-600">{goal.progress}%</Text>
      </View>
    </TouchableOpacity>
  );
}
