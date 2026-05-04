/**
 * @fileoverview Unified onboarding context
 * @module onboarding/OnboardingProvider
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  completeOnboarding: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_KEY = 'innerscape_onboarding_complete';
const TOTAL_STEPS = 7;

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (status === 'true') {
          setHasCompleted(true);
        }
      } catch (err) {
        console.error('[APEX] Failed to load onboarding status', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStatus();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <OnboardingContext.Provider value={{
      hasCompletedOnboarding,
      currentStep,
      completeOnboarding,
      nextStep,
      prevStep,
      isLoading
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
};
