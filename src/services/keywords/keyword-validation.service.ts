/**
 * Keyword Validation Service
 *
 * Validates extracted intent keywords with SEMrush data:
 * - Search volume
 * - Difficulty score
 * - Current ranking position (if any)
 *
 * Uses EventEmitter pattern for streaming to sidebar.
 * Created: 2025-11-30
 */

import { EventEmitter } from 'events';
import { SemrushAPI, type KeywordRanking } from '../intelligence/semrush-api';
import type { ExtractedKeyword } from './keyword-extraction.service';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidatedKeyword {
  keyword: string;
  source: ExtractedKeyword['source'];
  intentWeight: number; // Original extraction weight (1-10)
  searchVolume: number | null;
  difficulty: number | null;
  position: number | null; // Current ranking if any
  isRanking: boolean; // True if currently ranking for this keyword
  traffic: number | null; // Estimated traffic from this keyword
  validated: boolean; // True if SEMrush data was fetched
}

export interface KeywordValidationResult {
  brandId: string;
  domain: string;
  keywords: ValidatedKeyword[];
  totalSearchVolume: number;
  rankingKeywords: number;
  validatedAt: number;
  fromCache: boolean;
}

export interface KeywordValidationEvent {
  type: 'keywords-validated' | 'validation-error' | 'validation-progress';
  data: KeywordValidationResult | { error: string } | { progress: number };
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY_PREFIX = 'keywords_validated_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ============================================================================
// SERVICE
// ============================================================================

class KeywordValidationService extends EventEmitter {
  private cache: Map<string, { data: KeywordValidationResult; timestamp: number }> = new Map();
  private isValidating = false;

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
      console.warn('[KeywordValidation] Failed to load cache:', err);
    }
  }

  /**
   * Get cached validated keywords if available
   */
  getCachedValidation(brandId: string): KeywordValidationResult | null {
    const key = `${CACHE_KEY_PREFIX}${brandId}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { ...cached.data, fromCache: true };
    }

    return null;
  }

  /**
   * Validate extracted keywords with SEMrush data
   */
  async validateKeywords(
    brandId: string,
    domain: string,
    extractedKeywords: ExtractedKeyword[],
    brandName?: string
  ): Promise<KeywordValidationResult> {
    console.log('[KeywordValidation] Validating', extractedKeywords.length, 'keywords for:', domain);

    if (this.isValidating) {
      console.warn('[KeywordValidation] Already validating, skipping duplicate request');
      const cached = this.getCachedValidation(brandId);
      if (cached) return cached;
    }

    this.isValidating = true;

    try {
      // Emit progress
      this.emit('validation-progress', {
        type: 'validation-progress',
        data: { progress: 10 },
        timestamp: Date.now()
      });

      // Get SEMrush keyword rankings for this domain
      let semrushRankings: KeywordRanking[] = [];
      try {
        semrushRankings = await SemrushAPI.getKeywordRankings(domain, brandName);
        console.log('[KeywordValidation] Got', semrushRankings.length, 'rankings from SEMrush');
      } catch (err) {
        console.warn('[KeywordValidation] SEMrush fetch failed:', err);
        // Continue without SEMrush data
      }

      this.emit('validation-progress', {
        type: 'validation-progress',
        data: { progress: 50 },
        timestamp: Date.now()
      });

      // Build lookup map from SEMrush rankings
      const rankingMap = new Map<string, KeywordRanking>();
      for (const ranking of semrushRankings) {
        rankingMap.set(ranking.keyword.toLowerCase(), ranking);
      }

      // Validate each extracted keyword
      const validatedKeywords: ValidatedKeyword[] = extractedKeywords.map(extracted => {
        const semrushData = rankingMap.get(extracted.keyword.toLowerCase());

        return {
          keyword: extracted.keyword,
          source: extracted.source,
          intentWeight: extracted.weight,
          searchVolume: semrushData?.searchVolume || null,
          difficulty: semrushData?.difficulty || null,
          position: semrushData?.position || null,
          isRanking: !!semrushData?.position && semrushData.position <= 100,
          traffic: semrushData?.traffic || null,
          validated: !!semrushData
        };
      });

      // Also add high-value SEMrush keywords not in extracted list
      const extractedSet = new Set(extractedKeywords.map(k => k.keyword.toLowerCase()));
      const additionalKeywords: ValidatedKeyword[] = [];

      for (const ranking of semrushRankings) {
        if (!extractedSet.has(ranking.keyword.toLowerCase()) && ranking.searchVolume >= 100) {
          additionalKeywords.push({
            keyword: ranking.keyword,
            source: 'content' as const,
            intentWeight: Math.min(10, Math.floor(ranking.searchVolume / 500) + 1),
            searchVolume: ranking.searchVolume,
            difficulty: ranking.difficulty,
            position: ranking.position,
            isRanking: ranking.position <= 100,
            traffic: ranking.traffic,
            validated: true
          });
        }
      }

      // Combine and sort - prioritize: intent weight, then search volume
      const allKeywords = [...validatedKeywords, ...additionalKeywords.slice(0, 20)]
        .sort((a, b) => {
          // First by intent weight
          if (b.intentWeight !== a.intentWeight) {
            return b.intentWeight - a.intentWeight;
          }
          // Then by search volume
          return (b.searchVolume || 0) - (a.searchVolume || 0);
        })
        .slice(0, 50); // Top 50

      // Calculate totals
      const totalSearchVolume = allKeywords.reduce((sum, k) => sum + (k.searchVolume || 0), 0);
      const rankingKeywords = allKeywords.filter(k => k.isRanking).length;

      const result: KeywordValidationResult = {
        brandId,
        domain,
        keywords: allKeywords,
        totalSearchVolume,
        rankingKeywords,
        validatedAt: Date.now(),
        fromCache: false
      };

      // Cache result
      this.cacheResult(brandId, result);

      // Emit completed
      this.emit('keywords-validated', {
        type: 'keywords-validated',
        data: result,
        timestamp: Date.now()
      } as KeywordValidationEvent);

      console.log('[KeywordValidation] Validated', allKeywords.length, 'keywords,',
        rankingKeywords, 'currently ranking,', totalSearchVolume, 'total search volume');

      return result;

    } catch (err) {
      console.error('[KeywordValidation] Validation failed:', err);

      this.emit('validation-error', {
        type: 'validation-error',
        data: { error: err instanceof Error ? err.message : 'Validation failed' },
        timestamp: Date.now()
      });

      // Return unvalidated keywords as fallback
      return {
        brandId,
        domain,
        keywords: extractedKeywords.map(k => ({
          keyword: k.keyword,
          source: k.source,
          intentWeight: k.weight,
          searchVolume: null,
          difficulty: null,
          position: null,
          isRanking: false,
          traffic: null,
          validated: false
        })),
        totalSearchVolume: 0,
        rankingKeywords: 0,
        validatedAt: Date.now(),
        fromCache: false
      };

    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Cache result to localStorage
   */
  private cacheResult(brandId: string, result: KeywordValidationResult): void {
    const key = `${CACHE_KEY_PREFIX}${brandId}`;
    const cacheEntry = { data: result, timestamp: Date.now() };

    this.cache.set(key, cacheEntry);

    try {
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (err) {
      console.warn('[KeywordValidation] Cache write failed:', err);
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
export const keywordValidationService = new KeywordValidationService();
