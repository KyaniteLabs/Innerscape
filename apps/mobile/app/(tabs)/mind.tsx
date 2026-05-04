import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JournalFeed } from '../../components/journal/JournalFeed';

interface JournalEntry {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function MindScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 'demo-1',
      content: 'Starting to notice patterns in my energy levels. Morning check-ins help me plan the day better.',
      tags: ['awareness', 'energy'],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isComposing, setIsComposing] = useState(false);
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleCreate = () => {
    if (!content.trim()) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const entry: JournalEntry = {
      id: `local-${Date.now()}`,
      content: content.trim(),
      tags,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [entry, ...prev]);
    setContent('');
    setTagInput('');
    setIsComposing(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Journal</Text>
            <TouchableOpacity
              style={styles.composeButton}
              onPress={() => setIsComposing(!isComposing)}
            >
              <Text style={styles.composeButtonText}>
                {isComposing ? 'Cancel' : '+ New Entry'}
              </Text>
            </TouchableOpacity>
          </View>

          {isComposing && (
            <View style={styles.composeCard}>
              <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                placeholderTextColor="#555"
                value={content}
                onChangeText={setContent}
                multiline
                autoFocus
              />
              <TextInput
                style={styles.tagInput}
                placeholder="Tags (comma-separated)"
                placeholderTextColor="#555"
                value={tagInput}
                onChangeText={setTagInput}
              />
              <TouchableOpacity
                style={[styles.saveButton, !content.trim() && styles.saveButtonDisabled]}
                onPress={handleCreate}
                disabled={!content.trim()}
              >
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          )}

          <JournalFeed entries={entries} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f23' },
  flex: { flex: 1 },
  content: { paddingVertical: 16, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#e0e0e0', fontSize: 24, fontWeight: '700' },
  composeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  composeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  composeCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    color: '#e0e0e0',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInput: {
    color: '#e0e0e0',
    fontSize: 13,
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: '#1a1a3e',
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
