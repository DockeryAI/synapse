/**
 * Power Mode - Advanced insight selection with recipes
 */

import React, { useState, useMemo } from 'react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { InsightRecipes } from './InsightRecipes';
import { InsightGrid } from './InsightGrid';
import { YourMix } from './YourMix';
import type { InsightCard as InsightCardType } from './types';
import { formatInsightText } from './insightTextFormatter';

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

export function PowerMode({ context, onGenerate }: PowerModeProps) {
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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

    // Local Intelligence - Events
    context.localIntel?.events?.forEach((event, idx) => {
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

    // Local Intelligence - Cultural Moments
    context.localIntel?.culturalMoments?.forEach((moment, idx) => {
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

    // Local Intelligence - Seasonal Context
    if (context.localIntel?.seasonalContext) {
      const seasonal = context.localIntel.seasonalContext;
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
        evidence: pattern.examples || [],
        sources: [{
          source: 'Pattern Recognition',
          quote: pattern.implication,
        }],
        rawData: pattern,
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

  // Handle recipe selection
  const handleSelectRecipe = (insightIds: string[]) => {
    setSelectedInsights(insightIds);
  };

  // Handle generate
  const handleGenerate = () => {
    onGenerate(selectedInsights);
  };

  // Get selected insight objects
  const selectedInsightObjects = allInsights().filter(i => selectedInsights.includes(i.id));

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Left Panel: Recipes (20%) */}
      <div className="w-1/5 min-w-[200px] flex-shrink-0">
        <InsightRecipes
          allInsights={allInsights()}
          onSelectRecipe={handleSelectRecipe}
        />
      </div>

      {/* Center Panel: Insight Grid (60%) */}
      <div className="flex-1">
        <InsightGrid
          insights={filteredInsights}
          selectedInsights={selectedInsights}
          onToggleInsight={handleToggleInsight}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Right Panel: Your Mix (20%) */}
      <div className="w-1/5 min-w-[200px] flex-shrink-0">
        <YourMix
          selectedInsights={selectedInsightObjects}
          context={context}
          onRemove={handleToggleInsight}
          onClear={() => setSelectedInsights([])}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}
