import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { getDesignTokens } from '../lib/theme';
import { useDesignProfileStore } from '../stores/designProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateDesign = useDesignProfileStore((s) => s.hydrate);
  const designProfile = useDesignProfileStore((s) => s.profile);
  const design = getDesignTokens(designProfile);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    hydrateDesign();
  }, [hydrateDesign]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: design.colors.background },
            headerTintColor: design.colors.text.primary,
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
