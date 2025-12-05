// PRD Feature: SYNAPSE-V6
/**
 * UVP Context Builder Service
 *
 * Builds contextual query strings from UVP data for API calls.
 * Every tab query includes UVP context to customize results
 * without filtering them.
 *
 * Context includes:
 * - Target customer description
 * - Key benefit/transformation
 * - Differentiators
 * - Pain points from customer profiles
 */

import type { CompleteUVP, CustomerProfile } from '@/types/uvp-flow.types';
import type { InsightTab, BrandProfile } from './brand-profile.service';
import { outcomeDetectionService, type DetectedOutcome } from './outcome-detection.service';

export interface UVPQueryContext {
  // Core context for all queries
  customerContext: string;
  benefitContext: string;
  solutionContext: string;
  painPoints: string[];
  differentiators: string[];

  // Tab-specific query modifiers
  queryPrefix: string;
  querySuffix: string;

  // Full formatted context for injection
  fullContext: string;

  // SYNAPSE-V6: Detected outcomes from database
  detectedOutcomes?: DetectedOutcome[];
}

/**
 * Build query context from UVP data
 */
export function buildUVPContext(uvp: CompleteUVP): UVPQueryContext {
  const { targetCustomer, keyBenefit, transformationGoal, uniqueSolution } = uvp;

  // Extract customer context (using correct CompleteUVP property names)
  const customerContext = [
    targetCustomer?.statement,
    targetCustomer?.industry,
    targetCustomer?.marketGeography?.scope,
  ]
    .filter(Boolean)
    .join(', ');

  // Extract benefit context
  const benefitContext = [
    keyBenefit?.statement,
    keyBenefit?.metrics?.map(m => m.metric)?.join(', '),
  ]
    .filter(Boolean)
    .join(' - ');

  // Extract solution context
  const solutionContext = [
    uniqueSolution?.statement,
    uniqueSolution?.differentiators?.map(d => d.statement)?.join(', '),
  ]
    .filter(Boolean)
    .join(' - ');

  // Extract pain points from transformation
  const painPoints: string[] = [];
  if (transformationGoal?.before) {
    painPoints.push(transformationGoal.before);
  }
  if (targetCustomer?.emotionalDrivers) {
    painPoints.push(...targetCustomer.emotionalDrivers);
  }

  // Extract differentiators
  const differentiators: string[] = [];
  if (uniqueSolution?.differentiators) {
    differentiators.push(...uniqueSolution.differentiators.map(d => d.statement));
  }
  if (keyBenefit?.metrics) {
    differentiators.push(...keyBenefit.metrics.map(m => `${m.metric}: ${m.value}`));
  }

  // Build query prefix (who we're searching for)
  const queryPrefix = customerContext
    ? `For ${customerContext}: `
    : '';

  // Build query suffix (what matters to them)
  const querySuffix = benefitContext
    ? ` related to ${benefitContext}`
    : '';

  // Build full context string for API injection
  const fullContext = [
    `Target Customer: ${customerContext || 'General audience'}`,
    `Key Benefit: ${benefitContext || 'Not specified'}`,
    `Solution: ${solutionContext || 'Not specified'}`,
    painPoints.length > 0 ? `Pain Points: ${painPoints.join('; ')}` : null,
    differentiators.length > 0 ? `Differentiators: ${differentiators.join('; ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    customerContext,
    benefitContext,
    solutionContext,
    painPoints,
    differentiators,
    queryPrefix,
    querySuffix,
    fullContext,
  };
}

/**
 * Build tab-specific query with UVP context
 */
export function buildTabQuery(
  baseQuery: string,
  tab: InsightTab,
  uvpContext: UVPQueryContext
): string {
  // Different tabs need different context emphasis
  switch (tab) {
    case 'voc':
      // Voice of Customer - emphasize pain points
      return `${uvpContext.queryPrefix}${baseQuery} customer feedback reviews${uvpContext.querySuffix}`;

    case 'community':
      // Community - emphasize customer profile
      return `${uvpContext.queryPrefix}${baseQuery} discussions community${uvpContext.querySuffix}`;

    case 'competitive':
      // Competitive - emphasize differentiators
      const diffContext = uvpContext.differentiators.length > 0
        ? ` vs ${uvpContext.differentiators.slice(0, 2).join(' ')}`
        : '';
      return `${baseQuery} competitors market${diffContext}`;

    case 'trends':
      // Trends - emphasize industry/solution context
      return `${baseQuery} trends industry ${uvpContext.solutionContext || ''}`.trim();

    case 'search':
      // Search - pure customer intent
      return `${uvpContext.queryPrefix}${baseQuery}`;

    case 'local_timing':
      // Local/Timing - emphasize geographic and temporal
      const geoContext = uvpContext.customerContext.includes('local')
        ? 'local '
        : '';
      return `${geoContext}${baseQuery} events timing signals`;

    default:
      return `${uvpContext.queryPrefix}${baseQuery}${uvpContext.querySuffix}`;
  }
}

/**
 * Format UVP context for LLM prompt injection
 */
export function formatContextForPrompt(
  uvpContext: UVPQueryContext,
  tab: InsightTab
): string {
  const sections: string[] = [
    '## Business Context',
    '',
    uvpContext.fullContext,
    '',
    '## Analysis Focus',
    '',
  ];

  // Add tab-specific analysis instructions
  switch (tab) {
    case 'voc':
      sections.push(
        'Focus on: Customer pain points, satisfaction drivers, unmet needs',
        'Look for: Direct quotes, emotional language, specific complaints/praise'
      );
      break;

    case 'community':
      sections.push(
        'Focus on: Community discussions, peer recommendations, word-of-mouth',
        'Look for: Questions asked, advice given, shared experiences'
      );
      break;

    case 'competitive':
      sections.push(
        'Focus on: Competitor positioning, market gaps, differentiation opportunities',
        'Look for: Competitor mentions, comparison points, switching triggers'
      );
      break;

    case 'trends':
      sections.push(
        'Focus on: Industry trends, emerging patterns, future signals',
        'Look for: Growth indicators, market shifts, technology changes'
      );
      break;

    case 'search':
      sections.push(
        'Focus on: Search intent, keyword patterns, information needs',
        'Look for: Question formats, problem statements, solution searches'
      );
      break;

    case 'local_timing':
      sections.push(
        'Focus on: Local events, seasonal patterns, timing triggers',
        'Look for: Event calendars, weather impacts, local news'
      );
      break;
  }

  return sections.join('\n');
}

/**
 * Get recommended API query count based on profile type
 */
export function getQueryDepth(profile: BrandProfile): {
  maxQueries: number;
  timeout: number;
  parallelLimit: number;
} {
  switch (profile.profile_type) {
    case 'national-saas':
      // SaaS needs deep research
      return { maxQueries: 15, timeout: 30000, parallelLimit: 5 };

    case 'national-product':
      // Products need broad social coverage
      return { maxQueries: 12, timeout: 25000, parallelLimit: 4 };

    case 'regional-agency':
    case 'regional-retail':
      // Regional needs balanced approach
      return { maxQueries: 10, timeout: 20000, parallelLimit: 4 };

    case 'local-b2c':
    case 'local-b2b':
      // Local needs fast, focused queries
      return { maxQueries: 8, timeout: 15000, parallelLimit: 3 };

    default:
      return { maxQueries: 10, timeout: 20000, parallelLimit: 4 };
  }
}

/**
 * Extract short query keywords for search APIs (max 100 chars)
 * Used for Serper, Reddit, NewsAPI - APIs that expect short keyword queries
 *
 * PHASE 14F-E: Now accepts optional profileType for industry fallback defaults
 */
export function extractShortQuery(
  uvp: CompleteUVP,
  tab: InsightTab,
  profileType?: string,
  preDetectedOutcomes?: DetectedOutcome[]  // V1 WIRING: Accept pre-detected outcomes
): string {
  const keywords: string[] = [];

  // Extract industry/role from target customer
  const customerStatement = uvp.targetCustomer?.statement || '';
  const industry = uvp.targetCustomer?.industry || '';

  // Extract 2-3 key words from customer statement (first meaningful words)
  const customerWords = customerStatement
    .replace(/^(for|the|a|an)\s+/i, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['who', 'that', 'with', 'seeking', 'looking', 'want', 'need'].includes(w.toLowerCase()))
    .slice(0, 2);

  if (customerWords.length > 0) {
    keywords.push(...customerWords);
  }

  // Add industry if present
  if (industry && !keywords.some(k => industry.toLowerCase().includes(k.toLowerCase()))) {
    keywords.push(industry.split(/\s+/)[0]); // First word of industry
  }

  // Tab-specific keyword additions - PHASE 14F-C: Psychology-Aligned Query Builder
  switch (tab) {
    case 'voc':
      // PHASE 14H: Outcome-Driven Query Generation using OutcomeDetectionService
      keywords.length = 0; // Clear generic keywords

      // V1 WIRING: Use pre-detected outcomes if available, otherwise detect now
      let outcomes: DetectedOutcome[];
      let detectionResult: { outcomes: DetectedOutcome[]; mappings: any[] };

      if (preDetectedOutcomes && preDetectedOutcomes.length > 0) {
        console.log(`[V1 WIRING/voc] Using ${preDetectedOutcomes.length} pre-detected outcomes`);
        outcomes = preDetectedOutcomes;
        detectionResult = { outcomes: preDetectedOutcomes, mappings: [] };
      } else {
        console.log(`[V1 WIRING/voc] No pre-detected outcomes, detecting now...`);
        detectionResult = outcomeDetectionService.detectOutcomes(uvp);
        outcomes = detectionResult.outcomes;
      }

      if (outcomes.length > 0) {
        // Sort by impact score (highest impact first)
        const sortedOutcomes = outcomes
          .sort((a, b) => b.impactScore - a.impactScore)
          .slice(0, 3); // Top 3 outcomes

        // Extract outcome statements (these are the real desired outcomes)
        sortedOutcomes.forEach((outcome: DetectedOutcome) => {
          // Extract key words from outcome statement (not generic keywords!)
          const outcomeWords = outcome.statement
            .toLowerCase()
            .replace(/^(want to|need to|desire to|seeking to)\s+/i, '') // Remove intent prefixes
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 3); // Max 3 words per outcome

          keywords.push(...outcomeWords);
        });

        // Add differentiators that map to outcomes (the "how" we solve them)
        const topMappings = detectionResult.mappings
          .filter(m => m.strengthScore > 50) // Strong mappings only
          .sort((a, b) => b.strengthScore - a.strengthScore)
          .slice(0, 2); // Top 2 differentiators

        if (topMappings.length > 0 && uvp.uniqueSolution?.differentiators) {
          topMappings.forEach(mapping => {
            const diff = uvp.uniqueSolution?.differentiators?.find(d => d.id === mapping.differentiatorId);
            if (diff) {
              const diffWords = diff.statement
                .toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 3)
                .slice(0, 2); // Max 2 words per differentiator
              keywords.push(...diffWords);
            }
          });
        }

        // Add VoC context (customer experiences, not generic "reviews")
        keywords.push('customer experiences', 'feedback');
      } else {
        // FALLBACK: No outcomes detected, use industry-specific defaults
        keywords.push(industry);

        // Use legacy approach as fallback
        if (isB2BTargetCustomer(customerStatement)) {
          const primaryOutcomes = extractPrimaryOutcomes(uvp, uvp.customerProfiles, profileType);
          const topOutcomeCategory = primaryOutcomes.length > 0 ? primaryOutcomes[0].category : 'revenue';
          const layeredQuery = build3LayerQuery(uvp, topOutcomeCategory, industry, profileType);
          const layeredKeywords = layeredQuery.split(/\s+/).filter(w => w.length > 2);
          keywords.push(...layeredKeywords);
        } else {
          const psychologyTriggers = getIndustryPsychologyTriggers(industry, 'social_proof');
          keywords.push(...psychologyTriggers.slice(0, 2));
        }

        keywords.push('customer feedback', 'reviews');
      }
      break;
    case 'community':
      // V1 approach: Community discussions about industry topics and questions
      keywords.push('discussion', 'advice', 'recommend');
      break;
    case 'competitive':
      // V1 approach: Competitive landscape and comparisons
      keywords.push('vs', 'compare', 'alternative', 'best');
      break;
    case 'trends':
      // V1 approach: Industry trends and market movements
      keywords.push('trends', 'future', 'growth', '2025');
      break;
    case 'search':
      // V1 approach: Search intent and demand signals
      keywords.push('how to', 'best', 'guide');
      break;
    case 'local_timing':
      // V1 approach: Local market timing and opportunities
      keywords.push('market', 'local', 'opportunities');
      break;
  }

  // Join and limit to 100 chars
  const query = keywords.slice(0, 5).join(' ');
  const finalQuery = query.length > 100 ? query.substring(0, 97) + '...' : query;

  // V1 WIRING: Log final query for debugging
  console.log(`[V1 WIRING] extractShortQuery(${tab}): "${finalQuery}"`);

  return finalQuery;
}

/**
 * Extract location for weather/local APIs
 * Pulls from UVP geography or defaults to brand location
 */
export function extractLocation(
  uvp: CompleteUVP,
  brandLocation?: string
): string {
  // Try UVP geography first
  const geography = uvp.targetCustomer?.marketGeography;

  if (geography?.primaryRegions && geography.primaryRegions.length > 0) {
    // Return first region (most specific)
    return geography.primaryRegions[0];
  }

  // Check for location in customer statement
  const statement = uvp.targetCustomer?.statement || '';
  // Look for city/state patterns like "San Francisco", "New York", etc.
  const locationMatch = statement.match(/(?:in|near|around)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/);
  if (locationMatch) {
    return locationMatch[1].trim();
  }

  // Fall back to brand location
  if (brandLocation) {
    return brandLocation;
  }

  // Default fallback
  return 'United States';
}

/**
 * Extract domain for SEMrush/competitive APIs
 */
export function extractDomain(
  uvp: CompleteUVP,
  brandWebsite?: string
): string {
  // Use brand website if provided
  if (brandWebsite) {
    // Strip protocol and www
    return brandWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  // Try to find domain in UVP solution statement
  const solution = uvp.uniqueSolution?.statement || '';
  const domainMatch = solution.match(/([a-zA-Z0-9-]+\.(com|io|ai|co|net|org))/i);
  if (domainMatch) {
    return domainMatch[1];
  }

  // No domain found
  return '';
}

/**
 * PHASE 14F-A: UVP Outcome Detection Engine
 * Extracts primary business outcomes from UVP with priority weighting
 */
interface OutcomeWeight {
  verb: string;
  weight: number;
  category: 'revenue' | 'growth' | 'efficiency' | 'compliance' | 'brand';
}

const OUTCOME_PRIORITIES: OutcomeWeight[] = [
  // Revenue outcomes (10x weight)
  { verb: 'sales', weight: 10, category: 'revenue' },
  { verb: 'revenue', weight: 10, category: 'revenue' },
  { verb: 'generate', weight: 10, category: 'revenue' },
  { verb: 'close', weight: 10, category: 'revenue' },
  { verb: 'convert', weight: 10, category: 'revenue' },
  { verb: 'monetize', weight: 10, category: 'revenue' },

  // Growth outcomes (8x weight)
  { verb: 'grow', weight: 8, category: 'growth' },
  { verb: 'scale', weight: 8, category: 'growth' },
  { verb: 'expand', weight: 8, category: 'growth' },
  { verb: 'increase', weight: 8, category: 'growth' },
  { verb: 'boost', weight: 8, category: 'growth' },
  { verb: 'acquire', weight: 8, category: 'growth' },

  // Efficiency outcomes (5x weight)
  { verb: 'automate', weight: 5, category: 'efficiency' },
  { verb: 'reduce', weight: 5, category: 'efficiency' },
  { verb: 'streamline', weight: 5, category: 'efficiency' },
  { verb: 'optimize', weight: 5, category: 'efficiency' },
  { verb: 'improve', weight: 5, category: 'efficiency' },
  { verb: 'enhance', weight: 5, category: 'efficiency' },

  // Compliance outcomes (1x weight - lowest priority)
  { verb: 'compliance', weight: 1, category: 'compliance' },
  { verb: 'comply', weight: 1, category: 'compliance' },
  { verb: 'audit', weight: 1, category: 'compliance' },
  { verb: 'regulate', weight: 1, category: 'compliance' },
  { verb: 'regulatory', weight: 1, category: 'compliance' },
  { verb: 'certify', weight: 1, category: 'compliance' },
  { verb: 'risk', weight: 1, category: 'compliance' },
  { verb: 'maintain', weight: 1, category: 'compliance' }, // "maintain compliance"
  { verb: 'pass', weight: 1, category: 'compliance' }, // "pass audits"

  // Brand outcomes (3x weight)
  { verb: 'brand', weight: 3, category: 'brand' },
  { verb: 'trust', weight: 3, category: 'brand' },
  { verb: 'credibility', weight: 3, category: 'brand' },
];

interface PrimaryOutcome {
  keyword: string;
  frequency: number;
  weight: number;
  score: number; // frequency * weight
  category: string;
}

/**
 * Extract primary outcomes from UVP with priority weighting
 * Analyzes keyBenefit and buyer personas for outcome frequency
 *
 * PHASE 14F-E: Falls back to industry-standard defaults when UVP outcomes unclear
 * PHASE 14F-F: Enhanced persona analysis using ALL 10 buyer personas with frequency weighting
 *
 * Persona Weight Tiers:
 * - 8+ personas mention outcome = HIGH priority (dominates queries)
 * - 4-7 personas mention outcome = MEDIUM priority (included in queries)
 * - 1-3 personas mention outcome = LOW priority (deprioritized in queries)
 */
function extractPrimaryOutcomes(
  uvp: CompleteUVP,
  buyerPersonas?: CustomerProfile[],
  profileType?: string
): PrimaryOutcome[] {
  const outcomeCounts = new Map<string, {
    count: number;
    weight: number;
    category: string;
    personaMentions: Set<string>; // Track WHICH personas mentioned this outcome
  }>();

  // Analyze keyBenefit statement
  const benefitText = (uvp.keyBenefit?.statement || '').toLowerCase();

  for (const outcome of OUTCOME_PRIORITIES) {
    if (benefitText.includes(outcome.verb)) {
      const current = outcomeCounts.get(outcome.verb) || {
        count: 0,
        weight: outcome.weight,
        category: outcome.category,
        personaMentions: new Set<string>()
      };
      current.count += 1;
      outcomeCounts.set(outcome.verb, current);
    }
  }

  // PHASE 14F-F: Analyze ALL 10 buyer personas (not just statements)
  // Check pain_points, desired_outcomes, urgency_signals for outcome keywords
  const personas = buyerPersonas || uvp.customerProfiles || [];

  console.log(`[extractPrimaryOutcomes] Analyzing ${personas.length} buyer personas for outcome frequency`);

  for (const persona of personas) {
    // PHASE 14F-F: Build comprehensive persona text from ALL relevant fields
    const personaTexts: string[] = [];

    // 1. Statement/Name (legacy support)
    if (typeof persona === 'object' && 'statement' in persona) {
      personaTexts.push((persona as any).statement || '');
    }
    if (typeof persona === 'object' && 'persona_name' in persona) {
      personaTexts.push((persona as any).persona_name || '');
    }

    // 2. PHASE 14F-F: Pain points (critical for outcome detection)
    if (typeof persona === 'object' && 'pain_points' in persona) {
      const painPoints = (persona as any).pain_points;
      if (Array.isArray(painPoints)) {
        // Can be array of strings OR array of PainPoint objects
        painPoints.forEach((pp: any) => {
          if (typeof pp === 'string') {
            personaTexts.push(pp);
          } else if (pp && typeof pp === 'object' && 'description' in pp) {
            personaTexts.push(pp.description);
          }
        });
      }
    }

    // 3. PHASE 14F-F: Desired outcomes (explicit outcome keywords!)
    if (typeof persona === 'object' && 'desired_outcomes' in persona) {
      const outcomes = (persona as any).desired_outcomes;
      if (Array.isArray(outcomes)) {
        // Can be array of strings OR array of DesiredOutcome objects
        outcomes.forEach((outcome: any) => {
          if (typeof outcome === 'string') {
            personaTexts.push(outcome);
          } else if (outcome && typeof outcome === 'object') {
            if ('description' in outcome) personaTexts.push(outcome.description);
            if ('metric' in outcome) personaTexts.push(outcome.metric || '');
            if ('emotional_benefit' in outcome) personaTexts.push(outcome.emotional_benefit || '');
          }
        });
      }
    }

    // 4. PHASE 14F-F: Urgency signals (indicates priority)
    if (typeof persona === 'object' && 'urgency_signals' in persona) {
      const signals = (persona as any).urgency_signals;
      if (Array.isArray(signals)) {
        signals.forEach((signal: any) => {
          if (typeof signal === 'string') {
            personaTexts.push(signal);
          } else if (signal && typeof signal === 'object' && 'trigger' in signal) {
            personaTexts.push(signal.trigger);
          }
        });
      }
    }

    // 5. Legacy UVP fields (backwards compatibility)
    if (typeof persona === 'object') {
      if ('emotionalDrivers' in persona && Array.isArray((persona as any).emotionalDrivers)) {
        personaTexts.push(...(persona as any).emotionalDrivers);
      }
      if ('functionalDrivers' in persona && Array.isArray((persona as any).functionalDrivers)) {
        personaTexts.push(...(persona as any).functionalDrivers);
      }
    }

    // Combine all persona text
    const fullPersonaText = personaTexts.filter(Boolean).join(' ').toLowerCase();

    // Get persona ID for tracking mentions
    const personaId = (persona as any).id ||
                      (persona as any).persona_name ||
                      (persona as any).statement ||
                      `persona_${personas.indexOf(persona)}`;

    // Check each outcome priority verb
    for (const outcome of OUTCOME_PRIORITIES) {
      if (fullPersonaText.includes(outcome.verb)) {
        const current = outcomeCounts.get(outcome.verb) || {
          count: 0,
          weight: outcome.weight,
          category: outcome.category,
          personaMentions: new Set<string>()
        };

        // Only increment count if this persona hasn't mentioned it yet
        // (prevent double-counting if outcome appears multiple times in same persona)
        if (!current.personaMentions.has(personaId)) {
          current.count += 1;
          current.personaMentions.add(personaId);
        }

        outcomeCounts.set(outcome.verb, current);
      }
    }
  }

  // Convert to array and calculate priority scores
  let outcomes: PrimaryOutcome[] = Array.from(outcomeCounts.entries())
    .map(([keyword, data]) => ({
      keyword,
      frequency: data.count,
      weight: data.weight,
      score: data.count * data.weight,
      category: data.category
    }));

  // PHASE 14F-F: Sort by FREQUENCY first if we have high-priority outcomes (8+),
  // then by score for tiebreaking
  const hasHighFrequencyOutcome = outcomes.some(o => o.frequency >= 8);
  if (hasHighFrequencyOutcome) {
    // Sort by frequency DESC (highest frequency wins), then by score for tiebreak
    outcomes.sort((a, b) => {
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency; // Higher frequency first
      }
      return b.score - a.score; // Tiebreak by score
    });
  } else {
    // No high-frequency outcomes, use traditional score-based sorting
    outcomes.sort((a, b) => b.score - a.score);
  }

  // PHASE 14F-F: Log persona frequency analysis for debugging
  if (outcomes.length > 0 && personas.length >= 5) {
    console.log('[extractPrimaryOutcomes] PHASE 14F-F Persona Frequency Analysis:');
    outcomes.slice(0, 5).forEach(outcome => {
      const tier = outcome.frequency >= 8 ? 'HIGH (8+)' :
                   outcome.frequency >= 4 ? 'MEDIUM (4-7)' :
                   'LOW (1-3)';
      console.log(`  • ${outcome.keyword}: ${outcome.frequency}/${personas.length} personas (${tier}) - Score: ${outcome.score}`);
    });
  }

  // PHASE 14F-E: If no clear outcomes detected, use industry-standard defaults
  if (outcomes.length === 0 && profileType) {
    console.log('[extractPrimaryOutcomes] No outcomes detected, using industry defaults for:', profileType);
    return getIndustryDefaultOutcomes(profileType);
  }

  return outcomes;
}

/**
 * PHASE 14F-E: Industry-Standard Default Outcomes by Profile Type
 * Provides fallback priorities when UVP outcomes are unclear or minimal
 *
 * Returns default business outcomes ranked by profile type priorities
 */
function getIndustryDefaultOutcomes(profileType: string): PrimaryOutcome[] {
  const defaults: Record<string, PrimaryOutcome[]> = {
    'national-saas': [
      { keyword: 'grow', frequency: 3, weight: 8, score: 24, category: 'growth' },
      { keyword: 'automate', frequency: 2, weight: 5, score: 10, category: 'efficiency' },
      { keyword: 'scale', frequency: 2, weight: 8, score: 16, category: 'growth' },
      { keyword: 'revenue', frequency: 2, weight: 10, score: 20, category: 'revenue' },
      { keyword: 'optimize', frequency: 1, weight: 5, score: 5, category: 'efficiency' },
    ],
    'local-b2c': [
      { keyword: 'sales', frequency: 4, weight: 10, score: 40, category: 'revenue' },
      { keyword: 'acquire', frequency: 3, weight: 8, score: 24, category: 'growth' },
      { keyword: 'brand', frequency: 2, weight: 3, score: 6, category: 'brand' },
      { keyword: 'trust', frequency: 2, weight: 3, score: 6, category: 'brand' },
    ],
    'local-b2b': [
      { keyword: 'revenue', frequency: 4, weight: 10, score: 40, category: 'revenue' },
      { keyword: 'acquire', frequency: 3, weight: 8, score: 24, category: 'growth' },
      { keyword: 'trust', frequency: 2, weight: 3, score: 6, category: 'brand' },
      { keyword: 'improve', frequency: 2, weight: 5, score: 10, category: 'efficiency' },
    ],
    'national-product': [
      { keyword: 'sales', frequency: 4, weight: 10, score: 40, category: 'revenue' },
      { keyword: 'convert', frequency: 3, weight: 10, score: 30, category: 'revenue' },
      { keyword: 'grow', frequency: 2, weight: 8, score: 16, category: 'growth' },
      { keyword: 'brand', frequency: 2, weight: 3, score: 6, category: 'brand' },
    ],
    'regional-agency': [
      { keyword: 'scale', frequency: 3, weight: 8, score: 24, category: 'growth' },
      { keyword: 'streamline', frequency: 3, weight: 5, score: 15, category: 'efficiency' },
      { keyword: 'grow', frequency: 2, weight: 8, score: 16, category: 'growth' },
      { keyword: 'revenue', frequency: 2, weight: 10, score: 20, category: 'revenue' },
    ],
    'regional-retail': [
      { keyword: 'sales', frequency: 3, weight: 10, score: 30, category: 'revenue' },
      { keyword: 'expand', frequency: 3, weight: 8, score: 24, category: 'growth' },
      { keyword: 'streamline', frequency: 2, weight: 5, score: 10, category: 'efficiency' },
      { keyword: 'brand', frequency: 2, weight: 3, score: 6, category: 'brand' },
    ],
  };

  // Return defaults for profile type, or generic B2C defaults if unknown
  return defaults[profileType] || defaults['local-b2c'];
}

/**
 * PHASE 14G-B: Enhanced Psychology Principle Integration with Industry Specificity
 * Map outcome categories to V1's 9 psychology principles using industry-specific triggers
 * Leverages getIndustryPsychologyTriggers() for targeted language and proof points
 *
 * Revenue outcomes get 10x weight and map to high-impact psychology principles:
 * - Loss Aversion: Industry-specific risks and penalties
 * - Authority: Industry-specific proof points and metrics
 * - Curiosity Gap: Industry-specific breakthroughs and secrets
 * - Social Proof: Industry-specific testimonials and endorsements
 */
function outcomeToPsychologyTriggers(outcomeCategory: string, industry: string): string[] {
  const triggers: string[] = [];

  switch (outcomeCategory) {
    case 'revenue':
      // Sales outcomes → Loss Aversion + Authority (industry-specific)
      triggers.push(...getIndustryPsychologyTriggers(industry, 'authority').slice(0, 1));
      triggers.push(...getIndustryPsychologyTriggers(industry, 'social_proof').slice(0, 1));
      triggers.push(...getIndustryPsychologyTriggers(industry, 'loss_aversion').slice(0, 1));
      break;

    case 'growth':
      // Growth outcomes → Curiosity Gap + Social Proof (industry-specific)
      triggers.push(...getIndustryPsychologyTriggers(industry, 'curiosity_gap').slice(0, 1));
      triggers.push(...getIndustryPsychologyTriggers(industry, 'social_proof').slice(0, 1));
      triggers.push(...getIndustryPsychologyTriggers(industry, 'authority').slice(0, 1));
      break;

    case 'efficiency':
      // Efficiency outcomes → Authority + Social Proof (industry-specific)
      triggers.push(...getIndustryPsychologyTriggers(industry, 'authority').slice(0, 1));
      triggers.push(...getIndustryPsychologyTriggers(industry, 'social_proof').slice(0, 1));
      break;

    case 'compliance':
      // Compliance outcomes → Authority (lowest priority - industry-specific but minimal)
      triggers.push(...getIndustryPsychologyTriggers(industry, 'authority').slice(0, 1));
      break;

    case 'brand':
      // Brand outcomes → Social Proof (industry-specific)
      triggers.push(...getIndustryPsychologyTriggers(industry, 'social_proof').slice(0, 2));
      break;

    default:
      // Fallback to generic authority triggers
      triggers.push(...getIndustryPsychologyTriggers(industry, 'authority').slice(0, 1));
      triggers.push(...getIndustryPsychologyTriggers(industry, 'social_proof').slice(0, 1));
      break;
  }

  return triggers;
}

/**
 * PHASE 14G-B: Industry-Specific Psychology Trigger Mappings
 * Maps psychology principles to industry-specific language and evidence
 * Creates targeted triggers that speak to industry-specific fears, desires, and proof points
 *
 * Insurance → "SOX compliance case studies" not generic "proven ROI"
 * SaaS → "user adoption metrics" not generic "results"
 * Healthcare → "patient safety outcomes" not generic "success"
 */
function getIndustryPsychologyTriggers(industry: string, psychologyPrinciple: string): string[] {
  const industryLower = industry.toLowerCase();
  const triggers: string[] = [];

  // Insurance Industry Psychology Mappings
  if (industryLower.includes('insurance')) {
    switch (psychologyPrinciple) {
      case 'authority':
        triggers.push('SOX compliance case studies', 'audit-proven results', 'regulatory approval');
        break;
      case 'loss_aversion':
        triggers.push('compliance violations', 'audit failures', 'regulatory penalties');
        break;
      case 'social_proof':
        triggers.push('industry testimonials', 'competitor adoptions', 'regulatory endorsements');
        break;
      case 'curiosity_gap':
        triggers.push('audit secrets', 'compliance breakthrough', 'hidden regulatory risks');
        break;
      default:
        triggers.push('proven compliance', 'audit transparency');
    }
  }
  // SaaS Industry Psychology Mappings
  else if (industryLower.includes('software') || industryLower.includes('technology')) {
    switch (psychologyPrinciple) {
      case 'authority':
        triggers.push('user adoption metrics', 'retention benchmarks', 'feature adoption rates');
        break;
      case 'loss_aversion':
        triggers.push('churn prevention', 'user engagement drops', 'feature abandonment');
        break;
      case 'social_proof':
        triggers.push('customer success stories', 'implementation wins', 'user growth cases');
        break;
      case 'curiosity_gap':
        triggers.push('growth hacks', 'retention secrets', 'scaling breakthrough');
        break;
      default:
        triggers.push('proven metrics', 'user success');
    }
  }
  // Healthcare Industry Psychology Mappings
  else if (industryLower.includes('health') || industryLower.includes('medical')) {
    switch (psychologyPrinciple) {
      case 'authority':
        triggers.push('patient safety outcomes', 'clinical evidence', 'medical research');
        break;
      case 'loss_aversion':
        triggers.push('patient risks', 'safety compromises', 'care quality drops');
        break;
      case 'social_proof':
        triggers.push('hospital testimonials', 'physician endorsements', 'patient outcomes');
        break;
      case 'curiosity_gap':
        triggers.push('care innovations', 'treatment breakthroughs', 'safety discoveries');
        break;
      default:
        triggers.push('patient outcomes', 'care quality');
    }
  }
  // Professional Services Psychology Mappings
  else if (industryLower.includes('law') || industryLower.includes('accounting') || industryLower.includes('consulting')) {
    switch (psychologyPrinciple) {
      case 'authority':
        triggers.push('client case wins', 'expert opinions', 'professional credentials');
        break;
      case 'loss_aversion':
        triggers.push('client losses', 'missed opportunities', 'competitive disadvantage');
        break;
      case 'social_proof':
        triggers.push('peer testimonials', 'industry awards', 'client referrals');
        break;
      case 'curiosity_gap':
        triggers.push('practice secrets', 'client strategies', 'competitive edges');
        break;
      default:
        triggers.push('proven expertise', 'client success');
    }
  }
  // Generic fallback for other industries
  else {
    switch (psychologyPrinciple) {
      case 'authority':
        triggers.push('proven ROI', 'case studies', 'results');
        break;
      case 'loss_aversion':
        triggers.push('missing opportunities', 'revenue leaks', 'competitive losses');
        break;
      case 'social_proof':
        triggers.push('success stories', 'testimonials', 'what others say');
        break;
      case 'curiosity_gap':
        triggers.push('breakthrough', 'secret to', 'discovered');
        break;
      default:
        triggers.push('proven results', 'success stories');
    }
  }

  return triggers;
}

/**
 * PHASE 14G-C + 14G-D: 3-Layer Query Construction with Cross-Domain Context Integration
 * Builds VoC queries using layered approach + cross-domain context (timing, competitive)
 * Layer 1: Industry-Solution Core (30 chars max) - "Insurance AI agent sales"
 * Layer 2: Brand Specificity + Timing (40 chars max) - "SOX audit automation Q1"
 * Layer 3: Psychology Enhancement (30 chars max) - "proven compliance case studies"
 *
 * Cross-Domain Integration:
 * - Regulatory timing (Q1 audits, Q4 compliance) for insurance/finance
 * - Competitive context for differentiation
 * - V1 connection methodology for breakthrough insights
 */
function build3LayerQuery(
  uvp: CompleteUVP,
  outcomeCategory: string,
  industry: string,
  profileType?: string,
  enableCrossDomainContext: boolean = true
): string {
  const layers: string[] = [];

  // Layer 1: Industry-Solution Core (30 chars max)
  const industryCore = industry.split(/\s+/).slice(0, 2).join(' '); // e.g., "Insurance"
  const solutionCore = extractSolutionCore(uvp); // e.g., "AI agent sales"
  const layer1 = `${industryCore} ${solutionCore}`.substring(0, 30);
  layers.push(layer1);

  // Layer 2: Brand Specificity + Cross-Domain Context (40 chars max)
  let layer2 = extractBrandSpecificity(uvp);

  if (enableCrossDomainContext) {
    // PHASE 14G-D: Add regulatory timing context for relevant industries
    const timingContext = extractRegulatoryTiming(industry, outcomeCategory);
    if (timingContext && layer2) {
      layer2 = `${layer2} ${timingContext}`.substring(0, 40);
    } else if (timingContext) {
      layer2 = timingContext.substring(0, 40);
    }
  }

  if (layer2) {
    layers.push(layer2);
  }

  // Layer 3: Psychology Enhancement + Competitive Context (30 chars max)
  const psychologyTriggers = getIndustryPsychologyTriggers(industry, 'authority');
  let layer3 = psychologyTriggers.length > 0 ? psychologyTriggers[0] : 'proven results';

  if (enableCrossDomainContext) {
    // PHASE 14G-D: Integrate competitive intelligence for differentiation
    const competitiveContext = extractCompetitiveContext(uvp, industry);
    if (competitiveContext) {
      layer3 = `${layer3} vs ${competitiveContext}`.substring(0, 30);
    }
  }

  layers.push(layer3.substring(0, 30));

  return layers.join(' ').trim();
}

/**
 * PHASE 14G-D: Extract regulatory timing context for cross-domain integration
 */
function extractRegulatoryTiming(industry: string, outcomeCategory: string): string | null {
  const industryLower = industry.toLowerCase();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  // Insurance/Finance regulatory timing
  if (industryLower.includes('insurance') || industryLower.includes('finance')) {
    if (outcomeCategory === 'compliance') {
      // Q1 (Jan-Mar): Annual audits, SOX compliance prep
      if (currentMonth >= 1 && currentMonth <= 3) return 'Q1 audit';
      // Q4 (Oct-Dec): Year-end compliance, audit prep
      if (currentMonth >= 10) return 'Q4 compliance';
      // Q2/Q3: Mid-year reviews
      return 'mid-year review';
    }
  }

  // Healthcare regulatory timing
  if (industryLower.includes('health') || industryLower.includes('medical')) {
    if (outcomeCategory === 'compliance') {
      return 'HIPAA compliance';
    }
  }

  return null;
}

/**
 * PHASE 14G-D: Extract competitive context for differentiation
 */
function extractCompetitiveContext(uvp: CompleteUVP, industry: string): string | null {
  const industryLower = industry.toLowerCase();
  const solutionText = uvp.uniqueSolution?.statement?.toLowerCase() || '';

  // AI/Technology competitive context
  if (solutionText.includes('ai') || solutionText.includes('automation')) {
    if (industryLower.includes('insurance')) return 'traditional';
    if (industryLower.includes('software')) return 'legacy';
    return 'manual';
  }

  // Compliance/Regulatory competitive context
  if (solutionText.includes('compliance') || solutionText.includes('audit')) {
    return 'manual audits';
  }

  return null;
}

/**
 * Extract solution method core keywords from UVP (for Layer 1)
 */
function extractSolutionCore(uvp: CompleteUVP): string {
  const solutionText = uvp.uniqueSolution?.statement?.toLowerCase() || '';

  if (solutionText.includes('ai agent')) return 'AI agent sales';
  if (solutionText.includes('automation')) return 'automation';
  if (solutionText.includes('platform')) return 'platform';
  if (solutionText.includes('software')) return 'software';
  if (solutionText.includes('technology')) return 'technology';

  return 'solutions';
}

/**
 * Extract brand-specific differentiator keywords (for Layer 2)
 */
function extractBrandSpecificity(uvp: CompleteUVP): string {
  const solutionText = uvp.uniqueSolution?.statement?.toLowerCase() || '';
  const benefitText = uvp.keyBenefit?.statement?.toLowerCase() || '';

  // Compliance/regulatory specificity
  if (solutionText.includes('sox') || benefitText.includes('sox')) {
    return 'SOX audit automation';
  }
  if (solutionText.includes('compliance') || benefitText.includes('compliance')) {
    return 'compliance automation';
  }
  if (solutionText.includes('explainable') || benefitText.includes('explainable')) {
    return 'explainable AI transparency';
  }

  // Technology specificity
  if (solutionText.includes('conversational') || benefitText.includes('conversational')) {
    return 'conversational AI platform';
  }
  if (solutionText.includes('transparent') || benefitText.includes('transparent')) {
    return 'transparent AI system';
  }

  // Default to generic specificity
  return 'platform automation';
}

/**
 * PHASE 14G-A: Solution Method Injection + Cross-Industry Outcome Detection
 * Convert outcome verb to industry-specific business context keyword with brand-specific solution context
 * Maps generic outcome verbs to actionable business search terms while preserving unique solution methods
 *
 * Supports 6 business profile types with industry-specific defaults:
 * - B2B SaaS (national-saas): growth, efficiency, ROI, scale, automation
 * - Local B2B (local-b2b): revenue, customers, referrals, reputation, efficiency
 * - Local B2C (local-b2c): sales, customers, reviews, brand, convenience
 * - E-commerce (national-product): sales, conversion, retention, growth, traffic
 * - Regional/Agency (regional-*): scale, efficiency, compliance, growth, market-share
 * - Professional Services (detected via industry): clients, expertise, efficiency, reputation, growth
 */
function outcomeToBusinessContext(outcomeVerb: string, industry: string, profileType?: string, uvp?: CompleteUVP): string {
  const industryLower = industry.toLowerCase();

  // PHASE 14G-A: Extract solution method keywords from UVP unique solution
  const solutionKeywords: string[] = [];
  if (uvp?.uniqueSolution?.statement) {
    const solutionText = uvp.uniqueSolution.statement.toLowerCase();

    // Extract AI/technology method keywords
    if (solutionText.includes('ai agent') || solutionText.includes('conversational ai')) {
      solutionKeywords.push('AI agent', 'conversational AI');
    }
    if (solutionText.includes('explainable ai') || solutionText.includes('transparent ai')) {
      solutionKeywords.push('explainable AI', 'transparent AI');
    }
    if (solutionText.includes('automation') || solutionText.includes('automated')) {
      solutionKeywords.push('automation', 'automated');
    }

    // Extract compliance/regulatory method keywords
    if (solutionText.includes('sox') || solutionText.includes('compliance') || solutionText.includes('audit')) {
      solutionKeywords.push('SOX compliance', 'audit automation');
    }
    if (solutionText.includes('regulatory') || solutionText.includes('regulation')) {
      solutionKeywords.push('regulatory technology', 'compliance platform');
    }

    // Extract delivery/platform method keywords
    if (solutionText.includes('platform') || solutionText.includes('system')) {
      solutionKeywords.push('platform', 'system');
    }
    if (solutionText.includes('software') || solutionText.includes('technology')) {
      solutionKeywords.push('software', 'technology');
    }
  }

  // PHASE 14F-E: Detect professional services across all profile types
  const isProfessionalServices =
    industryLower.includes('law') ||
    industryLower.includes('legal') ||
    industryLower.includes('accounting') ||
    industryLower.includes('consulting') ||
    industryLower.includes('financial advisor') ||
    industryLower.includes('medical') ||
    industryLower.includes('dental') ||
    industryLower.includes('architect');

  // PHASE 14F-E: Detect local service businesses
  const isLocalService =
    industryLower.includes('restaurant') ||
    industryLower.includes('salon') ||
    industryLower.includes('repair') ||
    industryLower.includes('cleaning') ||
    industryLower.includes('landscaping') ||
    industryLower.includes('contractor') ||
    industryLower.includes('plumb') ||
    industryLower.includes('hvac');

  // PHASE 14F-E: Detect e-commerce/product businesses
  const isEcommerce =
    industryLower.includes('ecommerce') ||
    industryLower.includes('e-commerce') ||
    industryLower.includes('online store') ||
    industryLower.includes('retail') ||
    industryLower.includes('shop') ||
    profileType === 'national-product';

  // Revenue/Sales outcomes
  if (['sales', 'revenue', 'generate', 'close', 'convert', 'monetize'].includes(outcomeVerb)) {
    // Professional Services: Client acquisition focus
    if (isProfessionalServices) {
      return 'client acquisition strategies case wins';
    }

    // E-commerce: Conversion optimization
    if (isEcommerce) {
      return 'conversion optimization sales funnel cart abandonment';
    }

    // Local Service: Customer acquisition
    if (isLocalService || profileType === 'local-b2c' || profileType === 'local-b2b') {
      return 'customer acquisition local marketing foot traffic';
    }

    // B2B SaaS/Insurance (Phase 14G-A: Solution method injection)
    if (industryLower.includes('insurance')) {
      const baseContext = 'sales automation lead generation';
      const solutionContext = solutionKeywords.length > 0
        ? solutionKeywords.slice(0, 2).join(' ')
        : 'AI agent';
      return `${solutionContext} ${baseContext}`;
    }
    if (industryLower.includes('software') || industryLower.includes('technology') || profileType === 'national-saas') {
      return 'sales acceleration revenue growth ARR';
    }

    // Regional/Agency: Sales pipeline
    if (profileType === 'regional-agency' || profileType === 'regional-retail') {
      return 'sales pipeline territory expansion market penetration';
    }

    return 'sales automation lead generation';
  }

  // Growth outcomes
  if (['grow', 'scale', 'expand', 'increase', 'boost', 'acquire'].includes(outcomeVerb)) {
    // Professional Services: Practice growth
    if (isProfessionalServices) {
      return 'practice growth client retention referral network';
    }

    // E-commerce: Traffic and retention
    if (isEcommerce) {
      return 'traffic growth customer retention repeat purchases';
    }

    // Local Service: Customer base expansion
    if (isLocalService || profileType === 'local-b2c' || profileType === 'local-b2b') {
      return 'customer growth reviews reputation word-of-mouth';
    }

    // B2B SaaS: User growth and adoption
    if (profileType === 'national-saas' || industryLower.includes('software')) {
      return 'user growth adoption expansion revenue scale ARR';
    }

    // Regional: Market expansion
    if (profileType === 'regional-agency' || profileType === 'regional-retail') {
      return 'market expansion territory growth multi-location scale';
    }

    // Industry-specific (existing logic)
    if (industryLower.includes('insurance')) {
      return 'insurance growth strategies book of business';
    }

    return 'business growth strategies customer acquisition';
  }

  // Efficiency outcomes
  if (['automate', 'streamline', 'optimize', 'improve', 'enhance', 'reduce'].includes(outcomeVerb)) {
    // Professional Services: Practice efficiency
    if (isProfessionalServices) {
      return 'practice efficiency billable hours workflow automation';
    }

    // E-commerce: Operations optimization
    if (isEcommerce) {
      return 'fulfillment efficiency inventory management order processing';
    }

    // Local Service: Operations streamlining
    if (isLocalService || profileType === 'local-b2c' || profileType === 'local-b2b') {
      return 'operations efficiency scheduling booking management';
    }

    // B2B SaaS: Workflow automation
    if (profileType === 'national-saas' || industryLower.includes('software')) {
      return 'workflow automation productivity efficiency tools';
    }

    // Regional: Multi-location efficiency
    if (profileType === 'regional-agency' || profileType === 'regional-retail') {
      return 'multi-location efficiency centralized operations standardization';
    }

    // Industry-specific (existing logic)
    if (industryLower.includes('insurance')) {
      return 'insurance automation efficiency underwriting';
    }

    return 'workflow automation efficiency operational excellence';
  }

  // Compliance outcomes (lowest priority by weight, but critical when mentioned by 8+ personas)
  if (['compliance', 'comply', 'audit', 'regulate', 'regulatory', 'certify', 'risk', 'maintain', 'pass'].includes(outcomeVerb)) {
    // Professional Services: Regulatory compliance
    if (isProfessionalServices) {
      return 'regulatory compliance certification professional standards audit requirements';
    }

    // Financial/Healthcare/Insurance: Strict compliance
    if (industryLower.includes('finance') || industryLower.includes('healthcare') || industryLower.includes('insurance')) {
      return 'regulatory audit compliance certification standards documentation requirements';
    }

    // Generic compliance context
    return 'compliance audit requirements regulatory standards certification governance';
  }

  // Brand outcomes
  if (['brand', 'trust', 'credibility'].includes(outcomeVerb)) {
    // Professional Services: Reputation and expertise
    if (isProfessionalServices) {
      return 'professional reputation expertise thought leadership';
    }

    // E-commerce: Brand trust and reviews
    if (isEcommerce) {
      return 'brand trust customer reviews social proof';
    }

    // Local Service: Local reputation
    if (isLocalService || profileType === 'local-b2c' || profileType === 'local-b2b') {
      return 'local reputation reviews testimonials community trust';
    }

    // B2B SaaS: Authority and credibility
    if (profileType === 'national-saas' || industryLower.includes('software')) {
      return 'brand authority case studies social proof credibility';
    }

    return 'brand trust reputation authority';
  }

  return '';
}

/**
 * Check if target customer indicates B2B business
 */
function isB2BTargetCustomer(customerStatement: string): boolean {
  const b2bIndicators = [
    'broker', 'agency', 'owner', 'professional', 'business', 'enterprise',
    'company', 'organization', 'team', 'consultant', 'manager', 'executive'
  ];

  return b2bIndicators.some(indicator =>
    customerStatement.toLowerCase().includes(indicator)
  );
}

/**
 * Check if B2B business is direct (target customers ARE end customers)
 * vs indirect (target customers sell to end customers)
 */
function isDirectB2B(customerStatement: string): boolean {
  // Direct B2B indicators - the target customer is the actual end user
  const directB2BIndicators = [
    'seeking', 'looking to', 'wanting to', 'modernize', 'improve', 'streamline',
    'scale', 'grow', 'automate', 'optimize', 'enhance', 'upgrade'
  ];

  // Indirect B2B indicators - target customer serves other customers
  const indirectB2BIndicators = [
    'serving', 'helping', 'providing to', 'selling to', 'clients of',
    'customers of', 'buyers through'
  ];

  const statement = customerStatement.toLowerCase();

  // Check for indirect indicators first (more specific)
  const hasIndirectIndicators = indirectB2BIndicators.some(indicator =>
    statement.includes(indicator)
  );

  if (hasIndirectIndicators) {
    return false; // Indirect B2B
  }

  // If direct indicators present, it's direct B2B
  const hasDirectIndicators = directB2BIndicators.some(indicator =>
    statement.includes(indicator)
  );

  // Default to direct B2B for most business customers
  return hasDirectIndicators || true;
}

/**
 * Extract end customer context for B2B query construction
 * Converts target customer to their customer's problems
 */
function extractEndCustomerContext(customerStatement: string, industry: string): string {
  // B2B industry mappings to end customer contexts
  const industryMappings: Record<string, string> = {
    'insurance': 'insurance buyers customers shopping for coverage',
    'real estate': 'home buyers sellers real estate customers',
    'automotive': 'car buyers auto customers vehicle shoppers',
    'healthcare': 'patients healthcare customers medical',
    'finance': 'financial services customers banking clients',
    'legal': 'legal clients law firm customers',
    'accounting': 'small business owners tax clients',
    'marketing': 'marketing clients business owners',
    'consulting': 'consulting clients business executives',
    'software': 'software users technology customers'
  };

  // Extract industry from target customer or industry field
  const targetLower = customerStatement.toLowerCase();
  const industryLower = industry.toLowerCase();

  for (const [industryKey, endCustomer] of Object.entries(industryMappings)) {
    if (targetLower.includes(industryKey) || industryLower.includes(industryKey)) {
      return endCustomer;
    }
  }

  // Default fallback: extract the industry and add "customers"
  const industryWords = customerStatement.match(/(\w+)\s+(broker|agent|owner|professional|consultant)/i);
  if (industryWords && industryWords[1]) {
    return `${industryWords[1]} customers buyers clients`;
  }

  // Final fallback
  return 'customers buyers clients shopping';
}

/**
 * SYNAPSE-V6: Load persisted outcomes for a brand
 * Retrieves customer outcomes from database if available
 * Used when rebuilding context from existing UVP session
 */
export async function loadPersistedOutcomes(brandId: string): Promise<DetectedOutcome[]> {
  try {
    const { outcomePersistenceService } = await import('./outcome-persistence.service');
    const { supabase } = await import('@/lib/supabase');

    // Find most recent UVP session for this brand
    const { data: sessionData } = await supabase
      .from('uvp_sessions')
      .select('id')
      .eq('brand_id', brandId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sessionData) {
      return [];
    }

    // Load outcomes from database
    const result = await outcomePersistenceService.loadOutcomesForSession(sessionData.id);

    if (result.success && result.outcomes) {
      return result.outcomes;
    }

    return [];
  } catch (error) {
    console.error('[UVPContextBuilder] Failed to load persisted outcomes:', error);
    return [];
  }
}

/**
 * SYNAPSE-V6: Build UVP context with persisted outcomes
 * Enhanced version that loads database outcomes if available
 */
export async function buildUVPContextWithOutcomes(
  uvp: CompleteUVP,
  brandId?: string
): Promise<UVPQueryContext> {
  // Build base context
  const baseContext = buildUVPContext(uvp);

  // Try to load persisted outcomes
  if (brandId) {
    try {
      const persistedOutcomes = await loadPersistedOutcomes(brandId);
      if (persistedOutcomes.length > 0) {
        return {
          ...baseContext,
          detectedOutcomes: persistedOutcomes,
        };
      }
    } catch (error) {
      console.warn('[UVPContextBuilder] Failed to load persisted outcomes (non-fatal):', error);
    }
  }

  // Fallback: detect outcomes on-the-fly
  const detectionResult = outcomeDetectionService.detectOutcomes(uvp);
  return {
    ...baseContext,
    detectedOutcomes: detectionResult.outcomes,
  };
}

// Export service
export const uvpContextBuilder = {
  buildUVPContext,
  buildUVPContextWithOutcomes,
  buildTabQuery,
  formatContextForPrompt,
  getQueryDepth,
  extractShortQuery,
  extractLocation,
  extractDomain,
  loadPersistedOutcomes,
};
