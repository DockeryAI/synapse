/**
 * Zod Validation Schemas for UVP Data Structure
 *
 * Provides runtime validation and default values for UVP flow data
 * to prevent crashes from missing or corrupted data.
 *
 * Created: 2025-12-04
 */

import { z } from 'zod';

// ConfidenceScore schema with defaults
export const ConfidenceScoreSchema = z.object({
  overall: z.number().min(0).max(100).default(0),
  dataQuality: z.number().min(0).max(100).default(0),
  sourceCount: z.number().min(0).default(0),
  modelAgreement: z.number().min(0).max(100).default(0),
  reasoning: z.string().optional(),
}).default({
  overall: 0,
  dataQuality: 0,
  sourceCount: 0,
  modelAgreement: 0,
});

// DataSource schema - matches SourceCitation.tsx interface
export const DataSourceSchema = z.object({
  id: z.string(),
  type: z.enum(['website', 'reviews', 'youtube', 'social', 'competitor', 'api', 'manual', 'manual-input', 'testimonials', 'about', 'services']),
  name: z.string(),
  url: z.string().optional(),
  extractedAt: z.date(),
  reliability: z.number().min(0).max(100),
  dataPoints: z.number().min(0),
  excerpt: z.string().optional(),
});

// MarketGeography schema with defaults
export const MarketGeographySchema = z.object({
  scope: z.enum(['local', 'regional', 'national', 'global']).default('local'),
  headquarters: z.string().optional(),
  primaryRegions: z.array(z.string()).optional(),
  focusMarkets: z.array(z.string()).optional(),
  detectedFrom: z.enum(['domain', 'content', 'address', 'manual']).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).default({ scope: 'local' });

// CustomerProfile schema with null safety
export const CustomerProfileSchema = z.object({
  id: z.string(),
  statement: z.string(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  role: z.string().optional(),
  confidence: ConfidenceScoreSchema,
  sources: z.array(DataSourceSchema).default([]),
  evidenceQuotes: z.array(z.string()).default([]),
  isManualInput: z.boolean().default(false),
  emotionalDrivers: z.array(z.string()).default([]),
  functionalDrivers: z.array(z.string()).default([]),
  marketGeography: MarketGeographySchema.optional(),
});

// TransformationGoal schema with null safety
export const TransformationGoalSchema = z.object({
  id: z.string(),
  statement: z.string(),
  outcomeStatement: z.string().optional(),
  who: z.string().optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  how: z.string().optional(),
  why: z.string().optional(),
  emotionalDrivers: z.array(z.string()).default([]),
  functionalDrivers: z.array(z.string()).default([]),
  eqScore: z.object({
    emotional: z.number().min(0).max(100).default(0),
    rational: z.number().min(0).max(100).default(0),
    overall: z.number().min(0).max(100).default(0),
  }).default({ emotional: 0, rational: 0, overall: 0 }),
  confidence: ConfidenceScoreSchema,
  sources: z.array(DataSourceSchema).default([]),
  customerQuotes: z.array(z.object({
    id: z.string(),
    text: z.string(),
    source: DataSourceSchema,
    emotionalWeight: z.number().min(0).max(100).default(0),
    relevanceScore: z.number().min(0).max(100).default(0),
  })).default([]),
  isManualInput: z.boolean().default(false),
});

// Differentiator schema
export const DifferentiatorSchema = z.object({
  id: z.string(),
  statement: z.string(),
  evidence: z.string(),
  source: DataSourceSchema,
  strengthScore: z.number().min(0).max(100).default(0),
});

// UniqueSolution schema with null safety
export const UniqueSolutionSchema = z.object({
  id: z.string(),
  statement: z.string(),
  outcomeStatement: z.string().optional(),
  differentiators: z.array(DifferentiatorSchema).default([]),
  methodology: z.string().optional(),
  proprietaryApproach: z.string().optional(),
  confidence: ConfidenceScoreSchema,
  sources: z.array(DataSourceSchema).default([]),
  isManualInput: z.boolean().default(false),
});

// BenefitMetric schema
export const BenefitMetricSchema = z.object({
  id: z.string(),
  metric: z.string(),
  value: z.string(),
  timeframe: z.string().optional(),
  source: DataSourceSchema,
});

// KeyBenefit schema with null safety
export const KeyBenefitSchema = z.object({
  id: z.string(),
  statement: z.string(),
  outcomeStatement: z.string().optional(),
  outcomeType: z.enum(['quantifiable', 'qualitative', 'mixed']).default('qualitative'),
  metrics: z.array(BenefitMetricSchema).default([]),
  industryComparison: z.object({
    industry: z.string(),
    averageResult: z.string(),
    yourResult: z.string(),
    percentile: z.number().min(0).max(100).optional(),
    isAboveAverage: z.boolean(),
  }).optional(),
  eqFraming: z.enum(['emotional', 'rational', 'balanced']).default('balanced'),
  confidence: ConfidenceScoreSchema,
  sources: z.array(DataSourceSchema).default([]),
  isManualInput: z.boolean().default(false),
});

// CompleteUVP schema with comprehensive null safety
export const CompleteUVPSchema = z.object({
  id: z.string(),
  targetCustomer: CustomerProfileSchema,
  customerProfiles: z.array(CustomerProfileSchema).optional(),
  transformationGoal: TransformationGoalSchema,
  uniqueSolution: UniqueSolutionSchema,
  keyBenefit: KeyBenefitSchema,
  valuePropositionStatement: z.string(),
  variations: z.array(z.object({
    uvp: z.string(),
    style: z.string(),
    wordCount: z.number(),
  })).default([]),
  whyStatement: z.string().default(''),
  whatStatement: z.string().default(''),
  howStatement: z.string().default(''),
  overallConfidence: ConfidenceScoreSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  brandVoice: z.object({
    tone: z.array(z.string()).default([]),
    values: z.array(z.string()).default([]),
    personality: z.array(z.string()).default([]),
    vocabularyPatterns: z.array(z.string()).default([]),
    avoidWords: z.array(z.string()).default([]),
    signaturePhrases: z.array(z.string()).default([]),
    sentenceStyle: z.enum(['short', 'medium', 'long', 'mixed']).default('medium'),
    emotionalTemperature: z.enum(['warm', 'neutral', 'urgent', 'calm']).default('neutral'),
    confidence: z.number().min(0).max(100).default(0),
  }).optional(),
  customerStories: z.array(z.string()).default([]),
});

// Helper function to validate and provide defaults for CompleteUVP
export const validateCompleteUVP = (data: unknown): z.infer<typeof CompleteUVPSchema> => {
  try {
    return CompleteUVPSchema.parse(data);
  } catch (error) {
    console.error('CompleteUVP validation failed:', error);

    // If validation fails completely, return a minimal valid structure
    const now = new Date();
    return {
      id: `uvp-fallback-${Date.now()}`,
      targetCustomer: {
        id: `customer-fallback-${Date.now()}`,
        statement: 'Target customer data unavailable',
        confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: true,
        emotionalDrivers: [],
        functionalDrivers: [],
      },
      transformationGoal: {
        id: `transformation-fallback-${Date.now()}`,
        statement: 'Transformation goal data unavailable',
        emotionalDrivers: [],
        functionalDrivers: [],
        eqScore: { emotional: 0, rational: 0, overall: 0 },
        confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0 },
        sources: [],
        customerQuotes: [],
        isManualInput: true,
      },
      uniqueSolution: {
        id: `solution-fallback-${Date.now()}`,
        statement: 'Unique solution data unavailable',
        differentiators: [],
        confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0 },
        sources: [],
        isManualInput: true,
      },
      keyBenefit: {
        id: `benefit-fallback-${Date.now()}`,
        statement: 'Key benefit data unavailable',
        outcomeType: 'qualitative',
        metrics: [],
        eqFraming: 'balanced',
        confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0 },
        sources: [],
        isManualInput: true,
      },
      valuePropositionStatement: 'Value proposition synthesis unavailable - please complete the UVP flow',
      variations: [],
      whyStatement: '',
      whatStatement: '',
      howStatement: '',
      overallConfidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0 },
      createdAt: now,
      updatedAt: now,
      customerStories: [],
    };
  }
};

// Partial validation for individual components (useful for step-by-step validation)
export const validateCustomerProfile = (data: unknown) => {
  try {
    return CustomerProfileSchema.parse(data);
  } catch {
    return null;
  }
};

export const validateTransformationGoal = (data: unknown) => {
  try {
    return TransformationGoalSchema.parse(data);
  } catch {
    return null;
  }
};

export const validateUniqueSolution = (data: unknown) => {
  try {
    return UniqueSolutionSchema.parse(data);
  } catch {
    return null;
  }
};

export const validateKeyBenefit = (data: unknown) => {
  try {
    return KeyBenefitSchema.parse(data);
  } catch {
    return null;
  }
};

// Type exports for TypeScript
export type ValidatedCompleteUVP = z.infer<typeof CompleteUVPSchema>;
export type ValidatedCustomerProfile = z.infer<typeof CustomerProfileSchema>;
export type ValidatedConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;