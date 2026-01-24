import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCheckInStore } from '../../lib/store/useCheckInStore';

export default function StartScreen() {
  const router = useRouter();
  const reset = useCheckInStore(state => state.reset);

  const handleStart = () => {
    reset();
    router.push('/(flow)/body-scan');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
          <Text style={styles.title}>SOMA</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Connecting body and mind through somatic awareness.
        </Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>CHECK IN</Text>
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
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 8,
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 60,
    lineHeight: 28,
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
