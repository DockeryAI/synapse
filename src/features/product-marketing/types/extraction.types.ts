/**
 * Product Marketing - Extraction Types
 *
 * Type definitions for product extraction from various sources.
 */

import type { SourceType, ProductStatus, ProductImage } from './product.types';

// ============================================================================
// EXTRACTION CONFIGURATION
// ============================================================================

/** Sources configuration - which sources to enable */
export interface ExtractionSourcesConfig {
  uvp?: boolean;
  website?: boolean;
  reviews?: boolean;
  keywords?: boolean;
}

/** Configuration for extraction process */
export interface ExtractionConfig {
  /** Source types to extract from (object with boolean flags) */
  sources?: ExtractionSourcesConfig;
  /** Brand ID to extract for (optional, can be passed separately) */
  brandId?: string;
  /** Skip deduplication (for testing) */
  skipDeduplication?: boolean;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Maximum products to extract per source */
  maxProductsPerSource?: number;
  /** Deduplication similarity threshold */
  deduplicationThreshold?: number;
  /** Auto-save to database */
  autoSave?: boolean;
  /** UVP extraction options */
  uvpOptions?: UVPExtractionOptions;
  /** Website extraction options */
  websiteOptions?: WebsiteExtractionOptions;
  /** Review extraction options */
  reviewOptions?: ReviewExtractionOptions;
  /** Keyword extraction options */
  keywordOptions?: KeywordExtractionOptions;
}

/** UVP extraction options */
export interface UVPExtractionOptions {
  /** Include services in extraction */
  includeServices?: boolean;
  /** Include products in extraction */
  includeProducts?: boolean;
}

/** Website extraction options */
export interface WebsiteExtractionOptions {
  /** Target URLs to scrape */
  targetUrls?: string[];
  /** Max pages to crawl */
  maxPages?: number;
  /** Include pricing if found */
  includePricing?: boolean;
  /** Include images */
  includeImages?: boolean;
}

/** Review extraction options */
export interface ReviewExtractionOptions {
  /** Minimum mentions to consider a product */
  minMentions?: number;
  /** Include sentiment analysis */
  includeSentiment?: boolean;
}

/** Keyword extraction options */
export interface KeywordExtractionOptions {
  /** Minimum search volume */
  minSearchVolume?: number;
  /** Only product-intent keywords */
  productIntentOnly?: boolean;
  /** Include competitor keywords */
  includeCompetitors?: boolean;
}

// ============================================================================
// EXTRACTED DATA STRUCTURES
// ============================================================================

/** Raw extracted product before normalization */
export interface ExtractedProduct {
  /** Temporary ID for tracking */
  tempId: string;
  /** Extracted name (required) */
  name: string;
  /** Extracted description */
  description?: string;
  /** Short description */
  shortDescription?: string;
  /** Extracted price (as string initially) */
  rawPrice?: string;
  /** Parsed price (number) */
  price?: number;
  /** Currency code */
  currency?: string;
  /** Extracted features */
  features?: string[];
  /** Extracted benefits */
  benefits?: string[];
  /** Extracted images */
  images?: ProductImage[];
  /** Suggested category */
  suggestedCategory?: string;
  /** Detected status */
  status?: ProductStatus;
  /** Is this a service? */
  isService?: boolean;
  /** Is this seasonal? */
  isSeasonal?: boolean;
  /** Seasonal period if detected */
  seasonalPeriod?: {
    start?: string;
    end?: string;
  };
  /** Extracted tags */
  tags?: string[];
  /** External reference ID */
  externalId?: string;
  /** Source this was extracted from */
  source: SourceType;
  /** URL where extracted */
  sourceUrl?: string;
  /** Raw source data */
  rawData?: Record<string, unknown>;
  /** Confidence score for this extraction */
  confidence: number;
}

/** UVP-specific extraction data */
export interface UVPExtractionData {
  /** Products detected in UVP */
  products: Array<{
    name: string;
    description?: string;
    isCore?: boolean;
  }>;
  /** Services detected in UVP */
  services: Array<{
    name: string;
    description?: string;
    isCore?: boolean;
  }>;
  /** Core offerings mentioned */
  coreOfferings: string[];
  /** Value propositions that hint at products */
  valueProps: string[];
}

/** Website-specific extraction data */
export interface WebsiteExtractionData {
  /** Scraped URL */
  url: string;
  /** Page title */
  pageTitle?: string;
  /** Detected products on page */
  products: Array<{
    name: string;
    description?: string;
    price?: string;
    imageUrl?: string;
    category?: string;
  }>;
  /** Navigation items that suggest products */
  menuItems: string[];
  /** Scraped at timestamp */
  scrapedAt: string;
}

