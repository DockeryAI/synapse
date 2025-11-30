/**
 * Keyword Extraction Service
 *
 * Extracts intent-based keywords from website HTML - what the brand
 * is TRYING to rank for based on their on-page optimization.
 *
 * Data sources (by priority):
 * 1. Meta keywords tag
 * 2. Title tag
 * 3. H1 headings
 * 4. Meta description
 * 5. OG tags
 * 6. Schema.org data
 *
 * Uses EventEmitter pattern for streaming to sidebar.
 * Created: 2025-11-30
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedKeyword {
  keyword: string;
  source: 'meta' | 'title' | 'h1' | 'description' | 'og' | 'schema' | 'content';
  weight: number; // 1-10 priority (10 = highest)
  frequency?: number;
}

export interface KeywordExtractionResult {
  brandId: string;
  domain: string;
  keywords: ExtractedKeyword[];
  extractedAt: number;
  fromCache: boolean;
}

export interface KeywordExtractionEvent {
  type: 'keywords-extracted' | 'extraction-error';
  data: KeywordExtractionResult | { error: string };
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY_PREFIX = 'keywords_intent_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'from', 'your', 'are', 'who', 'our',
  'you', 'can', 'will', 'their', 'they', 'this', 'into', 'not', 'has', 'have',
  'was', 'were', 'been', 'being', 'all', 'any', 'each', 'every', 'more', 'most',
  'other', 'some', 'such', 'than', 'too', 'very', 'just', 'but', 'about', 'also',
  'how', 'what', 'when', 'where', 'which', 'while', 'why', 'would', 'could',
  'should', 'might', 'must', 'shall', 'get', 'got', 'let', 'make', 'made',
  'take', 'took', 'see', 'saw', 'use', 'used', 'using', 'help', 'helps',
  'new', 'best', 'top', 'one', 'two', 'first', 'last', 'only', 'own', 'same',
  'home', 'page', 'site', 'website', 'click', 'here', 'learn', 'read', 'view'
]);

// ============================================================================
// SERVICE
// ============================================================================

class KeywordExtractionService extends EventEmitter {
  private cache: Map<string, { data: KeywordExtractionResult; timestamp: number }> = new Map();

  constructor() {
    super();
    this.loadCacheFromStorage();
  }

  /**
   * Load cache from localStorage on init
   */
  private loadCacheFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL) {
            this.cache.set(key, parsed);
          }
        }
      }
    } catch (err) {
      console.warn('[KeywordExtraction] Failed to load cache:', err);
    }
  }

  /**
   * Get cached keywords if available and not expired
   */
  getCachedKeywords(brandId: string): KeywordExtractionResult | null {
    const key = `${CACHE_KEY_PREFIX}${brandId}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { ...cached.data, fromCache: true };
    }

    return null;
  }

  /**
   * Extract keywords from website analysis data
   * Called with data from Apify website scrape or similar
   */
  extractFromWebsiteAnalysis(
    brandId: string,
    domain: string,
    websiteData: {
      title?: string;
      metaDescription?: string;
      metaKeywords?: string;
      h1s?: string[];
      ogTitle?: string;
      ogDescription?: string;
      schemaData?: any;
      bodyText?: string;
    }
  ): KeywordExtractionResult {
    console.log('[KeywordExtraction] Extracting keywords for:', domain);

    const keywords: ExtractedKeyword[] = [];

    // 1. Meta keywords (weight: 10) - explicit intent
    if (websiteData.metaKeywords) {
      const metaKws = websiteData.metaKeywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length >= 3 && !STOP_WORDS.has(k));

      for (const kw of metaKws) {
        keywords.push({ keyword: kw, source: 'meta', weight: 10 });
      }
    }

    // 2. Title tag (weight: 9) - primary target keyword usually here
    if (websiteData.title) {
      const titleKws = this.extractKeywordsFromText(websiteData.title, 9, 'title');
      keywords.push(...titleKws);
    }

    // 3. H1 headings (weight: 8) - page topic indicators
    if (websiteData.h1s?.length) {
      for (const h1 of websiteData.h1s) {
        const h1Kws = this.extractKeywordsFromText(h1, 8, 'h1');
        keywords.push(...h1Kws);
      }
    }

    // 4. Meta description (weight: 7) - keyword-optimized summary
    if (websiteData.metaDescription) {
      const descKws = this.extractKeywordsFromText(websiteData.metaDescription, 7, 'description');
      keywords.push(...descKws);
    }

    // 5. OG tags (weight: 6) - social optimization often mirrors SEO
    if (websiteData.ogTitle) {
      const ogTitleKws = this.extractKeywordsFromText(websiteData.ogTitle, 6, 'og');
      keywords.push(...ogTitleKws);
    }
    if (websiteData.ogDescription) {
      const ogDescKws = this.extractKeywordsFromText(websiteData.ogDescription, 6, 'og');
      keywords.push(...ogDescKws);
    }

    // 6. Schema.org data (weight: 5)
    if (websiteData.schemaData) {
      const schemaKws = this.extractFromSchema(websiteData.schemaData);
      keywords.push(...schemaKws);
    }

    // Deduplicate and consolidate
    const consolidated = this.consolidateKeywords(keywords);

    const result: KeywordExtractionResult = {
      brandId,
      domain,
      keywords: consolidated.slice(0, 30), // Top 30
      extractedAt: Date.now(),
      fromCache: false
    };

    // Cache result
    this.cacheResult(brandId, result);

    // Emit event
    this.emit('keywords-extracted', {
      type: 'keywords-extracted',
      data: result,
      timestamp: Date.now()
    } as KeywordExtractionEvent);

    console.log('[KeywordExtraction] Extracted', result.keywords.length, 'keywords');
    return result;
  }

  /**
   * Extract keywords from plain text
   */
  private extractKeywordsFromText(
    text: string,
    weight: number,
    source: ExtractedKeyword['source']
  ): ExtractedKeyword[] {
    if (!text) return [];

    const keywords: ExtractedKeyword[] = [];

    // Clean and tokenize
    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract single words (4+ chars, not stop words)
    const words = cleaned.split(' ').filter(w =>
      w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)
    );

    for (const word of words) {
      keywords.push({ keyword: word, source, weight });
    }

    // Extract 2-word phrases (bigrams)
    const wordArray = cleaned.split(' ');
    for (let i = 0; i < wordArray.length - 1; i++) {
      const phrase = `${wordArray[i]} ${wordArray[i + 1]}`;
      if (
        wordArray[i].length >= 3 &&
        wordArray[i + 1].length >= 3 &&
        !STOP_WORDS.has(wordArray[i]) &&
        !STOP_WORDS.has(wordArray[i + 1])
      ) {
        keywords.push({ keyword: phrase, source, weight: weight - 1 });
      }
    }

    // Extract 3-word phrases (trigrams) - often valuable for long-tail
    for (let i = 0; i < wordArray.length - 2; i++) {
      const phrase = `${wordArray[i]} ${wordArray[i + 1]} ${wordArray[i + 2]}`;
      // At least first and last word should be meaningful
      if (
        wordArray[i].length >= 3 &&
        wordArray[i + 2].length >= 3 &&
        !STOP_WORDS.has(wordArray[i]) &&
        !STOP_WORDS.has(wordArray[i + 2])
      ) {
        keywords.push({ keyword: phrase, source, weight: weight - 2 });
      }
    }

    return keywords;
  }

  /**
   * Extract keywords from Schema.org data
   */
  private extractFromSchema(schemaData: any): ExtractedKeyword[] {
    const keywords: ExtractedKeyword[] = [];

    try {
      const schemas = Array.isArray(schemaData) ? schemaData : [schemaData];

      for (const schema of schemas) {
        // Extract from 'about' field
        if (schema.about) {
          const aboutText = typeof schema.about === 'string'
            ? schema.about
            : schema.about.name || '';
          if (aboutText) {
            keywords.push(...this.extractKeywordsFromText(aboutText, 5, 'schema'));
          }
        }

        // Extract from 'keywords' field
        if (schema.keywords) {
          const kws = typeof schema.keywords === 'string'
            ? schema.keywords.split(',')
            : schema.keywords;
          for (const kw of kws) {
            const cleaned = kw.trim().toLowerCase();
            if (cleaned.length >= 3) {
              keywords.push({ keyword: cleaned, source: 'schema', weight: 5 });
            }
          }
        }

        // Extract from 'description'
        if (schema.description) {
          keywords.push(...this.extractKeywordsFromText(schema.description, 4, 'schema'));
        }
      }
    } catch (err) {
      console.warn('[KeywordExtraction] Schema parsing error:', err);
    }

    return keywords;
  }

  /**
   * Consolidate keywords - combine duplicates, sum weights
   */
  private consolidateKeywords(keywords: ExtractedKeyword[]): ExtractedKeyword[] {
    const keywordMap = new Map<string, ExtractedKeyword>();

    for (const kw of keywords) {
      const existing = keywordMap.get(kw.keyword);
      if (existing) {
        // Increase weight for repeated keywords (shows intent)
        existing.weight = Math.min(10, existing.weight + 1);
        existing.frequency = (existing.frequency || 1) + 1;
      } else {
        keywordMap.set(kw.keyword, { ...kw, frequency: 1 });
      }
    }

    // Sort by weight (descending), then by frequency
    return Array.from(keywordMap.values())
      .sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        return (b.frequency || 0) - (a.frequency || 0);
      });
  }

  /**
   * Cache result to localStorage
   */
  private cacheResult(brandId: string, result: KeywordExtractionResult): void {
    const key = `${CACHE_KEY_PREFIX}${brandId}`;
    const cacheEntry = { data: result, timestamp: Date.now() };

    this.cache.set(key, cacheEntry);

    try {
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (err) {
      console.warn('[KeywordExtraction] Cache write failed:', err);
    }
  }

  /**
   * Clear cache for a brand
   */
  clearCache(brandId: string): void {
    const key = `${CACHE_KEY_PREFIX}${brandId}`;
    this.cache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // Ignore
    }
  }
}

// Export singleton
export const keywordExtractionService = new KeywordExtractionService();
