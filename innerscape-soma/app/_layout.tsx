import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UniversalHeader, OnboardingProvider, useOnboarding, WelcomeScreen, SomaIntroScreen, MindIntroScreen, FlowIntroScreen, PulseIntroScreen, HubIntroScreen, SetupScreen } from '@lifeos/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, ActivityIndicator, View } from 'react-native';

function AppContent() {
  const { hasCompletedOnboarding, currentStep, isLoading } = useOnboarding();

  const handleAppSwitch = (app: 'soma' | 'mobile') => {
    if (app === 'mobile') {
      Linking.openURL('innerscape://hub');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
        currentApp="soma" 
        onAppSwitch={handleAppSwitch} 
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAFAFA' },
        }}
      />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OnboardingProvider>
        <AppContent />
      </OnboardingProvider>
    </GestureHandlerRootView>
  );
}
