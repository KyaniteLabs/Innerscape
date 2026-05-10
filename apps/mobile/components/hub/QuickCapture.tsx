import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { selectionAsync } from '../../lib/haptics';
import { COLORS, SPACING, RADIUS, FONT } from '../../lib/theme';

interface QuickCaptureProps {
  on_capture: (data: { content: string; tags: string[] }) => void;
}

export function QuickCapture({ on_capture }: QuickCaptureProps) {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleCapture = () => {
    if (!content.trim()) return;
    selectionAsync();
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
          placeholderTextColor={COLORS.text.muted}
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
        placeholderTextColor={COLORS.text.muted}
        value={tagInput}
        onChangeText={setTagInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.dark.card,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[3],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.base - 1,
    paddingVertical: SPACING[1],
  },
  captureButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: { opacity: 0.3 },
  captureButtonText: { color: COLORS.text.inverse, fontSize: FONT.size.xl + 2, fontWeight: '300' },
  tagInput: {
    color: COLORS.text.muted,
    fontSize: FONT.size.xs,
    marginTop: 6,
    paddingTop: 6,
    borderTopColor: COLORS.dark.elevated,
    borderTopWidth: 1,
  },
});
