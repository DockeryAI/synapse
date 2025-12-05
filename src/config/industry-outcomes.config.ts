/**
 * INDUSTRY OUTCOME CATEGORIES CONFIGURATION
 *
 * Industry-specific outcome categories for intelligent content generation.
 * Maps business profile types to measurable outcomes, API sources, and urgency triggers.
 *
 * Used by: Synapse V6 Content Pipeline, API Orchestrator, Trigger Synthesis
 * Created: 2025-12-04
 */

import type { BusinessProfileType } from '../types/specialty-profile.types';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface OutcomeCategory {
  /** Outcome category identifier */
  category: string;

  /** Human-readable description of the outcome */
  description: string;

  /** Priority weight (1-100, higher = more important) */
  priority: number;

  /** Keywords used to detect this outcome in content/data */
  keywords: string[];

  /** API sources that provide data for this outcome */
  apiSources: ApiSourceType[];

  /** Urgency triggers specific to this outcome */
  urgencyTriggers: string[];

  /** Peak season for this outcome (if applicable) */
  seasonalPeak?: string;
}

export type ApiSourceType =
  | 'serper-search'
  | 'serper-news'
  | 'reddit-conversations'
  | 'apify-reviews'
  | 'apify-trustpilot-reviews'
  | 'apify-g2-reviews'
  | 'outscraper-reviews'
  | 'apify-quora-insights'
  | 'linkedin-company'
  | 'apify-linkedin-b2b'
  | 'youtube-trending'
  | 'youtube-comments'
  | 'buzzsumo-performance'
  | 'apify-instagram'
  | 'apify-twitter-sentiment'
  | 'news-breaking'
  | 'weather-conditions'
  | 'apify-maps'
  | 'website-analysis'
  | 'competitor-voice';

export interface IndustryOutcomeConfig {
  /** Industry category identifier */
  industry: string;

  /** Business profile types this config applies to */
  profileTypes: BusinessProfileType[];

  /** Outcome categories for this industry */
  outcomes: OutcomeCategory[];

  /** Default priorities when auto-detecting outcomes */
  defaultPriorities: Record<string, number>;
}

// ============================================================================
// PROFESSIONAL SERVICES
// ============================================================================

export const PROFESSIONAL_SERVICES_OUTCOMES: IndustryOutcomeConfig = {
  industry: 'professional-services',
  profileTypes: ['local-service-b2b', 'regional-b2b-agency'],

  outcomes: [
    {
      category: 'increase-billable-hours',
      description: 'Increase client billable hours and utilization rates',
      priority: 90,
      keywords: [
        'billable hours',
        'utilization rate',
        'capacity',
        'client retention',
        'project pipeline',
        'recurring revenue',
      ],
      apiSources: [
        'linkedin-company',
        'apify-linkedin-b2b',
        'serper-search',
        'competitor-voice',
        'apify-g2-reviews',
      ],
      urgencyTriggers: [
        'Q4 budget planning season',
        'fiscal year ending',
        'competitor hiring announcements',
        'economic uncertainty mentions',
      ],
      seasonalPeak: 'Q4 (October-December)',
    },
    {
      category: 'reduce-client-acquisition-cost',
      description: 'Lower cost per client acquisition through referrals and inbound',
      priority: 85,
      keywords: [
        'referral rate',
        'CAC',
        'client acquisition cost',
        'inbound leads',
        'networking ROI',
        'thought leadership',
      ],
      apiSources: [
        'linkedin-company',
        'apify-linkedin-b2b',
        'buzzsumo-performance',
        'serper-search',
        'reddit-conversations',
      ],
      urgencyTriggers: [
        'referral network mentions',
        'speaking engagement announcements',
        'webinar registrations',
        'industry conference attendance',
      ],
      seasonalPeak: 'Q1-Q2 (January-June)',
    },
    {
      category: 'expand-service-portfolio',
      description: 'Add new service lines to existing client base',
      priority: 75,
      keywords: [
        'cross-sell',
        'upsell',
        'service expansion',
        'new offerings',
        'client growth',
        'revenue per client',
      ],
      apiSources: [
        'competitor-voice',
        'apify-g2-reviews',
        'serper-search',
        'linkedin-company',
        'reddit-conversations',
      ],
      urgencyTriggers: [
        'client feedback requests',
        'market shift announcements',
        'competitor service launches',
        'regulatory changes',
      ],
    },
    {
      category: 'improve-project-margins',
      description: 'Increase profitability through efficiency and value pricing',
      priority: 80,
      keywords: [
        'profit margin',
        'project efficiency',
        'value-based pricing',
        'scope creep',
        'time tracking',
        'project ROI',
      ],
      apiSources: [
        'serper-search',
        'apify-quora-insights',
        'reddit-conversations',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'pricing pressure mentions',
        'cost inflation',
        'talent shortage discussions',
        'automation opportunities',
      ],
    },
    {
      category: 'strengthen-thought-leadership',
      description: 'Build authority and premium positioning in market',
      priority: 70,
      keywords: [
        'thought leadership',
        'industry authority',
        'speaking opportunities',
        'media mentions',
        'award recognition',
        'premium pricing',
      ],
      apiSources: [
        'serper-news',
        'linkedin-company',
        'buzzsumo-performance',
        'apify-linkedin-b2b',
        'youtube-trending',
      ],
      urgencyTriggers: [
        'industry events approaching',
        'media requests',
        'award nomination deadlines',
        'content virality signals',
      ],
      seasonalPeak: 'Q2-Q3 (April-September)',
    },
  ],

  defaultPriorities: {
    'increase-billable-hours': 90,
    'reduce-client-acquisition-cost': 85,
    'expand-service-portfolio': 75,
    'improve-project-margins': 80,
    'strengthen-thought-leadership': 70,
  },
};

