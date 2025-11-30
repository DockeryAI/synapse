/**
 * Trend Category Router Service
 *
 * Routes trend API calls based on 6 SMB business categories.
 * Each category has different data source priorities and unique data points.
 *
 * Categories:
 * 1. Local Service B2B (Commercial HVAC, IT Services)
 * 2. Local Service B2C (Dental, Salon, Restaurant)
 * 3. Regional B2B Agency (Marketing, Accounting, Consulting)
 * 4. Regional Retail/E-commerce B2C (Multi-location Retail)
 * 5. National SaaS B2B (OpenDialog-type)
 * 6. National Product B2C/B2B2C (Consumer Brand, Manufacturer)
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP, MarketGeography } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export type BusinessCategory =
  | 'local_b2b_service'    // Cat 1
  | 'local_b2c_service'    // Cat 2
  | 'regional_b2b_agency'  // Cat 3
  | 'regional_b2c_retail'  // Cat 4
  | 'national_saas_b2b'    // Cat 5
  | 'national_product_b2c'; // Cat 6

export type TrendSourceType =
  | 'serper_search'
  | 'serper_news'
  | 'serper_trends'
  | 'serper_autocomplete'
  | 'serper_places'
  | 'serper_shopping'
  | 'youtube'
  | 'reddit'
  | 'perplexity'
  | 'news_api'
  | 'weather_api'
  | 'semrush'
  | 'outscraper_reviews'
  | 'outscraper_linkedin';

export interface TrendSource {
  type: TrendSourceType;
  priority: 'primary' | 'secondary';
  enabled: boolean;
  /** Refresh interval in minutes */
  refreshInterval: number;
}

export interface CategoryConfig {
  category: BusinessCategory;
  label: string;
  description: string;
  primarySources: TrendSourceType[];
  secondarySources: TrendSourceType[];
  uniqueDataPoints: string[];
  /** Default refresh interval in minutes */
  refreshInterval: number;
}

export interface CategoryDetectionResult {
  category: BusinessCategory;
  confidence: number; // 0-100
  signals: string[];
}

// ============================================================================
// CATEGORY CONFIGURATIONS
// ============================================================================

export const CATEGORY_CONFIGS: Record<BusinessCategory, CategoryConfig> = {
  local_b2b_service: {
    category: 'local_b2b_service',
    label: 'Local Service B2B',
    description: 'Commercial services (HVAC, IT, Industrial)',
    primarySources: [
      'perplexity',
      'news_api',
      'weather_api',
      'serper_places'
    ],
    secondarySources: [
      'serper_search',
      'reddit',
      'outscraper_linkedin',
      'youtube'
    ],
    uniqueDataPoints: [
      'Weather-triggered service demand',
      'Local business district activity',
      'Commercial building permits/developments',
      'B2B networking event trends'
    ],
    refreshInterval: 60
  },

  local_b2c_service: {
    category: 'local_b2c_service',
    label: 'Local Service B2C',
    description: 'Consumer services (Dental, Salon, Restaurant)',
    primarySources: [
      'serper_search',
      'serper_autocomplete',
      'news_api',
      'outscraper_reviews'
    ],
    secondarySources: [
      'youtube',
      'weather_api',
      'serper_places',
      'reddit'
    ],
    uniqueDataPoints: [
      'Local event calendar integration',
      'Seasonal service demand patterns',
      'Competitor review velocity',
      'Consumer spending sentiment'
    ],
    refreshInterval: 30
  },

  regional_b2b_agency: {
    category: 'regional_b2b_agency',
    label: 'Regional B2B Agency',
    description: 'Professional services (Marketing, Accounting, Consulting)',
    primarySources: [
      'outscraper_linkedin',
      'perplexity',
      'serper_search',
      'news_api'
    ],
    secondarySources: [
      'semrush',
      'reddit',
      'youtube',
      'serper_autocomplete'
    ],
    uniqueDataPoints: [
      'LinkedIn engagement trends',
      'Client industry health indicators',
      'Service category demand shifts',
      'Professional certification trends'
    ],
    refreshInterval: 120
  },

  regional_b2c_retail: {
    category: 'regional_b2c_retail',
    label: 'Regional Retail B2C',
    description: 'Multi-location retail & e-commerce',
    primarySources: [
      'serper_shopping',
      'youtube',
      'reddit',
      'serper_places'
    ],
    secondarySources: [
      'news_api',
      'weather_api',
      'serper_autocomplete',
      'perplexity'
    ],
    uniqueDataPoints: [
      'Product category velocity',
      'Price sensitivity indicators',
      'Multi-location performance correlation',
      'Local vs online shopping shifts'
    ],
    refreshInterval: 30
  },

  national_saas_b2b: {
    category: 'national_saas_b2b',
    label: 'Global SaaS B2B',
    description: 'SaaS and technology companies (national/global)',
    primarySources: [
      'reddit',
      'perplexity',
      'semrush',
      'outscraper_linkedin'
    ],
    secondarySources: [
      'youtube',
      'serper_news',
      'serper_autocomplete',
      'news_api'
    ],
    uniqueDataPoints: [
      'Feature request trends',
      'Integration demand signals',
      'Competitor feature announcements',
      'Technology adoption curves'
    ],
    refreshInterval: 240
  },

  national_product_b2c: {
    category: 'national_product_b2c',
    label: 'Global Product B2C',
    description: 'Consumer brands and manufacturers (national/global)',
    primarySources: [
      'youtube',
      'reddit',
      'serper_shopping',
      'semrush'
    ],
    secondarySources: [
      'outscraper_linkedin',
      'news_api',
      'perplexity',
      'serper_search'
    ],
    uniqueDataPoints: [
      'Product review velocity',
      'Influencer mention trends',
      'Retail partner health signals',
      'Channel preference shifts'
    ],
    refreshInterval: 60
  }
};

