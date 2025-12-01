/**
 * Profile Detection Service
 *
 * Auto-detects business profile type from UVP data for trigger customization.
 *
 * Profile Types:
 * 1. Local Service B2B (Commercial HVAC, IT services)
 * 2. Local Service B2C (Dental, salon, restaurant)
 * 3. Regional B2B Agency (Marketing, accounting, consulting)
 * 4. Regional Retail B2C (Multi-location retail, franchise)
 * 5. National SaaS B2B (US-focused SaaS)
 * 6. National Product B2C (Consumer brand, manufacturer)
 * 7. Global SaaS B2B (International SaaS like OpenDialog - UK/EMEA focus)
 *
 * Created: 2025-11-28
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export type BusinessProfileType =
  | 'local-service-b2b'
  | 'local-service-b2c'
  | 'regional-b2b-agency'
  | 'regional-retail-b2c'
  | 'national-saas-b2b'
  | 'national-product-b2c'
  | 'global-saas-b2b';

export type GeographicScope = 'local' | 'regional' | 'national' | 'global';
export type CustomerType = 'b2b' | 'b2c' | 'b2b2c';
export type OfferingType = 'service' | 'product' | 'saas' | 'hybrid';

export interface BusinessProfileAnalysis {
  profileType: BusinessProfileType;
  confidence: number;
  scope: GeographicScope;
  customerType: CustomerType;
  offeringType: OfferingType;
  signals: string[];
}

export interface ProfileTriggerConfig {
  priorityTriggers: string[];
  prioritySources: string[];
  uvpEmphasis: string[];
  languageStyle: 'local' | 'professional' | 'technical' | 'consumer';
}

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

const LOCAL_INDICATORS = [
  'local', 'city', 'town', 'neighborhood', 'community', 'area',
  'nearby', 'near me', 'in-person', 'on-site', 'walk-in',
  'appointment', 'visit us', 'stop by', 'serving'
];

const REGIONAL_INDICATORS = [
  'region', 'state', 'multi-location', 'branches', 'locations',
  'franchise', 'territory', 'metro', 'tri-state', 'greater'
];

const NATIONAL_INDICATORS = [
  'nationwide', 'national', 'across the country', 'all 50 states',
  'remote', 'virtual', 'online', 'cloud', 'us-based', 'american'
];

const GLOBAL_INDICATORS = [
  'global', 'international', 'worldwide', 'multi-region', 'multinational',
  'emea', 'apac', 'uk', 'europe', 'european', 'united kingdom', 'britain',
  'gdpr', 'iso', 'soc2', 'data residency', 'cross-border', 'localization',
  'multi-language', 'eu', 'asia pacific', 'middle east', 'africa',
  // Major international cities - company HQ location indicates global scope
  'london', 'paris', 'berlin', 'amsterdam', 'dublin', 'singapore', 'tokyo',
  'sydney', 'toronto', 'hong kong', 'mumbai', 'bangalore', 'tel aviv',
  'zurich', 'stockholm', 'copenhagen', 'melbourne', 'dubai', 'frankfurt'
];

const B2B_INDICATORS = [
  'business', 'enterprise', 'company', 'organization', 'corporate',
  'professional', 'commercial', 'B2B', 'vendor', 'partner',
  'client', 'account', 'contract', 'procurement', 'RFP'
];

const B2C_INDICATORS = [
  'customer', 'consumer', 'individual', 'personal', 'family',
  'home', 'residential', 'retail', 'shopping', 'buy now'
];

const SAAS_INDICATORS = [
  'software', 'platform', 'app', 'SaaS', 'subscription',
  'API', 'integration', 'dashboard', 'login', 'trial',
  'cloud-based', 'automated', 'AI-powered'
];

const SERVICE_INDICATORS = [
  'service', 'consulting', 'agency', 'firm', 'practice',
  'expertise', 'specialist', 'advisor', 'support', 'maintenance'
];

const PRODUCT_INDICATORS = [
  'product', 'item', 'goods', 'merchandise', 'inventory',
  'SKU', 'shipping', 'delivery', 'warehouse', 'manufacturing'
];

// Industry-specific patterns
const LOCAL_SERVICE_B2B_INDUSTRIES = [
  'hvac', 'plumbing', 'electrical', 'it services', 'managed services',
  'commercial cleaning', 'janitorial', 'security', 'landscaping commercial',
  'commercial roofing', 'industrial', 'b2b services'
];

const LOCAL_SERVICE_B2C_INDUSTRIES = [
  'dental', 'medical', 'healthcare', 'salon', 'spa', 'barbershop',
  'restaurant', 'cafe', 'fitness', 'gym', 'yoga', 'daycare',
  'pet grooming', 'auto repair', 'home services', 'residential'
];

const AGENCY_INDUSTRIES = [
  'marketing', 'advertising', 'digital agency', 'creative', 'pr',
  'consulting', 'accounting', 'legal', 'law firm', 'financial advisory',
  'recruiting', 'staffing', 'hr consulting'
];

const SAAS_INDUSTRIES = [
  'software', 'saas', 'technology', 'tech', 'ai', 'machine learning',
  'automation', 'platform', 'fintech', 'healthtech', 'martech'
];

const GLOBAL_SAAS_INDUSTRIES = [
  'conversational ai', 'chatbot', 'nlp', 'nlu', 'enterprise ai',
  'customer service automation', 'contact center', 'cx platform',
  'dialogue management', 'virtual assistant', 'bot platform'
];

// ============================================================================
// PROFILE CONFIGS
// ============================================================================

export const PROFILE_CONFIGS: Record<BusinessProfileType, ProfileTriggerConfig> = {
  'local-service-b2b': {
    priorityTriggers: ['reliability', 'downtime-fear', 'compliance', 'response-time', 'local-expertise'],
    prioritySources: ['google-reviews', 'industry-forums', 'linkedin-local'],
    uvpEmphasis: ['response-time', 'slas', 'local-reputation', 'certifications'],
    languageStyle: 'professional'
  },
  'local-service-b2c': {
    priorityTriggers: ['trust-safety', 'convenience', 'price-anxiety', 'quality-concern', 'availability'],
    prioritySources: ['google-reviews', 'yelp', 'facebook', 'nextdoor'],
    uvpEmphasis: ['proximity', 'reviews', 'personal-touch', 'experience'],
    languageStyle: 'local'
  },
  'regional-b2b-agency': {
    priorityTriggers: ['roi-skepticism', 'expertise-doubt', 'past-failures', 'accountability', 'results'],
    prioritySources: ['linkedin', 'clutch', 'g2', 'case-studies'],
    uvpEmphasis: ['results', 'industry-expertise', 'process', 'track-record'],
    languageStyle: 'professional'
  },
  'regional-retail-b2c': {
    priorityTriggers: ['availability', 'consistency', 'value', 'brand-trust', 'convenience'],
    prioritySources: ['google-reviews', 'social-media', 'local-news'],
    uvpEmphasis: ['locations', 'promotions', 'brand-trust', 'selection'],
    languageStyle: 'consumer'
  },
  'national-saas-b2b': {
    priorityTriggers: ['integration-fear', 'adoption-risk', 'vendor-lock-in', 'security', 'support'],
    prioritySources: ['g2', 'reddit', 'hackernews', 'linkedin', 'capterra'],
    uvpEmphasis: ['security', 'support', 'migration-path', 'integrations', 'uptime'],
    languageStyle: 'technical'
  },
  'national-product-b2c': {
    priorityTriggers: ['quality-doubt', 'comparison-shopping', 'social-proof', 'returns', 'authenticity'],
    prioritySources: ['amazon-reviews', 'tiktok', 'influencer', 'reddit', 'youtube'],
    uvpEmphasis: ['differentiation', 'social-proof', 'value', 'quality', 'brand-story'],
    languageStyle: 'consumer'
  },
  'global-saas-b2b': {
    priorityTriggers: ['integration-fear', 'vendor-lock-in', 'compliance', 'data-residency', 'localization', 'enterprise-governance', 'multi-region-support'],
    prioritySources: ['g2', 'reddit', 'linkedin', 'gartner', 'forrester', 'trustpilot-uk', 'capterra-eu'],
    uvpEmphasis: ['gdpr-compliance', 'multi-region', 'enterprise-security', 'localization', 'data-sovereignty', 'soc2-iso'],
    languageStyle: 'technical'
  }
};

// ============================================================================
// DETECTION SERVICE
// ============================================================================

class ProfileDetectionService {
  // Per-brand profile cache with 1-hour TTL
  private profileCache: Map<string, { analysis: BusinessProfileAnalysis; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get cached profile analysis for a brand
   */
  getCachedProfile(brandId: string): BusinessProfileAnalysis | null {
    const cached = this.profileCache.get(brandId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[ProfileDetection] Using cached profile for brand:', brandId);
      return cached.analysis;
    }
    return null;
  }

  /**
   * Cache profile analysis for a brand
   */
  cacheProfile(brandId: string, analysis: BusinessProfileAnalysis): void {
    this.profileCache.set(brandId, { analysis, timestamp: Date.now() });
    console.log('[ProfileDetection] Cached profile for brand:', brandId, analysis.profileType);
  }

  /**
   * Clear cached profile for a brand
   */
  clearCachedProfile(brandId?: string): void {
    if (brandId) {
      this.profileCache.delete(brandId);
    } else {
      this.profileCache.clear();
    }
  }

  /**
   * Detect business profile type from UVP data
   */
  detectProfile(uvp: CompleteUVP, brandData?: any): BusinessProfileAnalysis {
    const signals: string[] = [];

    // Gather all text for analysis
    const textSources = this.gatherTextSources(uvp, brandData);
    const combinedText = textSources.join(' ').toLowerCase();

    // Detect geographic scope - check explicit marketGeography first
    const scope = this.detectScope(combinedText, signals, uvp);

    // Detect customer type (B2B vs B2C)
    const customerType = this.detectCustomerType(combinedText, uvp, signals);

    // Detect offering type
    const offeringType = this.detectOfferingType(combinedText, uvp, signals);

    // Detect industry-specific patterns
    const industrySignals = this.detectIndustryPatterns(combinedText, brandData?.industry);

    // Determine profile type
    const profileType = this.determineProfileType(scope, customerType, offeringType, industrySignals, signals);

    // Calculate confidence based on signal strength
    const confidence = this.calculateConfidence(signals);

    return {
      profileType,
      confidence,
      scope,
      customerType,
      offeringType,
      signals
    };
  }

  /**
   * Get trigger configuration for a profile type
   */
  getProfileConfig(profileType: BusinessProfileType): ProfileTriggerConfig {
    return PROFILE_CONFIGS[profileType];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private gatherTextSources(uvp: CompleteUVP, brandData?: any): string[] {
    const sources: string[] = [];

    // Target customer
    if (uvp.targetCustomer?.statement) sources.push(uvp.targetCustomer.statement);
    if (uvp.targetCustomer?.industry) sources.push(uvp.targetCustomer.industry);
    if (uvp.targetCustomer?.evidenceQuotes) sources.push(...uvp.targetCustomer.evidenceQuotes);
    if (uvp.targetCustomer?.emotionalDrivers) sources.push(...uvp.targetCustomer.emotionalDrivers);
    if (uvp.targetCustomer?.functionalDrivers) sources.push(...uvp.targetCustomer.functionalDrivers);

    // Key benefit
    if (uvp.keyBenefit?.statement) sources.push(uvp.keyBenefit.statement);
    if (uvp.keyBenefit?.metrics) sources.push(...uvp.keyBenefit.metrics.map(m => `${m.metric}: ${m.value}`));

    // Transformation
    if (uvp.transformationGoal?.statement) sources.push(uvp.transformationGoal.statement);
    if (uvp.transformationGoal?.before) sources.push(uvp.transformationGoal.before);
    if (uvp.transformationGoal?.after) sources.push(uvp.transformationGoal.after);
    if (uvp.transformationGoal?.emotionalDrivers) sources.push(...uvp.transformationGoal.emotionalDrivers);
    if (uvp.transformationGoal?.functionalDrivers) sources.push(...uvp.transformationGoal.functionalDrivers);

    // Unique solution
    if (uvp.uniqueSolution?.statement) sources.push(uvp.uniqueSolution.statement);
    if (uvp.uniqueSolution?.differentiators) sources.push(...uvp.uniqueSolution.differentiators.map(d => d.statement));

    // Products/services
    if ((uvp as any).productsServices?.categories) {
      (uvp as any).productsServices.categories.forEach((cat: any) => {
        if (cat.name) sources.push(cat.name);
        cat.items?.forEach((item: any) => {
          if (item.name) sources.push(item.name);
          if (item.description) sources.push(item.description);
        });
      });
    }

    // Brand data
    if (brandData) {
      if (brandData.name) sources.push(brandData.name);
      if (brandData.industry) sources.push(brandData.industry);
      if (brandData.description) sources.push(brandData.description);
      if (brandData.location) sources.push(brandData.location);
    }

    return sources.filter(Boolean);
  }

  private detectScope(text: string, signals: string[], uvp?: CompleteUVP): GeographicScope {
    // FIRST: Check explicit marketGeography from UVP (highest priority)
    const marketGeo = uvp?.targetCustomer?.marketGeography;
    if (marketGeo?.scope) {
      signals.push(`MarketGeography explicit scope: ${marketGeo.scope}`);
      if (marketGeo.primaryRegions?.length) {
        signals.push(`MarketGeography regions: ${marketGeo.primaryRegions.join(', ')}`);
      }
      return marketGeo.scope;
    }

    const localScore = this.countMatches(text, LOCAL_INDICATORS);
    const regionalScore = this.countMatches(text, REGIONAL_INDICATORS);
    const nationalScore = this.countMatches(text, NATIONAL_INDICATORS);
    const globalScore = this.countMatches(text, GLOBAL_INDICATORS);

    // Global takes priority if any global signals (EMEA, UK, GDPR, international cities, etc.)
    // Single signal is sufficient - a company HQ'd in London/Paris/etc. is inherently global
    if (globalScore >= 1 && globalScore >= nationalScore) {
      signals.push(`Global scope (${globalScore} signals: EMEA/UK/international cities)`);
      return 'global';
    }
    if (nationalScore > localScore && nationalScore > regionalScore) {
      signals.push(`National scope (${nationalScore} signals)`);
      return 'national';
    }
    if (regionalScore > localScore) {
      signals.push(`Regional scope (${regionalScore} signals)`);
      return 'regional';
    }
    if (localScore > 0) {
      signals.push(`Local scope (${localScore} signals)`);
      return 'local';
    }

    // Default based on absence of signals
    signals.push('Defaulting to local scope (no clear signals)');
    return 'local';
  }

  private detectCustomerType(text: string, uvp: CompleteUVP, signals: string[]): CustomerType {
    const b2bScore = this.countMatches(text, B2B_INDICATORS);
    const b2cScore = this.countMatches(text, B2C_INDICATORS);

    // Check target customer explicitly
    const targetCustomer = uvp.targetCustomer?.statement?.toLowerCase() || '';
    if (targetCustomer.includes('business') || targetCustomer.includes('company') || targetCustomer.includes('enterprise')) {
      b2bScore + 3;
      signals.push('Target customer indicates B2B');
    }
    if (targetCustomer.includes('individual') || targetCustomer.includes('consumer') || targetCustomer.includes('homeowner')) {
      b2cScore + 3;
      signals.push('Target customer indicates B2C');
    }

    if (b2bScore > b2cScore + 2) {
      signals.push(`B2B customer type (${b2bScore} vs ${b2cScore})`);
      return 'b2b';
    }
    if (b2cScore > b2bScore + 2) {
      signals.push(`B2C customer type (${b2cScore} vs ${b2bScore})`);
      return 'b2c';
    }
    if (b2bScore > 0 && b2cScore > 0) {
      signals.push(`Hybrid B2B2C (${b2bScore} B2B, ${b2cScore} B2C)`);
      return 'b2b2c';
    }

    signals.push('Defaulting to B2C (no clear signals)');
    return 'b2c';
  }

  private detectOfferingType(text: string, uvp: CompleteUVP, signals: string[]): OfferingType {
    const saasScore = this.countMatches(text, SAAS_INDICATORS);
    const serviceScore = this.countMatches(text, SERVICE_INDICATORS);
    const productScore = this.countMatches(text, PRODUCT_INDICATORS);

    if (saasScore > serviceScore && saasScore > productScore) {
      signals.push(`SaaS offering (${saasScore} signals)`);
      return 'saas';
    }
    if (productScore > serviceScore) {
      signals.push(`Product offering (${productScore} signals)`);
      return 'product';
    }
    if (serviceScore > 0) {
      signals.push(`Service offering (${serviceScore} signals)`);
      return 'service';
    }

    signals.push('Defaulting to service offering');
    return 'service';
  }

  private detectIndustryPatterns(text: string, industry?: string): string[] {
    const matches: string[] = [];
    const industryLower = (industry || '').toLowerCase();

    LOCAL_SERVICE_B2B_INDUSTRIES.forEach(ind => {
      if (text.includes(ind) || industryLower.includes(ind)) {
        matches.push(`local-service-b2b:${ind}`);
      }
    });

    LOCAL_SERVICE_B2C_INDUSTRIES.forEach(ind => {
      if (text.includes(ind) || industryLower.includes(ind)) {
        matches.push(`local-service-b2c:${ind}`);
      }
    });

    AGENCY_INDUSTRIES.forEach(ind => {
      if (text.includes(ind) || industryLower.includes(ind)) {
        matches.push(`regional-b2b-agency:${ind}`);
      }
    });

    SAAS_INDUSTRIES.forEach(ind => {
      if (text.includes(ind) || industryLower.includes(ind)) {
        matches.push(`national-saas-b2b:${ind}`);
      }
    });

    // Check for global SaaS indicators (conversational AI, chatbot, etc.)
    GLOBAL_SAAS_INDUSTRIES.forEach(ind => {
      if (text.includes(ind) || industryLower.includes(ind)) {
        matches.push(`global-saas-b2b:${ind}`);
      }
    });

    return matches;
  }

  private determineProfileType(
    scope: GeographicScope,
    customerType: CustomerType,
    offeringType: OfferingType,
    industrySignals: string[],
    signals: string[]
  ): BusinessProfileType {
    // Check industry-specific overrides first
    const industryProfile = this.getIndustryOverride(industrySignals);
    if (industryProfile) {
      signals.push(`Industry match: ${industryProfile}`);
      return industryProfile;
    }

    // Global SaaS detection - specific for international B2B SaaS
    if (scope === 'global' && offeringType === 'saas' && customerType === 'b2b') {
      signals.push('Global + SaaS + B2B → global-saas-b2b');
      return 'global-saas-b2b';
    }

    // Global B2B defaults to global-saas-b2b (enterprise focus)
    if (scope === 'global' && customerType === 'b2b') {
      signals.push('Global + B2B → global-saas-b2b');
      return 'global-saas-b2b';
    }

    // SaaS detection for national scope
    if (offeringType === 'saas' && scope !== 'global') {
      signals.push('SaaS detected → national-saas-b2b');
      return 'national-saas-b2b';
    }

    // Map scope + customer type + offering to profile
    if (scope === 'local') {
      if (customerType === 'b2b') {
        signals.push('Local + B2B → local-service-b2b');
        return 'local-service-b2b';
      }
      signals.push('Local + B2C → local-service-b2c');
      return 'local-service-b2c';
    }

    if (scope === 'regional') {
      if (customerType === 'b2b' && offeringType === 'service') {
        signals.push('Regional + B2B + Service → regional-b2b-agency');
        return 'regional-b2b-agency';
      }
      signals.push('Regional + B2C → regional-retail-b2c');
      return 'regional-retail-b2c';
    }

    if (scope === 'national') {
      if (customerType === 'b2b') {
        signals.push('National + B2B → national-saas-b2b');
        return 'national-saas-b2b';
      }
      signals.push('National + B2C → national-product-b2c');
      return 'national-product-b2c';
    }

    // Global B2C
    if (scope === 'global' && customerType === 'b2c') {
      signals.push('Global + B2C → national-product-b2c');
      return 'national-product-b2c';
    }

    // Fallback
    signals.push('Fallback → local-service-b2c');
    return 'local-service-b2c';
  }

  private getIndustryOverride(industrySignals: string[]): BusinessProfileType | null {
    const counts: Record<string, number> = {};
    industrySignals.forEach(sig => {
      const profile = sig.split(':')[0] as BusinessProfileType;
      counts[profile] = (counts[profile] || 0) + 1;
    });

    let maxProfile: BusinessProfileType | null = null;
    let maxCount = 0;
    Object.entries(counts).forEach(([profile, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxProfile = profile as BusinessProfileType;
      }
    });

    // Global SaaS B2B (conversational AI, chatbots, etc.) only needs 1 match
    // since these industries are inherently global/enterprise
    if (counts['global-saas-b2b'] >= 1) {
      return 'global-saas-b2b';
    }

    return maxCount >= 2 ? maxProfile : null;
  }

  private countMatches(text: string, patterns: string[]): number {
    return patterns.reduce((count, pattern) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private calculateConfidence(signals: string[]): number {
    // More signals = higher confidence
    const signalCount = signals.length;
    if (signalCount >= 8) return 0.95;
    if (signalCount >= 6) return 0.85;
    if (signalCount >= 4) return 0.75;
    if (signalCount >= 2) return 0.65;
    return 0.5;
  }
}

// Export singleton
export const profileDetectionService = new ProfileDetectionService();
