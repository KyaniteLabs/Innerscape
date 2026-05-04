import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Mic, Send } from 'lucide-react-native';
import { useApiClient } from '../lib/api/client';

export const CaptureInput = ({ onCapture }: { onCapture: () => void }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApiClient();

  const handleCapture = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    const res = await api.post('/brain/capture', { content: text });
    setLoading(false);
    
    if (res.success) {
      setText('');
      onCapture();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        value={text}
        onChangeText={setText}
        multiline
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton}>
          <Mic size={24} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sendButton, !text.trim() && styles.disabled]} 
          onPress={handleCapture}
          disabled={loading || !text.trim()}
        >
          {loading ? <ActivityIndicator color="white" size="small" /> : <Send size={20} color="white" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    color: '#1F2937',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    minWidth: 44,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#C7D2FE',
  }
});
