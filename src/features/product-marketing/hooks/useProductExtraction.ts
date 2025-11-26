/**
 * useProductExtraction Hook
 *
 * React hook for managing product extraction operations.
 * Handles extraction lifecycle, progress tracking, and results.
 */

import { useState, useCallback, useRef } from 'react';
import type {
  ExtractionResult,
  ExtractionConfig,
  ExtractionProgress,
  ExtractionSourcesConfig,
  ExtractedProduct,
  SourceType,
} from '../types';
import {
  ExtractionOrchestrator,
  createExtractionOrchestrator,
  quickExtract,
  fullExtract,
} from '../services/extraction';
import { bulkCreateProducts } from '../services/catalog';
import { isExtractionEnabled, isFeatureEnabled } from '../config/feature-flags';

// ============================================================================
// TYPES
// ============================================================================

export interface UseProductExtractionOptions {
  brandId: string;
  config?: Partial<ExtractionConfig>;
  onComplete?: (result: ExtractionResult) => void;
  onError?: (error: string) => void;
}

export interface UseProductExtractionReturn {
  // State
  isExtracting: boolean;
  progress: ExtractionProgress | null;
  result: ExtractionResult | null;
  error: string | null;
  extractedProducts: ExtractedProduct[];

  // Actions
  startExtraction: (sources?: ExtractionSourcesConfig) => Promise<void>;
  startQuickExtraction: (source: keyof ExtractionSourcesConfig) => Promise<void>;
  startFullExtraction: (autoSave?: boolean) => Promise<void>;
  cancelExtraction: () => void;
  clearResults: () => void;

  // Product selection
  selectedProducts: Set<string>;
  toggleProductSelection: (tempId: string) => void;
  selectAllProducts: () => void;
  clearSelection: () => void;

  // Save
  saveSelectedProducts: () => Promise<number>;

