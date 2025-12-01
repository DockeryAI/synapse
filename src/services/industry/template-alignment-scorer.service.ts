/**
 * Template Alignment Scorer Service
 *
 * Scores industry profile templates against UVP signals to determine fit.
 * Used to identify templates that need refinement for specialized businesses.
 *
 * Created: 2025-11-30
 * Related: uvp-template-refiner.service.ts
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';

// =============================================================================
// TYPES
// =============================================================================

export interface AlignmentScore {
  overall: number;          // 0-1 aggregate score
  targetMatch: number;      // How well template matches target customer
  benefitMatch: number;     // How well template addresses key benefit
  solutionMatch: number;    // How well template aligns with unique solution
  industryMatch: number;    // Baseline NAICS match quality
  confidenceLevel: 'high' | 'medium' | 'low';
  needsRefinement: boolean; // True if score < 0.5
  refinementHints: string[];
}

export interface TemplateScoreResult {
  templateId: string;
  templateType: 'hook' | 'headline' | 'cta' | 'campaign';
  content: string;
  score: AlignmentScore;
}

export interface UVPSignals {
  targetIndustry: string[];       // Industries served by the business
  targetPersona: string[];        // Who they sell to
  keyPainPoints: string[];        // Pain points addressed
  transformationGoals: string[];  // What outcome they deliver
  differentiators: string[];      // Unique aspects
  complianceTerms: string[];      // Regulatory/compliance context
  solutionKeywords: string[];     // Core solution keywords
}

// =============================================================================
// SIGNAL EXTRACTION
// =============================================================================

/**
 * Extract alignment signals from a Complete UVP
 */
export function extractUVPSignals(uvp: CompleteUVP | null): UVPSignals {
  if (!uvp) {
    return {
      targetIndustry: [],
      targetPersona: [],
      keyPainPoints: [],
      transformationGoals: [],
      differentiators: [],
      complianceTerms: [],
      solutionKeywords: [],
    };
  }

  const signals: UVPSignals = {
    targetIndustry: [],
    targetPersona: [],
    keyPainPoints: [],
    transformationGoals: [],
    differentiators: [],
    complianceTerms: [],
    solutionKeywords: [],
  };

  // Extract from target customer statement
  const targetStatement = uvp.targetCustomer?.statement?.toLowerCase() || '';

  // Industry extraction patterns
  const industryPatterns = [
    /for\s+(\w+(?:\s+\w+)?)\s+(?:companies|businesses|firms|agencies)/gi,
    /in\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:industry|sector|space)/gi,
    /(\w+(?:\s+\w+)?)\s+(?:providers|vendors|professionals)/gi,
  ];

  industryPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(targetStatement)) !== null) {
      signals.targetIndustry.push(match[1].toLowerCase());
    }
  });

  // Extract persona keywords
  const personaKeywords = targetStatement.match(/\b(c-suite|ceo|cto|cfo|executives?|managers?|directors?|owners?|founders?|leaders?|professionals?|teams?|agents?|brokers?)\b/gi);
  if (personaKeywords) {
    signals.targetPersona.push(...personaKeywords.map(p => p.toLowerCase()));
  }

  // Extract from key benefit
  const benefitStatement = uvp.keyBenefit?.statement?.toLowerCase() || '';

  // Pain point patterns (typically "without", "avoid", "eliminate", etc.)
  const painPatterns = [
    /without\s+(.+?)(?:\.|,|and)/gi,
    /avoid(?:ing)?\s+(.+?)(?:\.|,|and)/gi,
    /eliminat(?:e|ing)\s+(.+?)(?:\.|,|and)/gi,
    /reduc(?:e|ing)\s+(.+?)(?:\.|,|and)/gi,
  ];

  painPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(benefitStatement)) !== null) {
      signals.keyPainPoints.push(match[1].trim());
    }
  });

  // Extract from unique solution
  const solutionStatement = uvp.uniqueSolution?.statement?.toLowerCase() || '';

  // Solution keywords (AI, automation, platform, etc.)
  const solutionKeywordPatterns = /\b(ai|artificial intelligence|machine learning|automation|platform|saas|cloud|conversational|chatbot|analytics|integration|api|dashboard)\b/gi;
  const solutionMatches = solutionStatement.match(solutionKeywordPatterns);
  if (solutionMatches) {
    signals.solutionKeywords.push(...solutionMatches.map(k => k.toLowerCase()));
  }

  // Compliance/regulatory terms
  const compliancePatterns = /\b(compliance|hipaa|gdpr|sox|pci|dss|regulatory|audit|security|encrypted|certified)\b/gi;
  const complianceMatches = solutionStatement.match(compliancePatterns);
  if (complianceMatches) {
    signals.complianceTerms.push(...complianceMatches.map(t => t.toLowerCase()));
  }

  // Extract transformation goals from unique solution
  const transformationPatterns = [
    /(?:transform(?:ing)?|convert(?:ing)?|turn(?:ing)?)\s+(.+?)\s+(?:into|to)/gi,
    /(?:enable(?:s)?|empower(?:s)?)\s+(.+?)\s+to/gi,
    /(?:deliver(?:s)?|provide(?:s)?)\s+(.+?)(?:\.|,|$)/gi,
  ];

  transformationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(solutionStatement)) !== null) {
      signals.transformationGoals.push(match[1].trim());
    }
  });

  // Differentiators often mentioned with "only", "first", "unique"
  const diffPatterns = [
    /(?:only|first|unique(?:ly)?)\s+(.+?)(?:\.|,|that)/gi,
    /unlike\s+(.+?),/gi,
  ];

  diffPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(solutionStatement)) !== null) {
      signals.differentiators.push(match[1].trim());
    }
  });

  return signals;
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate text similarity using Jaccard coefficient
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check if template contains any of the target terms
 */
