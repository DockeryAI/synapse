/**
 * Smart UVP Types with Source Verification
 *
 * CORE PRINCIPLE: ALL extracted data MUST include source URL attribution.
 * NO fabricated data allowed. Content generation blocked without verified sources.
 */

/**
 * Source Attribution
 * Every piece of extracted data must have a verifiable source
 */
export interface SourceAttribution {
  sourceUrl: string; // Full URL where this data was found
  sourceContext: string; // Human-readable context (e.g., "Found in 'About Us' section")
  extractedAt: Date; // When this was extracted
  pageTitle?: string; // Title of the source page
  sectionHeading?: string; // Section heading where found
}

/**
 * Verified Data Item
 * Base interface for all extracted UVP components with source verification
 */
export interface VerifiedDataItem {
  text: string; // The extracted text
  confidence: number; // 0-1 confidence score
  source: SourceAttribution; // REQUIRED: where this came from
  isVerified: boolean; // Has been verified by source check
  isUserConfirmed?: boolean; // User has confirmed this is accurate
}

/**
 * Customer Type
 * Who the business serves
 */
export interface CustomerType extends VerifiedDataItem {
  category: 'demographic' | 'industry' | 'role' | 'business-size' | 'other';
  isPrimary?: boolean; // Is this the #1 customer?
}

/**
 * Service or Product
 * What the business offers
 */
export interface ServiceProduct extends VerifiedDataItem {
  type: 'service' | 'product' | 'package';
  category?: string; // e.g., "Emergency Services", "Consulting"
  isCore?: boolean; // Is this a core offering?
}

/**
 * Problem Solved
 * What pain points the business addresses
 */
export interface ProblemSolved extends VerifiedDataItem {
  severity: 'high' | 'medium' | 'low'; // How severe is this problem?
  isPrimary?: boolean; // Is this the main problem they solve?
}

/**
 * Testimonial or Success Story
 * Social proof from customers
 */
export interface Testimonial extends VerifiedDataItem {
  customerName?: string;
  customerRole?: string;
  customerCompany?: string;
  hasMetrics?: boolean; // Contains specific numbers/results
  metrics?: {
    text: string; // e.g., "increased revenue 40%"
    value?: number; // 40
    unit?: string; // "%"
  }[];
  rating?: number; // Star rating if available
}

/**
 * Differentiator
 * What makes the business unique
 */
export interface Differentiator extends VerifiedDataItem {
  category: 'speed' | 'quality' | 'price' | 'expertise' | 'service' | 'technology' | 'other';
  isQuantifiable?: boolean; // Has specific numbers (e.g., "24/7", "15 years")
  quantification?: string; // The specific claim (e.g., "2-hour response time")
}

/**
 * Extracted UVP Data
 * Complete UVP extracted from website with source verification
 */
export interface ExtractedUVPData {
  websiteUrl: string;
  extractedAt: Date;

  // Core UVP components (all with source attribution)
  customerTypes: CustomerType[];
  services: ServiceProduct[];
  problemsSolved: ProblemSolved[];
  testimonials: Testimonial[];
  differentiators: Differentiator[];

  // Overall quality metrics
  overallConfidence: number; // 0-1 average confidence
  verificationRate: number; // % of items with valid sources
  completeness: number; // % of expected UVP components found

  // Source analysis
  sourcesAnalyzed: string[]; // All URLs analyzed
  sourceQuality: 'high' | 'medium' | 'low'; // Quality of sources

  // Warnings
  warnings: string[]; // Any issues with extraction or verification
}

/**
 * UVP Extraction Options
 */
export interface UVPExtractionOptions {
  websiteUrl: string;
  maxPagesToAnalyze?: number; // Default: 10
  minConfidence?: number; // Minimum confidence to include (default: 0.6)
  requireSources?: boolean; // Reject items without sources (default: true)
  includeTestimonials?: boolean; // Extract testimonials (default: true)
  analyzeSocialProof?: boolean; // Look for reviews, ratings (default: true)
}

/**
 * Source Verification Result
 */
export interface SourceVerificationResult {
  isValid: boolean;
  sourceUrl?: string;
  sourceContext?: string;
  confidence: number;
  reason?: string; // Why verification failed
  warnings?: string[];
}

