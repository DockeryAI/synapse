/**
 * Insight Categorization Utilities
 *
 * Helper functions to categorize insights from DeepContext
 * into the 6 categories used by Content Mixer:
 * - Local, Trending, Seasonal, Industry, Reviews, Competitive
 */

import type { SynapseInsight } from '@/types/synapse/synapse.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type {
  CategorizedInsight,
  InsightCategory,
  InsightPool
} from '@/types/content-mixer.types';

/**
 * Categorize a single insight based on its properties
 */
export function categorizeInsight(insight: SynapseInsight, context?: DeepContext): CategorizedInsight {
  let category: InsightCategory;
  let displayTitle: string;
  let dataSource: string;

  // Determine category based on insight type and content
  if (insight.sourceConnection) {
    const connection = insight.sourceConnection;
    // Handle both Connection and simplified connection structures
    const connectionType = connection.type || 'cross_domain';

    // Check for local/location-based insights
    if (connectionType === 'location_event' || connectionType === 'local_trend') {
      category = 'local';
      displayTitle = `Local: ${insight.contentAngle}`;
      dataSource = 'Location Intelligence';
    }
    // Check for trending/cultural insights
    else if (connectionType === 'cultural_moment' || connectionType === 'trending_topic') {
      category = 'trending';
      displayTitle = `Trending: ${insight.contentAngle}`;
      dataSource = 'Cultural Intelligence';
    }
    // Check for seasonal insights
    else if (connectionType === 'seasonal_pattern') {
      category = 'seasonal';
      displayTitle = `Seasonal: ${insight.contentAngle}`;
      dataSource = 'Seasonal Patterns';
    }
    // Check for competitive insights
    else if (connectionType === 'competitive_gap') {
      category = 'competitive';
      displayTitle = `Competitive: ${insight.contentAngle}`;
      dataSource = 'Competitive Analysis';
    }
    // Check for review-based insights
    else if (connectionType === 'customer_insight') {
      category = 'reviews';
      displayTitle = `Review Insight: ${insight.contentAngle}`;
      dataSource = 'Customer Reviews';
    }
    // Default to industry
    else {
      category = 'industry';
      displayTitle = `Industry: ${insight.contentAngle}`;
      dataSource = 'Industry Intelligence';
    }
  } else {
    // Fallback categorization based on insight type
    if (insight.type === 'cultural_moment') {
      category = 'trending';
      displayTitle = `Cultural: ${insight.contentAngle}`;
      dataSource = 'Cultural Analysis';
    } else if (insight.type === 'predictive_opportunity') {
      category = 'seasonal';
      displayTitle = `Opportunity: ${insight.contentAngle}`;
      dataSource = 'Predictive Analysis';
    } else {
      category = 'industry';
      displayTitle = insight.contentAngle;
      dataSource = 'AI Analysis';
    }
  }

  return {
    ...insight,
    category,
    displayTitle,
    dataSource
  };
}

/**
 * Categorize a list of insights into an InsightPool
 */
export function categorizeInsights(
  insights: SynapseInsight[],
  context?: DeepContext
): InsightPool {
  const categorized = insights.map(insight => categorizeInsight(insight, context));

  // Group by category
  const byCategory: Record<InsightCategory, CategorizedInsight[]> = {
    local: [],
    trending: [],
    seasonal: [],
    industry: [],
    reviews: [],
    competitive: []
  };

  categorized.forEach(insight => {
    byCategory[insight.category].push(insight);
  });

  // Count per category
  const countByCategory: Record<InsightCategory, number> = {
    local: byCategory.local.length,
    trending: byCategory.trending.length,
    seasonal: byCategory.seasonal.length,
    industry: byCategory.industry.length,
    reviews: byCategory.reviews.length,
    competitive: byCategory.competitive.length
  };

  return {
    byCategory,
    totalCount: categorized.length,
    countByCategory
  };
}

/**
 * Create mock insights for testing
 */
