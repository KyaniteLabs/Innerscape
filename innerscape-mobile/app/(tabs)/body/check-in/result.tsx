import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCheckInStore } from '../../../../lib/store/useCheckInStore';
import { useApiClient } from '../../../../lib/api/client';

export default function ResultScreen() {
  const router = useRouter();
  const { selectedEmotion, selectedRegions, selectedSensations, reflection, reset } = useCheckInStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();

  const handleFinish = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // APEX: Use helper to map valence/energy if needed, or send raw
      await api.post('/feelings/check-in', {
        dominantFeeling: selectedEmotion,
        bodySensation: selectedRegions.join(','),
        sensations: selectedSensations,
        reflection: reflection,
        energy: 50, // Default for now
        valence: 0,  // Default for now
      });

      reset();
      router.replace('/(tabs)/body');
    } catch (err) {
      setError('Failed to save check-in. Please try again.');
      console.error('[APEX] Save check-in error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkIcon}>
          <Text style={{ color: '#FFFFFF', fontSize: 40 }}>✓</Text>
        </View>
        
        <Text style={styles.title}>CHECK-IN COMPLETE</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Emotion</Text>
          <Text style={styles.summaryValue}>{selectedEmotion}</Text>
          
          <Text style={styles.summaryLabel}>Body Regions</Text>
          <Text style={styles.summaryValue}>{selectedRegions.join(', ') || 'None'}</Text>
          
          <Text style={styles.summaryLabel}>Sensations</Text>
          <Text style={styles.summaryValue}>{selectedSensations.join(', ') || 'None'}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>DONE</Text>
          )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  checkIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#22C55E',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#1A1A2E',
    marginBottom: 40,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontSize: 14,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#1A1A2E',
    marginBottom: 20,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  buttonDisabled: {
    backgroundColor: '#D8B4FE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
