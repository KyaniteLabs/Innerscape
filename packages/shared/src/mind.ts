export type InsightType = 'pattern' | 'correlation' | 'trend' | 'warning';

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  tags: string[];
  linkedCheckIns: string[];
  aiPromptUsed?: string;
}

export interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  dataPoints: string[];
  dismissedAt?: Date;
  actedUponAt?: Date;
  createdAt: Date;
}
