/**
 * Competitor Gaps Panel
 *
 * Displays competitor-aware gaps with expandable nested sections:
 * - Concise title showing the gap
 * - Expanded view with:
 *   - The Void / The Demand / Your Angle
 *   - Customer profiles it applies to
 *   - Offerings it relates to
 *   - Provenance (sources + direct quotes)
 *
 * Created: 2025-11-28
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  Loader2,
  MessageSquare,
  Quote,
  Package,
  Layers
} from 'lucide-react';
import type { CompetitorAwareGap, DiscoveredCompetitor } from '@/services/intelligence/business-profile-resolver.service';

interface CompetitorGapsPanelProps {
  gaps: CompetitorAwareGap[];
  competitors: DiscoveredCompetitor[];
  isLoading?: boolean;
  onSelectGap?: (gap: CompetitorAwareGap) => void;
  segmentLabel?: string | null;
}

// Source display name mapper
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'profile': 'Industry Profile',
  'perplexity': 'Web Research',
  'uvp-correlation': 'UVP Analysis',
  'reddit': 'Reddit',
  'g2': 'G2 Reviews',
  'trustpilot': 'TrustPilot',
  'google-reviews': 'Google Reviews',
};

/**
 * Single gap card with expandable nested sections
 */
const GapCard = memo(function GapCard({
  gap,
  isExpanded,
  onToggle,
  onSelect
}: {
  gap: CompetitorAwareGap;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const confidenceColor = gap.confidence >= 0.8
    ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
    : gap.confidence >= 0.6
      ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      : 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';

  const toggleSection = (section: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Synthesize a meaningful title from the gap data
  const synthesizeTitle = (): string => {
    // If theVoid has good content, use it as the title
    if (gap.theVoid && gap.theVoid.length > 10 && gap.theVoid.length < 80) {
      return gap.theVoid;
    }
    // Otherwise use the gap title but clean it up
    const cleaned = gap.title
      .replace(/^Competitive Edge:\s*/i, '')
      .replace(/^Unmet Need:\s*/i, '')
      .split(/[.!?]/)[0]
      .trim();
    return cleaned.length > 70 ? cleaned.substring(0, 70) + '...' : cleaned;
  };

  const conciseTitle = synthesizeTitle();

  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all duration-200
      ${isExpanded
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 hover:shadow-md'}
    `}>
      {/* Header - Concise Title - using div + cursor-pointer to avoid button nesting */}
      <div
        onClick={onToggle}
        className="w-full text-left p-4 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                Gap
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${confidenceColor}`}>
                {Math.round(gap.confidence * 100)}%
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {SOURCE_DISPLAY_NAMES[gap.source] || gap.source}
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {conciseTitle}
            </h4>
          </div>
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
            </button>
          )}
        </div>
      </div>

      {/* Expand Button */}
      <div className="px-4 pb-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-200 dark:border-slate-700"
          >
            <div className="p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50">

              {/* Executive Summary - The Void, The Demand, Your Angle - ALWAYS VISIBLE */}
              <div className="space-y-3">
                {/* The Void */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border-l-4 border-red-400">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                      The Void
                    </span>
                    <span className="text-xs text-red-600 dark:text-red-400 opacity-70">— What competitors miss</span>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {gap.theVoid}
                  </p>
                </div>

                {/* The Demand */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                      The Demand
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 opacity-70">— Evidence of customer need</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {gap.theDemand}
                  </p>
                </div>

                {/* Your Angle */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                      Your Angle
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 opacity-70">— How to position against this</span>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    {gap.yourAngle}
                  </p>
                </div>
              </div>

              {/* Competitors Affected Section */}
              {gap.competitors.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('competitors', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Competitors Affected ({gap.competitors.length})
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'competitors' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'competitors' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0">
                          <div className="flex flex-wrap gap-2">
                            {gap.competitors.map((comp, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            These competitors are not effectively addressing this gap - your opportunity to differentiate.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Customer Profiles Section */}
              {gap.customerProfiles && gap.customerProfiles.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('customers', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Who This Applies To ({gap.customerProfiles.length})
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'customers' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'customers' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 space-y-2">
                          {gap.customerProfiles.map((profile, i) => (
                            <div
                              key={i}
                              className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-green-400"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-green-700 dark:text-green-400">
                                  {profile.segment}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  profile.readiness === 'high'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : profile.readiness === 'medium'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {profile.readiness} readiness
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {profile.painPoint}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Applicable Offerings Section */}
              {gap.applicableOfferings && gap.applicableOfferings.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('offerings', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Applicable Offerings ({gap.applicableOfferings.length})
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'offerings' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'offerings' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 space-y-2">
                          {gap.applicableOfferings.map((offering, i) => (
                            <div
                              key={i}
                              className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-indigo-400"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                  {offering.offering}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  offering.fit === 'direct'
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : offering.fit === 'partial'
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {offering.fit} fit
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {offering.positioning}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Provenance Section */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => toggleSection('provenance', e)}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Provenance & Source Data
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'provenance' ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandedSection === 'provenance' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 space-y-2">
                        {/* Source badge with metadata */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {gap.provenance?.sourceType
                              ? SOURCE_DISPLAY_NAMES[gap.provenance.sourceType] || gap.provenance.sourceType
                              : SOURCE_DISPLAY_NAMES[gap.source] || gap.source}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {Math.round(gap.confidence * 100)}%
                          </span>
                          {gap.provenance?.sampleSize && (
                            <span className="text-xs text-gray-500">
                              ({gap.provenance.sampleSize} data points)
                            </span>
                          )}
                        </div>

                        {/* Direct quotes from sources */}
                        {gap.provenance?.quotes && gap.provenance.quotes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Quote className="w-3 h-3" />
                              Source Quotes:
                            </p>
                            {gap.provenance.quotes.map((quote, i) => (
                              <div
                                key={i}
                                className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400"
                              >
                                <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                  "{quote}"
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  — {gap.provenance?.sourceType
                                      ? SOURCE_DISPLAY_NAMES[gap.provenance.sourceType] || gap.provenance.sourceType
                                      : SOURCE_DISPLAY_NAMES[gap.source] || gap.source}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fallback to description if no provenance quotes */}
                        {(!gap.provenance?.quotes || gap.provenance.quotes.length === 0) && gap.description && gap.description !== gap.title && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400">
                            <div className="flex items-start gap-2">
                              <Quote className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                  "{gap.description}"
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  — {SOURCE_DISPLAY_NAMES[gap.source] || gap.source}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Source URL if available */}
                        {gap.provenance?.sourceUrl && (
                          <a
                            href={gap.provenance.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3" />
                            View original source
                          </a>
                        )}

                        {/* Source type explanation */}
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded">
                          {gap.source === 'profile' && (
                            <p>Sourced from enhanced industry profile data with competitive gaps analysis.</p>
                          )}
                          {gap.source === 'perplexity' && (
                            <p>Discovered via web research analyzing competitor positioning and market feedback.</p>
                          )}
                          {gap.source === 'uvp-correlation' && (
                            <p>Identified by correlating your UVP with DeepContext market intelligence data.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Use in Content Button */}
              {onSelect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="w-full py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Use This Gap in Content
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Main Competitor Gaps Panel
 */
export const CompetitorGapsPanel = memo(function CompetitorGapsPanel({
  gaps,
  competitors,
  isLoading,
  onSelectGap,
  segmentLabel
}: CompetitorGapsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Analyzing competitive landscape...
        </p>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          No Competitive Gaps Found
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-[200px]">
          Complete your UVP and industry profile to discover market gaps
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            Competitive Gaps
          </span>
          <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
            {gaps.length}
          </span>
        </div>
        {segmentLabel && (
          <span className="text-xs text-gray-500">
            {segmentLabel}
          </span>
        )}
      </div>

      {/* Gaps List */}
      {gaps.map((gap) => (
        <GapCard
          key={gap.id}
          gap={gap}
          isExpanded={expandedId === gap.id}
          onToggle={() => setExpandedId(expandedId === gap.id ? null : gap.id)}
          onSelect={onSelectGap ? () => onSelectGap(gap) : undefined}
        />
      ))}
    </div>
  );
});

export default CompetitorGapsPanel;
