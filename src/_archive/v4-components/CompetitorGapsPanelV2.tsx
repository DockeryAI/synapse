/**
 * Competitor Gaps Panel V2
 *
 * Phase 4 - Gap Tab 2.0
 * Enhanced version with integrated Quick Content Generation.
 * Uses the new CompetitorGap type from competitor-intelligence.types.ts
 *
 * Features:
 * - Void/Demand/Angle display
 * - Quick Content buttons (Attack Ad, Comparison, Guide)
 * - Inline content preview
 * - Provenance with source quotes
 *
 * Created: 2025-11-28
 */

import React, { memo, useState, useCallback } from 'react';
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
  Star,
  StarOff,
  X
} from 'lucide-react';
import { GapContentActions } from './GapContentActions';
import type { CompetitorGap, CompetitorProfile } from '@/types/competitor-intelligence.types';
import type { GapContentType, GapContentResult } from '@/services/intelligence/gap-content-generator.service';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitorGapsPanelV2Props {
  gaps: CompetitorGap[];
  competitors: CompetitorProfile[];
  isLoading?: boolean;
  onSelectGap?: (gap: CompetitorGap) => void;
  onDismissGap?: (gapId: string) => void;
  onStarGap?: (gapId: string) => void;
  onGenerateContent?: (gap: CompetitorGap, contentType: GapContentType) => Promise<GapContentResult>;
  generatedContent?: Map<string, GapContentResult[]>;
  isGeneratingContent?: boolean;
  currentGeneratingGapId?: string | null;
  currentGeneratingType?: GapContentType | null;
  segmentLabel?: string | null;
}

// Source display name mapper - Updated to show real platform names
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  // Real platform names - shown as-is
  'G2': 'G2',
  'Capterra': 'Capterra',
  'TrustRadius': 'TrustRadius',
  'TrustPilot': 'TrustPilot',
  'Reddit': 'Reddit',
  'Google Reviews': 'Google Reviews',
  'Yelp': 'Yelp',
  'LinkedIn': 'LinkedIn',
  'Twitter': 'Twitter',
  'Hacker News': 'Hacker News',
  'Quora': 'Quora',
  // Lowercase variants
  'g2': 'G2',
  'capterra': 'Capterra',
  'trustradius': 'TrustRadius',
  'trustpilot': 'TrustPilot',
  'reddit': 'Reddit',
  'google-reviews': 'Google Reviews',
  'google reviews': 'Google Reviews',
  'yelp': 'Yelp',
  'linkedin': 'LinkedIn',
  // Internal source types
  'reviews': 'Customer Reviews',
  'ads': 'Ad Library',
  'website': 'Website Analysis',
  'perplexity': 'Market Research',
  'uvp-correlation': 'Competitive Analysis',
  'llm-analysis': 'Market Research',
  // Legacy fallbacks
  'Customer Complaints': 'Customer Reviews',
  'Market Analysis': 'G2 Market Analysis',
  'Review Platform': 'G2',
  'Customer Feedback': 'Customer Reviews'
};

const GAP_TYPE_LABELS: Record<string, string> = {
  'feature-gap': 'Feature Gap',
  'service-gap': 'Service Gap',
  'pricing-gap': 'Pricing Gap',
  'support-gap': 'Support Gap',
  'trust-gap': 'Trust Gap',
  'ux-gap': 'UX Gap',
  'integration-gap': 'Integration Gap',
  'messaging-gap': 'Messaging Gap'
};

// ============================================================================
// GAP CARD COMPONENT
// ============================================================================

