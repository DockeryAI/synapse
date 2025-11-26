/**
 * Product Marketing Feature Flags
 *
 * Controls activation of product marketing functionality.
 * All flags default to FALSE for safety - features must be explicitly enabled.
 *
 * Environment variables override defaults:
 * - VITE_PRODUCT_MARKETING_ENABLED
 * - VITE_PRODUCT_EXTRACTION_ENABLED
 * - VITE_PRODUCT_UI_ENABLED
 * - VITE_PRODUCT_ENRICHMENT_ENABLED
 */

export interface ProductMarketingFlags {
  /** Master switch - if false, all product marketing features are disabled */
  PRODUCT_MARKETING_ENABLED: boolean;
  /** Enable product CRUD operations */
  PRODUCT_CRUD_ENABLED: boolean;
  /** Enable product extraction from various sources */
  PRODUCT_EXTRACTION_ENABLED: boolean;
  /** Enable product management UI components */
  PRODUCT_UI_ENABLED: boolean;
  /** Enable product enrichment (categorization, features, seasonal tagging) */
  PRODUCT_ENRICHMENT_ENABLED: boolean;
  /** Enable UVP extraction */
  EXTRACTION_UVP_ENABLED: boolean;
  /** Enable website extraction */
  EXTRACTION_WEBSITE_ENABLED: boolean;
  /** Enable reviews extraction */
  EXTRACTION_REVIEWS_ENABLED: boolean;
  /** Enable keywords extraction */
  EXTRACTION_KEYWORDS_ENABLED: boolean;
  /** Enable categorization enrichment */
  ENRICHMENT_CATEGORIZATION_ENABLED: boolean;
  /** Enable feature extraction enrichment */
  ENRICHMENT_FEATURES_ENABLED: boolean;
  /** Enable seasonal tagging enrichment */
  ENRICHMENT_SEASONAL_ENABLED: boolean;
}

/** Feature flag keys for export */
export const FEATURE_FLAGS: Record<keyof ProductMarketingFlags, keyof ProductMarketingFlags> = {
  PRODUCT_MARKETING_ENABLED: 'PRODUCT_MARKETING_ENABLED',
  PRODUCT_CRUD_ENABLED: 'PRODUCT_CRUD_ENABLED',
  PRODUCT_EXTRACTION_ENABLED: 'PRODUCT_EXTRACTION_ENABLED',
  PRODUCT_UI_ENABLED: 'PRODUCT_UI_ENABLED',
  PRODUCT_ENRICHMENT_ENABLED: 'PRODUCT_ENRICHMENT_ENABLED',
  EXTRACTION_UVP_ENABLED: 'EXTRACTION_UVP_ENABLED',
  EXTRACTION_WEBSITE_ENABLED: 'EXTRACTION_WEBSITE_ENABLED',
  EXTRACTION_REVIEWS_ENABLED: 'EXTRACTION_REVIEWS_ENABLED',
  EXTRACTION_KEYWORDS_ENABLED: 'EXTRACTION_KEYWORDS_ENABLED',
  ENRICHMENT_CATEGORIZATION_ENABLED: 'ENRICHMENT_CATEGORIZATION_ENABLED',
  ENRICHMENT_FEATURES_ENABLED: 'ENRICHMENT_FEATURES_ENABLED',
  ENRICHMENT_SEASONAL_ENABLED: 'ENRICHMENT_SEASONAL_ENABLED',
};

/** Feature flag type */
export type FeatureFlag = keyof ProductMarketingFlags;

/**
 * Parse environment variable as boolean
 * Supports: 'true', '1', 'yes' as truthy values
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

/**
 * Get current feature flag configuration
 * Reads from environment variables with safe defaults
 */
