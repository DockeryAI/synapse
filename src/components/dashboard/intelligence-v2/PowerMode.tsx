/**
 * Power Mode - Advanced insight selection with template dropdown
 *
 * Layout:
 * - Full-width insights grid (80%)
 * - YourMix preview panel (20%)
 * - Template dropdown overlay when clicking "Templates" button
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Sparkles, Zap } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { InsightGrid } from './InsightGrid';
import { YourMix } from './YourMix';
import type { InsightCard as InsightCardType, InsightRecipe, InsightType } from './types';
import { formatInsightText } from './insightTextFormatter';
import type { FrameworkType } from '@/services/synapse/generation/ContentFrameworkLibrary';

export interface PowerModeProps {
  context: DeepContext;
  onGenerate: (selectedInsights: string[]) => void;
}

type FilterType = 'all' | 'customer' | 'market' | 'competition' | 'local' | 'opportunity';

/**
 * Extracts platform name from source string
 * Examples: "Google review" → "Google Reviews", "youtube comment" → "YouTube"
 */
function extractPlatform(sourceText: string): string {
  const lower = sourceText.toLowerCase();

  if (lower.includes('google') && (lower.includes('review') || lower.includes('rating'))) {
    return 'Google Reviews';
  }
  if (lower.includes('yelp')) {
    return 'Yelp';
  }
  if (lower.includes('youtube')) {
    return 'YouTube';
  }
  if (lower.includes('facebook') || lower.includes('fb')) {
    return 'Facebook';
  }
  if (lower.includes('twitter') || lower.includes('x.com')) {
    return 'Twitter/X';
  }
  if (lower.includes('instagram') || lower.includes('ig')) {
    return 'Instagram';
  }
  if (lower.includes('linkedin')) {
    return 'LinkedIn';
  }

  // Return original if no platform detected
  return sourceText;
}

/**
 * Extracts actual quote from evidence array
 */