  // Source availability
  availableSources: ExtractionSourcesConfig;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProductExtraction(
  options: UseProductExtractionOptions
): UseProductExtractionReturn {
  const { brandId, config, onComplete, onError } = options;

  // State
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Orchestrator ref
  const orchestratorRef = useRef<ExtractionOrchestrator | null>(null);

  // Check available sources
  const availableSources: ExtractionSourcesConfig = {
    uvp: isFeatureEnabled('EXTRACTION_UVP_ENABLED'),
    website: isFeatureEnabled('EXTRACTION_WEBSITE_ENABLED'),
    reviews: isFeatureEnabled('EXTRACTION_REVIEWS_ENABLED'),
    keywords: isFeatureEnabled('EXTRACTION_KEYWORDS_ENABLED'),
  };

  // Count enabled sources
  const countEnabledSources = (sources: ExtractionSourcesConfig): number => {
    return Object.values(sources).filter(Boolean).length;
  };

  // Start extraction with specific sources
  const startExtraction = useCallback(async (
    sources?: ExtractionSourcesConfig
  ) => {
    if (!isExtractionEnabled()) {
      const msg = 'Product extraction is disabled';
      setError(msg);
      onError?.(msg);
      return;
    }

    const sourcesToUse = sources || availableSources;

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setProgress({
      currentSource: 'uvp',
      sourcesCompleted: 0,
      totalSources: countEnabledSources(sourcesToUse),
      productsFound: 0,
      status: 'running',
    });

    try {
      const orchestrator = createExtractionOrchestrator({
        ...config,
        sources: sourcesToUse,
      });
      orchestratorRef.current = orchestrator;

      const extractionResult = await orchestrator.extract(brandId, (p) => {
        setProgress({ ...p });
      });

      setResult(extractionResult);
      setProgress(prev => prev ? { ...prev, status: 'completed' } : null);

      if (extractionResult.error) {
        setError(extractionResult.error);
        onError?.(extractionResult.error);
      } else {
        onComplete?.(extractionResult);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setError(msg);
      setProgress(prev => prev ? { ...prev, status: 'failed', error: msg } : null);
      onError?.(msg);
    } finally {
      setIsExtracting(false);
      orchestratorRef.current = null;
    }
  }, [brandId, config, availableSources, onComplete, onError]);

  // Quick extraction (single source)
  const startQuickExtraction = useCallback(async (
    source: keyof ExtractionSourcesConfig
  ) => {
    if (!isExtractionEnabled()) {
      const msg = 'Product extraction is disabled';
      setError(msg);
      onError?.(msg);
      return;
    }

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setProgress({
      currentSource: source as SourceType,
      sourcesCompleted: 0,
      totalSources: 1,
      productsFound: 0,
      status: 'running',
    });

    try {
      const extractionResult = await quickExtract(brandId, source, (p) => {
        setProgress({ ...p });
      });

      setResult(extractionResult);
      setProgress(prev => prev ? { ...prev, status: 'completed' } : null);

      if (extractionResult.error) {
        setError(extractionResult.error);
        onError?.(extractionResult.error);
      } else {
        onComplete?.(extractionResult);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setError(msg);
      setProgress(prev => prev ? { ...prev, status: 'failed', error: msg } : null);
      onError?.(msg);
    } finally {
      setIsExtracting(false);
    }
  }, [brandId, onComplete, onError]);

  // Full extraction (all sources)
  const startFullExtraction = useCallback(async (autoSave = false) => {
    if (!isExtractionEnabled()) {
      const msg = 'Product extraction is disabled';
      setError(msg);
      onError?.(msg);
      return;
    }

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setProgress({
      currentSource: 'uvp',
      sourcesCompleted: 0,
      totalSources: countEnabledSources(availableSources),
      productsFound: 0,
      status: 'running',
    });

    try {
      const extractionResult = await fullExtract(brandId, (p) => {
        setProgress({ ...p });
      }, autoSave);

      setResult(extractionResult);
      setProgress(prev => prev ? { ...prev, status: 'completed' } : null);

      if (extractionResult.error) {
        setError(extractionResult.error);
        onError?.(extractionResult.error);
      } else {
        onComplete?.(extractionResult);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setError(msg);
      setProgress(prev => prev ? { ...prev, status: 'failed', error: msg } : null);
      onError?.(msg);
    } finally {
      setIsExtracting(false);
    }
  }, [brandId, availableSources, onComplete, onError]);

  // Cancel extraction
  const cancelExtraction = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.cancel();
      setProgress(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
    setIsExtracting(false);
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
    setSelectedProducts(new Set());
  }, []);

  // Toggle product selection
  const toggleProductSelection = useCallback((tempId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  }, []);

  // Select all products
  const selectAllProducts = useCallback(() => {
    if (result?.mergedProducts) {
      setSelectedProducts(new Set(result.mergedProducts.map(p => p.tempId)));
    }
  }, [result]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  // Save selected products
  const saveSelectedProducts = useCallback(async (): Promise<number> => {
    if (!result || selectedProducts.size === 0) return 0;

    const productsToSave = result.mergedProducts.filter(p =>
      selectedProducts.has(p.tempId)
    );

    const createDTOs = productsToSave.map(p => ({
      brandId,
      name: p.name,
      description: p.description,
      isService: p.isService ?? false,
      price: p.price,
      currency: p.currency ?? 'USD',
      tags: p.tags,
      status: 'draft' as const,
    }));

    const { created } = await bulkCreateProducts(createDTOs);
    return created.length;
  }, [brandId, result, selectedProducts]);

  // Get extracted products from result
  const extractedProducts = result?.mergedProducts || [];

  return {
    // State
    isExtracting,
    progress,
    result,
    error,
    extractedProducts,

    // Actions
    startExtraction,
    startQuickExtraction,
    startFullExtraction,
    cancelExtraction,
    clearResults,

    // Product selection
    selectedProducts,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,

    // Save
    saveSelectedProducts,

    // Source availability
    availableSources,
  };
}

export default useProductExtraction;
