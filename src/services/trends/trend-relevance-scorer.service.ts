/**
 * Trend Relevance Scorer Service
 *
 * Phase 3 of Trends 2.0 Build Plan
 * Scores each trend against UVP keywords using TF-IDF and cosine similarity.
 * Filters trends below relevance threshold (< 50%).
 *
 * Phase 11 Enhancement: Core Function Validation
 * - Validates trends against the core product function
 * - Adds outcome alignment scoring dimension
 * - Rejects trends that don't relate to what the product does
 *
 * Scoring dimensions:
 * - UVP pain points
 * - UVP differentiators
 * - Target customer description
 * - Industry keywords
 * - Core function alignment (Phase 11)
 *
 * Created: 2025-11-29
 * Updated: 2025-11-30 - Phase 11: Core function validation
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import { extractUVPKeywords, type UVPKeywords } from './uvp-query-generator.service';
import type { ValidatedTrend } from './multi-source-validator.service';
import { getCoreFunction, validateAgainstCoreFunction } from './outcome-query-generator.service';

// ============================================================================
// TYPES
// ============================================================================

export interface RelevanceScore {
  /** Overall relevance score (0-100) */
  overall: number;
  /** Breakdown by category */
  breakdown: {
    industry: number;
    painPoints: number;
    differentiators: number;
    customerDescriptors: number;
    products: number;
    emotionalDrivers: number;
    /** Phase 11: Core function alignment score */
    coreFunction: number;
  };
  /** Keywords that matched */
  matchedKeywords: string[];
  /** Why this trend is relevant */
  relevanceReason: string;
  /** Phase 11: Whether trend passes core function validation */
  passesCoreFunctionCheck: boolean;
  /** Phase 11: Reason for core function validation result */
  coreFunctionReason: string;
}

export interface ScoredTrend extends ValidatedTrend {
  relevance: RelevanceScore;
  /** Is above relevance threshold? */
  isRelevant: boolean;
}

