import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useCheckInStore } from '../../../../lib/store/useCheckInStore';

export default function ReflectionScreen() {
  const router = useRouter();
  const { reflection, setReflection, selectedEmotion, selectedRegions, selectedSensations } = useCheckInStore();

  const handleGoDeeper = () => {
    const context = {
      emotion: selectedEmotion,
      regions: selectedRegions,
      sensations: selectedSensations,
      quickReflection: reflection,
    };
    
    router.push({
      pathname: '/(tabs)/mind/journal',
      params: { checkInContext: JSON.stringify(context) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>REFLECTION</Text>
          <Text style={styles.subtitle}>Anything else on your mind?</Text>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Tap to write..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={reflection}
            onChangeText={setReflection}
            autoFocus
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.finishButton]}
              onPress={() => router.push('/(tabs)/body/check-in/result')}
            >
              <Text style={styles.buttonText}>FINISH</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.goDeeperButton]}
              onPress={handleGoDeeper}
            >
              <Text style={styles.goDeeperText}>GO DEEPER</Text>
              <ArrowRight size={16} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1A1A2E',
    textAlignVertical: 'top',
  },
  footer: {
    padding: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  finishButton: {
    backgroundColor: '#8B5CF6',
  },
  goDeeperButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  goDeeperText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