// ============================================================================
// LOCAL SERVICES
// ============================================================================

export const LOCAL_SERVICES_OUTCOMES: IndustryOutcomeConfig = {
  industry: 'local-services',
  profileTypes: ['local-service-b2c', 'local-service-b2b'],

  outcomes: [
    {
      category: 'increase-market-share',
      description: 'Capture higher percentage of local market demand',
      priority: 95,
      keywords: [
        'market share',
        'local dominance',
        'service area expansion',
        'competitor displacement',
        'neighborhood presence',
        'local SEO ranking',
      ],
      apiSources: [
        'apify-maps',
        'outscraper-reviews',
        'serper-search',
        'apify-reviews',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'competitor closures',
        'new construction projects',
        'local business changes',
        'seasonal demand spikes',
      ],
      seasonalPeak: 'Spring (March-May)',
    },
    {
      category: 'reduce-no-shows',
      description: 'Lower appointment no-show and cancellation rates',
      priority: 85,
      keywords: [
        'no-show rate',
        'appointment confirmation',
        'cancellation rate',
        'booking reminders',
        'customer reliability',
        'scheduling efficiency',
      ],
      apiSources: [
        'apify-reviews',
        'outscraper-reviews',
        'reddit-conversations',
        'serper-search',
      ],
      urgencyTriggers: [
        'high-demand period approaching',
        'weather disruptions',
        'holiday scheduling',
        'seasonal rush',
      ],
    },
    {
      category: 'seasonal-demand-management',
      description: 'Smooth revenue across seasonal fluctuations',
      priority: 80,
      keywords: [
        'seasonal revenue',
        'off-season strategies',
        'demand smoothing',
        'winter revenue',
        'summer bookings',
        'peak season capacity',
      ],
      apiSources: [
        'weather-conditions',
        'serper-search',
        'apify-maps',
        'reddit-conversations',
        'news-breaking',
      ],
      urgencyTriggers: [
        'seasonal transition approaching',
        'weather pattern changes',
        'holiday periods',
        'school calendar events',
      ],
      seasonalPeak: 'Varies by service type',
    },
    {
      category: 'improve-review-rating',
      description: 'Increase average star rating and review volume',
      priority: 90,
      keywords: [
        'star rating',
        'review count',
        'reputation score',
        'customer satisfaction',
        'negative review response',
        'testimonial collection',
      ],
      apiSources: [
        'outscraper-reviews',
        'apify-reviews',
        'apify-maps',
        'apify-trustpilot-reviews',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'negative review spike',
        'competitor rating changes',
        'major service event',
        'reputation crisis',
      ],
    },
    {
      category: 'expand-service-radius',
      description: 'Grow into adjacent neighborhoods and territories',
      priority: 75,
      keywords: [
        'service area',
        'territory expansion',
        'new neighborhoods',
        'mobile service',
        'geographic growth',
        'location expansion',
      ],
      apiSources: [
        'apify-maps',
        'serper-search',
        'outscraper-reviews',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'underserved area identified',
        'competitor exit from area',
        'new development announcements',
        'transportation route changes',
      ],
    },
    {
      category: 'increase-repeat-booking-rate',
      description: 'Turn one-time customers into recurring clients',
      priority: 85,
      keywords: [
        'repeat customer rate',
        'customer lifetime value',
        'retention rate',
        'membership programs',
        'loyalty rewards',
        'rebooking rate',
      ],
      apiSources: [
        'apify-reviews',
        'outscraper-reviews',
        'reddit-conversations',
        'serper-search',
      ],
      urgencyTriggers: [
        'first-visit completion',
        'service interval approaching',
        'customer anniversary',
        'seasonal maintenance due',
      ],
    },
  ],

  defaultPriorities: {
    'increase-market-share': 95,
    'reduce-no-shows': 85,
    'seasonal-demand-management': 80,
    'improve-review-rating': 90,
    'expand-service-radius': 75,
    'increase-repeat-booking-rate': 85,
  },
};

