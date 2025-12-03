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
    // Priority 1: UVP target customer statement - extract the ROLE, not the company type
    if (uvp?.targetCustomer?.statement) {
      const statement = uvp.targetCustomer.statement;

      // Look for role patterns first (COO, CEO, VP, Director, Manager, etc.)
      // "Insurance agency COO/executive seeking..." -> "COO/executive"
      const roleMatch = statement.match(/\b(C[A-Z]O|CEO|CFO|COO|CTO|CIO|CMO|VP|Vice President|Director|Manager|Head of|Executive|Owner|Founder|Partner)\b[\/\w\s]*/i);
      if (roleMatch) {
        // Include context like "COO/executive" or "VP of Sales"
        const rolePhrase = roleMatch[0].trim();
        // Get surrounding industry context
        const industryMatch = statement.match(/\b(insurance|healthcare|fintech|saas|software|retail|banking|legal|accounting)\b/i);
        if (industryMatch) {
          return `${industryMatch[0]} ${rolePhrase}`;
        }
        return rolePhrase;
      }

      // Fallback: Look for buyer persona patterns like "enterprise buyers" or "SMB owners"
      const buyerMatch = statement.match(/\b(enterprise|SMB|small business|mid-market|startup)\s*(buyers?|customers?|companies|organizations?|teams?|leaders?)/i);
      if (buyerMatch) {
        return buyerMatch[0];
      }

      // Last resort: take first 60 chars but try to end at a word boundary
      const truncated = statement.substring(0, 60);
      const lastSpace = truncated.lastIndexOf(' ');
      return lastSpace > 30 ? truncated.substring(0, lastSpace) : truncated;
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
  // PHASE M: FULL UVP DATA EXTRACTION
  // ============================================================================

  /**
   * PHASE M: Extract ALL UVP components for comprehensive search queries
   * This is the key missing piece - we weren't using differentiators, benefits, products
   */
  extractFullUVPData(uvp?: CompleteUVP | null): {
    differentiators: string[];
    benefits: string[];
    products: string[];
    painPoints: string[];
    transformationBefore: string;
    transformationAfter: string;
    targetCustomer: string;
    functionalDrivers: string[];
    emotionalDrivers: string[];
  } {
    const result = {
      differentiators: [] as string[],
      benefits: [] as string[],
      products: [] as string[],
      painPoints: [] as string[],
      transformationBefore: '',
      transformationAfter: '',
      targetCustomer: '',
      functionalDrivers: [] as string[],
      emotionalDrivers: [] as string[],
    };

    if (!uvp) return result;

    // DIFFERENTIATORS - what makes us unique
    if (uvp.differentiators && Array.isArray(uvp.differentiators)) {
      result.differentiators = uvp.differentiators
        .map((d: any) => d.statement || d)
        .filter(Boolean)
        .slice(0, 5);
    }
    if (uvp.uniqueSolution?.statement) {
      result.differentiators.push(uvp.uniqueSolution.statement);
    }

    // BENEFITS - what customers get
    if (uvp.keyBenefit?.statement) {
      result.benefits.push(uvp.keyBenefit.statement);
    }
    if (uvp.benefits && Array.isArray(uvp.benefits)) {
      result.benefits.push(...uvp.benefits.map((b: any) => b.statement || b).filter(Boolean).slice(0, 5));
    }

    // PRODUCTS - what we sell
    if (uvp.whatYouDo) {
      const whatYouDo = typeof uvp.whatYouDo === 'string' ? uvp.whatYouDo : (uvp.whatYouDo as any)?.statement;
      if (whatYouDo) result.products.push(whatYouDo);
    }
    if (uvp.products && Array.isArray(uvp.products)) {
      result.products.push(...uvp.products.map((p: any) => p.name || p.statement || p).filter(Boolean).slice(0, 5));
    }

    // TRANSFORMATION - before/after states
    if (uvp.transformation?.statement) {
      result.transformationAfter = uvp.transformation.statement;
    }
    if (uvp.transformationGoal?.before) {
      result.transformationBefore = uvp.transformationGoal.before;
    }
    if (uvp.transformationGoal?.after) {
      result.transformationAfter = uvp.transformationGoal.after;
    }

    // TARGET CUSTOMER
    if (uvp.targetCustomer?.statement) {
      result.targetCustomer = uvp.targetCustomer.statement;
    }

    // DRIVERS - what motivates buyers
    if (uvp.targetCustomer?.emotionalDrivers) {
      result.emotionalDrivers = uvp.targetCustomer.emotionalDrivers.slice(0, 5);
    }
    if (uvp.targetCustomer?.functionalDrivers) {
      result.functionalDrivers = uvp.targetCustomer.functionalDrivers.slice(0, 5);
    }

    // Pain points = emotional drivers + transformation before state
    result.painPoints = [
      ...result.emotionalDrivers,
      result.transformationBefore,
    ].filter(Boolean);

    console.log('[QueryGenerator] PHASE M: Extracted full UVP data:', {
      differentiators: result.differentiators.length,
      benefits: result.benefits.length,
      products: result.products.length,
      painPoints: result.painPoints.length,
      functionalDrivers: result.functionalDrivers.length,
      emotionalDrivers: result.emotionalDrivers.length,
    });

    return result;
  }

  /**
   * PHASE M: Generate UVP-derived search queries for ALL source types
   * This replaces the generic pattern-based queries with UVP-specific ones
   */
  generateUVPDerivedQueries(uvp: CompleteUVP | null, profileType: BusinessProfileType): {
    differentiatorPainQueries: string[];  // Find people with pain our differentiators solve
    benefitDesireQueries: string[];       // Find people wanting what our benefits provide
    productProblemQueries: string[];      // Find people with problems our products solve
    transformationGapQueries: string[];   // Find people stuck in "before" state
    g2CapterraCategories: string[];       // Categories to search on review sites
    redditKeywords: string[];             // Keywords for Reddit search
    twitterKeywords: string[];            // Keywords for Twitter search
  } {
    const uvpData = this.extractFullUVPData(uvp);

    // DIFFERENTIATOR PAIN QUERIES
    // If differentiator is "Purpose-built for regulated industries with compliance focus"
    // Search: "compliance nightmare chatbot", "regulated industry AI problems"
    const differentiatorPainQueries = uvpData.differentiators.flatMap(diff => {
      const keywords = this.extractKeywords(diff);
      return [
        `"${keywords.slice(0, 3).join(' ')}" problems`,
        `frustrated with ${keywords[0] || 'software'}`,
        `why is ${keywords.slice(0, 2).join(' ')} so hard`,
      ];
    }).slice(0, 6);

    // BENEFIT DESIRE QUERIES
    // If benefit is "Measurable customer satisfaction improvement"
    // Search: "how to improve customer satisfaction", "need better customer satisfaction metrics"
    const benefitDesireQueries = uvpData.benefits.flatMap(benefit => {
      const keywords = this.extractKeywords(benefit);
      return [
        `how to ${keywords.slice(0, 3).join(' ')}`,
        `need to improve ${keywords[0] || 'results'}`,
        `looking for ${keywords.slice(0, 2).join(' ')} solution`,
      ];
    }).slice(0, 6);

    // PRODUCT PROBLEM QUERIES
    // If product is "AI Agent Management System"
    // Search: "AI agent management chaos", "managing multiple AI agents nightmare"
    const productProblemQueries = uvpData.products.flatMap(product => {
      const keywords = this.extractKeywords(product);
      return [
        `${keywords.slice(0, 2).join(' ')} problems`,
        `${keywords[0] || 'software'} not working`,
        `${keywords.slice(0, 2).join(' ')} frustrating`,
      ];
    }).slice(0, 6);

    // TRANSFORMATION GAP QUERIES
    // If before-state is "Manual customer service processes killing efficiency"
    // Search: "manual customer service taking too long", "can't scale customer service"
    const transformationGapQueries: string[] = [];
    if (uvpData.transformationBefore) {
      const beforeKeywords = this.extractKeywords(uvpData.transformationBefore);
      transformationGapQueries.push(
        `stuck with ${beforeKeywords.slice(0, 2).join(' ')}`,
        `${beforeKeywords[0] || 'manual'} process taking too long`,
        `can't scale ${beforeKeywords.slice(0, 2).join(' ')}`,
      );
    }

    // G2/CAPTERRA CATEGORIES - derived from product type
    const g2CapterraCategories = this.deriveReviewCategories(uvpData.products, profileType);

    // REDDIT KEYWORDS - combine differentiators + pain points
    const redditKeywords = [
      ...uvpData.differentiators.flatMap(d => this.extractKeywords(d).slice(0, 2)),
      ...uvpData.painPoints.flatMap(p => this.extractKeywords(p).slice(0, 2)),
    ].filter(Boolean).slice(0, 10);

    // TWITTER KEYWORDS - buyer role + industry + pain
    const twitterKeywords = [
      ...uvpData.functionalDrivers.flatMap(d => this.extractKeywords(d).slice(0, 2)),
      ...uvpData.emotionalDrivers.flatMap(d => this.extractKeywords(d).slice(0, 2)),
    ].filter(Boolean).slice(0, 10);

    console.log('[QueryGenerator] PHASE M: Generated UVP-derived queries:', {
      differentiatorPainQueries: differentiatorPainQueries.length,
      benefitDesireQueries: benefitDesireQueries.length,
      productProblemQueries: productProblemQueries.length,
      transformationGapQueries: transformationGapQueries.length,
      g2CapterraCategories,
      redditKeywords: redditKeywords.slice(0, 5),
      twitterKeywords: twitterKeywords.slice(0, 5),
    });

    return {
      differentiatorPainQueries,
      benefitDesireQueries,
      productProblemQueries,
      transformationGapQueries,
      g2CapterraCategories,
      redditKeywords,
      twitterKeywords,
    };
  }

  /**
   * Extract meaningful keywords from a statement (4+ chars, no stop words)
   */
  private extractKeywords(statement: string): string[] {
    if (!statement) return [];

    const stopWords = new Set([
      'that', 'this', 'with', 'have', 'from', 'they', 'been', 'will', 'would',
      'could', 'should', 'their', 'there', 'about', 'which', 'when', 'what',
      'your', 'more', 'than', 'into', 'also', 'them', 'most', 'just', 'over',
      'such', 'some', 'very', 'only', 'come', 'make', 'like', 'back', 'even',
      'want', 'give', 'well', 'need', 'take', 'help', 'work', 'first', 'built',
      'focused', 'seeking', 'looking', 'using', 'based', 'through', 'between',
    ]);

    return statement
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 4 && !stopWords.has(word))
      .slice(0, 10);
  }

  /**
   * Derive G2/Capterra categories from product descriptions
   */
  private deriveReviewCategories(products: string[], profileType: BusinessProfileType): string[] {
    const productText = products.join(' ').toLowerCase();
    const categories: string[] = [];

    // Map product keywords to G2 category slugs
    const categoryMappings: Array<{ keywords: string[]; category: string }> = [
      { keywords: ['ai agent', 'conversational ai', 'chatbot'], category: 'conversational-ai-platform' },
      { keywords: ['customer service', 'help desk', 'support'], category: 'help-desk-software' },
      { keywords: ['crm', 'customer relationship'], category: 'crm-software' },
      { keywords: ['marketing automation', 'email marketing'], category: 'marketing-automation-software' },
      { keywords: ['sales', 'sales automation'], category: 'sales-automation-software' },
      { keywords: ['insurance', 'claims', 'policy'], category: 'insurance-agency-management-software' },
      { keywords: ['accounting', 'bookkeeping'], category: 'accounting-software' },
      { keywords: ['project management', 'task'], category: 'project-management-software' },
      { keywords: ['hr', 'human resources', 'payroll'], category: 'hr-software' },
      { keywords: ['ecommerce', 'online store'], category: 'ecommerce-platforms' },
    ];

    for (const mapping of categoryMappings) {
      if (mapping.keywords.some(kw => productText.includes(kw))) {
        categories.push(mapping.category);
      }
    }

    // Fallback based on profile type
    if (categories.length === 0) {
      const profileCategoryMap: Record<string, string> = {
        'national-saas-b2b': 'business-software',
        'local-service-b2b': 'local-services',
        'local-service-b2c': 'local-services',
        'regional-b2b-agency': 'marketing-agencies',
        'regional-retail-b2c': 'retail',
        'national-product-b2c': 'consumer-products',
        'global-saas-b2b': 'enterprise-software',
      };
      categories.push(profileCategoryMap[profileType] || 'business-software');
    }

    return categories.slice(0, 3);
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
