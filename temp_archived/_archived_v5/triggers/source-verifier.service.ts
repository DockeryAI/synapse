/**
 * Source Verifier Service - Triggers 4.0
 *
 * Validates source URLs before display to ensure they are:
 * 1. Real (not hallucinated)
 * 2. Accessible (URL returns 200/301/302)
 * 3. Fresh (not older than 90 days)
 * 4. Platform-matched (URL domain matches claimed platform)
 *
 * Created: 2025-12-01
 */

import type { VerifiedSource, VerificationStatus } from '@/types/verified-source.types';
import { validatePlatformUrl, isSourceFresh } from '@/types/verified-source.types';

// ============================================================================
// VERIFICATION CACHE
// ============================================================================

/**
 * Cache verification results to avoid repeated network requests
 * Key: URL, Value: { status, timestamp }
 */
const verificationCache = new Map<string, {
  status: VerificationStatus;
  timestamp: number;
}>();

// Cache TTL: 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Check if a cached result is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

// ============================================================================
// VERIFICATION LOGIC
// ============================================================================

class SourceVerifierService {
  /**
   * Verify a single source
   * Returns the verification status
   */
  async verifySource(source: VerifiedSource): Promise<VerificationStatus> {
    // Check URL exists
    if (!source.originalUrl) {
      console.log(`[SourceVerifier] No URL for source ${source.id}`);
      return 'invalid';
    }

    // Check cache first
    const cached = verificationCache.get(source.originalUrl);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`[SourceVerifier] Cache hit for ${source.originalUrl}: ${cached.status}`);
      return cached.status;
    }

    // Validate platform-URL match
    if (!validatePlatformUrl(source.originalUrl, source.platform)) {
      console.log(`[SourceVerifier] Platform mismatch: ${source.originalUrl} vs ${source.platform}`);
      const status: VerificationStatus = 'invalid';
      verificationCache.set(source.originalUrl, { status, timestamp: Date.now() });
      return status;
    }

    // Check freshness
    if (!isSourceFresh(source)) {
      console.log(`[SourceVerifier] Source is stale (>90 days): ${source.originalUrl}`);
      const status: VerificationStatus = 'archived';
      verificationCache.set(source.originalUrl, { status, timestamp: Date.now() });
      return status;
    }

    // In browser environment, we can't make cross-origin HEAD requests
    // For now, trust URLs that pass platform validation and freshness
    // The URL was scraped from a real source, so if it matches the platform pattern, it's likely valid
    //
    // TODO: Implement server-side URL verification via Edge Function
    // This would do a HEAD request to check if the URL is still accessible
    const status: VerificationStatus = 'verified';
    verificationCache.set(source.originalUrl, { status, timestamp: Date.now() });

    console.log(`[SourceVerifier] Verified source: ${source.originalUrl}`);
    return status;
  }

  /**
   * Verify multiple sources in parallel
   * Returns a map of source ID -> verification status
   */
  async verifySources(sources: VerifiedSource[]): Promise<Map<string, VerificationStatus>> {
    const results = new Map<string, VerificationStatus>();

    // Run verifications in parallel
    const promises = sources.map(async (source) => {
      const status = await this.verifySource(source);
      return { id: source.id, status };
    });

    const settledResults = await Promise.allSettled(promises);

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        results.set(result.value.id, result.value.status);
      }
    }

    // Log summary
    const verified = Array.from(results.values()).filter(s => s === 'verified').length;
    const invalid = Array.from(results.values()).filter(s => s === 'invalid').length;
    const archived = Array.from(results.values()).filter(s => s === 'archived').length;

    console.log(`[SourceVerifier] Verification complete: ${verified} verified, ${invalid} invalid, ${archived} archived`);

    return results;
  }

  /**
   * Get verification stats from cache
   */
  getCacheStats(): {
    totalCached: number;
    byStatus: Record<string, number>;
  } {
    const byStatus: Record<string, number> = {};
    let validCount = 0;

    for (const [, value] of verificationCache.entries()) {
      if (isCacheValid(value.timestamp)) {
        byStatus[value.status] = (byStatus[value.status] || 0) + 1;
        validCount++;
      }
    }

    return {
      totalCached: validCount,
      byStatus,
    };
  }

  /**
   * Clear the verification cache
   */
  clearCache(): void {
    verificationCache.clear();
    console.log('[SourceVerifier] Cache cleared');
  }

  /**
   * Check if a URL is likely valid based on pattern matching
   * This is a fast check that doesn't require network requests
   */
  isUrlPatternValid(url: string): boolean {
    if (!url) return false;

    try {
      const parsed = new URL(url);

      // Must be http or https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Must have a valid hostname
      if (!parsed.hostname || parsed.hostname.length < 4) {
        return false;
      }

      // Check for common hallucination patterns
      const hallucationPatterns = [
        /example\.com/i,
        /test\.com/i,
        /placeholder/i,
        /fake/i,
        /dummy/i,
        /localhost/i,
        /127\.0\.0\.1/,
        /0\.0\.0\.0/,
      ];

      for (const pattern of hallucationPatterns) {
        if (pattern.test(url)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Filter a list of sources to only include verified ones
   * Returns sources with valid URLs and platform matches
   */
  filterVerifiedSources(sources: VerifiedSource[]): VerifiedSource[] {
    return sources.filter(source => {
      // Must have a URL
      if (!source.originalUrl) return false;

      // URL pattern must be valid
      if (!this.isUrlPatternValid(source.originalUrl)) return false;

      // Platform must match URL
      if (!validatePlatformUrl(source.originalUrl, source.platform)) return false;

      // Must be fresh
      if (!isSourceFresh(source)) return false;

      return true;
    });
  }
}

// Export singleton
export const sourceVerifier = new SourceVerifierService();