export interface ScorerConfig {
  /** Minimum relevance score to pass (0-100) */
  relevanceThreshold: number;
  /** Weights for each scoring dimension */
  weights: {
    industry: number;
    painPoints: number;
    differentiators: number;
    customerDescriptors: number;
    products: number;
    emotionalDrivers: number;
    /** Phase 11: Weight for core function alignment */
    coreFunction: number;
  };
  /** Phase 11: Whether to require core function validation */
  requireCoreFunctionMatch: boolean;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: ScorerConfig = {
  relevanceThreshold: 35, // Minimum relevance to include trend (raised from 10 debug value)
  weights: {
    industry: 0.15,        // Industry match (insurance, financial services)
    painPoints: 0.15,      // Pain point match
    differentiators: 0.10, // Differentiator match
    customerDescriptors: 0.10, // Customer descriptor match
    products: 0.15,        // Product/service match (AI, automation, conversational)
    emotionalDrivers: 0.10,
    coreFunction: 0.25     // Phase 11: Core function alignment (HIGHEST WEIGHT)
  },
  requireCoreFunctionMatch: true // Phase 11: Require core function validation
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Tokenize and normalize text for scoring
 */
function normalizeText(text: string): string[] {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calculate keyword match score between trend and keyword list
 */
function calculateKeywordMatch(
  trendText: string,
  keywords: string[]
): { score: number; matches: string[] } {
  if (!trendText || keywords.length === 0) {
    return { score: 0, matches: [] };
  }

  const trendTokens = new Set(normalizeText(trendText));
  const matches: string[] = [];

  // Check each keyword/phrase
  keywords.forEach(keyword => {
    const keywordTokens = normalizeText(keyword);

    // Exact phrase match (higher value)
    if (trendText.toLowerCase().includes(keyword.toLowerCase())) {
      matches.push(keyword);
      return;
    }

    // Token overlap match
    const matchCount = keywordTokens.filter(t => trendTokens.has(t)).length;
    if (matchCount >= Math.ceil(keywordTokens.length * 0.6)) {
      matches.push(keyword);
    }
  });

  // Score based on match ratio with diminishing returns
  const matchRatio = matches.length / keywords.length;
  const score = Math.min(100, matchRatio * 120); // Slight boost, cap at 100

  return { score, matches };
}

/**
 * Score a single trend against UVP keywords
 * Phase 11: Now includes core function validation
 */
export function scoreTrendRelevance(
  trend: ValidatedTrend,
  uvpKeywords: UVPKeywords,
  config: Partial<ScorerConfig> = {},
  coreFunction?: string
): RelevanceScore {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Combine trend title and description for matching
  const trendText = `${trend.title} ${trend.description}`;

  // Calculate scores for each dimension
  const industryResult = calculateKeywordMatch(trendText, uvpKeywords.industry);
  const painPointResult = calculateKeywordMatch(trendText, uvpKeywords.painPoints);
  const diffResult = calculateKeywordMatch(trendText, uvpKeywords.differentiators);
  const customerResult = calculateKeywordMatch(trendText, uvpKeywords.customerDescriptors);
  const productResult = calculateKeywordMatch(trendText, uvpKeywords.products);
  const emotionalResult = calculateKeywordMatch(trendText, [
    ...uvpKeywords.emotionalDrivers,
    ...uvpKeywords.functionalDrivers
  ]);

  // Phase 11: Core function validation
  let coreFunctionScore = 0;
  let passesCoreFunctionCheck = true;
  let coreFunctionReason = 'No core function defined';

  if (coreFunction) {
    const validation = validateAgainstCoreFunction(trend.title, trend.description, coreFunction);
    passesCoreFunctionCheck = validation.isValid;
    coreFunctionReason = validation.reason;
    coreFunctionScore = validation.isValid ? 100 : 0;
  }

  const breakdown = {
    industry: industryResult.score,
    painPoints: painPointResult.score,
    differentiators: diffResult.score,
    customerDescriptors: customerResult.score,
    products: productResult.score,
    emotionalDrivers: emotionalResult.score,
    coreFunction: coreFunctionScore
  };

  // Collect all matched keywords
  const matchedKeywords = [
    ...industryResult.matches,
    ...painPointResult.matches,
    ...diffResult.matches,
    ...customerResult.matches,
    ...productResult.matches,
    ...emotionalResult.matches
  ];

  // Calculate weighted overall score
  const weights = cfg.weights;
  const overall = Math.round(
    (breakdown.industry * weights.industry) +
    (breakdown.painPoints * weights.painPoints) +
    (breakdown.differentiators * weights.differentiators) +
    (breakdown.customerDescriptors * weights.customerDescriptors) +
    (breakdown.products * weights.products) +
    (breakdown.emotionalDrivers * weights.emotionalDrivers) +
    (breakdown.coreFunction * weights.coreFunction)
  );

  // Generate relevance reason
  const relevanceReason = generateRelevanceReason(breakdown, matchedKeywords);

  return {
    overall,
    breakdown,
    matchedKeywords: [...new Set(matchedKeywords)],
    relevanceReason,
    passesCoreFunctionCheck,
    coreFunctionReason
  };
}

/**
 * Generate human-readable relevance reason
 */
function generateRelevanceReason(
  breakdown: RelevanceScore['breakdown'],
  matchedKeywords: string[]
): string {
  const reasons: string[] = [];

  // Find top scoring dimensions
  const dimensions = Object.entries(breakdown)
    .filter(([_, score]) => score > 30)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  dimensions.forEach(([dim, score]) => {
    switch (dim) {
      case 'industry':
        reasons.push('Matches your industry');
        break;
      case 'painPoints':
        reasons.push('Addresses customer pain points');
        break;
      case 'differentiators':
        reasons.push('Relates to your differentiators');
        break;
      case 'customerDescriptors':
        reasons.push('Targets your audience');
        break;
      case 'products':
        reasons.push('Relevant to your products/services');
        break;
      case 'emotionalDrivers':
        reasons.push('Connects to customer motivations');
        break;
      case 'coreFunction':
        reasons.push('Aligns with your core business function');
        break;
    }
  });

  if (reasons.length === 0 && matchedKeywords.length > 0) {
    reasons.push(`Matches: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }

  return reasons.join('. ') || 'General industry relevance';
}

// ============================================================================
// BATCH SCORING
// ============================================================================

/**
 * Core keywords by business category
 * Trends must match at least one core keyword to be relevant
 * This prevents generic news (e.g., "Coinbase complaint") from showing
 */
const CORE_KEYWORDS_BY_CATEGORY: Record<string, string[]> = {
  // SaaS B2B - must mention AI/automation/conversational tech
  national_saas_b2b: [
    // AI/ML
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt',
    'generative', 'neural', 'deep learning',
    // Automation
    'automation', 'automate', 'automated', 'rpa', 'robotic process',
    // Conversational
    'conversational', 'chatbot', 'chat bot', 'virtual assistant', 'voice bot',
    'voicebot', 'bot', 'agent', 'dialogue', 'dialog',
    // Customer engagement tech
    'self-service', 'self service', 'omnichannel', 'digital transformation',
    'cx platform', 'contact center ai', 'ccai',
    // Specific tech
    'nlp', 'natural language', 'speech recognition', 'text to speech', 'tts',
    'ivr', 'interactive voice', 'saas', 'platform', 'software', 'cloud'
  ],

  // Local B2B Service (HVAC, IT) - must mention service/industry terms
  local_b2b_service: [
    'hvac', 'heating', 'cooling', 'air conditioning', 'ventilation',
    'commercial', 'industrial', 'maintenance', 'repair', 'installation',
    'energy efficiency', 'building', 'facility', 'contractor',
    'service', 'technician', 'equipment', 'system'
  ],

  // Local B2C Service (Dental, Salon) - must mention consumer service terms
  local_b2c_service: [
    'appointment', 'booking', 'scheduling', 'patient', 'customer',
    'dental', 'medical', 'health', 'wellness', 'beauty', 'salon',
    'spa', 'clinic', 'practice', 'care', 'service', 'treatment',
    'consultation', 'experience'
  ],

  // Regional B2B Agency (Marketing, Consulting) - must mention business service terms
  regional_b2b_agency: [
    'marketing', 'advertising', 'agency', 'consulting', 'strategy',
    'digital', 'campaign', 'brand', 'client', 'roi', 'analytics',
    'content', 'social media', 'seo', 'ppc', 'lead generation',
    'b2b', 'business', 'professional'
  ],

  // Regional B2C Retail - must mention retail/commerce terms
  regional_b2c_retail: [
    'retail', 'store', 'shop', 'ecommerce', 'e-commerce', 'online',
    'inventory', 'product', 'merchandise', 'consumer', 'shopping',
    'checkout', 'payment', 'delivery', 'fulfillment', 'customer'
  ],

  // National Product B2C - must mention product/brand terms
  national_product_b2c: [
    'product', 'brand', 'consumer', 'launch', 'market', 'retail',
    'direct to consumer', 'd2c', 'dtc', 'ecommerce', 'amazon',
    'review', 'rating', 'influencer', 'social', 'viral', 'trend'
  ]
};

// Default keywords if category not found
const DEFAULT_CORE_KEYWORDS = [
  'trend', 'growth', 'innovation', 'technology', 'digital',
  'automation', 'efficiency', 'optimization', 'strategy'
];

/**
 * NEGATIVE KEYWORDS BY CATEGORY
 * Trends containing these are REJECTED for that category
 * This prevents cross-contamination (e.g., HVAC trends for SaaS company)
 */
const NEGATIVE_KEYWORDS_BY_CATEGORY: Record<string, string[]> = {
  // SaaS B2B - reject physical service industries
  national_saas_b2b: [
    // Physical trades
    'hvac', 'plumbing', 'roofing', 'landscaping', 'electrical contractor',
    'air conditioning repair', 'heating repair', 'furnace', 'ductwork',
    'air conditioning', 'heating system', 'cooling system',
    // Crypto/unrelated
    'coinbase', 'bitcoin', 'ethereum', 'crypto wallet', 'nft',
    'cryptocurrency', 'blockchain wallet',
    // Physical healthcare
    'dental appointment', 'teeth cleaning', 'root canal', 'dentist',
    'orthodontist', 'braces',
    // Physical retail specific
    'store hours', 'in-store pickup', 'retail location',
    // Food service
    'restaurant reservation', 'food delivery driver', 'menu prices',
    // Automotive
    'car repair', 'oil change', 'tire rotation', 'auto mechanic',
    // Real estate physical
    'home inspection', 'property viewing', 'open house'
  ],

  // Local B2B Service - reject software/SaaS specific terms
  local_b2b_service: [
    'saas', 'subscription model', 'api integration', 'devops',
    'cloud native', 'microservices', 'kubernetes'
  ],

  // Other categories have fewer conflicts
  local_b2c_service: [],
  regional_b2b_agency: [],
  regional_b2c_retail: [],
  national_product_b2c: []
};

/**
 * Check if trend contains a negative keyword for the category
 */
function hasNegativeKeyword(trendText: string, category?: string): { has: boolean; keyword?: string } {
  if (!category) return { has: false };

  const text = trendText.toLowerCase();
  const negatives = NEGATIVE_KEYWORDS_BY_CATEGORY[category] || [];

  for (const negative of negatives) {
    if (text.includes(negative)) {
      return { has: true, keyword: negative };
    }
  }

  return { has: false };
}

/**
 * Check if trend contains at least one core keyword for the given category
 */
function hasCoreKeyword(trendText: string, category?: string): boolean {
  const text = trendText.toLowerCase();
  const keywords = category && CORE_KEYWORDS_BY_CATEGORY[category]
    ? CORE_KEYWORDS_BY_CATEGORY[category]
    : DEFAULT_CORE_KEYWORDS;

  return keywords.some(kw => text.includes(kw));
}

/**
 * Score all trends against UVP
 * Phase 11: Now includes core function validation
 */
export function scoreTrends(
  trends: ValidatedTrend[],
  uvp: CompleteUVP,
  config: Partial<ScorerConfig> = {},
  businessCategory?: string
): ScoredTrend[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const uvpKeywords = extractUVPKeywords(uvp);

  // Phase 11: Extract core function from UVP
  const coreFunction = getCoreFunction(uvp);

  console.log(`[TrendRelevanceScorer] Scoring ${trends.length} trends against UVP`);
  console.log(`[TrendRelevanceScorer] Business category: ${businessCategory || 'unknown'}`);
  console.log(`[TrendRelevanceScorer] Core function: "${coreFunction}"`);
  console.log(`[TrendRelevanceScorer] UVP keywords:`, {
    industry: uvpKeywords.industry.length,
    painPoints: uvpKeywords.painPoints.length,
    differentiators: uvpKeywords.differentiators.length,
    products: uvpKeywords.products.length
  });

  const scoredTrends: ScoredTrend[] = trends.map(trend => {
    const trendText = `${trend.title} ${trend.description}`;

    // PHASE 11 FIX: Check negative keywords FIRST - immediate rejection
    const negativeCheck = hasNegativeKeyword(trendText, businessCategory);
    if (negativeCheck.has) {
      console.log(`[TrendRelevanceScorer] REJECTED (negative keyword "${negativeCheck.keyword}"): "${trend.title.substring(0, 50)}..."`);
      // Return with isRelevant = false and zero scores
      return {
        ...trend,
        relevance: {
          overall: 0,
          breakdown: { industry: 0, painPoints: 0, differentiators: 0, customerDescriptors: 0, products: 0, emotionalDrivers: 0, coreFunction: 0 },
          matchedKeywords: [],
          relevanceReason: `Rejected: contains "${negativeCheck.keyword}"`,
          passesCoreFunctionCheck: false,
          coreFunctionReason: `Contains negative keyword: ${negativeCheck.keyword}`
        },
        isRelevant: false
      };
    }

    // Phase 11: Pass core function to scoring
    const relevance = scoreTrendRelevance(trend, uvpKeywords, cfg, coreFunction);

    // CORE KEYWORD CHECK: Trend must mention category-relevant keywords
    // Otherwise it's just generic news (e.g., "Coinbase complaint" for SaaS)
    const hasCoreTech = hasCoreKeyword(trendText, businessCategory);
    const meetsThreshold = relevance.overall >= cfg.relevanceThreshold;

    // Phase 11: Core function validation as an additional filter
    const passesCoreFunctionCheck = relevance.passesCoreFunctionCheck;

    // Must meet threshold AND (have core keyword OR pass core function check OR very high relevance 70%+)
    // Core function check is the new primary filter - if it fails and requireCoreFunctionMatch is true, reject
    let isRelevant = meetsThreshold && (hasCoreTech || relevance.overall >= 70);

    // Phase 11: If requireCoreFunctionMatch is enabled, also require core function validation
    if (cfg.requireCoreFunctionMatch && !passesCoreFunctionCheck) {
      // Still allow if very high relevance OR if it has core keywords (backwards compatibility)
      if (relevance.overall < 70 && !hasCoreTech) {
        isRelevant = false;
        console.log(`[TrendRelevanceScorer] Filtered (fails core function): "${trend.title.substring(0, 50)}..." - ${relevance.coreFunctionReason}`);
      }
    }

    if (!hasCoreTech && meetsThreshold && !passesCoreFunctionCheck) {
      console.log(`[TrendRelevanceScorer] Filtered out (no core keywords, no core function match): "${trend.title.substring(0, 50)}..."`);
    }

    return {
      ...trend,
      relevance,
      isRelevant
    };
  });

  // Sort by relevance score (highest first)
  scoredTrends.sort((a, b) => b.relevance.overall - a.relevance.overall);

  const relevantCount = scoredTrends.filter(t => t.isRelevant).length;
  const coreFunctionPassCount = scoredTrends.filter(t => t.relevance.passesCoreFunctionCheck).length;
  console.log(`[TrendRelevanceScorer] ${relevantCount}/${scoredTrends.length} trends above ${cfg.relevanceThreshold}% threshold`);
  console.log(`[TrendRelevanceScorer] ${coreFunctionPassCount}/${scoredTrends.length} trends pass core function check`);

  return scoredTrends;
}

/**
 * Get only relevant trends (above threshold)
 */
export function getRelevantOnly(
  trends: ScoredTrend[],
  threshold?: number
): ScoredTrend[] {
  if (threshold !== undefined) {
    return trends.filter(t => t.relevance.overall >= threshold);
  }
  return trends.filter(t => t.isRelevant);
}

/**
 * Get scoring statistics
 */
export function getScoringStats(trends: ScoredTrend[]): {
  total: number;
  relevant: number;
  irrelevant: number;
  avgRelevance: number;
  topDimension: string;
} {
  const relevant = trends.filter(t => t.isRelevant);

  // Find which dimension scored highest on average
  const dimensionTotals: Record<string, number> = {
    industry: 0,
    painPoints: 0,
    differentiators: 0,
    customerDescriptors: 0,
    products: 0,
    emotionalDrivers: 0,
    coreFunction: 0
  };

  trends.forEach(t => {
    Object.entries(t.relevance.breakdown).forEach(([dim, score]) => {
      dimensionTotals[dim] += score;
    });
  });

  const topDimension = Object.entries(dimensionTotals)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    total: trends.length,
    relevant: relevant.length,
    irrelevant: trends.length - relevant.length,
    avgRelevance: trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.relevance.overall, 0) / trends.length)
      : 0,
    topDimension
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TrendRelevanceScorer = {
  score: scoreTrendRelevance,
  scoreTrends,
  getRelevantOnly,
  getStats: getScoringStats,
  DEFAULT_CONFIG
};

export default TrendRelevanceScorer;
