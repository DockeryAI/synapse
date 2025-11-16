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

    // Check for local/location-based insights
    if (connection.category === 'location' || connection.category === 'local') {
      category = 'local';
      displayTitle = `Local: ${insight.contentAngle}`;
      dataSource = 'Location Intelligence';
    }
    // Check for trending/cultural insights
    else if (connection.category === 'trending' || connection.category === 'cultural') {
      category = 'trending';
      displayTitle = `Trending: ${insight.contentAngle}`;
      dataSource = 'Cultural Intelligence';
    }
    // Check for seasonal insights
    else if (connection.category === 'temporal' || connection.category === 'seasonal') {
      category = 'seasonal';
      displayTitle = `Seasonal: ${insight.contentAngle}`;
      dataSource = 'Seasonal Patterns';
    }
    // Check for competitive insights
    else if (connection.category === 'competitive') {
      category = 'competitive';
      displayTitle = `Competitive: ${insight.contentAngle}`;
      dataSource = 'Competitive Analysis';
    }
    // Check for review-based insights
    else if (connection.category === 'social_proof' || connection.category === 'reviews') {
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
        category: 'local',
        type: 'location',
        from: 'market',
        to: 'health',
        strength: 0.8,
        reasoning: 'Local market trend'
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
        category: 'trending',
        type: 'viral_moment',
        from: 'tiktok',
        to: 'engagement',
        strength: 0.9,
        reasoning: 'Viral content opportunity'
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
        category: 'seasonal',
        type: 'temporal',
        from: 'q4',
        to: 'bookings',
        strength: 0.75,
        reasoning: 'Seasonal pattern'
      },
      metadata: {
        generatedAt: new Date(),
        model: 'gpt-4-turbo'
      }
    }
  ];

  return categorizeInsights(mockInsights);
}