export function createMockInsightPool(): InsightPool {
  const mockInsights: SynapseInsight[] = [
    {
      id: '1',
      type: 'cultural_moment',
      thinkingStyle: 'cultural',
      insight: 'Local farmers market sees 40% increase in organic produce sales',
      whyProfound: 'Reflects growing health consciousness in community',
      whyNow: 'Perfect timing with New Year health resolutions',
      contentAngle: 'Health-Conscious Community Trend',
      expectedReaction: 'Interest from health-focused businesses',
      evidence: ['Market data', 'Sales reports'],
      confidence: 0.85,
      sourceConnection: {
        id: 'c1',
        type: 'location_event',
        sources: {
          primary: { id: 'dp1', source: 'outscraper' as any, type: 'local_event', content: 'market', metadata: {}, createdAt: new Date() },
          secondary: { id: 'dp2', source: 'website' as any, type: 'trending_topic', content: 'health', metadata: {}, createdAt: new Date() },
        },
        relationship: { semanticSimilarity: 0.8, unexpectedness: 0.7, strength: 'strong' as any, explanation: 'Local market trend' },
        breakthroughPotential: { score: 85, reasoning: ['Local market trend'], contentAngle: 'Health-Conscious Community Trend', expectedImpact: 'high' as any },
        discoveredAt: new Date(),
        confidence: 0.85,
      },
      metadata: {
        generatedAt: new Date(),
        model: 'claude-opus-4'
      }
    },
    {
      id: '2',
      type: 'cultural_moment',
      thinkingStyle: 'cultural',
      insight: 'TikTok dance challenge goes viral with 5M+ views',
      whyProfound: 'Shows power of user-generated content',
      whyNow: 'Trending right now',
      contentAngle: 'Viral TikTok Moment',
      expectedReaction: 'High engagement potential',
      evidence: ['Social media analytics'],
      confidence: 0.92,
      sourceConnection: {
        id: 'c2',
        type: 'cultural_moment',
        sources: {
          primary: { id: 'dp3', source: 'tiktok' as any, type: 'trending_topic', content: 'tiktok', metadata: {}, createdAt: new Date() },
          secondary: { id: 'dp4', source: 'website' as any, type: 'customer_trigger', content: 'engagement', metadata: {}, createdAt: new Date() },
        },
        relationship: { semanticSimilarity: 0.9, unexpectedness: 0.85, strength: 'strong' as any, explanation: 'Viral content opportunity' },
        breakthroughPotential: { score: 92, reasoning: ['Viral content opportunity'], contentAngle: 'Viral TikTok Moment', expectedImpact: 'high' as any },
        discoveredAt: new Date(),
        confidence: 0.92,
      },
      metadata: {
        generatedAt: new Date(),
        model: 'claude-opus-4'
      }
    },
    {
      id: '3',
      type: 'predictive_opportunity',
      thinkingStyle: 'analytical',
      insight: 'Q4 typically sees 30% increase in service bookings',
      whyProfound: 'Seasonal pattern offers predictable opportunity',
      whyNow: 'Approaching Q4 season',
      contentAngle: 'Q4 Booking Surge',
      expectedReaction: 'Planning for seasonal demand',
      evidence: ['Historical data'],
      confidence: 0.78,
      sourceConnection: {
        id: 'c3',
        type: 'seasonal_pattern',
        sources: {
          primary: { id: 'dp5', source: 'google_trends' as any, type: 'market_trend', content: 'q4', metadata: {}, createdAt: new Date() },
          secondary: { id: 'dp6', source: 'website' as any, type: 'timing', content: 'bookings', metadata: {}, createdAt: new Date() },
        },
        relationship: { semanticSimilarity: 0.75, unexpectedness: 0.6, strength: 'moderate' as any, explanation: 'Seasonal pattern' },
        breakthroughPotential: { score: 78, reasoning: ['Seasonal pattern'], contentAngle: 'Q4 Booking Surge', expectedImpact: 'medium' as any },
        discoveredAt: new Date(),
        confidence: 0.78,
      },
      metadata: {
        generatedAt: new Date(),
        model: 'gpt-4-turbo'
      }
    }
  ];

  return categorizeInsights(mockInsights);
}
