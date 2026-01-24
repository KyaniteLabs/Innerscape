/**
 * APEX Contract: AI Classification
 * Inputs: Raw text capture
 * Outputs: { type: 'task'|'idea'|'journal'|'person', confidence: number }
 * Dependencies: Uses process.env.AI_MODEL_ENDPOINT
 */

export interface ClassificationResult {
  type: 'task' | 'idea' | 'journal' | 'person';
  confidence: number;
}

export const classifyCapture = async (input: string): Promise<ClassificationResult> => {
  console.log(`[APEX] Classifying capture: "${input.substring(0, 20)}..."`);
  
  // Placeholder for real AI call (e.g. OpenAI, Anthropic, or GLM-4)
  // In a real implementation, this would be a fetch to an LLM provider
  
  const prompt = input.toLowerCase();
  
  if (prompt.includes('buy') || prompt.includes('call') || prompt.includes('fix') || prompt.includes('do')) {
    return { type: 'task', confidence: 0.95 };
  }
  
  if (prompt.includes('feel') || prompt.includes('today') || prompt.includes('happy') || prompt.includes('sad')) {
    return { type: 'journal', confidence: 0.85 };
  }
  
  if (prompt.includes('met') || prompt.includes('said') || prompt.includes('birthday')) {
    return { type: 'person', confidence: 0.80 };
  }
  
  return { type: 'idea', confidence: 0.70 };
};
