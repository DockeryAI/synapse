/**
 * useKeywords Hook
 *
 * React hook for loading and managing keywords in the V4 sidebar.
 * Uses streaming pattern - loads cached first, then fetches fresh data.
 *
 * Created: 2025-11-30
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  keywordExtractionService,
  type ExtractedKeyword,
  type KeywordExtractionResult
} from '@/services/keywords/keyword-extraction.service';
import {
  keywordValidationService,
  type ValidatedKeyword,
  type KeywordValidationResult
} from '@/services/keywords/keyword-validation.service';

// ============================================================================
// TYPES
// ============================================================================

export interface KeywordData {
  keyword: string;
  searchVolume: number | null;
  difficulty: number | null;
  position: number | null;
  source: string;
  isRanking: boolean;
  intentWeight: number;
}

export interface UseKeywordsResult {
  keywords: KeywordData[];
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  totalSearchVolume: number;
  rankingCount: number;
  refresh: () => void;
  fromCache: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useKeywords(
  brandId: string | undefined,
  domain: string | undefined,
  websiteData?: {
    title?: string;
    metaDescription?: string;
    metaKeywords?: string;
    h1s?: string[];
    ogTitle?: string;
    ogDescription?: string;
    schemaData?: any;
    bodyText?: string;
  },
  brandName?: string
): UseKeywordsResult {
  const [extractedKeywords, setExtractedKeywords] = useState<ExtractedKeyword[]>([]);
  const [validatedKeywords, setValidatedKeywords] = useState<ValidatedKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Check cache on mount
  useEffect(() => {
    if (!brandId) return;

    // Check for cached validation result first
    const cachedValidation = keywordValidationService.getCachedValidation(brandId);
    if (cachedValidation) {
      console.log('[useKeywords] Using cached validated keywords:', cachedValidation.keywords.length);
      setValidatedKeywords(cachedValidation.keywords);
      setFromCache(true);
      return;
    }

    // Check for cached extraction
    const cachedExtraction = keywordExtractionService.getCachedKeywords(brandId);
    if (cachedExtraction) {
      console.log('[useKeywords] Using cached extracted keywords:', cachedExtraction.keywords.length);
      setExtractedKeywords(cachedExtraction.keywords);
      setFromCache(true);
    }
  }, [brandId]);

  // Extract keywords when website data is available
  useEffect(() => {
    if (!brandId || !domain || !websiteData) return;
    if (validatedKeywords.length > 0) return; // Already have validated data

    // Check if we have meaningful data to extract from
    const hasData = websiteData.title ||
      websiteData.metaDescription ||
      websiteData.metaKeywords ||
      (websiteData.h1s && websiteData.h1s.length > 0);

    if (!hasData) return;

    console.log('[useKeywords] Extracting keywords from website data');
    setIsLoading(true);

    try {
      const result = keywordExtractionService.extractFromWebsiteAnalysis(
        brandId,
        domain,
        websiteData
      );
      setExtractedKeywords(result.keywords);
      setFromCache(false);
    } catch (err) {
      console.error('[useKeywords] Extraction failed:', err);
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, domain, websiteData, validatedKeywords.length]);

  // Validate extracted keywords with SEMrush
  useEffect(() => {
    if (!brandId || !domain || extractedKeywords.length === 0) return;
    if (validatedKeywords.length > 0) return; // Already validated

    console.log('[useKeywords] Validating keywords with SEMrush');
    setIsValidating(true);

    keywordValidationService.validateKeywords(brandId, domain, extractedKeywords, brandName)
      .then(result => {
        setValidatedKeywords(result.keywords);
        setFromCache(false);
      })
      .catch(err => {
        console.error('[useKeywords] Validation failed:', err);
        setError(err instanceof Error ? err.message : 'Validation failed');
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [brandId, domain, extractedKeywords, brandName, validatedKeywords.length]);

  // Listen for events
  useEffect(() => {
    const handleExtracted = (event: any) => {
      if (event.data?.brandId === brandId) {
        setExtractedKeywords(event.data.keywords);
      }
    };

    const handleValidated = (event: any) => {
      if (event.data?.brandId === brandId) {
        setValidatedKeywords(event.data.keywords);
      }
    };

    const handleError = (event: any) => {
      setError(event.data?.error || 'Unknown error');
    };

    keywordExtractionService.on('keywords-extracted', handleExtracted);
    keywordValidationService.on('keywords-validated', handleValidated);
    keywordValidationService.on('validation-error', handleError);

    return () => {
      keywordExtractionService.off('keywords-extracted', handleExtracted);
      keywordValidationService.off('keywords-validated', handleValidated);
      keywordValidationService.off('validation-error', handleError);
    };
  }, [brandId]);

  // Refresh function
  const refresh = useCallback(() => {
    if (!brandId) return;

    // Clear caches
    keywordExtractionService.clearCache(brandId);
    keywordValidationService.clearCache(brandId);

    // Reset state
    setExtractedKeywords([]);
    setValidatedKeywords([]);
    setFromCache(false);
    setError(null);

    // Re-extraction will trigger automatically via useEffect
  }, [brandId]);

  // Merge and format keywords for display
  const keywords = useMemo<KeywordData[]>(() => {
    // Prefer validated keywords if available
    if (validatedKeywords.length > 0) {
      return validatedKeywords.map(k => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        position: k.position,
        source: k.source,
        isRanking: k.isRanking,
        intentWeight: k.intentWeight
      }));
    }

    // Fall back to extracted keywords
    if (extractedKeywords.length > 0) {
      return extractedKeywords.map(k => ({
        keyword: k.keyword,
        searchVolume: null,
        difficulty: null,
        position: null,
        source: k.source,
        isRanking: false,
        intentWeight: k.weight
      }));
    }

    return [];
  }, [validatedKeywords, extractedKeywords]);

  // Calculate totals
  const totalSearchVolume = useMemo(() =>
    keywords.reduce((sum, k) => sum + (k.searchVolume || 0), 0),
    [keywords]
  );

  const rankingCount = useMemo(() =>
    keywords.filter(k => k.isRanking).length,
    [keywords]
  );

  return {
    keywords,
    isLoading,
    isValidating,
    error,
    totalSearchVolume,
    rankingCount,
    refresh,
    fromCache
  };
}
