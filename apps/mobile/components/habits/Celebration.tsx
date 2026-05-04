import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface CelebrationProps {
  trigger: boolean;
  message?: string;
  on_done?: () => void;
}

export function Celebration({ trigger, message = 'Nice work!', on_done }: CelebrationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!trigger) return;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      scale.setValue(0.5);
      on_done?.();
    });
  }, [trigger]);

  if (!trigger) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#1a2e1a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  emoji: { fontSize: 48 },
  message: { color: '#4caf50', fontSize: 18, fontWeight: '600', marginTop: 8 },
});
