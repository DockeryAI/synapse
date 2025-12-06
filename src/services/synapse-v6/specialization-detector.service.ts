/**
 * Specialization Detector Service - Phase 15
 *
 * Detects business specialization for all 7 profile types.
 * Runs after benefits step in UVP flow, extracts business-specific
 * details that customize all future Synapse actions.
 *
 * Profile Types:
 * - local-service-b2c: Wedding bakery, salon, plumber
 * - local-service-b2b: Commercial HVAC, IT services
 * - regional-b2b-agency: Insurance broker, marketing agency
 * - regional-retail-b2c: Grocery chain, retail franchise
 * - national-saas-b2b: OpenDialog (AI agents for insurance sales)
 * - national-product-b2c: DTC brands, consumer products
 * - global-saas-b2b: Enterprise CRM, Salesforce competitor
 *
 * Created: 2025-12-05
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  BusinessProfileType,
  SpecializationData,
  SpecializationDetectionResult,
  LocalServiceB2CSpecialization,
  LocalServiceB2BSpecialization,
  RegionalB2BAgencySpecialization,
  RegionalRetailB2CSpecialization,
  NationalSaaSB2BSpecialization,
  NationalProductB2CSpecialization,
  GlobalSaaSB2BSpecialization,
} from '@/types/synapse/specialization.types';

/**
 * Base fields extracted for all profile types
 */
interface BaseFields {
  profile_type: BusinessProfileType;
  service_type: string;
  niche: string;
  industry_vertical: string;
  unique_method: string;
  target_outcome: string;
  detected_competitors: string[];
  confidence: number;
}

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

interface ProfilePattern {
  keywords: string[];
  weight: number;
  indicators: string[];
}

const PROFILE_PATTERNS: Record<BusinessProfileType, ProfilePattern> = {
  'local-service-b2c': {
    keywords: ['local', 'bakery', 'salon', 'plumber', 'electrician', 'wedding', 'catering', 'florist', 'photographer', 'restaurant'],
    weight: 10,
    indicators: ['neighborhood', 'community', 'nearby', 'walk-in', 'appointment'],
  },
  'local-service-b2b': {
    keywords: ['commercial', 'hvac', 'janitorial', 'cleaning', 'maintenance', 'contractor', 'fleet', 'security'],
    weight: 10,
    indicators: ['contract', 'service agreement', 'maintenance plan', 'business client'],
  },
  'regional-b2b-agency': {
    keywords: ['agency', 'broker', 'consultant', 'advisor', 'firm', 'insurance broker', 'marketing agency', 'staffing'],
    weight: 10,
    indicators: ['client', 'account', 'retainer', 'consulting', 'advisory'],
  },
  'regional-retail-b2c': {
    keywords: ['franchise', 'chain', 'retail', 'store', 'location', 'grocery', 'supermarket', 'boutique'],
    weight: 10,
    indicators: ['locations', 'stores', 'outlets', 'branches'],
  },
  'national-saas-b2b': {
    keywords: ['saas', 'software', 'platform', 'cloud', 'subscription', 'api', 'integration', 'enterprise software'],
    weight: 10,
    indicators: ['demo', 'trial', 'onboarding', 'implementation', 'seat', 'license'],
  },
  'national-product-b2c': {
    keywords: ['product', 'brand', 'dtc', 'direct to consumer', 'ecommerce', 'online store', 'apparel', 'beauty'],
    weight: 10,
    indicators: ['shipping', 'returns', 'sustainable', 'eco-friendly', 'organic'],
  },
  'global-saas-b2b': {
    keywords: ['enterprise', 'global', 'fortune 500', 'multinational', 'crm', 'erp', 'security platform'],
    weight: 10,
    indicators: ['compliance', 'soc2', 'gdpr', 'hipaa', 'iso', 'data residency'],
  },
};

