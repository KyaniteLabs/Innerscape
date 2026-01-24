import { create } from 'zustand';

/**
 * @fileoverview Celebration event store
 * @module lib/hooks/useCelebrations
 * 
 * APEX Contract:
 * - Inputs: Message string via trigger()
 * - Outputs: Celebration state (showConfetti, message)
 * - Errors: None (pure state management)
 */

interface CelebrationState {
  showConfetti: boolean;
  message: string | null;
  trigger: (message: string) => void;
  reset: () => void;
}

export const useCelebrations = create<CelebrationState>((set) => ({
  showConfetti: false,
  message: null,
  trigger: (message) => set({ showConfetti: true, message }),
  reset: () => set({ showConfetti: false, message: null }),
}));