export function getProductMarketingFlags(): ProductMarketingFlags {
  // In Vite, env vars are accessed via import.meta.env
  const env = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' ? process.env : {});

  const masterEnabled = parseEnvBoolean(
    env.VITE_PRODUCT_MARKETING_ENABLED || env.PRODUCT_MARKETING_ENABLED,
    false
  );

  return {
    PRODUCT_MARKETING_ENABLED: masterEnabled,
    PRODUCT_CRUD_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_PRODUCT_CRUD_ENABLED || env.PRODUCT_CRUD_ENABLED,
      true // Default true when master is enabled
    ),
    PRODUCT_EXTRACTION_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_PRODUCT_EXTRACTION_ENABLED || env.PRODUCT_EXTRACTION_ENABLED,
      true
    ),
    PRODUCT_UI_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_PRODUCT_UI_ENABLED || env.PRODUCT_UI_ENABLED,
      true
    ),
    PRODUCT_ENRICHMENT_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_PRODUCT_ENRICHMENT_ENABLED || env.PRODUCT_ENRICHMENT_ENABLED,
      true
    ),
    // Extraction sub-flags
    EXTRACTION_UVP_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_EXTRACTION_UVP_ENABLED || env.EXTRACTION_UVP_ENABLED,
      true
    ),
    EXTRACTION_WEBSITE_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_EXTRACTION_WEBSITE_ENABLED || env.EXTRACTION_WEBSITE_ENABLED,
      true
    ),
    EXTRACTION_REVIEWS_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_EXTRACTION_REVIEWS_ENABLED || env.EXTRACTION_REVIEWS_ENABLED,
      true
    ),
    EXTRACTION_KEYWORDS_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_EXTRACTION_KEYWORDS_ENABLED || env.EXTRACTION_KEYWORDS_ENABLED,
      true
    ),
    // Enrichment sub-flags
    ENRICHMENT_CATEGORIZATION_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_ENRICHMENT_CATEGORIZATION_ENABLED || env.ENRICHMENT_CATEGORIZATION_ENABLED,
      true
    ),
    ENRICHMENT_FEATURES_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_ENRICHMENT_FEATURES_ENABLED || env.ENRICHMENT_FEATURES_ENABLED,
      true
    ),
    ENRICHMENT_SEASONAL_ENABLED: masterEnabled && parseEnvBoolean(
      env.VITE_ENRICHMENT_SEASONAL_ENABLED || env.ENRICHMENT_SEASONAL_ENABLED,
      true
    ),
  };
}

/**
 * Check if a specific feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof ProductMarketingFlags): boolean {
  const flags = getProductMarketingFlags();

  // Master switch check - if main flag is off, all features are off
  if (!flags.PRODUCT_MARKETING_ENABLED) {
    return false;
  }

  return flags[flag];
}

/**
 * Check if product marketing is fully enabled (master switch)
 */
export function isProductMarketingEnabled(): boolean {
  return getProductMarketingFlags().PRODUCT_MARKETING_ENABLED;
}

/**
 * Check if product extraction is enabled
 */
export function isExtractionEnabled(): boolean {
  return isFeatureEnabled('PRODUCT_EXTRACTION_ENABLED');
}

/**
 * Check if product UI is enabled
 */
export function isUIEnabled(): boolean {
  return isFeatureEnabled('PRODUCT_UI_ENABLED');
}

/**
 * Check if product enrichment is enabled
 */
export function isEnrichmentEnabled(): boolean {
  return isFeatureEnabled('PRODUCT_ENRICHMENT_ENABLED');
}

/**
 * Feature flag guard for async operations
 * Throws error if feature is disabled
 */
export function requireFeature(flag: keyof ProductMarketingFlags, operationName: string): void {
  if (!isFeatureEnabled(flag)) {
    throw new Error(
      `Feature "${flag}" is disabled. Cannot perform operation: ${operationName}. ` +
      `Enable the feature by setting VITE_${flag}=true in your environment.`
    );
  }
}

/**
 * Decorator-style wrapper for feature-gated functions
 * Returns undefined if feature is disabled, otherwise executes function
 */
export async function withFeatureFlag<T>(
  flag: keyof ProductMarketingFlags,
  fn: () => Promise<T>
): Promise<T | undefined> {
  if (!isFeatureEnabled(flag)) {
    console.warn(`Feature "${flag}" is disabled. Skipping operation.`);
    return undefined;
  }
  return fn();
}

// Export singleton flags for easy access
export const productMarketingFlags = getProductMarketingFlags();
