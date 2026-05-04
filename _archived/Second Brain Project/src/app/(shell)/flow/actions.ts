"use server";

import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

/**
 * @fileoverview Server actions for Flow page
 * @module app/(shell)/flow/actions
 * 
 * APEX Contract:
 * - Inputs: habitId
 * - Outputs: void (revalidates path)
 * - Errors: Throws on API failure
 */

export async function toggleHabitCompletion(habitId: string, isCurrentlyCompleted: boolean) {
  try {
    if (isCurrentlyCompleted) {
      // Undo completion
      await api.delete(`/flow/habits/${habitId}/complete`);
    } else {
      // Mark as complete
      await api.post(`/flow/habits/${habitId}/complete`, {});
    }
    
    // Revalidate the flow page to show updated state
    revalidatePath('/flow');
    
    return { success: true };
  } catch (error) {
    console.error('[APEX] Toggle habit error:', error);
    return { success: false, error: 'Failed to update habit' };
  }
}
