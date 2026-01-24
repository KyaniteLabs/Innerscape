import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Mic, Send, X } from 'lucide-react-native';
import { useApiClient } from '../lib/api/client';

/**
 * @fileoverview Quick Capture Modal
 * @module app/capture
 * 
 * APEX Contract:
 * - Inputs: User text input
 * - Outputs: Saves capture to backend, navigates back
 * - Errors: API failure shows error message with retry
 */

export default function CaptureModal() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const result = await api.post('/brain/capture', {
        content: text.trim(),
        source: 'mobile_quick_capture',
      });
      
      if (result.success) {
        console.log('[APEX] Capture saved:', result.data);
        router.back();
      } else {
        throw new Error(result.error?.message || 'Failed to save capture');
      }
    } catch (err) {
      console.error('[APEX] Capture error:', err);
      setError('Failed to save. Tap to retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Quick Capture</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#9CA3AF"
        multiline
        autoFocus
        value={text}
        onChangeText={setText}
      />

      {error && (
        <TouchableOpacity onPress={handleSubmit} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={() => setIsRecording(!isRecording)}
          disabled={isSaving}
        >
          <Mic size={24} color={isRecording ? 'white' : '#4F46E5'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sendButton, (!text.trim() || isSaving) && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Send size={20} color="white" />
              <Text style={styles.sendText}>Capture</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7D2FE',
  },
  sendText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '500',
  },
});
