import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UniversalHeader, OnboardingProvider, useOnboarding, WelcomeScreen, SomaIntroScreen, MindIntroScreen, FlowIntroScreen, PulseIntroScreen, HubIntroScreen, SetupScreen, EmotionalContextBanner } from '@lifeos/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { Celebrations } from '../components/Celebrations';
import { registerBackgroundSync } from '../lib/health/backgroundSync';

const queryClient = new QueryClient();

function AppContent() {
  const { hasCompletedOnboarding, currentStep, isLoading } = useOnboarding();

  // APEX: Register background health sync on app launch
  useEffect(() => {
    registerBackgroundSync().catch((err) => {
      console.warn('[APEX] Background sync registration failed:', err);
      // Not critical, app still works without it
    });
  }, []);

  const handleAppSwitch = (app: 'soma' | 'mobile') => {
    if (app === 'soma') {
      Linking.openURL('innerscape://soma');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    switch (currentStep) {
      case 0: return <WelcomeScreen />;
      case 1: return <SomaIntroScreen />;
      case 2: return <MindIntroScreen />;
      case 3: return <FlowIntroScreen />;
      case 4: return <PulseIntroScreen />;
      case 5: return <HubIntroScreen />;
      case 6: return <SetupScreen />;
      default: return <WelcomeScreen />;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <UniversalHeader 
        currentApp="mobile" 
        onAppSwitch={handleAppSwitch} 
      />
      <EmotionalContextBanner />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="capture" options={{ presentation: 'modal', title: 'Quick Capture' }} />
        <Stack.Screen name="chat" options={{ presentation: 'modal', title: 'Innerscape AI' }} />
      </Stack>
      <Celebrations />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
