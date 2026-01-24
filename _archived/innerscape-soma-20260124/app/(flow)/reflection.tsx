import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCheckInStore } from '../../lib/store/useCheckInStore';

export default function ReflectionScreen() {
  const router = useRouter();
  const { reflection, setReflection } = useCheckInStore();

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
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/(flow)/result')}
          >
            <Text style={styles.buttonText}>FINISH</Text>
          </TouchableOpacity>
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
  button: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
