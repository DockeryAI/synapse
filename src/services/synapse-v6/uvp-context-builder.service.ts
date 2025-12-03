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
 */
export function extractShortQuery(
  uvp: CompleteUVP,
  tab: InsightTab
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

  // Tab-specific keyword additions - V1 approach: Focus on business signals, not just emotions
  switch (tab) {
    case 'voc':
      // V1 B2B FIX: Search for business signals and buying triggers
      if (isB2BTargetCustomer(customerStatement)) {
        if (isDirectB2B(customerStatement)) {
          // Direct B2B: Target customers ARE the end customers - search for buying signals
          // Example: OpenDialog sells TO brokers (brokers are the customers)
          keywords.push('looking for', 'need', 'solution', 'software', 'tool');
        } else {
          // Indirect B2B: Target customers sell to end customers - search end customer problems
          // Example: Selling through brokers to their customers
          const endCustomerContext = extractEndCustomerContext(customerStatement, industry);
          keywords.length = 0;
          keywords.push(...endCustomerContext.split(' '));
          keywords.push('shopping', 'buying', 'need', 'looking for');
        }
      } else {
        // B2C: Voice of Customer = customer needs, desires, buying signals
        keywords.push('looking for', 'need', 'want', 'reviews');
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
  return query.length > 100 ? query.substring(0, 97) + '...' : query;
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

// Export service
export const uvpContextBuilder = {
  buildUVPContext,
  buildTabQuery,
  formatContextForPrompt,
  getQueryDepth,
  extractShortQuery,
  extractLocation,
  extractDomain,
};
