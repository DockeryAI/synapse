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

import { useMemo, useCallback, useState, useEffect } from 'react';
import { sourcePreservationService, type PreservedSource } from '@/services/triggers/source-preservation.service';
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

  /** Look up a single source by ID (synchronous - uses cached sources) */
  getSource: (id: string) => ResolvedSource | null;

  /** Check if a source ID exists in registry (synchronous - uses cached sources) */
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
 * Convert PreservedSource to ResolvedSource for display
 */
function toResolvedSource(source: PreservedSource): ResolvedSource {
  // Check freshness (< 90 days)
  const timestamp = source.metadata.timestamp;
  let isFresh = false;
  if (timestamp) {
    const date = new Date(timestamp);
    const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    isFresh = daysDiff <= 90;
  }

  return {
    id: source.id,
    url: source.originalUrl,
    author: source.metadata.title || 'Unknown',
    quote: source.metadata.excerpt,
    platform: 'unknown',
    isVerified: source.status === 'active',
    isFresh,
    timestamp,
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
  const [resolved, setResolved] = useState<{ sources: ResolvedSource[]; unresolvedIds: string[] }>({
    sources: [],
    unresolvedIds: [],
  });

  useEffect(() => {
    let isMounted = true;

    const resolveSources = async () => {
      const sources: ResolvedSource[] = [];
      const unresolvedIds: string[] = [];

      for (const id of sourceIds) {
        if (!id) {
          continue;
        }

        const verifiedSource = await sourcePreservationService.getSource(id);
        if (verifiedSource) {
          sources.push(toResolvedSource(verifiedSource));
        } else {
          unresolvedIds.push(id);
          console.warn(`[useResolvedSources] Source not found in registry: ${id}`);
        }
      }

      if (isMounted) {
        setResolved({ sources, unresolvedIds });
      }
    };

    resolveSources().catch(err => {
      console.error('[useResolvedSources] Failed to resolve sources:', err);
    });

    return () => {
      isMounted = false;
    };
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

  // Single source lookup (synchronous - uses cached sources)
  const getSource = useCallback((id: string): ResolvedSource | null => {
    return resolved.sources.find(s => s.id === id) || null;
  }, [resolved.sources]);

  // Check if source exists (synchronous - uses cached sources)
  const hasSource = useCallback((id: string): boolean => {
    return resolved.sources.some(s => s.id === id);
  }, [resolved.sources]);

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
  const [resolved, setResolved] = useState<ResolvedSource | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveSource = async () => {
      if (!sourceId) {
        setResolved(null);
        return;
      }

      const verifiedSource = await sourcePreservationService.getSource(sourceId);
      if (isMounted) {
        setResolved(verifiedSource ? toResolvedSource(verifiedSource) : null);
      }
    };

    resolveSource().catch(err => {
      console.error('[useResolvedSource] Failed to resolve source:', err);
      if (isMounted) {
        setResolved(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sourceId]);

  return resolved;
}

export default useResolvedSources;
