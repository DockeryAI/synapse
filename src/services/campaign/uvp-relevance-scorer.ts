/**
 * UVP Relevance Scorer
 *
 * Phase D - Item #31: AI Picks UVP Scoring
 *
 * Scores SmartPicks against the user's UVP to filter low-relevance suggestions.
 * Picks with <30% relevance are hidden by default.
 *
 * Created: 2025-11-26
 */

import type { SmartPick } from '@/types/smart-picks.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

/**
 * UVP Relevance Score Result
 */
export interface UVPRelevanceScore {
  pickId: string;
  relevanceScore: number; // 0-100
  reasoning: string[];
  matchedAspects: {
    targetCustomer: number; // 0-100
    painPoints: number; // 0-100
    transformation: number; // 0-100
    uniqueSolution: number; // 0-100
    keyBenefit: number; // 0-100
  };
  isRelevant: boolean; // true if score >= 30%
}

/**
 * Scored SmartPick with UVP relevance
 */
export interface ScoredSmartPick extends SmartPick {
  uvpRelevance: UVPRelevanceScore;
}

/**
 * Configuration for relevance scoring
 */
export interface ScoringConfig {
  minRelevanceThreshold: number; // Default 30
  weights: {
    targetCustomer: number;
    painPoints: number;
    transformation: number;
    uniqueSolution: number;
    keyBenefit: number;
  };
}

const DEFAULT_CONFIG: ScoringConfig = {
  minRelevanceThreshold: 30,
  weights: {
    targetCustomer: 0.25,
    painPoints: 0.20,
    transformation: 0.25,
    uniqueSolution: 0.15,
    keyBenefit: 0.15,
  },
};

/**
 * Extract keywords from text for matching
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'that', 'this', 'these', 'those', 'our',
    'your', 'their', 'we', 'you', 'they', 'who', 'what', 'how', 'when', 'where',
    'why', 'which', 'it', 'its', 'as', 'if', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'same', 'such', 'more',
    'most', 'other', 'some', 'any', 'each', 'every', 'all', 'both', 'few',
    'many', 'much', 'own', 'just', 'also', 'than', 'then', 'now', 'here',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate keyword overlap score between two texts
 */
function calculateKeywordOverlap(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  let matchCount = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      matchCount++;
    }
  }

  // Jaccard-like similarity
  const unionSize = set1.size + set2.size - matchCount;
  return unionSize > 0 ? Math.round((matchCount / unionSize) * 100) : 0;
}

/**
 * Score a single SmartPick against UVP
 */
export function scorePickAgainstUVP(
  pick: SmartPick,
  uvp: CompleteUVP,
  config: ScoringConfig = DEFAULT_CONFIG
): UVPRelevanceScore {
  const pickText = `${pick.title} ${pick.description} ${pick.reasoning} ${pick.preview?.headline || ''} ${pick.preview?.hook || ''}`;
  const reasoning: string[] = [];

  // Score each UVP aspect
  const matchedAspects = {
    targetCustomer: 0,
    painPoints: 0,
    transformation: 0,
    uniqueSolution: 0,
    keyBenefit: 0,
  };

  // Target Customer matching
  if (uvp.targetCustomer?.statement) {
    matchedAspects.targetCustomer = calculateKeywordOverlap(pickText, uvp.targetCustomer.statement);
    if (matchedAspects.targetCustomer >= 30) {
      reasoning.push(`Aligns with target customer: ${uvp.targetCustomer.industry || 'your audience'}`);
    }
  }

  // Pain Points / Transformation "Before" state
  if (uvp.transformationGoal?.before || uvp.transformationGoal?.statement) {
    const painPointText = uvp.transformationGoal.before || uvp.transformationGoal.statement;
    matchedAspects.painPoints = calculateKeywordOverlap(pickText, painPointText);
    if (matchedAspects.painPoints >= 30) {
      reasoning.push('Addresses customer pain points');
    }
  }

  // Transformation / "After" state
  if (uvp.transformationGoal?.after || uvp.transformationGoal?.outcomeStatement) {
    const transformText = uvp.transformationGoal.after || uvp.transformationGoal.outcomeStatement || '';
    matchedAspects.transformation = calculateKeywordOverlap(pickText, transformText);
    if (matchedAspects.transformation >= 30) {
      reasoning.push('Supports transformation goals');
    }
  }

  // Unique Solution matching
  if (uvp.uniqueSolution?.statement) {
    const solutionText = `${uvp.uniqueSolution.statement} ${uvp.uniqueSolution.methodology || ''} ${uvp.uniqueSolution.differentiators?.map(d => d.statement).join(' ') || ''}`;
    matchedAspects.uniqueSolution = calculateKeywordOverlap(pickText, solutionText);
    if (matchedAspects.uniqueSolution >= 30) {
      reasoning.push('Highlights your unique approach');
    }
  }

  // Key Benefit matching
  if (uvp.keyBenefit?.statement) {
    const benefitText = `${uvp.keyBenefit.statement} ${uvp.keyBenefit.outcomeStatement || ''} ${uvp.keyBenefit.metrics?.map(m => m.metric).join(' ') || ''}`;
    matchedAspects.keyBenefit = calculateKeywordOverlap(pickText, benefitText);
    if (matchedAspects.keyBenefit >= 30) {
      reasoning.push('Communicates key benefits');
    }
  }

  // Calculate weighted overall score
  const relevanceScore = Math.round(
    matchedAspects.targetCustomer * config.weights.targetCustomer +
    matchedAspects.painPoints * config.weights.painPoints +
    matchedAspects.transformation * config.weights.transformation +
    matchedAspects.uniqueSolution * config.weights.uniqueSolution +
    matchedAspects.keyBenefit * config.weights.keyBenefit
  );

  // Boost score if pick directly mentions UVP themes
  const uvpStatement = uvp.valuePropositionStatement || '';
  if (uvpStatement && calculateKeywordOverlap(pickText, uvpStatement) > 20) {
    reasoning.push('Directly supports your value proposition');
  }

  // Add generic reasoning if no specific matches
  if (reasoning.length === 0) {
    if (relevanceScore >= 30) {
      reasoning.push('Generally aligned with your business focus');
    } else {
      reasoning.push('Limited alignment with your UVP - may be worth exploring');
    }
  }

  return {
    pickId: pick.id,
    relevanceScore,
    reasoning,
    matchedAspects,
    isRelevant: relevanceScore >= config.minRelevanceThreshold,
  };
}

