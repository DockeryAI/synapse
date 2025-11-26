/**
 * Extraction Orchestrator Service
 *
 * Coordinates multiple extractors and merges their results.
 * Handles deduplication, conflict resolution, and progress tracking.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ExtractedProduct,
  ExtractionResult,
  ExtractionConfig,
  ExtractionSourcesConfig,
  ExtractionStats,
  ExtractionProgress,
  ExtractionProgressCallback,
  SingleExtractionResult,
  DeduplicationMatch,
  MergedProduct,
  CreateProductDTO,
} from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { createUVPExtractor } from './uvp-extractor.service';
import { createWebsiteExtractor } from './website-extractor.service';
import { createReviewExtractor } from './review-extractor.service';
import { createKeywordExtractor } from './keyword-extractor.service';
import { bulkCreateProducts, updateProduct, listProducts } from '../catalog/product-crud.service';
import { getPMSupabaseClient } from '../catalog/supabase-pm.client';
import type { ExtractorContext, ExtractorConfig } from './base-extractor';

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class ExtractionOrchestrator {
  private config: ExtractionConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<ExtractionConfig> = {}) {
    this.config = {
      sources: config.sources ?? {
        uvp: true,
        website: true,
        reviews: true,
        keywords: true,
      },
      maxProductsPerSource: config.maxProductsPerSource ?? 50,
      minConfidence: config.minConfidence ?? 0.3,
      deduplicationThreshold: config.deduplicationThreshold ?? 0.8,
      autoSave: config.autoSave ?? false,
      uvpOptions: config.uvpOptions,
      websiteOptions: config.websiteOptions,
      reviewOptions: config.reviewOptions,
      keywordOptions: config.keywordOptions,
    };
  }

  /**
   * Run extraction for a brand
   */
  async extract(
    brandId: string,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    const extractionId = uuidv4();
    const startTime = Date.now();

    if (!isFeatureEnabled('PRODUCT_EXTRACTION_ENABLED')) {
      return this.createErrorResult(extractionId, brandId, 'Product extraction is disabled');
    }

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    // Track progress
    const progress: ExtractionProgress = {
      currentSource: 'uvp',
      sourcesCompleted: 0,
      totalSources: this.countEnabledSources(),
      productsFound: 0,
      status: 'running',
    };

    const notify = () => {
      if (onProgress) {
        onProgress({ ...progress });
      }
    };

    try {
      // Log extraction start
      await this.logExtraction(extractionId, brandId, 'started', {
        config: this.config,
      });

      notify();

      // Run extractors
      const sourceResults: SingleExtractionResult[] = [];
      const extractorConfig: ExtractorConfig = {
        maxProducts: this.config.maxProductsPerSource,
        minConfidence: this.config.minConfidence,
      };

      const context: ExtractorContext = {
        brandId,
        signal: this.abortController.signal,
        onProgress: (p) => {
          // Update current source progress from extractor callback
          if (p && typeof p === 'object' && 'currentSourceProgress' in p && p.currentSourceProgress) {
            progress.currentSourceProgress = p.currentSourceProgress;
          }
          notify();
        },
      };

      // UVP Extraction
      if (this.config.sources?.uvp && isFeatureEnabled('EXTRACTION_UVP_ENABLED')) {
        progress.currentSource = 'uvp';
        notify();

        const uvpExtractor = createUVPExtractor(extractorConfig, this.config.uvpOptions);
        const uvpResult = await uvpExtractor.extract(context);
        sourceResults.push(uvpResult);
        progress.sourcesCompleted++;
        progress.productsFound += uvpResult.products.length;
        notify();
      }

      // Website Extraction
      if (this.config.sources?.website && isFeatureEnabled('EXTRACTION_WEBSITE_ENABLED')) {
        progress.currentSource = 'website';
        notify();

        const websiteExtractor = createWebsiteExtractor(extractorConfig, this.config.websiteOptions);
        const websiteResult = await websiteExtractor.extract(context);
        sourceResults.push(websiteResult);
        progress.sourcesCompleted++;
        progress.productsFound += websiteResult.products.length;
        notify();
      }

      // Review Extraction
      if (this.config.sources?.reviews && isFeatureEnabled('EXTRACTION_REVIEWS_ENABLED')) {
        progress.currentSource = 'reviews';
        notify();

        const reviewExtractor = createReviewExtractor(extractorConfig, this.config.reviewOptions);
        const reviewResult = await reviewExtractor.extract(context);
        sourceResults.push(reviewResult);
        progress.sourcesCompleted++;
        progress.productsFound += reviewResult.products.length;
        notify();
      }

      // Keyword Extraction
      if (this.config.sources?.keywords && isFeatureEnabled('EXTRACTION_KEYWORDS_ENABLED')) {
        progress.currentSource = 'keywords';
        notify();

        const keywordExtractor = createKeywordExtractor(extractorConfig, this.config.keywordOptions);
        const keywordResult = await keywordExtractor.extract(context);
        sourceResults.push(keywordResult);
        progress.sourcesCompleted++;
        progress.productsFound += keywordResult.products.length;
        notify();
      }

      // Merge and deduplicate
      progress.status = 'merging';
      notify();

      const allProducts = sourceResults.flatMap(r => r.products);
      const mergedProducts = this.deduplicateAndMerge(allProducts);

      // Calculate stats
      const stats = this.calculateStats(sourceResults, mergedProducts);

      // Auto-save if enabled
      let productsCreated = 0;
      let productsUpdated = 0;

      if (this.config.autoSave && mergedProducts.length > 0) {
        progress.status = 'saving';
        notify();

        const saveResult = await this.saveProducts(brandId, mergedProducts);
        productsCreated = saveResult.created;
        productsUpdated = saveResult.updated;
      }

      // Create result
      const totalDuration = Date.now() - startTime;
      const result: ExtractionResult = {
        extractionId,
        brandId,
        timestamp: new Date().toISOString(),
        sources: sourceResults,
        mergedProducts,
        stats,
        productsCreated,
        productsUpdated,
        totalDuration,
      };

      // Log completion
      await this.logExtraction(extractionId, brandId, 'completed', {
        stats,
        duration: totalDuration,
      });

      progress.status = 'completed';
      notify();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Extraction failed';

      // Log error
      await this.logExtraction(extractionId, brandId, 'failed', {
        error: errorMessage,
      });

      progress.status = 'failed';
      progress.error = errorMessage;
      notify();

      return this.createErrorResult(extractionId, brandId, errorMessage);
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel an in-progress extraction
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Count enabled extraction sources
   */
  private countEnabledSources(): number {
    const sources = this.config.sources ?? {};
    let count = 0;
    if (sources.uvp && isFeatureEnabled('EXTRACTION_UVP_ENABLED')) count++;
    if (sources.website && isFeatureEnabled('EXTRACTION_WEBSITE_ENABLED')) count++;
    if (sources.reviews && isFeatureEnabled('EXTRACTION_REVIEWS_ENABLED')) count++;
    if (sources.keywords && isFeatureEnabled('EXTRACTION_KEYWORDS_ENABLED')) count++;
    return count;
  }

  /**
   * Deduplicate and merge products from multiple sources
   */
  private deduplicateAndMerge(products: ExtractedProduct[]): ExtractedProduct[] {
    if (products.length === 0) return [];

    const merged: Map<string, MergedProduct> = new Map();
    const threshold = this.config.deduplicationThreshold ?? 0.8;

    for (const product of products) {
      const normalizedName = product.name.toLowerCase().trim();

      // Find best match
      let bestMatch: DeduplicationMatch | null = null;
      let bestMatchKey: string | null = null;

      for (const [key, existing] of merged) {
        const similarity = this.calculateSimilarity(normalizedName, key);
        if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = {
            product1TempId: existing.product.tempId,
            product2TempId: product.tempId,
            similarity,
            matchedOn: ['name'],
          };
          bestMatchKey = key;
        }
      }

      if (bestMatch && bestMatchKey) {
        // Merge with existing
        const existing = merged.get(bestMatchKey)!;
        existing.sources.push(product.source);
        existing.sourceProducts.push(product);

        // Update confidence (weighted average)
        const totalWeight = existing.sources.length;
        existing.product.confidence =
          (existing.product.confidence * (totalWeight - 1) + product.confidence) / totalWeight;

        // Merge descriptions (keep longest)
        if (product.description && (!existing.product.description ||
            product.description.length > existing.product.description.length)) {
          existing.product.description = product.description;
        }

        // Merge tags
        if (product.tags) {
          const existingTags = new Set(existing.product.tags || []);
          for (const tag of product.tags) {
            existingTags.add(tag);
          }
          existing.product.tags = Array.from(existingTags);
        }

        // Use price if available
        if (product.price && !existing.product.price) {
          existing.product.price = product.price;
          existing.product.currency = product.currency;
        }

        // Use images if available
        if (product.images && product.images.length > 0 && !existing.product.images) {
          existing.product.images = product.images;
        }
      } else {
        // New product
        merged.set(normalizedName, {
          product: { ...product },
          sources: [product.source],
          sourceProducts: [product],
          mergedAt: new Date().toISOString(),
        });
      }
    }

    // Return merged products sorted by confidence
    return Array.from(merged.values())
      .map(m => m.product)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate string similarity (Jaccard-like)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Calculate extraction statistics
   */
  private calculateStats(
    sourceResults: SingleExtractionResult[],
    mergedProducts: ExtractedProduct[]
  ): ExtractionStats {
    const bySource: Record<string, number> = {};
    let totalDuration = 0;
    let successfulSources = 0;

    for (const result of sourceResults) {
      bySource[result.source] = result.products.length;
      totalDuration += result.duration;
      if (result.success) successfulSources++;
    }

    const confidences = mergedProducts.map(p => p.confidence);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    return {
      totalExtracted: sourceResults.reduce((sum, r) => sum + r.products.length, 0),
      uniqueProducts: mergedProducts.length,
      duplicatesRemoved: sourceResults.reduce((sum, r) => sum + r.products.length, 0) - mergedProducts.length,
      bySource,
      averageConfidence: avgConfidence,
      processingTime: totalDuration,
    };
  }

  /**
   * Save products to database
   */
  private async saveProducts(
    brandId: string,
    products: ExtractedProduct[]
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    // Get existing products for this brand
    const existingResult = await listProducts(brandId, undefined, undefined, { page: 1, limit: 1000 });
    const existingByName = new Map(existingResult.data.map(p => [p.name.toLowerCase(), p]));

    const toCreate: CreateProductDTO[] = [];

    for (const product of products) {
      const existingProduct = existingByName.get(product.name.toLowerCase());

      if (existingProduct) {
        // Update existing product if confidence improved
        const existingConfidence = (existingProduct.metadata?.confidence as number) || 0;
        if (product.confidence > existingConfidence) {
          await updateProduct(existingProduct.id, {
            description: product.description || existingProduct.description,
            tags: product.tags,
            metadata: { ...existingProduct.metadata, confidence: product.confidence },
          });
          updated++;
        }
      } else {
        // Queue for creation
        toCreate.push({
          brandId,
          name: product.name,
          description: product.description,
          isService: product.isService ?? false,
          price: product.price,
          currency: product.currency ?? 'USD',
          tags: product.tags,
          metadata: { confidence: product.confidence },
          status: 'draft',
        });
      }
    }

    // Bulk create new products
    if (toCreate.length > 0) {
      const { created: createdProducts } = await bulkCreateProducts(toCreate);
      created = createdProducts.length;
    }

    return { created, updated };
  }

  /**
   * Log extraction activity
   */
  private async logExtraction(
    extractionId: string,
    brandId: string,
    status: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      const client = getPMSupabaseClient();
      await client.from('pm_extraction_logs').insert({
        id: uuidv4(),
        brand_id: brandId,
        extraction_type: 'full',
        status,
        started_at: status === 'started' ? new Date().toISOString() : undefined,
        completed_at: status !== 'started' ? new Date().toISOString() : undefined,
        products_found: details.stats ? (details.stats as ExtractionStats).totalExtracted : 0,
        products_created: details.stats ? (details.stats as ExtractionStats).uniqueProducts : 0,
        config: { extractionId, ...details },
      });
    } catch {
      // Logging failure shouldn't fail the extraction
      console.error('Failed to log extraction:', extractionId);
    }
  }

  /**
   * Create an error result
   */
  private createErrorResult(
    extractionId: string,
    brandId: string,
    error: string
  ): ExtractionResult {
    return {
      extractionId,
      brandId,
      timestamp: new Date().toISOString(),
      sources: [],
      mergedProducts: [],
      stats: {
        totalExtracted: 0,
        uniqueProducts: 0,
        duplicatesRemoved: 0,
        bySource: {},
        averageConfidence: 0,
        processingTime: 0,
      },
      productsCreated: 0,
      productsUpdated: 0,
      totalDuration: 0,
      error,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an extraction orchestrator with default config
 */
export function createExtractionOrchestrator(
  config?: Partial<ExtractionConfig>
): ExtractionOrchestrator {
  return new ExtractionOrchestrator(config);
}

/**
 * Run a quick extraction (one source)
 */
export async function quickExtract(
  brandId: string,
  source: keyof ExtractionSourcesConfig,
  onProgress?: ExtractionProgressCallback
): Promise<ExtractionResult> {
  const sources: ExtractionSourcesConfig = {
    uvp: source === 'uvp',
    website: source === 'website',
    reviews: source === 'reviews',
    keywords: source === 'keywords',
  };

  const orchestrator = createExtractionOrchestrator({ sources });
  return orchestrator.extract(brandId, onProgress);
}

/**
 * Run full extraction (all sources)
 */
export async function fullExtract(
  brandId: string,
  onProgress?: ExtractionProgressCallback,
  autoSave = false
): Promise<ExtractionResult> {
  const orchestrator = createExtractionOrchestrator({
    sources: {
      uvp: true,
      website: true,
      reviews: true,
      keywords: true,
    },
    autoSave,
  });

  return orchestrator.extract(brandId, onProgress);
}
