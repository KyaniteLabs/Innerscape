/**
 * @fileoverview Soma Inference Service
 * @module lib/services/inference
 * 
 * APEX Contract:
 * - Inputs: regions, sensations
 * - Outputs: Predicted primary emotion hypothesis
 * - Errors: Returns 'Neutral' if no match found
 */

export interface InferenceResult {
  primaryEmotion: string;
  confidence: number;
  reasoning: string;
}

const MAPPINGS: Record<string, string[]> = {
  'Anger': ['Tight', 'Hot', 'Pounding', 'Chest'],
  'Fear': ['Fluttering', 'Cold', 'Racing', 'Belly'],
  'Sadness': ['Heavy', 'Hollow', 'Still', 'Chest'],
  'Joy': ['Light', 'Warm', 'Alive', 'Chest'],
  'Surprise': ['Sharp', 'Loud', 'Racing', 'Head'],
  'Disgust': ['Squeezed', 'Numb', 'Sinking', 'Belly'],
  'Anticipation': ['Buzzing', 'Electric', 'Racing', 'Head'],
  'Trust': ['Soft', 'Smooth', 'Still', 'Chest'],
};

export const inferenceService = {
  predict(regions: string[], sensations: string[]): InferenceResult {
    console.log('[APEX] Running somatic inference');
    
    let bestMatch = 'Neutral';
    let maxScore = 0;

    for (const [emotion, triggers] of Object.entries(MAPPINGS)) {
      const matchCount = triggers.filter(t => 
        regions.some(r => r.toLowerCase().includes(t.toLowerCase())) || 
        sensations.includes(t)
      ).length;

      if (matchCount > maxScore) {
        maxScore = matchCount;
        bestMatch = emotion;
      }
    }

    const confidence = maxScore / 4; // Simple heuristic

    return {
      primaryEmotion: bestMatch,
      confidence: Math.min(confidence, 1.0),
      reasoning: `Based on ${maxScore} somatic markers detected.`,
    };
  }
};