// Service/Trade categories for local businesses
const SERVICE_CATEGORIES = {
  b2c: {
    food: ['bakery', 'catering', 'restaurant', 'cafe', 'food truck', 'chef'],
    beauty: ['salon', 'spa', 'nail', 'hair', 'barber', 'aesthetics', 'skin'],
    home: ['plumber', 'electrician', 'hvac', 'handyman', 'cleaning', 'landscaping', 'roofing'],
    events: ['wedding', 'photographer', 'videographer', 'florist', 'dj', 'event planner'],
    health: ['dental', 'chiropractic', 'massage', 'therapy', 'fitness', 'yoga'],
    automotive: ['mechanic', 'auto', 'car wash', 'detailing', 'tire'],
  },
  b2b: {
    trades: ['hvac', 'electrical', 'plumbing', 'mechanical', 'construction'],
    facility: ['janitorial', 'cleaning', 'security', 'maintenance', 'pest control'],
    tech: ['it', 'managed services', 'network', 'cybersecurity', 'computer'],
    professional: ['accounting', 'bookkeeping', 'legal', 'hr', 'payroll'],
  },
};

// Agency types for regional B2B
const AGENCY_TYPES = {
  insurance: ['insurance', 'policy', 'coverage', 'broker', 'underwriting', 'claims'],
  marketing: ['marketing', 'advertising', 'digital', 'seo', 'social media', 'branding'],
  staffing: ['staffing', 'recruiting', 'talent', 'hr', 'placement', 'hiring'],
  consulting: ['consulting', 'advisory', 'strategy', 'management', 'business'],
  real_estate: ['real estate', 'property', 'commercial real estate', 'leasing'],
};

// SaaS function categories
const SAAS_FUNCTIONS = {
  sales: ['sales', 'crm', 'pipeline', 'quota', 'lead', 'sdm', 'sdr', 'outbound'],
  marketing: ['marketing', 'campaign', 'email', 'automation', 'martech'],
  operations: ['operations', 'workflow', 'process', 'automation', 'rpa'],
  analytics: ['analytics', 'bi', 'reporting', 'dashboard', 'data'],
  security: ['security', 'identity', 'access', 'iam', 'siem', 'endpoint'],
  communication: ['communication', 'messaging', 'chat', 'conversational', 'ai agent', 'chatbot'],
  hr: ['hr', 'hris', 'payroll', 'benefits', 'recruiting', 'ats'],
  finance: ['finance', 'accounting', 'billing', 'invoicing', 'payments'],
};

// ============================================================================
// SPECIALIZATION DETECTOR CLASS
// ============================================================================

export class SpecializationDetector {
  /**
   * Detect specialization from UVP data
   * Called after benefits step completes
   */
  async detect(uvp: CompleteUVP): Promise<SpecializationDetectionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Step 1: Detect profile type
      const profileType = this.detectProfileType(uvp);

      // Step 2: Extract profile-specific specialization
      const specialization = this.extractSpecialization(uvp, profileType);

      // Step 3: Calculate confidence
      const confidence = this.calculateConfidence(specialization, uvp);

      console.log('[SpecializationDetector] Detected:', {
        profile_type: profileType,
        service_type: specialization.service_type,
        niche: specialization.niche,
        confidence,
      });

