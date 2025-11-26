/**
 * Keyword Extractor Service
 *
 * Extracts products and services from keyword/search data.
 * Analyzes search terms and keyword research to identify offerings.
 */

import {
  BaseExtractor,
  type ExtractorContext,
  type ExtractorConfig,
} from './base-extractor';
import type {
  ExtractedProduct,
  SingleExtractionResult,
  KeywordExtractionOptions,
} from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { getPMSupabaseClient } from '../catalog/supabase-pm.client';

// ============================================================================
// KEYWORD EXTRACTOR CLASS
// ============================================================================

class KeywordExtractor extends BaseExtractor {
  private options: KeywordExtractionOptions;

  constructor(config: ExtractorConfig = {}, options: KeywordExtractionOptions = {}) {
    super('keywords', config);
    this.options = {
      minSearchVolume: options.minSearchVolume ?? 10,
      includeCompetitors: options.includeCompetitors ?? false,
    };
  }

  async extract(context: ExtractorContext): Promise<SingleExtractionResult> {
    const startTime = Date.now();

    if (!isFeatureEnabled('EXTRACTION_KEYWORDS_ENABLED')) {
      return this.createErrorResult(
        'Keyword extraction is disabled',
        Date.now() - startTime
      );
    }

    try {
      this.checkAborted(context.signal);

      // Fetch keyword data
      const keywords = await this.fetchKeywordData(context.brandId);

      if (!keywords || keywords.length === 0) {
        return this.createSuccessResult([], Date.now() - startTime, {
          reason: 'No keyword data found for brand',
        });
      }

      this.checkAborted(context.signal);

      // Extract products from keywords
      const products = await this.extractFromKeywords(keywords);

      // Filter and limit
      const filtered = this.filterByConfidence(products);
      const limited = this.limitProducts(filtered);

      return this.createSuccessResult(limited, Date.now() - startTime, {
        keywordsAnalyzed: keywords.length,
        totalExtracted: products.length,
        afterFiltering: filtered.length,
      });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Keyword extraction failed',
        Date.now() - startTime
      );
    }
  }

  /**
   * Fetch keyword data from intelligence cache
   */
  private async fetchKeywordData(brandId: string): Promise<KeywordRecord[]> {
    const client = getPMSupabaseClient();

    // Try intelligence cache for keyword research data
    const { data: cacheData } = await client
      .from('intelligence_cache')
      .select('*')
      .eq('brand_id', brandId)
      .in('cache_type', ['keywords', 'serper_keywords', 'search_terms', 'seo_keywords'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (cacheData && cacheData.length > 0) {
      const allKeywords: KeywordRecord[] = [];
      for (const cache of cacheData) {
        const parsed = this.parseKeywordCache(cache.cached_data);
        allKeywords.push(...parsed);
      }
      return this.deduplicateKeywords(allKeywords);
    }

    // Fallback: try to get from brand_keywords if table exists
    const { data: keywordData } = await client
      .from('brand_keywords')
      .select('*')
      .eq('brand_id', brandId)
      .order('search_volume', { ascending: false })
      .limit(200);

    if (keywordData) {
      return keywordData.map(k => ({
        keyword: k.keyword || k.term || '',
        searchVolume: k.search_volume || k.volume || 0,
        competition: k.competition || 'medium',
        category: k.category,
        intent: k.intent,
      }));
    }

    return [];
  }

  /**
   * Parse keyword cache data
   */
  private parseKeywordCache(data: unknown): KeywordRecord[] {
    if (!data) return [];

    let keywords: unknown[] = [];

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        keywords = Array.isArray(parsed) ? parsed : (parsed.keywords || parsed.terms || []);
      } catch {
        return [];
      }
    } else if (Array.isArray(data)) {
      keywords = data;
    } else if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      keywords = Array.isArray(obj.keywords) ? obj.keywords
        : Array.isArray(obj.terms) ? obj.terms
        : Array.isArray(obj.results) ? obj.results
        : [];
    }

    return keywords.map((k: unknown) => {
      if (typeof k === 'string') {
        return { keyword: k, searchVolume: 0, competition: 'unknown' as const };
      }
      const kw = k as Record<string, unknown>;
      return {
        keyword: String(kw.keyword || kw.term || kw.query || ''),
        searchVolume: typeof kw.searchVolume === 'number' ? kw.searchVolume
          : typeof kw.search_volume === 'number' ? kw.search_volume
          : typeof kw.volume === 'number' ? kw.volume
          : 0,
        competition: String(kw.competition || kw.difficulty || 'medium'),
        category: kw.category ? String(kw.category) : undefined,
        intent: kw.intent ? String(kw.intent) : undefined,
      };
    }).filter(k => k.keyword.length >= 3);
  }

  /**
   * Deduplicate keywords by normalized term
   */
  private deduplicateKeywords(keywords: KeywordRecord[]): KeywordRecord[] {
    const seen = new Map<string, KeywordRecord>();

    for (const kw of keywords) {
      const key = kw.keyword.toLowerCase().trim();
      const existing = seen.get(key);

      if (!existing || kw.searchVolume > existing.searchVolume) {
        seen.set(key, kw);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Extract products from keyword data
   */
  private async extractFromKeywords(keywords: KeywordRecord[]): Promise<ExtractedProduct[]> {
    const products: ExtractedProduct[] = [];
    const productMentions = new Map<string, ProductMention>();

    for (const kw of keywords) {
      // Skip low volume keywords if threshold is set
      if (kw.searchVolume < (this.options.minSearchVolume ?? 0)) {
        continue;
      }

      // Extract product/service mentions from keyword
      const mentions = this.extractMentionsFromKeyword(kw);

      for (const mention of mentions) {
        const key = mention.name.toLowerCase();
        const existing = productMentions.get(key);

        if (existing) {
          existing.totalVolume += kw.searchVolume;
          existing.keywordCount++;
          existing.keywords.push(kw.keyword);
          if (kw.intent) {
            existing.intents.add(kw.intent);
          }
        } else {
          productMentions.set(key, {
            name: mention.name,
            isService: mention.isService,
            totalVolume: kw.searchVolume,
            keywordCount: 1,
            keywords: [kw.keyword],
            intents: new Set(kw.intent ? [kw.intent] : []),
          });
        }
      }
    }

    // Convert mentions to products
    for (const [, mention] of productMentions) {
      const confidence = this.calculateConfidence(mention);

      products.push(this.createExtractedProduct(
        this.normalizeName(mention.name),
        confidence,
        {
          isService: mention.isService,
          description: this.generateDescription(mention),
          tags: [
            ...this.generateTags({ name: mention.name, isService: mention.isService }),
            ...Array.from(mention.intents).map(i => `intent-${i}`),
          ],
          rawData: {
            source: 'keywords',
            totalSearchVolume: mention.totalVolume,
            keywordCount: mention.keywordCount,
            sampleKeywords: mention.keywords.slice(0, 5),
            intents: Array.from(mention.intents),
          },
        }
      ));
    }

    return products;
  }

  /**
   * Extract product/service mentions from a keyword
   */
  private extractMentionsFromKeyword(kw: KeywordRecord): Array<{ name: string; isService: boolean }> {
    const mentions: Array<{ name: string; isService: boolean }> = [];
    const keyword = kw.keyword.toLowerCase();

    // Product/service indicator patterns
    const patterns = [
      // "[brand] [product]" pattern
      /^(\w+)\s+([\w\s]{3,30}?)(?:\s+(?:price|cost|review|near me|online|buy|order))?$/i,
      // "[product] service" pattern
      /([\w\s]{3,25})\s+(?:service|services)$/i,
      // "best [product]" pattern
      /^(?:best|top|cheap|affordable|quality)\s+([\w\s]{3,30})$/i,
      // "[product] for [audience]" pattern
      /^([\w\s]{3,25})\s+(?:for|to)\s+/i,
    ];

    for (const pattern of patterns) {
      const match = keyword.match(pattern);
      if (match) {
        const captured = match[1] || match[2];
        if (captured) {
          const name = captured.trim();
          if (this.isValidProductName(name)) {
            mentions.push({
              name: this.titleCase(name),
              isService: this.detectIsService(name),
            });
          }
        }
      }
    }

    // If keyword itself looks like a product name
    if (mentions.length === 0 && this.isValidProductName(keyword)) {
      const words = keyword.split(' ');
      if (words.length >= 2 && words.length <= 4) {
        mentions.push({
          name: this.titleCase(keyword),
          isService: this.detectIsService(keyword),
        });
      }
    }

    return mentions;
  }

  /**
   * Check if a string is a valid product name
   */
  private isValidProductName(name: string): boolean {
    const skipWords = [
      'how', 'what', 'where', 'when', 'why', 'who', 'which',
      'best', 'top', 'cheap', 'near', 'online', 'free',
      'buy', 'get', 'find', 'search', 'looking',
    ];

    const words = name.toLowerCase().split(' ');

    // Skip if starts with question words
    if (skipWords.includes(words[0])) {
      return false;
    }

    // Must have reasonable length
    if (name.length < 3 || name.length > 50) {
      return false;
    }

    // Must not be all stop words
    const meaningfulWords = words.filter(w => !skipWords.includes(w) && w.length > 2);
    return meaningfulWords.length >= 1;
  }

  /**
   * Convert to title case
   */
  private titleCase(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Calculate confidence based on keyword data
   */
  private calculateConfidence(mention: ProductMention): number {
    let confidence = 0.4;

    // More keywords mentioning = higher confidence
    if (mention.keywordCount >= 10) confidence += 0.3;
    else if (mention.keywordCount >= 5) confidence += 0.2;
    else if (mention.keywordCount >= 3) confidence += 0.1;

    // Higher search volume = higher confidence
    if (mention.totalVolume >= 1000) confidence += 0.2;
    else if (mention.totalVolume >= 100) confidence += 0.1;

    // Commercial intent = higher confidence
    if (mention.intents.has('commercial') || mention.intents.has('transactional')) {
      confidence += 0.1;
    }

    return Math.min(0.9, confidence);
  }

  /**
   * Generate description from mention data
   */
  private generateDescription(mention: ProductMention): string {
    const volumeText = mention.totalVolume > 0
      ? ` with ${mention.totalVolume.toLocaleString()} monthly searches`
      : '';

    return `Found in ${mention.keywordCount} search keyword${mention.keywordCount > 1 ? 's' : ''}${volumeText}`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface KeywordRecord {
  keyword: string;
  searchVolume: number;
  competition: string;
  category?: string;
  intent?: string;
}

interface ProductMention {
  name: string;
  isService: boolean;
  totalVolume: number;
  keywordCount: number;
  keywords: string[];
  intents: Set<string>;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKeywordExtractor(
  config?: ExtractorConfig,
  options?: KeywordExtractionOptions
): KeywordExtractor {
  return new KeywordExtractor(config, options);
}

export { KeywordExtractor };
