import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useApiClient } from '../../../lib/api/client';
import { HabitCard } from '../../../components/HabitCard';

export default function FlowScreen() {
  const [habits, setHabits] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const api = useApiClient();

  const fetchHabits = async () => {
    const res = await api.get<any[]>('/flow/habits');
    if (res.success) {
      setHabits(res.data || []);
    }
  };

  const toggleHabit = async (id: string) => {
    const res = await api.post(`/flow/habits/${id}/complete`, {});
    if (res.success) {
      fetchHabits();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHabits();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Daily Flow</Text>
      <Text style={styles.subtitle}>Align your actions with your energy.</Text>
      
      {habits.map(habit => (
        <HabitCard 
          key={habit.id} 
          habit={habit} 
          onToggle={toggleHabit} 
        />
      ))}
      
      {habits.length === 0 && (
        <Text style={styles.emptyText}>No habits set up yet. Create one on the web app!</Text>
      )}
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
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  }
});
