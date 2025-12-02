/**
 * useResolvedSources Hook - Triggers 4.0
 *
 * CRITICAL: Display Layer Separation
 *
 * This hook resolves sources from the SourceRegistry by their IDs.
 * The display layer should ONLY use this hook to get source data,
 * NEVER reading source URLs/quotes/authors from LLM output.
 *
 * Data Flow:
 * ```
 * LLM Output: { sampleIds: [3, 7, 12], score: 85 }
 *      |
 * Hook: useResolvedSources([verifiedSourceId1, verifiedSourceId2])
 *      |
 * Registry Lookup: returns real URLs, quotes, authors
 *      |
 * Display: Shows verified source data
 * ```
 *
 * Created: 2025-12-01
 */

import { useMemo, useCallback } from 'react';
import { sourcePreservationService } from '@/services/triggers/source-preservation.service';
import type { VerifiedSource, SourcePlatform } from '@/types/verified-source.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Resolved source for display
 * Contains only the fields needed by UI components
 */
export interface ResolvedSource {
  /** Unique ID from SourceRegistry */
  id: string;

  /** Verified URL - safe to display as link */
  url: string;

  /** Verified author name */
  author: string;

  /** Verbatim quote/content */
  quote: string;

  /** Platform for icon/badge display */
  platform: SourcePlatform;

  /** Community/subreddit name if available */
  communityName?: string;

  /** Thread title if available */
  threadTitle?: string;

  /** Engagement count (upvotes, likes) */
  engagement?: number;

  /** Whether the URL has been verified as accessible */
  isVerified: boolean;

  /** Source freshness (< 90 days) */
  isFresh: boolean;

  /** Timestamp for display */
  timestamp?: string;

  /** Competitor name if this is competitor intelligence */
  competitorName?: string;
}

/**
 * Hook return type
 */
export interface UseResolvedSourcesReturn {
  /** Resolved sources ready for display */
  sources: ResolvedSource[];

  /** Look up a single source by ID */
  getSource: (id: string) => ResolvedSource | null;

  /** Check if a source ID exists in registry */
  hasSource: (id: string) => boolean;

  /** Get sources grouped by platform */
  byPlatform: Record<SourcePlatform, ResolvedSource[]>;

  /** Total count of resolved sources */
  count: number;

  /** Whether any sources failed to resolve */
  hasUnresolved: boolean;

  /** IDs that failed to resolve */
  unresolvedIds: string[];
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert VerifiedSource to ResolvedSource for display
 */
function toResolvedSource(source: VerifiedSource): ResolvedSource {
  // Check freshness (< 90 days)
  const timestamp = source.publishedAt || source.scrapedAt;
  let isFresh = false;
  if (timestamp) {
    const date = new Date(timestamp);
    const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    isFresh = daysDiff <= 90;
  }

  return {
    id: source.id,
    url: source.originalUrl,
    author: source.originalAuthor,
    quote: source.originalContent,
    platform: source.platform,
    communityName: source.communityName,
    threadTitle: source.threadTitle,
    engagement: source.engagement,
    isVerified: source.verificationStatus === 'verified',
    isFresh,
    timestamp,
    competitorName: source.competitorName,
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Resolve sources from SourceRegistry by their IDs
 *
 * @param sourceIds - Array of verifiedSourceIds from trigger evidence
 * @returns Resolved sources with verified URLs, quotes, and authors
 *
 * @example
 * ```tsx
 * function TriggerCard({ trigger }) {
 *   // Get verifiedSourceIds from evidence items
 *   const sourceIds = trigger.evidence
 *     .map(e => e.verifiedSourceId)
 *     .filter(Boolean);
 *
 *   const { sources, hasUnresolved } = useResolvedSources(sourceIds);
 *
 *   return (
 *     <div>
 *       {sources.map(source => (
 *         <SourceLink key={source.id} source={source} />
 *       ))}
 *       {hasUnresolved && <span>Some sources unavailable</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useResolvedSources(sourceIds: string[]): UseResolvedSourcesReturn {
  // Memoize the resolved sources
  const resolved = useMemo(() => {
    const sources: ResolvedSource[] = [];
    const unresolvedIds: string[] = [];

    for (const id of sourceIds) {
      if (!id) {
        continue;
      }

      const verifiedSource = sourcePreservationService.getSource(id);
      if (verifiedSource) {
        sources.push(toResolvedSource(verifiedSource));
      } else {
        unresolvedIds.push(id);
        console.warn(`[useResolvedSources] Source not found in registry: ${id}`);
      }
    }

    return { sources, unresolvedIds };
  }, [sourceIds]);

  // Group sources by platform
  const byPlatform = useMemo(() => {
    const grouped: Record<SourcePlatform, ResolvedSource[]> = {
      reddit: [],
      twitter: [],
      youtube: [],
      hackernews: [],
      g2: [],
      trustpilot: [],
      capterra: [],
      linkedin: [],
      quora: [],
      producthunt: [],
      google_reviews: [],
      yelp: [],
      facebook: [],
      instagram: [],
      tiktok: [],
      clutch: [],
      gartner: [],
      unknown: [],
    };

    for (const source of resolved.sources) {
      grouped[source.platform].push(source);
    }

    return grouped;
  }, [resolved.sources]);

  // Single source lookup
  const getSource = useCallback((id: string): ResolvedSource | null => {
    const verifiedSource = sourcePreservationService.getSource(id);
    return verifiedSource ? toResolvedSource(verifiedSource) : null;
  }, []);

  // Check if source exists
  const hasSource = useCallback((id: string): boolean => {
    return !!sourcePreservationService.getSource(id);
  }, []);

  return {
    sources: resolved.sources,
    getSource,
    hasSource,
    byPlatform,
    count: resolved.sources.length,
    hasUnresolved: resolved.unresolvedIds.length > 0,
    unresolvedIds: resolved.unresolvedIds,
  };
}

/**
 * Resolve a single source by ID
 * Convenience hook for components that only need one source
 */
export function useResolvedSource(sourceId: string | undefined): ResolvedSource | null {
  return useMemo(() => {
    if (!sourceId) return null;
    const verifiedSource = sourcePreservationService.getSource(sourceId);
    return verifiedSource ? toResolvedSource(verifiedSource) : null;
  }, [sourceId]);
}

export default useResolvedSources;
