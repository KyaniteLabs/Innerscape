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
    favicon: './assets/favicon.png',
    name: 'Innerscape',
    shortName: 'Innerscape',
    description: 'Executive prosthetic for neurodivergent minds',
    backgroundColor: '#0f0f23',
    themeColor: '#6c63ff',
    startUrl: '/',
    display: 'standalone',
    orientation: 'portrait',
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
