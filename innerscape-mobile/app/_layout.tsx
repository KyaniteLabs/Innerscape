import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="capture" options={{ presentation: 'modal', title: 'Quick Capture' }} />
          <Stack.Screen name="chat" options={{ presentation: 'modal', title: 'Innerscape AI' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
