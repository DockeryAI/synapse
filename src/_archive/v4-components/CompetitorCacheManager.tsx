/**
 * CompetitorCacheManager Component
 *
 * Phase 5 - Gap Tab 2.0
 * Displays scan freshness status and provides rescan functionality.
 * Shows "Last scanned" timestamps and allows manual rescan per competitor.
 *
 * Created: 2025-11-28
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  MessageSquare,
  Megaphone,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Settings
} from 'lucide-react';
import type {
  CompetitorProfile,
  ScanType
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface ScanFreshness {
  scan_type: ScanType;
  last_scanned: string | null;
  expires_at: string | null;
  is_fresh: boolean;
  is_scanning: boolean;
}

interface CompetitorScanStatus {
  competitor: CompetitorProfile;
  scans: ScanFreshness[];
  overallFreshness: 'fresh' | 'stale' | 'expired' | 'never';
}

interface CompetitorCacheManagerProps {
  competitors: CompetitorProfile[];
  scanStatuses: Map<string, ScanFreshness[]>;
  onRescan: (competitorId: string, scanTypes?: ScanType[]) => Promise<void>;
  onRescanAll: () => Promise<void>;
  isScanning: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCAN_TYPE_CONFIG: Record<ScanType, {
  label: string;
  icon: React.ReactNode;
  ttlDays: number;
}> = {
  'website': {
    label: 'Website',
    icon: <Globe className="w-3.5 h-3.5" />,
    ttlDays: 14
  },
  'reviews-google': {
    label: 'Google Reviews',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    ttlDays: 3
  },
  'reviews-yelp': {
    label: 'Yelp',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    ttlDays: 3
  },
  'reviews-g2': {
    label: 'G2',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    ttlDays: 3
  },
  'reviews-capterra': {
    label: 'Capterra',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    ttlDays: 3
  },
  'reviews-trustpilot': {
    label: 'Trustpilot',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    ttlDays: 3
  },
  'ads-meta': {
    label: 'Meta Ads',
    icon: <Megaphone className="w-3.5 h-3.5" />,
    ttlDays: 7
  },
  'ads-linkedin': {
    label: 'LinkedIn Ads',
    icon: <Megaphone className="w-3.5 h-3.5" />,
    ttlDays: 7
  },
  'perplexity-research': {
    label: 'Research',
    icon: <Search className="w-3.5 h-3.5" />,
    ttlDays: 7
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getOverallFreshness(scans: ScanFreshness[]): 'fresh' | 'stale' | 'expired' | 'never' {
  if (scans.length === 0) return 'never';

  const hasNeverScanned = scans.some(s => !s.last_scanned);
  if (hasNeverScanned) return 'never';

  const hasExpired = scans.some(s => !s.is_fresh);
  const allExpired = scans.every(s => !s.is_fresh);

  if (allExpired) return 'expired';
  if (hasExpired) return 'stale';
  return 'fresh';
}

// ============================================================================
// COMPETITOR ROW COMPONENT
// ============================================================================

interface CompetitorRowProps {
  status: CompetitorScanStatus;
  onRescan: (scanTypes?: ScanType[]) => Promise<void>;
  isExpanded: boolean;
  onToggle: () => void;
}

const CompetitorRow = memo(function CompetitorRow({
  status,
  onRescan,
  isExpanded,
  onToggle
}: CompetitorRowProps) {
  const [isRescanning, setIsRescanning] = useState(false);

  const handleRescan = async (scanTypes?: ScanType[]) => {
    setIsRescanning(true);
    try {
      await onRescan(scanTypes);
    } finally {
      setIsRescanning(false);
    }
  };

  const freshnessColor = {
    fresh: 'text-green-600',
    stale: 'text-amber-600',
    expired: 'text-red-600',
    never: 'text-gray-400'
  }[status.overallFreshness];

  const freshnessIcon = {
    fresh: <CheckCircle className="w-4 h-4 text-green-500" />,
    stale: <Clock className="w-4 h-4 text-amber-500" />,
    expired: <AlertCircle className="w-4 h-4 text-red-500" />,
    never: <Clock className="w-4 h-4 text-gray-400" />
  }[status.overallFreshness];

  // Find most recent scan
  const mostRecentScan = status.scans
    .filter(s => s.last_scanned)
    .sort((a, b) => new Date(b.last_scanned!).getTime() - new Date(a.last_scanned!).getTime())[0];

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header Row */}
      <div
        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={onToggle}
      >
        {/* Logo/Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
          {status.competitor.logo_url ? (
            <img
              src={status.competitor.logo_url}
              alt={status.competitor.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            status.competitor.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {status.competitor.name}
            </span>
            {freshnessIcon}
          </div>
          <p className={`text-xs ${freshnessColor}`}>
            {mostRecentScan
              ? `Last scanned ${getRelativeTime(mostRecentScan.last_scanned)}`
              : 'Never scanned'
            }
          </p>
        </div>

        {/* Rescan Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRescan();
          }}
          disabled={isRescanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
        >
          {isRescanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Rescan
        </button>

        {/* Expand */}
        <button className="p-1 text-gray-400">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 bg-gray-50 dark:bg-slate-800/50 space-y-2">
              {status.scans.map(scan => (
                <div
                  key={scan.scan_type}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {SCAN_TYPE_CONFIG[scan.scan_type]?.icon}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {SCAN_TYPE_CONFIG[scan.scan_type]?.label || scan.scan_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${scan.is_fresh ? 'text-green-600' : 'text-amber-600'}`}>
                      {getRelativeTime(scan.last_scanned)}
                    </span>

                    {scan.is_scanning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    ) : (
                      <button
                        onClick={() => handleRescan([scan.scan_type])}
                        className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                        title={`Rescan ${SCAN_TYPE_CONFIG[scan.scan_type]?.label}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorCacheManager = memo(function CompetitorCacheManager({
  competitors,
  scanStatuses,
  onRescan,
  onRescanAll,
  isScanning,
  className = ''
}: CompetitorCacheManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build status for each competitor
  const competitorStatuses: CompetitorScanStatus[] = competitors.map(competitor => {
    const scans = scanStatuses.get(competitor.id) || [];
    return {
      competitor,
      scans,
      overallFreshness: getOverallFreshness(scans)
    };
  });

  // Calculate summary stats
  const summary = {
    total: competitorStatuses.length,
    fresh: competitorStatuses.filter(s => s.overallFreshness === 'fresh').length,
    stale: competitorStatuses.filter(s => s.overallFreshness === 'stale' || s.overallFreshness === 'expired').length,
    never: competitorStatuses.filter(s => s.overallFreshness === 'never').length
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Cache Management
          </h3>
        </div>

        <button
          onClick={onRescanAll}
          disabled={isScanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Rescan All
        </button>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
          <div className="text-xs text-gray-500">Competitors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.fresh}</div>
          <div className="text-xs text-gray-500">Fresh</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{summary.stale}</div>
          <div className="text-xs text-gray-500">Stale</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{summary.never}</div>
          <div className="text-xs text-gray-500">Never</div>
        </div>
      </div>

      {/* Competitor List */}
      <div className="space-y-2">
        {competitorStatuses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No competitors tracked yet
          </div>
        ) : (
          competitorStatuses.map(status => (
            <CompetitorRow
              key={status.competitor.id}
              status={status}
              onRescan={(scanTypes) => onRescan(status.competitor.id, scanTypes)}
              isExpanded={expandedId === status.competitor.id}
              onToggle={() => setExpandedId(
                expandedId === status.competitor.id ? null : status.competitor.id
              )}
            />
          ))
        )}
      </div>

      {/* TTL Legend */}
      <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Cache Expiration
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>Website: 14 days</div>
          <div>Reviews: 3 days</div>
          <div>Ads: 7 days</div>
          <div>Research: 7 days</div>
        </div>
      </div>
    </div>
  );
});

export default CompetitorCacheManager;
