/**
 * Opportunity Radar Service
 * Detects and classifies content opportunities with three-tier alert system
 */

import { v4 as uuid } from 'uuid';
import type {
  OpportunityAlert,
  OpportunityTier,
  OpportunitySource,
  OpportunityRadarConfig,
} from '@/types/v2/intelligence.types';

const DEFAULT_CONFIG: OpportunityRadarConfig = {
  refreshInterval: 300000, // 5 minutes
  maxAlerts: 50,
  tierThresholds: {
    urgent: 80,
    highValue: 50,
  },
  enabledSources: [
    'trending-topic',
    'weather-trigger',
    'seasonal',
    'competitor-gap',
    'customer-pain',
    'market-shift',
    'news-event',
  ],
};

export class OpportunityRadarService {
  private config: OpportunityRadarConfig;
  private alerts: OpportunityAlert[] = [];

  constructor(config?: Partial<OpportunityRadarConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect opportunities from all enabled sources
   */
  async detectOpportunities(
    dataPoints: DataPoint[],
    industry?: string
  ): Promise<OpportunityAlert[]> {
    const newAlerts: OpportunityAlert[] = [];

    for (const source of this.config.enabledSources) {
      const sourceAlerts = await this.detectFromSource(source, dataPoints, industry);
      newAlerts.push(...sourceAlerts);
    }

    // Sort by urgency and limit
    const sorted = newAlerts.sort((a, b) => b.urgencyScore - a.urgencyScore);
    this.alerts = sorted.slice(0, this.config.maxAlerts);

    return this.alerts;
  }

  /**
   * Detect opportunities from a specific source
   */
  private async detectFromSource(
    source: OpportunitySource,
    dataPoints: DataPoint[],
    industry?: string
  ): Promise<OpportunityAlert[]> {
    switch (source) {
      case 'trending-topic':
        return this.detectTrendingTopics(dataPoints);
      case 'weather-trigger':
        return this.detectWeatherTriggers(industry);
      case 'seasonal':
        return this.detectSeasonalOpportunities(industry);
      case 'competitor-gap':
        return this.detectCompetitorGaps(dataPoints);
      case 'customer-pain':
        return this.detectCustomerPains(dataPoints);
      case 'market-shift':
        return this.detectMarketShifts(dataPoints);
      case 'news-event':
        return this.detectNewsEvents(dataPoints);
      default:
        return [];
    }
  }

  /**
   * Detect trending topics from data points
   */
  private detectTrendingTopics(dataPoints: DataPoint[]): OpportunityAlert[] {
    const alerts: OpportunityAlert[] = [];

    // Group data points by keywords and find trends
    const keywordCounts = new Map<string, number>();
    const keywordGrowth = new Map<string, number>();

    for (const dp of dataPoints) {
      if (dp.keywords) {
        for (const keyword of dp.keywords) {
          const count = keywordCounts.get(keyword) || 0;
          keywordCounts.set(keyword, count + 1);
        }
      }
    }

    // Find keywords with high frequency
    for (const [keyword, count] of keywordCounts.entries()) {
      if (count >= 3) {
        const urgencyScore = Math.min(count * 15, 100);
        const tier = this.classifyTier(urgencyScore);

        alerts.push({
          id: uuid(),
          tier,
          title: `Trending: ${keyword}`,
          description: `"${keyword}" is appearing frequently in your data points. Consider creating content around this topic.`,
          source: 'trending-topic',
          urgencyScore,
          potentialImpact: Math.min(count * 10, 100),
          relevanceScore: 85,
          suggestedTemplates: ['trend-jacker', 'data-revelation', 'guide-snippet'],
          suggestedTriggers: ['curiosity', 'fomo', 'authority'],
          expiresAt: this.getExpirationDate(tier),
          detectedAt: new Date().toISOString(),
          metadata: {
            keywords: [keyword],
            trendData: {
              volume: count,
              growth: keywordGrowth.get(keyword) || 0,
            },
          },
        });
      }
    }

    return alerts;
  }

  /**
   * Detect weather-based opportunities
   */
  private detectWeatherTriggers(industry?: string): OpportunityAlert[] {
    // Simulated weather data - in production, integrate with weather API
    const currentMonth = new Date().getMonth();
    const alerts: OpportunityAlert[] = [];

    // Winter opportunities (Nov-Feb)
    if (currentMonth >= 10 || currentMonth <= 1) {
      alerts.push({
        id: uuid(),
        tier: 'high-value',
        title: 'Winter Season Content',
        description: 'Create seasonal content around winter themes, end-of-year planning, or fresh starts.',
        source: 'weather-trigger',
        urgencyScore: 65,
        potentialImpact: 70,
        relevanceScore: 80,
        suggestedTemplates: ['seasonal', 'transformation', 'guide-snippet'],
        suggestedTriggers: ['hope', 'urgency', 'anticipation'],
        expiresAt: this.getExpirationDate('high-value'),
        detectedAt: new Date().toISOString(),
        metadata: {
          weatherData: {
            condition: 'winter',
            temperature: 35,
            location: 'general',
          },
        },
      });
    }

    return alerts;
  }

  /**
   * Detect seasonal opportunities
   */
  private detectSeasonalOpportunities(industry?: string): OpportunityAlert[] {
    const alerts: OpportunityAlert[] = [];
    const now = new Date();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();

    // End of month - planning content
    if (dayOfMonth >= 25) {
      alerts.push({
        id: uuid(),
        tier: 'high-value',
        title: 'Month-End Planning',
        description: 'End of month is approaching. Create content about monthly reviews, goal setting, or upcoming month preparation.',
        source: 'seasonal',
        urgencyScore: 60,
        potentialImpact: 65,
        relevanceScore: 75,
        suggestedTemplates: ['guide-snippet', 'transformation', 'quick-win'],
        suggestedTriggers: ['achievement', 'clarity', 'motivation'],
        detectedAt: new Date().toISOString(),
        metadata: {},
      });
    }

    // Q4 - year-end content
    if (month >= 9) {
      alerts.push({
        id: uuid(),
        tier: 'evergreen',
        title: 'Year-End Content Opportunity',
        description: 'Q4 is ideal for year-in-review, lessons learned, and 2025 planning content.',
        source: 'seasonal',
        urgencyScore: 45,
        potentialImpact: 80,
        relevanceScore: 85,
        suggestedTemplates: ['data-revelation', 'transformation', 'guide-snippet'],
        suggestedTriggers: ['reflection', 'achievement', 'anticipation'],
        detectedAt: new Date().toISOString(),
        metadata: {},
      });
    }

    return alerts;
  }

  /**
   * Detect competitor gaps
   */
  private detectCompetitorGaps(dataPoints: DataPoint[]): OpportunityAlert[] {
    const alerts: OpportunityAlert[] = [];

    // Look for data points mentioning competitors or market gaps
    const gapPoints = dataPoints.filter(
      dp => dp.type === 'competitor-intel' || dp.tags?.includes('gap')
    );

    for (const dp of gapPoints) {
      alerts.push({
        id: uuid(),
        tier: this.classifyTier(70),
        title: `Competitor Gap: ${dp.title || 'Market Opportunity'}`,
        description: dp.content || 'A competitor gap has been identified that you could exploit.',
        source: 'competitor-gap',
        urgencyScore: 70,
        potentialImpact: 75,
        relevanceScore: 80,
        suggestedTemplates: ['contrarian', 'comparison', 'myth-buster'],
        suggestedTriggers: ['differentiation', 'authority', 'trust'],
        detectedAt: new Date().toISOString(),
        metadata: {
          competitorData: {
            competitor: dp.source || 'Unknown',
            gap: dp.content || '',
          },
        },
      });
    }

    return alerts;
  }

  /**
   * Detect customer pain points
   */
  private detectCustomerPains(dataPoints: DataPoint[]): OpportunityAlert[] {
    const alerts: OpportunityAlert[] = [];

    // Look for pain points in data
    const painPoints = dataPoints.filter(
      dp => dp.type === 'pain-point' || dp.sentiment === 'negative'
    );

    // Cluster similar pains
    const painClusters = new Map<string, DataPoint[]>();
    for (const dp of painPoints) {
      const key = dp.keywords?.[0] || 'general';
      const existing = painClusters.get(key) || [];
      painClusters.set(key, [...existing, dp]);
    }

    for (const [pain, points] of painClusters.entries()) {
      if (points.length >= 2) {
        const urgencyScore = Math.min(points.length * 20 + 50, 100);
        alerts.push({
          id: uuid(),
          tier: this.classifyTier(urgencyScore),
          title: `Customer Pain: ${pain}`,
          description: `Multiple customers are experiencing issues with "${pain}". This is a high-value content opportunity.`,
          source: 'customer-pain',
          urgencyScore,
          potentialImpact: 85,
          relevanceScore: 90,
          suggestedTemplates: ['mistake-exposer', 'hidden-cost', 'quick-win', 'transformation'],
          suggestedTriggers: ['empathy', 'relief', 'trust'],
          detectedAt: new Date().toISOString(),
          metadata: {
            keywords: [pain],
          },
        });
      }
    }

    return alerts;
  }

  /**
   * Detect market shifts
   */
  private detectMarketShifts(dataPoints: DataPoint[]): OpportunityAlert[] {
    const alerts: OpportunityAlert[] = [];

    const marketPoints = dataPoints.filter(
      dp => dp.type === 'market-intel' || dp.tags?.includes('shift')
    );

    for (const dp of marketPoints) {
      alerts.push({
        id: uuid(),
        tier: 'urgent',
        title: `Market Shift: ${dp.title || 'Industry Change'}`,
        description: dp.content || 'A significant market shift has been detected.',
        source: 'market-shift',
        urgencyScore: 85,
        potentialImpact: 90,
        relevanceScore: 85,
        suggestedTemplates: ['trend-jacker', 'contrarian', 'data-revelation'],
        suggestedTriggers: ['fomo', 'authority', 'urgency'],
        expiresAt: this.getExpirationDate('urgent'),
        detectedAt: new Date().toISOString(),
        metadata: {
          keywords: dp.keywords,
        },
      });
    }

    return alerts;
  }

  /**
   * Detect news events
   */
  private detectNewsEvents(dataPoints: DataPoint[]): OpportunityAlert[] {
    const alerts: OpportunityAlert[] = [];

    const newsPoints = dataPoints.filter(dp => dp.type === 'news');

    for (const dp of newsPoints) {
      const urgencyScore = dp.priority === 'high' ? 90 : dp.priority === 'medium' ? 70 : 50;
      alerts.push({
        id: uuid(),
        tier: this.classifyTier(urgencyScore),
        title: `News: ${dp.title || 'Breaking Story'}`,
        description: dp.content || 'A news event relevant to your industry has occurred.',
        source: 'news-event',
        urgencyScore,
        potentialImpact: 80,
        relevanceScore: 75,
        suggestedTemplates: ['trend-jacker', 'expert-roundup', 'contrarian'],
        suggestedTriggers: ['curiosity', 'fomo', 'authority'],
        expiresAt: this.getExpirationDate(this.classifyTier(urgencyScore)),
        detectedAt: new Date().toISOString(),
        metadata: {
          keywords: dp.keywords,
        },
      });
    }

    return alerts;
  }

  /**
   * Classify opportunity into tier based on urgency score
   */
  private classifyTier(urgencyScore: number): OpportunityTier {
    if (urgencyScore >= this.config.tierThresholds.urgent) {
      return 'urgent';
    } else if (urgencyScore >= this.config.tierThresholds.highValue) {
      return 'high-value';
    }
    return 'evergreen';
  }

  /**
   * Get expiration date based on tier
   */
  private getExpirationDate(tier: OpportunityTier): string {
    const now = new Date();
    switch (tier) {
      case 'urgent':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      case 'high-value':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    }
  }

  /**
   * Get alerts filtered by tier
   */
  getAlertsByTier(tier: OpportunityTier): OpportunityAlert[] {
    return this.alerts.filter(alert => alert.tier === tier);
  }

  /**
   * Get alerts filtered by source
   */
  getAlertsBySource(source: OpportunitySource): OpportunityAlert[] {
    return this.alerts.filter(alert => alert.source === source);
  }

  /**
   * Get all current alerts
   */
  getAllAlerts(): OpportunityAlert[] {
    return [...this.alerts];
  }

  /**
   * Get urgent alerts (expiring within 24 hours)
   */
  getUrgentAlerts(): OpportunityAlert[] {
    return this.alerts.filter(alert => alert.tier === 'urgent');
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OpportunityRadarConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): OpportunityRadarConfig {
    return { ...this.config };
  }
}

// Helper type for data points
interface DataPoint {
  id: string;
  title?: string;
  content: string;
  type?: string;
  source?: string;
  keywords?: string[];
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  priority?: 'high' | 'medium' | 'low';
  createdAt?: string;
}

// Export singleton instance
export const opportunityRadar = new OpportunityRadarService();

export default OpportunityRadarService;
