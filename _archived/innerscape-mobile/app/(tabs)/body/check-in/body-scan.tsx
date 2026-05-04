import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { BodyScan } from '../../../../components/body/BodyScan';
import { useCheckInStore } from '../../../../lib/store/useCheckInStore';

export default function BodyScanScreen() {
  const router = useRouter();
  const { selectedRegions, toggleRegion } = useCheckInStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BODY SCAN</Text>
        <Text style={styles.subtitle}>Where do you feel it in your body?</Text>
      </View>

      <View style={styles.content}>
        <BodyScan 
          selectedRegions={selectedRegions}
          onRegionSelect={toggleRegion}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, selectedRegions.length === 0 && styles.buttonDisabled]}
          onPress={() => router.push('/(tabs)/body/check-in/wheel')}
          disabled={selectedRegions.length === 0}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
