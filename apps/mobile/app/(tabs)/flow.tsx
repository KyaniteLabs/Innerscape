import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitTracker } from '../../components/habits/HabitTracker';
import { Celebration } from '../../components/habits/Celebration';
import { useHabits, useCreateHabit, useCompleteHabit } from '../../hooks/useHabits';
import { useGoals, useCreateGoal, useTasks, useCreateTask, useCompleteTask } from '../../hooks/useGoals';
import { useDopamineMenu, useCreateDopamineItem, useMarkDopamineUsed } from '../../hooks/useDopamine';

type FlowTab = 'habits' | 'goals' | 'dopamine';

export default function FlowScreen() {
  const [activeTab, setActiveTab] = useState<FlowTab>('habits');

  const tabs: { key: FlowTab; label: string }[] = [
    { key: 'habits', label: 'Habits' },
    { key: 'goals', label: 'Goals' },
    { key: 'dopamine', label: 'Dopamine Menu' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
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
        {activeTab === 'habits' && <HabitsPanel />}
        {activeTab === 'goals' && <GoalsPanel />}
        {activeTab === 'dopamine' && <DopaminePanel />}
      </ScrollView>
    </SafeAreaView>
  );
}

function HabitsPanel() {
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [celebration, setCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    createHabit.mutate(
      { name: newName.trim() },
      { onSuccess: () => { setNewName(''); setIsAdding(false); } },
    );
  };

  const handleComplete = (id: string) => {
    completeHabit.mutate(id, {
      onSuccess: (res) => {
        if (res.celebration) {
          setCelebrationMsg(`Streak: ${res.streak} days!`);
          setCelebration(true);
        }
      },
    });
  };

  if (isLoading) return <ActivityIndicator color="#6c63ff" style={{ marginTop: 40 }} />;

  const habitList = habits ?? [];

  return (
    <>
      <Celebration trigger={celebration} message={celebrationMsg} on_done={() => setCelebration(false)} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Habits</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(!isAdding)}>
          <Text style={styles.addButtonText}>{isAdding ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addCard}>
          <TextInput
            style={styles.addInput}
            placeholder="Habit name..."
            placeholderTextColor="#555"
            value={newName}
            onChangeText={setNewName}
            autoFocus
            onSubmitEditing={handleAdd}
          />
        </View>
      )}

      {habitList.length > 0 ? (
        <HabitTracker habits={habitList} on_complete={handleComplete} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>No habits yet. Add your first one!</Text>
        </View>
      )}
    </>
  );
}

function GoalsPanel() {
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const createGoal = useCreateGoal();
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');

  const handleCreateGoal = () => {
    if (!goalTitle.trim()) return;
    createGoal.mutate(
      { title: goalTitle.trim() },
      { onSuccess: () => { setGoalTitle(''); setShowNewGoal(false); } },
    );
  };

  if (goalsLoading) return <ActivityIndicator color="#6c63ff" style={{ marginTop: 40 }} />;

  const goalList = goals ?? [];

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowNewGoal(!showNewGoal)}>
          <Text style={styles.addButtonText}>{showNewGoal ? 'Cancel' : '+ New Goal'}</Text>
        </TouchableOpacity>
      </View>

      {showNewGoal && (
        <View style={styles.addCard}>
          <TextInput
            style={styles.addInput}
            placeholder="Goal title..."
            placeholderTextColor="#555"
            value={goalTitle}
            onChangeText={setGoalTitle}
            autoFocus
            onSubmitEditing={handleCreateGoal}
          />
        </View>
      )}

      {goalList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyText}>Break big goals into small, actionable tasks</Text>
        </View>
      ) : (
        goalList.map((goal) => <GoalCard key={goal.id} goalId={goal.id} title={goal.title} status={goal.status} />)
      )}
    </>
  );
}

