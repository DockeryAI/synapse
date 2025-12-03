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

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { InsightTab, BrandProfile } from './brand-profile.service';

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
}

/**
 * Build query context from UVP data
 */
export function buildUVPContext(uvp: CompleteUVP): UVPQueryContext {
  const { targetCustomer, keyBenefit, transformation, uniqueSolution } = uvp;

  // Extract customer context
  const customerContext = [
    targetCustomer?.primaryProfile,
    targetCustomer?.secondaryProfile,
    targetCustomer?.geographicFocus,
  ]
    .filter(Boolean)
    .join(', ');

  // Extract benefit context
  const benefitContext = [
    keyBenefit?.headline,
    keyBenefit?.supportingPoints?.join(', '),
  ]
    .filter(Boolean)
    .join(' - ');

  // Extract solution context
  const solutionContext = [
    uniqueSolution?.headline,
    uniqueSolution?.proofPoints?.join(', '),
  ]
    .filter(Boolean)
    .join(' - ');

  // Extract pain points from transformation
  const painPoints: string[] = [];
  if (transformation?.beforeState) {
    painPoints.push(transformation.beforeState);
  }
  if (transformation?.painPoints) {
    painPoints.push(...transformation.painPoints);
  }

  // Extract differentiators
  const differentiators: string[] = [];
  if (uniqueSolution?.differentiators) {
    differentiators.push(...uniqueSolution.differentiators);
  }
  if (keyBenefit?.proofPoints) {
    differentiators.push(...keyBenefit.proofPoints);
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

// Export service
export const uvpContextBuilder = {
  buildUVPContext,
  buildTabQuery,
  formatContextForPrompt,
  getQueryDepth,
};
