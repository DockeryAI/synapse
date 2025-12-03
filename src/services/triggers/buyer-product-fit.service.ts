/**
 * Buyer-Product Fit Validator Service
 *
 * Validates that triggers actually lead to THIS brand's product category,
 * not just any product category. This is the core shift from:
 * - "Does this trigger contain keywords that match our UVP?"
 * to:
 * - "Would someone with this problem search for and buy THIS SPECIFIC product?"
 *
 * Implements validation rules from TRIGGER_RESEARCH.md
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from './_archived/profile-detection.service';

// ============================================================================
// TYPES
// ============================================================================

export type BuyerJourneyStage = 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';

export interface BuyerProductFitResult {
  isValid: boolean;
  fitScore: number; // 0-1
  reasoning: string;
  buyerJourneyStage: BuyerJourneyStage;
  rejectionReason?: string;
  validationDetails: {
    matchesTargetBuyer: boolean;
    matchesProductCategory: boolean;
    matchesIndustry: boolean;
    isSpecificNotGeneric: boolean;
    isNotCompetitorPain: boolean;
  };
}

export interface FitValidationInput {
  triggerTitle: string;
  triggerSummary?: string;
  evidence?: string[];
  uvp: CompleteUVP;
  profileType: BusinessProfileType;
  brandProducts?: string[];
  brandIndustry?: string;
}

// ============================================================================
// PROFILE-SPECIFIC VALIDATION RULES
// ============================================================================

interface ProfileValidationRules {
  validBuyerTerms: string[];
  validPainPatterns: string[];
  invalidPainPatterns: string[];
  productCategoryTerms: string[];
  invalidCategoryTerms: string[];
}

const PROFILE_VALIDATION_RULES: Record<BusinessProfileType, ProfileValidationRules> = {
  'local-service-b2b': {
    validBuyerTerms: [
      'business owner', 'facilities manager', 'office manager', 'operations',
      'property manager', 'building owner', 'commercial', 'company', 'organization'
    ],
    validPainPatterns: [
      'equipment failure', 'emergency repair', 'downtime', 'contractor reliability',
      'response time', 'no-show', 'compliance', 'inspection', 'maintenance',
      'service contract', 'vendor', 'cost overrun', 'budget'
    ],
    invalidPainPatterns: [
      'consumer', 'personal', 'home', 'residential', 'diy', 'tutorial',
      'saas', 'software', 'app', 'subscription', 'cloud'
    ],
    productCategoryTerms: [
      'hvac', 'it services', 'managed services', 'security', 'janitorial',
      'cleaning', 'maintenance', 'repair', 'installation', 'contractor'
    ],
    invalidCategoryTerms: [
      'marketing agency', 'consulting', 'saas', 'software', 'consumer product',
      'retail', 'ecommerce', 'franchise'
    ]
  },

  'local-service-b2c': {
    validBuyerTerms: [
      'patient', 'customer', 'client', 'member', 'guest', 'consumer',
      'family', 'individual', 'homeowner', 'resident'
    ],
    validPainPatterns: [
      'wait time', 'appointment', 'booking', 'availability', 'price',
      'quality', 'review', 'experience', 'service', 'staff', 'location',
      'parking', 'insurance', 'payment', 'schedule'
    ],
    invalidPainPatterns: [
      'enterprise', 'b2b', 'vendor', 'contract', 'procurement', 'rfp',
      'saas', 'software', 'integration'
    ],
    productCategoryTerms: [
      'dental', 'dentist', 'salon', 'spa', 'restaurant', 'gym', 'fitness',
      'healthcare', 'medical', 'wellness', 'beauty', 'food', 'dining'
    ],
    invalidCategoryTerms: [
      'b2b', 'enterprise', 'saas', 'software', 'wholesale', 'manufacturing'
    ]
  },

  'regional-b2b-agency': {
    validBuyerTerms: [
      'cmo', 'marketing director', 'vp marketing', 'ceo', 'cfo', 'founder',
      'business owner', 'executive', 'decision maker', 'budget holder'
    ],
    validPainPatterns: [
      'roi', 'results', 'deliverables', 'communication', 'accountability',
      'strategy', 'expertise', 'industry knowledge', 'deadline', 'budget',
      'reporting', 'transparency', 'alignment', 'partnership'
    ],
    invalidPainPatterns: [
      'consumer', 'personal', 'home', 'residential', 'retail customer',
      'patient', 'guest', 'member'
    ],
    productCategoryTerms: [
      'marketing', 'agency', 'consulting', 'accounting', 'legal', 'pr',
      'creative', 'digital', 'branding', 'strategy', 'advisory'
    ],
    invalidCategoryTerms: [
      'hvac', 'dental', 'restaurant', 'saas', 'software', 'product', 'retail'
    ]
  },

  'regional-retail-b2c': {
    validBuyerTerms: [
      'shopper', 'customer', 'consumer', 'buyer', 'member', 'family',
      'household', 'individual'
    ],
    validPainPatterns: [
      'availability', 'stock', 'inventory', 'price', 'location', 'hours',
      'selection', 'quality', 'return policy', 'shipping', 'delivery',
      'loyalty', 'rewards', 'promotion', 'discount'
    ],
    invalidPainPatterns: [
      'enterprise', 'b2b', 'vendor', 'contract', 'procurement', 'rfp',
      'implementation', 'integration', 'compliance'
    ],
    productCategoryTerms: [
      'retail', 'store', 'shop', 'franchise', 'location', 'ecommerce',
      'shopping', 'product', 'merchandise', 'inventory'
    ],
    invalidCategoryTerms: [
      'saas', 'software', 'agency', 'consulting', 'service provider'
    ]
  },

  'national-saas-b2b': {
    validBuyerTerms: [
      'enterprise', 'company', 'organization', 'team', 'department',
      'it', 'engineering', 'operations', 'sales', 'marketing',
      'cto', 'cio', 'vp', 'director', 'manager', 'buyer'
    ],
    validPainPatterns: [
      // NOTE: These patterns should be BROAD for the profile category
      // Product-specific filtering now happens in checkProductCategoryMatch via UVP extraction
      // The UVP-extracted terms ensure triggers are relevant to THIS specific product
      'implementation', 'adoption', 'onboarding', 'migration', 'deployment',
      'scalability', 'reliability', 'performance', 'security', 'compliance',
      'support', 'pricing', 'contract', 'roi', 'efficiency', 'productivity',
      'workflow', 'process', 'cost', 'time', 'quality', 'accuracy'
    ],
    invalidPainPatterns: [
      'consumer', 'personal', 'home', 'residential', 'retail customer',
      'patient', 'guest', 'diy', 'tutorial'
    ],
    productCategoryTerms: [
      'software', 'saas', 'platform', 'tool', 'solution', 'system',
      'application', 'cloud', 'automation', 'ai', 'analytics'
    ],
    invalidCategoryTerms: [
      'dental', 'salon', 'restaurant', 'hvac', 'agency', 'consulting',
      'consumer product', 'retail store'
    ]
  },

  'national-product-b2c': {
    validBuyerTerms: [
      'consumer', 'customer', 'buyer', 'shopper', 'user', 'family',
      'household', 'individual', 'person'
    ],
    validPainPatterns: [
      'quality', 'durability', 'price', 'value', 'warranty', 'returns',
      'shipping', 'availability', 'reviews', 'authenticity', 'comparison',
      'alternatives', 'features', 'design', 'performance'
    ],
    invalidPainPatterns: [
      'enterprise', 'b2b', 'vendor', 'contract', 'procurement', 'rfp',
      'implementation', 'integration', 'compliance', 'audit'
    ],
    productCategoryTerms: [
      'product', 'brand', 'item', 'goods', 'merchandise',
      'consumer', 'd2c', 'direct to consumer', 'ecommerce'
    ],
    invalidCategoryTerms: [
      'saas', 'software', 'agency', 'consulting', 'b2b service'
    ]
  },

  'global-saas-b2b': {
    validBuyerTerms: [
      'enterprise', 'global', 'multinational', 'international', 'organization',
      'cto', 'cio', 'vp', 'director', 'it', 'security', 'compliance'
    ],
    validPainPatterns: [
      // NOTE: These patterns should be BROAD for the profile category
      // Product-specific filtering now happens in checkProductCategoryMatch via UVP extraction
      'compliance', 'gdpr', 'data residency', 'localization', 'multi-region',
      'enterprise', 'governance', 'audit', 'security', 'soc2', 'iso',
      'scalability', 'reliability', 'performance', 'global support',
      'implementation', 'migration', 'integration', 'deployment'
    ],
    invalidPainPatterns: [
      'consumer', 'personal', 'home', 'residential', 'retail customer',
      'local', 'small business', 'smb only'
    ],
    productCategoryTerms: [
      'enterprise software', 'saas', 'platform', 'global', 'international',
      'cloud', 'ai', 'automation', 'analytics', 'compliance tool'
    ],
    invalidCategoryTerms: [
      'local service', 'dental', 'salon', 'restaurant', 'consumer product',
      'small business only'
    ]
  }
};

// ============================================================================
// JOURNEY STAGE DETECTION
// ============================================================================

const JOURNEY_STAGE_INDICATORS: Record<BuyerJourneyStage, string[]> = {
  'unaware': [
    'industry trend', 'market research', 'general', 'overview', 'introduction',
    'what is', 'definition', 'basics', 'beginner', 'guide'
  ],
  'problem-aware': [
    'frustrated', 'struggling', 'problem', 'issue', 'challenge', 'pain',
    'difficulty', 'hate', 'annoyed', 'why is it so hard'
  ],
  'solution-aware': [
    'looking for', 'need', 'want', 'searching', 'alternative', 'comparison',
    'vs', 'better way', 'how to solve', 'best practices'
  ],
  'product-aware': [
    'review', 'pricing', 'demo', 'trial', 'implementation', 'onboarding',
    'migration', 'switching from', 'integrates with', 'specific product name'
  ]
};

// ============================================================================
// SERVICE
// ============================================================================

class BuyerProductFitService {
  /**
   * Validate if a trigger leads to THIS brand's product category
   */
  validateFit(input: FitValidationInput): BuyerProductFitResult {
    const { triggerTitle, triggerSummary, evidence, uvp, profileType, brandProducts, brandIndustry } = input;

    const rules = PROFILE_VALIDATION_RULES[profileType] || PROFILE_VALIDATION_RULES['national-saas-b2b'];
    const allText = this.combineText(triggerTitle, triggerSummary, evidence);
    const textLower = allText.toLowerCase();

    // Extract product category terms for logging
    const productCategoryTerms = this.extractProductCategoryTerms(uvp);

    // Run all validation checks
    const matchesTargetBuyer = this.checkBuyerMatch(textLower, rules, uvp);
    const matchesProductCategory = this.checkProductCategoryMatch(textLower, rules, uvp, brandProducts, brandIndustry);
    const matchesIndustry = this.checkIndustryMatch(textLower, uvp, brandIndustry);
    const isSpecificNotGeneric = this.checkSpecificity(textLower, rules);
    const isNotCompetitorPain = this.checkNotCompetitorPain(textLower, uvp, brandProducts);

    // DEBUG: Log product category matching
    console.log(`[BuyerProductFit] "${triggerTitle.substring(0, 40)}..." - ProductCategory: ${matchesProductCategory} (terms: ${productCategoryTerms.join(', ') || 'none'})`);
    if (!matchesProductCategory) {
      console.log(`[BuyerProductFit] REJECTED - trigger doesn't mention product category terms`);
    }

    // Calculate fit score
    const scores = [
      matchesTargetBuyer ? 0.25 : 0,
      matchesProductCategory ? 0.25 : 0,
      matchesIndustry ? 0.2 : 0,
      isSpecificNotGeneric ? 0.15 : 0,
      isNotCompetitorPain ? 0.15 : 0
    ];
    const fitScore = scores.reduce((a, b) => a + b, 0);

    // Determine validity (threshold: 0.4)
    const isValid = fitScore >= 0.4;

    // Determine buyer journey stage
    const buyerJourneyStage = this.detectJourneyStage(textLower);

    // Build reasoning and rejection reason
    const { reasoning, rejectionReason } = this.buildReasoning({
      matchesTargetBuyer,
      matchesProductCategory,
      matchesIndustry,
      isSpecificNotGeneric,
      isNotCompetitorPain,
      fitScore,
      isValid,
      buyerJourneyStage
    });

    return {
      isValid,
      fitScore,
      reasoning,
      buyerJourneyStage,
      rejectionReason: isValid ? undefined : rejectionReason,
      validationDetails: {
        matchesTargetBuyer,
        matchesProductCategory,
        matchesIndustry,
        isSpecificNotGeneric,
        isNotCompetitorPain
      }
    };
  }

  /**
   * Batch validate multiple triggers
   */
  validateBatch(triggers: Array<{ title: string; summary?: string; evidence?: string[] }>, uvp: CompleteUVP, profileType: BusinessProfileType): BuyerProductFitResult[] {
    return triggers.map(t => this.validateFit({
      triggerTitle: t.title,
      triggerSummary: t.summary,
      evidence: t.evidence,
      uvp,
      profileType
    }));
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS
  // ============================================================================

  private combineText(title: string, summary?: string, evidence?: string[]): string {
    const parts = [title];
    if (summary) parts.push(summary);
    if (evidence) parts.push(...evidence);
    return parts.join(' ');
  }

  private checkBuyerMatch(text: string, rules: ProfileValidationRules, uvp: CompleteUVP): boolean {
    // Check if trigger mentions valid buyer terms for this profile
    const hasValidBuyer = rules.validBuyerTerms.some(term => text.includes(term));

    // Also check against UVP target customer
    const targetCustomer = (uvp.targetCustomer?.statement || '').toLowerCase();
    const targetKeywords = targetCustomer.split(/\s+/).filter(w => w.length > 4);
    const matchesUvpTarget = targetKeywords.some(kw => text.includes(kw));

    return hasValidBuyer || matchesUvpTarget;
  }

  private checkProductCategoryMatch(
    text: string,
    rules: ProfileValidationRules,
    uvp: CompleteUVP,
    brandProducts?: string[],
    brandIndustry?: string
  ): boolean {
    // Check if trigger is about the RIGHT product category
    const hasInvalidCategory = rules.invalidCategoryTerms.some(term => text.includes(term));

    // If it mentions an invalid category, it's not a fit
    if (hasInvalidCategory) return false;

    // CRITICAL: Extract product category from UVP and check for match
    // This is where we validate "would this trigger lead to buying OUR product?"
    const productCategoryTerms = this.extractProductCategoryTerms(uvp);

    if (productCategoryTerms.length > 0) {
      // Check if trigger mentions something related to our product category
      const matchesProductCategory = productCategoryTerms.some(term => text.includes(term));

      if (!matchesProductCategory) {
        // REJECT: Trigger doesn't mention anything about our product category
        // e.g., "vendor lock-in" doesn't mention chatbot/AI/customer service
        return false;
      }
      return true;
    }

    // Check against brand's actual products
    if (brandProducts && brandProducts.length > 0) {
      const matchesBrandProduct = brandProducts.some(product =>
        text.includes(product.toLowerCase())
      );
      if (matchesBrandProduct) return true;
    }

    // Check against brand industry
    if (brandIndustry && text.includes(brandIndustry.toLowerCase())) {
      return true;
    }

    // Fallback: check profile-level terms (less strict)
    const hasValidCategory = rules.productCategoryTerms.some(term => text.includes(term));
    return hasValidCategory;
  }

  /**
   * Extract product category terms from UVP
   * These are the keywords that identify WHAT the product actually is/does
   *
   * SCALABLE APPROACH: Dynamically extract meaningful terms from UVP text
   * rather than using hardcoded industry-specific patterns
   */
  private extractProductCategoryTerms(uvp: CompleteUVP): string[] {
    const terms: string[] = [];

    // Extract from ALL UVP fields
    const uniqueSolution = (uvp.uniqueSolution?.statement || '').toLowerCase();
    const keyBenefit = (uvp.keyBenefit?.statement || '').toLowerCase();
    const whatYouDo = typeof uvp.whatYouDo === 'string'
      ? uvp.whatYouDo.toLowerCase()
      : ((uvp.whatYouDo as any)?.statement || '').toLowerCase();
    const targetCustomer = (uvp.targetCustomer?.statement || '').toLowerCase();
    const transformBefore = (uvp.transformationGoal?.before || '').toLowerCase();
    const transformAfter = (uvp.transformationGoal?.after || '').toLowerCase();

    // Also extract from differentiators
    const differentiators = (uvp.uniqueSolution?.differentiators || [])
      .map(d => d.statement.toLowerCase())
      .join(' ');

    const fullText = `${uniqueSolution} ${keyBenefit} ${whatYouDo} ${targetCustomer} ${transformBefore} ${transformAfter} ${differentiators}`;

    // STEP 1: Extract noun phrases and key terms dynamically
    // These stopwords should be excluded from product terms
    const stopwords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'between', 'under',
      'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
      'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
      'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we',
      'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
      'their', 'what', 'which', 'who', 'whom', 'helps', 'help', 'provide',
      'provides', 'offering', 'offer', 'offers', 'using', 'use', 'used',
      'company', 'companies', 'business', 'businesses', 'organization',
      'organizations', 'solution', 'solutions', 'platform', 'platforms'
    ]);

    // Extract meaningful words (4+ chars, not stopwords)
    const words = fullText
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopwords.has(w));

    // STEP 2: Extract 2-word and 3-word phrases that appear in UVP
    // These are likely product category terms
    const wordArray = fullText.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(w => w.length >= 3);

    for (let i = 0; i < wordArray.length - 1; i++) {
      // 2-word phrases
      const twoWord = `${wordArray[i]} ${wordArray[i + 1]}`;
      if (this.isProductCategoryPhrase(twoWord)) {
        terms.push(twoWord);
      }

      // 3-word phrases
      if (i < wordArray.length - 2) {
        const threeWord = `${wordArray[i]} ${wordArray[i + 1]} ${wordArray[i + 2]}`;
        if (this.isProductCategoryPhrase(threeWord)) {
          terms.push(threeWord);
        }
      }
    }

    // STEP 3: Add single-word domain terms (high-signal words)
    const domainTerms = words.filter(w => this.isDomainTerm(w));
    terms.push(...domainTerms);

    // Dedupe and limit
    const unique = [...new Set(terms)].slice(0, 15);

    console.log(`[BuyerProductFit] Extracted ${unique.length} product terms from UVP:`, unique.slice(0, 5));
    return unique;
  }

  /**
   * Check if a phrase looks like a product category (not generic business speak)
   */
  private isProductCategoryPhrase(phrase: string): boolean {
    // Must have at least one domain-specific word
    const words = phrase.split(' ');
    return words.some(w => this.isDomainTerm(w));
  }

  /**
   * Check if a word is a domain-specific term (product/industry related)
   * These are terms that indicate WHAT a product/service IS
   */
  private isDomainTerm(word: string): boolean {
    // High-signal domain terms across all 6 business profiles
    const domainTerms = new Set([
      // Technology/SaaS
      'ai', 'chatbot', 'automation', 'software', 'platform', 'saas', 'cloud',
      'analytics', 'api', 'integration', 'app', 'application', 'dashboard',
      'conversational', 'virtual', 'assistant', 'agent', 'bot', 'dialogue',

      // Customer Service
      'customer', 'support', 'service', 'experience', 'contact', 'center',
      'call', 'chat', 'ticket', 'resolution', 'response', 'helpdesk',

      // Local Services B2B
      'hvac', 'heating', 'cooling', 'plumbing', 'electrical', 'repair',
      'maintenance', 'installation', 'contractor', 'commercial', 'facilities',
      'security', 'cleaning', 'janitorial', 'landscaping',

      // Local Services B2C
      'dental', 'dentist', 'teeth', 'salon', 'spa', 'beauty', 'hair',
      'restaurant', 'dining', 'food', 'fitness', 'gym', 'yoga', 'wellness',
      'medical', 'healthcare', 'clinic', 'therapy', 'massage',

      // Marketing/Agency
      'marketing', 'advertising', 'campaign', 'seo', 'ppc', 'social',
      'content', 'branding', 'creative', 'digital', 'media', 'pr',
      'consulting', 'advisory', 'strategy',

      // Accounting/Financial
      'accounting', 'bookkeeping', 'tax', 'audit', 'financial', 'payroll',
      'cpa', 'advisory', 'compliance', 'reporting',

      // Retail
      'retail', 'store', 'shop', 'ecommerce', 'inventory', 'merchandise',
      'shipping', 'delivery', 'fulfillment', 'returns', 'warehouse',

      // Insurance (vertical)
      'insurance', 'policy', 'claim', 'quote', 'underwriting', 'coverage',
      'premium', 'broker', 'carrier', 'risk',

      // Real Estate
      'realestate', 'property', 'listing', 'mortgage', 'rental', 'lease',

      // Manufacturing/Product
      'manufacturing', 'production', 'quality', 'warranty', 'product',

      // Generic high-signal
      'automation', 'booking', 'appointment', 'scheduling', 'reservation',
      'payment', 'billing', 'invoicing', 'crm', 'erp', 'workflow'
    ]);

    return domainTerms.has(word.toLowerCase());
  }

  private checkIndustryMatch(text: string, uvp: CompleteUVP, brandIndustry?: string): boolean {
    // Check if trigger is relevant to the brand's industry
    const industry = brandIndustry || uvp.targetCustomer?.industry || '';
    if (!industry) return true; // Can't check, assume match

    const industryKeywords = industry.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return industryKeywords.some(kw => text.includes(kw)) || text.includes(industry.toLowerCase());
  }

  private checkSpecificity(text: string, rules: ProfileValidationRules): boolean {
    // Check if trigger has specific pain patterns (not generic)
    const hasValidPain = rules.validPainPatterns.some(pattern => text.includes(pattern));
    const hasInvalidPain = rules.invalidPainPatterns.some(pattern => text.includes(pattern));

    // Generic indicators that suggest low specificity
    const genericIndicators = [
      'in general', 'typically', 'usually', 'industry trends', 'best practices',
      'thought leadership', 'tips and tricks', 'how to guide', 'introduction to'
    ];
    const isGeneric = genericIndicators.some(ind => text.includes(ind));

    return hasValidPain && !hasInvalidPain && !isGeneric;
  }

  private checkNotCompetitorPain(text: string, uvp: CompleteUVP, brandProducts?: string[]): boolean {
    // Check if the pain is about a COMPETITOR's product category
    // (e.g., "frustrated with chatbot support" when we sell chatbots = good)
    // (e.g., "frustrated with chatbot support" when we sell accounting = bad)

    // If pain mentions frustration with something in our category, that's GOOD
    // If pain mentions frustration with something outside our category, that's BAD

    const frustrationIndicators = [
      'frustrated with', 'hate', 'terrible', 'awful', 'worst', 'disappointed by',
      'problems with', 'issues with', 'complaints about'
    ];

    const hasFrustration = frustrationIndicators.some(ind => text.includes(ind));

    if (!hasFrustration) return true; // No frustration mentioned, not a competitor pain issue

    // If frustrated with something, check if it's OUR category or someone else's
    // For now, assume if it passes other checks, it's relevant frustration
    // More sophisticated: extract what they're frustrated WITH and check category
    return true;
  }

  private detectJourneyStage(text: string): BuyerJourneyStage {
    // Count indicators for each stage
    const stageCounts: Record<BuyerJourneyStage, number> = {
      'unaware': 0,
      'problem-aware': 0,
      'solution-aware': 0,
      'product-aware': 0
    };

    for (const [stage, indicators] of Object.entries(JOURNEY_STAGE_INDICATORS)) {
      stageCounts[stage as BuyerJourneyStage] = indicators.filter(ind => text.includes(ind)).length;
    }

    // Find stage with highest count
    let maxStage: BuyerJourneyStage = 'problem-aware'; // Default
    let maxCount = 0;

    for (const [stage, count] of Object.entries(stageCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxStage = stage as BuyerJourneyStage;
      }
    }

    return maxStage;
  }

  private buildReasoning(validation: {
    matchesTargetBuyer: boolean;
    matchesProductCategory: boolean;
    matchesIndustry: boolean;
    isSpecificNotGeneric: boolean;
    isNotCompetitorPain: boolean;
    fitScore: number;
    isValid: boolean;
    buyerJourneyStage: BuyerJourneyStage;
  }): { reasoning: string; rejectionReason?: string } {
    const reasons: string[] = [];
    const issues: string[] = [];

    if (validation.matchesTargetBuyer) {
      reasons.push('Matches target buyer profile');
    } else {
      issues.push('Does not match target buyer profile');
    }

    if (validation.matchesProductCategory) {
      reasons.push('Relevant to product category');
    } else {
      issues.push('Outside product category');
    }

    if (validation.matchesIndustry) {
      reasons.push('Industry-relevant');
    } else {
      issues.push('Wrong industry context');
    }

    if (validation.isSpecificNotGeneric) {
      reasons.push('Specific pain/need identified');
    } else {
      issues.push('Too generic or wrong pain type');
    }

    if (!validation.isNotCompetitorPain) {
      issues.push('Pain about competitor in different category');
    }

    const reasoning = reasons.length > 0
      ? `Valid: ${reasons.join(', ')}. Score: ${(validation.fitScore * 100).toFixed(0)}%. Journey: ${validation.buyerJourneyStage}`
      : `No valid signals found. Score: ${(validation.fitScore * 100).toFixed(0)}%`;

    const rejectionReason = issues.length > 0
      ? issues.join('; ')
      : undefined;

    return { reasoning, rejectionReason };
  }
}

// Export singleton
export const buyerProductFitService = new BuyerProductFitService();