function GoalCard({ goalId, title, status }: { goalId: string; title: string; status: string }) {
  const { data: tasks } = useTasks(goalId);
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const taskList = tasks ?? [];
  const completed = taskList.filter((t) => t.completed).length;

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    createTask.mutate(
      { title: newTask.trim(), goalId },
      { onSuccess: () => { setNewTask(''); setShowAddTask(false); } },
    );
  };

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{title}</Text>
          <Text style={styles.goalStatus}>{status} · {completed}/{taskList.length} tasks</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddTask(!showAddTask)}>
          <Text style={styles.addButtonText}>{showAddTask ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {showAddTask && (
        <View style={styles.addTaskRow}>
          <TextInput
            style={styles.addTaskInput}
            placeholder="Task title..."
            placeholderTextColor="#555"
            value={newTask}
            onChangeText={setNewTask}
            autoFocus
            onSubmitEditing={handleAddTask}
          />
          <TouchableOpacity style={styles.addTaskBtn} onPress={handleAddTask}>
            <Text style={styles.addTaskBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {taskList.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={styles.taskRow}
          onPress={() => !task.completed && completeTask.mutate(task.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.taskCheck, task.completed && styles.taskCheckDone]}>
            {task.completed ? '✓' : '○'}
          </Text>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
            {task.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DopaminePanel() {
  const { data: menuItems, isLoading } = useDopamineMenu();
  const createItem = useCreateDopamineItem();
  const markUsed = useMarkDopamineUsed();
  const [showCreate, setShowCreate] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('warm_up');

  const categories = [
    { value: 'warm_up', label: 'Warm Up', emoji: '🔥' },
    { value: 'deep_work', label: 'Deep Work', emoji: '🧠' },
    { value: 'support', label: 'Support', emoji: '🤝' },
    { value: 'rest', label: 'Rest', emoji: '🌿' },
  ];

  const handleCreate = () => {
    if (!itemName.trim()) return;
    createItem.mutate(
      { category: itemCategory, name: itemName.trim(), instructions: [] },
      { onSuccess: () => { setItemName(''); setShowCreate(false); } },
    );
  };

  if (isLoading) return <ActivityIndicator color="#6c63ff" style={{ marginTop: 40 }} />;

  const items = menuItems ?? [];

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dopamine Menu</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.addButtonText}>{showCreate ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={styles.addCard}>
          <TextInput
            style={styles.addInput}
            placeholder="Activity name..."
            placeholderTextColor="#555"
            value={itemName}
            onChangeText={setItemName}
            autoFocus
          />
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.catBtn, itemCategory === cat.value && styles.catBtnActive]}
                onPress={() => setItemCategory(cat.value)}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, !itemName.trim() && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={!itemName.trim() || createItem.isPending}
          >
            <Text style={styles.saveBtnText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
      )}

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.value);
        if (catItems.length === 0) return null;
        return (
          <View key={cat.value} style={styles.dopamineCategory}>
            <Text style={styles.catLabel}>{cat.emoji} {cat.label}</Text>
            {catItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.dopamineItem}
                onPress={() => markUsed.mutate(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.dopamineItemInfo}>
                  <Text style={styles.dopamineItemName}>{item.name}</Text>
                  {item.estimatedDuration > 0 && (
                    <Text style={styles.dopamineItemDuration}>{item.estimatedDuration}min</Text>
                  )}
                </View>
                <Text style={styles.dopamineItemUse}>Use</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      {items.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚡</Text>
          <Text style={styles.emptyText}>Build your dopamine menu with pre-planned activities</Text>
        </View>
      )}
    </>
  );
}

const COLORS = {
  bg: '#0f0f23',
  card: '#16213e',
  cardBorder: '#1a1a3e',
  text: '#e0e0e0',
  muted: '#666',
  accent: '#6c63ff',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  addButton: { paddingHorizontal: 12, paddingVertical: 6 },
  addButtonText: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  addCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  addInput: { color: COLORS.text, fontSize: 15 },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 12, maxWidth: 240 },
  // Goals
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: { flex: 1 },
  goalTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  goalStatus: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  addTaskRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  addTaskInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    backgroundColor: '#0d1b36',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addTaskBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addTaskBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  taskCheck: { color: COLORS.muted, fontSize: 16 },
  taskCheckDone: { color: '#51cf66' },
  taskTitle: { color: COLORS.text, fontSize: 14 },
  taskTitleDone: { color: COLORS.muted, textDecorationLine: 'line-through' },
  // Dopamine
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  catBtn: {
    backgroundColor: '#0d1b36',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  catBtnActive: { backgroundColor: COLORS.accent },
  catEmoji: { fontSize: 18 },
  dopamineCategory: { marginBottom: 16 },
  catLabel: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dopamineItem: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dopamineItemInfo: { flex: 1 },
  dopamineItemName: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  dopamineItemDuration: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  dopamineItemUse: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
});
