import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboarding } from './OnboardingProvider';

/**
 * @fileoverview Final setup screen for onboarding
 * @module onboarding/SetupScreen
 */

export function SetupScreen() {
  const { completeOnboarding } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>🚀</Text>
        </View>
        <Text style={styles.title}>READY TO GO</Text>
        <Text style={styles.subtitle}>
          Sign in to your account to sync your data across all your devices and get started.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={completeOnboarding}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 40, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 80, height: 80, backgroundColor: '#F3F4F6', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '300', letterSpacing: 4, color: '#111827', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  button: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 2 },
});
