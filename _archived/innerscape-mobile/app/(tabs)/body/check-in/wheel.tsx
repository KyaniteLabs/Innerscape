import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { EmotionWheel } from '../../../../components/body/EmotionWheel';
import { useCheckInStore } from '../../../../lib/store/useCheckInStore';

export default function EmotionWheelScreen() {
  const router = useRouter();
  const { selectedEmotion, setEmotion } = useCheckInStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EMOTIONS</Text>
        <Text style={styles.subtitle}>
          {selectedEmotion ? `You selected ${selectedEmotion}` : 'Rotate and select an emotion'}
        </Text>
      </View>

      <View style={styles.content}>
        <EmotionWheel 
          isDark={false}
          onEmotionSelect={setEmotion}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, !selectedEmotion && styles.buttonDisabled]}
          onPress={() => router.push('/(tabs)/body/check-in/sensations')}
          disabled={!selectedEmotion}
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
