import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Mic, Square, Save } from 'lucide-react-native';
import { useVoiceRecorder } from '../../../lib/voice/useVoiceRecorder';
import { transcribeAudio } from '../../../lib/voice/transcribe';
import { useApiClient } from '../../../lib/api/client';
import Constants from 'expo-constants';

export default function JournalMode() {
  const { isRecording, duration, startRecording, stopRecording } = useVoiceRecorder();
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const api = useApiClient();

  const DEEPGRAM_API_KEY = Constants.expoConfig?.extra?.deepgramApiKey || process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY;

  const toggleRecording = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri && DEEPGRAM_API_KEY) {
        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(uri, DEEPGRAM_API_KEY);
          setTranscription(result.text);
        } catch (error) {
          console.error('Transcription failed:', error);
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      setTranscription('');
      await startRecording();
    }
  };

  const handleSave = async () => {
    if (!transcription.trim()) return;
    
    setIsSaving(true);
    try {
      await api.post('/journal/entries', {
        content: transcription,
        transcriptionSource: 'deepgram',
      });
      setTranscription('');
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Voice Journal</Text>
      <Text style={styles.subtitle}>Speak your thoughts, find clarity.</Text>
      
      <View style={styles.recorderContainer}>
        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.recordingButton]} 
          onPress={toggleRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator size="large" color="white" />
          ) : isRecording ? (
            <Square size={32} color="white" />
          ) : (
            <Mic size={32} color="white" />
          )}
        </TouchableOpacity>
        <Text style={styles.statusText}>
          {isTranscribing ? 'Transcribing...' : isRecording ? formatDuration(duration) : 'Tap to start'}
        </Text>
      </View>

      {transcription && (
        <View style={styles.transcriptionCard}>
          <Text style={styles.transcriptionText}>{transcription}</Text>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.promptContainer}>
        <Text style={styles.promptTitle}>Reflection Prompt</Text>
        <Text style={styles.promptText}>"What is one thing that surprised you today?"</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FAFAFA' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4, marginBottom: 32 },
  recorderContainer: { alignItems: 'center', marginBottom: 40 },
  recordButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  recordingButton: { backgroundColor: '#EF4444' },
  statusText: { marginTop: 12, fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  transcriptionCard: {
    padding: 20, backgroundColor: 'white', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 32,
  },
  transcriptionText: { fontSize: 16, lineHeight: 24, color: '#1F2937', marginBottom: 16 },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, gap: 8,
  },
  saveButtonText: { color: 'white', fontWeight: '600' },
  promptContainer: { padding: 20, backgroundColor: '#F3F4F6', borderRadius: 16 },
  promptTitle: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 },
  promptText: { fontSize: 18, fontStyle: 'italic', color: '#374151' },
});
