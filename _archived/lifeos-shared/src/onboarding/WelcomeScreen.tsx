import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboarding } from './OnboardingProvider';

/**
 * @fileoverview Welcome screen for the Innerscape Suite
 * @module onboarding/WelcomeScreen
 */

export function WelcomeScreen() {
  const { nextStep } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo} />
        <Text style={styles.title}>INNERSCAPE</Text>
        <Text style={styles.subtitle}>
          Your unified suite for self-awareness, depth, and intentional action.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={nextStep}>
        <Text style={styles.buttonText}>BEGIN YOUR JOURNEY</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 40, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 80, height: 80, backgroundColor: '#4F46E5', borderRadius: 20, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '300', letterSpacing: 8, color: '#111827', marginBottom: 16 },
  subtitle: { fontSize: 18, color: '#6B7280', textAlign: 'center', lineHeight: 28 },
  button: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 2 },
});