// ============================================================================
// E-COMMERCE / SAAS
// ============================================================================

export const ECOMMERCE_SAAS_OUTCOMES: IndustryOutcomeConfig = {
  industry: 'ecommerce-saas',
  profileTypes: ['national-saas-b2b', 'national-product-b2c', 'global-saas-b2b'],

  outcomes: [
    {
      category: 'increase-conversion-rate',
      description: 'Higher percentage of visitors to paying customers',
      priority: 95,
      keywords: [
        'conversion rate',
        'checkout completion',
        'trial-to-paid conversion',
        'signup rate',
        'landing page optimization',
        'funnel optimization',
      ],
      apiSources: [
        'buzzsumo-performance',
        'serper-search',
        'reddit-conversations',
        'apify-g2-reviews',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'conversion rate drop',
        'competitor pricing changes',
        'product launch timing',
        'seasonal shopping periods',
      ],
      seasonalPeak: 'Q4 (October-December) for B2C, Q1 for B2B',
    },
    {
      category: 'reduce-cart-abandonment',
      description: 'Lower shopping cart abandonment and checkout friction',
      priority: 90,
      keywords: [
        'cart abandonment',
        'checkout friction',
        'payment failure',
        'shipping concerns',
        'pricing objections',
        'trust signals',
      ],
      apiSources: [
        'apify-reviews',
        'reddit-conversations',
        'serper-search',
        'apify-trustpilot-reviews',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'abandoned cart spike',
        'mobile checkout issues',
        'shipping cost complaints',
        'competitor shipping offers',
      ],
    },
    {
      category: 'increase-customer-lifetime-value',
      description: 'Maximize revenue per customer over relationship',
      priority: 85,
      keywords: [
        'customer lifetime value',
        'CLV',
        'LTV',
        'retention rate',
        'churn rate',
        'upsell success',
        'cross-sell rate',
      ],
      apiSources: [
        'apify-g2-reviews',
        'apify-trustpilot-reviews',
        'reddit-conversations',
        'competitor-voice',
        'linkedin-company',
      ],
      urgencyTriggers: [
        'renewal period approaching',
        'usage pattern changes',
        'competitor feature announcements',
        'customer success milestones',
      ],
    },
    {
      category: 'reduce-customer-acquisition-cost',
      description: 'Lower cost per customer through organic and referrals',
      priority: 85,
      keywords: [
        'CAC',
        'customer acquisition cost',
        'paid vs organic',
        'referral rate',
        'viral coefficient',
        'organic growth',
      ],
      apiSources: [
        'buzzsumo-performance',
        'reddit-conversations',
        'apify-instagram',
        'apify-twitter-sentiment',
        'youtube-trending',
      ],
      urgencyTriggers: [
        'paid ad costs increasing',
        'organic traffic drop',
        'referral program launch',
        'viral content opportunity',
      ],
    },
    {
      category: 'improve-product-market-fit',
      description: 'Stronger alignment between product and customer needs',
      priority: 80,
      keywords: [
        'product-market fit',
        'feature adoption',
        'customer feedback',
        'use case validation',
        'ideal customer profile',
        'value realization',
      ],
      apiSources: [
        'apify-g2-reviews',
        'apify-trustpilot-reviews',
        'reddit-conversations',
        'apify-quora-insights',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'negative feedback patterns',
        'feature request clusters',
        'competitor feature gaps',
        'market shift signals',
      ],
    },
    {
      category: 'expand-average-order-value',
      description: 'Increase revenue per transaction through bundling and upsells',
      priority: 75,
      keywords: [
        'average order value',
        'AOV',
        'bundle sales',
        'upsell rate',
        'cross-sell success',
        'premium tier adoption',
      ],
      apiSources: [
        'serper-search',
        'buzzsumo-performance',
        'apify-reviews',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'promotional period',
        'inventory clearance',
        'new product launch',
        'seasonal shopping behavior',
      ],
      seasonalPeak: 'Black Friday/Cyber Monday',
    },
  ],

  defaultPriorities: {
    'increase-conversion-rate': 95,
    'reduce-cart-abandonment': 90,
    'increase-customer-lifetime-value': 85,
    'reduce-customer-acquisition-cost': 85,
    'improve-product-market-fit': 80,
    'expand-average-order-value': 75,
  },
};

