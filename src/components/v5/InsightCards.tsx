/**
 * Insight Card Components - V5 Standalone Version
 *
 * Expandable cards for displaying different insight types matching V4 design.
 * - TriggerCard: Psychological triggers with category, confidence, buying stage
 * - ProofCard: Social proof with quality score, type badge
 * - TrendCard: Trends with lifecycle stage, first-mover indicator
 * - CompetitorCard: Competitor gaps and opportunities
 * - LocalCard: Location-based insights
 * - WeatherCard: Weather-triggered opportunities
 *
 * Created: 2025-12-01
 */

import React, { memo } from 'react';
import {
  Heart,
  Target,
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  ThumbsUp,
  TrendingUp,
  TrendingDown,
  Star,
  Quote,
  MapPin,
  Cloud,
  Sparkles,
  MessageSquare,
  Award,
  ExternalLink,
} from 'lucide-react';
import { TriggerCardV4 } from './TriggerCardV4';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from '@/services/triggers/trigger-consolidation.service';

// ============================================================================
// DARK THEME SQUARE CARD BASE STYLES
// ============================================================================

/**
 * Common base class for dark theme compact insight cards.
 * Cards have minimum height for consistency but adapt to content.
 */
const DARK_CARD_BASE = 'flex flex-col rounded-lg border p-3 transition-all duration-200 cursor-pointer hover:brightness-110 min-h-[180px]';

// ============================================================================
// TYPES
// ============================================================================

export type InsightType = 'trigger' | 'proof' | 'trend' | 'competitor' | 'local' | 'weather';

// Base insight with all optional fields to handle loose data from API
export interface BaseInsight {
  id: string;
  type: InsightType;
  text: string;
  source?: string;
  sourceUrl?: string; // URL to the original source (for clickable links)
  timestamp?: string;
  // Common scores that may be present
  confidence?: number;
  urgency?: number;
  category?: string;
}

// All insight types now extend BaseInsight with OPTIONAL type-specific fields
// This allows rendering even when API data is incomplete
export interface TriggerInsight extends BaseInsight {
  type: 'trigger';
  category?: string; // Made optional, defaults to 'motivation'
  confidence?: number; // Made optional, defaults to 50
  buyingStage?: string;
  recencyDays?: number;
  isSurge?: boolean;
  competitorMention?: string;
}

export interface ProofInsight extends BaseInsight {
  type: 'proof';
  proofType?: string; // Made optional, defaults to 'review'
  qualityScore?: number; // Made optional, defaults to 50
  value?: string;
  attribution?: string;
  verifiedCustomer?: boolean;
  recencyDays?: number;
}

export interface TrendInsight extends BaseInsight {
  type: 'trend';
  lifecycle?: string; // Made optional, defaults to 'emerging'
  primaryTrigger?: string;
  isFirstMover?: boolean;
  relevanceScore?: number; // Made optional, defaults to 50
  velocity?: number;
  sources?: string[];
  recencyDays?: number;
}

export interface CompetitorInsight extends BaseInsight {
  type: 'competitor';
  competitorName?: string; // Made optional
  gapType?: string; // Made optional
  opportunity?: string; // Made optional - will use text if missing
  sentiment?: string;
  strengthScore?: number;
}

export interface LocalInsight extends BaseInsight {
  type: 'local';
  localType?: string; // Made optional, defaults to 'event'
  timing?: string; // Made optional, defaults to 'upcoming'
  relevance?: number; // Made optional, defaults to 50
  localRelevance?: number;
  location?: string;
  date?: string;
  eventDate?: string;
}

export interface WeatherInsight extends BaseInsight {
  type: 'weather';
  weatherType?: string; // Made optional, defaults to 'forecast-alert'
  urgency?: number | string; // Can be number or string
  forecast?: string;
  temperature?: string;
  temp?: number;
}

export type Insight = TriggerInsight | ProofInsight | TrendInsight | CompetitorInsight | LocalInsight | WeatherInsight;

interface InsightCardProps {
  insight: Insight;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onUseInsight?: (insight: Insight) => void;
}

// ============================================================================
// V4 CARD CONVERSION HELPER
// ============================================================================

/**
 * Convert TriggerInsight to ConsolidatedTrigger for TriggerCardV4 rendering
 * This allows legacy TriggerInsight data to render in the new V4 card format
 */
