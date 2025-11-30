/**
 * Brand Insights Cache
 *
 * Feature branch cache for OpenDialog brand data.
 * This file stores pre-fetched insights to skip API calls during development.
 *
 * Usage:
 * - Set CACHED_BRAND_ID to the brand you want to use cached data for
 * - Add CACHED_DEEP_CONTEXT with the full DeepContext object
 * - Add CACHED_INSIGHTS with pre-processed insight cards
 */

import type { DeepContext } from '@/types/synapse/deepContext.types';

/**
 * Cached insight structure
 */
export interface CachedInsight {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  category: 'market' | 'customer' | 'competitive' | 'psychology' | 'conversation';
  confidence: number;
  timestamp: string;
  rawData?: unknown;
}

/**
 * The brand ID that has cached data available
 * Only this brand ID will use the cached data
 */
export const CACHED_BRAND_ID: string | null = null; // Set to OpenDialog brand ID to enable caching

/**
 * Cached DeepContext for the brand
 * This should be populated from a successful API response
 */
export const CACHED_DEEP_CONTEXT: DeepContext | null = null;

/**
 * Cached insights array for the brand
 * Pre-processed insight cards ready for display
 */
export const CACHED_INSIGHTS: CachedInsight[] = [];

/**
 * Check if cached data is available for a brand
 */
export function hasCachedData(brandId: string): boolean {
  return Boolean(
    CACHED_BRAND_ID &&
    brandId === CACHED_BRAND_ID &&
    CACHED_DEEP_CONTEXT !== null
  );
}

/**
 * Get cached data for a brand
 */
export function getCachedData(brandId: string): {
  deepContext: DeepContext | null;
  insights: CachedInsight[];
} | null {
  if (!hasCachedData(brandId)) {
    return null;
  }

  return {
    deepContext: CACHED_DEEP_CONTEXT,
    insights: CACHED_INSIGHTS
  };
}

/**
 * Instructions for populating the cache:
 *
 * 1. Run the app with FETCH_CONVERSATIONS_ONCE = true in V4PowerModePanel.tsx
 * 2. Open console and look for the fetched data
 * 3. Copy the DeepContext object to CACHED_DEEP_CONTEXT
 * 4. Copy processed insights to CACHED_INSIGHTS
 * 5. Set CACHED_BRAND_ID to your brand's ID
 * 6. Set FETCH_CONVERSATIONS_ONCE back to false
 *
 * The cache will automatically be used when loading that brand
 */