      return {
        success: true,
        specialization,
        confidence,
        method: 'uvp-analysis',
        processing_time_ms: Date.now() - startTime,
        warnings,
      };
    } catch (error) {
      console.error('[SpecializationDetector] Error:', error);
      return {
        success: false,
        specialization: null,
        confidence: 0,
        method: 'fallback',
        processing_time_ms: Date.now() - startTime,
        warnings,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Detect which of the 7 profile types this business matches
   */
  private detectProfileType(uvp: CompleteUVP): BusinessProfileType {
    const allText = this.extractAllText(uvp).toLowerCase();
    const scores: Record<BusinessProfileType, number> = {
      'local-service-b2c': 0,
      'local-service-b2b': 0,
      'regional-b2b-agency': 0,
      'regional-retail-b2c': 0,
      'national-saas-b2b': 0,
      'national-product-b2c': 0,
      'global-saas-b2b': 0,
    };

    // Score each profile type
    for (const [profileType, pattern] of Object.entries(PROFILE_PATTERNS)) {
      const pType = profileType as BusinessProfileType;

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (allText.includes(keyword)) {
          scores[pType] += pattern.weight;
        }
      }

      // Check indicators
      for (const indicator of pattern.indicators) {
        if (allText.includes(indicator)) {
          scores[pType] += pattern.weight / 2;
        }
      }
    }

    // Check geographic scope from UVP
    const geoScope = (uvp.targetCustomer?.marketGeography?.scope || '') as string;
    if (geoScope === 'local') {
      scores['local-service-b2c'] += 15;
      scores['local-service-b2b'] += 15;
    } else if (geoScope === 'regional') {
      scores['regional-b2b-agency'] += 15;
      scores['regional-retail-b2c'] += 15;
    } else if (geoScope === 'national') {
      scores['national-saas-b2b'] += 10;
      scores['national-product-b2c'] += 10;
    } else if (geoScope === 'global' || geoScope === 'international') {
      scores['global-saas-b2b'] += 20;
    }

    // Check for B2B indicators
    const b2bKeywords = ['business', 'enterprise', 'company', 'organization', 'broker', 'agency', 'professional'];
    const hasB2B = b2bKeywords.some(kw => allText.includes(kw));
    if (hasB2B) {
      scores['local-service-b2b'] += 10;
      scores['regional-b2b-agency'] += 10;
      scores['national-saas-b2b'] += 10;
      scores['global-saas-b2b'] += 10;
    }

    // Check for SaaS indicators
    const saasKeywords = ['software', 'saas', 'platform', 'cloud', 'subscription', 'api'];
    const hasSaaS = saasKeywords.some(kw => allText.includes(kw));
    if (hasSaaS) {
      scores['national-saas-b2b'] += 20;
      scores['global-saas-b2b'] += 15;
    }

    // Check for enterprise scale
    const enterpriseKeywords = ['fortune', 'enterprise', 'global', 'multinational', 'compliance', 'soc2'];
    const hasEnterprise = enterpriseKeywords.some(kw => allText.includes(kw));
    if (hasEnterprise) {
      scores['global-saas-b2b'] += 25;
    }

    // Find highest scoring profile
    let bestProfile: BusinessProfileType = 'national-saas-b2b';
    let bestScore = 0;

    for (const [profile, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestProfile = profile as BusinessProfileType;
      }
    }

    return bestProfile;
  }

  /**
   * Extract profile-specific specialization fields
   */
  private extractSpecialization(uvp: CompleteUVP, profileType: BusinessProfileType): SpecializationData {
    const allText = this.extractAllText(uvp).toLowerCase();

    // Common fields
    const baseFields = {
      profile_type: profileType,
      service_type: this.extractServiceType(allText, profileType),
      niche: this.extractNiche(uvp, allText),
      industry_vertical: this.extractIndustryVertical(allText),
      unique_method: this.extractUniqueMethod(uvp),
      target_outcome: this.extractTargetOutcome(uvp),
      detected_competitors: this.extractCompetitors(allText),
      confidence: 0, // Will be calculated separately
    };

    // Profile-specific extraction
    switch (profileType) {
      case 'local-service-b2c':
        return this.extractLocalServiceB2C(uvp, allText, baseFields);
      case 'local-service-b2b':
        return this.extractLocalServiceB2B(uvp, allText, baseFields);
      case 'regional-b2b-agency':
        return this.extractRegionalB2BAgency(uvp, allText, baseFields);
      case 'regional-retail-b2c':
        return this.extractRegionalRetailB2C(uvp, allText, baseFields);
      case 'national-saas-b2b':
        return this.extractNationalSaaSB2B(uvp, allText, baseFields);
      case 'national-product-b2c':
        return this.extractNationalProductB2C(uvp, allText, baseFields);
      case 'global-saas-b2b':
        return this.extractGlobalSaaSB2B(uvp, allText, baseFields);
      default:
        return this.extractNationalSaaSB2B(uvp, allText, baseFields);
    }
  }

  // ==========================================================================
  // PROFILE-SPECIFIC EXTRACTORS
  // ==========================================================================

  private extractLocalServiceB2C(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): LocalServiceB2CSpecialization {
    // Detect service category
    let serviceCategory = 'general';
    for (const [category, keywords] of Object.entries(SERVICE_CATEGORIES.b2c)) {
      if (keywords.some(kw => text.includes(kw))) {
        serviceCategory = category;
        break;
      }
    }

    // Detect niche positioning
    let nichePositioning = 'standard';
    if (text.includes('wedding') || text.includes('luxury') || text.includes('premium')) {
      nichePositioning = 'premium';
    } else if (text.includes('budget') || text.includes('affordable') || text.includes('value')) {
      nichePositioning = 'budget';
    } else if (text.includes('specialty') || text.includes('artisan') || text.includes('custom')) {
      nichePositioning = 'specialty';
    }

    // Detect purchase trigger
    let purchaseTrigger: 'event' | 'emergency' | 'routine' | 'seasonal' = 'routine';
    if (text.includes('wedding') || text.includes('event') || text.includes('celebration')) {
      purchaseTrigger = 'event';
    } else if (text.includes('emergency') || text.includes('urgent') || text.includes('24/7')) {
      purchaseTrigger = 'emergency';
    } else if (text.includes('seasonal') || text.includes('holiday') || text.includes('summer')) {
      purchaseTrigger = 'seasonal';
    }

    return {
      ...base,
      profile_type: 'local-service-b2c',
      service_category: serviceCategory,
      niche_positioning: nichePositioning,
      location_radius: 25, // Default miles
      purchase_trigger: purchaseTrigger,
    };
  }

  private extractLocalServiceB2B(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): LocalServiceB2BSpecialization {
    // Detect trade type
    let tradeType = 'general services';
    for (const [trade, keywords] of Object.entries(SERVICE_CATEGORIES.b2b)) {
      if (keywords.some(kw => text.includes(kw))) {
        tradeType = trade;
        break;
      }
    }

    // Detect sector served
    let sectorServed = 'commercial';
    if (text.includes('industrial') || text.includes('manufacturing') || text.includes('warehouse')) {
      sectorServed = 'industrial';
    } else if (text.includes('healthcare') || text.includes('medical') || text.includes('hospital')) {
      sectorServed = 'healthcare';
    } else if (text.includes('education') || text.includes('school') || text.includes('university')) {
      sectorServed = 'education';
    }

    // Detect contract focus
    let contractFocus: 'project' | 'retainer' | 'emergency' | 'maintenance' = 'project';
    if (text.includes('maintenance') || text.includes('service agreement') || text.includes('preventive')) {
      contractFocus = 'maintenance';
    } else if (text.includes('retainer') || text.includes('monthly') || text.includes('ongoing')) {
      contractFocus = 'retainer';
    } else if (text.includes('emergency') || text.includes('24/7') || text.includes('urgent')) {
      contractFocus = 'emergency';
    }

    return {
      ...base,
      profile_type: 'local-service-b2b',
      trade_type: tradeType,
      sector_served: sectorServed,
      service_area: uvp.targetCustomer?.marketGeography?.primaryRegions?.[0] || 'metro area',
      contract_focus: contractFocus,
    };
  }

  private extractRegionalB2BAgency(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): RegionalB2BAgencySpecialization {
    // Detect agency type
    let agencyType = 'consulting';
    for (const [type, keywords] of Object.entries(AGENCY_TYPES)) {
      if (keywords.some(kw => text.includes(kw))) {
        agencyType = type;
        break;
      }
    }

    // Detect specialty vertical
    let specialtyVertical = 'general business';
    const verticals = ['healthcare', 'construction', 'tech', 'manufacturing', 'retail', 'hospitality', 'finance'];
    for (const vertical of verticals) {
      if (text.includes(vertical)) {
        specialtyVertical = vertical;
        break;
      }
    }

    // Detect geographic scope
    let geoScope: 'city' | 'metro' | 'state' | 'multi-state' = 'metro';
    if (text.includes('nationwide') || text.includes('multi-state') || text.includes('coast')) {
      geoScope = 'multi-state';
    } else if (text.includes('state') || text.includes('statewide')) {
      geoScope = 'state';
    } else if (text.includes('city') || text.includes('downtown')) {
      geoScope = 'city';
    }

    // Detect client size focus
    let clientSize: 'smb' | 'mid-market' | 'enterprise' | 'mixed' = 'smb';
    if (text.includes('enterprise') || text.includes('fortune') || text.includes('large')) {
      clientSize = 'enterprise';
    } else if (text.includes('mid-market') || text.includes('mid-size') || text.includes('growing')) {
      clientSize = 'mid-market';
    } else if (text.includes('small business') || text.includes('startup') || text.includes('smb')) {
      clientSize = 'smb';
    }

    return {
      ...base,
      profile_type: 'regional-b2b-agency',
      agency_type: agencyType,
      specialty_vertical: specialtyVertical,
      geographic_scope: geoScope,
      client_size_focus: clientSize,
    };
  }

  private extractRegionalRetailB2C(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): RegionalRetailB2CSpecialization {
    // Detect retail category
    let retailCategory = 'general retail';
    const categories = {
      grocery: ['grocery', 'supermarket', 'food', 'organic'],
      apparel: ['apparel', 'clothing', 'fashion', 'boutique'],
      home: ['home', 'furniture', 'decor', 'hardware'],
      health: ['pharmacy', 'health', 'wellness', 'vitamin'],
      electronics: ['electronics', 'tech', 'computer', 'phone'],
    };
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        retailCategory = cat;
        break;
      }
    }

    // Detect price positioning
    let pricePositioning = 'value';
    if (text.includes('premium') || text.includes('luxury') || text.includes('upscale')) {
      pricePositioning = 'premium';
    } else if (text.includes('specialty') || text.includes('unique') || text.includes('curated')) {
      pricePositioning = 'specialty';
    }

    // Detect ownership model
    let ownershipModel: 'corporate' | 'franchise' | 'mixed' = 'corporate';
    if (text.includes('franchise') || text.includes('franchisee')) {
      ownershipModel = 'franchise';
    }

    return {
      ...base,
      profile_type: 'regional-retail-b2c',
      retail_category: retailCategory,
      price_positioning: pricePositioning,
      location_count: this.extractLocationCount(text),
      ownership_model: ownershipModel,
    };
  }

  private extractNationalSaaSB2B(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): NationalSaaSB2BSpecialization {
    // Detect product function (what it DOES, not what it IS)
    let productFunction = 'business automation';
    for (const [func, keywords] of Object.entries(SAAS_FUNCTIONS)) {
      if (keywords.some(kw => text.includes(kw))) {
        productFunction = func;
        break;
      }
    }

    // Detect industry SOLD TO (not industry OF the product)
    const industrySoldTo = this.extractIndustrySoldTo(text);

    // Detect unique approach (e.g., "AI agents" not just "software")
    const uniqueApproach = this.extractUniqueApproach(uvp, text);

    // Detect buyer role
    let buyerRole = 'Operations';
    const roles = {
      'Sales Leader': ['sales director', 'vp sales', 'head of sales', 'cro'],
      'Marketing Leader': ['cmo', 'vp marketing', 'marketing director'],
      'IT Leader': ['cto', 'cio', 'it director', 'vp engineering'],
      'Operations': ['coo', 'operations', 'ops director'],
      'Finance': ['cfo', 'finance director', 'controller'],
    };
    for (const [role, keywords] of Object.entries(roles)) {
      if (keywords.some(kw => text.includes(kw))) {
        buyerRole = role;
        break;
      }
    }

    // Detect integration ecosystem
    const integrations = this.extractIntegrations(text);

    return {
      ...base,
      profile_type: 'national-saas-b2b',
      product_function: productFunction,
      industry_sold_to: industrySoldTo,
      unique_approach: uniqueApproach,
      buyer_role: buyerRole,
      integration_ecosystem: integrations,
    };
  }

  private extractNationalProductB2C(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): NationalProductB2CSpecialization {
    // Detect product category
    let productCategory = 'consumer goods';
    const categories = {
      apparel: ['clothing', 'apparel', 'fashion', 'wear'],
      food: ['food', 'snack', 'beverage', 'meal'],
      beauty: ['beauty', 'skincare', 'cosmetic', 'makeup'],
      home: ['home', 'decor', 'furniture', 'kitchen'],
      health: ['health', 'supplement', 'wellness', 'fitness'],
    };
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        productCategory = cat;
        break;
      }
    }

    // Detect differentiator angle
    let differentiatorAngle = 'quality';
    if (text.includes('sustainable') || text.includes('eco') || text.includes('organic') || text.includes('green')) {
      differentiatorAngle = 'sustainable';
    } else if (text.includes('premium') || text.includes('luxury') || text.includes('artisan')) {
      differentiatorAngle = 'premium';
    } else if (text.includes('affordable') || text.includes('budget') || text.includes('value')) {
      differentiatorAngle = 'budget';
    } else if (text.includes('innovative') || text.includes('tech') || text.includes('smart')) {
      differentiatorAngle = 'innovative';
    }

    // Detect channel focus
    let channelFocus: 'dtc' | 'retail' | 'marketplace' | 'hybrid' = 'dtc';
    if (text.includes('amazon') || text.includes('marketplace') || text.includes('seller')) {
      channelFocus = 'marketplace';
    } else if (text.includes('retail') || text.includes('store') || text.includes('shelf')) {
      channelFocus = 'retail';
    }

    // Detect target demographic
    const targetDemographic = this.extractTargetDemographic(text);

    return {
      ...base,
      profile_type: 'national-product-b2c',
      product_category: productCategory,
      differentiator_angle: differentiatorAngle,
      channel_focus: channelFocus,
      target_demographic: targetDemographic,
    };
  }

  private extractGlobalSaaSB2B(
    uvp: CompleteUVP,
    text: string,
    base: BaseFields
  ): GlobalSaaSB2BSpecialization {
    // Detect enterprise function
    let enterpriseFunction = 'enterprise software';
    const functions = {
      CRM: ['crm', 'customer relationship', 'salesforce'],
      ERP: ['erp', 'enterprise resource', 'sap', 'oracle'],
      Security: ['security', 'identity', 'access management', 'iam'],
      Analytics: ['analytics', 'bi', 'data warehouse', 'insights'],
      Collaboration: ['collaboration', 'productivity', 'workspace'],
    };
    for (const [func, keywords] of Object.entries(functions)) {
      if (keywords.some(kw => text.includes(kw))) {
        enterpriseFunction = func;
        break;
      }
    }

    // Detect scale tier
    let scaleTier = 'mid-market';
    if (text.includes('fortune 500') || text.includes('f500') || text.includes('enterprise')) {
      scaleTier = 'Fortune 500';
    } else if (text.includes('government') || text.includes('public sector') || text.includes('federal')) {
      scaleTier = 'government';
    }

    // Detect compliance requirements
    const complianceReqs = this.extractComplianceRequirements(text);

    // Detect deployment model
    let deploymentModel: 'cloud' | 'on-premise' | 'hybrid' = 'cloud';
    if (text.includes('on-premise') || text.includes('on-prem') || text.includes('self-hosted')) {
      deploymentModel = 'on-premise';
    } else if (text.includes('hybrid')) {
      deploymentModel = 'hybrid';
    }

    // Detect regions served
    const regionsServed = this.extractRegionsServed(text);

    return {
      ...base,
      profile_type: 'global-saas-b2b',
      enterprise_function: enterpriseFunction,
      scale_tier: scaleTier,
      compliance_requirements: complianceReqs,
      deployment_model: deploymentModel,
      regions_served: regionsServed,
    };
  }

  // ==========================================================================
  // HELPER EXTRACTORS
  // ==========================================================================

  private extractAllText(uvp: CompleteUVP): string {
    const texts: string[] = [];
    if (uvp.valuePropositionStatement) texts.push(uvp.valuePropositionStatement);
    if (uvp.whyStatement) texts.push(uvp.whyStatement);
    if (uvp.whatStatement) texts.push(uvp.whatStatement);
    if (uvp.howStatement) texts.push(uvp.howStatement);
    if (uvp.targetCustomer?.statement) texts.push(uvp.targetCustomer.statement);
    if (uvp.keyBenefit?.statement) texts.push(uvp.keyBenefit.statement);
    if (uvp.transformationGoal?.statement) texts.push(uvp.transformationGoal.statement);
    if (uvp.uniqueSolution?.statement) texts.push(uvp.uniqueSolution.statement);
    if (uvp.uniqueSolution?.differentiators) {
      uvp.uniqueSolution.differentiators.forEach(d => {
        texts.push(d.statement);
        if (d.evidence) texts.push(d.evidence);
      });
    }
    return texts.join(' ');
  }

  private extractServiceType(text: string, profileType: BusinessProfileType): string {
    // Extract the primary service/product type
    if (profileType.includes('local-service')) {
      for (const [category, keywords] of Object.entries(SERVICE_CATEGORIES.b2c)) {
        for (const kw of keywords) {
          if (text.includes(kw)) return kw;
        }
      }
    }
    // For SaaS, extract the function
    for (const [func, keywords] of Object.entries(SAAS_FUNCTIONS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) return func;
      }
    }
    return 'general';
  }

  private extractNiche(uvp: CompleteUVP, text: string): string {
    // Try to extract from unique solution
    if (uvp.uniqueSolution?.statement) {
      // First 5-10 words often describe the niche
      const words = uvp.uniqueSolution.statement.split(' ').slice(0, 8);
      return words.join(' ');
    }
    return 'general';
  }

  private extractIndustryVertical(text: string): string {
    const industries = {
      'insurance': ['insurance', 'insurtech', 'policy', 'claims'],
      'healthcare': ['healthcare', 'medical', 'patient', 'clinical'],
      'financial': ['financial', 'banking', 'fintech', 'lending'],
      'retail': ['retail', 'ecommerce', 'shopping', 'merchant'],
      'manufacturing': ['manufacturing', 'industrial', 'factory'],
      'technology': ['technology', 'software', 'saas', 'cloud'],
      'real estate': ['real estate', 'property', 'housing'],
    };
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(kw => text.includes(kw))) {
        return industry;
      }
    }
    return 'general business';
  }

  private extractUniqueMethod(uvp: CompleteUVP): string {
    // Extract the unique methodology/approach
    if (uvp.uniqueSolution?.differentiators?.[0]?.statement) {
      return uvp.uniqueSolution.differentiators[0].statement;
    }
    if (uvp.howStatement) {
      return uvp.howStatement.slice(0, 100);
    }
    return 'standard approach';
  }

  private extractTargetOutcome(uvp: CompleteUVP): string {
    // Extract what customers ultimately want to achieve
    if (uvp.transformationGoal?.after) {
      return uvp.transformationGoal.after;
    }
    if (uvp.keyBenefit?.statement) {
      return uvp.keyBenefit.statement;
    }
    return 'business improvement';
  }

  private extractCompetitors(text: string): string[] {
    const competitors: string[] = [];
    const patterns = [
      /unlike\s+(\w+)/gi,
      /compared\s+to\s+(\w+)/gi,
      /vs\.?\s+(\w+)/gi,
      /alternative\s+to\s+(\w+)/gi,
      /replaces?\s+(\w+)/gi,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const comp = match[1];
        if (comp.length > 3 && !/^(the|our|your|other|manual|legacy)$/i.test(comp)) {
          competitors.push(comp);
        }
      }
    }
    return [...new Set(competitors)].slice(0, 5);
  }

  private extractIndustrySoldTo(text: string): string {
    // IMPORTANT: This is the industry the product is SOLD TO, not the product's industry
    const industries = ['insurance', 'healthcare', 'finance', 'retail', 'manufacturing', 'technology', 'real estate', 'education', 'government'];
    for (const industry of industries) {
      // Look for patterns like "for insurance" or "insurance companies"
      if (text.includes(`for ${industry}`) || text.includes(`${industry} companies`) || text.includes(`${industry} industry`)) {
        return industry;
      }
    }
    // Fallback: just find any industry mentioned
    for (const industry of industries) {
      if (text.includes(industry)) return industry;
    }
    return 'enterprise';
  }

  private extractUniqueApproach(uvp: CompleteUVP, text: string): string {
    // Look for specific technology/methodology
    const approaches = [
      { pattern: 'ai agent', result: 'AI agents' },
      { pattern: 'machine learning', result: 'machine learning' },
      { pattern: 'conversational', result: 'conversational AI' },
      { pattern: 'automation', result: 'intelligent automation' },
      { pattern: 'real-time', result: 'real-time processing' },
      { pattern: 'predictive', result: 'predictive analytics' },
    ];
    for (const { pattern, result } of approaches) {
      if (text.includes(pattern)) return result;
    }
    // Extract from unique solution
    if (uvp.uniqueSolution?.statement) {
      const words = uvp.uniqueSolution.statement.split(' ').slice(0, 5);
      return words.join(' ');
    }
    return 'innovative technology';
  }

  private extractIntegrations(text: string): string[] {
    const commonIntegrations = ['salesforce', 'hubspot', 'slack', 'microsoft', 'google', 'aws', 'azure', 'zapier', 'workday', 'servicenow'];
    return commonIntegrations.filter(int => text.includes(int));
  }

  private extractLocationCount(text: string): number {
    const match = text.match(/(\d+)\s*(location|store|outlet|branch)/i);
    if (match) return parseInt(match[1], 10);
    return 5; // Default
  }

  private extractTargetDemographic(text: string): string {
    const demographics = [
      { pattern: 'millennial', result: 'millennials' },
      { pattern: 'gen z', result: 'Gen Z' },
      { pattern: 'professional', result: 'professionals' },
      { pattern: 'parent', result: 'parents' },
      { pattern: 'women', result: 'women' },
      { pattern: 'men', result: 'men' },
      { pattern: 'senior', result: 'seniors' },
    ];
    for (const { pattern, result } of demographics) {
      if (text.includes(pattern)) return result;
    }
    return 'general consumers';
  }

  private extractComplianceRequirements(text: string): string[] {
    const reqs: string[] = [];
    const standards = ['soc2', 'soc 2', 'gdpr', 'hipaa', 'pci', 'iso 27001', 'fedramp', 'ccpa'];
    for (const std of standards) {
      if (text.includes(std)) reqs.push(std.toUpperCase());
    }
    return reqs.length > 0 ? reqs : ['SOC2'];
  }

  private extractRegionsServed(text: string): string[] {
    const regions: string[] = [];
    const regionPatterns = [
      { pattern: 'north america', result: 'North America' },
      { pattern: 'europe', result: 'Europe' },
      { pattern: 'apac', result: 'APAC' },
      { pattern: 'asia', result: 'Asia' },
      { pattern: 'latam', result: 'LATAM' },
      { pattern: 'global', result: 'Global' },
    ];
    for (const { pattern, result } of regionPatterns) {
      if (text.includes(pattern)) regions.push(result);
    }
    return regions.length > 0 ? regions : ['North America'];
  }

  private calculateConfidence(specialization: SpecializationData, uvp: CompleteUVP): number {
    let confidence = 0;
    const text = this.extractAllText(uvp);

    // Text completeness (up to 30 points)
    confidence += Math.min(text.length / 500 * 30, 30);

    // Profile-specific fields populated (up to 30 points)
    const fieldCount = Object.values(specialization).filter(v => v && v !== 'general').length;
    confidence += Math.min(fieldCount * 3, 30);

    // Niche specificity (up to 20 points)
    if (specialization.niche && specialization.niche !== 'general' && specialization.niche.length > 10) {
      confidence += 20;
    }

    // Competitors detected (up to 10 points)
    confidence += Math.min(specialization.detected_competitors.length * 2, 10);

    // Unique method specified (up to 10 points)
    if (specialization.unique_method && specialization.unique_method !== 'standard approach') {
      confidence += 10;
    }

    return Math.min(Math.round(confidence), 100);
  }
}

// Export singleton
export const specializationDetector = new SpecializationDetector();
