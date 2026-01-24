/**
 * @fileoverview Soma Pattern Analysis Service
 * @module lib/services/patterns
 * 
 * APEX Contract:
 * - Inputs: Auth token
 * - Outputs: List of cross-app patterns/insights
 * - Errors: Returns empty list on failure, logs error
 */

export interface Insight {
  id: string;
  title: string;
  content: string;
  type: 'pattern' | 'correlation' | 'suggestion';
  createdAt: string;
}

const BASE_URL = 'https://api.innerscape.app/api';

export const patternService = {
  async fetchInsights(token: string): Promise<Insight[]> {
    console.log('[APEX] Fetching cross-app insights');
    
    try {
      const response = await fetch(`${BASE_URL}/insights`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const json = await response.json();
      
      if (json.success) {
        return json.data as Insight[];
      }
      return [];
    } catch (error) {
      console.error('[APEX] Insight Fetch Error:', error);
      return [];
    }
  }
};
