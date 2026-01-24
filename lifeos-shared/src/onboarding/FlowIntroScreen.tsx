import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboarding } from './OnboardingProvider';

/**
 * @fileoverview Intro screen for Flow (Habits and routines)
 * @module onboarding/FlowIntroScreen
 */

export function FlowIntroScreen() {
  const { nextStep } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: '#F59E0B' }]} />
        <Text style={styles.title}>MEET FLOW</Text>
        <Text style={styles.subtitle}>
          Master your routines. Build habits that align with your natural energy patterns.
        </Text>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#F59E0B' }]} onPress={nextStep}>
        <Text style={styles.buttonText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 40, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '300', letterSpacing: 4, color: '#111827', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 2 },
});
