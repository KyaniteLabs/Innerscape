import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

/**
 * @fileoverview Simple Emotion Wheel (Expo Go compatible)
 * @module components/body/EmotionWheel
 * 
 * APEX Contract:
 * - Inputs: onEmotionSelect (callback), isDark (boolean)
 * - Outputs: Renders interactive emotion grid
 * - Note: Simplified version for Expo Go testing (no Skia)
 */

const { width } = Dimensions.get('window');

interface Emotion {
  name: string;
  color: string;
  emoji: string;
}

const EMOTIONS: Emotion[] = [
  { name: 'Joy', color: '#F59E0B', emoji: '😊' },
  { name: 'Trust', color: '#10B981', emoji: '🤝' },
  { name: 'Fear', color: '#06B6D4', emoji: '😨' },
  { name: 'Surprise', color: '#3B82F6', emoji: '😲' },
  { name: 'Sadness', color: '#6366F1', emoji: '😢' },
  { name: 'Disgust', color: '#8B5CF6', emoji: '😤' },
  { name: 'Anger', color: '#EF4444', emoji: '😠' },
  { name: 'Anticipation', color: '#F97316', emoji: '🤔' },
];

interface Props {
  onEmotionSelect: (emotion: string) => void;
  isDark?: boolean;
}

export function EmotionWheel({ onEmotionSelect, isDark }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.titleDark]}>
        How are you feeling?
      </Text>
      <View style={styles.grid}>
        {EMOTIONS.map((emotion) => (
          <TouchableOpacity
            key={emotion.name}
            style={[styles.emotionButton, { backgroundColor: emotion.color + '20' }]}
            onPress={() => onEmotionSelect(emotion.name)}
            accessibilityLabel={`Select ${emotion.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{emotion.emoji}</Text>
            <Text style={[styles.emotionName, { color: emotion.color }]}>
              {emotion.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  titleDark: {
    color: '#F9FAFB',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  emotionButton: {
    width: (width * 0.9 - 60) / 4,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emotionName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
