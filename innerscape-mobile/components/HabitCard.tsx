import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  preferredEnergy?: number;
}

export const HabitCard = ({ 
  habit, 
  onToggle 
}: { 
  habit: Habit; 
  onToggle: (id: string) => void 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, habit.completedToday && styles.completed]} 
      onPress={() => onToggle(habit.id)}
    >
      <View style={styles.content}>
        <Text style={[styles.name, habit.completedToday && styles.completedText]}>
          {habit.name}
        </Text>
        <Text style={styles.streak}>
          🔥 {habit.streak} day streak
        </Text>
      </View>
      <View style={styles.checkbox}>
        {habit.completedToday ? (
          <CheckCircle2 size={28} color="#10B981" />
        ) : (
          <Circle size={28} color="#D1D5DB" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  completedText: {
    color: '#065F46',
    textDecorationLine: 'line-through',
  },
  streak: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  checkbox: {
    marginLeft: 12,
  }
});
