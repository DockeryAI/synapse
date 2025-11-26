/**
 * Types for Intelligence Library V2
 */

export type InsightType = 'customer' | 'market' | 'competition' | 'local' | 'opportunity';

export interface InsightSource {
  source: string;
  quote?: string;
  url?: string;
  timestamp?: string;
}

export interface CustomerSegments {
  who?: string[];
  what?: string[];
}

export interface InsightCard {
  id: string;
  type: InsightType;
  title: string;
  category: string;
  confidence: number;
  isTimeSensitive: boolean;
  description?: string;
  evidence?: string[];
  actionableInsight?: string;
  sources?: InsightSource[];
  rawData?: Record<string, any>;
  customerSegments?: CustomerSegments;
}

export interface InsightRecipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  emoji: string;
  insightTypes: InsightType[];
  minInsights: number;
  maxInsights: number;
  compatibleTemplates?: string[];
  primaryFramework?: 'problem-agitate-solution' | 'aida' | 'before-after-bridge' | 'hook-story-offer' | 'curiosity-gap';
}
