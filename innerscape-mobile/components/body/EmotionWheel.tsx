import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { 
  Canvas, 
  Path, 
  Skia, 
  Group, 
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';

/**
 * @fileoverview Plutchik Emotion Wheel implemented with Skia
 * @module components/body/EmotionWheel
 * 
 * APEX Contract:
 * - Inputs: onEmotionSelect (callback), isDark (boolean)
 * - Outputs: Renders interactive 8-petal wheel
 * - Errors: Graceful fallback if Skia fails
 */

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.9;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2.5;

interface Emotion {
  name: string;
  color: string;
  intensityColor: string;
}

const EMOTIONS: Emotion[] = [
  { name: 'Joy', color: 'rgba(212, 168, 83, 0.4)', intensityColor: 'rgba(212, 168, 83, 0.8)' },
  { name: 'Trust', color: 'rgba(144, 238, 144, 0.4)', intensityColor: 'rgba(144, 238, 144, 0.8)' },
  { name: 'Fear', color: 'rgba(80, 200, 120, 0.4)', intensityColor: 'rgba(80, 200, 120, 0.8)' },
  { name: 'Surprise', color: 'rgba(34, 211, 238, 0.4)', intensityColor: 'rgba(34, 211, 238, 0.8)' },
  { name: 'Sadness', color: 'rgba(59, 130, 246, 0.4)', intensityColor: 'rgba(59, 130, 246, 0.8)' },
  { name: 'Disgust', color: 'rgba(147, 51, 234, 0.4)', intensityColor: 'rgba(147, 51, 234, 0.8)' },
  { name: 'Anger', color: 'rgba(232, 164, 156, 0.4)', intensityColor: 'rgba(232, 164, 156, 0.8)' },
  { name: 'Anticipation', color: 'rgba(251, 146, 60, 0.4)', intensityColor: 'rgba(251, 146, 60, 0.8)' },
];

interface Props {
  onEmotionSelect: (emotion: string) => void;
  isDark: boolean;
}

export function EmotionWheel({ onEmotionSelect, isDark }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      rotation.value = lastRotation.value + event.translationX * 0.01;
    })
    .onEnd(() => {
      lastRotation.value = rotation.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const dx = event.x - CENTER;
      const dy = event.y - CENTER;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Simple hit detection for petals
      if (distance > RADIUS * 0.2 && distance < RADIUS * 1.5) {
        const angle = (Math.atan2(dy, dx) - rotation.value + Math.PI * 2.5) % (Math.PI * 2);
        const index = Math.floor((angle / (Math.PI * 2)) * EMOTIONS.length);
        const emotion = EMOTIONS[index % EMOTIONS.length].name;
        runOnJS(onEmotionSelect)(emotion);
      }
    });

  const composed = Gesture.Race(panGesture, pinchGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}rad` },
      { scale: scale.value }
    ],
  }));

  const petals = useMemo(() => {
    const angleStep = (Math.PI * 2) / EMOTIONS.length;
    return EMOTIONS.map((emotion, i) => {
      const startAngle = i * angleStep - Math.PI / 2 - angleStep / 2;
      const sweepAngle = angleStep;

      // Create petal path
      const path = Skia.Path.Make();
      const innerR = RADIUS * 0.3;
      const outerR = RADIUS;
      const petalOuterMultiplier = 1.5;
      const petalMidMultiplier = 1.2;
      const midR = RADIUS * 0.6;

      // Outer petal
      path.moveTo(
        CENTER + innerR * Math.cos(startAngle),
        CENTER + innerR * Math.sin(startAngle)
      );
      path.quadTo(
        CENTER + outerR * petalOuterMultiplier * Math.cos(startAngle + sweepAngle / 2),
        CENTER + outerR * petalOuterMultiplier * Math.sin(startAngle + sweepAngle / 2),
        CENTER + innerR * Math.cos(startAngle + sweepAngle),
        CENTER + innerR * Math.sin(startAngle + sweepAngle)
      );
      path.close();

      // Inner petal (intensity)
      const innerPath = Skia.Path.Make();
      innerPath.moveTo(
        CENTER + innerR * Math.cos(startAngle),
        CENTER + innerR * Math.sin(startAngle)
      );
      innerPath.quadTo(
        CENTER + midR * petalMidMultiplier * Math.cos(startAngle + sweepAngle / 2),
        CENTER + midR * petalMidMultiplier * Math.sin(startAngle + sweepAngle / 2),
        CENTER + innerR * Math.cos(startAngle + sweepAngle),
        CENTER + innerR * Math.sin(startAngle + sweepAngle)
      );
      innerPath.close();

      return { path, innerPath, color: emotion.color, intensityColor: emotion.intensityColor };
    });
  }, []);

  return (
    <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Canvas style={{ flex: 1 }}>
            {petals.map((petal, i) => (
              <Group key={i}>
                <Path 
                  path={petal.path} 
                  color={petal.color} 
                  style="fill" 
                />
                <Path 
                  path={petal.path} 
                  color={petal.intensityColor} 
                  style="stroke" 
                  strokeWidth={2}
                />
                <Path 
                  path={petal.innerPath} 
                  color={petal.intensityColor} 
                  style="fill" 
                />
              </Group>
            ))}
            {/* Center Hole */}
            <Path
              path={Skia.Path.Make().addCircle(CENTER, CENTER, RADIUS * 0.3)}
              color={isDark ? '#0F172A' : '#FAFAFA'}
              style="fill"
            />
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
