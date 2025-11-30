/**
 * Competitor Intelligence Panel (Phase 12)
 *
 * New competitor-centric UI that replaces the chips bar with accordions.
 * Each competitor gets an expandable accordion with:
 * - Quick Stats (gap count, threat score, last scanned)
 * - Gaps nested underneath with inline source quotes + links
 * - Customer Voice section with real quotes
 * - Battlecard section
 *
 * Also includes Market-Wide Gaps at the top (collapsible) for gaps affecting 3+ competitors.
 *
 * Created: 2025-11-29
 */

import React, { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Target,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Users,
  Loader2,
  MessageSquare,
  Quote,
  ExternalLink,
  Shield,
  Zap,
  Building2,
  Globe,
  Clock,
  Star,
  RefreshCw,
  Plus,
  X,
  Trash2,
  BarChart3,
  Swords,
  Crown,
  AlertTriangle,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  CompetitorChipState,
  GapCardState,
  CustomerVoice,
  EnhancedCompetitorInsights,
  CompetitorBattlecard,
  SourceQuote,
  DiscoveredCompetitor
} from '@/types/competitor-intelligence.types';
import { Search, ArrowLeft, Check } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitorIntelligencePanelProps {
  competitors: CompetitorChipState[];
  gaps: GapCardState[];
  enhancedInsights: Map<string, Partial<EnhancedCompetitorInsights>>;
  customerVoiceByCompetitor: Map<string, CustomerVoice>;
  isLoading?: boolean;
  isDiscovering?: boolean;
  isScanning?: boolean;
  brandName?: string;
  onSelectGap?: (gap: GapCardState) => void;
  onToggleCompetitor?: (competitorId: string) => void;
  onRemoveCompetitor?: (competitorId: string) => void;
  onRescanCompetitor?: (competitorId: string) => void;
  onDiscoverCompetitors?: () => void;
  onAddCompetitor?: (competitor: DiscoveredCompetitor, onProgress?: (stage: string, progress: number) => void) => Promise<void>;
  onIdentifyCompetitor?: (name: string, website?: string) => Promise<{
    found: boolean;
    competitor: DiscoveredCompetitor | null;
    alternatives?: DiscoveredCompetitor[];
    error?: string;
  }>;
  /** Callback when user manually reorders competitors via drag-and-drop */
  onReorderCompetitors?: (newOrder: string[]) => void;
}

// ============================================================================
// ADD COMPETITOR DIALOG
// ============================================================================

type AddCompetitorStep = 'input' | 'confirm' | 'scanning';

interface AddCompetitorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentify: (name: string, website?: string) => Promise<{
    found: boolean;
    competitor: DiscoveredCompetitor | null;
    alternatives?: DiscoveredCompetitor[];
    error?: string;
  }>;
  onAdd: (competitor: DiscoveredCompetitor, onProgress?: (stage: string, progress: number) => void) => Promise<void>;
}

