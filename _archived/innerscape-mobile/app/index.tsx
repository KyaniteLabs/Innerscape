import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useOnboarding, WelcomeScreen, SomaIntroScreen, MindIntroScreen, FlowIntroScreen, PulseIntroScreen, HubIntroScreen, SetupScreen } from '@lifeos/shared';

export default function Index() {
  const { hasCompletedOnboarding, currentStep, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // If onboarding is complete, redirect to main app
  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/hub" />;
  }

  // Show onboarding screens
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
