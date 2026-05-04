import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

export function selectionAsync() {
  if (!isWeb) Haptics.selectionAsync();
}

export function notificationAsync(type: Haptics.NotificationFeedbackType) {
  if (!isWeb) Haptics.notificationAsync(type);
}

export function impactAsync(style: Haptics.ImpactFeedbackStyle) {
  if (!isWeb) Haptics.impactAsync(style);
}
