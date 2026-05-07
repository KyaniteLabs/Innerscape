import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Innerscape',
  slug: 'innerscape',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'innerscape',
  userInterfaceStyle: 'dark',
  platforms: ['ios', 'android', 'web'],
  web: {
    name: 'Innerscape',
    shortName: 'Innerscape',
    description: 'A neurodivergent-first sanctuary OS for fluctuating capacity, sensory needs, memory, body signal, and next action',
    backgroundColor: '#08110E',
    themeColor: '#A8F0C6',
    startUrl: '/',
    display: 'standalone',
    orientation: 'portrait',
    bundler: 'metro',
  },
  plugins: ['expo-router', 'expo-secure-store'],
  experiments: {
    typedRoutes: true,
  },
} satisfies ExpoConfig;

export default { ...config, newArchEnabled: true };
