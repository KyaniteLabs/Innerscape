import { Stack } from 'expo-router';
import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingProvider } from '@lifeos/shared';
import { Celebrations } from '../components/Celebrations';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
            <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
          </Stack>
          <Celebrations />
        </OnboardingProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
