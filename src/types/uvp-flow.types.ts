/**
 * UVP Flow Type Definitions
 *
 * Data structures for the Enhanced MARBA UVP Flow
 * Created: 2025-11-18
 */

import type { ConfidenceScore } from '@/components/onboarding-v5/ConfidenceMeter';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';

// Re-export for convenience
export type { ConfidenceScore, DataSource };

/**
 * Step 1: Product/Service Discovery
 */
export interface ProductService {
  id: string;
  name: string;
  description: string;
  category: string;
  confidence: number; // 0-100 extraction confidence
  source: 'website' | 'manual';
  sourceUrl?: string;
  sourceExcerpt?: string;
  confirmed: boolean;
}

export interface ProductServiceCategory {
  id: string;
  name: string;
  items: ProductService[];
}

export interface ProductServiceData {
  categories: ProductServiceCategory[];
  extractionComplete: boolean;
  extractionConfidence: ConfidenceScore;
  sources: DataSource[];
}

/**
 * Step 2: Target Customer
 */
export interface CustomerProfile {
  id: string;
  statement: string; // Who is your target customer?
  industry?: string;
  companySize?: string;
  role?: string;
  confidence: ConfidenceScore;
  sources: DataSource[];
  evidenceQuotes: string[];
  isManualInput: boolean;
  // Emotional and functional drivers specific to this persona
  emotionalDrivers?: string[]; // e.g., "Fear of falling behind competitors", "Desire for recognition"
  functionalDrivers?: string[]; // e.g., "Need to reduce manual processes", "Must improve team efficiency"
}

/**
 * Step 3: Transformation Goal (What They're REALLY Buying)
 */
export interface TransformationGoal {
  id: string;
  statement: string; // What are they REALLY trying to achieve? (legacy format)
  outcomeStatement?: string; // JTBD-transformed outcome-focused version

  // Structured transformation format (preferred)
  who?: string; // Target customer segment
  before?: string; // Current pain/frustration/situation
  after?: string; // Desired outcome/future state
  how?: string; // Solution approach
  why?: string; // Emotional + functional benefit

  emotionalDrivers: string[];
  functionalDrivers: string[];
  eqScore: {
    emotional: number; // 0-100
    rational: number; // 0-100
    overall: number; // 0-100
  };
  confidence: ConfidenceScore;
  sources: DataSource[];
  customerQuotes: CustomerQuote[];
  isManualInput: boolean;
}

export interface CustomerQuote {
  id: string;
  text: string;
  source: DataSource;
  emotionalWeight: number; // 0-100
  relevanceScore: number; // 0-100
}

/**
 * Step 4: Unique Solution
 */
export interface UniqueSolution {
  id: string;
  statement: string; // How do you solve it differently?
  outcomeStatement?: string; // JTBD-transformed outcome-focused version
  differentiators: Differentiator[];
  methodology?: string;
  proprietaryApproach?: string;
  confidence: ConfidenceScore;
  sources: DataSource[];
  isManualInput: boolean;
}

export interface Differentiator {
  id: string;
  statement: string;
  evidence: string;
  source: DataSource;
  strengthScore: number; // 0-100
}

/**
 * Step 5: Key Benefit
 */
export interface KeyBenefit {
  id: string;
  statement: string; // What's the key benefit?
  outcomeStatement?: string; // JTBD-transformed outcome-focused version
  outcomeType: 'quantifiable' | 'qualitative' | 'mixed';
  metrics?: BenefitMetric[];
  industryComparison?: IndustryBenchmark;
  eqFraming: 'emotional' | 'rational' | 'balanced';
  confidence: ConfidenceScore;
  sources: DataSource[];
  isManualInput: boolean;
}

export interface BenefitMetric {
  id: string;
  metric: string; // e.g., "Revenue growth"
  value: string; // e.g., "40% increase"
  timeframe?: string; // e.g., "6 months"
  source: DataSource;
}

export interface IndustryBenchmark {
  industry: string;
  averageResult: string;
  yourResult: string;
  percentile?: number; // 0-100
  isAboveAverage: boolean;
}

/**
 * Step 6: Complete UVP
 */
export interface CompleteUVP {
  id: string;

  // Core components
  targetCustomer: CustomerProfile;
  transformationGoal: TransformationGoal;
  uniqueSolution: UniqueSolution;
  keyBenefit: KeyBenefit;

  // Synthesized outputs
  valuePropositionStatement: string;
  variations?: Array<{ uvp: string; style: string; wordCount: number }>; // Multiple UVP variations for user to choose from
  whyStatement: string; // Purpose/belief
  whatStatement: string; // Tangible offering
  howStatement: string; // Unique approach

  // Meta
  overallConfidence: ConfidenceScore;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Complete UVP Flow State
 */
export interface UVPFlowState {
  currentStep: 'products' | 'customer' | 'transformation' | 'solution' | 'benefit' | 'synthesis';

  productsServices?: ProductServiceData;
  targetCustomer?: CustomerProfile;
  transformationGoal?: TransformationGoal;
  uniqueSolution?: UniqueSolution;
  keyBenefit?: KeyBenefit;
  completeUVP?: CompleteUVP;

  isComplete: boolean;
}

/**
 * Extraction Service Response Types
 */
export interface ProductServiceExtractionResult {
  products: ProductService[];
  categories: string[];
  confidence: ConfidenceScore;
  sources: DataSource[];
  extractionTimestamp: Date;
}

export interface CustomerExtractionResult {
  profiles: Partial<CustomerProfile>[];
  confidence: ConfidenceScore;
  sources: DataSource[];
  evidenceQuotes: string[];
}

export interface TransformationExtractionResult {
  goals: Partial<TransformationGoal>[];
  customerQuotes: CustomerQuote[];
  emotionalDrivers: string[];
  functionalDrivers: string[];
  confidence: ConfidenceScore;
  sources: DataSource[];
}

export interface DifferentiatorExtractionResult {
  differentiators: Differentiator[];
  methodology?: string;
  proprietaryApproach?: string;
  confidence: ConfidenceScore;
  sources: DataSource[];
}

export interface BenefitExtractionResult {
  benefits: Partial<KeyBenefit>[];
  metrics: BenefitMetric[];
  confidence: ConfidenceScore;
  sources: DataSource[];
}