/**
 * Score all SmartPicks against UVP
 */
export function scorePicksAgainstUVP(
  picks: SmartPick[],
  uvp: CompleteUVP | null,
  config: ScoringConfig = DEFAULT_CONFIG
): ScoredSmartPick[] {
  if (!uvp) {
    // If no UVP, all picks are considered relevant with a neutral score
    return picks.map(pick => ({
      ...pick,
      uvpRelevance: {
        pickId: pick.id,
        relevanceScore: 50,
        reasoning: ['UVP data not available - showing all suggestions'],
        matchedAspects: {
          targetCustomer: 50,
          painPoints: 50,
          transformation: 50,
          uniqueSolution: 50,
          keyBenefit: 50,
        },
        isRelevant: true,
      },
    }));
  }

  return picks.map(pick => ({
    ...pick,
    uvpRelevance: scorePickAgainstUVP(pick, uvp, config),
  }));
}

/**
 * Filter picks by relevance threshold
 */
export function filterByRelevance(
  scoredPicks: ScoredSmartPick[],
  minRelevance: number = 30
): {
  relevant: ScoredSmartPick[];
  filtered: ScoredSmartPick[];
} {
  const relevant: ScoredSmartPick[] = [];
  const filtered: ScoredSmartPick[] = [];

  for (const pick of scoredPicks) {
    if (pick.uvpRelevance.relevanceScore >= minRelevance) {
      relevant.push(pick);
    } else {
      filtered.push(pick);
    }
  }

  // Sort relevant picks by relevance score (highest first)
  relevant.sort((a, b) => b.uvpRelevance.relevanceScore - a.uvpRelevance.relevanceScore);

  return { relevant, filtered };
}

/**
 * Get UVP from DeepContext (if available)
 */
export function extractUVPFromContext(context: DeepContext): Partial<CompleteUVP> | null {
  // Try to extract UVP-like data from DeepContext
  const business = context.business;

  if (!business) return null;

  // Build a partial UVP from available context
  const partialUVP: Partial<CompleteUVP> = {
    targetCustomer: {
      id: 'context-derived',
      statement: business.goals?.[0]?.goal || '',
      confidence: { overall: 70, dataQuality: 70, sourceCount: 1, modelAgreement: 70 },
      sources: [],
      evidenceQuotes: [],
      isManualInput: false,
    },
    uniqueSolution: {
      id: 'context-derived',
      statement: business.uniqueAdvantages?.[0] || '',
      differentiators: [],
      confidence: { overall: 70, dataQuality: 70, sourceCount: 1, modelAgreement: 70 },
      sources: [],
      isManualInput: false,
    },
    valuePropositionStatement: business.uniqueAdvantages?.join('. ') || '',
  };

  return Object.keys(partialUVP).length > 0 ? partialUVP : null;
}
