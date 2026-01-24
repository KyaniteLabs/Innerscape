import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Plus, Folder } from 'lucide-react-native';
import { useApiClient } from '../../../lib/api/client';

/**
 * APEX Contract: Projects Screen
 * Displays and manages user projects
 */

interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export default function ProjectsScreen() {
  const api = useApiClient();
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await api.get<Project[]>('/projects');
      return result.data ?? [];
    },
  });

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity style={styles.projectCard}>
      <Folder size={24} color="#4F46E5" />
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Text style={styles.projectStatus}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects yet. Create your first one!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  projectCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, marginBottom: 12, gap: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  projectStatus: { fontSize: 14, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6B7280' },
});