// ============================================================================
// HEALTHCARE
// ============================================================================

export const HEALTHCARE_OUTCOMES: IndustryOutcomeConfig = {
  industry: 'healthcare',
  profileTypes: ['local-service-b2c', 'regional-b2b-agency'],

  outcomes: [
    {
      category: 'improve-patient-outcomes',
      description: 'Better health outcomes and patient satisfaction scores',
      priority: 100,
      keywords: [
        'patient outcomes',
        'treatment success rate',
        'recovery time',
        'patient satisfaction',
        'quality metrics',
        'health improvements',
      ],
      apiSources: [
        'apify-reviews',
        'outscraper-reviews',
        'serper-search',
        'apify-trustpilot-reviews',
        'news-breaking',
      ],
      urgencyTriggers: [
        'quality metric reporting',
        'patient satisfaction surveys',
        'regulatory compliance audits',
        'insurance reimbursement changes',
      ],
    },
    {
      category: 'reduce-administrative-burden',
      description: 'Lower paperwork and administrative overhead',
      priority: 85,
      keywords: [
        'administrative efficiency',
        'paperwork reduction',
        'EHR optimization',
        'billing accuracy',
        'staff productivity',
        'documentation time',
      ],
      apiSources: [
        'reddit-conversations',
        'apify-quora-insights',
        'serper-search',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'regulatory changes',
        'EHR system updates',
        'staffing shortages',
        'burnout reports',
      ],
    },
    {
      category: 'increase-compliance-adherence',
      description: 'Higher compliance with healthcare regulations and standards',
      priority: 95,
      keywords: [
        'HIPAA compliance',
        'regulatory compliance',
        'quality standards',
        'accreditation',
        'audit readiness',
        'documentation compliance',
      ],
      apiSources: [
        'serper-news',
        'news-breaking',
        'serper-search',
        'linkedin-company',
      ],
      urgencyTriggers: [
        'regulation updates',
        'audit announcements',
        'accreditation renewal',
        'compliance violations',
      ],
    },
    {
      category: 'reduce-patient-wait-times',
      description: 'Shorter wait times for appointments and procedures',
      priority: 80,
      keywords: [
        'wait time',
        'appointment availability',
        'scheduling efficiency',
        'patient throughput',
        'capacity optimization',
        'same-day appointments',
      ],
      apiSources: [
        'apify-reviews',
        'outscraper-reviews',
        'reddit-conversations',
        'apify-maps',
      ],
      urgencyTriggers: [
        'patient complaint patterns',
        'seasonal flu/illness spikes',
        'provider availability changes',
        'competitor wait time improvements',
      ],
      seasonalPeak: 'Fall/Winter (flu season)',
    },
    {
      category: 'improve-patient-retention',
      description: 'Higher patient retention and appointment completion rates',
      priority: 75,
      keywords: [
        'patient retention',
        'appointment completion',
        'follow-up adherence',
        'treatment plan compliance',
        'patient loyalty',
        'continuity of care',
      ],
      apiSources: [
        'apify-reviews',
        'outscraper-reviews',
        'serper-search',
        'reddit-conversations',
      ],
      urgencyTriggers: [
        'patient churn signals',
        'missed appointment patterns',
        'competitor service launches',
        'insurance network changes',
      ],
    },
  ],

  defaultPriorities: {
    'improve-patient-outcomes': 100,
    'reduce-administrative-burden': 85,
    'increase-compliance-adherence': 95,
    'reduce-patient-wait-times': 80,
    'improve-patient-retention': 75,
  },
};