interface GapCardV2Props {
  gap: CompetitorGap;
  competitors: CompetitorProfile[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  onDismiss?: () => void;
  onStar?: () => void;
  onGenerateContent?: (contentType: GapContentType) => Promise<GapContentResult>;
  generatedContent: GapContentResult[];
  isGenerating: boolean;
  currentGeneratingType: GapContentType | null;
}

const GapCardV2 = memo(function GapCardV2({
  gap,
  competitors,
  isExpanded,
  onToggle,
  onSelect,
  onDismiss,
  onStar,
  onGenerateContent,
  generatedContent,
  isGenerating,
  currentGeneratingType
}: GapCardV2Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const confidenceColor = gap.confidence_score >= 0.8
    ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
    : gap.confidence_score >= 0.6
      ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      : 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';

  const toggleSection = (section: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get competitor names
  const competitorNames = gap.competitor_names.length > 0
    ? gap.competitor_names
    : competitors.filter(c => gap.competitor_ids.includes(c.id)).map(c => c.name);

  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all duration-200
      ${gap.is_dismissed ? 'opacity-50' : ''}
      ${isExpanded
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 hover:shadow-md'}
    `}>
      {/* Header - using div with role instead of button to avoid nested buttons */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
        className="w-full text-left p-4 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {gap.gap_type && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                  {GAP_TYPE_LABELS[gap.gap_type] || gap.gap_type}
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${confidenceColor}`}>
                {Math.round(gap.confidence_score * 100)}%
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {SOURCE_DISPLAY_NAMES[gap.primary_source] || gap.primary_source}
              </span>
              {gap.is_starred && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {gap.title}
            </h4>
            {competitorNames.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                vs. {competitorNames.slice(0, 3).join(', ')}
                {competitorNames.length > 3 && ` +${competitorNames.length - 3} more`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onStar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStar();
                }}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                {gap.is_starred ? (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ) : (
                  <StarOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
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
            <div className="p-4 space-y-4 bg-gray-50 dark:bg-slate-800/50">

              {/* The Void / The Demand / Your Angle */}
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
                    {gap.the_void}
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
                    {gap.the_demand}
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
                    {gap.your_angle}
                  </p>
                </div>
              </div>

              {/* Quick Content Generation */}
              {onGenerateContent && (
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                  <GapContentActions
                    gapId={gap.id}
                    onGenerate={onGenerateContent}
                    isGenerating={isGenerating}
                    currentGeneratingType={currentGeneratingType}
                    generatedContent={generatedContent}
                  />
                </div>
              )}

              {/* Competitors Affected Section */}
              {competitorNames.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('competitors', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Competitors ({competitorNames.length})
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
                            {competitorNames.map((name, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Customer Profiles Section */}
              {gap.customer_profiles && gap.customer_profiles.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('customers', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Customer Profiles ({gap.customer_profiles.length})
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
                          {gap.customer_profiles.map((profile, i) => (
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
                                {profile.pain_point}
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
              {gap.applicable_offerings && gap.applicable_offerings.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('offerings', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Applicable Offerings ({gap.applicable_offerings.length})
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
                          {gap.applicable_offerings.map((offering, i) => (
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
                      Source Evidence ({gap.source_count} sources)
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
                        {/* Source quotes with URLs */}
                        {gap.source_quotes && gap.source_quotes.length > 0 && (
                          <div className="space-y-2">
                            {gap.source_quotes.map((sq, i) => (
                              <div
                                key={i}
                                className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400"
                              >
                                <div className="flex items-start gap-2">
                                  <Quote className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                      "{sq.quote}"
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500">
                                        — {SOURCE_DISPLAY_NAMES[sq.source] || sq.source}
                                      </span>
                                      {sq.url && sq.url.startsWith('http') && (
                                        <a
                                          href={sq.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          View Source ↗
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Confidence explanation */}
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded">
                          <p>
                            Confidence: {Math.round(gap.confidence_score * 100)}% based on {gap.source_count} source{gap.source_count !== 1 ? 's' : ''}.
                            Primary: {SOURCE_DISPLAY_NAMES[gap.primary_source] || gap.primary_source}.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legacy Select Button */}
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorGapsPanelV2 = memo(function CompetitorGapsPanelV2({
  gaps,
  competitors,
  isLoading,
  onSelectGap,
  onDismissGap,
  onStarGap,
  onGenerateContent,
  generatedContent = new Map(),
  isGeneratingContent = false,
  currentGeneratingGapId = null,
  currentGeneratingType = null,
  segmentLabel
}: CompetitorGapsPanelV2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter out dismissed gaps by default
  const visibleGaps = gaps.filter(g => !g.is_dismissed);

  const handleGenerateContent = useCallback((gap: CompetitorGap) => {
    return async (contentType: GapContentType): Promise<GapContentResult> => {
      if (!onGenerateContent) {
        throw new Error('Content generation not available');
      }
      return onGenerateContent(gap, contentType);
    };
  }, [onGenerateContent]);

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

  if (visibleGaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          No Competitive Gaps Found
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-[200px]">
          Scan competitors to discover market gaps
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            Competitive Gaps
          </span>
          <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
            {visibleGaps.length}
          </span>
        </div>
        {segmentLabel && (
          <span className="text-xs text-gray-500">
            {segmentLabel}
          </span>
        )}
      </div>

      {/* Gaps List */}
      {visibleGaps.map((gap) => (
        <GapCardV2
          key={gap.id}
          gap={gap}
          competitors={competitors}
          isExpanded={expandedId === gap.id}
          onToggle={() => setExpandedId(expandedId === gap.id ? null : gap.id)}
          onSelect={onSelectGap ? () => onSelectGap(gap) : undefined}
          onDismiss={onDismissGap ? () => onDismissGap(gap.id) : undefined}
          onStar={onStarGap ? () => onStarGap(gap.id) : undefined}
          onGenerateContent={onGenerateContent ? handleGenerateContent(gap) : undefined}
          generatedContent={generatedContent.get(gap.id) || []}
          isGenerating={isGeneratingContent && currentGeneratingGapId === gap.id}
          currentGeneratingType={currentGeneratingGapId === gap.id ? currentGeneratingType : null}
        />
      ))}
    </div>
  );
});

export default CompetitorGapsPanelV2;
