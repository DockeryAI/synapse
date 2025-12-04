/**
 * National Signals Service
 *
 * Specialized signal processing for national/global business profiles:
 * - National SaaS B2B (Project management tools, CRM, HR software)
 * - National Product B2C (Consumer brands, D2C, e-commerce)
 * - Global SaaS B2B (International SaaS with EMEA/APAC presence)
 *
 * Phase 3: Profile-Specific Pipelines - National Profiles
 *
 * Key Features:
 * 1. G2/Capterra deep integration for software reviews
 * 2. Churn signal detection and prediction
 * 3. Integration ecosystem mapping
 * 4. Social proof aggregation
 * 5. Tech stack analysis
 * 6. Global compliance considerations (GDPR, SOC2, ISO)
 *
 * Created: 2025-12-01
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';
import { recencyCalculatorService, type RecencyResult } from './recency-calculator.service';
import { competitorAttributionService, type CompetitorMention } from './competitor-attribution.service';
import { smbClassifierService, type CompanySize, type BudgetRange } from './smb-classifier.service';
import { urgencyDetectorService, type UrgencyLevel } from './urgency-detector.service';

// ============================================================================
// TYPES
// ============================================================================

export type NationalSignalType =
  | 'churn-signal'
  | 'switching-intent'
  | 'feature-comparison'
  | 'integration-request'
  | 'pricing-discussion'
  | 'negative-review'
  | 'positive-review'
  | 'competitor-complaint'
  | 'trial-conversion'
  | 'product-launch'
  | 'funding-announcement'
  | 'tech-stack-change'
  | 'compliance-need'
  | 'social-proof-request';

export type ReviewPlatformType = 'g2' | 'capterra' | 'trustradius' | 'gartner' | 'trustpilot' | 'producthunt';

export interface TechStack {
  category: string;
  tools: string[];
  integrationOpportunities: string[];
}

export interface NationalSignal {
  id: string;
  type: NationalSignalType;
  source: string;
  platform?: ReviewPlatformType;
  content: string;
  timestamp: Date;
  author?: string;
  authorCompanySize?: CompanySize;
  authorIndustry?: string;
  url?: string;
  metadata?: NationalSignalMetadata;
}

export interface NationalSignalMetadata {
  rating?: number; // 1-5 for reviews
  reviewHelpfulVotes?: number;
  companySize?: string;
  industry?: string;
  useCase?: string;
  competitorMentioned?: string[];
  integrationsDiscussed?: string[];
  pricingTier?: string;
  contractType?: 'monthly' | 'annual' | 'multi-year';
  churnRiskFactors?: string[];
  socialProofType?: SocialProofType;
  complianceRequirements?: string[];
}

export type SocialProofType =
  | 'case-study'
  | 'testimonial'
  | 'review'
  | 'analyst-report'
  | 'award'
  | 'certification'
  | 'influencer-mention'
  | 'press-coverage';

export interface ChurnSignal {
  type: 'explicit' | 'implicit' | 'competitive' | 'sentiment';
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'near-term' | 'future';
  competitorContext?: string;
}

export interface IntegrationEcosystem {
  category: string;
  popularIntegrations: string[];
  integrationRequests: string[];
  competitiveAdvantage: boolean;
}

export interface NationalSignalResult {
  signal: NationalSignal;
  score: number;
  recencyScore: number;
  platformCredibility: number;
  churnSignal?: ChurnSignal;
  integrationOpportunity?: IntegrationEcosystem;
  urgencyLevel: UrgencyLevel;
  companySize?: CompanySize;
  budgetRange?: BudgetRange;
  competitorAttribution?: CompetitorMention;
  actionableInsight: string;
  recommendedTactic: string;
  conversionPotential: 'low' | 'medium' | 'high' | 'very-high';
}

export interface MarketIntelligence {
  totalSignals: number;
  signalsByType: Record<NationalSignalType, number>;
  topCompetitors: CompetitorIntelligence[];
  churnIndicators: ChurnIndicator[];
  integrationDemand: IntegrationDemand[];
  pricingSentiment: PricingSentiment;
  marketTrends: string[];
}

export interface CompetitorIntelligence {
  name: string;
  mentionCount: number;
  sentimentScore: number; // -1 to 1
  churnFromCount: number;
  churnToCount: number;
  commonComplaints: string[];
}

export interface ChurnIndicator {
  factor: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  affectedSegments: string[];
}

export interface IntegrationDemand {
  integration: string;
  requestCount: number;
  urgency: 'low' | 'medium' | 'high';
  competitorOffering: boolean;
}

export interface PricingSentiment {
  overallScore: number; // -1 to 1
  commonConcerns: string[];
  valuePerception: 'poor' | 'fair' | 'good' | 'excellent';
  comparisonToCompetitors: 'cheaper' | 'similar' | 'expensive' | 'premium';
}

export interface NationalProcessingConfig {
  profileType: 'national-saas-b2b' | 'national-product-b2c' | 'global-saas-b2b';
  priorityPlatforms: ReviewPlatformType[];
  churnDetection: boolean;
  integrationTracking: boolean;
  competitorList?: string[];
  techStackCategories?: string[];
  targetIndustries?: string[];
  complianceRequirements?: string[];
}

// ============================================================================
// CHURN PATTERNS
// ============================================================================

const CHURN_PATTERNS = {
  explicit: [
    /cancel(?:l?ing|l?ed)?\s+(?:our|my|the)?\s*(?:subscription|account|plan)/i,
    /(?:not|won't|wont)\s+(?:be\s+)?renew(?:ing)?/i,
    /end(?:ing)?\s+(?:our|my)\s+(?:subscription|contract|relationship)/i,
    /(?:leaving|left|switching|switched)\s+(?:from)?\s*\[?(?:product|service|platform)\]?/i
  ],
  implicit: [
    /(?:too|very)\s+(?:expensive|costly|pricey)/i,
    /(?:not\s+worth|overpriced|waste\s+of\s+money)/i,
    /(?:looking\s+for|need|want)\s+(?:better|different|cheaper)\s+(?:alternative|option|solution)/i,
    /(?:frustrat|disappoint|annoyed)\s+(?:with|by)/i,
    /(?:support|customer\s+service)\s+(?:is|was)\s+(?:terrible|awful|unresponsive|slow)/i
  ],
  competitive: [
    /switch(?:ed|ing)?\s+to\s+[A-Z][a-z]+/i,
    /(?:moved|moving|migrated|migrating)\s+to\s+[A-Z][a-z]+/i,
    /[A-Z][a-z]+\s+(?:is|was)\s+(?:better|cheaper|easier)/i,
    /(?:tried|trying|considering)\s+[A-Z][a-z]+\s+(?:instead|now)/i
  ],
  sentiment: [
    /(?:hate|loathe|despise|can't\s+stand)/i,
    /(?:worst|terrible|horrible|awful)\s+(?:product|service|experience)/i,
    /(?:never|wouldn't|would\s+not)\s+recommend/i,
    /(?:regret|mistake)\s+(?:using|buying|choosing)/i
  ]
};

// Churn risk severity indicators
const CHURN_SEVERITY_INDICATORS = {
  critical: [
    /already\s+(?:cancelled|switched|left)/i,
    /our\s+last\s+(?:month|day|week)/i,
    /(?:final|last)\s+straw/i
  ],
  high: [
    /actively\s+(?:looking|searching|evaluating)/i,
    /(?:will|going\s+to)\s+(?:cancel|switch|leave)/i,
    /unless\s+(?:you|they)\s+(?:fix|improve)/i
  ],
  medium: [
    /(?:considering|thinking\s+about)\s+(?:switching|cancelling|leaving)/i,
    /(?:might|may)\s+(?:switch|cancel|leave)/i,
    /(?:comparing|looking\s+at)\s+alternatives/i
  ],
  low: [
    /(?:wish|hope)\s+(?:they|you)\s+(?:would|could)/i,
    /(?:minor|small)\s+(?:issues?|problems?|concerns?)/i
  ]
};

// Integration ecosystem mapping
const INTEGRATION_ECOSYSTEMS: Record<string, IntegrationEcosystem> = {
  'crm': {
    category: 'CRM',
    popularIntegrations: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Microsoft Dynamics'],
    integrationRequests: [],
    competitiveAdvantage: true
  },
  'marketing': {
    category: 'Marketing Automation',
    popularIntegrations: ['Mailchimp', 'Marketo', 'Pardot', 'ActiveCampaign', 'Klaviyo'],
    integrationRequests: [],
    competitiveAdvantage: true
  },
  'analytics': {
    category: 'Analytics',
    popularIntegrations: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Segment', 'Heap'],
    integrationRequests: [],
    competitiveAdvantage: false
  },
  'communication': {
    category: 'Communication',
    popularIntegrations: ['Slack', 'Microsoft Teams', 'Zoom', 'Discord', 'Intercom'],
    integrationRequests: [],
    competitiveAdvantage: false
  },
  'productivity': {
    category: 'Productivity',
    popularIntegrations: ['Notion', 'Asana', 'Monday.com', 'Trello', 'Jira'],
    integrationRequests: [],
    competitiveAdvantage: false
  },
  'ecommerce': {
    category: 'E-commerce',
    popularIntegrations: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'Amazon'],
    integrationRequests: [],
    competitiveAdvantage: true
  },
  'payment': {
    category: 'Payment',
    popularIntegrations: ['Stripe', 'PayPal', 'Square', 'Braintree', 'Adyen'],
    integrationRequests: [],
    competitiveAdvantage: false
  },
  'data': {
    category: 'Data/ETL',
    popularIntegrations: ['Zapier', 'Make', 'Workato', 'Fivetran', 'Airbyte'],
    integrationRequests: [],
    competitiveAdvantage: false
  }
};

// Platform credibility scores
const PLATFORM_CREDIBILITY: Record<ReviewPlatformType, number> = {
  'g2': 1.0,
  'gartner': 1.0,
  'capterra': 0.9,
  'trustradius': 0.85,
  'trustpilot': 0.75,
  'producthunt': 0.7
};

// Default configurations
const DEFAULT_CONFIGS: Record<
  'national-saas-b2b' | 'national-product-b2c' | 'global-saas-b2b',
  NationalProcessingConfig
> = {
  'national-saas-b2b': {
    profileType: 'national-saas-b2b',
    priorityPlatforms: ['g2', 'capterra', 'trustradius'],
    churnDetection: true,
    integrationTracking: true,
    techStackCategories: ['crm', 'marketing', 'productivity', 'data']
  },
  'national-product-b2c': {
    profileType: 'national-product-b2c',
    priorityPlatforms: ['trustpilot', 'producthunt'],
    churnDetection: true,
    integrationTracking: false,
    techStackCategories: ['ecommerce', 'marketing']
  },
  'global-saas-b2b': {
    profileType: 'global-saas-b2b',
    priorityPlatforms: ['g2', 'gartner', 'capterra', 'trustradius'],
    churnDetection: true,
    integrationTracking: true,
    techStackCategories: ['crm', 'communication', 'data', 'analytics'],
    complianceRequirements: ['GDPR', 'SOC2', 'ISO27001', 'HIPAA']
  }
};

// Signal type patterns
const NATIONAL_SIGNAL_PATTERNS: Record<NationalSignalType, RegExp[]> = {
  'churn-signal': CHURN_PATTERNS.explicit,
  'switching-intent': [
    /(?:switch|migrate|move)\s+(?:from|to)/i,
    /(?:looking|searching)\s+for\s+(?:alternative|replacement)/i,
    /(?:evaluating|considering|comparing)\s+(?:options|alternatives)/i
  ],
  'feature-comparison': [
    /(?:compare|comparison|vs\.?|versus)\s+[A-Z][a-z]+/i,
    /(?:which|what)\s+(?:is|one\s+is)\s+better/i,
    /(?:pros?\s+(?:and|&)\s+cons?|advantages?\s+(?:and|&)\s+disadvantages?)/i
  ],
  'integration-request': [
    /(?:integrate|integration|connect)\s+(?:with|to)\s+[A-Z][a-z]+/i,
    /(?:does|can)\s+(?:it|this)\s+(?:work|integrate)\s+with/i,
    /(?:need|want|looking\s+for)\s+[A-Z][a-z]+\s+integration/i
  ],
  'pricing-discussion': [
    /(?:how\s+much|what|pricing|cost|price)/i,
    /(?:expensive|cheap|affordable|worth\s+it)/i,
    /(?:free\s+(?:trial|plan|tier)|freemium)/i,
    /(?:discount|coupon|deal|offer)/i
  ],
  'negative-review': [
    /(?:1|2)\s+(?:star|\/5)/i,
    /(?:terrible|awful|worst|horrible|bad)\s+(?:experience|product|service)/i,
    /(?:do\s+not|don't|wouldn't)\s+recommend/i
  ],
  'positive-review': [
    /(?:4|5)\s+(?:star|\/5)/i,
    /(?:love|excellent|amazing|great|best)\s+(?:experience|product|service)/i,
    /(?:highly|strongly|definitely)\s+recommend/i
  ],
  'competitor-complaint': [
    /(?:hate|awful|terrible)\s+[A-Z][a-z]+/i,
    /[A-Z][a-z]+\s+(?:sucks|is\s+terrible|is\s+awful)/i,
    /(?:frustrated|disappointed)\s+with\s+[A-Z][a-z]+/i
  ],
  'trial-conversion': [
    /(?:trial|demo|pilot|poc)\s+(?:experience|period|ended)/i,
    /(?:after|during)\s+(?:the\s+)?trial/i,
    /(?:convert|upgrade|subscribe)\s+(?:from|after)\s+(?:free|trial)/i
  ],
  'product-launch': [
    /(?:just\s+)?(?:launched|released|announced)\s+(?:new\s+)?(?:feature|product|version)/i,
    /(?:new|latest)\s+(?:feature|update|release|version)/i,
    /(?:coming\s+soon|roadmap|planned)/i
  ],
  'funding-announcement': [
    /(?:raised|secured|closed)\s+\$?\d+(?:M|million|B|billion)/i,
    /(?:series\s+[A-Z]|seed|pre-seed)\s+(?:round|funding)/i,
    /(?:valuation|valued\s+at)\s+\$?\d+/i
  ],
  'tech-stack-change': [
    /(?:migrat|switch|mov)(?:ed|ing)\s+(?:from|to)\s+[A-Z][a-z]+/i,
    /(?:replaced|replacing)\s+[A-Z][a-z]+\s+with/i,
    /(?:stack|tech\s+stack|tooling)\s+(?:change|update)/i
  ],
  'compliance-need': [
    /(?:gdpr|soc\s*2|iso\s*27001|hipaa|ccpa|pci)\s+(?:compliant|compliance|certified)/i,
    /(?:data\s+)?(?:privacy|security|compliance)\s+(?:requirements?|needs?)/i,
    /(?:audit|certification|attestation)\s+(?:ready|report)/i
  ],
  'social-proof-request': [
    /(?:case\s+study|testimonial|reference|proof)\s+(?:available|needed)/i,
    /(?:who\s+else|other\s+(?:companies|customers))\s+(?:use|using)/i,
    /(?:reviews?|ratings?|reputation)/i
  ]
};

// ============================================================================
// SERVICE
// ============================================================================

class NationalSignalsService {
  /**
   * Get default configuration for a national profile type
   */
  getDefaultConfig(
    profileType: 'national-saas-b2b' | 'national-product-b2c' | 'global-saas-b2b'
  ): NationalProcessingConfig {
    return { ...DEFAULT_CONFIGS[profileType] };
  }

  /**
   * Process a raw signal for national context
   */
  processSignal(
    content: string,
    source: string,
    timestamp: Date = new Date(),
    config?: Partial<NationalProcessingConfig>
  ): NationalSignalResult {
    const fullConfig = {
      ...DEFAULT_CONFIGS['national-saas-b2b'],
      ...config
    };

    // Detect signal type
    const signalType = this.detectSignalType(content);

    // Detect platform
    const platform = this.detectPlatform(source);

    // Classify company size and budget
    const smbClassification = smbClassifierService.classifyFromContent({
      content,
      source,
      hasCompanyIndicators: /company|business|organization|enterprise|startup/i.test(content),
      hasBudgetIndicators: /budget|price|cost|plan|tier/i.test(content)
    });

    // Build the signal object
    const signal: NationalSignal = {
      id: `national-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: signalType,
      source,
      platform,
      content,
      timestamp,
      authorCompanySize: smbClassification.companySize.size,
      metadata: this.extractMetadata(content, signalType, fullConfig)
    };

    // Calculate scores
    const recencyResult = recencyCalculatorService.calculateRecency(timestamp, 'review');
    const platformCredibility = platform ? (PLATFORM_CREDIBILITY[platform] || 0.7) : 0.6;

    // Detect churn signal if enabled
    let churnSignal: ChurnSignal | undefined;
    if (fullConfig.churnDetection) {
      churnSignal = this.detectChurnSignal(content);
    }

    // Detect integration opportunity if enabled
    let integrationOpportunity: IntegrationEcosystem | undefined;
    if (fullConfig.integrationTracking) {
      integrationOpportunity = this.detectIntegrationOpportunity(content);
    }

    // Check for competitor mentions
    let competitorAttribution: CompetitorMention | undefined;
    if (fullConfig.competitorList?.length) {
      const mentions = competitorAttributionService.findMentionsInContent(
        content,
        fullConfig.competitorList
      );
      if (mentions.length > 0) {
        competitorAttribution = mentions[0];
      }
    }

    // Detect urgency
    const urgencyAnalysis = urgencyDetectorService.detectUrgency({
      content,
      source,
      timestamp,
      hasCompetitorMention: !!competitorAttribution,
      hasPricingDiscussion: signalType === 'pricing-discussion',
      hasNegativeSentiment: ['negative-review', 'competitor-complaint', 'churn-signal'].includes(signalType),
      authorRole: undefined
    });

    // Calculate composite score
    let score = recencyResult.score * platformCredibility;

    // Boost for high-value signals
    if (['churn-signal', 'switching-intent', 'competitor-complaint'].includes(signalType)) {
      score *= 1.4;
    }

    // Boost for critical churn signals
    if (churnSignal?.severity === 'critical' || churnSignal?.severity === 'high') {
      score *= 1.3;
    }

    // Boost for high-value enterprise signals
    if (smbClassification.companySize.size === 'enterprise') {
      score *= 1.25;
    }

    // Determine conversion potential
    const conversionPotential = this.assessConversionPotential(
      signal,
      churnSignal,
      competitorAttribution,
      smbClassification.companySize.size
    );

    // Generate actionable insight
    const { insight, tactic } = this.generateActionableInsight(
      signal,
      churnSignal,
      competitorAttribution,
      urgencyAnalysis.level,
      conversionPotential
    );

    return {
      signal,
      score: Math.min(1, score),
      recencyScore: recencyResult.score,
      platformCredibility,
      churnSignal,
      integrationOpportunity,
      urgencyLevel: urgencyAnalysis.level,
      companySize: smbClassification.companySize.size,
      budgetRange: smbClassification.budget.range,
      competitorAttribution,
      actionableInsight: insight,
      recommendedTactic: tactic,
      conversionPotential
    };
  }

  /**
   * Process multiple signals and return sorted by score
   */
  processSignals(
    signals: Array<{
      content: string;
      source: string;
      timestamp?: Date;
    }>,
    config?: Partial<NationalProcessingConfig>
  ): NationalSignalResult[] {
    return signals
      .map(s => this.processSignal(s.content, s.source, s.timestamp, config))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Detect churn signal in content
   */
  detectChurnSignal(content: string): ChurnSignal | undefined {
    let detectedType: ChurnSignal['type'] | null = null;
    const indicators: string[] = [];

    // Check each churn pattern type
    for (const [type, patterns] of Object.entries(CHURN_PATTERNS)) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          detectedType = type as ChurnSignal['type'];
          indicators.push(match[0]);
        }
      }
    }

    if (!detectedType || indicators.length === 0) {
      return undefined;
    }

    // Determine severity
    let severity: ChurnSignal['severity'] = 'low';
    for (const [sev, patterns] of Object.entries(CHURN_SEVERITY_INDICATORS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          severity = sev as ChurnSignal['severity'];
          break;
        }
      }
      if (severity !== 'low') break;
    }

    // Determine timeframe
    let timeframe: ChurnSignal['timeframe'] = 'future';
    if (/already|just|today|yesterday|last\s+week/i.test(content)) {
      timeframe = 'immediate';
    } else if (/soon|next\s+(?:month|week)|planning\s+to|going\s+to/i.test(content)) {
      timeframe = 'near-term';
    }

    // Extract competitor context
    const competitorMatch = content.match(/(?:switch|move|migrate)\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    const competitorContext = competitorMatch ? competitorMatch[1] : undefined;

    return {
      type: detectedType,
      indicators: [...new Set(indicators)],
      severity,
      timeframe,
      competitorContext
    };
  }

  /**
   * Detect integration opportunity in content
   */
  detectIntegrationOpportunity(content: string): IntegrationEcosystem | undefined {
    const contentLower = content.toLowerCase();

    for (const [category, ecosystem] of Object.entries(INTEGRATION_ECOSYSTEMS)) {
      // Check if any integration from this ecosystem is mentioned
      const mentionedIntegrations = ecosystem.popularIntegrations.filter(
        integration => contentLower.includes(integration.toLowerCase())
      );

      if (mentionedIntegrations.length > 0) {
        // Check if it's a request/need pattern
        const isRequest = /(?:need|want|looking\s+for|integrate|connect)/i.test(content);

        return {
          ...ecosystem,
          integrationRequests: isRequest ? mentionedIntegrations : []
        };
      }
    }

    return undefined;
  }

  /**
   * Generate market intelligence from signals
   */
  generateMarketIntelligence(signals: NationalSignalResult[]): MarketIntelligence {
    const signalsByType: Record<NationalSignalType, number> = {
      'churn-signal': 0,
      'switching-intent': 0,
      'feature-comparison': 0,
      'integration-request': 0,
      'pricing-discussion': 0,
      'negative-review': 0,
      'positive-review': 0,
      'competitor-complaint': 0,
      'trial-conversion': 0,
      'product-launch': 0,
      'funding-announcement': 0,
      'tech-stack-change': 0,
      'compliance-need': 0,
      'social-proof-request': 0
    };

    const competitorData: Record<string, CompetitorIntelligence> = {};
    const churnFactors: Record<string, ChurnIndicator> = {};
    const integrationRequests: Record<string, IntegrationDemand> = {};
    let pricingPositive = 0;
    let pricingNegative = 0;
    const pricingConcerns: string[] = [];
    const marketTrends: string[] = [];

    for (const result of signals) {
      signalsByType[result.signal.type]++;

      // Track competitor intelligence
      if (result.competitorAttribution) {
        const comp = result.competitorAttribution.matchedCompetitor;
        if (!competitorData[comp]) {
          competitorData[comp] = {
            name: comp,
            mentionCount: 0,
            sentimentScore: 0,
            churnFromCount: 0,
            churnToCount: 0,
            commonComplaints: []
          };
        }
        competitorData[comp].mentionCount++;

        // Track sentiment
        if (result.signal.type === 'competitor-complaint' || result.signal.type === 'negative-review') {
          competitorData[comp].sentimentScore -= 0.2;
          competitorData[comp].churnFromCount++;
        } else if (result.churnSignal?.competitorContext === comp) {
          competitorData[comp].churnToCount++;
        }
      }

      // Track churn factors
      if (result.churnSignal) {
        for (const indicator of result.churnSignal.indicators) {
          const key = indicator.toLowerCase();
          if (!churnFactors[key]) {
            churnFactors[key] = {
              factor: indicator,
              frequency: 0,
              severity: result.churnSignal.severity,
              affectedSegments: []
            };
          }
          churnFactors[key].frequency++;
          if (result.companySize) {
            churnFactors[key].affectedSegments.push(result.companySize);
          }
        }
      }

      // Track integration demands
      if (result.integrationOpportunity) {
        for (const integration of result.integrationOpportunity.integrationRequests) {
          if (!integrationRequests[integration]) {
            integrationRequests[integration] = {
              integration,
              requestCount: 0,
              urgency: 'low',
              competitorOffering: false
            };
          }
          integrationRequests[integration].requestCount++;
          if (result.urgencyLevel === 'immediate' || result.urgencyLevel === 'active') {
            integrationRequests[integration].urgency = 'high';
          }
        }
      }

      // Track pricing sentiment
      if (result.signal.type === 'pricing-discussion') {
        if (/expensive|overpriced|costly|too\s+much/i.test(result.signal.content)) {
          pricingNegative++;
          const concerns = result.signal.content.match(
            /(?:too|very)\s+(?:expensive|costly|pricey)|not\s+worth|overpriced/gi
          );
          if (concerns) pricingConcerns.push(...concerns);
        } else if (/affordable|fair|good\s+value|worth\s+it/i.test(result.signal.content)) {
          pricingPositive++;
        }
      }

      // Extract market trends
      if (['product-launch', 'funding-announcement', 'tech-stack-change'].includes(result.signal.type)) {
        marketTrends.push(result.signal.type);
      }
    }

    // Calculate pricing sentiment score
    const totalPricing = pricingPositive + pricingNegative;
    const pricingScore = totalPricing > 0
      ? (pricingPositive - pricingNegative) / totalPricing
      : 0;

    const valuePerception: PricingSentiment['valuePerception'] =
      pricingScore >= 0.5 ? 'excellent' :
      pricingScore >= 0 ? 'good' :
      pricingScore >= -0.5 ? 'fair' : 'poor';

    return {
      totalSignals: signals.length,
      signalsByType,
      topCompetitors: Object.values(competitorData)
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 10),
      churnIndicators: Object.values(churnFactors)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
      integrationDemand: Object.values(integrationRequests)
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10),
      pricingSentiment: {
        overallScore: pricingScore,
        commonConcerns: [...new Set(pricingConcerns)].slice(0, 5),
        valuePerception,
        comparisonToCompetitors: pricingScore >= 0 ? 'similar' : 'expensive'
      },
      marketTrends: [...new Set(marketTrends)]
    };
  }

  /**
   * Get signals by churn severity
   */
  filterByChurnSeverity(
    signals: NationalSignalResult[],
    minSeverity: ChurnSignal['severity'] = 'medium'
  ): NationalSignalResult[] {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);

    return signals.filter(result => {
      if (!result.churnSignal) return false;
      return severityOrder.indexOf(result.churnSignal.severity) >= minIndex;
    });
  }

  /**
   * Get signals by company size
   */
  filterByCompanySize(
    signals: NationalSignalResult[],
    sizes: CompanySize[]
  ): NationalSignalResult[] {
    return signals.filter(result =>
      result.companySize && sizes.includes(result.companySize)
    );
  }

  /**
   * Get all integration ecosystems
   */
  getAllIntegrationEcosystems(): Record<string, IntegrationEcosystem> {
    return { ...INTEGRATION_ECOSYSTEMS };
  }

  /**
   * Get platform credibility scores
   */
  getPlatformCredibility(): Record<ReviewPlatformType, number> {
    return { ...PLATFORM_CREDIBILITY };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private detectSignalType(content: string): NationalSignalType {
    for (const [signalType, patterns] of Object.entries(NATIONAL_SIGNAL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return signalType as NationalSignalType;
        }
      }
    }

    return 'feature-comparison'; // Default
  }

  private detectPlatform(source: string): ReviewPlatformType | undefined {
    const sourceLower = source.toLowerCase();

    if (sourceLower.includes('g2')) return 'g2';
    if (sourceLower.includes('capterra')) return 'capterra';
    if (sourceLower.includes('trustradius')) return 'trustradius';
    if (sourceLower.includes('gartner')) return 'gartner';
    if (sourceLower.includes('trustpilot')) return 'trustpilot';
    if (sourceLower.includes('producthunt') || sourceLower.includes('product hunt')) return 'producthunt';

    return undefined;
  }

  private extractMetadata(
    content: string,
    signalType: NationalSignalType,
    config: NationalProcessingConfig
  ): NationalSignalMetadata {
    const metadata: NationalSignalMetadata = {};

    // Extract rating
    const ratingMatch = content.match(/(\d(?:\.\d)?)\s*(?:\/\s*5|stars?|out\s+of\s+5)/i);
    if (ratingMatch) {
      metadata.rating = parseFloat(ratingMatch[1]);
    }

    // Extract company size
    const sizePatterns: Record<string, RegExp> = {
      'SMB': /(?:small|smb|small\s+business|startup)/i,
      'Mid-Market': /(?:mid-?market|medium|growing)/i,
      'Enterprise': /(?:enterprise|large|fortune\s+500)/i
    };
    for (const [size, pattern] of Object.entries(sizePatterns)) {
      if (pattern.test(content)) {
        metadata.companySize = size;
        break;
      }
    }

    // Extract competitors mentioned
    if (config.competitorList?.length) {
      const mentioned = config.competitorList.filter(comp =>
        content.toLowerCase().includes(comp.toLowerCase())
      );
      if (mentioned.length > 0) {
        metadata.competitorMentioned = mentioned;
      }
    }

    // Extract integrations discussed
    const allIntegrations = Object.values(INTEGRATION_ECOSYSTEMS)
      .flatMap(eco => eco.popularIntegrations);
    const discussed = allIntegrations.filter(int =>
      content.toLowerCase().includes(int.toLowerCase())
    );
    if (discussed.length > 0) {
      metadata.integrationsDiscussed = discussed;
    }

    // Extract pricing tier
    const tierMatch = content.match(
      /(?:free|starter|basic|pro|business|enterprise|premium|growth)\s*(?:plan|tier|pricing)?/i
    );
    if (tierMatch) {
      metadata.pricingTier = tierMatch[0];
    }

    // Extract contract type
    if (/annual|yearly|year/i.test(content)) {
      metadata.contractType = 'annual';
    } else if (/monthly|month-to-month/i.test(content)) {
      metadata.contractType = 'monthly';
    } else if (/multi-year|2\s*year|3\s*year/i.test(content)) {
      metadata.contractType = 'multi-year';
    }

    // Extract compliance requirements
    const complianceTerms = ['GDPR', 'SOC2', 'SOC 2', 'ISO27001', 'ISO 27001', 'HIPAA', 'CCPA', 'PCI'];
    const complianceFound = complianceTerms.filter(term =>
      content.toUpperCase().includes(term.toUpperCase())
    );
    if (complianceFound.length > 0) {
      metadata.complianceRequirements = complianceFound;
    }

    return metadata;
  }

  private assessConversionPotential(
    signal: NationalSignal,
    churnSignal: ChurnSignal | undefined,
    competitorAttribution: CompetitorMention | undefined,
    companySize: CompanySize | undefined
  ): 'low' | 'medium' | 'high' | 'very-high' {
    let score = 0;

    // High-intent signal types
    if (['switching-intent', 'churn-signal', 'competitor-complaint'].includes(signal.type)) {
      score += 2;
    } else if (['feature-comparison', 'pricing-discussion'].includes(signal.type)) {
      score += 1;
    }

    // Churn severity boost
    if (churnSignal) {
      if (churnSignal.severity === 'critical') score += 3;
      else if (churnSignal.severity === 'high') score += 2;
      else if (churnSignal.severity === 'medium') score += 1;
    }

    // Competitor mention (they're actively comparing)
    if (competitorAttribution) {
      score += 1;
    }

    // Company size (enterprise = higher value)
    if (companySize === 'enterprise') score += 2;
    else if (companySize === 'established') score += 1;

    // Platform credibility
    if (signal.platform && PLATFORM_CREDIBILITY[signal.platform] >= 0.9) {
      score += 1;
    }

    // Map score to potential
    if (score >= 6) return 'very-high';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private generateActionableInsight(
    signal: NationalSignal,
    churnSignal: ChurnSignal | undefined,
    competitorAttribution: CompetitorMention | undefined,
    urgency: UrgencyLevel,
    potential: 'low' | 'medium' | 'high' | 'very-high'
  ): { insight: string; tactic: string } {
    const signalTypeInsights: Record<NationalSignalType, { insight: string; tactic: string }> = {
      'churn-signal': {
        insight: 'Active churn intent detected - high-priority capture opportunity',
        tactic: 'Fast-track outreach with migration support messaging. Address pain points directly.'
      },
      'switching-intent': {
        insight: 'Buyer actively evaluating alternatives',
        tactic: 'Competitive comparison content. ROI calculator. Free migration tools.'
      },
      'feature-comparison': {
        insight: 'Research phase buyer comparing options',
        tactic: 'Feature-by-feature comparison guides. Demo request CTA. Social proof.'
      },
      'integration-request': {
        insight: 'Integration need signals tech stack fit requirement',
        tactic: 'Integration documentation. API showcase. Partner ecosystem messaging.'
      },
      'pricing-discussion': {
        insight: 'Price sensitivity or value assessment in progress',
        tactic: 'Value calculator. ROI case studies. Flexible pricing options.'
      },
      'negative-review': {
        insight: 'Competitor weakness exposed - displacement opportunity',
        tactic: 'Address specific pain points. Offer trial. Comparison content.'
      },
      'positive-review': {
        insight: 'Satisfied customer signal - potential advocate or upsell',
        tactic: 'Referral program. Case study request. Upsell opportunity.'
      },
      'competitor-complaint': {
        insight: 'Competitor pain point expressed - high-value capture target',
        tactic: 'Direct outreach addressing exact complaint. Migration support offer.'
      },
      'trial-conversion': {
        insight: 'Trial experience discussion - onboarding insight',
        tactic: 'Personalized onboarding. Trial extension offer. Success resources.'
      },
      'product-launch': {
        insight: 'Market activity - competitive or opportunity signal',
        tactic: 'Feature comparison update. Market positioning content.'
      },
      'funding-announcement': {
        insight: 'Company growth signal - potential new budget',
        tactic: 'Enterprise outreach. Scalability messaging. Growth partnership.'
      },
      'tech-stack-change': {
        insight: 'Tech stack transition - integration or displacement opportunity',
        tactic: 'Integration support. Migration tools. Ecosystem fit messaging.'
      },
      'compliance-need': {
        insight: 'Compliance requirement identified',
        tactic: 'Compliance documentation. Certification badges. Security messaging.'
      },
      'social-proof-request': {
        insight: 'Buyer seeking validation before decision',
        tactic: 'Case studies. Customer references. G2 reviews. Analyst reports.'
      }
    };

    const base = signalTypeInsights[signal.type];
    let enhancedInsight = base.insight;
    let enhancedTactic = base.tactic;

    // Enhance for churn signal
    if (churnSignal) {
      if (churnSignal.severity === 'critical') {
        enhancedInsight = `CRITICAL: ${enhancedInsight}`;
        enhancedTactic = `IMMEDIATE ACTION: ${enhancedTactic}`;
      }
      if (churnSignal.competitorContext) {
        enhancedInsight += ` (leaving ${churnSignal.competitorContext})`;
      }
    }

    // Enhance for competitor context
    if (competitorAttribution) {
      enhancedInsight += ` - Competitor: ${competitorAttribution.matchedCompetitor}`;
    }

    // Enhance for urgency
    if (urgency === 'immediate') {
      enhancedTactic = `URGENT: ${enhancedTactic}`;
    }

    // Enhance for potential
    if (potential === 'very-high') {
      enhancedInsight = `HIGH-VALUE: ${enhancedInsight}`;
    }

    return { insight: enhancedInsight, tactic: enhancedTactic };
  }
}

// Export singleton
export const nationalSignalsService = new NationalSignalsService();
export { NationalSignalsService };
