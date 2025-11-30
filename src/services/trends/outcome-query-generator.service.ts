/**
 * Outcome Query Generator Service
 *
 * Phase 11 of Trends 2.0 Build Plan
 * Generates outcome-driven queries that focus on customer transformation goals
 * rather than product keywords.
 *
 * Core Principle: Query by what buyers are TRYING TO ACCOMPLISH, not what we sell.
 *
 * Query Types:
 * 1. Transformation - What's the customer's desired end state?
 * 2. Problem State - What pain are they trying to escape?
 * 3. Buyer Priority - What does the decision-maker care about?
 * 4. Competitor Gap - What can't current solutions do?
 * 5. Outcome Metric - What KPI are they trying to improve?
 *
 * Created: 2025-11-30
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessCategory } from './trend-category-router.service';
import type { GeneratedQuery } from './uvp-query-generator.service';

// ============================================================================
// TYPES
// ============================================================================

export type OutcomeQueryType =
  | 'transformation'
  | 'problem_state'
  | 'buyer_priority'
  | 'competitor_gap'
  | 'outcome_metric';

export interface OutcomeQuery extends GeneratedQuery {
  outcomeType: OutcomeQueryType;
}

export interface ExtractedOutcomes {
  /** Desired end states from transformation goal */
  transformations: string[];
  /** Problems/pain states from "before" text */
  problemStates: string[];
  /** Buyer role priorities */
  buyerPriorities: string[];
  /** Competitor/alternative limitations */
  competitorGaps: string[];
  /** Outcome metrics to improve */
  outcomeMetrics: string[];
  /** Core product function (what problem does it solve) */
  coreFunction: string;
}

// ============================================================================
// CATEGORY-SPECIFIC OUTCOME TEMPLATES
// ============================================================================

/**
 * Templates for each business category
 * These provide fallback queries when UVP extraction is insufficient
 */
