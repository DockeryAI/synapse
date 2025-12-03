/**
 * SourceLink Component - Triggers 4.0
 *
 * Displays a source link with verification status badge.
 * Only shows verified data from SourceRegistry - never LLM output.
 *
 * Verification badges:
 * - Checkmark (green): URL verified accessible
 * - Warning (yellow): URL unverified
 * - X (red): URL invalid or domain mismatch
 *
 * Created: 2025-12-01
 */

import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResolvedSource } from '@/hooks/v5/useResolvedSources';
import { sourcePreservationService } from '@/services/triggers/source-preservation.service';
import type { VerificationStatus } from '@/types/verified-source.types';

// ============================================================================
// TYPES
// ============================================================================

export interface SourceLinkProps {
  source: ResolvedSource;
  /** Show platform icon */
  showPlatform?: boolean;
  /** Show verification badge */
  showBadge?: boolean;
  /** Verify URL on hover (lazy verification) */
  verifyOnHover?: boolean;
  /** Compact mode - less padding */
  compact?: boolean;
  /** Show author name */
  showAuthor?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// PLATFORM ICONS
// ============================================================================

const PLATFORM_ICONS: Record<string, string> = {
  reddit: 'https://www.reddit.com/favicon.ico',
  twitter: 'https://abs.twimg.com/favicons/twitter.3.ico',
  youtube: 'https://www.youtube.com/favicon.ico',
  hackernews: 'https://news.ycombinator.com/favicon.ico',
  g2: 'https://www.g2.com/favicon.ico',
  trustpilot: 'https://www.trustpilot.com/favicon.ico',
  capterra: 'https://www.capterra.com/favicon.ico',
  linkedin: 'https://www.linkedin.com/favicon.ico',
  quora: 'https://www.quora.com/favicon.ico',
  producthunt: 'https://www.producthunt.com/favicon.ico',
  google_reviews: 'https://www.google.com/favicon.ico',
  yelp: 'https://www.yelp.com/favicon.ico',
  facebook: 'https://www.facebook.com/favicon.ico',
  instagram: 'https://www.instagram.com/favicon.ico',
  tiktok: 'https://www.tiktok.com/favicon.ico',
  clutch: 'https://clutch.co/favicon.ico',
  gartner: 'https://www.gartner.com/favicon.ico',
};

const PLATFORM_NAMES: Record<string, string> = {
  reddit: 'Reddit',
  twitter: 'X (Twitter)',
  youtube: 'YouTube',
  hackernews: 'Hacker News',
  g2: 'G2',
  trustpilot: 'Trustpilot',
  capterra: 'Capterra',
  linkedin: 'LinkedIn',
  quora: 'Quora',
  producthunt: 'Product Hunt',
  google_reviews: 'Google Reviews',
  yelp: 'Yelp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  clutch: 'Clutch',
  gartner: 'Gartner',
  // Specialty triggers - honest source attribution
  'uvp-analysis': 'UVP Analysis',
  'uvpanalysis': 'UVP Analysis',
  'industryprofile': 'Industry Profile',
  'industry-profile': 'Industry Profile',
  unknown: 'Unknown',
};

// ============================================================================
// VERIFICATION BADGE COMPONENT
// ============================================================================

interface VerificationBadgeProps {
  status: VerificationStatus;
  loading?: boolean;
}

function VerificationBadge({ status, loading }: VerificationBadgeProps) {
  if (loading) {
    return (
      <Loader2
        className="h-3.5 w-3.5 animate-spin text-gray-400"
        aria-label="Verifying..."
      />
    );
  }

  switch (status) {
    case 'verified':
      return (
        <CheckCircle2
          className="h-3.5 w-3.5 text-green-500"
          aria-label="Verified - URL accessible"
        />
      );
    case 'unverified':
      return (
        <AlertCircle
          className="h-3.5 w-3.5 text-yellow-500"
          aria-label="Unverified - Could not confirm URL"
        />
      );
    case 'invalid':
      return (
        <XCircle
          className="h-3.5 w-3.5 text-red-500"
          aria-label="Invalid - URL or domain mismatch"
        />
      );
    case 'archived':
      return (
        <Clock
          className="h-3.5 w-3.5 text-gray-400"
          aria-label="Archived - Source is older than 90 days"
        />
      );
    default:
      return null;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SourceLink({
  source,
  showPlatform = true,
  showBadge = true,
  verifyOnHover = true,
  compact = false,
  showAuthor = true,
  className,
}: SourceLinkProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    source.isVerified ? 'verified' : 'unverified'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  // Get display URL (truncated)
  const displayUrl = source.url
    ? new URL(source.url).hostname.replace(/^www\./, '')
    : 'Unknown';

  // Verify URL on hover (lazy verification)
  const handleMouseEnter = async () => {
    if (!verifyOnHover || hasVerified || isVerifying || !source.id) {
      return;
    }

    setIsVerifying(true);

    try {
      const verifiedSource = sourcePreservationService.getSource(source.id);
      if (verifiedSource) {
        const status = await sourcePreservationService.verifySourceUrl(verifiedSource);
        setVerificationStatus(status);
        setHasVerified(true);
      }
    } catch (err) {
      console.warn('[SourceLink] Verification failed:', err);
      setVerificationStatus('unverified');
    } finally {
      setIsVerifying(false);
    }
  };

  // Get link status styles
  const linkStyles = cn(
    'inline-flex items-center gap-1.5 text-sm rounded transition-colors',
    compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
    verificationStatus === 'verified' && 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    verificationStatus === 'unverified' && 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
    verificationStatus === 'invalid' && 'text-gray-400 line-through cursor-not-allowed',
    verificationStatus === 'archived' && 'text-gray-500 italic hover:bg-gray-50',
    className
  );

  // Gray out invalid links
  if (verificationStatus === 'invalid') {
    return (
      <span
        className={linkStyles}
        title="Invalid source - URL does not match platform"
        onMouseEnter={handleMouseEnter}
      >
        {showPlatform && (
          <img
            src={PLATFORM_ICONS[source.platform] || PLATFORM_ICONS.unknown}
            alt={PLATFORM_NAMES[source.platform] || 'Unknown'}
            className="h-4 w-4 grayscale opacity-50"
          />
        )}
        <span className="truncate max-w-[150px]">{displayUrl}</span>
        {showAuthor && source.author && (
          <span className="text-gray-400">- {source.author}</span>
        )}
        {showBadge && <VerificationBadge status={verificationStatus} loading={isVerifying} />}
      </span>
    );
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={linkStyles}
      onMouseEnter={handleMouseEnter}
      title={`${PLATFORM_NAMES[source.platform] || 'Source'}: ${source.url}`}
    >
      {showPlatform && (
        <img
          src={PLATFORM_ICONS[source.platform] || PLATFORM_ICONS.unknown}
          alt={PLATFORM_NAMES[source.platform] || 'Unknown'}
          className="h-4 w-4"
          onError={(e) => {
            // Hide broken favicon
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <span className="truncate max-w-[150px]">{displayUrl}</span>
      {showAuthor && source.author && (
        <span className="text-gray-500">- {source.author}</span>
      )}
      {showBadge && <VerificationBadge status={verificationStatus} loading={isVerifying} />}
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}

// ============================================================================
// SOURCE LIST COMPONENT
// ============================================================================

export interface SourceListProps {
  sources: ResolvedSource[];
  /** Maximum sources to show */
  maxVisible?: number;
  /** Show "Show more" button if truncated */
  showMoreButton?: boolean;
  /** Verify all URLs on mount */
  verifyOnMount?: boolean;
  /** Compact display */
  compact?: boolean;
  className?: string;
}

export function SourceList({
  sources,
  maxVisible = 3,
  showMoreButton = true,
  verifyOnMount = false,
  compact = false,
  className,
}: SourceListProps) {
  const [expanded, setExpanded] = useState(false);

  // Batch verify on mount if requested
  useEffect(() => {
    if (verifyOnMount && sources.length > 0) {
      const verifiedSources = sources
        .map(s => sourcePreservationService.getSource(s.id))
        .filter((s): s is NonNullable<typeof s> => !!s);

      if (verifiedSources.length > 0) {
        sourcePreservationService.verifySourceUrls(verifiedSources);
      }
    }
  }, [verifyOnMount, sources]);

  const visibleSources = expanded ? sources : sources.slice(0, maxVisible);
  const hiddenCount = sources.length - maxVisible;

  return (
    <div className={cn('space-y-1', className)}>
      {visibleSources.map((source) => (
        <SourceLink
          key={source.id}
          source={source}
          compact={compact}
          verifyOnHover={!verifyOnMount}
        />
      ))}

      {!expanded && hiddenCount > 0 && showMoreButton && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-blue-600 hover:text-blue-800 px-2 py-0.5"
        >
          +{hiddenCount} more source{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}

      {expanded && sources.length > maxVisible && (
        <button
          onClick={() => setExpanded(false)}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-0.5"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export default SourceLink;