// ============================================================================
// CATEGORY DETECTION
// ============================================================================

/**
 * Detect business category from UVP data
 */
export function detectBusinessCategory(uvp: CompleteUVP): CategoryDetectionResult {
  const signals: string[] = [];
  const scores: Record<BusinessCategory, number> = {
    local_b2b_service: 0,
    local_b2c_service: 0,
    regional_b2b_agency: 0,
    regional_b2c_retail: 0,
    national_saas_b2b: 0,
    national_product_b2c: 0
  };

  // Debug: Log the incoming UVP data structure
  console.log('[TrendCategoryRouter] Input UVP targetCustomer:', uvp.targetCustomer);
  console.log('[TrendCategoryRouter] Input UVP marketGeography:', uvp.targetCustomer?.marketGeography);

  // -------------------------------------------------------------------------
  // 1. Geographic Scope Detection - HIGHEST PRIORITY
  // This is the most reliable signal and should have the highest weight
  // -------------------------------------------------------------------------
  const geo = uvp.targetCustomer?.marketGeography;
  const scope = geo?.scope;

  console.log('[TrendCategoryRouter] Detected scope:', scope);

  if (scope === 'local') {
    scores.local_b2b_service += 50;
    scores.local_b2c_service += 50;
    signals.push(`Geographic scope: LOCAL (strong signal)`);
  } else if (scope === 'regional') {
    scores.regional_b2b_agency += 40;
    scores.regional_b2c_retail += 40;
    signals.push(`Geographic scope: REGIONAL (strong signal)`);
  } else if (scope === 'national' || scope === 'global') {
    // National/Global is a STRONG signal for national categories
    scores.national_saas_b2b += 50;
    scores.national_product_b2c += 50;
    signals.push(`Geographic scope: ${scope?.toUpperCase()} (strong signal)`);
  } else {
    console.warn('[TrendCategoryRouter] WARNING: No geographic scope found in UVP!');
    signals.push('WARNING: No geographic scope defined');
  }

  // -------------------------------------------------------------------------
  // 2. B2B vs B2C Detection (from industry and customer descriptors)
  // -------------------------------------------------------------------------
  const industry = uvp.targetCustomer?.industry?.toLowerCase() || '';
  const customerStatement = uvp.targetCustomer?.statement?.toLowerCase() || '';
  const role = uvp.targetCustomer?.role?.toLowerCase() || '';

  // B2B signals
  const b2bKeywords = [
    'business', 'enterprise', 'company', 'companies', 'b2b', 'commercial',
    'corporate', 'professional', 'organization', 'firm', 'agency', 'agencies',
    'ceo', 'cto', 'cfo', 'director', 'manager', 'executive', 'decision maker',
    'procurement', 'vendor', 'supplier', 'client'
  ];

  // B2C signals
  const b2cKeywords = [
    'consumer', 'customer', 'individual', 'person', 'people', 'family',
    'homeowner', 'patient', 'student', 'parent', 'user', 'buyer',
    'shopper', 'subscriber', 'member', 'retail', 'ecommerce', 'e-commerce'
  ];

  const allText = `${industry} ${customerStatement} ${role}`;
  const b2bScore = b2bKeywords.filter(kw => allText.includes(kw)).length;
  const b2cScore = b2cKeywords.filter(kw => allText.includes(kw)).length;

  if (b2bScore > b2cScore) {
    scores.local_b2b_service += 20;
    scores.regional_b2b_agency += 20;
    scores.national_saas_b2b += 20;
    signals.push(`B2B signals detected (${b2bScore} keywords)`);
  } else if (b2cScore > b2bScore) {
    scores.local_b2c_service += 20;
    scores.regional_b2c_retail += 20;
    scores.national_product_b2c += 20;
    signals.push(`B2C signals detected (${b2cScore} keywords)`);
  }

  // -------------------------------------------------------------------------
  // 3. Service vs Product Detection
  // -------------------------------------------------------------------------
  const serviceKeywords = [
    'service', 'services', 'consulting', 'advisory', 'support', 'maintenance',
    'repair', 'installation', 'training', 'coaching', 'therapy', 'treatment',
    'care', 'management', 'agency', 'firm', 'practice'
  ];

  const productKeywords = [
    'product', 'products', 'software', 'saas', 'platform', 'app', 'application',
    'tool', 'solution', 'retail', 'store', 'shop', 'merchandise', 'goods',
    'inventory', 'manufacturing', 'brand'
  ];

  const productServices = uvp.productsServices?.categories?.flatMap(c => c.items) || [];
  const productNames = productServices.map(p => p.name.toLowerCase()).join(' ');
  const fullText = `${allText} ${productNames}`;

  const serviceScore = serviceKeywords.filter(kw => fullText.includes(kw)).length;
  const productScore = productKeywords.filter(kw => fullText.includes(kw)).length;

  if (serviceScore > productScore) {
    scores.local_b2b_service += 15;
    scores.local_b2c_service += 15;
    scores.regional_b2b_agency += 15;
    signals.push(`Service-based business detected`);
  } else if (productScore > serviceScore) {
    scores.regional_b2c_retail += 15;
    scores.national_saas_b2b += 15;
    scores.national_product_b2c += 15;
    signals.push(`Product-based business detected`);
  }

  // -------------------------------------------------------------------------
  // 4. SaaS/Tech Detection (high weight for tech companies)
  // -------------------------------------------------------------------------
  const saasKeywords = [
    'saas', 'software', 'platform', 'api', 'cloud', 'subscription', 'tech',
    'technology', 'digital', 'automation', 'ai', 'artificial intelligence',
    'machine learning', 'data', 'analytics', 'integration', 'developer',
    'devops', 'startup', 'conversational', 'chatbot', 'bot', 'agent',
    'enterprise', 'solution', 'deploy'
  ];

  const saasScore = saasKeywords.filter(kw => fullText.includes(kw)).length;
  if (saasScore >= 3) {
    // Strong SaaS signal - give significant boost
    scores.national_saas_b2b += 40;
    signals.push(`Strong SaaS/Tech signals detected (${saasScore} keywords)`);
  } else if (saasScore >= 1) {
    scores.national_saas_b2b += 20;
    signals.push(`SaaS/Tech signals detected (${saasScore} keywords)`);
  }

  // -------------------------------------------------------------------------
  // 5. Agency/Professional Services Detection
  // Note: "insurance" removed - it's a target industry for SaaS, not an agency type
  // -------------------------------------------------------------------------
  const agencyKeywords = [
    'agency', 'consulting', 'marketing', 'advertising', 'accounting', 'legal',
    'law firm', 'financial advisor', 'real estate', 'recruiting',
    'hr', 'human resources', 'design', 'creative', 'pr', 'public relations',
    'marketing agency', 'ad agency', 'consulting firm'
  ];

  const agencyScore = agencyKeywords.filter(kw => fullText.includes(kw)).length;
  if (agencyScore >= 2) {
    scores.regional_b2b_agency += 25;
    signals.push(`Agency/Professional services detected (${agencyScore} keywords)`);
  }

  // -------------------------------------------------------------------------
  // 6. Retail/E-commerce Detection
  // -------------------------------------------------------------------------
  const retailKeywords = [
    'retail', 'store', 'shop', 'e-commerce', 'ecommerce', 'online store',
    'shopify', 'amazon', 'marketplace', 'inventory', 'franchise', 'location'
  ];

  const retailScore = retailKeywords.filter(kw => fullText.includes(kw)).length;
  if (retailScore >= 2) {
    scores.regional_b2c_retail += 25;
    signals.push(`Retail/E-commerce signals detected (${retailScore} keywords)`);
  }

  // -------------------------------------------------------------------------
  // Find highest scoring category
  // -------------------------------------------------------------------------
  let maxCategory: BusinessCategory = 'national_saas_b2b'; // Default to SaaS if no clear signals
  let maxScore = 0;

  (Object.keys(scores) as BusinessCategory[]).forEach(cat => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      maxCategory = cat;
    }
  });

  // Normalize confidence to 0-100
  const confidence = Math.min(100, Math.round((maxScore / 100) * 100));

  // Debug logging
  console.log('[TrendCategoryRouter] Detection scores:', scores);
  console.log('[TrendCategoryRouter] Selected:', maxCategory, 'with confidence:', confidence);
  console.log('[TrendCategoryRouter] Signals:', signals);

  return {
    category: maxCategory,
    confidence,
    signals
  };
}

