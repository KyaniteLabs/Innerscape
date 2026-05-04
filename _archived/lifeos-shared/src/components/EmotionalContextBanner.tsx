import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useEmotionalContext } from '../hooks/useEmotionalContext';

/**
 * @fileoverview Shared Emotional Context Banner for mobile apps
 * @module components/EmotionalContextBanner
 */

export function EmotionalContextBanner() {
  const { energy, valence, isLoaded } = useEmotionalContext();

  if (!isLoaded || !energy) return null;

  const getEmoji = () => {
    if (valence === 'pleasant') return energy === 'high' ? '⚡️' : '🌿';
    if (valence === 'unpleasant') return energy === 'high' ? '💢' : '☁️';
    return '😐';
  };

  const getBackgroundColor = () => {
    if (valence === 'pleasant') return '#ECFDF5';
    if (valence === 'unpleasant') return '#FEF2F2';
    return '#F9FAFB';
  };

  const getTextColor = () => {
    if (valence === 'pleasant') return '#059669';
    if (valence === 'unpleasant') return '#DC2626';
    return '#4B5563';
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[styles.text, { color: getTextColor() }]}>
        {getEmoji()} Currently feeling {energy} energy and {valence} valence.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
