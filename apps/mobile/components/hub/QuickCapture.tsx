import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CaptureItem {
  id: string;
  content: string;
  contentType: string;
  tags: string[];
  capturedAt: string;
  classificationStatus: string;
}

interface QuickCaptureProps {
  on_capture: (data: { content: string; tags: string[] }) => void;
}

export function QuickCapture({ on_capture }: QuickCaptureProps) {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleCapture = () => {
    if (!content.trim()) return;
    Haptics.selectionAsync();
    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    on_capture({ content: content.trim(), tags });
    setContent('');
    setTagInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Capture a thought..."
          placeholderTextColor="#555"
          value={content}
          onChangeText={setContent}
          onSubmitEditing={handleCapture}
          returnKeyType="done"
          autoFocus
        />
        <TouchableOpacity
          style={[styles.captureButton, !content.trim() && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={!content.trim()}
        >
          <Text style={styles.captureButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.tagInput}
        placeholder="Tags (comma-separated, optional)"
        placeholderTextColor="#444"
        value={tagInput}
        onChangeText={setTagInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#e0e0e0',
    fontSize: 15,
    paddingVertical: 4,
  },
  captureButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: { opacity: 0.3 },
  captureButtonText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  tagInput: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopColor: '#1a1a3e',
    borderTopWidth: 1,
  },
});
