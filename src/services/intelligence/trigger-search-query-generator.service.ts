/**
 * Trigger Search Query Generator Service
 *
 * Generates psychology-focused search queries from UVP data instead of brand name.
 * Produces queries that find customer fears, frustrations, desires, and objections.
 *
 * Works across all 6 business profile categories:
 * 1. Local Service B2B (Commercial HVAC, IT services)
 * 2. Local Service B2C (Dental, salon, restaurant)
 * 3. Regional B2B Agency (Marketing, accounting, consulting)
 * 4. Regional Retail B2C (Multi-location retail, franchise)
 * 5. National SaaS B2B (OpenDialog-type)
 * 6. National Product B2C (Consumer brand, manufacturer)
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from '@/services/triggers';

// ============================================================================
// TYPES
// ============================================================================

export interface TriggerSearchQueries {
  // Primary psychology queries
  fearQueries: string[];
  frustrationQueries: string[];
  desireQueries: string[];
  objectionQueries: string[];

  // Competitor displacement queries
  competitorDisplacementQueries: string[];

  // Trigger event queries (Phase C addition)
  triggerEventQueries: string[];
  highIntentQueries: string[];
  seasonalQueries: string[];

  // Platform-specific queries
  redditQueries: string[];
  quoraQueries: string[];
  reviewQueries: string[];
  linkedinQueries: string[];

  // Metadata
  targetCustomer: string;
  industry: string;
  profileType: BusinessProfileType;
}

export interface QueryGeneratorInput {
  uvp?: CompleteUVP | null;
  brand?: {
    name: string;
    industry?: string;
    website?: string;
    targetCustomers?: string;
    competitors?: string[];
  };
  profileType: BusinessProfileType;
}

// ============================================================================
// PROFILE-SPECIFIC QUERY PATTERNS
// ============================================================================

// Competitor displacement query patterns per profile
const COMPETITOR_DISPLACEMENT_PATTERNS: Record<BusinessProfileType, string[]> = {
  'local-service-b2b': [
    'switching {industry} provider',
    'contract ending {industry} looking for alternative',
    'unhappy with current {industry} company',
    'better {industry} vendor than current',
    '{industry} provider not reliable anymore',
  ],
  'local-service-b2c': [
    'switching from my {industry}',
    'looking for new {industry} provider',
    'left my {industry} because',
    'moving need new {industry}',
    'disappointed with {industry} want change',
  ],
  'regional-b2b-agency': [
    'switching {industry} agency',
    'firing our {industry} agency',
    '{industry} agency not delivering results',
    'looking to replace {industry} partner',
    'RFP new {industry} agency',
  ],
  'regional-retail-b2c': [
    'stopped shopping at {product} store',
    'better alternative to {product} store',
    '{product} store closed where to buy now',
    'switching from {product} brand',
  ],
  'national-saas-b2b': [
    'migrating from {competitor} to',
    'switching from {competitor} alternative',
    '{competitor} pricing increased looking for alternative',
    '{competitor} getting acquired moving to',
    'outgrew {competitor} need enterprise solution',
  ],
  'national-product-b2c': [
    'used to buy {competitor} now trying',
    '{competitor} quality declined switching to',
    'better alternative to {competitor}',
    'disappointed with {competitor} recommendations',
  ],
  'global-saas-b2b': [
    'migrating from {competitor} enterprise',
    '{competitor} compliance issues switching',
    '{competitor} doesn\'t support {region} data residency',
    'enterprise looking beyond {competitor}',
    '{competitor} support in {region} is poor',
  ],
};

// ============================================================================
// PROFILE-SPECIFIC TRIGGER EVENT PATTERNS
// ============================================================================

// High-intent trigger events that indicate buying readiness per profile
const PROFILE_TRIGGER_EVENT_PATTERNS: Record<BusinessProfileType, {
  triggerEvents: string[];
  highIntentSignals: string[];
  seasonalTriggers: string[];
}> = {
  'local-service-b2b': {
    triggerEvents: [
      '{industry} equipment failure what to do',
      '{industry} system broke down emergency',
      'compliance deadline {industry} need help',
      '{industry} contract ending renewal',
      '{industry} service agreement expires soon',
      'building inspection {industry} failed',
      'insurance requires {industry} certification',
    ],
    highIntentSignals: [
      'need {industry} by end of week',
      'urgent {industry} request',
      'emergency {industry} service same day',
      '{industry} quote comparison',
    ],
    seasonalTriggers: [
      '{industry} maintenance before winter',
      'annual {industry} inspection due',
      'budget cycle {industry} vendor',
    ],
  },

  'local-service-b2c': {
    triggerEvents: [
      'bad {industry} experience need new',
      'moving to new area need {industry}',
      'just moved where to find {industry}',
      'current {industry} closed down',
      '{industry} appointment cancelled last minute',
      'life event need {industry} recommendation',
      'wedding coming up need {industry}',
    ],
    highIntentSignals: [
      'looking for {industry} asap',
      'need {industry} this week',
      'emergency {industry} near me',
      'accepting new patients {industry}',
    ],
    seasonalTriggers: [
      '{industry} before holidays',
      'summer {industry} appointments',
      'back to school {industry}',
    ],
  },

  'regional-b2b-agency': {
    triggerEvents: [
      'new CMO looking to change {industry} agency',
      'leadership change reviewing {industry} vendors',
      'RFP {industry} agency deadline',
      'budget approved for {industry} agency',
      'quarterly review {industry} performance',
      'board wants new {industry} approach',
      'fired our {industry} agency now what',
    ],
    highIntentSignals: [
      'RFP {industry} agency 2024',
      'shortlist {industry} agencies',
      'agency pitch {industry} next quarter',
      '{industry} agency contract negotiation',
    ],
    seasonalTriggers: [
      'Q4 budget planning {industry}',
      'new fiscal year {industry} agency',
      'annual {industry} strategy review',
    ],
  },

  'regional-retail-b2c': {
    triggerEvents: [
      '{product} store near me closed',
      'where to buy {product} locally',
      '{product} out of stock everywhere',
      '{product} price drop alert',
      'holiday shopping {product} deals',
      '{product} gift ideas where to buy',
    ],
    highIntentSignals: [
      'need {product} today pickup',
      '{product} in stock near me',
      'buy {product} same day',
      '{product} price match local',
    ],
    seasonalTriggers: [
      'black friday {product} deals',
      'back to school {product} shopping',
      'holiday {product} gift guide',
    ],
  },

  'national-saas-b2b': {
    triggerEvents: [
      'just raised funding need {industry} platform',
      'hiring surge need {industry} tool',
      'scaling team {industry} software required',
      'tech stack modernization {industry}',
      'M&A integration {industry} platform',
      'SOC2 compliance {industry} vendor',
      'current {industry} not scaling',
    ],
    highIntentSignals: [
      '{industry} demo request',
      '{industry} pricing enterprise',
      '{industry} implementation timeline',
      'migrating to {industry} from competitor',
    ],
    seasonalTriggers: [
      'Q4 {industry} procurement',
      'budget renewal {industry} software',
      'annual license negotiation {industry}',
    ],
  },

  'national-product-b2c': {
    triggerEvents: [
      '{product} went viral on tiktok',
      'influencer recommended {product}',
      '{product} vs {competitor} comparison',
      '{product} amazon review analysis',
      '{product} dupe alternative cheaper',
      '{product} restock alert',
      'trending {product} where to buy',
    ],
    highIntentSignals: [
      'should I buy {product}',
      '{product} worth the price',
      '{product} discount code',
      'best time to buy {product}',
    ],
    seasonalTriggers: [
      'prime day {product} deals',
      'cyber monday {product}',
      '{product} gift guide holiday',
    ],
  },

  'global-saas-b2b': {
    triggerEvents: [
      'GDPR compliance {industry} vendor',
      'data residency requirements {industry}',
      'global rollout {industry} platform',
      'multi-region deployment {industry}',
      'enterprise {industry} RFP global',
      'consolidating {industry} vendors worldwide',
      'Gartner magic quadrant {industry}',
    ],
    highIntentSignals: [
      '{industry} enterprise demo EMEA',
      'global {industry} procurement',
      '{industry} compliance audit vendor',
      '{industry} vendor security assessment',
    ],
    seasonalTriggers: [
      'fiscal year end {industry} Europe',
      'global budget planning {industry}',
      'annual vendor review {industry}',
    ],
  },
};

const PROFILE_QUERY_PATTERNS: Record<BusinessProfileType, {
  fearPatterns: string[];
  frustrationPatterns: string[];
  desirePatterns: string[];
  platformPrefixes: Record<string, string>;
}> = {
  'local-service-b2b': {
    fearPatterns: [
      '{customer} afraid of {industry} company not showing up',
      '{customer} worried about {industry} contractor reliability',
      'fear of hiring wrong {industry} vendor',
      '{industry} service provider nightmare stories',
    ],
    frustrationPatterns: [
      '{customer} frustrated with {industry} response time',
      'why is it so hard to find reliable {industry}',
      '{industry} companies never call back',
      'bad experience with commercial {industry}',
    ],
    desirePatterns: [
      'looking for reliable {industry} near me',
      'need {industry} company that actually responds',
      'want {industry} vendor with guarantees',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: '',
      linkedin: 'site:linkedin.com',
    },
  },

  'local-service-b2c': {
    fearPatterns: [
      'afraid of {industry} going wrong',
      'worried about bad {industry} experience',
      '{industry} horror stories',
      'scared to try new {industry}',
    ],
    frustrationPatterns: [
      'frustrated with {industry} wait times',
      'why is {industry} so expensive',
      'hate when {industry} cancels appointments',
      '{industry} customer service terrible',
    ],
    desirePatterns: [
      'looking for good {industry} near me',
      'need {industry} that accepts walk-ins',
      'want affordable {industry} with good reviews',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: 'reviews',
      linkedin: '',
    },
  },

  'regional-b2b-agency': {
    fearPatterns: [
      'afraid of hiring wrong {industry} agency',
      '{customer} worried about {industry} ROI',
      'fear of {industry} agency not delivering',
      '{industry} agency red flags',
    ],
    frustrationPatterns: [
      'frustrated with {industry} agency communication',
      '{industry} agency overpromised underdelivered',
      'why do {industry} agencies miss deadlines',
      '{industry} consultant wasted our budget',
    ],
    desirePatterns: [
      'looking for {industry} agency with proven results',
      'need {industry} partner not vendor',
      'want {industry} agency that understands our industry',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: 'clutch.co OR g2.com',
      linkedin: 'site:linkedin.com',
    },
  },

  'regional-retail-b2c': {
    fearPatterns: [
      'afraid of buying {product} online',
      'worried about {product} quality from new store',
      'fear of {product} returns being difficult',
      '{product} delivery problems',
    ],
    frustrationPatterns: [
      'frustrated with {product} availability',
      'why is {product} always out of stock',
      '{product} shipping took forever',
      'bad experience with {industry} store',
    ],
    desirePatterns: [
      'looking for {product} with same-day pickup',
      'need {product} store with good return policy',
      'want {product} with price match guarantee',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: 'reviews',
      linkedin: '',
    },
  },

  'national-saas-b2b': {
    fearPatterns: [
      '{customer} fear of vendor lock-in {industry}',
      '{customer} worried about {industry} implementation failure',
      '{industry} platform security concerns',
      'afraid of {industry} tool complexity',
    ],
    frustrationPatterns: [
      '{customer} frustrated with {industry} integrations',
      'why do {industry} platforms have poor support',
      '{industry} software promised automation but still manual',
      '{industry} tool learning curve too steep',
    ],
    desirePatterns: [
      '{customer} looking for {industry} with easy onboarding',
      'need {industry} platform that actually integrates',
      'want {industry} tool with real ROI metrics',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: 'site:g2.com OR site:capterra.com',
      linkedin: 'site:linkedin.com',
    },
  },

  'national-product-b2c': {
    fearPatterns: [
      'afraid {product} is not worth the price',
      'worried about {product} quality issues',
      '{product} returns nightmare',
      'scared to buy {product} online',
    ],
    frustrationPatterns: [
      'frustrated with {product} durability',
      '{product} broke after {time}',
      'why is {product} customer service so bad',
      '{product} not as advertised',
    ],
    desirePatterns: [
      'looking for {product} that actually lasts',
      'need {product} with good warranty',
      'want {product} alternative to {competitor}',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: 'site:amazon.com/review OR site:trustpilot.com',
      linkedin: '',
    },
  },

  'global-saas-b2b': {
    fearPatterns: [
      '{customer} fear of vendor lock-in with {industry}',
      '{customer} worried about {industry} compliance GDPR',
      '{industry} platform data residency concerns',
      'afraid of {industry} implementation disrupting operations',
    ],
    frustrationPatterns: [
      '{customer} frustrated with {industry} automation rates',
      'why do {industry} platforms overpromise',
      '{industry} chatbot can\'t handle complex queries',
      '{industry} vendor has no industry expertise',
    ],
    desirePatterns: [
      '{customer} looking for {industry} with open architecture',
      'need {industry} platform with audit trails',
      'want {industry} that understands enterprise compliance',
    ],
    platformPrefixes: {
      reddit: 'site:reddit.com',
      quora: 'site:quora.com',
      reviews: 'site:g2.com OR site:gartner.com',
      linkedin: 'site:linkedin.com',
    },
  },
};

// ============================================================================
// SERVICE
// ============================================================================

class TriggerSearchQueryGeneratorService {
  /**
   * Generate all search queries for finding psychological triggers
   */
  generateQueries(input: QueryGeneratorInput): TriggerSearchQueries {
    const { uvp, brand, profileType } = input;

    // Extract context from UVP or brand
    const targetCustomer = this.extractTargetCustomer(uvp, brand);
    const industry = this.extractIndustry(uvp, brand);
    const painPoints = this.extractPainPoints(uvp);
    const competitors = brand?.competitors || [];

    console.log('[QueryGenerator] Generating queries for:', {
      profileType,
      targetCustomer,
      industry,
      painPoints: painPoints.length,
    });

    const patterns = PROFILE_QUERY_PATTERNS[profileType] || PROFILE_QUERY_PATTERNS['national-saas-b2b'];

    // Generate psychology queries
    const fearQueries = this.expandPatterns(patterns.fearPatterns, {
      customer: targetCustomer,
      industry,
      product: industry,
    });

    const frustrationQueries = this.expandPatterns(patterns.frustrationPatterns, {
      customer: targetCustomer,
      industry,
      product: industry,
      time: '6 months',
    });

    const desireQueries = this.expandPatterns(patterns.desirePatterns, {
      customer: targetCustomer,
      industry,
      product: industry,
      competitor: competitors[0] || 'leading brand',
    });

    // Add pain-point specific queries
    const objectionQueries = painPoints.map(pain =>
      `"${targetCustomer}" hesitant about "${pain}"`
    );

    // Generate competitor displacement queries
    const displacementPatterns = COMPETITOR_DISPLACEMENT_PATTERNS[profileType] || COMPETITOR_DISPLACEMENT_PATTERNS['national-saas-b2b'];
    const competitorDisplacementQueries = this.expandPatterns(displacementPatterns, {
      industry,
      product: industry,
      competitor: competitors[0] || 'leading solution',
      region: 'Europe', // Default region for global queries
    });

    // Generate trigger event queries (Phase C addition)
    const triggerEventConfig = PROFILE_TRIGGER_EVENT_PATTERNS[profileType] || PROFILE_TRIGGER_EVENT_PATTERNS['national-saas-b2b'];
    const triggerEventQueries = this.expandPatterns(triggerEventConfig.triggerEvents, {
      industry,
      product: industry,
      competitor: competitors[0] || 'leading brand',
    });

    const highIntentQueries = this.expandPatterns(triggerEventConfig.highIntentSignals, {
      industry,
      product: industry,
    });

    const seasonalQueries = this.expandPatterns(triggerEventConfig.seasonalTriggers, {
      industry,
      product: industry,
    });

    // Platform-specific queries
    const redditQueries = [
      ...fearQueries.slice(0, 2).map(q => `${patterns.platformPrefixes.reddit} ${q}`),
      ...frustrationQueries.slice(0, 2).map(q => `${patterns.platformPrefixes.reddit} ${q}`),
      `${patterns.platformPrefixes.reddit} ${industry} complaints`,
      `${patterns.platformPrefixes.reddit} ${industry} frustrating`,
    ];

    const quoraQueries = [
      `${patterns.platformPrefixes.quora} why is ${industry} so difficult`,
      `${patterns.platformPrefixes.quora} best ${industry} for ${targetCustomer}`,
      `${patterns.platformPrefixes.quora} ${industry} problems`,
    ];

    const reviewQueries = [
      `${patterns.platformPrefixes.reviews} ${industry} negative reviews`,
      `${patterns.platformPrefixes.reviews} ${industry} "not recommend"`,
      `${patterns.platformPrefixes.reviews} ${industry} disappointed`,
    ];

    const linkedinQueries = patterns.platformPrefixes.linkedin ? [
      `${patterns.platformPrefixes.linkedin} ${industry} challenges ${targetCustomer}`,
      `${patterns.platformPrefixes.linkedin} ${industry} trends problems`,
    ] : [];

    return {
      fearQueries,
      frustrationQueries,
      desireQueries,
      objectionQueries,
      competitorDisplacementQueries,
      triggerEventQueries,
      highIntentQueries,
      seasonalQueries,
      redditQueries,
      quoraQueries,
      reviewQueries,
      linkedinQueries,
      targetCustomer,
      industry,
      profileType,
    };
  }

  /**
   * Get a single merged query string for Perplexity
   */
  getPerplexityContext(input: QueryGeneratorInput): string {
    const queries = this.generateQueries(input);

    return `
Target Customer: ${queries.targetCustomer}
Industry: ${queries.industry}
Profile Type: ${queries.profileType}

Find customer psychology (fears, frustrations, desires) for this audience.
Search patterns to use:
- Fears: ${queries.fearQueries.slice(0, 3).join(', ')}
- Frustrations: ${queries.frustrationQueries.slice(0, 3).join(', ')}
- Desires: ${queries.desireQueries.slice(0, 3).join(', ')}
- Competitor Displacement: ${queries.competitorDisplacementQueries.slice(0, 3).join(', ')}
- Trigger Events: ${queries.triggerEventQueries.slice(0, 3).join(', ')}
- High Intent Signals: ${queries.highIntentQueries.slice(0, 3).join(', ')}
    `.trim();
  }

  // ============================================================================
  // EXTRACTORS
  // ============================================================================

  private extractTargetCustomer(uvp?: CompleteUVP | null, brand?: QueryGeneratorInput['brand']): string {
    // Priority 1: UVP target customer statement
    if (uvp?.targetCustomer?.statement) {
      // Extract key noun phrase from statement
      const statement = uvp.targetCustomer.statement;
      // "Enterprise companies with 500+ employees" -> "Enterprise companies"
      const match = statement.match(/^([A-Za-z]+\s+[A-Za-z]+)/);
      if (match) return match[1];
      return statement.substring(0, 50);
    }

    // Priority 2: Brand target customers field
    if (brand?.targetCustomers) {
      return brand.targetCustomers;
    }

    // Priority 3: Derive from industry
    if (brand?.industry) {
      return `${brand.industry} buyers`;
    }

    return 'business decision makers';
  }

  private extractIndustry(uvp?: CompleteUVP | null, brand?: QueryGeneratorInput['brand']): string {
    // Priority 1: Brand industry (most reliable)
    if (brand?.industry) {
      return brand.industry;
    }

    // Priority 2: Extract from UVP statement (e.g., "AI-powered customer service platform")
    if (uvp?.uniqueSolution?.statement) {
      // Try to extract industry keywords from the statement
      const statement = uvp.uniqueSolution.statement.toLowerCase();
      const industryKeywords = ['saas', 'software', 'platform', 'service', 'consulting', 'marketing', 'healthcare', 'fintech', 'retail'];
      for (const keyword of industryKeywords) {
        if (statement.includes(keyword)) {
          return keyword;
        }
      }
    }

    return 'business services';
  }

  private extractPainPoints(uvp?: CompleteUVP | null): string[] {
    const painPoints: string[] = [];

    // From target customer emotional drivers
    if (uvp?.targetCustomer?.emotionalDrivers) {
      painPoints.push(...uvp.targetCustomer.emotionalDrivers.slice(0, 3));
    }

    // From transformation "before" state
    if (uvp?.transformationGoal?.before) {
      painPoints.push(uvp.transformationGoal.before);
    }

    return painPoints;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private expandPatterns(patterns: string[], variables: Record<string, string>): string[] {
    return patterns.map(pattern => {
      let expanded = pattern;
      Object.entries(variables).forEach(([key, value]) => {
        expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
      return expanded;
    });
  }
}

// Export singleton
export const triggerSearchQueryGenerator = new TriggerSearchQueryGeneratorService();
