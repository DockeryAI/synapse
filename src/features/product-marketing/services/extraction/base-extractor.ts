/**
 * Base Extractor Class
 *
 * Abstract base class for all product extractors.
 * Provides common functionality for extraction operations.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ExtractedProduct,
  SourceType,
  SingleExtractionResult,
  ExtractionProgressCallback,
} from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractorContext {
  brandId: string;
  onProgress?: ExtractionProgressCallback;
  signal?: AbortSignal;
}

export interface ExtractorConfig {
  maxProducts?: number;
  minConfidence?: number;
  timeout?: number;
}

// ============================================================================
// BASE EXTRACTOR CLASS
// ============================================================================

export abstract class BaseExtractor {
  protected sourceType: SourceType;
  protected config: ExtractorConfig;

  constructor(sourceType: SourceType, config: ExtractorConfig = {}) {
    this.sourceType = sourceType;
    this.config = {
      maxProducts: config.maxProducts ?? 100,
      minConfidence: config.minConfidence ?? 0.3,
      timeout: config.timeout ?? 30000,
    };
  }

  /**
   * Main extraction method - must be implemented by subclasses
   */
  abstract extract(context: ExtractorContext): Promise<SingleExtractionResult>;

  /**
   * Get the source type for this extractor
   */
  getSourceType(): SourceType {
    return this.sourceType;
  }

  /**
   * Generate a temporary ID for extracted products
   */
  protected generateTempId(): string {
    return `temp-${this.sourceType}-${uuidv4().slice(0, 8)}`;
  }

  /**
   * Create a base extracted product with defaults
   */
  protected createExtractedProduct(
    name: string,
    confidence: number,
    overrides: Partial<ExtractedProduct> = {}
  ): ExtractedProduct {
    return {
      tempId: this.generateTempId(),
      name: name.trim(),
      source: this.sourceType,
      confidence: Math.max(0, Math.min(1, confidence)),
      ...overrides,
    };
  }

  /**
   * Create a successful extraction result
   */
  protected createSuccessResult(
    products: ExtractedProduct[],
    duration: number,
    metadata: Record<string, unknown> = {}
  ): SingleExtractionResult {
    return {
      source: this.sourceType,
      success: true,
      products,
      duration,
      metadata,
    };
  }

  /**
   * Create a failed extraction result
   */
  protected createErrorResult(
    error: string,
    duration: number,
    metadata: Record<string, unknown> = {}
  ): SingleExtractionResult {
    return {
      source: this.sourceType,
      success: false,
      products: [],
      error,
      duration,
      metadata,
    };
  }

  /**
   * Filter products by minimum confidence
   */
  protected filterByConfidence(products: ExtractedProduct[]): ExtractedProduct[] {
    return products.filter(p => p.confidence >= (this.config.minConfidence ?? 0.3));
  }

  /**
   * Limit products to max count
   */
  protected limitProducts(products: ExtractedProduct[]): ExtractedProduct[] {
    return products.slice(0, this.config.maxProducts);
  }

  /**
   * Normalize and clean product name
   */
  protected normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-&']/g, '')
      .slice(0, 200);
  }

  /**
   * Extract price from text string
   */
  protected extractPrice(text: string): { price: number; currency: string } | null {
    // Match common price patterns
    const patterns = [
      /\$\s*([\d,]+(?:\.\d{2})?)/,  // $99.99
      /USD\s*([\d,]+(?:\.\d{2})?)/i, // USD 99.99
      /([\d,]+(?:\.\d{2})?)\s*(?:dollars?|USD)/i, // 99.99 dollars
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(price) && price > 0) {
          return { price, currency: 'USD' };
        }
      }
    }

    return null;
  }

  /**
   * Extract features from text (looks for bullet points, lists)
   */
  protected extractFeatures(text: string): string[] {
    const features: string[] = [];

    // Split by common delimiters
    const lines = text.split(/[\n•\-\*]/).map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      // Skip very short or very long lines
      if (line.length >= 10 && line.length <= 200) {
        // Skip lines that look like sentences (have periods mid-line)
        if (!line.includes('. ') || line.split('. ').length <= 2) {
          features.push(line);
        }
      }
    }

    return features.slice(0, 10); // Max 10 features
  }

  /**
   * Detect if product is likely a service
   */
  protected detectIsService(name: string, description?: string): boolean {
    const serviceIndicators = [
      'service', 'consulting', 'coaching', 'training', 'support',
      'maintenance', 'repair', 'installation', 'management',
      'planning', 'design', 'development', 'implementation',
      'audit', 'review', 'assessment', 'analysis',
    ];

    const text = `${name} ${description || ''}`.toLowerCase();

    return serviceIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Generate tags from product data
   */
  protected generateTags(product: Partial<ExtractedProduct>): string[] {
    const tags: Set<string> = new Set();

    // Add source as tag
    tags.add(this.sourceType);

    // Add service/product tag
    if (product.isService) {
      tags.add('service');
    } else {
      tags.add('product');
    }

    // Extract keywords from name
    if (product.name) {
      const words = product.name.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && !['with', 'from', 'that', 'this', 'your'].includes(word)) {
          tags.add(word);
        }
      }
    }

    return Array.from(tags).slice(0, 10);
  }

  /**
   * Check if extraction should be aborted
   */
  protected checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('Extraction aborted');
    }
  }

  /**
   * Create a timeout promise
   */
  protected createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Extraction timed out after ${ms}ms`)), ms);
    });
  }

  /**
   * Run extraction with timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs ?? this.config.timeout ?? 30000;
    return Promise.race([promise, this.createTimeout(timeout)]);
  }
}

// ============================================================================
// FACTORY FUNCTION TYPE
// ============================================================================

export type ExtractorFactory = (config?: ExtractorConfig) => BaseExtractor;