// ============================================================================
// FINANCIAL SERVICES
// ============================================================================

export const FINANCIAL_SERVICES_OUTCOMES: IndustryOutcomeConfig = {
  industry: 'financial-services',
  profileTypes: ['local-service-b2c', 'regional-b2b-agency', 'national-saas-b2b'],

  outcomes: [
    {
      category: 'grow-assets-under-management',
      description: 'Increase total AUM through new clients and market performance',
      priority: 95,
      keywords: [
        'assets under management',
        'AUM growth',
        'client acquisition',
        'asset retention',
        'portfolio growth',
        'wealth accumulation',
      ],
      apiSources: [
        'linkedin-company',
        'apify-linkedin-b2b',
        'serper-search',
        'news-breaking',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'market volatility',
        'tax season planning',
        'retirement account deadlines',
        'estate planning events',
      ],
      seasonalPeak: 'Q1 (January-March) and Q4',
    },
    {
      category: 'reduce-compliance-costs',
      description: 'Lower regulatory compliance and reporting overhead',
      priority: 85,
      keywords: [
        'compliance cost',
        'regulatory overhead',
        'audit efficiency',
        'reporting automation',
        'risk management',
        'regulatory technology',
      ],
      apiSources: [
        'serper-news',
        'news-breaking',
        'linkedin-company',
        'apify-linkedin-b2b',
        'reddit-conversations',
      ],
      urgencyTriggers: [
        'regulation changes',
        'audit deadlines',
        'compliance violations',
        'technology opportunities',
      ],
    },
    {
      category: 'improve-client-reporting-experience',
      description: 'Better client communication and reporting satisfaction',
      priority: 75,
      keywords: [
        'client reporting',
        'transparency',
        'communication quality',
        'performance reporting',
        'client education',
        'digital experience',
      ],
      apiSources: [
        'apify-g2-reviews',
        'apify-trustpilot-reviews',
        'reddit-conversations',
        'competitor-voice',
        'serper-search',
      ],
      urgencyTriggers: [
        'quarterly reporting periods',
        'market downturn communication',
        'client feedback requests',
        'competitor platform launches',
      ],
    },
    {
      category: 'increase-client-referrals',
      description: 'Higher referral rate from existing satisfied clients',
      priority: 90,
      keywords: [
        'referral rate',
        'client advocacy',
        'word-of-mouth',
        'recommendation score',
        'network growth',
        'trust-based growth',
      ],
      apiSources: [
        'apify-reviews',
        'apify-trustpilot-reviews',
        'linkedin-company',
        'reddit-conversations',
        'serper-search',
      ],
      urgencyTriggers: [
        'client milestone achievements',
        'positive performance periods',
        'referral program launches',
        'relationship anniversaries',
      ],
    },
    {
      category: 'reduce-client-churn',
      description: 'Lower client attrition and account closures',
      priority: 85,
      keywords: [
        'client retention',
        'churn rate',
        'account closure',
        'relationship longevity',
        'client satisfaction',
        'service quality',
      ],
      apiSources: [
        'apify-reviews',
        'reddit-conversations',
        'competitor-voice',
        'serper-search',
      ],
      urgencyTriggers: [
        'market downturn periods',
        'competitor fee reductions',
        'service issue patterns',
        'client lifecycle events',
      ],
    },
  ],

  defaultPriorities: {
    'grow-assets-under-management': 95,
    'reduce-compliance-costs': 85,
    'improve-client-reporting-experience': 75,
    'increase-client-referrals': 90,
    'reduce-client-churn': 85,
  },
};