/**
 * Content Verification Result
 * Result of verifying generated content has proper sources
 */
export interface ContentVerificationResult {
  isVerified: boolean;
  hasRequiredSources: boolean;
  sourcesFound: SourceAttribution[];
  missingSourcesFor: string[]; // Which claims lack sources
  confidenceScore: number;
  warnings: string[];
  recommendation: 'approve' | 'review' | 'reject';
}

/**
 * User Confirmation State
 * Tracks what user has confirmed/edited
 */
export interface UserConfirmationState {
  confirmedCustomerTypes: string[]; // IDs of confirmed items
  confirmedServices: string[];
  confirmedProblems: string[];
  confirmedTestimonials: string[];
  confirmedDifferentiators: string[];

  // Custom additions
  customCustomerTypes: CustomerType[];
  customServices: ServiceProduct[];
  customProblems: ProblemSolved[];
  customTestimonials: Testimonial[];
  customDifferentiators: Differentiator[];

  // Skipped sections
  skippedSections: ('customers' | 'services' | 'problems' | 'testimonials' | 'differentiators')[];
}

/**
 * Quick Refinement Data
 * Data from QuickRefinement modal
 */
export interface QuickRefinementData {
  primaryCustomer?: CustomerType; // The #1 customer
  topDifferentiator?: Differentiator; // Main differentiator
  bestSuccessStory?: Testimonial; // Best testimonial
}

/**
 * Final UVP Result
 * Combined extracted + user-confirmed data
 */
export interface FinalUVPResult {
  // Primary components
  primaryCustomer: CustomerType;
  topServices: ServiceProduct[]; // Top 3-5 services
  mainProblems: ProblemSolved[]; // Top 2-3 problems
  bestTestimonials: Testimonial[]; // Top 2-3 testimonials
  keyDifferentiators: Differentiator[]; // Top 2-3 differentiators

  // Quality metrics
  confidence: number; // Overall confidence
  verificationRate: number; // % with valid sources
  userConfirmationRate: number; // % user confirmed

  // Metadata
  extractedAt: Date;
  confirmedAt?: Date;
  refinedAt?: Date;
}

/**
 * UVP Extraction Error
 */
export interface UVPExtractionError {
  type: 'network' | 'parsing' | 'verification' | 'ai' | 'unknown';
  message: string;
  sourceUrl?: string;
  details?: any;
}

/**
 * Confidence Level
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

/**
 * Get confidence color for UI
 */
export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return 'green';
  if (score >= 0.6) return 'yellow';
  return 'red';
}

/**
 * Validation: Check if data item has valid source
 */
export function hasValidSource(item: VerifiedDataItem): boolean {
  return !!(
    item.source &&
    item.source.sourceUrl &&
    item.source.sourceUrl.startsWith('http') &&
    item.source.sourceContext
  );
}

/**
 * Validation: Check if UVP data meets minimum quality
 */
export function meetsMinimumQuality(data: ExtractedUVPData): {
  passes: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Need at least 1 customer type
  if (data.customerTypes.length === 0) {
    reasons.push('No customer types found');
  }

  // Need at least 1 service/product
  if (data.services.length === 0) {
    reasons.push('No services or products found');
  }

  // Need minimum confidence
  if (data.overallConfidence < 0.5) {
    reasons.push(`Confidence too low: ${(data.overallConfidence * 100).toFixed(0)}%`);
  }

  // Need high verification rate
  if (data.verificationRate < 0.8) {
    reasons.push(`Too many items without sources: ${(data.verificationRate * 100).toFixed(0)}% verified`);
  }

  return {
    passes: reasons.length === 0,
    reasons,
  };
}

/**
 * Create empty UVP data
 */
export function createEmptyUVPData(websiteUrl: string): ExtractedUVPData {
  return {
    websiteUrl,
    extractedAt: new Date(),
    customerTypes: [],
    services: [],
    problemsSolved: [],
    testimonials: [],
    differentiators: [],
    overallConfidence: 0,
    verificationRate: 0,
    completeness: 0,
    sourcesAnalyzed: [],
    sourceQuality: 'low',
    warnings: [],
  };
}