function triggerInsightToConsolidatedTrigger(insight: TriggerInsight): ConsolidatedTrigger {
  const validCategories: TriggerCategory[] = ['fear', 'desire', 'pain-point', 'objection', 'motivation', 'trust', 'urgency'];
  const category = (validCategories.includes(insight.category as TriggerCategory)
    ? insight.category
    : 'motivation') as TriggerCategory;

  // Normalize confidence: could be 0-1 or 0-100, convert to 0-1
  const rawConfidence = insight.confidence ?? 50;
  const normalizedConfidence = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;
  // Clamp to 0-1 range
  const confidence = Math.max(0, Math.min(1, normalizedConfidence || 0.5));

  // Create a single evidence item from the insight
  const evidence: EvidenceItem[] = [{
    id: insight.id,
    source: insight.source || 'unknown',
    quote: insight.text,
    platform: insight.source || 'unknown',
    url: insight.sourceUrl || '',
    author: '',
    timestamp: insight.timestamp || new Date().toISOString(),
    sentiment: 'neutral' as const,
    confidence: Math.round(confidence * 100), // Store as 0-100 for evidence
    verifiedSourceId: undefined,
  }];

  return {
    id: insight.id,
    category,
    title: insight.text.slice(0, 100) + (insight.text.length > 100 ? '...' : ''),
    executiveSummary: insight.text,
    confidence, // Already 0-1
    evidenceCount: 1,
    evidence,
    uvpAlignments: [],
    isTimeSensitive: insight.isSurge || false,
    profileRelevance: 0.5,
    rawSourceIds: [insight.id],
    buyerJourneyStage: insight.buyingStage as any,
  };
}

// ============================================================================
// TRIGGER CATEGORY STYLING
// ============================================================================

// Dark theme category styles - more visible borders
const triggerCategoryStyles: Record<TriggerInsight['category'], {
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  ringColor: string;
}> = {
  fear: {
    color: 'text-red-400',
    bg: 'bg-red-950/80',
    border: 'border-red-700',
    icon: AlertTriangle,
    ringColor: 'ring-red-500',
  },
  desire: {
    color: 'text-pink-400',
    bg: 'bg-pink-950/80',
    border: 'border-pink-700',
    icon: Heart,
    ringColor: 'ring-pink-500',
  },
  'pain-point': {
    color: 'text-orange-400',
    bg: 'bg-orange-950/80',
    border: 'border-orange-700',
    icon: Target,
    ringColor: 'ring-orange-500',
  },
  objection: {
    color: 'text-amber-400',
    bg: 'bg-amber-950/80',
    border: 'border-amber-700',
    icon: Shield,
    ringColor: 'ring-amber-500',
  },
  motivation: {
    color: 'text-green-400',
    bg: 'bg-green-950/80',
    border: 'border-green-700',
    icon: Zap,
    ringColor: 'ring-green-500',
  },
  trust: {
    color: 'text-blue-400',
    bg: 'bg-blue-950/80',
    border: 'border-blue-700',
    icon: ThumbsUp,
    ringColor: 'ring-blue-500',
  },
  urgency: {
    color: 'text-purple-400',
    bg: 'bg-purple-950/80',
    border: 'border-purple-700',
    icon: Clock,
    ringColor: 'ring-purple-500',
  },
};


// ============================================================================
// TRIGGER CARD
// ============================================================================

