/**
 * Website Extractor Service
 *
 * Extracts products from website scraping data.
 * Analyzes website content cached in the intelligence system.
 */

import {
  BaseExtractor,
  type ExtractorContext,
  type ExtractorConfig,
} from './base-extractor';
import type {
  ExtractedProduct,
  SingleExtractionResult,
  WebsiteExtractionOptions,
} from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { getPMSupabaseClient } from '../catalog/supabase-pm.client';

// ============================================================================
// WEBSITE EXTRACTOR CLASS
// ============================================================================

class WebsiteExtractor extends BaseExtractor {
  private options: WebsiteExtractionOptions;

  constructor(config: ExtractorConfig = {}, options: WebsiteExtractionOptions = {}) {
    super('website', config);
    this.options = {
      maxPages: options.maxPages ?? 10,
      includePricing: options.includePricing ?? true,
      includeImages: options.includeImages ?? true,
      targetUrls: options.targetUrls,
    };
  }

  async extract(context: ExtractorContext): Promise<SingleExtractionResult> {
    const startTime = Date.now();

    if (!isFeatureEnabled('EXTRACTION_WEBSITE_ENABLED')) {
      return this.createErrorResult(
        'Website extraction is disabled',
        Date.now() - startTime
      );
    }

    try {
      this.checkAborted(context.signal);

      // Fetch cached website data
      const websiteData = await this.fetchWebsiteData(context.brandId);

      if (!websiteData || websiteData.length === 0) {
        return this.createSuccessResult([], Date.now() - startTime, {
          reason: 'No website data found for brand',
        });
      }

      this.checkAborted(context.signal);

      // Extract products from website content
      const products = await this.extractFromWebsite(websiteData);

      // Filter and limit
      const filtered = this.filterByConfidence(products);
      const limited = this.limitProducts(filtered);

      return this.createSuccessResult(limited, Date.now() - startTime, {
        pagesAnalyzed: websiteData.length,
        totalExtracted: products.length,
        afterFiltering: filtered.length,
      });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Website extraction failed',
        Date.now() - startTime
      );
    }
  }

  /**
   * Fetch cached website data from intelligence cache
   */
  private async fetchWebsiteData(brandId: string): Promise<WebsiteRecord[]> {
    const client = getPMSupabaseClient();

    // Get brand info for website URL
    const { data: brand } = await client
      .from('brands')
      .select('website_url')
      .eq('id', brandId)
      .single();

    if (!brand?.website_url) {
      return [];
    }

    // Try to get cached website analysis
    const { data: cacheData } = await client
      .from('intelligence_cache')
      .select('*')
      .eq('brand_id', brandId)
      .eq('cache_type', 'website_scan')
      .order('created_at', { ascending: false })
      .limit(this.options.maxPages ?? 10);

    if (cacheData && cacheData.length > 0) {
      return cacheData.map(item => ({
        url: item.source_url || brand.website_url,
        content: this.parseContent(item.cached_data),
        scrapedAt: item.created_at,
      }));
    }

    // Fallback: try deep_website_scans if available
    const { data: deepScans } = await client
      .from('deep_website_scans')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (deepScans && deepScans.length > 0) {
      const scan = deepScans[0];
      return [{
        url: brand.website_url,
        content: {
          title: scan.page_title,
          description: scan.meta_description,
          headings: scan.headings || [],
          bodyText: scan.body_text || '',
          links: scan.navigation_links || [],
          products: scan.detected_products || [],
          services: scan.detected_services || [],
        },
        scrapedAt: scan.created_at,
      }];
    }

    return [];
  }

  /**
   * Parse cached content safely
   */
  private parseContent(data: unknown): WebsiteContent {
    if (!data) {
      return { title: '', description: '', headings: [], bodyText: '', links: [] };
    }

    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return { title: '', description: '', headings: [], bodyText: data, links: [] };
      }
    }

    const obj = data as Record<string, unknown>;
    return {
      title: String(obj.title || ''),
      description: String(obj.description || obj.meta_description || ''),
      headings: Array.isArray(obj.headings) ? obj.headings.map(String) : [],
      bodyText: String(obj.bodyText || obj.body_text || obj.content || ''),
      links: Array.isArray(obj.links) ? obj.links : [],
      products: Array.isArray(obj.products) ? obj.products : [],
      services: Array.isArray(obj.services) ? obj.services : [],
    };
  }

  /**
   * Extract products from website data
   */
  private async extractFromWebsite(records: WebsiteRecord[]): Promise<ExtractedProduct[]> {
    const products: ExtractedProduct[] = [];

    for (const record of records) {
      // Extract from pre-detected products (highest confidence)
      if (record.content.products) {
        for (const product of record.content.products) {
          if (typeof product === 'string') {
            products.push(this.createProductFromName(product, record.url, 0.85));
          } else if (typeof product === 'object' && product !== null) {
            products.push(this.createProductFromObject(product as ProductObject, record.url));
          }
        }
      }

      // Extract from pre-detected services
      if (record.content.services) {
        for (const service of record.content.services) {
          if (typeof service === 'string') {
            const p = this.createProductFromName(service, record.url, 0.8);
            p.isService = true;
            products.push(p);
          } else if (typeof service === 'object' && service !== null) {
            const p = this.createProductFromObject(service as ProductObject, record.url);
            p.isService = true;
            products.push(p);
          }
        }
      }

      // Extract from headings (medium confidence)
      const fromHeadings = this.extractFromHeadings(record.content.headings, record.url);
      products.push(...fromHeadings);

      // Extract from body text (lower confidence)
      const fromBody = this.extractFromBodyText(record.content.bodyText, record.url);
      products.push(...fromBody);
    }

    return this.deduplicateByName(products);
  }

  /**
   * Create product from a simple name string
   */
  private createProductFromName(name: string, sourceUrl: string, confidence: number): ExtractedProduct {
    const normalized = this.normalizeName(name);
    const isService = this.detectIsService(normalized);

    return this.createExtractedProduct(normalized, confidence, {
      isService,
      sourceUrl,
      tags: this.generateTags({ name: normalized, isService }),
      rawData: { source: 'website', originalName: name },
    });
  }

  /**
   * Create product from a structured object
   */
  private createProductFromObject(obj: ProductObject, sourceUrl: string): ExtractedProduct {
    const name = this.normalizeName(obj.name || obj.title || '');
    const isService = obj.isService ?? this.detectIsService(name, obj.description);

    let price: number | undefined;
    let currency = 'USD';

    if (obj.price) {
      if (typeof obj.price === 'number') {
        price = obj.price;
      } else if (typeof obj.price === 'string' && this.options.includePricing) {
        const extracted = this.extractPrice(obj.price);
        if (extracted) {
          price = extracted.price;
          currency = extracted.currency;
        }
      }
    }

    return this.createExtractedProduct(name, 0.85, {
      description: obj.description,
      price,
      currency,
      rawPrice: typeof obj.price === 'string' ? obj.price : undefined,
      isService,
      sourceUrl,
      images: obj.imageUrl && this.options.includeImages
        ? [{ url: obj.imageUrl, isPrimary: true }]
        : undefined,
      tags: this.generateTags({ name, isService }),
      rawData: { source: 'website', originalObject: obj },
    });
  }

  /**
   * Extract products from page headings
   */
  private extractFromHeadings(headings: string[], sourceUrl: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];

    // Product/service indicator patterns in headings
    const patterns = [
      /^(?:our\s+)?(.+?)\s+(?:service|product|solution|offering)s?$/i,
      /^(.+?)\s+(?:plans?|packages?|pricing)$/i,
    ];

    for (const heading of headings) {
      for (const pattern of patterns) {
        const match = heading.match(pattern);
        if (match) {
          const name = this.normalizeName(match[1]);
          if (name.length >= 3 && name.split(' ').length <= 5) {
            const isService = this.detectIsService(name);
            products.push(this.createExtractedProduct(name, 0.6, {
              isService,
              sourceUrl,
              tags: this.generateTags({ name, isService }),
              rawData: { source: 'heading', originalText: heading },
            }));
          }
        }
      }
    }

    return products;
  }

  /**
   * Extract products from body text using patterns
   */
  private extractFromBodyText(text: string, sourceUrl: string): ExtractedProduct[] {
    if (!text || text.length < 50) {
      return [];
    }

    const products: ExtractedProduct[] = [];

    // Patterns that indicate product/service mentions
    const patterns = [
      /(?:we offer|we provide|our)\s+([A-Za-z][A-Za-z\s]{2,30}?)\s+(?:service|product|solution)/gi,
      /([A-Za-z][A-Za-z\s]{2,30}?)\s+(?:starting at|from)\s+\$/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = this.normalizeName(match[1]);
        if (name.length >= 3 && name.split(' ').length <= 5) {
          const isService = this.detectIsService(name);
          products.push(this.createExtractedProduct(name, 0.4, {
            isService,
            sourceUrl,
            tags: this.generateTags({ name, isService }),
            rawData: { source: 'body_text' },
          }));
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

interface WebsiteContent {
  title: string;
  description: string;
  headings: string[];
  bodyText: string;
  links: unknown[];
  products?: unknown[];
  services?: unknown[];
}

interface WebsiteRecord {
  url: string;
  content: WebsiteContent;
  scrapedAt: string;
}

interface ProductObject {
  name?: string;
  title?: string;
  description?: string;
  price?: string | number;
  imageUrl?: string;
  isService?: boolean;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createWebsiteExtractor(
  config?: ExtractorConfig,
  options?: WebsiteExtractionOptions
): WebsiteExtractor {
  return new WebsiteExtractor(config, options);
}

export { WebsiteExtractor };
