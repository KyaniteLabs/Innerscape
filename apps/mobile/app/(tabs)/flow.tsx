import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitTracker } from '../../components/habits/HabitTracker';
import { Celebration } from '../../components/habits/Celebration';
import { useHabits, useCreateHabit, useCompleteHabit } from '../../hooks/useHabits';
import { useGoals, useCreateGoal, useTasks, useCreateTask, useCompleteTask } from '../../hooks/useGoals';
import { useDopamineMenu, useCreateDopamineItem, useMarkDopamineUsed } from '../../hooks/useDopamine';
import { COLORS, SPACING, RADIUS, MODULE, FONT } from '../../lib/theme';

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
      <View style={styles.flowIntro}>
        <Text style={styles.flowKicker}>Momentum engine</Text>
        <Text style={styles.flowTitle}>One visible next action.</Text>
        <Text style={styles.flowSubtitle}>Flow exists to remove initiation drag. Keep the next step small enough to start now.</Text>
      </View>

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
      {
        onSuccess: () => { setNewName(''); setIsAdding(false); },
        onError: () => Alert.alert('Error', 'Failed to create habit. Please try again.'),
      },
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
      onError: () => Alert.alert('Error', 'Failed to complete habit. Please try again.'),
    });
  };

  if (isLoading) return <ActivityIndicator color={MODULE.flow.color} style={{ marginTop: 40 }} />;

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
            placeholderTextColor={COLORS.text.muted}
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
        <EmptyActionSet
          title="No habit has to become a lifestyle today."
          caption="Start with one repeatable two-minute behavior."
          actions={[
            'Drink water before opening feeds',
            'Write one sentence after work',
            'Put shoes by the door tonight',
          ]}
        />
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
      {
        onSuccess: () => { setGoalTitle(''); setShowNewGoal(false); },
        onError: () => Alert.alert('Error', 'Failed to create goal. Please try again.'),
      },
    );
  };

  if (goalsLoading) return <ActivityIndicator color={MODULE.flow.color} style={{ marginTop: 40 }} />;

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
            placeholderTextColor={COLORS.text.muted}
            value={goalTitle}
            onChangeText={setGoalTitle}
            autoFocus
            onSubmitEditing={handleCreateGoal}
          />
        </View>
      )}

      {goalList.length === 0 ? (
        <EmptyActionSet
          title="Goals need a first rung, not a master plan."
          caption="Create one outcome, then attach a next action that can be done in one sitting."
          actions={[
            'Define the smallest finish line',
            'Name the blocker',
            "Choose tomorrow's first action",
          ]}
        />
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
      {
        onSuccess: () => { setNewTask(''); setShowAddTask(false); },
        onError: () => Alert.alert('Error', 'Failed to create task. Please try again.'),
      },
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
            placeholderTextColor={COLORS.text.muted}
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
          onPress={() => !task.completed && completeTask.mutate(task.id, { onError: () => Alert.alert('Error', 'Failed to complete task. Please try again.') })}
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
      {
        onSuccess: () => { setItemName(''); setShowCreate(false); },
        onError: () => Alert.alert('Error', 'Failed to create activity. Please try again.'),
      },
    );
  };

  if (isLoading) return <ActivityIndicator color={MODULE.flow.color} style={{ marginTop: 40 }} />;

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
            placeholderTextColor={COLORS.text.muted}
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
                onPress={() => markUsed.mutate(item.id, { onError: () => Alert.alert('Error', 'Failed to mark activity used. Please try again.') })}
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
        <EmptyActionSet
          title="Pre-plan dopamine before the crash."
          caption="A menu turns regulation into recognition, not improvisation."
          actions={[
            'Warm up: 5-minute reset playlist',
            'Support: message an accountability person',
            'Rest: lights down, phone across room',
          ]}
        />
      )}
    </>
  );
}

