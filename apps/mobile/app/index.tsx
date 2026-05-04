import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContextGreeting } from '../components/ContextGreeting';
import { QuickCheckIn } from '../components/checkin/QuickCheckIn';
import { useEmotionalStore } from '../stores/emotional';

export default function HomeScreen() {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInComplete, setCheckInComplete] = useState(false);
  const computedState = useEmotionalStore((s) => s.computedState);

  const handleCheckInComplete = () => {
    setCheckInComplete(true);
    setTimeout(() => {
      setShowCheckIn(false);
      setCheckInComplete(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ContextGreeting />

        {showCheckIn && !checkInComplete ? (
          <QuickCheckIn on_complete={handleCheckInComplete} />
        ) : checkInComplete ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmationText}>Got it ✓</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => setShowCheckIn(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInButtonText}>Quick Check-in</Text>
          </TouchableOpacity>
        )}

        {computedState && (
          <View style={styles.stateCard}>
            <Text style={styles.stateLabel}>Current state</Text>
            <Text style={styles.stateValue}>
              {computedState.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>
        )}

        <View style={styles.moduleGrid}>
          {['Mind', 'Flow', 'Body', 'Hub'].map((module) => (
            <View key={module} style={styles.moduleCard}>
              <Text style={styles.moduleName}>{module}</Text>
              <Text style={styles.moduleStatus}>Coming soon</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingVertical: 16,
  },
  checkInButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmation: {
    backgroundColor: '#1a2e1a',
    borderRadius: 16,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  confirmationText: {
    color: '#4caf50',
    fontSize: 20,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  stateLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stateValue: {
    fontSize: 16,
    color: '#e0e0e0',
    fontWeight: '500',
    marginTop: 4,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  moduleCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e0e0',
  },
  moduleStatus: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});