const CATEGORY_OUTCOME_TEMPLATES: Record<BusinessCategory, {
  transformation: string[];
  problemState: string[];
  buyerPriority: string[];
  competitorGap: string[];
  outcomeMetric: string[];
}> = {
  // Category 1: Local Service B2B (Commercial HVAC, IT Services)
  local_b2b_service: {
    transformation: [
      'how to reduce {industry} downtime',
      'how to improve {industry} response time',
      'how to scale {industry} operations'
    ],
    problemState: [
      '{industry} equipment failure problems',
      '{industry} maintenance challenges',
      '{industry} service reliability issues'
    ],
    buyerPriority: [
      'facilities manager {industry} priorities',
      'operations director {industry} concerns',
      'building manager {industry} needs'
    ],
    competitorGap: [
      'problems with {industry} service contracts',
      'limitations of {industry} preventive maintenance',
      '{industry} vendor reliability issues'
    ],
    outcomeMetric: [
      'improving {industry} uptime',
      'reducing {industry} maintenance costs',
      'increasing {industry} efficiency'
    ]
  },

  // Category 2: Local Service B2C (Dental, Salon, Restaurant)
  local_b2c_service: {
    transformation: [
      'how to reduce patient wait times {industry}',
      'how to improve customer retention {industry}',
      'how to increase {industry} bookings'
    ],
    problemState: [
      '{industry} no-show problems',
      '{industry} scheduling challenges',
      '{industry} customer complaints'
    ],
    buyerPriority: [
      '{industry} practice owner priorities',
      '{industry} manager challenges',
      'small business {industry} concerns'
    ],
    competitorGap: [
      'limitations of {industry} scheduling software',
      'problems with {industry} booking systems',
      '{industry} management software issues'
    ],
    outcomeMetric: [
      'improving patient satisfaction {industry}',
      'increasing {industry} revenue per customer',
      'reducing {industry} operational costs'
    ]
  },

  // Category 3: Regional B2B Agency (Marketing, Accounting, Consulting)
  regional_b2b_agency: {
    transformation: [
      'how to prove {industry} ROI to clients',
      'how to scale {industry} operations',
      'how to improve {industry} client results'
    ],
    problemState: [
      '{industry} client churn problems',
      '{industry} talent shortage challenges',
      '{industry} profitability issues'
    ],
    buyerPriority: [
      '{industry} agency owner priorities',
      'CMO {industry} expectations',
      'CFO {industry} concerns'
    ],
    competitorGap: [
      'problems with traditional {industry}',
      'limitations of {industry} tools',
      '{industry} service gaps'
    ],
    outcomeMetric: [
      'improving {industry} client retention',
      'increasing {industry} profit margins',
      'reducing {industry} delivery time'
    ]
  },

  // Category 4: Regional Retail B2C (Multi-location Retail)
  regional_b2c_retail: {
    transformation: [
      'how to increase foot traffic {industry}',
      'how to improve {industry} inventory turnover',
      'how to grow {industry} online sales'
    ],
    problemState: [
      '{industry} inventory management problems',
      '{industry} staffing challenges',
      '{industry} competition from online'
    ],
    buyerPriority: [
      'retail operations manager priorities',
      '{industry} store manager concerns',
      'retail director {industry} needs'
    ],
    competitorGap: [
      'limitations of {industry} POS systems',
      'problems with {industry} inventory software',
      '{industry} omnichannel challenges'
    ],
    outcomeMetric: [
      'improving same-store sales {industry}',
      'reducing {industry} shrinkage',
      'increasing {industry} customer lifetime value'
    ]
  },

  // Category 5: National SaaS B2B (OpenDialog-type)
  national_saas_b2b: {
    transformation: [
      'how to reduce {industry} processing time',
      'how to automate {industry} customer interactions',
      'how to scale {industry} operations without headcount'
    ],
    problemState: [
      '{industry} customer service complaints',
      '{industry} manual process inefficiencies',
      '{industry} agent turnover problems'
    ],
    buyerPriority: [
      'VP customer experience {industry} priorities',
      'CIO {industry} technology investments',
      'COO {industry} automation initiatives'
    ],
    competitorGap: [
      'limitations of rule-based chatbots {industry}',
      'problems with legacy {industry} systems',
      '{industry} point solution limitations'
    ],
    outcomeMetric: [
      'improving CSAT scores {industry}',
      'reducing handle time {industry}',
      'increasing first contact resolution {industry}'
    ]
  },

  // Category 6: National Product B2C (Consumer Brand)
  national_product_b2c: {
    transformation: [
      'how to build brand loyalty {industry}',
      'how to differentiate {industry} products',
      'how to grow {industry} DTC sales'
    ],
    problemState: [
      '{industry} brand differentiation problems',
      '{industry} customer acquisition challenges',
      '{industry} retail margin pressures'
    ],
    buyerPriority: [
      'brand manager {industry} priorities',
      'CMO {industry} growth strategies',
      'ecommerce director {industry} concerns'
    ],
    competitorGap: [
      'problems with Amazon-only {industry} brands',
      'limitations of {industry} retail partnerships',
      '{industry} supply chain vulnerabilities'
    ],
    outcomeMetric: [
      'improving customer lifetime value {industry}',
      'reducing customer acquisition cost {industry}',
      'increasing {industry} repeat purchase rate'
    ]
  }
};

// ============================================================================
// CORE FUNCTION EXTRACTION
// ============================================================================

/**
 * Extract the core function of the product/service
 * This is the PRIMARY JOB it does - used for validation
 */
