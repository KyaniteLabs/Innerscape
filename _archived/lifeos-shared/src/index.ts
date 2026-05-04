// Export components
export * from './components/UniversalHeader';
export * from './components/Button';
export * from './components/Card';
export * from './components/EmotionalContextBanner';

// Export hooks
export * from './hooks/useEmotionalContext';

// Export storage
export * from './storage/appGroups';
// NOTE: syncService and powerSyncSchema require native modules (PowerSync)
// They are NOT exported from main entry for Expo Go compatibility
// Import directly from './storage/syncService' or './schemas/powerSyncSchema' 
// only in development builds that support native modules

// Export onboarding
export * from './onboarding/OnboardingProvider';
export * from './onboarding/WelcomeScreen';
export * from './onboarding/SomaIntroScreen';
export * from './onboarding/MindIntroScreen';
export * from './onboarding/FlowIntroScreen';
export * from './onboarding/PulseIntroScreen';
export * from './onboarding/HubIntroScreen';
export * from './onboarding/SetupScreen';

// Export types
export * from './types';
