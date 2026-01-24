import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCheckInStore } from '../../lib/store/useCheckInStore';

const SENSATIONS = [
  'Static', 'Buzzing', 'Prickly', 'Smooth', 'Soft',
  'Hot', 'Warm', 'Cold', 'Frozen',
  'Tight', 'Squeezed', 'Heavy', 'Light',
  'Racing', 'Pounding', 'Fluttering', 'Still'
];

export default function SensationsScreen() {
  const router = useRouter();
  const { selectedSensations, toggleSensation } = useCheckInStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SENSATIONS</Text>
        <Text style={styles.subtitle}>What does it feel like?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.chipContainer}>
          {SENSATIONS.map((sensation) => {
            const isSelected = selectedSensations.includes(sensation);
            return (
              <TouchableOpacity
                key={sensation}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleSensation(sensation)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {sensation}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, selectedSensations.length === 0 && styles.buttonDisabled]}
          onPress={() => router.push('/(flow)/reflection')}
          disabled={selectedSensations.length === 0}
        >
          <Text style={styles.buttonText}>NEXT</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
