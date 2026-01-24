import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboarding } from './OnboardingProvider';

/**
 * @fileoverview Intro screen for Soma (Somatic awareness)
 * @module onboarding/SomaIntroScreen
 */

export function SomaIntroScreen() {
  const { nextStep } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: '#8B5CF6' }]} />
        <Text style={styles.title}>MEET SOMA</Text>
        <Text style={styles.subtitle}>
          Listen to your body. Track physical sensations and connect them to your emotional state.
        </Text>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#8B5CF6' }]} onPress={nextStep}>
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