// ============================================================================
// MANUFACTURING
// ============================================================================

export const MANUFACTURING_OUTCOMES: IndustryOutcomeConfig = {
  industry: 'manufacturing',
  profileTypes: ['regional-b2b-agency', 'national-product-b2c'],

  outcomes: [
    {
      category: 'improve-operational-efficiency',
      description: 'Higher output per labor hour and reduced production costs',
      priority: 90,
      keywords: [
        'operational efficiency',
        'production throughput',
        'labor productivity',
        'cost per unit',
        'capacity utilization',
        'lean manufacturing',
      ],
      apiSources: [
        'linkedin-company',
        'serper-search',
        'news-breaking',
        'reddit-conversations',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'labor cost increases',
        'capacity constraints',
        'competitor automation',
        'efficiency benchmarking',
      ],
    },
    {
      category: 'reduce-waste-and-defects',
      description: 'Lower scrap rate and quality control failures',
      priority: 85,
      keywords: [
        'defect rate',
        'scrap reduction',
        'quality control',
        'first-pass yield',
        'rework rate',
        'six sigma',
      ],
      apiSources: [
        'serper-search',
        'reddit-conversations',
        'linkedin-company',
        'news-breaking',
      ],
      urgencyTriggers: [
        'quality issues detected',
        'material cost spikes',
        'customer complaints',
        'sustainability pressure',
      ],
    },
    {
      category: 'improve-supply-chain-reliability',
      description: 'More predictable supplier performance and inventory availability',
      priority: 95,
      keywords: [
        'supply chain reliability',
        'on-time delivery',
        'supplier performance',
        'inventory optimization',
        'lead time reduction',
        'stockout prevention',
      ],
      apiSources: [
        'serper-news',
        'news-breaking',
        'linkedin-company',
        'reddit-conversations',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'supplier disruptions',
        'material shortages',
        'logistics delays',
        'geopolitical events',
      ],
    },
    {
      category: 'reduce-downtime',
      description: 'Lower equipment downtime and maintenance interruptions',
      priority: 85,
      keywords: [
        'equipment uptime',
        'downtime reduction',
        'preventive maintenance',
        'MTBF',
        'MTTR',
        'reliability engineering',
      ],
      apiSources: [
        'serper-search',
        'reddit-conversations',
        'linkedin-company',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'equipment age milestones',
        'breakdown patterns',
        'maintenance windows',
        'production schedule pressure',
      ],
    },
    {
      category: 'expand-production-capacity',
      description: 'Ability to meet growing demand without proportional cost increase',
      priority: 80,
      keywords: [
        'capacity expansion',
        'scalability',
        'throughput increase',
        'bottleneck elimination',
        'production scheduling',
        'growth readiness',
      ],
      apiSources: [
        'serper-news',
        'linkedin-company',
        'news-breaking',
        'competitor-voice',
      ],
      urgencyTriggers: [
        'demand spike signals',
        'new contract wins',
        'competitor capacity announcements',
        'market growth trends',
      ],
    },
    {
      category: 'improve-sustainability-metrics',
      description: 'Better environmental performance and resource efficiency',
      priority: 70,
      keywords: [
        'sustainability',
        'carbon footprint',
        'energy efficiency',
        'waste reduction',
        'circular economy',
        'ESG compliance',
      ],
      apiSources: [
        'serper-news',
        'news-breaking',
        'linkedin-company',
        'reddit-conversations',
      ],
      urgencyTriggers: [
        'regulatory requirements',
        'customer sustainability demands',
        'ESG reporting deadlines',
        'energy cost increases',
      ],
    },
  ],

  defaultPriorities: {
    'improve-operational-efficiency': 90,
    'reduce-waste-and-defects': 85,
    'improve-supply-chain-reliability': 95,
    'reduce-downtime': 85,
    'expand-production-capacity': 80,
    'improve-sustainability-metrics': 70,
  },
};

