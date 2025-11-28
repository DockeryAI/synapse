/**
 * V4 Power Mode Panel
 *
 * Matches V3 PowerMode layout exactly:
 * - Two columns: InsightGrid (80%) + YourMix preview (20%)
 * - Templates dropdown that auto-selects insights
 * - Filter tabs for insight types
 * - Click to select insights (no drag and drop)
 * - Live preview synthesizes with V4 engine
 *
 * Created: 2025-11-27
 * Updated: 2025-11-27 - Matched to V3 PowerMode layout
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, memo, startTransition, useDeferredValue } from 'react';
// Removed react-window Grid - using CSS grid for proper expansion handling
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Target,
  Heart,
  Lightbulb,
  Flame,
  MapPin,
  DollarSign,
  Rocket,
  BookOpen,
  Scale,
  Shield,
  Clock,
  BookOpenText,
  Layers,
  Users,
  HelpCircle,
  Compass,
  TrendingUp,
  RefreshCw,
  Brain,
  FileText,
  Mail,
  Newspaper,
  Globe,
  Loader2,
  AlertCircle,
  MessageSquare,
  Link2,
  ExternalLink,
  Quote,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useV4ContentGeneration } from '@/hooks/useV4ContentGeneration';
import { dashboardPreloader } from '@/services/dashboard/dashboard-preloader.service';
import { trueProgressiveBuilder } from '@/services/intelligence/deepcontext-builder-progressive.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type {
  GeneratedContent,
  PsychologyFramework,
  FunnelStage
} from '@/services/v4/types';

// ============================================================================
// TYPES
// ============================================================================

type InsightType = 'customer' | 'market' | 'competition' | 'local' | 'opportunity';
type FilterType = 'all' | InsightType;

interface InsightSource {
  source: string;
  quote?: string;
  timestamp?: string;
  url?: string;
  author?: string;
  subreddit?: string;
  platform?: string;
}

interface InsightCard {
  id: string;
  type: InsightType;
  title: string;
  category: string;
  confidence: number;
  isTimeSensitive: boolean;
  description: string;
  actionableInsight?: string;
  evidence?: string[];
  sources?: InsightSource[];
  rawData?: any;
  uvpAlignment?: {
    component: 'target_customer' | 'key_benefit' | 'transformation' | 'unique_solution';
    matchScore: number;
  };
  contentPillars?: string[];
  correlatedSources?: string[];
}

// Source name mapper - convert API names to user-friendly names
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'apify-reddit': 'Reddit',
  'reddit': 'Reddit',
  'apify-twitter': 'Twitter/X',
  'twitter': 'Twitter/X',
  'apify-quora': 'Quora',
  'quora': 'Quora',
  'apify-g2': 'G2 Reviews',
  'g2': 'G2 Reviews',
  'apify-trustpilot': 'TrustPilot',
  'trustpilot': 'TrustPilot',
  'outscraper-reviews': 'Google Reviews',
  'google-reviews': 'Google Reviews',
  'perplexity': 'Web Research',
  'perplexity-api': 'Web Research',
  'serper': 'Google Search',
  'serper-api': 'Google Search',
  'semrush': 'SEO Analytics',
  'semrush-api': 'SEO Analytics',
  'youtube': 'YouTube',
  'youtube-api': 'YouTube',
  'linkedin': 'LinkedIn',
  'linkedin-api': 'LinkedIn',
  'news': 'News Articles',
  'website': 'Website Analysis',
  'website-analyzer': 'Website Analysis',
  'ai-synthesis': 'AI Analysis',
  'AI Synthesis': 'AI Analysis',
  'Pattern Recognition': 'Pattern Analysis',
  'Seasonal Calendar': 'Seasonal Trends',
  'Market Gap Analysis': 'Market Analysis',
  'Cultural Trends Analysis': 'Cultural Trends',
  'Local Events Data': 'Local Events',
};

function getDisplaySourceName(source: string): string {
  const lowerSource = source.toLowerCase();
  return SOURCE_DISPLAY_NAMES[lowerSource] || SOURCE_DISPLAY_NAMES[source] || source;
}

interface InsightRecipe {
  id: string;
  name: string;
  description: string;
  emoji: string;
  insightTypes: InsightType[];
  minInsights: number;
  maxInsights: number;
  primaryFramework: PsychologyFramework;
  compatibleTemplates: string[];
}

interface V4PowerModePanelProps {
  uvp: CompleteUVP;
  brandId?: string;
  context?: DeepContext;  // Optional - will load if not provided
  onContentGenerated?: (content: GeneratedContent) => void;
  onSaveToCalendar?: (content: GeneratedContent) => void;
}

// ============================================================================
// TEMPLATE RECIPES (Same as V3)
// ============================================================================

const TEMPLATE_RECIPES: InsightRecipe[] = [
  {
    id: 'authority',
    name: 'Authority Builder',
    description: 'Build credibility and expertise with data-driven content',
    emoji: '🎯',
    insightTypes: ['market', 'competition', 'opportunity'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'AIDA',
    compatibleTemplates: ['Authority Builder', 'Education First', 'Comparison Campaign'],
  },
  {
    id: 'trust',
    name: 'Trust Builder',
    description: 'Build customer confidence with social proof and stories',
    emoji: '🤝',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'StoryBrand',
    compatibleTemplates: ['Social Proof', 'Trust Ladder', 'Hero\'s Journey'],
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Address pain points directly with PAS framework',
    emoji: '💡',
    insightTypes: ['customer', 'competition', 'opportunity'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'PAS',
    compatibleTemplates: ['PAS Series', 'BAB Campaign', 'Quick Win'],
  },
  {
    id: 'viral',
    name: 'Viral Content',
    description: 'Trending and shareable content that spreads',
    emoji: '🚀',
    insightTypes: ['market', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'CuriosityGap',
    compatibleTemplates: ['Seasonal Urgency', 'Scarcity Sequence', 'Product Launch'],
  },
  {
    id: 'local',
    name: 'Local Champion',
    description: 'Community-focused content with local relevance',
    emoji: '📍',
    insightTypes: ['local', 'customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'BAB',
    compatibleTemplates: ['Social Proof', 'Quick Win', 'PAS Series'],
  },
  {
    id: 'conversion',
    name: 'Conversion Driver',
    description: 'Direct response content optimized for action',
    emoji: '💰',
    insightTypes: ['customer', 'opportunity', 'competition'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'AIDA',
    compatibleTemplates: ['Value Stack', 'Scarcity Sequence', 'Objection Crusher'],
  },
  {
    id: 'launch',
    name: 'Product Launch',
    description: 'Create buzz and anticipation for new products',
    emoji: '🎉',
    insightTypes: ['market', 'customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'AIDA',
    compatibleTemplates: ['Product Launch', 'RACE Journey', 'Value Stack'],
  },
  {
    id: 'education',
    name: 'Education First',
    description: 'Lead with value and educate your audience',
    emoji: '📚',
    insightTypes: ['market', 'customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 6,
    primaryFramework: 'PAS',
    compatibleTemplates: ['Education First', 'Authority Builder', 'Trust Ladder'],
  },
  {
    id: 'comparison',
    name: 'Competitive Edge',
    description: 'Position against competitors with clear differentiation',
    emoji: '⚖️',
    insightTypes: ['competition', 'market', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'AIDA',
    compatibleTemplates: ['Comparison Campaign', 'Authority Builder', 'Objection Crusher'],
  },
  {
    id: 'quick-win',
    name: 'Quick Wins',
    description: 'Fast results with minimal friction',
    emoji: '⚡',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 1,
    maxInsights: 4,
    primaryFramework: 'BAB',
    compatibleTemplates: ['Quick Win', 'PAS Series', 'BAB Campaign'],
  },
  {
    id: 'social-proof',
    name: 'Social Proof Engine',
    description: 'Leverage testimonials and case studies',
    emoji: '👥',
    insightTypes: ['customer', 'local'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'SocialProof',
    compatibleTemplates: ['Social Proof', 'Trust Ladder', 'Authority Builder'],
  },
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Hook attention with knowledge gaps',
    emoji: '🤔',
    insightTypes: ['market', 'opportunity', 'customer'],
    minInsights: 2,
    maxInsights: 4,
    primaryFramework: 'CuriosityGap',
    compatibleTemplates: ['RACE Journey', 'Education First', 'Authority Builder'],
  },
];

// ============================================================================
// INSIGHT TYPE CONFIG
// ============================================================================

const typeConfig: Record<InsightType, { label: string; color: string; bgColor: string }> = {
  customer: { label: 'Customer', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  market: { label: 'Market', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  competition: { label: 'Competition', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  local: { label: 'Local', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  opportunity: { label: 'Opportunity', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
};

// ============================================================================
// HELPER FUNCTIONS (Same as V3)
// ============================================================================

function extractPlatform(sourceText: string): string {
  const platforms = ['Reddit', 'Google Reviews', 'YouTube', 'LinkedIn', 'Twitter', 'Perplexity', 'News'];
  for (const p of platforms) {
    if (sourceText.toLowerCase().includes(p.toLowerCase())) return p;
  }
  return sourceText.split(/[,;]/)[0].trim() || 'Analysis';
}

function extractQuote(evidence: string | string[] | undefined): string | undefined {
  if (!evidence) return undefined;
  const text = Array.isArray(evidence) ? evidence[0] : evidence;
  if (!text) return undefined;
  const quoteMatch = text.match(/"([^"]+)"|'([^']+)'/);
  return quoteMatch ? quoteMatch[1] || quoteMatch[2] : undefined;
}

function formatTimestamp(ts: string | undefined): string | undefined {
  if (!ts) return undefined;
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return ts;
  }
}

// ============================================================================
// INSIGHT MEMOIZATION CACHE - Prevents recreating objects for unchanged data
// ============================================================================

// Cache to store previously created insight objects
const insightCache = new Map<string, InsightCard>();

// Simple hash function for cache key generation
function hashInsightData(id: string, data: any): string {
  const dataStr = JSON.stringify(data || {});
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${id}-${hash}`;
}

// Get or create cached insight
function getCachedInsight(id: string, rawData: any, createFn: () => InsightCard): InsightCard {
  const cacheKey = hashInsightData(id, rawData);
  const cached = insightCache.get(cacheKey);
  if (cached) return cached;

  const insight = createFn();
  insightCache.set(cacheKey, insight);

  // Limit cache size to prevent memory leaks
  if (insightCache.size > 500) {
    const firstKey = insightCache.keys().next().value;
    if (firstKey) insightCache.delete(firstKey);
  }

  return insight;
}

// ============================================================================
// FREEZE FIX: Yield helper to break up long tasks
// This prevents main thread blocking by yielding control back to the browser
// ============================================================================

const yieldToMain = (): Promise<void> => {
  return new Promise(resolve => {
    // Use scheduler.yield() if available (Chrome 115+), fall back to setTimeout
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
      (window as any).scheduler.yield().then(resolve);
    } else if (typeof requestIdleCallback !== 'undefined') {
      // requestIdleCallback is better than setTimeout for yielding
      requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      // Fallback to setTimeout(0) which still yields to event loop
      setTimeout(resolve, 0);
    }
  });
};

// Track extraction to prevent concurrent runs
let extractionInProgress = false;
let extractionAborted = false;
let currentExtractionId = 0;

// ============================================================================
// EXTRACT INSIGHTS FROM DEEPCONTEXT - ASYNC CHUNKED VERSION
// Yields to main thread between each section to prevent freeze
// ============================================================================

async function extractInsightsFromDeepContextAsync(
  context: DeepContext,
  uvp: CompleteUVP,
  onProgress?: (insights: InsightCard[], section: string) => void
): Promise<InsightCard[]> {
  const extractionId = ++currentExtractionId;

  // DEBUG: Log what data we're receiving
  console.log('[extractInsightsAsync] INPUT DATA COUNTS:', {
    trends: context?.industry?.trends?.length || 0,
    unarticulated: context?.customerPsychology?.unarticulated?.length || 0,
    emotional: context?.customerPsychology?.emotional?.length || 0,
    blindSpots: context?.competitiveIntel?.blindSpots?.length || 0,
    opportunities: context?.competitiveIntel?.opportunities?.length || 0,
    rawDataPoints: context?.rawDataPoints?.length || 0,
    correlatedInsights: context?.correlatedInsights?.length || 0,
    breakthroughs: context?.synthesis?.breakthroughs?.length || 0,
    keyInsights: context?.synthesis?.keyInsights?.length || 0,
    hiddenPatterns: context?.synthesis?.hiddenPatterns?.length || 0,
  });

  // If extraction is already in progress, abort and return early
  if (extractionInProgress) {
    console.log('[extractInsights] Aborting previous extraction');
    extractionAborted = true;
    await yieldToMain(); // Let previous extraction finish its current chunk
  }

  extractionInProgress = true;
  extractionAborted = false;

  const insights: InsightCard[] = [];

  const checkAborted = () => {
    if (extractionAborted || currentExtractionId !== extractionId) {
      throw new Error('EXTRACTION_ABORTED');
    }
  };

  try {
    // ============================================================================
    // CHUNK 1: INDUSTRY TRENDS
    // ============================================================================
    context.industry?.trends?.forEach((trend: any, idx: number) => {
      const insightId = `trend-${idx}`;
      insights.push(getCachedInsight(insightId, trend, () => {
        const title = (trend.trend || '').split(/[,.]|and |but /)[0].trim() || 'Market Trend';
        const evidenceArray = trend.evidence
          ? (Array.isArray(trend.evidence) ? trend.evidence : trend.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
          : [];

        return {
          id: insightId,
          type: 'market',
          title,
          category: 'Market Trend',
          confidence: trend.strength || 0.75,
          isTimeSensitive: false,
          description: trend.trend || 'Industry trend',
          evidence: evidenceArray,
          sources: [{
            source: extractPlatform(trend.source || 'Industry Analysis'),
            quote: extractQuote(trend.evidence),
            timestamp: formatTimestamp(trend.timestamp),
          }],
          rawData: trend,
        };
      }));
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'trends');

    // ============================================================================
    // CHUNK 2: CUSTOMER PSYCHOLOGY - UNARTICULATED NEEDS
    // ============================================================================
    context.customerPsychology?.unarticulated?.forEach((need: any, idx: number) => {
      const title = (need.need || '').split(/[,.]|and |but /)[0].trim() || 'Customer Need';
      const evidenceArray = need.evidence
        ? (Array.isArray(need.evidence) ? need.evidence : need.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      insights.push({
        id: `customer-need-${idx}`,
        type: 'customer',
        title,
        category: 'Customer Need',
        confidence: need.confidence || 0.8,
        isTimeSensitive: false,
        description: need.need || 'Customer need',
        actionableInsight: need.marketingAngle,
        evidence: evidenceArray,
        sources: [{
          source: extractPlatform(need.source || 'Customer Research'),
          quote: extractQuote(need.evidence) || need.emotionalDriver,
          timestamp: formatTimestamp(need.timestamp),
        }],
        rawData: need,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'customer-needs');

    // ============================================================================
    // CHUNK 3: CUSTOMER PSYCHOLOGY - EMOTIONAL TRIGGERS
    // ============================================================================
    context.customerPsychology?.emotional?.forEach((trigger: any, idx: number) => {
      const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
      const title = triggerText?.split(/[,.]|and |but /)[0].trim() || 'Emotional Trigger';

      insights.push({
        id: `customer-trigger-${idx}`,
        type: 'customer',
        title,
        category: 'Emotional Trigger',
        confidence: typeof trigger === 'object' ? trigger.strength : 0.85,
        isTimeSensitive: false,
        description: triggerText,
        sources: [{
          source: typeof trigger === 'object' && trigger.context
            ? trigger.context.replace(/^From\s+/i, '').trim()
            : 'Customer Psychology',
          quote: typeof trigger === 'object' ? trigger.leverage : undefined,
        }],
        rawData: trigger,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'triggers');

    // ============================================================================
    // CHUNK 4: COMPETITIVE INTELLIGENCE - BLIND SPOTS
    // ============================================================================
    context.competitiveIntel?.blindSpots?.forEach((blindspot: any, idx: number) => {
      const title = (blindspot.topic || '').split(/[,.]|and |but /)[0].trim() || 'Competitor Blindspot';
      const evidenceArray = blindspot.evidence
        ? (Array.isArray(blindspot.evidence) ? blindspot.evidence : blindspot.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      insights.push({
        id: `competition-blindspot-${idx}`,
        type: 'competition',
        title,
        category: 'Competitor Blindspot',
        confidence: blindspot.opportunityScore ? blindspot.opportunityScore / 100 : 0.8,
        isTimeSensitive: false,
        description: blindspot.topic || 'Competitive gap',
        evidence: evidenceArray,
        actionableInsight: blindspot.actionableInsight,
        sources: [{
          source: extractPlatform(blindspot.source || 'Competitive Analysis'),
          quote: extractQuote(blindspot.evidence) || blindspot.reasoning,
          timestamp: formatTimestamp(blindspot.timestamp),
        }],
        rawData: blindspot,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'blindspots');

    // ============================================================================
    // CHUNK 5: COMPETITIVE INTELLIGENCE - MARKET GAPS/OPPORTUNITIES
    // ============================================================================
    context.competitiveIntel?.opportunities?.forEach((gap: any, idx: number) => {
      const title = (gap.gap || '').split(/[,.]|and |but /)[0].trim() || 'Market Gap';
      const evidenceArray = gap.evidence
        ? (Array.isArray(gap.evidence) ? gap.evidence : gap.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      insights.push({
        id: `opportunity-gap-${idx}`,
        type: 'opportunity',
        title,
        category: 'Market Gap',
        confidence: gap.confidence || 0.85,
        isTimeSensitive: false,
        description: gap.gap || 'Market opportunity',
        evidence: evidenceArray,
        actionableInsight: gap.positioning,
        sources: [{
          source: extractPlatform(gap.source || 'Market Gap Analysis'),
          quote: extractQuote(gap.evidence),
          timestamp: formatTimestamp(gap.timestamp),
        }],
        rawData: gap,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'opportunities');

    // ============================================================================
    // CHUNK 6: LOCAL INTELLIGENCE - EVENTS
    // ============================================================================
    (context.realTimeCultural?.events as any[])?.forEach((event: any, idx: number) => {
      const eventName = event.name || event.title || String(event);
      const title = eventName.split(/[,.]|during |in /)[0].trim();

      insights.push({
        id: `local-event-${idx}`,
        type: 'local',
        title,
        category: 'Local Event',
        confidence: 0.85,
        isTimeSensitive: true,
        description: eventName,
        sources: [{
          source: 'Local Events Data',
          timestamp: event.date,
        }],
        rawData: event,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'events');

    // ============================================================================
    // CHUNK 7: LOCAL INTELLIGENCE - CULTURAL MOMENTS
    // ============================================================================
    (context.realTimeCultural?.moments as any[])?.forEach((moment: any, idx: number) => {
      const momentText = typeof moment === 'string' ? moment : moment.description || 'Cultural Moment';
      const title = momentText.split(/[,.]|where |during /)[0].trim();

      insights.push({
        id: `local-moment-${idx}`,
        type: 'local',
        title,
        category: 'Cultural Moment',
        confidence: 0.8,
        isTimeSensitive: true,
        description: momentText,
        sources: [{
          source: 'Cultural Trends Analysis',
        }],
        rawData: moment,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'moments');

    // ============================================================================
    // CHUNK 8: SYNTHESIS - KEY INSIGHTS
    // ============================================================================
    context.synthesis?.keyInsights?.forEach((insight: any, idx: number) => {
      if (typeof insight === 'string') {
        const title = insight.split(/[,.]|that |which /)[0].trim();

        insights.push({
          id: `synthesis-${idx}`,
          type: 'opportunity',
          title,
          category: 'Key Insight',
          confidence: context.synthesis?.confidenceLevel || 0.8,
          isTimeSensitive: false,
          description: insight,
          sources: [{
            source: 'AI Synthesis',
          }],
        });
      }
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'synthesis');

    // ============================================================================
    // CHUNK 9: SYNTHESIS - HIDDEN PATTERNS
    // ============================================================================
    context.synthesis?.hiddenPatterns?.forEach((pattern: any, idx: number) => {
      const title = pattern.pattern?.split(/[,.]|where |when /)[0].trim() || 'Hidden Pattern';

      insights.push({
        id: `pattern-${idx}`,
        type: 'opportunity',
        title,
        category: `${pattern.type?.charAt(0).toUpperCase() + pattern.type?.slice(1)} Pattern`,
        confidence: pattern.confidence || 0.8,
        isTimeSensitive: false,
        description: pattern.pattern,
        evidence: pattern.evidence || [],
        sources: [{
          source: 'Pattern Recognition',
          quote: pattern.implication,
        }],
        rawData: pattern,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'patterns');

    // ============================================================================
    // CHUNK 10: RAW DATA POINTS (largest section - process in smaller batches)
    // ============================================================================
    const rawDataPoints = context.rawDataPoints || [];
    const BATCH_SIZE = 25; // Process 25 items at a time

    for (let i = 0; i < rawDataPoints.length; i += BATCH_SIZE) {
      const batch = rawDataPoints.slice(i, i + BATCH_SIZE);

      batch.forEach((dp: any, batchIdx: number) => {
        const idx = i + batchIdx;
        const typeMap: Record<string, InsightType> = {
          'pain_point': 'customer',
          'unarticulated_need': 'customer',
          'customer_trigger': 'customer',
          'trending_topic': 'market',
          'competitive_gap': 'competition',
          'timing': 'local',
          'market_signal': 'market',
          'opportunity': 'opportunity',
        };

        const insightType: InsightType = typeMap[dp.type] || 'opportunity';

        let category = 'Intelligence Data';
        if (dp.metadata?.triggerCategory) {
          const triggerCategoryMap: Record<string, string> = {
            'pain_point': 'Pain Point',
            'fear': 'Fear-Based Trigger',
            'aspiration': 'Aspiration',
            'opportunity': 'Opportunity Signal',
            'social_proof': 'Social Proof',
            'urgency': 'Urgent Need',
          };
          category = triggerCategoryMap[dp.metadata.triggerCategory] || 'Intelligence Data';
        } else if (dp.source) {
          category = `${dp.source.charAt(0).toUpperCase() + dp.source.slice(1)} Data`;
        }

        const content = dp.content || '';
        const title = content.length > 60
          ? content.substring(0, 60).split(/[,.]|that |which /)[0].trim() + '...'
          : content.split(/[,.]|that |which /)[0].trim();

        if (title.length < 3) return;

        insights.push({
          id: `raw-${dp.id || idx}`,
          type: insightType,
          title,
          category,
          confidence: dp.metadata?.confidence || 0.75,
          isTimeSensitive: dp.metadata?.urgency === 'immediate',
          description: content,
          evidence: dp.metadata?.uvpMatch ? [`Validates UVP: ${dp.metadata.uvpMatch}`] : [],
          sources: [{
            source: extractPlatform(dp.source || 'Data Analysis'),
            quote: dp.metadata?.emotion ? `Detected emotion: ${dp.metadata.emotion}` : undefined,
          }],
          rawData: dp,
        });
      });

      // Yield after each batch to prevent blocking
      checkAborted();
      await yieldToMain();
    }
    console.log(`[extractInsightsAsync] After raw-data: ${insights.length} total insights (input had ${rawDataPoints.length} raw data points)`);
    onProgress?.(insights, 'raw-data');

    // ============================================================================
    // CHUNK 11: CORRELATED INSIGHTS
    // ============================================================================
    const correlatedCount = context.correlatedInsights?.length || 0;
    context.correlatedInsights?.forEach((ci: any, idx: number) => {
      const typeMap: Record<string, InsightType> = {
        'validated_pain': 'customer',
        'psychological_breakthrough': 'customer',
        'competitive_gap': 'competition',
        'timing_opportunity': 'local',
        'hidden_pattern': 'opportunity',
      };

      const insightType: InsightType = typeMap[ci.type] || 'opportunity';

      const categoryMap: Record<string, string> = {
        'validated_pain': '✓ Validated Pain Point',
        'psychological_breakthrough': '🧠 Psychological Breakthrough',
        'competitive_gap': '🎯 Competitive Gap',
        'timing_opportunity': '⏰ Timing Opportunity',
        'hidden_pattern': '🔍 Hidden Pattern',
      };
      const category = categoryMap[ci.type] || 'Correlated Insight';

      const evidenceList = ci.sources?.map((s: any) =>
        `${s.source}: "${s.content?.substring(0, 80)}..." (${Math.round(s.confidence * 100)}% confidence)`
      ) || [];

      insights.push({
        id: `correlated-${ci.id || idx}`,
        type: insightType,
        title: ci.title,
        category,
        confidence: ci.breakthroughScore / 100,
        isTimeSensitive: ci.timeSensitive,
        description: ci.description,
        actionableInsight: ci.actionableInsight,
        evidence: evidenceList,
        sources: ci.sources?.map((s: any) => ({
          source: extractPlatform(s.source),
          quote: s.content?.substring(0, 100),
        })) || [],
        rawData: ci,
      });
    });

    checkAborted();
    await yieldToMain();
    console.log(`[extractInsightsAsync] After correlated: ${insights.length} total insights (input had ${correlatedCount} correlated)`);
    onProgress?.(insights, 'correlated');

    // ============================================================================
    // CHUNK 12: BREAKTHROUGH OPPORTUNITIES
    // ============================================================================
    const breakthroughCount = context.synthesis?.breakthroughs?.length || 0;
    context.synthesis?.breakthroughs?.forEach((bt: any, idx: number) => {
      let insightType: InsightType = 'opportunity';
      if (bt.uvpValidation) {
        insightType = 'customer';
      } else if (bt.competitive) {
        insightType = 'competition';
      } else if (bt.timing?.isTimeSensitive) {
        insightType = 'local';
      }

      const stars = '⭐'.repeat(bt.confidenceStars || 0);
      const connectionBadge = bt.connectionType === '5-way' ? '🔥 5-WAY' :
                              bt.connectionType === '4-way' ? '💎 4-WAY' :
                              bt.connectionType === '3-way' ? '✨ 3-WAY' : '';
      const category = `${connectionBadge} Breakthrough ${stars}`;

      const evidenceList: string[] = [];
      if (bt.uvpValidation) {
        evidenceList.push(`✓ UVP VALIDATED: "${bt.uvpValidation.painPoint}" (${bt.uvpValidation.matchScore}% match)`);
        bt.uvpValidation.evidence?.forEach((e: string) => evidenceList.push(`  └ ${e}`));
      }
      if (bt.psychology) {
        evidenceList.push(`Psychology: ${bt.psychology.triggerCategory} trigger, ${bt.psychology.emotion} emotion`);
      }
      evidenceList.push(`Sources: ${bt.sources?.join(', ')} (${bt.sources?.length || 0} independent sources)`);
      if (bt.timing?.isTimeSensitive) {
        evidenceList.push(`⏰ TIME SENSITIVE: ${bt.timing.reason || 'Act now'}`);
      }
      if (bt.competitive?.gap) {
        evidenceList.push(`🎯 COMPETITOR GAP: ${bt.competitive.gap}`);
      }
      if (bt.eqScore) {
        evidenceList.push(`EQ Score: ${bt.eqScore}/100 | Urgency: ${bt.psychology?.urgency?.toUpperCase() || 'NORMAL'}`);
      }

      insights.push({
        id: `breakthrough-${bt.id || idx}`,
        type: insightType,
        title: bt.title,
        category,
        confidence: (bt.score || 80) / 100,
        isTimeSensitive: bt.timing?.isTimeSensitive || bt.psychology?.urgency === 'critical',
        description: bt.hook,
        actionableInsight: bt.actionPlan,
        evidence: evidenceList,
        sources: bt.sources?.map((s: string) => ({
          source: extractPlatform(s),
        })) || [],
        rawData: bt,
      });
    });

    checkAborted();
    await yieldToMain();
    console.log(`[extractInsightsAsync] After breakthroughs: ${insights.length} total insights (input had ${breakthroughCount} breakthroughs)`);
    onProgress?.(insights, 'breakthroughs');

    // ============================================================================
    // CHUNK 13: UVP-BASED INSIGHTS (Always include)
    // ============================================================================
    if (uvp) {
      if (uvp.targetCustomer) {
        insights.push({
          id: 'uvp-target',
          type: 'customer',
          title: `Target: ${uvp.targetCustomer.industry || 'Ideal Customer'}`,
          category: 'Customer Profile',
          confidence: 0.95,
          isTimeSensitive: false,
          description: uvp.targetCustomer.statement || 'Your ideal customer from UVP',
          sources: [{ source: 'UVP Analysis' }],
        });
      }

      // Transformation insight removed - focusing on Emotional/Functional Drivers instead

      if (uvp.keyBenefit) {
        const benefitMetrics = uvp.keyBenefit.metrics?.map(m => `${m.metric}: ${m.value}`).join(', ');
        insights.push({
          id: 'uvp-benefit',
          type: 'opportunity',
          title: 'Key Differentiator',
          category: 'Value Proposition',
          confidence: 0.92,
          isTimeSensitive: false,
          description: `${uvp.keyBenefit.statement || 'Your unique value'}${benefitMetrics ? `. Proof: ${benefitMetrics}` : ''}`,
          sources: [{ source: 'UVP Analysis' }],
        });
      }

      if (uvp.uniqueSolution) {
        insights.push({
          id: 'uvp-solution',
          type: 'competition',
          title: 'Unique Approach',
          category: 'Competitive Edge',
          confidence: 0.88,
          isTimeSensitive: false,
          description: uvp.uniqueSolution.statement || 'Your unique solution',
          sources: [{ source: 'UVP Framework' }],
        });
      }
    }

    console.log(`[extractInsightsAsync] Complete: ${insights.length} insights extracted without blocking`);
    return insights;

  } catch (error) {
    if ((error as Error).message === 'EXTRACTION_ABORTED') {
      console.log('[extractInsightsAsync] Extraction aborted - newer extraction started');
      return [];
    }
    throw error;
  } finally {
    extractionInProgress = false;
  }
}

// ============================================================================
// LEGACY SYNC VERSION - DEPRECATED, use async version
// Kept for fallback compatibility only
// ============================================================================

function extractInsightsFromDeepContext(context: DeepContext, uvp: CompleteUVP): InsightCard[] {
  const insights: InsightCard[] = [];

  // ============================================================================
  // INDUSTRY TRENDS
  // ============================================================================
  context.industry?.trends?.forEach((trend: any, idx: number) => {
    const insightId = `trend-${idx}`;
    insights.push(getCachedInsight(insightId, trend, () => {
      const title = (trend.trend || '').split(/[,.]|and |but /)[0].trim() || 'Market Trend';
      const evidenceArray = trend.evidence
        ? (Array.isArray(trend.evidence) ? trend.evidence : trend.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      return {
        id: insightId,
        type: 'market',
        title,
        category: 'Market Trend',
        confidence: trend.strength || 0.75,
        isTimeSensitive: false,
        description: trend.trend || 'Industry trend',
        evidence: evidenceArray,
        sources: [{
          source: extractPlatform(trend.source || 'Industry Analysis'),
          quote: extractQuote(trend.evidence),
          timestamp: formatTimestamp(trend.timestamp),
        }],
        rawData: trend,
      };
    }));
  });

  // ============================================================================
  // CUSTOMER PSYCHOLOGY - UNARTICULATED NEEDS
  // ============================================================================
  context.customerPsychology?.unarticulated?.forEach((need: any, idx: number) => {
    const title = (need.need || '').split(/[,.]|and |but /)[0].trim() || 'Customer Need';
    const evidenceArray = need.evidence
      ? (Array.isArray(need.evidence) ? need.evidence : need.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
      : [];

    insights.push({
      id: `customer-need-${idx}`,
      type: 'customer',
      title,
      category: 'Customer Need',
      confidence: need.confidence || 0.8,
      isTimeSensitive: false,
      description: need.need || 'Customer need',
      actionableInsight: need.marketingAngle,
      evidence: evidenceArray,
      sources: [{
        source: extractPlatform(need.source || 'Customer Research'),
        quote: extractQuote(need.evidence) || need.emotionalDriver,
        timestamp: formatTimestamp(need.timestamp),
      }],
      rawData: need,
    });
  });

  // ============================================================================
  // CUSTOMER PSYCHOLOGY - EMOTIONAL TRIGGERS
  // ============================================================================
  context.customerPsychology?.emotional?.forEach((trigger: any, idx: number) => {
    const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
    const title = triggerText?.split(/[,.]|and |but /)[0].trim() || 'Emotional Trigger';

    insights.push({
      id: `customer-trigger-${idx}`,
      type: 'customer',
      title,
      category: 'Emotional Trigger',
      confidence: typeof trigger === 'object' ? trigger.strength : 0.85,
      isTimeSensitive: false,
      description: triggerText,
      sources: [{
        source: typeof trigger === 'object' && trigger.context
          ? trigger.context.replace(/^From\s+/i, '').trim()
          : 'Customer Psychology',
        quote: typeof trigger === 'object' ? trigger.leverage : undefined,
      }],
      rawData: trigger,
    });
  });

  // ============================================================================
  // COMPETITIVE INTELLIGENCE - BLIND SPOTS
  // ============================================================================
  context.competitiveIntel?.blindSpots?.forEach((blindspot: any, idx: number) => {
    const title = (blindspot.topic || '').split(/[,.]|and |but /)[0].trim() || 'Competitor Blindspot';
    const evidenceArray = blindspot.evidence
      ? (Array.isArray(blindspot.evidence) ? blindspot.evidence : blindspot.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
      : [];

    insights.push({
      id: `competition-blindspot-${idx}`,
      type: 'competition',
      title,
      category: 'Competitor Blindspot',
      confidence: blindspot.opportunityScore ? blindspot.opportunityScore / 100 : 0.8,
      isTimeSensitive: false,
      description: blindspot.topic || 'Competitive gap',
      evidence: evidenceArray,
      actionableInsight: blindspot.actionableInsight,
      sources: [{
        source: extractPlatform(blindspot.source || 'Competitive Analysis'),
        quote: extractQuote(blindspot.evidence) || blindspot.reasoning,
        timestamp: formatTimestamp(blindspot.timestamp),
      }],
      rawData: blindspot,
    });
  });

  // ============================================================================
  // COMPETITIVE INTELLIGENCE - MARKET GAPS/OPPORTUNITIES
  // ============================================================================
  context.competitiveIntel?.opportunities?.forEach((gap: any, idx: number) => {
    const title = (gap.gap || '').split(/[,.]|and |but /)[0].trim() || 'Market Gap';
    const evidenceArray = gap.evidence
      ? (Array.isArray(gap.evidence) ? gap.evidence : gap.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
      : [];

    insights.push({
      id: `opportunity-gap-${idx}`,
      type: 'opportunity',
      title,
      category: 'Market Gap',
      confidence: gap.confidence || 0.85,
      isTimeSensitive: false,
      description: gap.gap || 'Market opportunity',
      evidence: evidenceArray,
      actionableInsight: gap.positioning,
      sources: [{
        source: extractPlatform(gap.source || 'Market Gap Analysis'),
        quote: extractQuote(gap.evidence),
        timestamp: formatTimestamp(gap.timestamp),
      }],
      rawData: gap,
    });
  });

  // ============================================================================
  // LOCAL INTELLIGENCE - EVENTS
  // ============================================================================
  (context.realTimeCultural?.events as any[])?.forEach((event: any, idx: number) => {
    const eventName = event.name || event.title || String(event);
    const title = eventName.split(/[,.]|during |in /)[0].trim();

    insights.push({
      id: `local-event-${idx}`,
      type: 'local',
      title,
      category: 'Local Event',
      confidence: 0.85,
      isTimeSensitive: true,
      description: eventName,
      sources: [{
        source: 'Local Events Data',
        timestamp: event.date,
      }],
      rawData: event,
    });
  });

  // ============================================================================
  // LOCAL INTELLIGENCE - CULTURAL MOMENTS
  // ============================================================================
  (context.realTimeCultural?.moments as any[])?.forEach((moment: any, idx: number) => {
    const momentText = typeof moment === 'string' ? moment : moment.description || 'Cultural Moment';
    const title = momentText.split(/[,.]|where |during /)[0].trim();

    insights.push({
      id: `local-moment-${idx}`,
      type: 'local',
      title,
      category: 'Cultural Moment',
      confidence: 0.8,
      isTimeSensitive: true,
      description: momentText,
      sources: [{
        source: 'Cultural Trends Analysis',
      }],
      rawData: moment,
    });
  });

  // ============================================================================
  // SYNTHESIS - KEY INSIGHTS
  // ============================================================================
  context.synthesis?.keyInsights?.forEach((insight: any, idx: number) => {
    if (typeof insight === 'string') {
      const title = insight.split(/[,.]|that |which /)[0].trim();

      insights.push({
        id: `synthesis-${idx}`,
        type: 'opportunity',
        title,
        category: 'Key Insight',
        confidence: context.synthesis?.confidenceLevel || 0.8,
        isTimeSensitive: false,
        description: insight,
        sources: [{
          source: 'AI Synthesis',
        }],
      });
    }
  });

  // ============================================================================
  // SYNTHESIS - HIDDEN PATTERNS
  // ============================================================================
  context.synthesis?.hiddenPatterns?.forEach((pattern: any, idx: number) => {
    const title = pattern.pattern?.split(/[,.]|where |when /)[0].trim() || 'Hidden Pattern';

    insights.push({
      id: `pattern-${idx}`,
      type: 'opportunity',
      title,
      category: `${pattern.type?.charAt(0).toUpperCase() + pattern.type?.slice(1)} Pattern`,
      confidence: pattern.confidence || 0.8,
      isTimeSensitive: false,
      description: pattern.pattern,
      evidence: pattern.evidence || [],
      sources: [{
        source: 'Pattern Recognition',
        quote: pattern.implication,
      }],
      rawData: pattern,
    });
  });

  // ============================================================================
  // RAW DATA POINTS - Display ALL collected data points directly
  // ============================================================================
  context.rawDataPoints?.forEach((dp: any, idx: number) => {
    const typeMap: Record<string, InsightType> = {
      'pain_point': 'customer',
      'unarticulated_need': 'customer',
      'customer_trigger': 'customer',
      'trending_topic': 'market',
      'competitive_gap': 'competition',
      'timing': 'local',
      'market_signal': 'market',
      'opportunity': 'opportunity',
    };

    const insightType: InsightType = typeMap[dp.type] || 'opportunity';

    let category = 'Intelligence Data';
    if (dp.metadata?.triggerCategory) {
      const triggerCategoryMap: Record<string, string> = {
        'pain_point': 'Pain Point',
        'fear': 'Fear-Based Trigger',
        'aspiration': 'Aspiration',
        'opportunity': 'Opportunity Signal',
        'social_proof': 'Social Proof',
        'urgency': 'Urgent Need',
      };
      category = triggerCategoryMap[dp.metadata.triggerCategory] || 'Intelligence Data';
    } else if (dp.source) {
      category = `${dp.source.charAt(0).toUpperCase() + dp.source.slice(1)} Data`;
    }

    const content = dp.content || '';
    const title = content.length > 60
      ? content.substring(0, 60).split(/[,.]|that |which /)[0].trim() + '...'
      : content.split(/[,.]|that |which /)[0].trim();

    if (title.length < 3) return;

    insights.push({
      id: `raw-${dp.id || idx}`,
      type: insightType,
      title,
      category,
      confidence: dp.metadata?.confidence || 0.75,
      isTimeSensitive: dp.metadata?.urgency === 'immediate',
      description: content,
      evidence: dp.metadata?.uvpMatch ? [`Validates UVP: ${dp.metadata.uvpMatch}`] : [],
      sources: [{
        source: extractPlatform(dp.source || 'Data Analysis'),
        quote: dp.metadata?.emotion ? `Detected emotion: ${dp.metadata.emotion}` : undefined,
      }],
      rawData: dp,
    });
  });

  // ============================================================================
  // CORRELATED INSIGHTS - High-value cross-source validated insights
  // ============================================================================
  context.correlatedInsights?.forEach((ci: any, idx: number) => {
    const typeMap: Record<string, InsightType> = {
      'validated_pain': 'customer',
      'psychological_breakthrough': 'customer',
      'competitive_gap': 'competition',
      'timing_opportunity': 'local',
      'hidden_pattern': 'opportunity',
    };

    const insightType: InsightType = typeMap[ci.type] || 'opportunity';

    const categoryMap: Record<string, string> = {
      'validated_pain': '✓ Validated Pain Point',
      'psychological_breakthrough': '🧠 Psychological Breakthrough',
      'competitive_gap': '🎯 Competitive Gap',
      'timing_opportunity': '⏰ Timing Opportunity',
      'hidden_pattern': '🔍 Hidden Pattern',
    };
    const category = categoryMap[ci.type] || 'Correlated Insight';

    const evidenceList = ci.sources?.map((s: any) =>
      `${s.source}: "${s.content?.substring(0, 80)}..." (${Math.round(s.confidence * 100)}% confidence)`
    ) || [];

    insights.push({
      id: `correlated-${ci.id || idx}`,
      type: insightType,
      title: ci.title,
      category,
      confidence: ci.breakthroughScore / 100,
      isTimeSensitive: ci.timeSensitive,
      description: ci.description,
      actionableInsight: ci.actionableInsight,
      evidence: evidenceList,
      sources: ci.sources?.map((s: any) => ({
        source: extractPlatform(s.source),
        quote: s.content?.substring(0, 100),
      })) || [],
      rawData: ci,
    });
  });

  // ============================================================================
  // BREAKTHROUGH OPPORTUNITIES - Rich multi-source validated insights
  // ============================================================================
  context.synthesis?.breakthroughs?.forEach((bt: any, idx: number) => {
    let insightType: InsightType = 'opportunity';
    if (bt.uvpValidation) {
      insightType = 'customer';
    } else if (bt.competitive) {
      insightType = 'competition';
    } else if (bt.timing?.isTimeSensitive) {
      insightType = 'local';
    }

    const stars = '⭐'.repeat(bt.confidenceStars || 0);
    const connectionBadge = bt.connectionType === '5-way' ? '🔥 5-WAY' :
                            bt.connectionType === '4-way' ? '💎 4-WAY' :
                            bt.connectionType === '3-way' ? '✨ 3-WAY' : '';
    const category = `${connectionBadge} Breakthrough ${stars}`;

    const evidenceList: string[] = [];
    if (bt.uvpValidation) {
      evidenceList.push(`✓ UVP VALIDATED: "${bt.uvpValidation.painPoint}" (${bt.uvpValidation.matchScore}% match)`);
      bt.uvpValidation.evidence?.forEach((e: string) => evidenceList.push(`  └ ${e}`));
    }
    if (bt.psychology) {
      evidenceList.push(`Psychology: ${bt.psychology.triggerCategory} trigger, ${bt.psychology.emotion} emotion`);
    }
    evidenceList.push(`Sources: ${bt.sources?.join(', ')} (${bt.sources?.length || 0} independent sources)`);
    if (bt.timing?.isTimeSensitive) {
      evidenceList.push(`⏰ TIME SENSITIVE: ${bt.timing.reason || 'Act now'}`);
    }
    if (bt.competitive?.gap) {
      evidenceList.push(`🎯 COMPETITOR GAP: ${bt.competitive.gap}`);
    }
    if (bt.eqScore) {
      evidenceList.push(`EQ Score: ${bt.eqScore}/100 | Urgency: ${bt.psychology?.urgency?.toUpperCase() || 'NORMAL'}`);
    }

    insights.push({
      id: `breakthrough-${bt.id || idx}`,
      type: insightType,
      title: bt.title,
      category,
      confidence: (bt.score || 80) / 100,
      isTimeSensitive: bt.timing?.isTimeSensitive || bt.psychology?.urgency === 'critical',
      description: bt.hook,
      actionableInsight: bt.actionPlan,
      evidence: evidenceList,
      sources: bt.sources?.map((s: string) => ({
        source: extractPlatform(s),
      })) || [],
      rawData: bt,
    });
  });

  // ============================================================================
  // UVP-BASED INSIGHTS (Always include)
  // ============================================================================
  if (uvp) {
    if (uvp.targetCustomer) {
      insights.push({
        id: 'uvp-target',
        type: 'customer',
        title: `Target: ${uvp.targetCustomer.industry || 'Ideal Customer'}`,
        category: 'Customer Profile',
        confidence: 0.95,
        isTimeSensitive: false,
        description: uvp.targetCustomer.statement || 'Your ideal customer from UVP',
        sources: [{ source: 'UVP Analysis' }],
      });
    }

    // Transformation insight removed - focusing on Emotional/Functional Drivers instead

    if (uvp.keyBenefit) {
      const benefitMetrics = uvp.keyBenefit.metrics?.map(m => `${m.metric}: ${m.value}`).join(', ');
      insights.push({
        id: 'uvp-benefit',
        type: 'opportunity',
        title: 'Key Differentiator',
        category: 'Value Proposition',
        confidence: 0.92,
        isTimeSensitive: false,
        description: `${uvp.keyBenefit.statement || 'Your unique value'}${benefitMetrics ? `. Proof: ${benefitMetrics}` : ''}`,
        sources: [{ source: 'UVP Analysis' }],
      });
    }

    if (uvp.uniqueSolution) {
      insights.push({
        id: 'uvp-solution',
        type: 'competition',
        title: 'Unique Approach',
        category: 'Competitive Edge',
        confidence: 0.88,
        isTimeSensitive: false,
        description: uvp.uniqueSolution.statement || 'Your unique solution approach',
        sources: [{ source: 'UVP Analysis' }],
      });
    }

    if (uvp.valuePropositionStatement) {
      insights.push({
        id: 'uvp-statement',
        type: 'opportunity',
        title: 'Value Proposition',
        category: 'Core Message',
        confidence: 0.95,
        isTimeSensitive: false,
        description: uvp.valuePropositionStatement,
        sources: [{ source: 'UVP Synthesis' }],
      });
    }
  }

  // ============================================================================
  // SEASONAL INSIGHTS
  // ============================================================================
  const now = new Date();
  const month = now.getMonth();

  if (month >= 9 && month <= 11) {
    insights.push({
      id: 'seasonal-q4',
      type: 'market',
      title: 'Q4 Budget Season',
      category: 'Seasonal Opportunity',
      confidence: 0.9,
      isTimeSensitive: true,
      description: 'End-of-year budget decisions. Great time for ROI-focused content.',
      sources: [{ source: 'Seasonal Calendar' }],
    });
    insights.push({
      id: 'seasonal-holiday',
      type: 'local',
      title: 'Holiday Marketing Window',
      category: 'Seasonal Trend',
      confidence: 0.88,
      isTimeSensitive: true,
      description: 'Peak engagement period. Emotional, gratitude-focused content performs well.',
      sources: [{ source: 'Seasonal Calendar' }],
    });
  }

  if (month >= 0 && month <= 2) {
    insights.push({
      id: 'seasonal-newyear',
      type: 'market',
      title: 'New Year Fresh Start',
      category: 'Seasonal Opportunity',
      confidence: 0.9,
      isTimeSensitive: true,
      description: 'Fresh start mentality. Resolution and transformation content resonates.',
      sources: [{ source: 'Seasonal Calendar' }],
    });
  }

  console.log(`[V4PowerMode] Extracted ${insights.length} insights from DeepContext`);
  return insights;
}

// ============================================================================
// INSIGHT CARD COMPONENT (EXPANDABLE WITH PROVENANCE)
// ============================================================================

interface InsightCardComponentProps {
  insight: InsightCard;
  isSelected: boolean;
  onToggle: () => void;
}

// Extract raw quotes from rawData
function extractRawQuotes(rawData: any): { text: string; author?: string; source?: string }[] {
  if (!rawData) return [];

  const quotes: { text: string; author?: string; source?: string }[] = [];

  // Reddit posts
  if (rawData.selftext || rawData.title) {
    quotes.push({
      text: rawData.selftext || rawData.title,
      author: rawData.author ? `u/${rawData.author}` : undefined,
      source: rawData.subreddit ? `r/${rawData.subreddit}` : 'Reddit'
    });
  }

  // Reddit comments
  if (rawData.body) {
    quotes.push({
      text: rawData.body,
      author: rawData.author ? `u/${rawData.author}` : undefined,
      source: rawData.subreddit ? `r/${rawData.subreddit}` : 'Reddit'
    });
  }

  // Google/G2/TrustPilot reviews
  if (rawData.text || rawData.review || rawData.reviewText) {
    quotes.push({
      text: rawData.text || rawData.review || rawData.reviewText,
      author: rawData.reviewer || rawData.author || rawData.name,
      source: rawData.platform || 'Review'
    });
  }

  // Twitter/X posts
  if (rawData.tweet || rawData.full_text) {
    quotes.push({
      text: rawData.tweet || rawData.full_text,
      author: rawData.username ? `@${rawData.username}` : undefined,
      source: 'Twitter/X'
    });
  }

  // LinkedIn posts
  if (rawData.content && typeof rawData.content === 'string') {
    quotes.push({
      text: rawData.content,
      author: rawData.author,
      source: 'LinkedIn'
    });
  }

  // Generic content field
  if (rawData.content && !quotes.length) {
    const content = typeof rawData.content === 'string' ? rawData.content : JSON.stringify(rawData.content);
    if (content.length > 10) {
      quotes.push({ text: content, source: rawData.source || 'Data' });
    }
  }

  return quotes.filter(q => q.text && q.text.length > 10);
}

// Determine UVP alignment from insight
function determineUVPAlignment(insight: InsightCard): { component: string; label: string } | null {
  const desc = (insight.description + ' ' + insight.title).toLowerCase();
  const category = insight.category.toLowerCase();

  if (desc.includes('pain') || desc.includes('frustrat') || desc.includes('struggle') || category.includes('pain')) {
    return { component: 'target_customer', label: 'Target Customer Pain' };
  }
  if (desc.includes('benefit') || desc.includes('value') || desc.includes('result') || category.includes('benefit')) {
    return { component: 'key_benefit', label: 'Key Benefit' };
  }
  if (desc.includes('transform') || desc.includes('change') || desc.includes('journey')) {
    return { component: 'transformation', label: 'Transformation Story' };
  }
  if (desc.includes('unique') || desc.includes('different') || desc.includes('gap') || category.includes('gap')) {
    return { component: 'unique_solution', label: 'Unique Differentiator' };
  }

  return null;
}

// Determine content pillars from insight
function determineContentPillars(insight: InsightCard): string[] {
  const pillars: string[] = [];
  const desc = (insight.description + ' ' + insight.title + ' ' + insight.category).toLowerCase();

  if (desc.includes('authority') || desc.includes('expert') || desc.includes('leader') || desc.includes('trend')) {
    pillars.push('Authority');
  }
  if (desc.includes('trust') || desc.includes('proof') || desc.includes('review') || desc.includes('testimonial')) {
    pillars.push('Trust');
  }
  if (desc.includes('problem') || desc.includes('pain') || desc.includes('challenge') || desc.includes('frustrat')) {
    pillars.push('Problem-Solution');
  }
  if (desc.includes('story') || desc.includes('journey') || desc.includes('transform')) {
    pillars.push('Story');
  }
  if (desc.includes('education') || desc.includes('how to') || desc.includes('guide') || desc.includes('tip')) {
    pillars.push('Education');
  }
  if (desc.includes('community') || desc.includes('local') || desc.includes('event')) {
    pillars.push('Community');
  }

  return pillars.length > 0 ? pillars : ['General'];
}

const InsightCardComponent = memo(function InsightCardComponent({ insight, isSelected, onToggle }: InsightCardComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'sources' | 'uvp' | 'pillars' | null>(null);
  const config = typeConfig[insight.type];

  const rawQuotes = useMemo(() => extractRawQuotes(insight.rawData), [insight.rawData]);
  const uvpAlignment = useMemo(() => determineUVPAlignment(insight), [insight]);
  const contentPillars = useMemo(() => determineContentPillars(insight), [insight]);

  // Get unique sources
  const displaySources = useMemo(() => {
    const sources = insight.sources?.map(s => getDisplaySourceName(s.source)) || [];
    if (insight.rawData?.source) {
      sources.push(getDisplaySourceName(insight.rawData.source));
    }
    return [...new Set(sources)].filter(s => s && s !== 'undefined');
  }, [insight.sources, insight.rawData]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (isExpanded) setExpandedSection(null);
  };

  const toggleSection = (section: 'sources' | 'uvp' | 'pillars', e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div
      className={`
        w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 hover:shadow-md'}
      `}
    >
      {/* Main Card Content - Clickable for selection */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
              {insight.isTimeSensitive && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                  ⏰ Time-Sensitive
                </span>
              )}
              {displaySources.slice(0, 2).map((source, i) => (
                <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {source}
                </span>
              ))}
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {insight.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {insight.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {insight.category}
              </span>
              <span className="text-xs font-bold text-purple-600">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {isSelected && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Expand Button */}
      <div className="px-4 pb-2">
        <button
          onClick={handleExpandClick}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'Show Provenance'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Provenance Section */}
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

              {/* Sources Section */}
              {(displaySources.length > 0 || rawQuotes.length > 0) && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('sources', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Sources ({displaySources.length})
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'sources' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'sources' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 space-y-2">
                          {/* Source badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {displaySources.map((source, i) => (
                              <span key={i} className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {source}
                              </span>
                            ))}
                          </div>

                          {/* Raw quotes */}
                          {rawQuotes.length > 0 && (
                            <div className="space-y-2">
                              {rawQuotes.slice(0, 3).map((quote, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400">
                                  <div className="flex items-start gap-2">
                                    <Quote className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-4">
                                        "{quote.text.substring(0, 300)}{quote.text.length > 300 ? '...' : ''}"
                                      </p>
                                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        {quote.author && <span className="font-medium">{quote.author}</span>}
                                        {quote.source && <span>• {quote.source}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Fallback if no quotes but has sources */}
                          {rawQuotes.length === 0 && insight.sources?.some(s => s.quote) && (
                            <div className="space-y-2">
                              {insight.sources.filter(s => s.quote).slice(0, 3).map((source, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400">
                                  <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                    "{source.quote}"
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">— {getDisplaySourceName(source.source)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* UVP Alignment Section */}
              {uvpAlignment && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('uvp', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        UVP Alignment
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'uvp' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'uvp' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0">
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                              {uvpAlignment.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            This insight aligns with your UVP's {uvpAlignment.component.replace('_', ' ')} component.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Content Pillars Section */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => toggleSection('pillars', e)}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Content Pillars ({contentPillars.length})
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'pillars' ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandedSection === 'pillars' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0">
                        <div className="flex flex-wrap gap-2">
                          {contentPillars.map((pillar, i) => (
                            <span key={i} className="px-3 py-1.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              {pillar}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Best suited for {contentPillars.join(', ')} content strategies.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Evidence/Correlated Sources */}
              {insight.evidence && insight.evidence.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Correlated Evidence
                    </span>
                  </div>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    {insight.evidence.slice(0, 3).map((ev, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-500">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
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
// SIDEBAR SECTION COMPONENT - Collapsible section for sidebar
// ============================================================================

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  badgeCount?: number;
  children: React.ReactNode;
}

const SidebarSection = memo(function SidebarSection({
  title,
  icon,
  defaultExpanded = false,
  badgeCount,
  children
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 dark:border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-500">{icon}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{title}</span>
          {badgeCount !== undefined && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {badgeCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'visible' }}
          >
            <div className="p-2 pt-0 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// EXPANDABLE CUSTOMER PROFILE CARD - Shows UVP customer profile details
// ============================================================================

interface ParsedCustomerProfile {
  title: string;
  description: string;
}

// Parse UVP statement to extract individual customer profiles
function parseCustomerProfiles(statement: string): ParsedCustomerProfile[] {
  if (!statement) return [];

  // Split by semicolons to get individual profiles
  const profiles = statement.split(';').map(s => s.trim()).filter(Boolean);

  return profiles.map(profile => {
    // Extract title - look for role/title pattern at the start
    // Common patterns: "Insurance Operations Director seeking...", "Digital Transformation Leader in..."
    const titleMatch = profile.match(/^([A-Z][^,;.]*?(?:Director|Manager|Leader|Owner|Principal|Officer|COO|CEO|CFO|CTO|CMO|VP|Head|Executive|Specialist|Analyst|Consultant|Agent|Broker)[^,;.]*?)(?:\s+(?:seeking|looking|responsible|needing|frustrated|in\s|who|that))/i);

    if (titleMatch) {
      return {
        title: titleMatch[1].trim(),
        description: profile
      };
    }

    // Fallback: use first few words as title
    const words = profile.split(' ').slice(0, 4).join(' ');
    return {
      title: words.length > 30 ? words.slice(0, 30) + '...' : words,
      description: profile
    };
  });
}

interface CustomerProfileCardProps {
  title: string;
  description: string;
  emotionalDrivers?: string[];
  functionalDrivers?: string[];
  onSelectItem: (item: { type: string; text: string }) => void;
}

const CustomerProfileCard = memo(function CustomerProfileCard({
  title,
  description,
  emotionalDrivers,
  functionalDrivers,
  onSelectItem
}: CustomerProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmotional, setShowEmotional] = useState(false);
  const [showFunctional, setShowFunctional] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
      {/* Card Header - Title only */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-left truncate">
            {title}
          </span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 space-y-2 bg-white dark:bg-slate-800/50">
              {/* Description - clickable */}
              <button
                onClick={() => onSelectItem({ type: 'customer', text: description })}
                className="w-full text-left p-2 text-[11px] rounded bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                {description}
              </button>

              {/* Emotional Drivers - Expandable Box (Orange/Amber like UVP) */}
              {emotionalDrivers && emotionalDrivers.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowEmotional(!showEmotional)}
                    className="w-full flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Emotional Drivers
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300">
                        {emotionalDrivers.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-amber-500 transition-transform ${showEmotional ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showEmotional && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1 bg-amber-25 dark:bg-amber-900/10">
                          {emotionalDrivers.map((driver, i) => (
                            <button
                              key={`emotional-${i}`}
                              onClick={() => onSelectItem({ type: 'emotional', text: driver })}
                              className="w-full text-left p-1.5 text-[10px] rounded bg-amber-100/50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 transition-colors flex items-start gap-1.5"
                            >
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{driver}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Functional Drivers - Expandable Box (Blue like UVP) */}
              {functionalDrivers && functionalDrivers.length > 0 && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowFunctional(!showFunctional)}
                    className="w-full flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Functional Drivers
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-blue-200 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300">
                        {functionalDrivers.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-blue-500 transition-transform ${showFunctional ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showFunctional && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1 bg-blue-25 dark:bg-blue-900/10">
                          {functionalDrivers.map((driver, i) => (
                            <button
                              key={`functional-${i}`}
                              onClick={() => onSelectItem({ type: 'functional', text: driver })}
                              className="w-full text-left p-1.5 text-[10px] rounded bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-200 transition-colors flex items-start gap-1.5"
                            >
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{driver}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
// UVP BUILDING BLOCKS COMPONENT - Shows UVP data as clickable items
// ============================================================================

interface UVPBuildingBlocksProps {
  uvp: CompleteUVP;
  deepContext?: DeepContext | null;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const UVPBuildingBlocks = memo(function UVPBuildingBlocks({ uvp, deepContext, onSelectItem }: UVPBuildingBlocksProps) {
  // Debug log websiteAnalysis and UVP data
  useEffect(() => {
    const wsAnalysis = deepContext?.business?.websiteAnalysis;
    const dcUvp = deepContext?.business?.uvp as any;
    console.log('[UVPBuildingBlocks] Data received:', {
      // UVP structure - CompleteUVP type
      uvp_targetCustomer: uvp?.targetCustomer?.statement ? 'yes' : 'no',
      uvp_emotionalDrivers: uvp?.targetCustomer?.emotionalDrivers?.length || 0,
      uvp_functionalDrivers: uvp?.targetCustomer?.functionalDrivers?.length || 0,
      uvp_transformation_emotionalDrivers: uvp?.transformationGoal?.emotionalDrivers?.length || 0,
      uvp_transformation_functionalDrivers: uvp?.transformationGoal?.functionalDrivers?.length || 0,
      uvp_transformationBefore: uvp?.transformationGoal?.before?.slice(0, 30) || 'none',
      uvp_transformationAfter: uvp?.transformationGoal?.after?.slice(0, 30) || 'none',
      uvp_differentiators: uvp?.uniqueSolution?.differentiators?.length || 0,
      // DeepContext UVP (different structure)
      dc_uvp_emotionalDrivers: dcUvp?.emotionalDrivers?.length || 0,
      dc_uvp_functionalDrivers: dcUvp?.functionalDrivers?.length || 0,
      // Website analysis
      ws_testimonials: wsAnalysis?.testimonials?.length || 0,
      ws_proofPoints: wsAnalysis?.proofPoints?.length || 0,
      ws_metaTags: Object.keys(wsAnalysis?.metaTags || {}).length,
      ws_valuePropositions: wsAnalysis?.valuePropositions?.length || 0,
      ws_differentiators: wsAnalysis?.differentiators?.length || 0,
      ws_targetAudience: wsAnalysis?.targetAudience?.length || 0,
      ws_customerProblems: wsAnalysis?.customerProblems?.length || 0
    });
  }, [deepContext?.business?.websiteAnalysis, deepContext?.business?.uvp, uvp]);

  // Defensive check - uvp might be incomplete during session restore
  if (!uvp) {
    return (
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
        Loading UVP data...
      </div>
    );
  }

  // Extract UVP components into clickable items
  const customerItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];
    const wsAnalysis = deepContext?.business?.websiteAnalysis;

    // Target Customer - CustomerProfile object with statement
    if (uvp?.targetCustomer?.statement) {
      items.push({ id: 'customer-main', text: uvp.targetCustomer.statement, type: 'customer' });
    }

    // Emotional Drivers - nested under targetCustomer in CompleteUVP
    if (Array.isArray(uvp?.targetCustomer?.emotionalDrivers)) {
      uvp.targetCustomer.emotionalDrivers.forEach((driver: string, i: number) => {
        if (driver) items.push({ id: `emotional-${i}`, text: driver, type: 'emotional' });
      });
    }

    // Functional Drivers - nested under targetCustomer in CompleteUVP
    if (Array.isArray(uvp?.targetCustomer?.functionalDrivers)) {
      uvp.targetCustomer.functionalDrivers.forEach((driver: string, i: number) => {
        if (driver) items.push({ id: `functional-${i}`, text: driver, type: 'functional' });
      });
    }

    // ALWAYS add websiteAnalysis targetAudience (complement UVP data)
    if (wsAnalysis?.targetAudience?.length) {
      wsAnalysis.targetAudience.forEach((audience: string, i: number) => {
        if (audience) items.push({ id: `ws-audience-${i}`, text: audience, type: 'audience' });
      });
    }

    // ALWAYS add websiteAnalysis customerProblems (these are emotional/functional driver surrogates)
    if (wsAnalysis?.customerProblems?.length) {
      wsAnalysis.customerProblems.forEach((problem: string, i: number) => {
        if (problem) items.push({ id: `ws-problem-${i}`, text: problem, type: 'problem' });
      });
    }

    // Also add valuePropositions as customer benefits (they're customer-facing value statements)
    if (wsAnalysis?.valuePropositions?.length) {
      wsAnalysis.valuePropositions.forEach((vp: string, i: number) => {
        if (vp) items.push({ id: `ws-vp-${i}`, text: vp, type: 'value' });
      });
    }

    return items;
  }, [uvp?.targetCustomer, deepContext?.business?.websiteAnalysis]);

  const differentiatorItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // From UVP
    if (uvp?.uniqueSolution?.differentiators && Array.isArray(uvp.uniqueSolution.differentiators)) {
      uvp.uniqueSolution.differentiators
        .filter((d: any) => d?.statement)
        .forEach((d: any, i: number) => {
          items.push({ id: `diff-${i}`, text: d.statement, type: 'differentiator' });
        });
    }

    // ALWAYS add websiteAnalysis differentiators (complement UVP data)
    if (deepContext?.business?.websiteAnalysis?.differentiators?.length) {
      deepContext.business.websiteAnalysis.differentiators.forEach((diff: string, i: number) => {
        if (diff) items.push({ id: `ws-diff-${i}`, text: diff, type: 'ws-differentiator' });
      });
    }

    return items;
  }, [uvp?.uniqueSolution, deepContext?.business?.websiteAnalysis?.differentiators]);

  const benefitItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Support both single keyBenefit.statement and array keyBenefits
    if (uvp?.keyBenefit?.statement) {
      items.push({ id: 'benefit-main', text: uvp.keyBenefit.statement, type: 'benefit' });
    }

    // Support array of benefits (keyBenefits) - new format
    if (Array.isArray((uvp as any)?.keyBenefits)) {
      (uvp as any).keyBenefits.forEach((benefit: string, i: number) => {
        if (benefit && !items.some(item => item.text === benefit)) {
          items.push({ id: `benefit-${i}`, text: benefit, type: 'benefit' });
        }
      });
    }

    // Metrics - defensive check
    if (Array.isArray(uvp?.keyBenefit?.metrics)) {
      uvp.keyBenefit.metrics.forEach((m: any, i: number) => {
        if (m?.metric && m?.value) {
          items.push({ id: `metric-${i}`, text: `${m.metric}: ${m.value}`, type: 'metric' });
        }
      });
    }

    // Add websiteAnalysis valuePropositions as additional benefits
    if (deepContext?.business?.websiteAnalysis?.valuePropositions?.length) {
      deepContext.business.websiteAnalysis.valuePropositions.forEach((vp: string, i: number) => {
        if (vp && !items.some(item => item.text === vp)) {
          items.push({ id: `ws-vp-${i}`, text: vp, type: 'benefit' });
        }
      });
    }

    return items;
  }, [uvp?.keyBenefit, (uvp as any)?.keyBenefits, deepContext?.business?.websiteAnalysis?.valuePropositions]);

  // Products/Services from websiteAnalysis.solutions
  const productItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Primary source: websiteAnalysis solutions (products/services they offer)
    if (deepContext?.business?.websiteAnalysis?.solutions?.length) {
      deepContext.business.websiteAnalysis.solutions.forEach((sol: string, i: number) => {
        if (sol) items.push({ id: `product-${i}`, text: sol, type: 'product' });
      });
    }

    return items;
  }, [deepContext?.business?.websiteAnalysis?.solutions]);

  const transformationItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    if (uvp?.transformationGoal?.before) {
      items.push({ id: 'before', text: `Before: ${uvp.transformationGoal.before}`, type: 'transformation' });
    }
    if (uvp?.transformationGoal?.after) {
      items.push({ id: 'after', text: `After: ${uvp.transformationGoal.after}`, type: 'transformation' });
    }
    if (uvp?.transformationGoal?.statement) {
      items.push({ id: 'goal', text: uvp.transformationGoal.statement, type: 'transformation' });
    }

    // FALLBACK: Use websiteAnalysis customerProblems as "before" state
    if (items.length === 0 && deepContext?.business?.websiteAnalysis?.customerProblems?.length) {
      deepContext.business.websiteAnalysis.customerProblems.slice(0, 3).forEach((problem: string, i: number) => {
        if (problem) items.push({ id: `ws-problem-${i}`, text: `Pain: ${problem}`, type: 'transformation' });
      });
    }

    return items;
  }, [uvp?.transformationGoal, deepContext?.business?.websiteAnalysis?.customerProblems]);

  // Extract keywords from DeepContext business profile, with fallbacks from UVP data and websiteAnalysis
  const keywordItems = useMemo(() => {
    const keywords: string[] = [];
    const wsAnalysis = deepContext?.business?.websiteAnalysis;

    // Primary source: DeepContext business profile
    if (deepContext?.business?.profile?.keywords?.length) {
      keywords.push(...deepContext.business.profile.keywords);
    }

    // Secondary source: websiteAnalysis keywords
    if (wsAnalysis?.keywords?.length) {
      keywords.push(...wsAnalysis.keywords);
    }

    // Fallback: Extract keywords from UVP components when DeepContext unavailable
    if (keywords.length === 0) {
      // Extract key terms from UVP value proposition statement
      if (uvp?.valuePropositionStatement) {
        // Extract significant words (3+ characters, not common words)
        const stopWords = ['the', 'and', 'for', 'with', 'that', 'from', 'your', 'are', 'who', 'our', 'you', 'can', 'will', 'their', 'they', 'this', 'into', 'not'];
        const words = uvp.valuePropositionStatement
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length >= 4 && !stopWords.includes(w));
        keywords.push(...words.slice(0, 5));
      }

      // Add industry-related keywords from unique solution statement
      if (uvp?.uniqueSolution?.statement) {
        const solutionWords = uvp.uniqueSolution.statement
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length >= 5);
        keywords.push(...solutionWords.slice(0, 3));
      }

      // Add target customer keywords - targetCustomer.statement is a string
      if (uvp?.targetCustomer?.statement) {
        const customerWords = uvp.targetCustomer.statement
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length >= 5);
        keywords.push(...customerWords.slice(0, 3));
      }
    }

    // Deduplicate and limit
    const uniqueKeywords = [...new Set(keywords)].slice(0, 12);

    return uniqueKeywords.map((kw, i) => ({
      id: `keyword-${i}`,
      text: kw,
      type: 'keyword'
    }));
  }, [deepContext?.business?.profile?.keywords, deepContext?.business?.websiteAnalysis?.keywords, uvp?.valuePropositionStatement, uvp?.uniqueSolution?.statement, uvp?.targetCustomer?.statement]);

  // Extract case studies from competitive intelligence and synthesis
  const caseStudyItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Look for case studies in synthesis key insights
    deepContext?.synthesis?.keyInsights?.forEach((insight: any, i) => {
      if (typeof insight === 'string' &&
        (insight.toLowerCase().includes('case study') ||
         insight.toLowerCase().includes('success story') ||
         insight.toLowerCase().includes('testimonial') ||
         insight.toLowerCase().includes('achieved') ||
         insight.toLowerCase().includes('increased by'))) {
        items.push({ id: `case-${i}`, text: insight, type: 'case_study' });
      }
    });

    // Look for social proof in competitive intel
    deepContext?.competitiveIntel?.opportunities?.forEach((opp: any, i) => {
      if (opp.gap && opp.gap.toLowerCase().includes('proof')) {
        items.push({ id: `proof-${i}`, text: opp.gap, type: 'social_proof' });
      }
    });

    return items;
  }, [deepContext?.synthesis, deepContext?.competitiveIntel]);

  // Extract customer testimonials from website analysis
  const testimonialItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Check deepContext for website testimonials
    const websiteTestimonials = deepContext?.business?.websiteAnalysis?.testimonials || [];
    websiteTestimonials.forEach((testimonial: string, i: number) => {
      if (testimonial && testimonial.length > 20) {
        items.push({ id: `testimonial-${i}`, text: testimonial, type: 'testimonial' });
      }
    });

    // Include ALL proof points from website analysis (these are credibility signals)
    const proofPoints = deepContext?.business?.websiteAnalysis?.proofPoints || [];
    proofPoints.forEach((proof: string, i: number) => {
      if (proof && proof.length > 10) {
        items.push({ id: `proof-point-${i}`, text: proof, type: 'proof_point' });
      }
    });

    return items;
  }, [deepContext?.business?.websiteAnalysis]);

  // Extract meta tag keywords from website
  const metaKeywords = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Get meta tag keywords from website analysis
    const metaTags = deepContext?.business?.websiteAnalysis?.metaTags || {};
    const keywordsString = metaTags['keywords'] || metaTags['Keywords'] || '';

    if (keywordsString) {
      keywordsString.split(',').forEach((kw: string, i: number) => {
        const trimmed = kw.trim();
        if (trimmed && trimmed.length > 2) {
          items.push({ id: `meta-kw-${i}`, text: trimmed, type: 'meta_keyword' });
        }
      });
    }

    // Extract og:title, og:description for context
    const ogTitle = metaTags['og:title'];
    const ogDescription = metaTags['og:description'];
    const description = metaTags['description'];
    const twitterTitle = metaTags['twitter:title'];
    const twitterDescription = metaTags['twitter:description'];

    if (ogTitle) {
      items.push({ id: 'og-title', text: ogTitle, type: 'meta_og' });
    }
    if (ogDescription) {
      items.push({ id: 'og-desc', text: ogDescription.length > 150 ? ogDescription.substring(0, 150) + '...' : ogDescription, type: 'meta_og' });
    }
    if (description && description !== ogDescription) {
      items.push({ id: 'meta-desc', text: description.length > 150 ? description.substring(0, 150) + '...' : description, type: 'meta_description' });
    }
    if (twitterTitle && twitterTitle !== ogTitle) {
      items.push({ id: 'twitter-title', text: twitterTitle, type: 'meta_twitter' });
    }
    if (twitterDescription && twitterDescription !== ogDescription && twitterDescription !== description) {
      items.push({ id: 'twitter-desc', text: twitterDescription.length > 150 ? twitterDescription.substring(0, 150) + '...' : twitterDescription, type: 'meta_twitter' });
    }

    return items;
  }, [deepContext?.business?.websiteAnalysis?.metaTags]);

  const renderClickableItem = (item: { id: string; text: string; type: string }) => (
    <button
      key={item.id}
      onClick={() => onSelectItem({ type: item.type, text: item.text })}
      className="w-full text-left p-2 text-xs rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-slate-600 transition-colors line-clamp-2 text-gray-800 dark:text-gray-100"
    >
      {item.text}
    </button>
  );

  // Parse customer profiles from UVP statement
  const parsedProfiles = useMemo(() => {
    if (!uvp?.targetCustomer?.statement) return [];
    return parseCustomerProfiles(uvp.targetCustomer.statement);
  }, [uvp?.targetCustomer?.statement]);

  return (
    <>
      {/* Customer Profile - Expandable cards showing UVP customer profiles */}
      {parsedProfiles.length > 0 && (
        <SidebarSection
          title="Customer Profile"
          icon={<Users className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={parsedProfiles.length}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {/* Each parsed customer profile as expandable card */}
            {parsedProfiles.map((profile, index) => (
              <CustomerProfileCard
                key={`profile-${index}`}
                title={profile.title}
                description={profile.description}
                emotionalDrivers={
                  uvp?.transformationGoal?.emotionalDrivers ||
                  uvp?.targetCustomer?.emotionalDrivers ||
                  (deepContext?.business?.uvp as any)?.emotionalDrivers ||
                  []
                }
                functionalDrivers={
                  uvp?.transformationGoal?.functionalDrivers ||
                  uvp?.targetCustomer?.functionalDrivers ||
                  (deepContext?.business?.uvp as any)?.functionalDrivers ||
                  []
                }
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Differentiators */}
      {differentiatorItems.length > 0 && (
        <SidebarSection
          title="Differentiators"
          icon={<Shield className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={differentiatorItems.length}
        >
          <div className="space-y-1.5">
            {differentiatorItems.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Key Benefits */}
      {benefitItems.length > 0 && (
        <SidebarSection
          title="Key Benefits"
          icon={<Heart className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={benefitItems.length}
        >
          <div className="space-y-1.5">
            {benefitItems.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Products/Services */}
      {productItems.length > 0 && (
        <SidebarSection
          title="Products & Services"
          icon={<Package className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={productItems.length}
        >
          <div className="space-y-1.5">
            {productItems.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Value Proposition Statement */}
      {uvp.valuePropositionStatement && (
        <SidebarSection
          title="Value Proposition"
          icon={<Target className="w-4 h-4" />}
          defaultExpanded={false}
        >
          <button
            onClick={() => onSelectItem({ type: 'uvp', text: uvp.valuePropositionStatement })}
            className="w-full text-left p-2 text-xs rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 hover:border-purple-400 transition-colors"
          >
            {uvp.valuePropositionStatement}
          </button>
        </SidebarSection>
      )}

      {/* Keywords (SEO) */}
      {keywordItems.length > 0 && (
        <SidebarSection
          title="Keywords (SEO)"
          icon={<Globe className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={keywordItems.length}
        >
          <div className="flex flex-wrap gap-1.5">
            {keywordItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem({ type: item.type, text: item.text })}
                className="px-2 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                {item.text}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Customer Testimonials */}
      {testimonialItems.length > 0 && (
        <SidebarSection
          title="Customer Testimonials"
          icon={<Quote className="w-4 h-4" />}
          defaultExpanded={true}
          badgeCount={testimonialItems.length}
        >
          <div className="space-y-1.5">
            {testimonialItems.slice(0, 5).map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Meta Tags & SEO */}
      {metaKeywords.length > 0 && (
        <SidebarSection
          title="Meta Tags & SEO"
          icon={<Globe className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={metaKeywords.length}
        >
          <div className="space-y-1.5">
            {metaKeywords.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Website Value Props - from website analysis */}
      {deepContext?.business?.websiteAnalysis?.valuePropositions?.length > 0 && (
        <SidebarSection
          title="Website Value Props"
          icon={<Lightbulb className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={deepContext.business.websiteAnalysis.valuePropositions.length}
        >
          <div className="space-y-1.5">
            {deepContext.business.websiteAnalysis.valuePropositions.slice(0, 5).map((vp: string, i: number) => (
              <button
                key={`ws-vp-${i}`}
                onClick={() => onSelectItem({ type: 'value_proposition', text: vp })}
                className="w-full text-left p-2 text-xs rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 transition-colors line-clamp-2"
              >
                {vp}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Website Differentiators - from website analysis */}
      {deepContext?.business?.websiteAnalysis?.differentiators?.length > 0 && (
        <SidebarSection
          title="Website Differentiators"
          icon={<Shield className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={deepContext.business.websiteAnalysis.differentiators.length}
        >
          <div className="space-y-1.5">
            {deepContext.business.websiteAnalysis.differentiators.slice(0, 5).map((diff: string, i: number) => (
              <button
                key={`ws-diff-${i}`}
                onClick={() => onSelectItem({ type: 'differentiator', text: diff })}
                className="w-full text-left p-2 text-xs rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700 transition-colors line-clamp-2"
              >
                {diff}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Case Studies / Social Proof */}
      {caseStudyItems.length > 0 && (
        <SidebarSection
          title="Case Studies"
          icon={<BookOpen className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={caseStudyItems.length}
        >
          <div className="space-y-1.5">
            {caseStudyItems.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to detect websiteAnalysis changes
  const prevWs = prevProps.deepContext?.business?.websiteAnalysis;
  const nextWs = nextProps.deepContext?.business?.websiteAnalysis;

  // If websiteAnalysis changed, re-render
  if (prevWs !== nextWs) return false;
  if ((prevWs?.valuePropositions?.length || 0) !== (nextWs?.valuePropositions?.length || 0)) return false;
  if ((prevWs?.differentiators?.length || 0) !== (nextWs?.differentiators?.length || 0)) return false;
  if ((prevWs?.testimonials?.length || 0) !== (nextWs?.testimonials?.length || 0)) return false;
  if (Object.keys(prevWs?.metaTags || {}).length !== Object.keys(nextWs?.metaTags || {}).length) return false;

  // Default shallow compare for other props
  return prevProps.uvp === nextProps.uvp && prevProps.onSelectItem === nextProps.onSelectItem;
});

// ============================================================================
// CSS GRID INSIGHT GRID - V3 style with proper expansion (no react-window)
// ============================================================================

interface CSSGridInsightGridProps {
  insights: InsightCard[];
  selectedInsights: string[];
  onToggle: (id: string) => void;
}

const CSSGridInsightGrid = memo(function CSSGridInsightGrid({
  insights,
  selectedInsights,
  onToggle
}: CSSGridInsightGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-3 p-1">
        {insights.map((insight, idx) => {
          const isSelected = selectedInsights.includes(insight.id);
          const isExpanded = expandedCard === insight.id;
          const Icon = typeConfig[insight.type]?.icon || TrendingUp;
          const gradientColor = typeConfig[insight.type]?.gradient || 'from-gray-500 to-gray-600';

          // Card classes - expanded cards span both columns
          const cardClasses = `relative rounded-lg border-2 transition-all ${
            isExpanded ? 'col-span-2' : ''
          } ${
            isSelected
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
          }`;

          // V3 FIX: Use regular div instead of motion.div for better performance
          // Staggered animations on 50+ cards causes freezing
          return (
            <div
              key={insight.id}
              className={cardClasses}
            >
              {/* Card Content - Clickable to select */}
              <button
                onClick={() => onToggle(insight.id)}
                className="w-full p-3 text-left"
              >
                {/* Confidence Badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r ${gradientColor} rounded-full`}>
                  <span className="text-xs font-bold text-white">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>

                {/* Type Icon */}
                <div className={`inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br ${gradientColor} rounded-lg mb-2`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white pr-8 line-clamp-2">
                  {insight.title}
                </h4>

                {/* Category & Source */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${typeConfig[insight.type]?.bgColor} ${typeConfig[insight.type]?.color}`}>
                    {insight.category}
                  </span>
                  {insight.sources && insight.sources.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.sources[0].source}
                    </span>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>

              {/* Expand Button */}
              <button
                onClick={(e) => toggleExpand(insight.id, e)}
                className="absolute bottom-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Expanded Details - CSS-based, no AnimatePresence inside loop */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3">
                  {/* Description */}
                  {insight.description && (
                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase">Overview</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{insight.description}</p>
                    </div>
                  )}

                  {/* Actionable Insight */}
                  {insight.actionableInsight && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase">What To Do</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{insight.actionableInsight}</p>
                    </div>
                  )}

                  {/* Evidence */}
                  {insight.evidence && insight.evidence.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 uppercase">Evidence</h5>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {insight.evidence.slice(0, 3).map((ev, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-amber-500">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources */}
                  {insight.sources && insight.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Sources:</span>
                      {insight.sources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded">
                          {src.source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// YOUR MIX PREVIEW COMPONENT
// ============================================================================

interface YourMixPreviewProps {
  selectedInsights: InsightCard[];
  generatedContent: GeneratedContent | null;
  isGenerating: boolean;
  framework: PsychologyFramework;
  onRemove: (id: string) => void;
  onClear: () => void;
  onGenerate: () => void;
  onSave?: () => void;
}

function YourMixPreview({
  selectedInsights,
  generatedContent,
  isGenerating,
  framework,
  onRemove,
  onClear,
  onGenerate,
  onSave
}: YourMixPreviewProps) {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const hasSelection = selectedInsights.length > 0;

  const avgConfidence = hasSelection
    ? selectedInsights.reduce((sum, i) => sum + i.confidence, 0) / selectedInsights.length
    : 0;

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Your Mix
          </h3>
          {hasSelection && (
            <button
              onClick={onClear}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {selectedInsights.length} selected
          </p>
          <span className="text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
            {framework}
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence>
            {!hasSelection ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select insights or choose a template
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Generation Loading */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Generating with V4 Engine...</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Synthesizing {selectedInsights.length} insights
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Generated Content Preview */}
                {generatedContent && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            Live Preview
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            generatedContent.score.total >= 80
                              ? 'bg-green-100 text-green-700'
                              : generatedContent.score.total >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {generatedContent.score.total}/100
                          </span>
                          <button
                            onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded"
                          >
                            {isPreviewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                        {generatedContent.headline}
                      </p>
                    </div>

                    <AnimatePresence>
                      {isPreviewExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-blue-200 dark:border-blue-700"
                        >
                          <div className="p-4 space-y-3">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <h5 className="text-xs font-bold text-purple-700 mb-1 uppercase">Hook</h5>
                              <p className="text-sm italic text-gray-700 dark:text-gray-300">{generatedContent.hook}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase">Body</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{generatedContent.body}</p>
                            </div>
                            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center">
                              <p className="text-sm font-bold">{generatedContent.cta}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Selected Insights List */}
                <div className="space-y-2">
                  {selectedInsights.map((insight, idx) => (
                    <motion.div
                      key={insight.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="relative group"
                    >
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                        <button
                          onClick={() => onRemove(insight.id)}
                          className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-gray-600" />
                        </button>
                        <p className="text-xs font-medium text-gray-900 dark:text-white pr-6 mb-1">
                          {insight.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{insight.category}</span>
                          <span className="text-xs font-bold text-purple-600">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
        {hasSelection && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Avg. Confidence</span>
            <span className="font-bold text-purple-600">{Math.round(avgConfidence * 100)}%</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onGenerate}
            disabled={!hasSelection || isGenerating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate</>
            )}
          </Button>
          {generatedContent && onSave && (
            <Button variant="outline" onClick={onSave}>
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function V4PowerModePanel({
  uvp,
  brandId,
  context: providedContext,
  onContentGenerated,
  onSaveToCalendar
}: V4PowerModePanelProps) {
  // State
  const [allInsights, setAllInsights] = useState<InsightCard[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [templateSidebarCollapsed, setTemplateSidebarCollapsed] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<InsightRecipe | null>(null);
  const [activeFramework, setActiveFramework] = useState<PsychologyFramework>('AIDA');
  const [activePlatform, setActivePlatform] = useState<'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok'>('linkedin');
  const [activeFunnelStage, setActiveFunnelStage] = useState<FunnelStage>('TOFU');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [deepContext, setDeepContext] = useState<DeepContext | null>(providedContext || null);
  const [livePreviewContent, setLivePreviewContent] = useState<GeneratedContent | null>(null);
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);

  // FREEZE FIX: Pagination state - never render 100+ items at once
  const INSIGHTS_PER_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(INSIGHTS_PER_PAGE);

  // Refs for debouncing and cancellation
  const lastInsightExtractionRef = useRef<number>(0);
  const insightExtractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const livePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const deepContextLoadedRef = useRef<boolean>(false); // Guard against duplicate loads
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false); // Disabled by default to prevent freeze

  // V4 Hook
  const {
    isGenerating,
    error,
    generateWithControl,
    clearError
  } = useV4ContentGeneration({ uvp, brandId, mode: 'power' });

  // Load DeepContext if not provided
  useEffect(() => {
    async function loadDeepContext() {
      if (!brandId) {
        setIsLoading(false);
        return;
      }

      // PERFORMANCE FIX: Prevent duplicate loads which cause freeze
      if (deepContextLoadedRef.current) {
        console.log('[V4PowerMode] Skipping duplicate DeepContext load');
        return;
      }
      deepContextLoadedRef.current = true;

      // If context was provided, use it directly
      if (providedContext) {
        console.log('[V4PowerMode] Using provided DeepContext');
        setDeepContext(providedContext);
        // FREEZE FIX: Use async chunked extraction with yield points
        const insights = await extractInsightsFromDeepContextAsync(providedContext, uvp, (partialInsights, section) => {
          console.log(`[V4PowerMode] Extracted ${partialInsights.length} insights (${section})`);
        });
        setAllInsights(insights);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadingStatus('Checking for preloaded intelligence...');

      try {
        // Check for preloaded context from UVP flow
        const preloadedContext = dashboardPreloader.getPreloadedContext(brandId);

        if (preloadedContext) {
          console.log('[V4PowerMode] ✅ Using PRELOADED context from UVP flow');
          setDeepContext(preloadedContext);
          // FREEZE FIX: Use async chunked extraction with yield points
          const insights = await extractInsightsFromDeepContextAsync(preloadedContext, uvp, (partialInsights, section) => {
            console.log(`[V4PowerMode] Extracted ${partialInsights.length} insights (${section})`);
          });
          setAllInsights(insights);
          setIsLoading(false);
          return;
        }

        // PROGRESSIVE RENDERING: Extract and show insights AS APIs complete
        // Don't wait for AI synthesis - render local insights immediately
        console.log('[V4PowerMode] Building DeepContext with PROGRESSIVE rendering...');
        setLoadingStatus('Building intelligence context...');

        let lastExtractTime = 0;
        const EXTRACT_THROTTLE_MS = 2000; // Extract insights every 2 seconds max

        const buildResult = await trueProgressiveBuilder.buildTrueProgressive({
          brandId,
          cacheResults: true,
          forceFresh: false,
          includeYouTube: true,
          includeOutScraper: true,
          includeSerper: true,
          includeWebsiteAnalysis: true,
          includeSEMrush: true,
          includeNews: true,
          includeWeather: true,
          includeLinkedIn: true,
          includePerplexity: true,
          includeApify: true,
        }, async (context, metadata) => {
          // PROGRESSIVE RENDERING: Extract and render insights as data arrives
          const now = Date.now();
          setLoadingStatus(`Loading... ${metadata.completedApis.length} APIs complete (${metadata.dataPointsCollected} data points)`);

          // Throttle extraction to prevent freeze - extract every 2 seconds
          if (now - lastExtractTime > EXTRACT_THROTTLE_MS && metadata.dataPointsCollected > 10) {
            lastExtractTime = now;
            setDeepContext(context);
            setIsLoading(false); // Show content early

            // Quick sync extraction for speed (async would be too slow for progressive)
            try {
              const partialInsights = extractInsightsFromDeepContext(context, uvp);
              if (partialInsights.length > 0) {
                console.log(`[V4PowerMode] PROGRESSIVE: ${partialInsights.length} insights from ${metadata.completedApis.length} APIs`);
                setAllInsights(partialInsights);
              }
            } catch (e) {
              // Ignore extraction errors during progressive load
            }
          }
        });

        console.log('[V4PowerMode] DeepContext built:', {
          dataSourcesUsed: buildResult.metadata.dataSourcesUsed,
          dataPointsCollected: buildResult.metadata.dataPointsCollected,
          buildTimeMs: buildResult.metadata.buildTimeMs,
        });

        // Final extraction with complete context
        setDeepContext(buildResult.context);
        setIsLoading(false);

        const insights = await extractInsightsFromDeepContextAsync(buildResult.context, uvp, (partialInsights, section) => {
          if (partialInsights.length > 0) {
            setAllInsights([...partialInsights]);
          }
        });
        setAllInsights(insights);

      } catch (err) {
        console.error('[V4PowerMode] Failed to load DeepContext:', err);
        // Fallback to UVP-only insights - graceful degradation with async extraction
        console.log('[V4PowerMode] Using UVP-only insights as fallback');
        const fallbackInsights = await extractInsightsFromDeepContextAsync({} as DeepContext, uvp);
        setAllInsights(fallbackInsights);
        setLoadingStatus('Loaded UVP insights (API context unavailable)');
        // Don't leave in loading state on error
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadDeepContext();
    // PERMANENT FIX: Only use primitive/stable dependencies
    // - brandId: primitive string, stable
    // - uvp?.valuePropositionStatement: primitive string, stable
    // - providedContext removed: object reference changes each parent render
    // Using ref guard (deepContextLoadedRef) prevents re-runs regardless of dep changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  // Filter insights
  // FREEZE FIX: Use deferred value for non-urgent computations (filter counts)
  const deferredInsights = useDeferredValue(allInsights);

  // Filter insights by type
  const filteredInsights = useMemo(() => {
    if (activeFilter === 'all') return allInsights;
    return allInsights.filter(i => i.type === activeFilter);
  }, [allInsights, activeFilter]);

  // FREEZE FIX: Paginated insights - only render visibleCount items
  // This prevents rendering 100+ items at once which causes the freeze
  const paginatedInsights = useMemo(() => {
    return filteredInsights.slice(0, visibleCount);
  }, [filteredInsights, visibleCount]);

  // FREEZE FIX: Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(INSIGHTS_PER_PAGE);
  }, [activeFilter]);

  // FREEZE FIX: Load more handler
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + INSIGHTS_PER_PAGE);
  }, []);

  // Check if there are more items to load
  const hasMoreInsights = filteredInsights.length > visibleCount;

  // Get selected insight objects
  const selectedInsightObjects = useMemo(() => {
    return allInsights.filter(i => selectedInsights.includes(i.id));
  }, [allInsights, selectedInsights]);

  // Toggle insight selection
  const handleToggleInsight = useCallback((insightId: string) => {
    setSelectedInsights(prev =>
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  }, []);

  // Handle recipe selection
  const handleSelectRecipe = useCallback((recipe: InsightRecipe) => {
    // Filter insights that match the recipe types
    const matchingInsights = allInsights.filter(insight =>
      recipe.insightTypes.includes(insight.type)
    );

    // Sort by confidence and take the top N
    const sortedByConfidence = matchingInsights.sort((a, b) => b.confidence - a.confidence);
    const selected = sortedByConfidence.slice(0, recipe.maxInsights);

    setSelectedInsights(selected.map(i => i.id));
    setActiveFramework(recipe.primaryFramework);
    setSelectedRecipe(recipe);
    setShowTemplateDropdown(false);
  }, [allInsights]);

  // Handle UVP item selection - finds related insights or creates a synthetic insight
  const handleUVPItemSelect = useCallback((item: { type: string; text: string }) => {
    console.log('[V4PowerMode] UVP item selected:', item);

    // Find insights that contain similar text or match the type
    const relatedInsights = allInsights.filter(insight => {
      // Check if insight description contains any words from the UVP item
      const itemWords = item.text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const descriptionMatch = itemWords.some(word =>
        insight.description?.toLowerCase().includes(word) ||
        insight.title?.toLowerCase().includes(word)
      );

      // Also match by category type mapping
      const typeMapping: Record<string, string[]> = {
        'customer': ['customer'],
        'emotional': ['customer'],
        'functional': ['customer'],
        'transformation': ['opportunity'],
        'differentiator': ['competition', 'opportunity'],
        'benefit': ['market', 'opportunity'],
        'metric': ['market'],
        'uvp': ['opportunity', 'customer']
      };

      const matchingTypes = typeMapping[item.type] || [];
      const typeMatch = matchingTypes.includes(insight.type);

      return descriptionMatch || typeMatch;
    });

    if (relatedInsights.length > 0) {
      // Select the most relevant insights (up to 3)
      const toSelect = relatedInsights.slice(0, 3).map(i => i.id);
      setSelectedInsights(prev => {
        const combined = [...new Set([...prev, ...toSelect])];
        return combined;
      });
    }
  }, [allInsights]);

  // Generate content with V4 engine
  const handleGenerate = useCallback(async () => {
    try {
      clearError();
      const content = await generateWithControl({
        platform: activePlatform,
        framework: activeFramework,
        funnelStage: activeFunnelStage,
        tone: 'professional'
      });

      setGeneratedContent(content);
      onContentGenerated?.(content);
    } catch (err) {
      console.error('V4 Power Mode generation failed:', err);
    }
  }, [generateWithControl, activeFramework, activePlatform, activeFunnelStage, clearError, onContentGenerated]);

  // Handle save
  const handleSave = useCallback(() => {
    if (generatedContent && onSaveToCalendar) {
      onSaveToCalendar(generatedContent);
    }
  }, [generatedContent, onSaveToCalendar]);

  // FREEZE FIX: Count insights by type using deferred value (non-blocking)
  // This uses deferredInsights so counts update AFTER main render completes
  const insightCounts = useMemo(() => ({
    all: deferredInsights.length,
    customer: deferredInsights.filter(i => i.type === 'customer').length,
    market: deferredInsights.filter(i => i.type === 'market').length,
    competition: deferredInsights.filter(i => i.type === 'competition').length,
    local: deferredInsights.filter(i => i.type === 'local').length,
    opportunity: deferredInsights.filter(i => i.type === 'opportunity').length,
  }), [deferredInsights]);

  // Auto-generate live preview when selection changes (debounced) - DISABLED BY DEFAULT
  useEffect(() => {
    if (selectedInsights.length === 0) {
      setLivePreviewContent(null);
      return;
    }

    // Skip auto-generation if disabled (prevents page freeze on template select)
    if (!autoGenerateEnabled) {
      console.log('[V4PowerMode] Auto-generation disabled - use Generate button');
      return;
    }

    // Clear any pending generation
    if (livePreviewTimeoutRef.current) {
      clearTimeout(livePreviewTimeoutRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce by 2000ms (increased from 800ms) to avoid generating on rapid selection changes
    livePreviewTimeoutRef.current = setTimeout(async () => {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsLiveGenerating(true);
      try {
        const content = await generateWithControl({
          platform: activePlatform,
          framework: activeFramework,
          funnelStage: activeFunnelStage,
          tone: 'professional'
        });

        // Only set content if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLivePreviewContent(content);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[V4PowerMode] Generation cancelled');
          return;
        }
        console.error('[V4PowerMode] Live preview generation failed:', err);
      } finally {
        setIsLiveGenerating(false);
      }
    }, 2000);

    return () => {
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedInsights, activeFramework, activePlatform, activeFunnelStage, generateWithControl, autoGenerateEnabled]);

  // Cleanup timeouts and abort controller on unmount
  useEffect(() => {
    return () => {
      if (insightExtractionTimeoutRef.current) {
        clearTimeout(insightExtractionTimeoutRef.current);
      }
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual generate function (for explicit Generate button clicks)
  const handleManualGenerate = useCallback(async () => {
    if (selectedInsights.length === 0) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLiveGenerating(true);
    try {
      const content = await generateWithControl({
        platform: activePlatform,
        framework: activeFramework,
        funnelStage: activeFunnelStage,
        tone: 'professional'
      });

      if (!abortControllerRef.current?.signal.aborted) {
        setLivePreviewContent(content);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[V4PowerMode] Generation cancelled');
        return;
      }
      console.error('[V4PowerMode] Manual generation failed:', err);
    } finally {
      setIsLiveGenerating(false);
    }
  }, [selectedInsights, activePlatform, activeFramework, activeFunnelStage, generateWithControl]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 relative">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3 flex-wrap">
        {/* Templates Sidebar Toggle */}
        <button
          onClick={() => setTemplateSidebarCollapsed(!templateSidebarCollapsed)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
          title={templateSidebarCollapsed ? 'Show Templates' : 'Hide Templates'}
        >
          <Layers className="w-4 h-4" />
          <ChevronRight className={`w-4 h-4 transition-transform ${templateSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {selectedRecipe && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
            <span>{selectedRecipe.emoji}</span>
            <span className="font-medium">{selectedRecipe.name}</span>
            <button
              onClick={() => {
                setSelectedRecipe(null);
                setSelectedInsights([]);
                setActiveFramework('AIDA');
              }}
              className="ml-1 hover:text-green-900"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />

        {/* Framework Dropdown */}
        <Select value={activeFramework} onValueChange={(v) => setActiveFramework(v as PsychologyFramework)}>
          <SelectTrigger className="w-36 h-9 text-sm bg-slate-800 border-slate-600 text-white">
            <SelectValue placeholder="Framework" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="AIDA" className="text-white hover:bg-slate-700">AIDA</SelectItem>
            <SelectItem value="PAS" className="text-white hover:bg-slate-700">PAS</SelectItem>
            <SelectItem value="BAB" className="text-white hover:bg-slate-700">BAB</SelectItem>
            <SelectItem value="PASTOR" className="text-white hover:bg-slate-700">PASTOR</SelectItem>
            <SelectItem value="StoryBrand" className="text-white hover:bg-slate-700">StoryBrand</SelectItem>
            <SelectItem value="CuriosityGap" className="text-white hover:bg-slate-700">Curiosity Gap</SelectItem>
            <SelectItem value="PatternInterrupt" className="text-white hover:bg-slate-700">Pattern Interrupt</SelectItem>
            <SelectItem value="SocialProof" className="text-white hover:bg-slate-700">Social Proof</SelectItem>
            <SelectItem value="Scarcity" className="text-white hover:bg-slate-700">Scarcity</SelectItem>
            <SelectItem value="Reciprocity" className="text-white hover:bg-slate-700">Reciprocity</SelectItem>
            <SelectItem value="LossAversion" className="text-white hover:bg-slate-700">Loss Aversion</SelectItem>
            <SelectItem value="Authority" className="text-white hover:bg-slate-700">Authority</SelectItem>
            <SelectItem value="FAB" className="text-white hover:bg-slate-700">FAB</SelectItem>
          </SelectContent>
        </Select>

        {/* Platform Dropdown */}
        <Select value={activePlatform} onValueChange={(v) => setActivePlatform(v as typeof activePlatform)}>
          <SelectTrigger className="w-32 h-9 text-sm bg-slate-800 border-slate-600 text-white">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="linkedin" className="text-white hover:bg-slate-700">LinkedIn</SelectItem>
            <SelectItem value="instagram" className="text-white hover:bg-slate-700">Instagram</SelectItem>
            <SelectItem value="twitter" className="text-white hover:bg-slate-700">Twitter/X</SelectItem>
            <SelectItem value="facebook" className="text-white hover:bg-slate-700">Facebook</SelectItem>
            <SelectItem value="tiktok" className="text-white hover:bg-slate-700">TikTok</SelectItem>
          </SelectContent>
        </Select>

        {/* Funnel Stage Dropdown */}
        <Select value={activeFunnelStage} onValueChange={(v) => setActiveFunnelStage(v as FunnelStage)}>
          <SelectTrigger className="w-28 h-9 text-sm bg-slate-800 border-slate-600 text-white">
            <SelectValue placeholder="Funnel" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="TOFU" className="text-white hover:bg-slate-700">TOFU</SelectItem>
            <SelectItem value="MOFU" className="text-white hover:bg-slate-700">MOFU</SelectItem>
            <SelectItem value="BOFU" className="text-white hover:bg-slate-700">BOFU</SelectItem>
          </SelectContent>
        </Select>

        {/* Generate Button - Primary action */}
        <button
          onClick={handleManualGenerate}
          disabled={selectedInsights.length === 0 || isLiveGenerating || isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            selectedInsights.length === 0 || isLiveGenerating || isGenerating
              ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isLiveGenerating || isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate
            </>
          )}
        </button>

        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {selectedInsights.length} insights selected
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={clearError} className="text-xs text-red-500 hover:underline mt-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Three Columns */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Templates Sidebar (Collapsible Left) */}
        <AnimatePresence initial={false}>
          {!templateSidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="w-[280px] h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {/* Templates Section */}
                  <SidebarSection
                    title="Templates"
                    icon={<Sparkles className="w-4 h-4" />}
                    defaultExpanded={false}
                    badgeCount={TEMPLATE_RECIPES.length}
                  >
                    <div className="space-y-2">
                      {TEMPLATE_RECIPES.map((recipe) => {
                        const matchCount = allInsights.filter(i =>
                          recipe.insightTypes.includes(i.type)
                        ).length;
                        const isSelected = selectedRecipe?.id === recipe.id;

                        return (
                          <button
                            key={recipe.id}
                            onClick={() => handleSelectRecipe(recipe)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600 border-2'
                                : 'bg-gray-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{recipe.emoji}</span>
                              <span className={`text-sm font-bold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                                {recipe.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {recipe.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1 flex-wrap">
                                {recipe.insightTypes.slice(0, 2).map((type) => (
                                  <span
                                    key={type}
                                    className={`px-1.5 py-0.5 text-xs rounded ${typeConfig[type]?.bgColor} ${typeConfig[type]?.color}`}
                                  >
                                    {type.slice(0, 4)}
                                  </span>
                                ))}
                                {recipe.insightTypes.length > 2 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 rounded">
                                    +{recipe.insightTypes.length - 2}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-purple-600 font-medium">
                                {matchCount}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </SidebarSection>

                  {/* UVP Building Blocks */}
                  <UVPBuildingBlocks uvp={uvp} deepContext={deepContext} onSelectItem={handleUVPItemSelect} />
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Middle: Insight Grid */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          {/* Filter Tabs */}
          <div className="flex-shrink-0 flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['all', 'customer', 'market', 'competition', 'local', 'opportunity'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                }`}
              >
                {filter === 'all' ? 'All' : typeConfig[filter].label}
                <span className="ml-1.5 text-xs opacity-70">
                  {insightCounts[filter]}
                </span>
              </button>
            ))}
          </div>

          {/* Insights Grid - Virtualized for Performance */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{loadingStatus}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {allInsights.length > 0 && `${allInsights.length} insights loaded so far...`}
                </p>
              </div>
            ) : filteredInsights.length > 0 ? (
              <>
                {/* FREEZE FIX: Use paginatedInsights (max 20 at a time) instead of all filteredInsights */}
                <CSSGridInsightGrid
                  insights={paginatedInsights}
                  selectedInsights={selectedInsights}
                  onToggle={handleToggleInsight}
                />
                {/* Load More Button - only show if there are more insights to load */}
                {hasMoreInsights && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                    >
                      Load More ({filteredInsights.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No insights found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Your Mix Preview */}
        <div className="w-80 flex-shrink-0 p-4 pl-0">
          <YourMixPreview
            selectedInsights={selectedInsightObjects}
            generatedContent={generatedContent}
            isGenerating={isGenerating}
            framework={activeFramework}
            onRemove={handleToggleInsight}
            onClear={() => setSelectedInsights([])}
            onGenerate={handleGenerate}
            onSave={onSaveToCalendar ? handleSave : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default V4PowerModePanel;
