/**
 * UVP Extractor Service
 *
 * Extracts products and services from UVP (Unique Value Proposition) data.
 * Analyzes brand UVP content to identify offerings.
 */

import {
  BaseExtractor,
  type ExtractorContext,
  type ExtractorConfig,
} from './base-extractor';
import type {
  ExtractedProduct,
  SingleExtractionResult,
  UVPExtractionOptions,
} from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { getPMSupabaseClient } from '../catalog/supabase-pm.client';

// ============================================================================
// UVP EXTRACTOR CLASS
// ============================================================================

class UVPExtractor extends BaseExtractor {
  private options: UVPExtractionOptions;

  constructor(config: ExtractorConfig = {}, options: UVPExtractionOptions = {}) {
    super('uvp', config);
    this.options = {
      includeProducts: options.includeProducts ?? true,
      includeServices: options.includeServices ?? true,
    };
  }

  async extract(context: ExtractorContext): Promise<SingleExtractionResult> {
    const startTime = Date.now();

    if (!isFeatureEnabled('EXTRACTION_UVP_ENABLED')) {
      return this.createErrorResult(
        'UVP extraction is disabled',
        Date.now() - startTime
      );
    }

    try {
      this.checkAborted(context.signal);

      // Fetch UVP data for the brand
      const uvpData = await this.fetchUVPData(context.brandId);

      if (!uvpData) {
        return this.createSuccessResult([], Date.now() - startTime, {
          reason: 'No UVP data found for brand',
        });
      }

      this.checkAborted(context.signal);

      // Extract products from UVP content
      const products = await this.extractFromUVP(uvpData);

      // Filter and limit
      const filtered = this.filterByConfidence(products);
      const limited = this.limitProducts(filtered);

      return this.createSuccessResult(limited, Date.now() - startTime, {
        uvpId: uvpData.id,
        totalExtracted: products.length,
        afterFiltering: filtered.length,
      });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'UVP extraction failed',
        Date.now() - startTime
      );
    }
  }

  /**
   * Fetch UVP data from database
   */
  private async fetchUVPData(brandId: string): Promise<UVPRecord | null> {
    const client = getPMSupabaseClient();

    // Try marba_uvps table first (newer format)
    const { data: marbaUvp } = await client
      .from('marba_uvps')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (marbaUvp) {
      return {
        id: marbaUvp.id,
        brandId: marbaUvp.brand_id,
        coreOfferings: this.parseJsonField(marbaUvp.core_offerings),
        valuePropositions: this.parseJsonField(marbaUvp.value_propositions),
        targetAudience: this.parseJsonField(marbaUvp.target_audience),
        differentiators: this.parseJsonField(marbaUvp.differentiators),
        rawContent: marbaUvp.raw_content || '',
      };
    }

    // Fallback to brand_uvps table
    const { data: brandUvp } = await client
      .from('brand_uvps')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (brandUvp) {
      return {
        id: brandUvp.id,
        brandId: brandUvp.brand_id,
        coreOfferings: this.parseJsonField(brandUvp.core_offerings),
        valuePropositions: this.parseJsonField(brandUvp.value_propositions),
        targetAudience: this.parseJsonField(brandUvp.target_audience),
        differentiators: this.parseJsonField(brandUvp.differentiators),
        rawContent: brandUvp.uvp_statement || '',
      };
    }

    return null;
  }

  /**
   * Parse JSON field safely
   */
  private parseJsonField(field: unknown): string[] {
    if (Array.isArray(field)) {
      return field.map(String);
    }
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.map(String);
        }
      } catch {
        // If it's a comma-separated string
        return field.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  /**
   * Extract products/services from UVP data
   */
  private async extractFromUVP(uvp: UVPRecord): Promise<ExtractedProduct[]> {
    const products: ExtractedProduct[] = [];

    // Extract from core offerings (highest confidence)
    for (const offering of uvp.coreOfferings) {
      const isService = this.detectIsService(offering);

      if ((isService && this.options.includeServices) ||
          (!isService && this.options.includeProducts)) {
        products.push(this.createExtractedProduct(
          this.normalizeName(offering),
          0.9, // High confidence for core offerings
          {
            isService,
            description: `Core offering: ${offering}`,
            tags: this.generateTags({ name: offering, isService }),
            rawData: { source: 'core_offerings', uvpId: uvp.id },
          }
        ));
      }
    }

    // Extract from value propositions (medium confidence)
    for (const vp of uvp.valuePropositions) {
      const extracted = this.extractProductFromValueProp(vp);
      if (extracted) {
        products.push(extracted);
      }
    }

    // Extract from raw content using NLP patterns (lower confidence)
    const fromContent = this.extractFromRawContent(uvp.rawContent);
    products.push(...fromContent);

    // Deduplicate by normalized name
    return this.deduplicateByName(products);
  }

  /**
   * Extract product mention from value proposition text
   */
  private extractProductFromValueProp(vp: string): ExtractedProduct | null {
    // Look for patterns like "our X", "provides X", "offers X"
    const patterns = [
      /(?:our|provides?|offers?|delivers?)\s+([A-Za-z][A-Za-z\s]{2,30}?)(?:\s+(?:that|which|to|for|with))/i,
      /([A-Za-z][A-Za-z\s]{2,30}?)\s+(?:service|solution|platform|product)/i,
    ];

    for (const pattern of patterns) {
      const match = vp.match(pattern);
      if (match) {
        const name = this.normalizeName(match[1]);
        if (name.length >= 3) {
          const isService = this.detectIsService(name, vp);

          if ((isService && this.options.includeServices) ||
              (!isService && this.options.includeProducts)) {
            return this.createExtractedProduct(
              name,
              0.6, // Medium confidence
              {
                isService,
                description: vp,
                tags: this.generateTags({ name, isService }),
                rawData: { source: 'value_propositions', originalText: vp },
              }
            );
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract products from raw UVP content
   */
  private extractFromRawContent(content: string): ExtractedProduct[] {
    if (!content || content.length < 10) {
      return [];
    }

    const products: ExtractedProduct[] = [];

    // Split into sentences
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

    // Look for product/service mentions
    const mentionPatterns = [
      /(?:we|our company)\s+(?:provide|offer|deliver|specialize in)\s+([^,]+)/i,
      /([A-Za-z][A-Za-z\s]{3,25})\s+(?:is our|are our)\s+(?:core|main|primary)/i,
    ];

    for (const sentence of sentences) {
      for (const pattern of mentionPatterns) {
        const match = sentence.match(pattern);
        if (match) {
          const name = this.normalizeName(match[1]);
          if (name.length >= 3 && name.split(' ').length <= 5) {
            const isService = this.detectIsService(name, sentence);

            if ((isService && this.options.includeServices) ||
                (!isService && this.options.includeProducts)) {
              products.push(this.createExtractedProduct(
                name,
                0.4, // Lower confidence for raw extraction
                {
                  isService,
                  description: sentence,
                  tags: this.generateTags({ name, isService }),
                  rawData: { source: 'raw_content', originalText: sentence },
                }
              ));
            }
          }
        }
      }
    }

    return products;
  }

  /**
   * Deduplicate products by normalized name
   */
  private deduplicateByName(products: ExtractedProduct[]): ExtractedProduct[] {
    const seen = new Map<string, ExtractedProduct>();

    for (const product of products) {
      const key = product.name.toLowerCase();
      const existing = seen.get(key);

      // Keep the one with higher confidence
      if (!existing || product.confidence > existing.confidence) {
        seen.set(key, product);
      }
    }

    return Array.from(seen.values());
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface UVPRecord {
  id: string;
  brandId: string;
  coreOfferings: string[];
  valuePropositions: string[];
  targetAudience: string[];
  differentiators: string[];
  rawContent: string;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createUVPExtractor(
  config?: ExtractorConfig,
  options?: UVPExtractionOptions
): UVPExtractor {
  return new UVPExtractor(config, options);
}

export { UVPExtractor };