const AddCompetitorDialog = memo(function AddCompetitorDialog({
  isOpen,
  onClose,
  onIdentify,
  onAdd
}: AddCompetitorDialogProps) {
  const [step, setStep] = useState<AddCompetitorStep>('input');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedCompetitor, setIdentifiedCompetitor] = useState<DiscoveredCompetitor | null>(null);
  const [alternatives, setAlternatives] = useState<DiscoveredCompetitor[]>([]);
  const [scanStage, setScanStage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setStep('input');
    setName('');
    setWebsite('');
    setIdentifiedCompetitor(null);
    setAlternatives([]);
    setScanStage('');
    setScanProgress(0);
    setError(null);
    setIsIdentifying(false);
    onClose();
  }, [onClose]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Competitor name is required');
      return;
    }

    setIsIdentifying(true);
    setError(null);

    try {
      const result = await onIdentify(name.trim(), website.trim() || undefined);
      if (result.found && result.competitor) {
        setIdentifiedCompetitor(result.competitor);
        setAlternatives(result.alternatives || []);
        setStep('confirm');
      } else {
        setError(result.error || 'Could not identify this competitor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to identify competitor');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSelectCompetitor = (competitor: DiscoveredCompetitor) => {
    setIdentifiedCompetitor(competitor);
  };

  const handleConfirmAndScan = async () => {
    if (!identifiedCompetitor) return;

    setStep('scanning');
    setScanProgress(0);
    setScanStage('Starting...');

    try {
      await onAdd(identifiedCompetitor, (stage, progress) => {
        setScanStage(stage);
        setScanProgress(progress);
      });
      setTimeout(() => handleClose(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
      setStep('confirm');
    }
  };

  const handleBack = () => {
    setStep('input');
    setIdentifiedCompetitor(null);
    setAlternatives([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        {/* Step 1: Input */}
        {step === 'input' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Competitor
            </h3>
            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Competitor Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Salesforce"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                  disabled={isIdentifying}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://competitor.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isIdentifying}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isIdentifying}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIdentifying || !name.trim()}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isIdentifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Identifying...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find Competitor
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && identifiedCompetitor && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirm Competitor
              </h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {identifiedCompetitor.name}
                    </h4>
                    {identifiedCompetitor.website && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <Globe className="w-3 h-3" />
                        {identifiedCompetitor.website}
                      </div>
                    )}
                    {identifiedCompetitor.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {identifiedCompetitor.description}
                      </p>
                    )}
                    {identifiedCompetitor.reason && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        {identifiedCompetitor.reason}
                      </p>
                    )}
                  </div>
                  <Check className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              {alternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Did you mean one of these instead?
                  </p>
                  {alternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectCompetitor(alt)}
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {alt.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAndScan}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Add & Scan
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Scanning */}
        {step === 'scanning' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Scanning Competitor
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {identifiedCompetitor?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {scanStage}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <motion.div
                  className="bg-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {Math.round(scanProgress)}% complete
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
});

// ============================================================================
// SOURCE DISPLAY NAMES
// ============================================================================

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  // Real platform names - shown as-is when data comes from these sources
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
  'twitter': 'Twitter',
  'hacker news': 'Hacker News',
  'quora': 'Quora',
  // Internal source types (show real platform if possible)
  'profile': 'Market Analysis',
  'perplexity': 'Market Research',
  'uvp-correlation': 'Competitive Analysis',
  'reviews': 'Customer Reviews',
  'ads': 'Ad Library',
  'website': 'Website Analysis',
  'competitor-scan': 'Market Research',
  'llm-analysis': 'Market Research',
  // Legacy fallbacks
  'Customer Complaints': 'Customer Reviews',
  'Market Analysis': 'G2 Market Analysis',
  'Review Platform': 'G2',
  'Customer Feedback': 'Customer Reviews'
};

// ============================================================================
// MARKET-WIDE GAPS SECTION (Collapsible)
// ============================================================================

interface MarketWideGapsSectionProps {
  gaps: GapCardState[];
  competitors: CompetitorChipState[];
  onSelectGap?: (gap: GapCardState) => void;
}

const MarketWideGapsSection = memo(function MarketWideGapsSection({
  gaps,
  competitors,
  onSelectGap
}: MarketWideGapsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Market-wide gaps = gaps affecting 3+ competitors
  const marketWideGaps = useMemo(() => {
    return gaps.filter(g => (g.competitor_names?.length || 0) >= 3);
  }, [gaps]);

  if (marketWideGaps.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Market-Wide Opportunities
              <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                {marketWideGaps.length}
              </span>
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Gaps affecting 3+ competitors — highest impact targets
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-amber-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {marketWideGaps.map((gap) => (
                <MarketWideGapCard
                  key={gap.id}
                  gap={gap}
                  onSelect={onSelectGap ? () => onSelectGap(gap) : undefined}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// MARKET-WIDE GAP CARD
// ============================================================================

interface MarketWideGapCardProps {
  gap: GapCardState;
  onSelect?: () => void;
}

const MarketWideGapCard = memo(function MarketWideGapCard({ gap, onSelect }: MarketWideGapCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                {gap.competitor_names?.length || 0} competitors
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {Math.round(gap.confidence_score * 100)}% confidence
              </span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {gap.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {gap.the_void}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                title="Generate content for this gap"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
              </button>
            )}
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-amber-200 dark:border-amber-800"
          >
            <div className="p-3 bg-gray-50 dark:bg-slate-900/50 space-y-3">
              {/* Competitors affected */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Competitors affected:</p>
                <div className="flex flex-wrap gap-1">
                  {gap.competitor_names?.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* The Demand */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border-l-4 border-blue-400">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">The Demand:</p>
                <p className="text-xs text-blue-800 dark:text-blue-300">{gap.the_demand}</p>
              </div>

              {/* Your Angle */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border-l-4 border-green-400">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Your Angle:</p>
                <p className="text-xs text-green-800 dark:text-green-300">{gap.your_angle}</p>
              </div>

              {/* Source quotes */}
              {gap.source_quotes && gap.source_quotes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Quote className="w-3 h-3" /> Sources:
                  </p>
                  <div className="space-y-2">
                    {gap.source_quotes.slice(0, 2).map((sq, i) => (
                      <SourceQuoteCard key={i} quote={sq} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// SOURCE QUOTE CARD
// ============================================================================

interface SourceQuoteCardProps {
  quote: SourceQuote;
}

// List of bad source names that should be replaced
const BAD_SOURCE_NAMES = new Set([
  'Customer complaints', 'Customer complaint', 'customer complaints',
  'Market Analysis', 'market analysis', 'Industry Report', 'industry report',
  'Review Platform', 'review platform', 'Online Reviews', 'online reviews',
  'User Feedback', 'user feedback', 'Customer Feedback', 'customer feedback',
  'Unknown', 'unknown', 'N/A', 'n/a', '', 'Source', 'source'
]);

const SourceQuoteCard = memo(function SourceQuoteCard({ quote }: SourceQuoteCardProps) {
  const hasValidUrl = quote.url && quote.url.startsWith('http');

  // Determine display source - prioritize URL extraction over LLM-provided names
  let displaySource: string;

  if (hasValidUrl) {
    // Always try URL first - most reliable source
    const platformFromUrl = extractPlatformFromUrl(quote.url);
    if (platformFromUrl) {
      displaySource = platformFromUrl;
    } else if (BAD_SOURCE_NAMES.has(quote.source)) {
      displaySource = 'Web Source'; // Has URL but can't identify platform
    } else {
      displaySource = SOURCE_DISPLAY_NAMES[quote.source] || quote.source;
    }
  } else {
    // No URL - check if source name is usable
    if (BAD_SOURCE_NAMES.has(quote.source)) {
      displaySource = 'Market Research'; // No URL and bad name
    } else {
      displaySource = SOURCE_DISPLAY_NAMES[quote.source] || quote.source;
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded p-2 border-l-4 border-blue-400">
      <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{quote.quote}"</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">
          — {displaySource}
        </span>
        {hasValidUrl ? (
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View source <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-400 italic">
            No link available
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// COMPETITOR ACCORDION
// ============================================================================

interface CompetitorAccordionProps {
  competitor: CompetitorChipState;
  gaps: GapCardState[];
  insights?: Partial<EnhancedCompetitorInsights>;
  customerVoice?: CustomerVoice;
  brandName?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectGap?: (gap: GapCardState) => void;
  onRemove?: () => void;
  onRescan?: () => void;
}

const CompetitorAccordion = memo(function CompetitorAccordion({
  competitor,
  gaps,
  insights,
  customerVoice,
  brandName,
  isExpanded,
  onToggle,
  onSelectGap,
  onRemove,
  onRescan
}: CompetitorAccordionProps) {
  // All sections collapsed by default per user request
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Quick stats
  const gapCount = gaps.length;
  const threatScore = insights?.threat_score?.overall || 0;
  const hasCustomerVoice = !!(customerVoice && (
    (customerVoice.source_quotes?.length || 0) > 0 ||
    (customerVoice.pain_points?.length || 0) > 0 ||
    (customerVoice.switching_triggers?.length || 0) > 0
  ));
  // Check battlecard has actual content (not just an empty object)
  const hasBattlecard = !!(insights?.battlecard && (
    (insights.battlecard.our_advantages?.length || 0) > 0 ||
    (insights.battlecard.key_objection_handlers?.length || 0) > 0 ||
    (insights.battlecard.win_themes?.length || 0) > 0
  ));

  // DEBUG: Log what data we have for this competitor
  console.log('[CompetitorAccordion]', competitor.name, {
    hasCustomerVoice,
    hasBattlecard,
    customerVoice: customerVoice ? {
      pain_points: customerVoice.pain_points?.length,
      switching_triggers: customerVoice.switching_triggers?.length,
      source_quotes: customerVoice.source_quotes?.length
    } : null,
    battlecard: insights?.battlecard ? {
      our_advantages: insights.battlecard.our_advantages?.length,
      key_objection_handlers: insights.battlecard.key_objection_handlers?.length
    } : null
  });

  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all duration-200
      ${isExpanded
        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 shadow-lg'
        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300'}
    `}>
      {/* Accordion Header */}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo or Initial */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {competitor.logo_url ? (
                <img src={competitor.logo_url} alt={competitor.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                competitor.name.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {competitor.name}
                {competitor.is_scanning && (
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                )}
              </h3>
              {/* Quick Stats Row */}
              <div className="flex items-center gap-2 mt-1">
                <QuickStat icon={Target} label="Gaps" value={gapCount} color="orange" />
                {threatScore > 0 && (
                  <QuickStat
                    icon={AlertTriangle}
                    label="Threat"
                    value={`${threatScore}%`}
                    color={threatScore > 70 ? 'red' : threatScore > 40 ? 'yellow' : 'green'}
                  />
                )}
                {hasCustomerVoice && (
                  <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    <MessageSquare className="w-3 h-3 inline-block mr-0.5" />
                    Voice
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons */}
            {onRescan && (() => {
              // Calculate time since last scan for tooltip
              const lastScanTime = competitor.last_scanned ? new Date(competitor.last_scanned).getTime() : 0;
              const now = Date.now();
              const hoursSinceLastScan = lastScanTime ? (now - lastScanTime) / (1000 * 60 * 60) : 999;
              const canRescan = hoursSinceLastScan >= 24;
              const hoursRemaining = Math.ceil(24 - hoursSinceLastScan);

              return (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!canRescan) {
                      alert(`Rescan available in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. Limit: 1 scan per 24 hours.`);
                      return;
                    }
                    onRescan();
                  }}
                  className={`p-1.5 rounded-full transition-colors ${
                    canRescan
                      ? 'hover:bg-gray-100 dark:hover:bg-slate-700'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  title={canRescan
                    ? 'Rescan competitor (includes gaps, customer voice, battlecard)'
                    : `Rescan available in ${hoursRemaining}h (limit: 1 per 24h)`
                  }
                >
                  <RefreshCw className={`w-4 h-4 ${canRescan ? 'text-gray-500' : 'text-gray-400'} ${competitor.is_scanning ? 'animate-spin' : ''}`} />
                </button>
              );
            })()}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Remove competitor"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
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
            <div className="p-4 space-y-4 bg-white/50 dark:bg-slate-800/50">
              {/* Section: Customer Voice - FIRST per user request */}
              {hasCustomerVoice && customerVoice && (
                <AccordionSection
                  title="Customer Voice"
                  icon={MessageSquare}
                  count={(customerVoice.pain_points?.length || 0) + (customerVoice.switching_triggers?.length || 0)}
                  color="purple"
                  isExpanded={expandedSection === 'voice'}
                  onToggle={() => setExpandedSection(expandedSection === 'voice' ? null : 'voice')}
                >
                  <CustomerVoiceSection voice={customerVoice} competitorName={competitor.name} />
                </AccordionSection>
              )}

              {/* Section: Battlecard - SECOND per user request */}
              {hasBattlecard && insights?.battlecard && (
                <AccordionSection
                  title="Battlecard"
                  icon={Swords}
                  color="blue"
                  isExpanded={expandedSection === 'battlecard'}
                  onToggle={() => setExpandedSection(expandedSection === 'battlecard' ? null : 'battlecard')}
                >
                  <BattlecardSection battlecard={insights.battlecard} brandName={brandName} />
                </AccordionSection>
              )}

              {/* Section: Gaps - LAST per user request */}
              <AccordionSection
                title="Competitive Gaps"
                icon={Target}
                count={gapCount}
                color="orange"
                isExpanded={expandedSection === 'gaps'}
                onToggle={() => setExpandedSection(expandedSection === 'gaps' ? null : 'gaps')}
              >
                {gapCount === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    No gaps discovered yet. Run a scan to find competitive opportunities.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {gaps.map((gap) => (
                      <NestedGapCard
                        key={gap.id}
                        gap={gap}
                        onSelect={onSelectGap ? () => onSelectGap(gap) : undefined}
                      />
                    ))}
                  </div>
                )}
              </AccordionSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// QUICK STAT BADGE
// ============================================================================

interface QuickStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'orange' | 'red' | 'green' | 'yellow' | 'blue' | 'purple';
}

const colorMap = {
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
};

const QuickStat = memo(function QuickStat({ icon: Icon, label, value, color }: QuickStatProps) {
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded flex items-center gap-1 ${colorMap[color]}`}>
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );
});

// ============================================================================
// ACCORDION SECTION
// ============================================================================

interface AccordionSectionProps {
  title: string;
  icon: React.ElementType;
  count?: number;
  color: 'orange' | 'red' | 'green' | 'yellow' | 'blue' | 'purple';
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection = memo(function AccordionSection({
  title,
  icon: Icon,
  count,
  color,
  isExpanded,
  onToggle,
  children
}: AccordionSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorMap[color].split(' ')[2]}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </span>
          {count !== undefined && (
            <span className={`px-1.5 py-0.5 text-xs rounded ${colorMap[color]}`}>
              {count}
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 bg-gray-50/50 dark:bg-slate-900/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// HELPER: Extract platform from URL
// ============================================================================

function extractPlatformFromUrl(url: string): string | null {
  if (!url) return null;

  const platformPatterns: [RegExp, string][] = [
    [/g2\.com/i, 'G2'],
    [/capterra\.com/i, 'Capterra'],
    [/trustradius\.com/i, 'TrustRadius'],
    [/trustpilot\.com/i, 'TrustPilot'],
    [/reddit\.com/i, 'Reddit'],
    [/yelp\.com/i, 'Yelp'],
    [/google\.com\/maps|maps\.google/i, 'Google Reviews'],
    [/linkedin\.com/i, 'LinkedIn'],
    [/twitter\.com|x\.com/i, 'Twitter'],
    [/news\.ycombinator\.com/i, 'Hacker News'],
    [/quora\.com/i, 'Quora'],
    [/producthunt\.com/i, 'Product Hunt'],
  ];

  for (const [pattern, name] of platformPatterns) {
    if (pattern.test(url)) return name;
  }

  return null;
}

// ============================================================================
// HELPER: Get best display source from gap
// ============================================================================

function getBestSourceDisplay(gap: GapCardState): string {
  // Try to get a real platform name from source_quotes first
  if (gap.source_quotes && gap.source_quotes.length > 0) {
    for (const sq of gap.source_quotes) {
      // First try extracting from URL - most reliable
      if (sq.url && sq.url.startsWith('http')) {
        const platformFromUrl = extractPlatformFromUrl(sq.url);
        if (platformFromUrl) {
          return platformFromUrl;
        }
      }
      // Then try source name mapping (skip bad source names)
      if (sq.source && !BAD_SOURCE_NAMES.has(sq.source)) {
        const mapped = SOURCE_DISPLAY_NAMES[sq.source];
        // Prefer real platform names over generic ones
        if (mapped && !['Market Research', 'Customer Reviews', 'Competitive Analysis'].includes(mapped)) {
          return mapped;
        }
        // If no mapping, use the original if it's not a bad name
        if (!mapped) {
          return sq.source;
        }
      }
    }

    // Check if any source_quote has a valid URL (even if unrecognized platform)
    const hasAnyUrl = gap.source_quotes.some(sq => sq.url && sq.url.startsWith('http'));
    if (hasAnyUrl) {
      return 'Web Source';
    }
  }

  // Fallback to primary_source (also check for bad names)
  const primarySource = gap.primary_source;
  if (primarySource && !BAD_SOURCE_NAMES.has(primarySource)) {
    return SOURCE_DISPLAY_NAMES[primarySource] || primarySource;
  }

  return 'Market Research';
}

// ============================================================================
// NESTED GAP CARD
// ============================================================================

interface NestedGapCardProps {
  gap: GapCardState;
  onSelect?: () => void;
}

const NestedGapCard = memo(function NestedGapCard({ gap, onSelect }: NestedGapCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displaySource = getBestSourceDisplay(gap);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className={`px-1.5 py-0.5 text-xs rounded ${
                gap.confidence_score >= 0.8 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                gap.confidence_score >= 0.6 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              }`}>
                {Math.round(gap.confidence_score * 100)}%
              </span>
              <span className="px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {displaySource}
              </span>
            </div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
              {gap.title}
            </h5>
          </div>
          <div className="flex items-center gap-1">
            {onSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 transition-colors"
                title="Generate content"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              </button>
            )}
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded content with inline sources */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200 dark:border-slate-600"
          >
            <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 space-y-2">
              {/* The Void */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 border-l-4 border-red-400">
                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-0.5">The Void:</p>
                <p className="text-xs text-red-800 dark:text-red-300">{gap.the_void}</p>
              </div>

              {/* The Demand */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 border-l-4 border-blue-400">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-0.5">The Demand:</p>
                <p className="text-xs text-blue-800 dark:text-blue-300">{gap.the_demand}</p>
              </div>

              {/* Your Angle */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 border-l-4 border-green-400">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-0.5">Your Angle:</p>
                <p className="text-xs text-green-800 dark:text-green-300">{gap.your_angle}</p>
              </div>

              {/* Applicable Products - Phase 13 */}
              {gap.applicable_products && gap.applicable_products.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 border-l-4 border-purple-400">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Applies to Your Products:
                  </p>
                  <div className="space-y-1">
                    {gap.applicable_products.map((ap: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          ap.fit === 'direct' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                          ap.fit === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600'
                        }`}>
                          {ap.fit}
                        </span>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-purple-800 dark:text-purple-300">{ap.product}</span>
                          {ap.why && (
                            <p className="text-xs text-purple-700 dark:text-purple-400 opacity-80">{ap.why}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Applicable Segments - Phase 13 */}
              {gap.applicable_segments && gap.applicable_segments.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-2 border-l-4 border-indigo-400">
                  <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Applies to Your Segments:
                  </p>
                  <div className="space-y-1">
                    {gap.applicable_segments.map((as: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          as.readiness === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                          as.readiness === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600'
                        }`}>
                          {as.readiness}
                        </span>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-indigo-800 dark:text-indigo-300">{as.segment}</span>
                          {as.pain_point && (
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 opacity-80">{as.pain_point}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Quotes - INLINE with enhanced display */}
              {gap.source_quotes && gap.source_quotes.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Quote className="w-3 h-3" /> Evidence ({gap.source_quotes.length}):
                  </p>
                  <div className="space-y-1.5">
                    {gap.source_quotes.map((sq, i) => (
                      <SourceQuoteCard key={i} quote={sq} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// CUSTOMER VOICE SECTION
// ============================================================================

interface CustomerVoiceSectionProps {
  voice: CustomerVoice;
  competitorName: string;
}

const CustomerVoiceSection = memo(function CustomerVoiceSection({
  voice,
  competitorName
}: CustomerVoiceSectionProps) {
  return (
    <div className="space-y-3">
      {/* Pain Points */}
      {voice.pain_points && voice.pain_points.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Pain Points:</p>
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
            {voice.pain_points.slice(0, 3).map((pp, i) => (
              <li key={i}>{pp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Switching Triggers */}
      {voice.switching_triggers && voice.switching_triggers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Why they leave {competitorName}:</p>
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
            {voice.switching_triggers.slice(0, 3).map((st, i) => (
              <li key={i}>{st}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Real Quotes */}
      {voice.source_quotes && voice.source_quotes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
            <Quote className="w-3 h-3" /> Real customer quotes:
          </p>
          <div className="space-y-2">
            {voice.source_quotes.slice(0, 3).map((sq, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-slate-800 rounded p-2 border-l-4 ${
                  sq.sentiment === 'negative' ? 'border-red-400' :
                  sq.sentiment === 'positive' ? 'border-green-400' :
                  'border-gray-400'
                }`}
              >
                <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{sq.quote}"</p>
                <p className="text-xs text-gray-500 mt-1">— {sq.source}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// BATTLECARD SECTION
// ============================================================================

interface BattlecardSectionProps {
  battlecard: CompetitorBattlecard;
  brandName?: string;
}

const BattlecardSection = memo(function BattlecardSection({
  battlecard,
  brandName
}: BattlecardSectionProps) {
  return (
    <div className="space-y-3">
      {/* Our Advantages */}
      {battlecard.our_advantages && battlecard.our_advantages.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
            Why {brandName || 'we'} win:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
            {battlecard.our_advantages.slice(0, 3).map((adv, i) => (
              <li key={i}>{adv}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Their Advantages */}
      {battlecard.their_advantages && battlecard.their_advantages.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            Where they're strong:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
            {battlecard.their_advantages.slice(0, 3).map((adv, i) => (
              <li key={i}>{adv}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Objection Handlers */}
      {battlecard.key_objection_handlers && battlecard.key_objection_handlers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Objection handlers:</p>
          <div className="space-y-2">
            {battlecard.key_objection_handlers.slice(0, 2).map((oh, i) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">"{oh.objection}"</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">→ {oh.response}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// SORTABLE COMPETITOR ITEM - Wrapper for drag-and-drop
// ============================================================================

interface SortableCompetitorItemProps {
  competitor: CompetitorChipState & { relevance_score?: number; tier?: string };
  index: number;
  gaps: GapCardState[];
  insights?: Partial<EnhancedCompetitorInsights>;
  customerVoice?: CustomerVoice;
  brandName?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectGap?: (gap: GapCardState) => void;
  onRemove?: () => void;
  onRescan?: () => void;
  showRankBadge?: boolean;
  rankBadgeColor?: string;
}

const SortableCompetitorItem = memo(function SortableCompetitorItem({
  competitor,
  index,
  gaps,
  insights,
  customerVoice,
  brandName,
  isExpanded,
  onToggle,
  onSelectGap,
  onRemove,
  onRescan,
  showRankBadge = false,
  rankBadgeColor = 'bg-gray-100 text-gray-700'
}: SortableCompetitorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: competitor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'shadow-lg' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Rank Badge */}
      {showRankBadge && (
        <div className={`absolute -left-6 top-4 flex items-center justify-center w-5 h-5 rounded-full ${rankBadgeColor} text-xs font-bold`}>
          {index + 1}
        </div>
      )}

      <div className="pl-6">
        <CompetitorAccordion
          competitor={competitor}
          gaps={gaps}
          insights={insights}
          customerVoice={customerVoice}
          brandName={brandName}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onSelectGap={onSelectGap}
          onRemove={onRemove}
          onRescan={onRescan}
        />
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorIntelligencePanel = memo(function CompetitorIntelligencePanel({
  competitors,
  gaps,
  enhancedInsights,
  customerVoiceByCompetitor,
  isLoading,
  isDiscovering,
  isScanning,
  brandName,
  onSelectGap,
  onToggleCompetitor,
  onRemoveCompetitor,
  onRescanCompetitor,
  onDiscoverCompetitors,
  onAddCompetitor,
  onIdentifyCompetitor,
  onReorderCompetitors
}: CompetitorIntelligencePanelProps) {
  const [expandedCompetitorId, setExpandedCompetitorId] = useState<string | null>(
    competitors.length > 0 ? competitors[0].id : null
  );

  // DnD sensors for drag-and-drop reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Add Competitor Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Group gaps by competitor
  const gapsByCompetitor = useMemo(() => {
    const map = new Map<string, GapCardState[]>();
    competitors.forEach(c => map.set(c.id, []));

    gaps.forEach(gap => {
      gap.competitor_ids?.forEach(cid => {
        const existing = map.get(cid) || [];
        existing.push(gap);
        map.set(cid, existing);
      });
    });

    return map;
  }, [competitors, gaps]);

  // Compute relevance scores and sort competitors into tiers
  // Score factors: gap_count, has_battlecard, has_voice, evidence quality
  const rankedCompetitors = useMemo(() => {
    const withScores = competitors.map(competitor => {
      const gapCount = competitor.gap_count || 0;
      const hasVoice = customerVoiceByCompetitor.has(competitor.id);
      const hasBattlecard = enhancedInsights.has(competitor.id);

      // Compute relevance score (0-100)
      // More gaps = more competitive threat = higher score
      let score = competitor.relevance_score ?? 0;

      // If no AI score, compute a heuristic
      if (!competitor.relevance_score) {
        score = Math.min(100,
          gapCount * 10 +           // Each gap adds 10 points
          (hasVoice ? 15 : 0) +     // Voice data adds 15
          (hasBattlecard ? 15 : 0)  // Battlecard adds 15
        );
      }

      return { ...competitor, relevance_score: score };
    });

    // Sort by user_rank (if set) then by relevance_score
    const sorted = [...withScores].sort((a, b) => {
      // User rank takes priority
      if (a.user_rank !== undefined && b.user_rank !== undefined) {
        return a.user_rank - b.user_rank;
      }
      if (a.user_rank !== undefined) return -1;
      if (b.user_rank !== undefined) return 1;
      // Fall back to relevance score (higher is more important)
      return (b.relevance_score || 0) - (a.relevance_score || 0);
    });

    // Assign tiers
    return sorted.map((c, index) => ({
      ...c,
      tier: index < 3 ? 'top3' as const : index < 10 ? 'top10' as const : 'other' as const
    }));
  }, [competitors, customerVoiceByCompetitor, enhancedInsights]);

  // Group ranked competitors into tiers for display
  const { top3, top10, other } = useMemo(() => {
    const top3 = rankedCompetitors.filter(c => c.tier === 'top3');
    const top10 = rankedCompetitors.filter(c => c.tier === 'top10');
    const other = rankedCompetitors.filter(c => c.tier === 'other');
    return { top3, top10, other };
  }, [rankedCompetitors]);

  // Handle drag end - reorder competitors (must be after rankedCompetitors is defined)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the current order based on rankedCompetitors
    const oldIndex = rankedCompetitors.findIndex(c => c.id === active.id);
    const newIndex = rankedCompetitors.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(rankedCompetitors.map(c => c.id), oldIndex, newIndex);
      onReorderCompetitors?.(newOrder);
    }
  }, [rankedCompetitors, onReorderCompetitors]);

  const handleToggleAccordion = useCallback((competitorId: string) => {
    setExpandedCompetitorId(prev => prev === competitorId ? null : competitorId);
  }, []);

  // DEBUG: Log the maps to see if IDs match
  console.log('[CompetitorIntelligencePanel] Data maps:', {
    competitorIds: competitors.map(c => ({ id: c.id, name: c.name })),
    customerVoiceKeys: Array.from(customerVoiceByCompetitor.keys()),
    enhancedInsightsKeys: Array.from(enhancedInsights.keys()),
    voicesSize: customerVoiceByCompetitor.size,
    insightsSize: enhancedInsights.size
  });

  if (isLoading && competitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading competitor intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">
            Competitor Intelligence
          </h2>
          <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
            {competitors.length} competitors
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Competitor Button */}
          {onAddCompetitor && onIdentifyCompetitor && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isDiscovering || isScanning}
              className="gap-1.5 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Competitor
            </Button>
          )}
          {onDiscoverCompetitors && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDiscoverCompetitors()}
              disabled={isDiscovering || isScanning}
              className="gap-1.5 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isDiscovering || isScanning) ? 'animate-spin' : ''}`} />
              {isDiscovering ? 'Discovering...' : isScanning ? 'Scanning...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>

      {/* Market-Wide Gaps (collapsible) */}
      <MarketWideGapsSection
        gaps={gaps}
        competitors={competitors}
        onSelectGap={onSelectGap}
      />

      {/* Competitor Accordions */}
      {competitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            No Competitors Discovered
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 max-w-[200px] mb-4">
            Click "Refresh" to discover competitors in your market
          </p>
          {onDiscoverCompetitors && (
            <Button
              size="sm"
              onClick={() => onDiscoverCompetitors()}
              disabled={isDiscovering}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Discover Competitors
            </Button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rankedCompetitors.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6 pl-8">
              {/* Top 3 Competitors - Primary Threats */}
              {top3.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      Top 3 Competitors
                    </h3>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                      Primary Threats
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400">Drag to reorder</span>
                  </div>
                  {top3.map((competitor, index) => (
                    <SortableCompetitorItem
                      key={competitor.id}
                      competitor={competitor}
                      index={index}
                      gaps={gapsByCompetitor.get(competitor.id) || []}
                      insights={enhancedInsights.get(competitor.id)}
                      customerVoice={customerVoiceByCompetitor.get(competitor.id)}
                      brandName={brandName}
                      isExpanded={expandedCompetitorId === competitor.id}
                      onToggle={() => handleToggleAccordion(competitor.id)}
                      onSelectGap={onSelectGap}
                      onRemove={onRemoveCompetitor ? () => onRemoveCompetitor(competitor.id) : undefined}
                      onRescan={onRescanCompetitor ? () => onRescanCompetitor(competitor.id) : undefined}
                      showRankBadge={true}
                      rankBadgeColor="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                    />
                  ))}
                </div>
              )}

              {/* Positions 4-10 - Secondary Competitors */}
              {top10.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Top 4-10
                    </h3>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Monitor Closely
                    </span>
                  </div>
                  {top10.map((competitor, index) => (
                    <SortableCompetitorItem
                      key={competitor.id}
                      competitor={competitor}
                      index={index + 3}
                      gaps={gapsByCompetitor.get(competitor.id) || []}
                      insights={enhancedInsights.get(competitor.id)}
                      customerVoice={customerVoiceByCompetitor.get(competitor.id)}
                      brandName={brandName}
                      isExpanded={expandedCompetitorId === competitor.id}
                      onToggle={() => handleToggleAccordion(competitor.id)}
                      onSelectGap={onSelectGap}
                      onRemove={onRemoveCompetitor ? () => onRemoveCompetitor(competitor.id) : undefined}
                      onRescan={onRescanCompetitor ? () => onRescanCompetitor(competitor.id) : undefined}
                      showRankBadge={true}
                      rankBadgeColor="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    />
                  ))}
                </div>
              )}

              {/* Other Competitors */}
              {other.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Other ({other.length})
                    </h3>
                  </div>
                  {other.map((competitor, index) => (
                    <SortableCompetitorItem
                      key={competitor.id}
                      competitor={competitor}
                      index={index + 10}
                      gaps={gapsByCompetitor.get(competitor.id) || []}
                      insights={enhancedInsights.get(competitor.id)}
                      customerVoice={customerVoiceByCompetitor.get(competitor.id)}
                      brandName={brandName}
                      isExpanded={expandedCompetitorId === competitor.id}
                      onToggle={() => handleToggleAccordion(competitor.id)}
                      onSelectGap={onSelectGap}
                      onRemove={onRemoveCompetitor ? () => onRemoveCompetitor(competitor.id) : undefined}
                      onRescan={onRescanCompetitor ? () => onRescanCompetitor(competitor.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Competitor Dialog */}
      {onAddCompetitor && onIdentifyCompetitor && (
        <AddCompetitorDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onIdentify={onIdentifyCompetitor}
          onAdd={onAddCompetitor}
        />
      )}
    </div>
  );
});

export default CompetitorIntelligencePanel;