function EmptyActionSet({ title, caption, actions }: { title: string; caption: string; actions: string[] }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyKicker}>Suggested scaffold</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{caption}</Text>
      <View style={styles.emptyActions}>
        {actions.map((action, index) => (
          <View key={action} style={styles.emptyAction}>
            <Text style={styles.emptyActionIndex}>{index + 1}</Text>
            <Text style={styles.emptyActionText}>{action}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.dark.background },
  flowIntro: {
    marginHorizontal: SPACING[4],
    marginTop: SPACING[3],
    marginBottom: SPACING[4],
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: MODULE.flow.border,
    padding: SPACING[5],
  },
  flowKicker: { color: MODULE.flow.color, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, textTransform: 'uppercase', letterSpacing: 1.3 },
  flowTitle: { color: COLORS.text.primary, fontSize: FONT.size['2xl'], lineHeight: 31, fontWeight: FONT.weight.black, marginTop: SPACING[2], letterSpacing: -0.6 },
  flowSubtitle: { color: COLORS.text.muted, fontSize: FONT.size.sm, lineHeight: 20, marginTop: SPACING[2] },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING[4],
    marginTop: SPACING[2],
    marginBottom: SPACING[4],
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: SPACING[2], alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: MODULE.flow.color },
  tabText: { color: COLORS.text.secondary, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF' },
  content: { paddingHorizontal: SPACING[4], paddingBottom: SPACING[8] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  sectionTitle: { color: COLORS.text.primary, fontSize: 18, fontWeight: '600' },
  addButton: { paddingHorizontal: SPACING[3], paddingVertical: 6 },
  addButtonText: { color: MODULE.flow.color, fontSize: 14, fontWeight: '600' },
  addCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    marginBottom: SPACING[3],
  },
  addInput: { color: COLORS.text.primary, fontSize: 15 },
  saveBtn: {
    backgroundColor: MODULE.flow.color,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: SPACING[2],
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyState: {
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: MODULE.flow.border,
    borderRadius: RADIUS['2xl'],
    padding: SPACING[5],
    marginTop: SPACING[2],
  },
  emptyKicker: { color: MODULE.flow.color, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyTitle: { color: COLORS.text.primary, fontSize: FONT.size.xl, lineHeight: 27, fontWeight: FONT.weight.black, marginTop: SPACING[2] },
  emptyText: { color: COLORS.text.muted, fontSize: FONT.size.sm, lineHeight: 20, marginTop: SPACING[2] },
  emptyActions: { gap: SPACING[2], marginTop: SPACING[4] },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], backgroundColor: COLORS.dark.elevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.dark.border, padding: SPACING[3] },
  emptyActionIndex: { width: 24, height: 24, borderRadius: RADIUS.full, textAlign: 'center', lineHeight: 24, backgroundColor: MODULE.flow.color, color: COLORS.text.inverse, fontSize: FONT.size.xs, fontWeight: FONT.weight.black },
  emptyActionText: { flex: 1, color: COLORS.text.secondary, fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold },
  // Goals
  goalCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING[2],
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: { flex: 1 },
  goalTitle: { color: COLORS.text.primary, fontSize: 15, fontWeight: '600' },
  goalStatus: { color: COLORS.text.secondary, fontSize: 12, marginTop: 2 },
  addTaskRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  addTaskInput: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 14,
    backgroundColor: COLORS.dark.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: SPACING[2],
  },
  addTaskBtn: {
    backgroundColor: MODULE.flow.color,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addTaskBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: 6,
  },
  taskCheck: { color: COLORS.text.muted, fontSize: 16 },
  taskCheckDone: { color: COLORS.success },
  taskTitle: { color: COLORS.text.primary, fontSize: 14 },
  taskTitleDone: { color: COLORS.text.muted, textDecorationLine: 'line-through' },
  // Dopamine
  categoryRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: 10,
  },
  catBtn: {
    backgroundColor: COLORS.dark.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    alignItems: 'center',
  },
  catBtnActive: { backgroundColor: MODULE.flow.color },
  catEmoji: { fontSize: 18 },
  dopamineCategory: { marginBottom: SPACING[4] },
  catLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dopamineItem: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dopamineItemInfo: { flex: 1 },
  dopamineItemName: { color: COLORS.text.primary, fontSize: 14, fontWeight: '500' },
  dopamineItemDuration: { color: COLORS.text.muted, fontSize: 11, marginTop: 2 },
  dopamineItemUse: { color: MODULE.flow.color, fontSize: 13, fontWeight: '600' },
});
