/**
 * Performance Tracker Service
 *
 * Tracks post-publication performance and creates feedback loop
 * Learns from actual results to improve future predictions
 *
 * Created: 2025-11-23
 */

export interface ContentPerformance {
  contentId: string;
  breakthroughId: string;
  publishedAt: Date;
  platform: string;
  metrics: {
    impressions: number;
    engagement: number; // likes, comments, shares
    clicks: number;
    conversions: number;
  };
  actualVsPredicted: {
    engagementDiff: number; // % difference
    conversionDiff: number;
    accuracy: number; // 0-1
  };
}

export interface LearningInsight {
  pattern: string;
  observation: string;
  recommendation: string;
  confidence: number;
  basedOnSamples: number;
}

class PerformanceTrackerService {
  private performanceHistory: ContentPerformance[] = [];

  /**
   * Records performance of published content
   */
  public recordPerformance(performance: ContentPerformance): void {
    this.performanceHistory.push(performance);
    this.analyzeAndLearn(performance);
  }

  /**
   * Analyzes performance and generates learning insights
   */
  private analyzeAndLearn(performance: ContentPerformance): void {
    // Calculate accuracy
    const engagementAccuracy = 1 - Math.abs(performance.actualVsPredicted.engagementDiff) / 100;
    const conversionAccuracy = 1 - Math.abs(performance.actualVsPredicted.conversionDiff) / 100;
    performance.actualVsPredicted.accuracy = (engagementAccuracy + conversionAccuracy) / 2;

    // Store learning for future predictions
    // In production, this would update ML models or weights
    console.log('Learning from performance:', {
      contentId: performance.contentId,
      accuracy: performance.actualVsPredicted.accuracy,
      platform: performance.platform
    });
  }

  /**
   * Gets learning insights from performance history
   */
  public getLearningInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    if (this.performanceHistory.length === 0) {
      return insights;
    }

    // Example: Platform performance patterns
    const platformPerformance = this.groupByPlatform();
    Object.entries(platformPerformance).forEach(([platform, performances]) => {
      const avgEngagement = performances.reduce((sum, p) => sum + p.metrics.engagement, 0) / performances.length;

      if (avgEngagement > 100) {
        insights.push({
          pattern: `${platform} high engagement`,
          observation: `${platform} content averages ${Math.round(avgEngagement)} engagements`,
          recommendation: `Prioritize ${platform} for future content distribution`,
          confidence: 0.8,
          basedOnSamples: performances.length
        });
      } else if (avgEngagement < 50 && performances.length >= 3) {
        insights.push({
          pattern: `${platform} low engagement`,
          observation: `${platform} content averages only ${Math.round(avgEngagement)} engagements`,
          recommendation: `Review content strategy for ${platform} or reduce allocation`,
          confidence: 0.7,
          basedOnSamples: performances.length
        });
      }
    });

    // Example: Conversion patterns
    const avgConversions = this.performanceHistory.reduce((sum, p) => sum + p.metrics.conversions, 0) / this.performanceHistory.length;
    if (avgConversions > 10) {
      insights.push({
        pattern: 'High conversion content',
        observation: `Content averages ${Math.round(avgConversions)} conversions per piece`,
        recommendation: 'Continue current content strategy and increase distribution',
        confidence: 0.85,
        basedOnSamples: this.performanceHistory.length
      });
    }

    // Example: Accuracy improvements over time
    const recentPerformances = this.performanceHistory.slice(-10);
    const avgAccuracy = recentPerformances.reduce((sum, p) => sum + p.actualVsPredicted.accuracy, 0) / recentPerformances.length;
    if (avgAccuracy > 0.8) {
      insights.push({
        pattern: 'Improving prediction accuracy',
        observation: `Recent predictions ${Math.round(avgAccuracy * 100)}% accurate`,
        recommendation: 'Trust performance predictions for future content decisions',
        confidence: 0.9,
        basedOnSamples: recentPerformances.length
      });
    }

    return insights;
  }

  /**
   * Groups performance by platform
   */
  private groupByPlatform(): Record<string, ContentPerformance[]> {
    const grouped: Record<string, ContentPerformance[]> = {};

    this.performanceHistory.forEach(perf => {
      if (!grouped[perf.platform]) {
        grouped[perf.platform] = [];
      }
      grouped[perf.platform].push(perf);
    });

    return grouped;
  }

  /**
   * Gets performance for a specific content piece
   */
  public getPerformance(contentId: string): ContentPerformance | undefined {
    return this.performanceHistory.find(p => p.contentId === contentId);
  }

  /**
   * Gets all performance records
   */
  public getAllPerformance(): ContentPerformance[] {
    return [...this.performanceHistory];
  }

  /**
   * Gets performance statistics
   */
  public getStatistics(): {
    totalContent: number;
    totalImpressions: number;
    totalEngagement: number;
    totalConversions: number;
    avgAccuracy: number;
    platformBreakdown: Record<string, number>;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        totalContent: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalConversions: 0,
        avgAccuracy: 0,
        platformBreakdown: {}
      };
    }

    const totalImpressions = this.performanceHistory.reduce((sum, p) => sum + p.metrics.impressions, 0);
    const totalEngagement = this.performanceHistory.reduce((sum, p) => sum + p.metrics.engagement, 0);
    const totalConversions = this.performanceHistory.reduce((sum, p) => sum + p.metrics.conversions, 0);
    const avgAccuracy = this.performanceHistory.reduce((sum, p) => sum + p.actualVsPredicted.accuracy, 0) / this.performanceHistory.length;

    const platformBreakdown: Record<string, number> = {};
    this.performanceHistory.forEach(p => {
      platformBreakdown[p.platform] = (platformBreakdown[p.platform] || 0) + 1;
    });

    return {
      totalContent: this.performanceHistory.length,
      totalImpressions,
      totalEngagement,
      totalConversions,
      avgAccuracy,
      platformBreakdown
    };
  }

  /**
   * Clears performance history (for testing/reset)
   */
  public clearHistory(): void {
    this.performanceHistory = [];
  }
}

export const performanceTrackerService = new PerformanceTrackerService();