export const TriggerCard = memo(function TriggerCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: TriggerInsight }) {
  // Use defaults for missing fields
  const category = (insight.category?.toLowerCase() || 'motivation') as keyof typeof triggerCategoryStyles;
  const style = triggerCategoryStyles[category] || triggerCategoryStyles.motivation;
  const IconComponent = style.icon;
  const confidence = insight.confidence ?? 50;

  return (
    <div
      className={`${DARK_CARD_BASE} ${style.bg} ${style.border} ${
        isSelected ? `ring-2 ${style.ringColor} ring-offset-1 ring-offset-gray-900` : ''
      }`}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Category Icon + Label Row */}
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <div className={`p-1 rounded ${style.bg}`}>
          <IconComponent className={`h-3.5 w-3.5 ${style.color}`} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
          {(insight.category || 'trigger').replace('-', ' ')}
        </span>
        {insight.isSurge && (
          <span className="text-[9px] bg-red-900/50 text-red-400 px-1 py-0.5 rounded font-medium flex items-center gap-0.5 border border-red-700/50">
            <TrendingUp className="w-2 h-2" /> Surge
          </span>
        )}
      </div>

      {/* Title - larger font, fills space */}
      <h3 className="text-sm font-semibold text-gray-100 line-clamp-4 flex-1 leading-snug">
        {insight.text}
      </h3>

      {/* Buying Stage if present */}
      {insight.buyingStage && (
        <span className="text-[10px] text-indigo-400 font-medium capitalize mt-1">
          {insight.buyingStage.replace('-', ' ')}
        </span>
      )}

      {/* Bottom Stats Row - pinned to bottom */}
      <div className="flex items-center justify-between text-[10px] mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0">
        <span className={`font-semibold ${confidence >= 70 ? 'text-green-400' : confidence >= 45 ? 'text-yellow-400' : 'text-gray-400'}`}>
          {confidence}%
        </span>
        {insight.source && (
          <span className="text-gray-500 truncate max-w-[60%]">
            {insight.source}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// PROOF CARD
// ============================================================================

const proofTypeStyles: Record<ProofInsight['proofType'], { icon: React.ElementType; color: string }> = {
  rating: { icon: Star, color: 'text-yellow-500' },
  testimonial: { icon: Quote, color: 'text-blue-500' },
  metric: { icon: TrendingUp, color: 'text-green-500' },
  certification: { icon: Award, color: 'text-purple-500' },
  review: { icon: MessageSquare, color: 'text-cyan-500' },
  press: { icon: ExternalLink, color: 'text-pink-500' },
  award: { icon: Award, color: 'text-amber-500' },
};

export const ProofCard = memo(function ProofCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: ProofInsight }) {
  // Use defaults for missing fields
  const proofType = (insight.proofType || 'review') as keyof typeof proofTypeStyles;
  const typeStyle = proofTypeStyles[proofType] || proofTypeStyles.review;
  const IconComponent = typeStyle.icon;
  const qualityScore = insight.qualityScore ?? 50;

  return (
    <div
      className={`${DARK_CARD_BASE} bg-emerald-950/80 border-emerald-700 ${
        isSelected ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-gray-900' : ''
      }`}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Type Icon + Label Row */}
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <div className="p-1 rounded bg-emerald-950/80">
          <IconComponent className={`h-3.5 w-3.5 ${typeStyle.color}`} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          {proofType}
        </span>
        {insight.verifiedCustomer && (
          <span className="text-[9px] bg-emerald-900/50 text-emerald-400 px-1 py-0.5 rounded font-medium border border-emerald-700/50">
            Verified
          </span>
        )}
      </div>

      {/* Quote - larger font, fills space */}
      <p className="text-sm text-gray-200 italic line-clamp-4 flex-1 leading-snug">
        "{insight.value || insight.text}"
      </p>

      {/* Attribution if present */}
      {insight.attribution && (
        <span className="text-[10px] text-gray-500 mt-1 truncate block">
          — {insight.attribution}
        </span>
      )}

      {/* Bottom Stats Row - pinned to bottom */}
      <div className="flex items-center justify-between text-[10px] mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0">
        <span className={`font-semibold ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 45 ? 'text-yellow-400' : 'text-gray-400'}`}>
          {qualityScore}%
        </span>
        {insight.source && (
          <span className="text-gray-500 truncate max-w-[60%]">
            {insight.source}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// TREND CARD
// ============================================================================

const lifecycleStyles: Record<TrendInsight['lifecycle'], { color: string; bg: string; icon: React.ElementType }> = {
  emerging: { color: 'text-green-400', bg: 'bg-green-900/30', icon: TrendingUp },
  peak: { color: 'text-blue-400', bg: 'bg-blue-900/30', icon: Sparkles },
  stable: { color: 'text-amber-400', bg: 'bg-amber-900/30', icon: Target },
  declining: { color: 'text-gray-400', bg: 'bg-gray-800', icon: TrendingDown },
};

export const TrendCard = memo(function TrendCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: TrendInsight }) {
  // Use defaults for missing fields
  const lifecycle = (insight.lifecycle || 'emerging') as keyof typeof lifecycleStyles;
  const lifecycleStyle = lifecycleStyles[lifecycle] || lifecycleStyles.emerging;
  const LifecycleIcon = lifecycleStyle.icon;
  const relevanceScore = insight.relevanceScore ?? 50;

  return (
    <div
      className={`${DARK_CARD_BASE} bg-blue-950/80 border-blue-700 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-900' : ''
      }`}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Lifecycle Icon + Label Row */}
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <div className="p-1 rounded bg-blue-950/80">
          <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${lifecycleStyle.color} flex items-center gap-1`}>
          <LifecycleIcon className="w-2.5 h-2.5" />
          {lifecycle}
        </span>
        {insight.isFirstMover && (
          <span className="text-[9px] bg-purple-900/50 text-purple-400 px-1 py-0.5 rounded font-medium border border-purple-700/50">
            First Mover
          </span>
        )}
      </div>

      {/* Title - larger font, fills space */}
      <h3 className="text-sm font-semibold text-gray-100 line-clamp-4 flex-1 leading-snug">
        {insight.text}
      </h3>

      {/* Primary Trigger if present */}
      {insight.primaryTrigger && (
        <span className="text-[10px] text-blue-400 font-medium capitalize mt-1">
          {insight.primaryTrigger}
        </span>
      )}

      {/* Bottom Stats Row - pinned to bottom */}
      <div className="flex items-center justify-between text-[10px] mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0">
        <span className={`font-semibold ${relevanceScore >= 70 ? 'text-green-400' : relevanceScore >= 45 ? 'text-yellow-400' : 'text-gray-400'}`}>
          {relevanceScore}%
        </span>
        {insight.sources && insight.sources.length > 0 && (
          <span className="text-gray-500">
            {insight.sources.length} src{insight.sources.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// COMPETITOR CARD
// ============================================================================

export const CompetitorCard = memo(function CompetitorCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: CompetitorInsight }) {
  // Use defaults for missing fields
  const competitorName = insight.competitorName || 'Competitor';
  const gapType = insight.gapType || 'gap';
  const opportunity = insight.opportunity || insight.text;

  const sentimentColors: Record<string, string> = {
    positive: 'text-green-400 bg-green-900/50 border-green-700/50',
    negative: 'text-red-400 bg-red-900/50 border-red-700/50',
    neutral: 'text-gray-400 bg-gray-800 border-gray-700/50',
  };
  const sentimentColor = sentimentColors[insight.sentiment || 'neutral'] || sentimentColors.neutral;

  return (
    <div
      className={`${DARK_CARD_BASE} bg-orange-950/80 border-orange-700 ${
        isSelected ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-gray-900' : ''
      }`}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Competitor Icon + Label Row */}
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <div className="p-1 rounded bg-orange-950/80">
          <Target className="h-3.5 w-3.5 text-orange-400" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 truncate">
          {competitorName}
        </span>
        <span className="text-[9px] bg-orange-900/50 text-orange-400 px-1 py-0.5 rounded font-medium capitalize border border-orange-700/50">
          {gapType}
        </span>
      </div>

      {/* Opportunity - larger font, fills space */}
      <h3 className="text-sm font-semibold text-gray-100 line-clamp-4 flex-1 leading-snug">
        {opportunity}
      </h3>

      {/* Bottom Row - pinned to bottom */}
      <div className="flex items-center justify-between text-[10px] mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0">
        {insight.sentiment && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${sentimentColor}`}>
            {insight.sentiment}
          </span>
        )}
        {insight.source && (
          <span className="text-gray-500 truncate max-w-[60%]">
            {insight.source}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// LOCAL CARD
// ============================================================================

const localTypeEmojis: Record<LocalInsight['localType'], string> = {
  event: '📅',
  news: '📰',
  community: '🏘️',
  school: '🎓',
  sports: '⚽',
  charity: '💝',
};

export const LocalCard = memo(function LocalCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: LocalInsight }) {
  // Use defaults for missing fields
  const localType = (insight.localType || 'event') as keyof typeof localTypeEmojis;
  const timing = insight.timing || 'upcoming';
  const relevance = insight.relevance ?? 50;

  const timingStyles: Record<string, string> = {
    upcoming: 'bg-green-900/50 text-green-400 border-green-700/50',
    ongoing: 'bg-blue-900/50 text-blue-400 border-blue-700/50',
    past: 'bg-gray-800 text-gray-500 border-gray-700/50',
  };
  const timingStyle = timingStyles[timing] || timingStyles.upcoming;

  return (
    <div
      className={`${DARK_CARD_BASE} bg-cyan-950/80 border-cyan-700 ${
        isSelected ? 'ring-2 ring-cyan-500 ring-offset-1 ring-offset-gray-900' : ''
      }`}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Type Icon + Label Row */}
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <div className="p-1 rounded bg-cyan-950/80 text-base">
          {localTypeEmojis[localType] || '📍'}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 capitalize">
          {localType}
        </span>
        <span className={`text-[9px] px-1 py-0.5 rounded font-medium border ${timingStyle}`}>
          {timing}
        </span>
      </div>

      {/* Text - larger font, fills space */}
      <h3 className="text-sm font-semibold text-gray-100 line-clamp-4 flex-1 leading-snug">
        {insight.text}
      </h3>

      {/* Location if present */}
      {insight.location && (
        <span className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          {insight.location}
        </span>
      )}

      {/* Bottom Stats Row - pinned to bottom */}
      <div className="flex items-center justify-between text-[10px] mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0">
        <span className={`font-semibold ${relevance >= 70 ? 'text-green-400' : relevance >= 45 ? 'text-yellow-400' : 'text-gray-400'}`}>
          {relevance}%
        </span>
        {insight.date && (
          <span className="text-gray-500 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {insight.date}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// WEATHER CARD
// ============================================================================

const weatherTypeIcons: Record<WeatherInsight['weatherType'], string> = {
  'heat-wave': '🔥',
  'cold-snap': '❄️',
  'storm': '⛈️',
  'precipitation': '🌧️',
  'seasonal': '🍂',
  'forecast-alert': '⚠️',
};

export const WeatherCard = memo(function WeatherCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: WeatherInsight }) {
  // Use defaults for missing fields
  const weatherType = (insight.weatherType || 'forecast-alert') as keyof typeof weatherTypeIcons;
  // Handle urgency as number or string
  const urgencyValue = typeof insight.urgency === 'number'
    ? (insight.urgency >= 80 ? 'critical' : insight.urgency >= 60 ? 'high' : insight.urgency >= 40 ? 'medium' : 'low')
    : (insight.urgency || 'medium');
  const urgencyNumber = typeof insight.urgency === 'number' ? insight.urgency : 50;

  const urgencyStyles: Record<string, string> = {
    critical: 'bg-red-900/50 text-red-400 border-red-700/50',
    high: 'bg-orange-900/50 text-orange-400 border-orange-700/50',
    medium: 'bg-amber-900/50 text-amber-400 border-amber-700/50',
    low: 'bg-gray-800 text-gray-400 border-gray-700/50',
  };
  const urgencyStyle = urgencyStyles[urgencyValue] || urgencyStyles.medium;

  return (
    <div
      className={`${DARK_CARD_BASE} bg-sky-950/80 border-sky-700 ${
        isSelected ? 'ring-2 ring-sky-500 ring-offset-1 ring-offset-gray-900' : ''
      }`}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Weather Icon + Label Row */}
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <div className="p-1 rounded bg-sky-950/80 text-base">
          {weatherTypeIcons[weatherType] || '🌤️'}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 capitalize">
          {weatherType.replace('-', ' ')}
        </span>
        <span className={`text-[9px] px-1 py-0.5 rounded font-medium border ${urgencyStyle}`}>
          {urgencyValue}
        </span>
      </div>

      {/* Text - larger font, fills space */}
      <h3 className="text-sm font-semibold text-gray-100 line-clamp-4 flex-1 leading-snug">
        {insight.text}
      </h3>

      {/* Temperature if present */}
      {insight.temperature && (
        <span className="text-[10px] text-sky-400 mt-1 flex items-center gap-1">
          <Cloud className="w-2.5 h-2.5" />
          {insight.temperature}
        </span>
      )}

      {/* Bottom Stats Row - pinned to bottom */}
      <div className="flex items-center justify-between text-[10px] mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0">
        <span className={`font-semibold ${urgencyNumber >= 70 ? 'text-red-400' : urgencyNumber >= 45 ? 'text-orange-400' : 'text-gray-400'}`}>
          {urgencyNumber}%
        </span>
        {insight.forecast && (
          <span className="text-gray-500 truncate max-w-[60%]">
            {insight.forecast}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// GENERIC INSIGHT CARD (Routes to specific card type)
// ============================================================================

export const InsightCard = memo(function InsightCard(props: InsightCardProps) {
  const { insight } = props;

  switch (insight.type) {
    case 'trigger':
      // Use TriggerCardV4 for consistent V4 card styling with source verification
      const consolidatedTrigger = triggerInsightToConsolidatedTrigger(insight as TriggerInsight);
      return <TriggerCardV4 trigger={consolidatedTrigger} variant="default" />;
    case 'proof':
      return <ProofCard {...props} insight={insight as ProofInsight} />;
    case 'trend':
      return <TrendCard {...props} insight={insight as TrendInsight} />;
    case 'competitor':
      return <CompetitorCard {...props} insight={insight as CompetitorInsight} />;
    case 'local':
      return <LocalCard {...props} insight={insight as LocalInsight} />;
    case 'weather':
      return <WeatherCard {...props} insight={insight as WeatherInsight} />;
    default:
      return null;
  }
});

export default InsightCard;
