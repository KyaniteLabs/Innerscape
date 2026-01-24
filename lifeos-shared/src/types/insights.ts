/**
 * Cross-App Insight Types
 * 
 * Types for insights generated from analyzing data across all apps.
 */

export type InsightType = 'correlation' | 'pattern' | 'suggestion' | 'warning';
export type SourceApp = 'feelings' | 'brain' | 'habits' | 'combined';
export type InsightConfidence = 'low' | 'medium' | 'high';

export interface CrossInsight {
  id: string;
  userId: string;
  insightType: InsightType;
  title: string;
  content: string;
  sourceApp: SourceApp;
  confidence: InsightConfidence;
  actionTaken: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CorrelationInsight extends CrossInsight {
  insightType: 'correlation';
  metadata: {
    factorA: string;
    factorB: string;
    correlationStrength: number; // -1 to 1
    sampleSize: number;
  };
}

export interface PatternInsight extends CrossInsight {
  insightType: 'pattern';
  metadata: {
    patternDescription: string;
    occurrences: number;
    timeframe: string;
  };
}

export interface SuggestionInsight extends CrossInsight {
  insightType: 'suggestion';
  metadata: {
    action: string;
    expectedBenefit: string;
    basedOn: string[];
  };
}

export interface WarningInsight extends CrossInsight {
  insightType: 'warning';
  metadata: {
    concern: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  };
}

export interface InsightGenerationRequest {
  userId: string;
  timeframeDays: number;
  focusAreas?: SourceApp[];
}

export interface InsightGenerationResult {
  generatedAt: string;
  insightsCount: number;
  insights: CrossInsight[];
}