/** Review-specific extraction data */
export interface ReviewExtractionData {
  /** Product/service mentions with counts */
  mentions: Array<{
    term: string;
    count: number;
    contexts: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  /** Overall review themes */
  themes: string[];
  /** Common praise patterns */
  positivePatterns: string[];
  /** Common complaint patterns */
  negativePatterns: string[];
}

/** Keyword-specific extraction data */
export interface KeywordExtractionData {
  /** Product-related keywords */
  productKeywords: Array<{
    keyword: string;
    searchVolume?: number;
    difficulty?: number;
    intent?: 'product' | 'service' | 'informational';
  }>;
  /** Rankings for product terms */
  rankings: Array<{
    keyword: string;
    position: number;
    url?: string;
  }>;
}

// ============================================================================
// EXTRACTION RESULTS
// ============================================================================

/** Result from a single extraction source */
export interface SingleExtractionResult {
  /** Source type */
  source: SourceType;
  /** Success status */
  success: boolean;
  /** Products extracted */
  products: ExtractedProduct[];
  /** Error if failed */
  error?: string;
  /** Processing time in ms */
  duration: number;
  /** Source-specific metadata */
  metadata: Record<string, unknown>;
}

/** Extraction statistics */
export interface ExtractionStats {
  totalExtracted: number;
  totalProducts?: number;
  uniqueProducts: number;
  duplicatesRemoved: number;
  lowConfidenceFiltered?: number;
  bySource: Record<string, number>;
  averageConfidence: number;
  processingTime: number;
}

/** Combined extraction result */
export interface ExtractionResult {
  /** Unique extraction ID */
  extractionId: string;
  /** Brand ID */
  brandId: string;
  /** Timestamp */
  timestamp: string;
  /** All sources that were processed */
  sources: SingleExtractionResult[];
  /** Merged and deduplicated products */
  mergedProducts: ExtractedProduct[];
  /** Extraction statistics */
  stats: ExtractionStats;
  /** Products that were created in DB */
  productsCreated: number;
  /** Products that were updated in DB */
  productsUpdated: number;
  /** Total processing time */
  totalDuration: number;
  /** Extraction log ID (optional) */
  logId?: string;
  /** Overall success (derived from sources) */
  success?: boolean;
  /** Single error message */
  error?: string;
  /** Errors from any source */
  errors?: Array<{ source: SourceType; error: string }>;
}

// ============================================================================
// EXTRACTION PROGRESS
// ============================================================================

/** Extraction progress tracking */
export interface ExtractionProgress {
  /** Current source being processed */
  currentSource: SourceType;
  /** Number of sources completed */
  sourcesCompleted: number;
  /** Total number of sources */
  totalSources: number;
  /** Products found so far */
  productsFound: number;
  /** Current status */
  status: 'running' | 'merging' | 'saving' | 'completed' | 'failed' | 'cancelled';
  /** Error message if failed */
  error?: string;
  /** Progress for current source */
  currentSourceProgress?: {
    current: number;
    total: number;
  };
}

/** Progress callback type */
export type ExtractionProgressCallback = (progress: ExtractionProgress) => void;

// ============================================================================
// DEDUPLICATION
// ============================================================================

/** Deduplication match result */
export interface DeduplicationMatch {
  /** Product 1 temp ID */
  product1TempId: string;
  /** Product 2 temp ID */
  product2TempId: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** Fields that matched */
  matchedOn: string[];
}

/** Merged product after deduplication */
export interface MergedProduct {
  /** The merged product */
  product: ExtractedProduct;
  /** Sources this product was found in */
  sources: SourceType[];
  /** Original products that were merged */
  sourceProducts: ExtractedProduct[];
  /** When the merge occurred */
  mergedAt: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

/** Validation result for extracted product */
export interface ProductValidation {
  /** Is the product valid */
  isValid: boolean;
  /** Validation errors as strings */
  errors: string[];
  /** Warnings */
  warnings?: string[];
  /** Suggested fixes */
  suggestions?: string[];
}

/** Validate an extracted product */
export function validateExtractedProduct(product: ExtractedProduct): ProductValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Required field: name
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (product.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Price validation
  if (product.price !== undefined && product.price < 0) {
    errors.push('Price cannot be negative');
  }

  // Confidence validation
  if (product.confidence < 0 || product.confidence > 1) {
    errors.push('Confidence must be between 0 and 1');
  }

  // Suggestions
  if (!product.description) {
    suggestions.push('Add a description to improve product quality');
  }

  if (!product.features || product.features.length === 0) {
    suggestions.push('Add features to help with marketing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}