function extractCoreFunction(uvp: CompleteUVP): string {
  // Priority 1: Transformation goal "how" field
  if (uvp.transformationGoal?.how) {
    // Extract the core action from "how"
    const how = uvp.transformationGoal.how.toLowerCase();

    // Look for action patterns
    const actionPatterns = [
      /automat(e|ing|ion)\s+([^.]+)/i,
      /streamlin(e|ing)\s+([^.]+)/i,
      /enabl(e|ing)\s+([^.]+)/i,
      /provid(e|ing)\s+([^.]+)/i,
      /deliver(ing)?\s+([^.]+)/i,
      /help(ing)?\s+([^.]+)/i,
    ];

    for (const pattern of actionPatterns) {
      const match = how.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    // Fallback: Use first sentence of "how"
    const firstSentence = how.split(/[.!?]/)[0];
    if (firstSentence.length < 100) {
      return firstSentence.trim();
    }
  }

  // Priority 2: Key benefit outcome statement
  if (uvp.keyBenefit?.outcomeStatement) {
    return uvp.keyBenefit.outcomeStatement.toLowerCase();
  }

  // Priority 3: Unique solution methodology
  if (uvp.uniqueSolution?.methodology) {
    const method = uvp.uniqueSolution.methodology.toLowerCase();
    const firstSentence = method.split(/[.!?]/)[0];
    if (firstSentence.length < 100) {
      return firstSentence.trim();
    }
  }

  // Fallback: Extract from first differentiator
  if (uvp.uniqueSolution?.differentiators?.[0]) {
    return uvp.uniqueSolution.differentiators[0].statement.toLowerCase();
  }

  return 'improve business operations';
}

/**
 * Extract transformation outcomes from UVP "after" state
 */
function extractTransformations(uvp: CompleteUVP): string[] {
  const transformations: string[] = [];

  // From transformation goal "after"
  if (uvp.transformationGoal?.after) {
    const after = uvp.transformationGoal.after.toLowerCase();

    // Extract outcome phrases
    const outcomePatterns = [
      /achiev(e|ing)\s+([^.,]+)/gi,
      /enjoy(ing)?\s+([^.,]+)/gi,
      /experienc(e|ing)\s+([^.,]+)/gi,
      /gain(ing)?\s+([^.,]+)/gi,
      /reduc(e|ing)\s+([^.,]+)/gi,
      /improv(e|ing)\s+([^.,]+)/gi,
      /increas(e|ing)\s+([^.,]+)/gi,
      /eliminat(e|ing)\s+([^.,]+)/gi,
    ];

    for (const pattern of outcomePatterns) {
      const matches = after.matchAll(pattern);
      for (const match of matches) {
        if (match[0].length < 60 && match[0].length > 10) {
          transformations.push(match[0].trim());
        }
      }
    }

    // If no patterns matched, use sentences
    if (transformations.length === 0) {
      const sentences = after.split(/[.!?]/).filter(s => s.trim().length > 10);
      transformations.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
  }

  // From functional drivers
  if (uvp.targetCustomer?.functionalDrivers) {
    transformations.push(...uvp.targetCustomer.functionalDrivers);
  }

  return [...new Set(transformations)].slice(0, 8);
}

/**
 * Extract problem states from UVP "before" state
 */
function extractProblemStates(uvp: CompleteUVP): string[] {
  const problems: string[] = [];

  // From transformation goal "before"
  if (uvp.transformationGoal?.before) {
    const before = uvp.transformationGoal.before.toLowerCase();

    // Extract problem phrases
    const problemPatterns = [
      /struggl(e|ing)\s+(with\s+)?([^.,]+)/gi,
      /wast(e|ing)\s+([^.,]+)/gi,
      /los(e|ing)\s+([^.,]+)/gi,
      /miss(ing)?\s+([^.,]+)/gi,
      /frustrat(ed|ing)\s+(by\s+)?([^.,]+)/gi,
      /deal(ing)?\s+with\s+([^.,]+)/gi,
      /suffer(ing)?\s+from\s+([^.,]+)/gi,
      /lack(ing)?\s+([^.,]+)/gi,
    ];

    for (const pattern of problemPatterns) {
      const matches = before.matchAll(pattern);
      for (const match of matches) {
        if (match[0].length < 60 && match[0].length > 10) {
          problems.push(match[0].trim());
        }
      }
    }

    // If no patterns matched, use sentences
    if (problems.length === 0) {
      const sentences = before.split(/[.!?]/).filter(s => s.trim().length > 10);
      problems.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
  }

  // From emotional drivers (often capture frustrations)
  if (uvp.targetCustomer?.emotionalDrivers) {
    problems.push(...uvp.targetCustomer.emotionalDrivers);
  }

  return [...new Set(problems)].slice(0, 8);
}

/**
 * Extract buyer priorities from target customer
 */
function extractBuyerPriorities(uvp: CompleteUVP): { role: string; priorities: string[] }[] {
  const buyerPriorities: { role: string; priorities: string[] }[] = [];

  // Get role from target customer
  const role = uvp.targetCustomer?.role || '';

  // Extract priorities from functional drivers and evidence
  const priorities: string[] = [];

  if (uvp.targetCustomer?.functionalDrivers) {
    priorities.push(...uvp.targetCustomer.functionalDrivers);
  }

  // Extract from evidence quotes (what customers actually say)
  if (uvp.targetCustomer?.evidenceQuotes) {
    uvp.targetCustomer.evidenceQuotes.forEach(quote => {
      // Look for priority indicators in quotes
      const priorityMatch = quote.match(/(?:need|want|require|must|priority|important|critical)\s+([^.]+)/i);
      if (priorityMatch) {
        priorities.push(priorityMatch[1].trim());
      }
    });
  }

  // From transformation goal "why" (motivation = priorities)
  if (uvp.transformationGoal?.why) {
    priorities.push(uvp.transformationGoal.why);
  }

  if (role && priorities.length > 0) {
    buyerPriorities.push({ role, priorities: [...new Set(priorities)].slice(0, 5) });
  }

  return buyerPriorities;
}

/**
 * Extract competitor gaps/limitations
 */
function extractCompetitorGaps(uvp: CompleteUVP): string[] {
  const gaps: string[] = [];

  // From differentiators (what makes us different = what others lack)
  if (uvp.uniqueSolution?.differentiators) {
    uvp.uniqueSolution.differentiators.forEach(diff => {
      const statement = diff.statement.toLowerCase();

      // Invert differentiator to competitor gap
      // "We provide X" → "limitations without X"
      const invertPatterns = [
        { pattern: /only\s+([^.]+)/i, invert: (m: string) => `alternatives lacking ${m}` },
        { pattern: /unlike\s+([^.,]+),?\s*we\s+([^.]+)/i, invert: (m: string, m2: string) => `${m} limitations` },
        { pattern: /(?:we|our)\s+(?:provide|offer|deliver|enable)\s+([^.]+)/i, invert: (m: string) => `solutions without ${m}` },
      ];

      for (const { pattern, invert } of invertPatterns) {
        const match = statement.match(pattern);
        if (match) {
          const gap = invert(match[1], match[2] || '');
          if (gap.length > 10 && gap.length < 80) {
            gaps.push(gap);
          }
        }
      }
    });
  }

  // From proprietary approach (unique = others don't have it)
  if (uvp.uniqueSolution?.proprietaryApproach) {
    const approach = uvp.uniqueSolution.proprietaryApproach.toLowerCase();
    // Extract what's unique
    const uniqueMatch = approach.match(/(?:unique|proprietary|exclusive|only)\s+([^.]+)/i);
    if (uniqueMatch) {
      gaps.push(`traditional solutions without ${uniqueMatch[1].trim()}`);
    }
  }

  return [...new Set(gaps)].slice(0, 5);
}

/**
 * Extract outcome metrics from UVP
 */
function extractOutcomeMetrics(uvp: CompleteUVP): string[] {
  const metrics: string[] = [];

  // From key benefit (often has measurable outcomes)
  if (uvp.keyBenefit?.outcomeStatement) {
    const outcome = uvp.keyBenefit.outcomeStatement.toLowerCase();

    // Look for metric patterns
    const metricPatterns = [
      /(\d+%?)\s*(?:reduction|decrease|improvement|increase)/gi,
      /(?:reduce|decrease|improve|increase)\s+([^.]+)/gi,
      /(\w+)\s+(?:by|to)\s+(\d+%?)/gi,
    ];

    for (const pattern of metricPatterns) {
      const matches = outcome.matchAll(pattern);
      for (const match of matches) {
        metrics.push(match[0].trim());
      }
    }

    // If no specific metrics, use the outcome statement
    if (metrics.length === 0) {
      metrics.push(outcome);
    }
  }

  // From differentiator evidence (often has metrics)
  if (uvp.uniqueSolution?.differentiators) {
    uvp.uniqueSolution.differentiators.forEach(diff => {
      if (diff.evidence) {
        const evidence = diff.evidence.toLowerCase();
        // Look for numbers/percentages
        const metricMatch = evidence.match(/(\d+%?)\s+([^.]+)/i);
        if (metricMatch) {
          metrics.push(`${metricMatch[1]} ${metricMatch[2].trim()}`);
        }
      }
    });
  }

  return [...new Set(metrics)].slice(0, 6);
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract all outcome components from UVP
 */
export function extractOutcomeComponents(uvp: CompleteUVP): ExtractedOutcomes {
  return {
    transformations: extractTransformations(uvp),
    problemStates: extractProblemStates(uvp),
    buyerPriorities: extractBuyerPriorities(uvp).flatMap(bp =>
      bp.priorities.map(p => `${bp.role} ${p}`)
    ),
    competitorGaps: extractCompetitorGaps(uvp),
    outcomeMetrics: extractOutcomeMetrics(uvp),
    coreFunction: extractCoreFunction(uvp)
  };
}

// ============================================================================
// QUERY GENERATION
// ============================================================================

/**
 * Generate outcome-driven queries
 *
 * Distribution:
 * - 30% Transformation/Outcome queries
 * - 20% Problem State queries
 * - 20% Buyer Priority queries
 * - 15% Outcome Metric queries
 * - 15% Competitor Gap queries
 */
export function generateOutcomeQueries(
  uvp: CompleteUVP,
  category: BusinessCategory,
  industry: string
): OutcomeQuery[] {
  const queries: OutcomeQuery[] = [];
  const currentYear = new Date().getFullYear();
  const seenQueries = new Set<string>();

  const outcomes = extractOutcomeComponents(uvp);
  const templates = CATEGORY_OUTCOME_TEMPLATES[category];

  // Helper to add unique queries
  const addQuery = (
    query: string,
    type: 'search' | 'news' | 'video' | 'social' | 'ai',
    priority: number,
    outcomeType: OutcomeQueryType,
    sourceKeywords: string[]
  ) => {
    const key = query.toLowerCase().trim();
    if (!seenQueries.has(key) && key.length > 15) {
      seenQueries.add(key);
      queries.push({
        query,
        type,
        priority,
        sourceKeywords,
        intent: 'outcome', // All outcome queries have outcome intent
        outcomeType
      });
    }
  };

  console.log('[OutcomeQueryGen] Extracted outcomes:', {
    transformations: outcomes.transformations.length,
    problemStates: outcomes.problemStates.length,
    buyerPriorities: outcomes.buyerPriorities.length,
    competitorGaps: outcomes.competitorGaps.length,
    outcomeMetrics: outcomes.outcomeMetrics.length,
    coreFunction: outcomes.coreFunction
  });

  // =========================================================================
  // 1. TRANSFORMATION QUERIES (30%)
  // =========================================================================

  // From extracted transformations
  outcomes.transformations.slice(0, 5).forEach((transformation, idx) => {
    addQuery(
      `how to ${transformation} ${industry} ${currentYear}`,
      'search',
      98 - idx * 2,
      'transformation',
      [transformation, industry]
    );

    if (idx === 0) {
      // Top transformation gets AI synthesis
      addQuery(
        `What are the best practices for ${transformation} in ${industry}? Include technology solutions, case studies, and ROI data for ${currentYear}.`,
        'ai',
        96,
        'transformation',
        [transformation, industry]
      );
    }
  });

  // From templates if extraction insufficient
  if (outcomes.transformations.length < 3) {
    templates.transformation.forEach((template, idx) => {
      const query = template.replace('{industry}', industry);
      addQuery(query, 'search', 90 - idx * 2, 'transformation', [industry]);
    });
  }

  // =========================================================================
  // 2. PROBLEM STATE QUERIES (20%)
  // =========================================================================

  outcomes.problemStates.slice(0, 4).forEach((problem, idx) => {
    addQuery(
      `${problem} ${industry} solutions ${currentYear}`,
      'search',
      88 - idx * 2,
      'problem_state',
      [problem, industry]
    );

    // Reddit/social for problem discussions
    addQuery(
      `${problem} ${industry}`,
      'social',
      85 - idx * 2,
      'problem_state',
      [problem, industry]
    );
  });

  // From templates
  if (outcomes.problemStates.length < 2) {
    templates.problemState.forEach((template, idx) => {
      const query = template.replace('{industry}', industry);
      addQuery(query, 'search', 82 - idx * 2, 'problem_state', [industry]);
    });
  }

  // =========================================================================
  // 3. BUYER PRIORITY QUERIES (20%)
  // =========================================================================

  outcomes.buyerPriorities.slice(0, 3).forEach((priority, idx) => {
    addQuery(
      `${priority} priorities ${currentYear}`,
      'search',
      86 - idx * 2,
      'buyer_priority',
      [priority]
    );

    if (idx === 0) {
      // Top priority gets LinkedIn-style query
      addQuery(
        `${priority} technology investments ${currentYear}`,
        'search',
        84,
        'buyer_priority',
        [priority]
      );
    }
  });

  // From templates
  templates.buyerPriority.forEach((template, idx) => {
    const query = template.replace('{industry}', industry);
    addQuery(query, 'search', 78 - idx * 2, 'buyer_priority', [industry]);
  });

  // =========================================================================
  // 4. OUTCOME METRIC QUERIES (15%)
  // =========================================================================

  outcomes.outcomeMetrics.slice(0, 3).forEach((metric, idx) => {
    addQuery(
      `${metric} ${industry} benchmarks ${currentYear}`,
      'search',
      80 - idx * 2,
      'outcome_metric',
      [metric, industry]
    );
  });

  // From templates
  templates.outcomeMetric.slice(0, 2).forEach((template, idx) => {
    const query = template.replace('{industry}', industry);
    addQuery(query, 'search', 76 - idx * 2, 'outcome_metric', [industry]);
  });

  // =========================================================================
  // 5. COMPETITOR GAP QUERIES (15%)
  // =========================================================================

  outcomes.competitorGaps.slice(0, 3).forEach((gap, idx) => {
    addQuery(
      `${gap} ${industry}`,
      'search',
      75 - idx * 2,
      'competitor_gap',
      [gap, industry]
    );
  });

  // From templates
  templates.competitorGap.slice(0, 2).forEach((template, idx) => {
    const query = template.replace('{industry}', industry);
    addQuery(query, 'search', 72 - idx * 2, 'competitor_gap', [industry]);
  });

  // =========================================================================
  // 6. AI SYNTHESIS QUERIES (cross-cutting)
  // =========================================================================

  // Core function AI query
  addQuery(
    `What are the latest trends in ${outcomes.coreFunction} for ${industry}? Focus on technology adoption, market growth, and ROI metrics for ${currentYear}.`,
    'ai',
    94,
    'transformation',
    [outcomes.coreFunction, industry]
  );

  // Problem-focused AI query
  if (outcomes.problemStates[0]) {
    addQuery(
      `What solutions are gaining traction for ${outcomes.problemStates[0]} in ${industry}? Include vendor landscape and adoption trends for ${currentYear}.`,
      'ai',
      88,
      'problem_state',
      [outcomes.problemStates[0], industry]
    );
  }

  // Sort by priority
  const sortedQueries = queries.sort((a, b) => b.priority - a.priority);

  // Log distribution
  const distribution = {
    transformation: sortedQueries.filter(q => q.outcomeType === 'transformation').length,
    problem_state: sortedQueries.filter(q => q.outcomeType === 'problem_state').length,
    buyer_priority: sortedQueries.filter(q => q.outcomeType === 'buyer_priority').length,
    outcome_metric: sortedQueries.filter(q => q.outcomeType === 'outcome_metric').length,
    competitor_gap: sortedQueries.filter(q => q.outcomeType === 'competitor_gap').length
  };

  console.log('[OutcomeQueryGen] Generated', sortedQueries.length, 'queries');
  console.log('[OutcomeQueryGen] Distribution:', distribution);
  console.log('[OutcomeQueryGen] Sample queries:');
  sortedQueries.slice(0, 5).forEach(q => {
    console.log(`  [${q.outcomeType}] ${q.query}`);
  });

  return sortedQueries;
}

/**
 * Get the core function for validation purposes
 */
export function getCoreFunction(uvp: CompleteUVP): string {
  return extractCoreFunction(uvp);
}

/**
 * NEGATIVE KEYWORDS - Trends containing these are NEVER relevant
 * These are industries/topics that are clearly unrelated to B2B SaaS
 */
const NEGATIVE_KEYWORDS = [
  // Physical service industries (not software)
  'hvac', 'plumbing', 'roofing', 'landscaping', 'electrical contractor',
  'air conditioning repair', 'heating repair', 'furnace', 'ductwork',
  // Crypto/unrelated tech
  'coinbase', 'bitcoin', 'ethereum', 'crypto', 'nft', 'blockchain wallet',
  'cryptocurrency exchange',
  // Physical retail
  'store hours', 'in-store pickup', 'retail location',
  // Medical/dental (unless relevant)
  'dental appointment', 'teeth cleaning', 'root canal', 'braces',
  // Food service
  'restaurant reservation', 'food delivery', 'menu',
  // Real estate
  'home buying', 'mortgage rates', 'real estate listing',
  // Automotive
  'car repair', 'oil change', 'tire rotation', 'auto mechanic'
];

/**
 * COMMON WORDS to exclude from matching
 * These match too broadly and cause false positives
 */
const COMMON_WORDS_TO_EXCLUDE = [
  'service', 'customer', 'support', 'business', 'company', 'solution',
  'platform', 'system', 'process', 'management', 'experience', 'digital',
  'online', 'technology', 'software', 'their', 'about', 'which', 'would',
  'could', 'should', 'being', 'after', 'before', 'during', 'through'
];

/**
 * Validate a trend against the core product function
 * Returns true if the trend relates to what the product does
 *
 * STRICT VALIDATION (Phase 11 fix):
 * - Requires 2+ MEANINGFUL word matches (not common words)
 * - Checks negative keywords to filter obviously irrelevant content
 * - No more "partial match" loophole
 */
export function validateAgainstCoreFunction(
  trendTitle: string,
  trendDescription: string,
  coreFunction: string
): { isValid: boolean; reason: string } {
  const trendText = `${trendTitle} ${trendDescription}`.toLowerCase();
  const coreFunctionLower = coreFunction.toLowerCase();

  // STEP 1: Check negative keywords FIRST - immediate rejection
  for (const negative of NEGATIVE_KEYWORDS) {
    if (trendText.includes(negative)) {
      return {
        isValid: false,
        reason: `Contains negative keyword: ${negative}`
      };
    }
  }

  // STEP 2: Extract MEANINGFUL action words from core function (exclude common words)
  const actionWords = coreFunctionLower
    .split(/\s+/)
    .filter(word => word.length > 5) // Increased from 4 to 5
    .filter(word => !COMMON_WORDS_TO_EXCLUDE.includes(word));

  // Check for overlap with meaningful words
  const matchedWords = actionWords.filter(word => trendText.includes(word));

  // STRICT: Require 2+ meaningful word matches
  if (matchedWords.length >= 2) {
    return {
      isValid: true,
      reason: `Matches core function: ${matchedWords.join(', ')}`
    };
  }

  // STEP 3: Check for key phrases (2-3 word combinations)
  const coreKeyPhrases = [
    // Extract 2-word phrases from core function
    ...coreFunctionLower.match(/\b\w+\s+\w+\b/g) || []
  ].filter(phrase => {
    // Filter out phrases with common words
    const words = phrase.split(' ');
    return words.every(w => w.length > 4 && !COMMON_WORDS_TO_EXCLUDE.includes(w));
  });

  const matchedPhrases = coreKeyPhrases.filter(phrase => trendText.includes(phrase));

  if (matchedPhrases.length >= 1) {
    return {
      isValid: true,
      reason: `Matches core phrase: ${matchedPhrases[0]}`
    };
  }

  // STEP 4: Check for specific technology/product keywords that are highly relevant
  const techKeywords = [
    'ai', 'chatbot', 'automation', 'conversational', 'nlp', 'machine learning',
    'contact center', 'customer engagement', 'self-service', 'virtual assistant',
    'agent', 'bot', 'dialogue', 'omnichannel', 'cx platform'
  ];

  const matchedTech = techKeywords.filter(kw =>
    trendText.includes(kw) && coreFunctionLower.includes(kw)
  );

  if (matchedTech.length >= 1) {
    return {
      isValid: true,
      reason: `Matches technology: ${matchedTech[0]}`
    };
  }

  // NO MORE "partial match" loophole - if we get here, it's not relevant
  return {
    isValid: false,
    reason: 'Does not relate to core product function'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const OutcomeQueryGenerator = {
  extractOutcomes: extractOutcomeComponents,
  generateQueries: generateOutcomeQueries,
  getCoreFunction,
  validateAgainstCoreFunction,
  CATEGORY_TEMPLATES: CATEGORY_OUTCOME_TEMPLATES
};

export default OutcomeQueryGenerator;