function extractQuote(evidence: any): string | undefined {
  if (!evidence) return undefined;

  if (Array.isArray(evidence)) {
    // Look for quotes in evidence array
    const quoted = evidence.find((e: any) => {
      const str = typeof e === 'string' ? e : String(e);
      return str.includes('"') || str.length > 20;
    });

    if (quoted) {
      const str = typeof quoted === 'string' ? quoted : String(quoted);
      // Remove surrounding quotes if present
      return str.replace(/^["']|["']$/g, '');
    }
  } else if (typeof evidence === 'string') {
    return evidence.replace(/^["']|["']$/g, '');
  }

  return undefined;
}

/**
 * Formats timestamp as relative date
 */
function formatTimestamp(timestamp: string | undefined): string | undefined {
  if (!timestamp) return undefined;

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return timestamp;
  }
}

// Template recipes with frameworks and compatible campaign types
const TEMPLATE_RECIPES: InsightRecipe[] = [
  {
    id: 'authority',
    name: 'Authority Builder',
    description: 'Build credibility and expertise with data-driven content',
    icon: 'target',
    emoji: '🎯',
    insightTypes: ['market', 'competition', 'opportunity'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'aida',
    compatibleTemplates: ['Authority Builder', 'Education First', 'Comparison Campaign', 'Hero\'s Journey', 'Trust Ladder'],
  },
  {
    id: 'trust',
    name: 'Trust Builder',
    description: 'Build customer confidence with social proof and stories',
    icon: 'heart',
    emoji: '🤝',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'hook-story-offer',
    compatibleTemplates: ['Social Proof', 'Trust Ladder', 'Hero\'s Journey', 'Authority Builder'],
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Address pain points directly with PAS framework',
    icon: 'lightbulb',
    emoji: '💡',
    insightTypes: ['customer', 'competition', 'opportunity'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'problem-agitate-solution',
    compatibleTemplates: ['PAS Series', 'BAB Campaign', 'Quick Win', 'Objection Crusher', 'Value Stack'],
  },
  {
    id: 'viral',
    name: 'Viral Content',
    description: 'Trending and shareable content that spreads',
    icon: 'flame',
    emoji: '🚀',
    insightTypes: ['market', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'curiosity-gap',
    compatibleTemplates: ['Seasonal Urgency', 'Scarcity Sequence', 'Product Launch', 'RACE Journey'],
  },
  {
    id: 'local',
    name: 'Local Champion',
    description: 'Community-focused content with local relevance',
    icon: 'map-pin',
    emoji: '📍',
    insightTypes: ['local', 'customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'before-after-bridge',
    compatibleTemplates: ['Social Proof', 'Quick Win', 'PAS Series', 'Trust Ladder'],
  },
  {
    id: 'conversion',
    name: 'Conversion Driver',
    description: 'Direct response content optimized for action',
    icon: 'target',
    emoji: '💰',
    insightTypes: ['customer', 'opportunity', 'competition'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'aida',
    compatibleTemplates: ['Value Stack', 'Scarcity Sequence', 'Objection Crusher', 'Quick Win'],
  },
  {
    id: 'launch',
    name: 'Product Launch',
    description: 'Create buzz and anticipation for new products or features',
    icon: 'rocket',
    emoji: '🎉',
    insightTypes: ['market', 'customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'aida',
    compatibleTemplates: ['Product Launch', 'RACE Journey', 'Hero\'s Journey', 'Value Stack', 'Seasonal Urgency'],
  },
  {
    id: 'education',
    name: 'Education First',
    description: 'Lead with value and educate your audience',
    icon: 'book',
    emoji: '📚',
    insightTypes: ['market', 'customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 6,
    primaryFramework: 'problem-agitate-solution',
    compatibleTemplates: ['Education First', 'Authority Builder', 'Trust Ladder', 'Hero\'s Journey'],
  },
  {
    id: 'comparison',
    name: 'Competitive Edge',
    description: 'Position against competitors with clear differentiation',
    icon: 'scale',
    emoji: '⚖️',
    insightTypes: ['competition', 'market', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'aida',
    compatibleTemplates: ['Comparison Campaign', 'Authority Builder', 'Objection Crusher', 'Value Stack'],
  },
  {
    id: 'quick-win',
    name: 'Quick Wins',
    description: 'Fast results with minimal friction',
    icon: 'zap',
    emoji: '⚡',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 1,
    maxInsights: 4,
    primaryFramework: 'before-after-bridge',
    compatibleTemplates: ['Quick Win', 'PAS Series', 'BAB Campaign', 'Seasonal Urgency'],
  },
  // Content Bible Best Practices - Additional Recipes
  {
    id: 'objection-crusher',
    name: 'Objection Crusher',
    description: 'Address common objections head-on with proof',
    icon: 'shield',
    emoji: '🛡️',
    insightTypes: ['customer', 'competition', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'problem-agitate-solution',
    compatibleTemplates: ['Objection Crusher', 'Trust Ladder', 'Social Proof', 'Value Stack'],
  },
  {
    id: 'scarcity',
    name: 'Scarcity & Urgency',
    description: 'Create FOMO with time-sensitive offers',
    icon: 'clock',
    emoji: '⏰',
    insightTypes: ['market', 'opportunity', 'customer'],
    minInsights: 2,
    maxInsights: 4,
    primaryFramework: 'aida',
    compatibleTemplates: ['Scarcity Sequence', 'Seasonal Urgency', 'Product Launch', 'Quick Win'],
  },
  {
    id: 'story-seller',
    name: 'Story Seller',
    description: 'Use narratives to connect emotionally',
    icon: 'book-open',
    emoji: '📖',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'hook-story-offer',
    compatibleTemplates: ['Hero\'s Journey', 'Trust Ladder', 'Social Proof', 'BAB Campaign'],
  },
  {
    id: 'value-stack',
    name: 'Value Stacker',
    description: 'Build irresistible offers with stacked value',
    icon: 'layers',
    emoji: '📦',
    insightTypes: ['customer', 'opportunity', 'competition'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'aida',
    compatibleTemplates: ['Value Stack', 'Objection Crusher', 'Comparison Campaign', 'Product Launch'],
  },
  {
    id: 'social-proof',
    name: 'Social Proof Engine',
    description: 'Leverage testimonials and case studies',
    icon: 'users',
    emoji: '👥',
    insightTypes: ['customer', 'local'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'hook-story-offer',
    compatibleTemplates: ['Social Proof', 'Trust Ladder', 'Hero\'s Journey', 'Authority Builder'],
  },
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Hook attention with knowledge gaps',
    icon: 'help-circle',
    emoji: '🤔',
    insightTypes: ['market', 'opportunity', 'customer'],
    minInsights: 2,
    maxInsights: 4,
    primaryFramework: 'curiosity-gap',
    compatibleTemplates: ['RACE Journey', 'Education First', 'Authority Builder', 'Viral Content'],
  },
  // Additional Content Bible recipes
  {
    id: '4ps-framework',
    name: '4Ps Framework',
    description: 'Promise, Picture, Proof, Push structure',
    icon: 'target',
    emoji: '🎯',
    insightTypes: ['customer', 'opportunity', 'market'],
    minInsights: 2,
    maxInsights: 4,
    primaryFramework: 'aida',
    compatibleTemplates: ['Value Stack', 'Trust Ladder', 'BAB Campaign', 'Quick Win'],
  },
  {
    id: 'storybrand',
    name: 'StoryBrand Method',
    description: 'Customer as hero, you as guide',
    icon: 'compass',
    emoji: '🧭',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'hook-story-offer',
    compatibleTemplates: ['Hero\'s Journey', 'Trust Ladder', 'Education First', 'Social Proof'],
  },
  {
    id: 'feature-benefit',
    name: 'Feature-Advantage-Benefit',
    description: 'Transform features into emotional benefits',
    icon: 'trending-up',
    emoji: '📈',
    insightTypes: ['customer', 'competition', 'market'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'problem-agitate-solution',
    compatibleTemplates: ['Comparison Campaign', 'Value Stack', 'Trust Ladder', 'Product Launch'],
  },
  {
    id: 'transformation-arc',
    name: 'Transformation Arc',
    description: 'Before/after emotional journey',
    icon: 'refresh-cw',
    emoji: '🔄',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 2,
    maxInsights: 4,
    primaryFramework: 'before-after-bridge',
    compatibleTemplates: ['BAB Campaign', 'Hero\'s Journey', 'Social Proof', 'Trust Ladder'],
  },
];

export function PowerMode({ context, onGenerate }: PowerModeProps) {
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeFramework, setActiveFramework] = useState<FrameworkType | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<InsightRecipe | null>(null);

  // Convert DeepContext into InsightCards
  // NOTE: Removed useMemo to force recalculation with new parsing logic
  const allInsights = (): InsightCardType[] => {
    const insights: InsightCardType[] = [];

    // Industry Trends
    context.industry?.trends?.forEach((trend, idx) => {
      // Preserve the specific insight
      const formatted = formatInsightText(trend.trend, 'market');

      // Parse evidence into bullets if semicolon-separated
      const evidenceArray = trend.evidence
        ? (Array.isArray(trend.evidence)
            ? trend.evidence
            : trend.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      // Extract platform and quote
      const sourceText = trend.source || 'Industry Analysis';
      const platform = extractPlatform(sourceText);
      const actualQuote = extractQuote(trend.evidence);

      insights.push({
        id: `trend-${idx}`,
        type: 'market',
        title: formatted.title,
        category: 'Market Trend',
        confidence: trend.strength || 0.75,
        isTimeSensitive: false,
        description: formatted.overview,
        evidence: evidenceArray,
        sources: [{
          source: platform,
          quote: actualQuote,
          timestamp: formatTimestamp(trend.timestamp),
        }],
        rawData: trend,
      });
    });

    // Customer Psychology - Unarticulated Needs
    context.customerPsychology?.unarticulated?.forEach((need, idx) => {
      // Preserve the specific insight
      const formatted = formatInsightText(need.need, 'customer', need.marketingAngle);

      // Parse evidence into array if it's a string with semicolons
      const evidenceArray = need.evidence
        ? (Array.isArray(need.evidence)
            ? need.evidence
            : need.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      // Extract real quote from evidence
      const actualQuote = extractQuote(need.evidence) || need.emotionalDriver;

      // Determine platform from source or evidence
      const sourceText = need.source || evidenceArray[0] || 'Customer Research';
      const platform = extractPlatform(sourceText);

      insights.push({
        id: `customer-need-${idx}`,
        type: 'customer',
        title: formatted.title,
        category: 'Customer Need',
        confidence: need.confidence || 0.8,
        isTimeSensitive: false,
        description: formatted.overview,
        actionableInsight: need.marketingAngle,
        evidence: evidenceArray,
        sources: [{
          source: platform,
          quote: actualQuote,
          timestamp: formatTimestamp(need.timestamp),
        }],
        rawData: need,
      });
    });

    // Customer Psychology - Emotional Triggers
    context.customerPsychology?.emotional?.forEach((trigger, idx) => {
      const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
      const conciseTitle = triggerText.split(/[,.]|and |but /)[0].trim();

      // Extract actual source from trigger context (e.g., "From Google Reviews")
      let actualSource = 'Customer Psychology';
      if (typeof trigger === 'object' && trigger.context) {
        // Parse "From Google Reviews" -> "Google Reviews"
        actualSource = trigger.context.replace(/^From\s+/i, '').trim() || 'Customer Psychology';
      }

      insights.push({
        id: `customer-trigger-${idx}`,
        type: 'customer',
        title: conciseTitle,
        category: 'Emotional Trigger',
        confidence: typeof trigger === 'object' ? trigger.strength : 0.85,
        isTimeSensitive: false,
        description: triggerText,
        sources: [{
          source: actualSource,
          quote: typeof trigger === 'object' ? trigger.leverage : undefined,
        }],
        rawData: trigger,
      });
    });

    // Competitive Intelligence - Blind Spots
    context.competitiveIntel?.blindSpots?.forEach((blindspot, idx) => {
      // Preserve the specific insight
      const formatted = formatInsightText(blindspot.topic, 'competition', blindspot.actionableInsight);

      // Parse evidence into bullets
      const evidenceArray = blindspot.evidence
        ? (Array.isArray(blindspot.evidence)
            ? blindspot.evidence
            : blindspot.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      // Extract source and quote
      const sourceText = blindspot.source || 'Competitive Analysis';
      const platform = extractPlatform(sourceText);
      const actualQuote = extractQuote(blindspot.evidence) || blindspot.reasoning;

      insights.push({
        id: `competition-blindspot-${idx}`,
        type: 'competition',
        title: formatted.title,
        category: 'Competitor Blindspot',
        confidence: blindspot.opportunityScore ? blindspot.opportunityScore / 100 : 0.8,
        isTimeSensitive: false,
        description: formatted.overview,
        evidence: evidenceArray,
        actionableInsight: blindspot.actionableInsight,
        sources: [{
          source: platform,
          quote: actualQuote,
          timestamp: formatTimestamp(blindspot.timestamp),
        }],
        rawData: blindspot,
      });
    });

    // Competitive Intelligence - Market Gaps
    context.competitiveIntel?.opportunities?.forEach((gap, idx) => {
      // Preserve the specific insight
      const formatted = formatInsightText(gap.gap, 'opportunity', gap.positioning);

      // Parse evidence into bullets
      const evidenceArray = gap.evidence
        ? (Array.isArray(gap.evidence)
            ? gap.evidence
            : gap.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      // Extract source and quote
      const sourceText = gap.source || 'Market Gap Analysis';
      const platform = extractPlatform(sourceText);
      const actualQuote = extractQuote(gap.evidence);

      insights.push({
        id: `opportunity-gap-${idx}`,
        type: 'opportunity',
        title: formatted.title,
        category: 'Market Gap',
        confidence: gap.confidence || 0.85,
        isTimeSensitive: false,
        description: formatted.overview,
        evidence: evidenceArray,
        actionableInsight: gap.positioning,
        sources: [{
          source: platform,
          quote: actualQuote,
          timestamp: formatTimestamp(gap.timestamp),
        }],
        rawData: gap,
      });
    });

    // Local Intelligence - Events (from realTimeCultural)
    (context.realTimeCultural?.events as any[])?.forEach((event, idx) => {
      const eventName = event.name || event.title || String(event);
      // Keep full event name
      const title = eventName;

      insights.push({
        id: `local-event-${idx}`,
        type: 'local',
        title: title,
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

    // Local Intelligence - Cultural Moments (from realTimeCultural)
    (context.realTimeCultural?.moments as any[])?.forEach((moment, idx) => {
      const momentText = typeof moment === 'string' ? moment : moment.description || 'Cultural Moment';
      const conciseTitle = momentText.split(/[,.]|where |during /)[0].trim();

      insights.push({
        id: `local-moment-${idx}`,
        type: 'local',
        title: conciseTitle,
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

    // Local Intelligence - Seasonal Context (from realTimeCultural)
    if (context.realTimeCultural?.seasonalContext) {
      const seasonal = (context.realTimeCultural as any).seasonalContext;
      const seasonalText = typeof seasonal === 'string' ? seasonal : seasonal.context;

      if (seasonalText) {
        const conciseTitle = seasonalText.split(/[,.]|during |in /)[0].trim();

        insights.push({
          id: 'local-seasonal',
          type: 'local',
          title: conciseTitle,
          category: 'Seasonal Trend',
          confidence: 0.9,
          isTimeSensitive: true,
          description: seasonalText,
          sources: [{
            source: 'Seasonal Context Analysis',
          }],
          rawData: seasonal,
        });
      }
    }

    // Synthesis - Key Insights
    context.synthesis?.keyInsights?.forEach((insight, idx) => {
      if (typeof insight === 'string') {
        const conciseTitle = insight.split(/[,.]|that |which /)[0].trim();

        insights.push({
          id: `synthesis-${idx}`,
          type: 'opportunity',
          title: conciseTitle,
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

    // Hidden Patterns
    context.synthesis?.hiddenPatterns?.forEach((pattern, idx) => {
      const conciseTitle = pattern.pattern.split(/[,.]|where |when /)[0].trim();

      insights.push({
        id: `pattern-${idx}`,
        type: 'opportunity',
        title: conciseTitle,
        category: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern`,
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
    // This bypasses the categorization limits and shows everything
    // ============================================================================
    context.rawDataPoints?.forEach((dp, idx) => {
      // Map data point type to insight type (using InsightType values only)
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

      // Determine category based on metadata
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

      // Create concise title from content
      const content = dp.content || '';
      const conciseTitle = content.length > 60
        ? content.substring(0, 60).split(/[,.]|that |which /)[0].trim() + '...'
        : content.split(/[,.]|that |which /)[0].trim();

      // Skip if empty (lowered from 10 chars to allow shorter insights)
      if (conciseTitle.length < 3) return;

      insights.push({
        id: `raw-${dp.id || idx}`,
        type: insightType,
        title: conciseTitle,
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
    // These are the breakthrough opportunities found by the correlation engine
    // ============================================================================
    context.correlatedInsights?.forEach((ci, idx) => {
      // Map correlation type to insight type (using InsightType values only)
      const typeMap: Record<string, InsightType> = {
        'validated_pain': 'customer',
        'psychological_breakthrough': 'customer',
        'competitive_gap': 'competition',
        'timing_opportunity': 'local',
        'hidden_pattern': 'opportunity',
      };

      const insightType: InsightType = typeMap[ci.type] || 'opportunity';

      // Determine category with emoji for breakthrough insights
      const categoryMap: Record<string, string> = {
        'validated_pain': '✓ Validated Pain Point',
        'psychological_breakthrough': '🧠 Psychological Breakthrough',
        'competitive_gap': '🎯 Competitive Gap',
        'timing_opportunity': '⏰ Timing Opportunity',
        'hidden_pattern': '🔍 Hidden Pattern',
      };
      const category = categoryMap[ci.type] || 'Correlated Insight';

      // Build evidence from sources
      const evidenceList = ci.sources.map(s =>
        `${s.source}: "${s.content.substring(0, 80)}..." (${Math.round(s.confidence * 100)}% confidence)`
      );

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
        sources: ci.sources.map(s => ({
          source: extractPlatform(s.source),
          quote: s.content.substring(0, 100),
        })),
        rawData: ci,
      });
    });

    // ============================================================================
    // BREAKTHROUGH OPPORTUNITIES - Rich multi-source validated insights
    // These are the "holy shit" moments with full UVP validation
    // ============================================================================
    context.synthesis?.breakthroughs?.forEach((bt, idx) => {
      // Determine type based on breakthrough characteristics
      let insightType: InsightType = 'opportunity';
      if (bt.uvpValidation) {
        insightType = 'customer'; // UVP validated = customer insight
      } else if (bt.competitive) {
        insightType = 'competition';
      } else if (bt.timing?.isTimeSensitive) {
        insightType = 'local';
      }

      // Build rich category with connection type and stars
      const stars = '⭐'.repeat(bt.confidenceStars);
      const connectionBadge = bt.connectionType === '5-way' ? '🔥 5-WAY' :
                              bt.connectionType === '4-way' ? '💎 4-WAY' :
                              bt.connectionType === '3-way' ? '✨ 3-WAY' : '';
      const category = `${connectionBadge} Breakthrough ${stars}`;

      // Build rich evidence with UVP validation
      const evidenceList: string[] = [];
      if (bt.uvpValidation) {
        evidenceList.push(`✓ UVP VALIDATED: "${bt.uvpValidation.painPoint}" (${bt.uvpValidation.matchScore}% match)`);
        bt.uvpValidation.evidence.forEach(e => evidenceList.push(`  └ ${e}`));
      }
      evidenceList.push(`Psychology: ${bt.psychology.triggerCategory} trigger, ${bt.psychology.emotion} emotion`);
      evidenceList.push(`Sources: ${bt.sources.join(', ')} (${bt.sources.length} independent sources)`);
      if (bt.timing?.isTimeSensitive) {
        evidenceList.push(`⏰ TIME SENSITIVE: ${bt.timing.reason || 'Act now'}`);
      }
      if (bt.competitive?.gap) {
        evidenceList.push(`🎯 COMPETITOR GAP: ${bt.competitive.gap}`);
      }
      evidenceList.push(`EQ Score: ${bt.eqScore}/100 | Urgency: ${bt.psychology.urgency.toUpperCase()}`);

      insights.push({
        id: `breakthrough-${bt.id || idx}`,
        type: insightType,
        title: bt.title,
        category,
        confidence: bt.score / 100,
        isTimeSensitive: bt.timing?.isTimeSensitive || bt.psychology.urgency === 'critical',
        description: bt.hook,
        actionableInsight: bt.actionPlan,
        evidence: evidenceList,
        sources: bt.sources.map(s => ({
          source: extractPlatform(s),
        })),
        rawData: bt,
      });
    });

    return insights;
  };

  // Filter insights based on active filter
  const filteredInsights = useMemo(() => {
    const insights = allInsights();
    if (activeFilter === 'all') return insights;
    return insights.filter(i => i.type === activeFilter);
  }, [context, activeFilter]);

  // Handle insight selection
  const handleToggleInsight = (insightId: string) => {
    setSelectedInsights(prev =>
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  // Handle recipe selection with framework
  const handleSelectRecipe = (recipe: InsightRecipe) => {
    // Filter insights that match the recipe types
    const insights = allInsights();
    const matchingInsights = insights.filter(insight =>
      recipe.insightTypes.includes(insight.type)
    );

    // Sort by confidence and take the top N
    const sortedByConfidence = matchingInsights.sort((a, b) => b.confidence - a.confidence);
    const selected = sortedByConfidence.slice(0, recipe.maxInsights);

    setSelectedInsights(selected.map(i => i.id));
    setActiveFramework(recipe.primaryFramework as FrameworkType || null);
    setSelectedRecipe(recipe);
    setShowTemplateDropdown(false);
  };

  // Handle generate
  const handleGenerate = () => {
    onGenerate(selectedInsights);
  };

  // Get selected insight objects
  const selectedInsightObjects = allInsights().filter(i => selectedInsights.includes(i.id));

  // Count insights by type for template badges
  const insightCounts = useMemo(() => {
    const insights = allInsights();
    return {
      customer: insights.filter(i => i.type === 'customer').length,
      market: insights.filter(i => i.type === 'market').length,
      competition: insights.filter(i => i.type === 'competition').length,
      opportunity: insights.filter(i => i.type === 'opportunity').length,
      local: insights.filter(i => i.type === 'local').length,
    };
  }, [context]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Template Dropdown Button Bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center gap-4">
        <button
          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            showTemplateDropdown
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Templates
          <ChevronDown className={`w-4 h-4 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
        </button>

        {selectedRecipe && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
            <span>{selectedRecipe.emoji}</span>
            <span className="font-medium">{selectedRecipe.name}</span>
            <button
              onClick={() => {
                setSelectedRecipe(null);
                setSelectedInsights([]);
                setActiveFramework(null);
              }}
              className="ml-1 hover:text-green-900 dark:hover:text-green-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {selectedInsights.length} insights selected
        </div>
      </div>

      {/* Template Dropdown Overlay */}
      <AnimatePresence>
        {showTemplateDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 max-h-[70vh] overflow-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Choose a Template
                </h3>
                <button
                  onClick={() => setShowTemplateDropdown(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {TEMPLATE_RECIPES.map((recipe) => {
                  // Count matching insights for this recipe
                  const matchCount = allInsights().filter(i =>
                    recipe.insightTypes.includes(i.type)
                  ).length;

                  return (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      className="text-left p-4 bg-gray-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{recipe.emoji}</span>
                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {recipe.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {recipe.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {recipe.insightTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {matchCount} insights
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-1">
                          {recipe.compatibleTemplates?.slice(0, 3).map((template, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                            >
                              {template}
                            </span>
                          ))}
                          {(recipe.compatibleTemplates?.length || 0) > 3 && (
                            <span className="text-xs text-purple-500">
                              +{(recipe.compatibleTemplates?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Insight Grid (80%) - Full width now */}
        <div className="flex-1 overflow-auto">
          <InsightGrid
            insights={filteredInsights}
            selectedInsights={selectedInsights}
            onToggleInsight={handleToggleInsight}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Right Panel: Your Mix (20%) */}
        <div className="w-80 flex-shrink-0">
          <YourMix
            selectedInsights={selectedInsightObjects}
            context={context}
            onRemove={handleToggleInsight}
            onClear={() => setSelectedInsights([])}
            onGenerate={handleGenerate}
            framework={activeFramework}
          />
        </div>
      </div>
    </div>
  );
}
