import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitTracker } from '../../components/habits/HabitTracker';
import { Celebration } from '../../components/habits/Celebration';

interface Habit {
  id: string;
  name: string;
  frequency: string;
  streak: number;
  longestStreak: number;
  lastCompletedAt?: string;
  completedToday: boolean;
}

type FlowTab = 'habits' | 'goals' | 'dopamine';

export default function FlowScreen() {
  const [activeTab, setActiveTab] = useState<FlowTab>('habits');
  const [habits, setHabits] = useState<Habit[]>([
    { id: 'demo-1', name: 'Morning check-in', frequency: 'daily', streak: 5, longestStreak: 12, completedToday: false },
    { id: 'demo-2', name: 'Deep work block', frequency: 'daily', streak: 3, longestStreak: 7, completedToday: false },
    { id: 'demo-3', name: 'Journal reflection', frequency: 'daily', streak: 8, longestStreak: 8, completedToday: false },
  ]);
  const [celebration, setCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const handleCompleteHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const newStreak = h.streak + 1;
        const newLongest = Math.max(newStreak, h.longestStreak);
        const isRecord = newStreak === newLongest && newStreak >= 3;

        if (isRecord) {
          setCelebrationMsg(`New record: ${newStreak} days!`);
          setCelebration(true);
        } else if (newStreak >= 7) {
          setCelebrationMsg(`${h.streak + 1} day streak!`);
          setCelebration(true);
        }

        return {
          ...h,
          completedToday: true,
          streak: newStreak,
          longestStreak: newLongest,
          lastCompletedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    const habit: Habit = {
      id: `local-${Date.now()}`,
      name: newHabitName.trim(),
      frequency: 'daily',
      streak: 0,
      longestStreak: 0,
      completedToday: false,
    };
    setHabits((prev) => [...prev, habit]);
    setNewHabitName('');
    setIsAddingHabit(false);
  };

  const tabs: { key: FlowTab; label: string }[] = [
    { key: 'habits', label: 'Habits' },
    { key: 'goals', label: 'Goals' },
    { key: 'dopamine', label: 'Dopamine Menu' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <Celebration
        trigger={celebration}
        message={celebrationMsg}
        on_done={() => setCelebration(false)}
      />

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'habits' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Habits</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddingHabit(!isAddingHabit)}
              >
                <Text style={styles.addButtonText}>{isAddingHabit ? 'Cancel' : '+ Add'}</Text>
              </TouchableOpacity>
            </View>

            {isAddingHabit && (
              <View style={styles.addCard}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Habit name..."
                  placeholderTextColor="#555"
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  autoFocus
                  onSubmitEditing={handleAddHabit}
                />
              </View>
            )}

            <HabitTracker habits={habits} on_complete={handleCompleteHabit} />
          </>
        )}

        {activeTab === 'goals' && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🎯</Text>
            <Text style={styles.placeholderTitle}>Goals & Tasks</Text>
            <Text style={styles.placeholderHint}>
              Break big goals into small, actionable tasks with deadlines
            </Text>
            <TouchableOpacity style={styles.placeholderButton}>
              <Text style={styles.placeholderButtonText}>Create First Goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'dopamine' && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>⚡</Text>
            <Text style={styles.placeholderTitle}>Dopamine Menu</Text>
            <Text style={styles.placeholderHint}>
              Pre-planned activities to boost motivation when energy is low
            </Text>
            <TouchableOpacity style={styles.placeholderButton}>
              <Text style={styles.placeholderButtonText}>Build Your Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f23' },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#6c63ff' },
  tabText: { color: '#666', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#e0e0e0', fontSize: 18, fontWeight: '600' },
  addButton: { paddingHorizontal: 12, paddingVertical: 6 },
  addButtonText: { color: '#6c63ff', fontSize: 14, fontWeight: '600' },
  addCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  addInput: {
    color: '#e0e0e0',
    fontSize: 15,
  },
  placeholder: {
    alignItems: 'center',
    paddingTop: 48,
  },
  placeholderEmoji: { fontSize: 48 },
  placeholderTitle: {
    color: '#e0e0e0',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderHint: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
    lineHeight: 20,
  },
  placeholderButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 24,
  },
  placeholderButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
