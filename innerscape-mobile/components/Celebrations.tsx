import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useCelebrations } from '../lib/hooks/useCelebrations';
import { Sparkles } from 'lucide-react-native';

/**
 * @fileoverview Celebration overlay with confetti and message
 * @module components/Celebrations
 */

export function Celebrations() {
  const { showConfetti, message, reset } = useCelebrations();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showConfetti) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        reset();
      });
    }
  }, [showConfetti, fadeAnim, reset]);

  if (!showConfetti) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={true}
        fadeOut={true}
      />
      
      {message && (
        <Animated.View 
          style={[
            styles.messageContainer, 
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.messageCard}>
            <Sparkles size={24} color="#F59E0B" />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCard: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  messageText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  }
});