// ============================================================================
// ROUTING FUNCTIONS
// ============================================================================

/**
 * Get trend sources for a business category
 */
export function getTrendSources(category: BusinessCategory): TrendSource[] {
  const config = CATEGORY_CONFIGS[category];
  const sources: TrendSource[] = [];

  config.primarySources.forEach(type => {
    sources.push({
      type,
      priority: 'primary',
      enabled: true,
      refreshInterval: config.refreshInterval
    });
  });

  config.secondarySources.forEach(type => {
    sources.push({
      type,
      priority: 'secondary',
      enabled: true,
      refreshInterval: config.refreshInterval * 2 // Secondary sources refresh less often
    });
  });

  return sources;
}

/**
 * Get enabled sources only
 */
export function getEnabledSources(sources: TrendSource[]): TrendSource[] {
  return sources.filter(s => s.enabled);
}

/**
 * Get primary sources only
 */
export function getPrimarySources(sources: TrendSource[]): TrendSource[] {
  return sources.filter(s => s.priority === 'primary' && s.enabled);
}

/**
 * Check if a source type is available for a category
 */
export function isSourceAvailable(
  category: BusinessCategory,
  sourceType: TrendSourceType
): boolean {
  const config = CATEGORY_CONFIGS[category];
  return (
    config.primarySources.includes(sourceType) ||
    config.secondarySources.includes(sourceType)
  );
}

/**
 * Get unique data points for a category
 */
export function getUniqueDataPoints(category: BusinessCategory): string[] {
  return CATEGORY_CONFIGS[category].uniqueDataPoints;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TrendCategoryRouter = {
  detectCategory: detectBusinessCategory,
  getConfig: (category: BusinessCategory) => CATEGORY_CONFIGS[category],
  getSources: getTrendSources,
  getEnabledSources,
  getPrimarySources,
  isSourceAvailable,
  getUniqueDataPoints,
  CONFIGS: CATEGORY_CONFIGS
};

export default TrendCategoryRouter;
