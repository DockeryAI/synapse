/**
 * Gap Tab Cache Configuration
 *
 * Controls whether API calls are made or data is loaded from cache only.
 *
 * Usage:
 * 1. Set CACHE_ONLY_MODE = false to enable API calls
 * 2. Load the page and let it fetch all competitor data
 * 3. Once data is in Supabase, set CACHE_ONLY_MODE = true
 * 4. Now page refreshes load from DB cache only (no API calls)
 *
 * Created: 2025-11-28
 */

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * When true, all API calls for competitor intelligence are disabled on page load.
 * Data will ONLY load from Supabase cache (competitor_profiles, competitor_gaps, etc.)
 *
 * The Force Refresh button bypasses this setting via forceBypassCache parameter.
 * This allows testing the Gaps tab without triggering APIs on every refresh.
 */
export const CACHE_ONLY_MODE = true; // Set to true to use cached data from DB - prevents API calls on page load

/**
 * Brand ID for OpenDialog (set after first load to lock to this brand)
 * This ensures cache-only mode works for the correct brand.
 */
export const OPENDIALOG_BRAND_ID: string | null = null;

/**
 * Whether to auto-run discovery when no competitors exist in cache
 * Only works when CACHE_ONLY_MODE = false
 */
export const AUTO_DISCOVER_IF_EMPTY = false; // Disabled - only discover when user clicks Force Refresh

/**
 * Minimum confidence threshold for gap extraction.
 * Gaps below this threshold are filtered out.
 *
 * Lowered from 0.6 to 0.4 to capture more gaps (including Botpress, Cognigy).
 * Gaps between 0.4-0.6 will show "low confidence" badge in UI.
 */
export const GAP_CONFIDENCE_THRESHOLD = 0.4;

/**
 * High confidence threshold - gaps above this are considered reliable
 */
export const GAP_HIGH_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Maximum concurrent competitor scans (to avoid rate limits)
 */
export const MAX_CONCURRENT_SCANS = 3;

// ============================================================================
// DEV HELPERS
// ============================================================================

/**
 * Check if API calls should be blocked
 */
export function shouldBlockApiCalls(): boolean {
  return CACHE_ONLY_MODE;
}

/**
 * Log cache status
 */
export function logCacheStatus(): void {
  console.log('[Gap Tab Cache Config]', {
    cacheOnlyMode: CACHE_ONLY_MODE,
    openDialogBrandId: OPENDIALOG_BRAND_ID,
    autoDiscoverIfEmpty: AUTO_DISCOVER_IF_EMPTY
  });
}

// Log on import during dev
if (import.meta.env.DEV) {
  logCacheStatus();
}
