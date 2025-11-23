/**
 * Segment Types for Dashboard V2
 * Customer persona mapping, purchase stage scoring, and segment alignment
 */

import { EmotionalTrigger } from './campaign.types';

/**
 * Purchase stage in the buyer journey
 */
export type PurchaseStage = 'awareness' | 'consideration' | 'decision';

/**
 * Customer persona profile with demographics and psychographics
 */
export interface CustomerPersona {
  id: string;
  name: string;
  description: string;
  demographics: {
    ageRange?: string;
    income?: string;
    location?: string;
    education?: string;
    occupation?: string;
  };
  psychographics: {
    goals: string[];
    painPoints: string[];
    values: string[];
    challenges: string[];
  };
  behavioralTraits: {
    decisionMakingStyle: 'analytical' | 'spontaneous' | 'collaborative' | 'research-heavy';
    informationPreference: 'visual' | 'text' | 'video' | 'data';
    purchaseDrivers: string[];
  };
  source: 'auto-detected' | 'manual' | 'imported';
  createdAt: string;
  updatedAt: string;
}

/**
 * Complete persona profile with EQ mapping and performance data
 */
export interface PersonaProfile {
  persona: CustomerPersona;
  eqMapping: SegmentEQMapping;
  purchaseStagePreferences: Record<PurchaseStage, number>; // 0-100 score
  contentPreferences: {
    formats: string[]; // 'blog', 'video', 'infographic', etc.
    tonality: 'professional' | 'casual' | 'technical' | 'friendly';
    messageLength: 'short' | 'medium' | 'long';
  };
  performanceData?: SegmentPerformanceData;
}

/**
 * EQ trigger mapping for a specific segment
 */
export interface SegmentEQMapping {
  personaId: string;
  triggerWeights: Record<EmotionalTrigger, number>; // 0-100 weight
  intensityModifier: number; // 0.5 to 2.0 (subtle to strong)
  platformAdjustments?: {
    linkedin?: Partial<Record<EmotionalTrigger, number>>;
    instagram?: Partial<Record<EmotionalTrigger, number>>;
    facebook?: Partial<Record<EmotionalTrigger, number>>;
    twitter?: Partial<Record<EmotionalTrigger, number>>;
  };
  historicalPerformance: {
    trigger: EmotionalTrigger;
    avgEngagement: number;
    avgConversion: number;
    sampleSize: number;
  }[];
}

/**
 * Segment match score for a piece of content
 */
export interface SegmentMatchScore {
  personaId: string;
  personaName: string;
  overallScore: number; // 0-100
  breakdown: {
    personaAlignment: number; // 0-100
    purchaseStageAlignment: number; // 0-100
    eqTriggerFit: number; // 0-100
    toneMatch: number; // 0-100
    messageLengthFit: number; // 0-100
  };
  improvementSuggestions: {
    area: string;
    currentScore: number;
    suggestion: string;
    potentialImpact: number; // expected score improvement
  }[];
  confidence: number; // 0-100
}

/**
 * Performance data for a specific segment
 */
export interface SegmentPerformanceData {
  personaId: string;
  timeRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalPieces: number;
    avgEngagementRate: number;
    avgConversionRate: number;
    avgCTR: number;
    bestPerformingTrigger: EmotionalTrigger;
    worstPerformingTrigger: EmotionalTrigger;
  };
  trendData: {
    date: string;
    engagementRate: number;
    conversionRate: number;
    triggerUsed: EmotionalTrigger;
  }[];
  platformBreakdown: {
    platform: string;
    engagementRate: number;
    conversionRate: number;
    pieceCount: number;
  }[];
}

/**
 * Purchase stage scoring result
 */
export interface PurchaseStageScore {
  contentId: string;
  detectedStage: PurchaseStage;
  stageScores: Record<PurchaseStage, number>; // 0-100 for each stage
  confidence: number; // 0-100
  indicators: {
    stage: PurchaseStage;
    indicator: string;
    weight: number;
  }[];
  recommendations: {
    currentStage: PurchaseStage;
    suggestion: string;
    examples: string[];
  }[];
}

/**
 * Persona assignment to a campaign piece
 */
export interface PersonaAssignment {
  pieceId: string;
  personaId: string;
  assignmentType: 'primary' | 'secondary';
  matchScore: number; // 0-100
  assignedAt: string;
  assignedBy: 'auto' | 'manual';
}

/**
 * Segment analytics summary
 */
export interface SegmentAnalyticsSummary {
  brandId: string;
  timeRange: {
    start: string;
    end: string;
  };
  totalPersonas: number;
  totalPieces: number;
  overallPerformance: {
    avgEngagementRate: number;
    avgConversionRate: number;
    bestPerformingPersona: string;
    worstPerformingPersona: string;
  };
  performanceHeatmap: {
    personaId: string;
    personaName: string;
    trigger: EmotionalTrigger;
    engagementRate: number;
    pieceCount: number;
  }[];
  gapAnalysis: {
    personaId: string;
    personaName: string;
    lastContentDate: string | null;
    daysSinceLastContent: number;
    recommendedAction: string;
  }[];
  triggerEffectiveness: {
    trigger: EmotionalTrigger;
    personaId: string;
    avgEngagement: number;
    avgConversion: number;
    usageCount: number;
    recommendation: 'increase' | 'decrease' | 'maintain';
  }[];
}

/**
 * Segment match calculation input
 */
export interface SegmentMatchInput {
  content: string;
  title?: string;
  emotionalTrigger?: EmotionalTrigger;
  platform?: string;
  purchaseStage?: PurchaseStage;
  contentType?: string;
}

/**
 * Persona mapping configuration
 */
export interface PersonaMappingConfig {
  autoDetectEnabled: boolean;
  minConfidenceThreshold: number; // 0-100
  allowMultiplePersonas: boolean;
  maxPersonasPerPiece: number;
  useHistoricalData: boolean;
  fallbackToPrimaryPersona: boolean;
}

/**
 * EQ optimization settings for a segment
 */
export interface SegmentEQOptimizationSettings {
  personaId: string;
  optimizationMode: 'conservative' | 'balanced' | 'aggressive';
  testVariations: boolean;
  learningRate: number; // 0-1, how quickly to adapt based on performance
  minSampleSize: number; // minimum pieces before making adjustments
  platformSpecificOptimization: boolean;
}

/**
 * Input for creating a new persona
 */
export interface CreatePersonaInput {
  name: string;
  description: string;
  demographics?: CustomerPersona['demographics'];
  psychographics: CustomerPersona['psychographics'];
  behavioralTraits: CustomerPersona['behavioralTraits'];
}

/**
 * Input for updating a persona
 */
export interface UpdatePersonaInput {
  name?: string;
  description?: string;
  demographics?: Partial<CustomerPersona['demographics']>;
  psychographics?: Partial<CustomerPersona['psychographics']>;
  behavioralTraits?: Partial<CustomerPersona['behavioralTraits']>;
}
