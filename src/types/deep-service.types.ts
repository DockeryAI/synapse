/**
 * Deep Service Extraction Types
 *
 * Comprehensive types for extracting services/products from websites
 * with high accuracy and confidence scoring.
 */

/**
 * Source attribution for extracted services
 */
export interface ServiceSource {
  /** URL where service was found */
  url: string
  /** Type of source (navigation, page content, pricing table, etc) */
  type: 'navigation' | 'service-page' | 'pricing-table' | 'content-pattern' | 'meta-description'
  /** Exact text that was matched */
  matchedText: string
  /** Section/context where found */
  context?: string
  /** Confidence that this is a valid source (0-1) */
  confidence: number
}

/**
 * Service category classification
 */
export type ServiceCategory =
  | 'primary'      // Main offering
  | 'secondary'    // Important but not primary
  | 'addon'        // Supplementary service
  | 'package'      // Bundled offering
  | 'tier'         // Part of tiered pricing

/**
 * Pricing information
 */
export interface PricingInfo {
  /** Raw pricing text */
  raw: string
  /** Parsed minimum price */
  min?: number
  /** Parsed maximum price */
  max?: number
  /** Pricing model (one-time, monthly, annual, etc) */
  model?: 'one-time' | 'monthly' | 'annual' | 'hourly' | 'custom'
  /** Currency code */
  currency?: string
  /** Confidence in pricing extraction (0-1) */
  confidence: number
}

/**
 * Deep service/product data with comprehensive metadata
 */
export interface DeepServiceData {
  /** Unique identifier */
  id: string
  /** Service/product name */
  name: string
  /** Detailed description */
  description: string
  /** Category classification */
  category: ServiceCategory
  /** Pricing information if available */
  pricing?: PricingInfo
  /** Features/benefits list */
  features: string[]
  /** Duration (in minutes) if applicable */
  durationMinutes?: number
  /** All sources where this service was found */
  sources: ServiceSource[]
  /** Overall confidence score (0-1) */
  confidence: number
  /** Whether this is a product vs service */
  isProduct: boolean
  /** Related services (by ID) */
  relatedServices: string[]
  /** Tags for categorization */
  tags: string[]
  /** When extracted */
  extractedAt: Date
}

/**
 * Deep scan result containing all extracted services
 */
export interface DeepScanResult {
  /** All extracted services */
  services: DeepServiceData[]
  /** Primary offerings */
  primaryServices: string[]
  /** Service packages/bundles */
  packages: Array<{
    name: string
    includedServices: string[]
    pricing?: PricingInfo
  }>
  /** Overall scan confidence */
  overallConfidence: number
  /** Statistics */
  stats: {
    totalServicesFound: number
    servicesWithPricing: number
    servicesFromNavigation: number
    servicesFromPages: number
    servicesFromPatterns: number
    averageConfidence: number
  }
  /** Warnings/issues encountered */
  warnings: string[]
  /** When scan completed */
  scannedAt: Date
}

/**
 * Service pattern matching configuration
 */
export interface ServicePattern {
  /** Regex pattern to match */
  pattern: RegExp
  /** Confidence boost for this pattern (0-1) */
  confidenceBoost: number
  /** Category hint */
  categoryHint?: ServiceCategory
}

/**
 * Navigation link analysis result
 */
export interface NavigationLink {
  /** Link text */
  text: string
  /** Link URL */
  href: string
  /** Whether this looks like a service link */
  isServiceLink: boolean
  /** Confidence score (0-1) */
  confidence: number
  /** Service keywords found in link */
  keywords: string[]
}

/**
 * Pricing table extraction result
 */
export interface PricingTable {
  /** Table identifier */
  id: string
  /** Tiers/columns found */
  tiers: Array<{
    name: string
    price?: PricingInfo
    features: string[]
    isPopular?: boolean
  }>
  /** Confidence in extraction (0-1) */
  confidence: number
}

/**
 * Semantic similarity result for deduplication
 */
export interface SimilarityMatch {
  /** Service A ID */
  serviceA: string
  /** Service B ID */
  serviceB: string
  /** Similarity score (0-1) */
  similarity: number
  /** Whether to merge these services */
  shouldMerge: boolean
}

/**
 * Service extraction options
 */
export interface DeepScanOptions {
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number
  /** Whether to extract pricing */
  extractPricing?: boolean
  /** Whether to follow service page links */
  followServiceLinks?: boolean
  /** Maximum pages to scan */
  maxPages?: number
  /** Whether to deduplicate similar services */
  deduplicate?: boolean
  /** Similarity threshold for deduplication (0-1) */
  deduplicationThreshold?: number
  /** Business name for filtering out company name from products */
  businessName?: string
}