// ============================================================================
// MASTER REGISTRY
// ============================================================================

/**
 * Complete registry of all industry outcome configurations
 */
export const INDUSTRY_OUTCOME_CONFIGS: Record<string, IndustryOutcomeConfig> = {
  'professional-services': PROFESSIONAL_SERVICES_OUTCOMES,
  'local-services': LOCAL_SERVICES_OUTCOMES,
  'ecommerce-saas': ECOMMERCE_SAAS_OUTCOMES,
  healthcare: HEALTHCARE_OUTCOMES,
  'financial-services': FINANCIAL_SERVICES_OUTCOMES,
  manufacturing: MANUFACTURING_OUTCOMES,
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get outcome config for a specific industry
 */
export function getOutcomeConfigForIndustry(industry: string): IndustryOutcomeConfig | undefined {
  return INDUSTRY_OUTCOME_CONFIGS[industry];
}

/**
 * Get outcome config for a business profile type
 */
export function getOutcomeConfigForProfileType(
  profileType: BusinessProfileType
): IndustryOutcomeConfig | undefined {
  return Object.values(INDUSTRY_OUTCOME_CONFIGS).find((config) =>
    config.profileTypes.includes(profileType)
  );
}

/**
 * Get all outcomes for a profile type
 */
export function getOutcomesForProfileType(profileType: BusinessProfileType): OutcomeCategory[] {
  const config = getOutcomeConfigForProfileType(profileType);
  return config?.outcomes || [];
}

/**
 * Get top N priority outcomes for a profile type
 */
export function getTopOutcomes(
  profileType: BusinessProfileType,
  count: number = 3
): OutcomeCategory[] {
  const outcomes = getOutcomesForProfileType(profileType);
  return outcomes.sort((a, b) => b.priority - a.priority).slice(0, count);
}

/**
 * Get API sources needed for specific outcomes
 */
export function getApiSourcesForOutcomes(outcomes: OutcomeCategory[]): ApiSourceType[] {
  const sources = new Set<ApiSourceType>();
  outcomes.forEach((outcome) => {
    outcome.apiSources.forEach((source) => sources.add(source));
  });
  return Array.from(sources);
}

/**
 * Get urgency triggers for specific outcomes
 */
export function getUrgencyTriggersForOutcomes(outcomes: OutcomeCategory[]): string[] {
  const triggers = new Set<string>();
  outcomes.forEach((outcome) => {
    outcome.urgencyTriggers.forEach((trigger) => triggers.add(trigger));
  });
  return Array.from(triggers);
}

/**
 * Match outcome from text keywords
 */
export function matchOutcomeFromKeywords(
  profileType: BusinessProfileType,
  text: string
): OutcomeCategory | undefined {
  const outcomes = getOutcomesForProfileType(profileType);
  const lowerText = text.toLowerCase();

  // Find outcome with most keyword matches
  let bestMatch: OutcomeCategory | undefined;
  let maxMatches = 0;

  for (const outcome of outcomes) {
    const matches = outcome.keywords.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = outcome;
    }
  }

  return maxMatches >= 2 ? bestMatch : undefined; // Require at least 2 keyword matches
}

/**
 * Get all available industries
 */
export function getAllIndustries(): string[] {
  return Object.keys(INDUSTRY_OUTCOME_CONFIGS);
}

/**
 * Get all supported profile types
 */
export function getAllSupportedProfileTypes(): BusinessProfileType[] {
  const types = new Set<BusinessProfileType>();
  Object.values(INDUSTRY_OUTCOME_CONFIGS).forEach((config) => {
    config.profileTypes.forEach((type) => types.add(type));
  });
  return Array.from(types);
}
