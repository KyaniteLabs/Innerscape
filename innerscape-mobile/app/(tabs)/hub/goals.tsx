import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Modal, SafeAreaView } from 'react-native';
import { Plus, X, Target } from 'lucide-react-native';
import { useGoals, Goal } from '../../../lib/hooks/useGoals';
import { GoalCard } from '../../../components/GoalCard';

export default function GoalsScreen() {
  const { goals, loading, error, fetchGoals, createGoal } = useGoals();
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Personal' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreate = async () => {
    if (!newGoal.title.trim()) return;
    try {
      setCreating(true);
      await createGoal(newGoal);
      setModalVisible(false);
      setNewGoal({ title: '', description: '', category: 'Personal' });
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView 
        className="flex-1 p-6"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchGoals} />}
      >
        {error && (
          <View className="p-4 bg-red-50 rounded-2xl mb-6">
            <Text className="text-red-600 text-sm text-center">{error}</Text>
          </View>
        )}

        {goals.length === 0 && !loading ? (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
              <Target size={40} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-2">No goals yet</Text>
            <Text className="text-sm text-gray-500 text-center px-10">
              Start by setting your first primary focus or a long-term goal.
            </Text>
          </View>
        ) : (
          goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        className="absolute bottom-8 right-8 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white p-8">
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-2xl font-bold text-gray-900">New Goal</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="gap-6">
            <View>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Title
              </Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-2xl text-gray-900"
                placeholder="What do you want to achieve?"
                value={newGoal.title}
                onChangeText={v => setNewGoal(p => ({ ...p, title: v }))}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Category
              </Text>
              <View className="flex-row gap-2">
                {['Personal', 'Work', 'Health', 'Learning'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewGoal(p => ({ ...p, category: cat }))}
                    className={`px-4 py-2 rounded-full border ${
                      newGoal.category === cat ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${
                      newGoal.category === cat ? 'text-white' : 'text-gray-500'
                    }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Description (Optional)
              </Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-2xl text-gray-900 min-h-[100px]"
                placeholder="Details about your goal..."
                multiline
                textAlignVertical="top"
                value={newGoal.description}
                onChangeText={v => setNewGoal(p => ({ ...p, description: v }))}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={creating || !newGoal.title.trim()}
              className={`p-4 rounded-2xl items-center mt-4 ${
                creating || !newGoal.title.trim() ? 'bg-gray-200' : 'bg-indigo-600'
              }`}
            >
              {creating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Create Goal</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