function containsTerms(template: string, terms: string[]): number {
  if (terms.length === 0) return 0.5; // Neutral if no terms to match

  const templateLower = template.toLowerCase();
  let matches = 0;

  terms.forEach(term => {
    if (templateLower.includes(term.toLowerCase())) {
      matches++;
    }
  });

  return matches / terms.length;
}

/**
 * Score a single template against UVP signals
 */
export function scoreTemplate(
  template: string,
  signals: UVPSignals,
  templateType: 'hook' | 'headline' | 'cta' | 'campaign'
): AlignmentScore {
  // Calculate individual scores
  const targetMatch = Math.max(
    containsTerms(template, signals.targetIndustry),
    containsTerms(template, signals.targetPersona)
  );

  const benefitMatch = containsTerms(template, signals.keyPainPoints);

  const solutionMatch = Math.max(
    containsTerms(template, signals.solutionKeywords),
    containsTerms(template, signals.complianceTerms)
  );

  // Industry match is baseline (from NAICS) - assume 0.7 if we got to this point
  const industryMatch = 0.7;

  // Weight by template type
  let weights: { target: number; benefit: number; solution: number; industry: number };

  switch (templateType) {
    case 'hook':
      weights = { target: 0.3, benefit: 0.3, solution: 0.2, industry: 0.2 };
      break;
    case 'headline':
      weights = { target: 0.25, benefit: 0.35, solution: 0.2, industry: 0.2 };
      break;
    case 'cta':
      weights = { target: 0.2, benefit: 0.3, solution: 0.3, industry: 0.2 };
      break;
    case 'campaign':
      weights = { target: 0.3, benefit: 0.25, solution: 0.25, industry: 0.2 };
      break;
    default:
      weights = { target: 0.25, benefit: 0.25, solution: 0.25, industry: 0.25 };
  }

  const overall = (
    targetMatch * weights.target +
    benefitMatch * weights.benefit +
    solutionMatch * weights.solution +
    industryMatch * weights.industry
  );

  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (overall >= 0.7) confidenceLevel = 'high';
  else if (overall >= 0.5) confidenceLevel = 'medium';
  else confidenceLevel = 'low';

  // Generate refinement hints
  const refinementHints: string[] = [];

  if (targetMatch < 0.3 && signals.targetIndustry.length > 0) {
    refinementHints.push(`Add industry context: ${signals.targetIndustry.slice(0, 2).join(', ')}`);
  }

  if (benefitMatch < 0.3 && signals.keyPainPoints.length > 0) {
    refinementHints.push(`Address pain point: ${signals.keyPainPoints[0]}`);
  }

  if (solutionMatch < 0.3 && signals.solutionKeywords.length > 0) {
    refinementHints.push(`Include solution term: ${signals.solutionKeywords[0]}`);
  }

  if (signals.complianceTerms.length > 0 && !containsTerms(template, signals.complianceTerms)) {
    refinementHints.push(`Consider compliance angle: ${signals.complianceTerms[0]}`);
  }

  return {
    overall,
    targetMatch,
    benefitMatch,
    solutionMatch,
    industryMatch,
    confidenceLevel,
    needsRefinement: overall < 0.5,
    refinementHints,
  };
}

/**
 * Score multiple templates and return sorted by alignment
 */
export function scoreTemplates(
  templates: Array<{ id: string; content: string; type: 'hook' | 'headline' | 'cta' | 'campaign' }>,
  uvp: CompleteUVP | null
): TemplateScoreResult[] {
  const signals = extractUVPSignals(uvp);

  const results = templates.map(template => ({
    templateId: template.id,
    templateType: template.type,
    content: template.content,
    score: scoreTemplate(template.content, signals, template.type),
  }));

  // Sort by overall score descending
  return results.sort((a, b) => b.score.overall - a.score.overall);
}

/**
 * Get templates that need refinement
 */
export function getTemplatesNeedingRefinement(
  templates: Array<{ id: string; content: string; type: 'hook' | 'headline' | 'cta' | 'campaign' }>,
  uvp: CompleteUVP | null,
  threshold = 0.5
): TemplateScoreResult[] {
  const scored = scoreTemplates(templates, uvp);
  return scored.filter(t => t.score.overall < threshold);
}

// =============================================================================
// SERVICE SINGLETON
// =============================================================================

export const templateAlignmentScorerService = {
  extractUVPSignals,
  scoreTemplate,
  scoreTemplates,
  getTemplatesNeedingRefinement,
};

export default templateAlignmentScorerService;
