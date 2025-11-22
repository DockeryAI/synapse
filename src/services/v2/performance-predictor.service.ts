/**
 * Performance Predictor Service
 * Aggregates template predictions and provides industry benchmarks
 */

export interface PerformancePrediction {
  expectedCTR: number;
  expectedEngagement: number;
  expectedConversion: number;
  expectedROI?: number;
  confidenceScore: number;
  factors: PerformanceFactor[];
}

export interface PerformanceFactor {
  name: string;
  impact: number; // percentage impact
  description: string;
  positive: boolean;
}

export interface IndustryBenchmark {
  industryCode: string;
  industryName: string;
  avgCTR: number;
  avgEngagement: number;
  avgConversion: number;
  avgROI: number;
}

export interface AggregatedPrediction {
  prediction: PerformancePrediction;
  benchmark: IndustryBenchmark;
  comparison: {
    ctrVsBenchmark: number;
    engagementVsBenchmark: number;
    conversionVsBenchmark: number;
    roiVsBenchmark?: number;
  };
  overallScore: number;
  recommendation: string;
}

export class PerformancePredictorService {
  // Industry benchmarks based on Content Bible research
  private readonly industryBenchmarks: Record<string, IndustryBenchmark> = {
    '524210': {
      industryCode: '524210',
      industryName: 'Insurance',
      avgCTR: 2.1,
      avgEngagement: 1.2,
      avgConversion: 1.5,
      avgROI: 2.5,
    },
    '541511': {
      industryCode: '541511',
      industryName: 'SaaS/Software',
      avgCTR: 2.8,
      avgEngagement: 1.5,
      avgConversion: 2.0,
      avgROI: 3.5,
    },
    '621111': {
      industryCode: '621111',
      industryName: 'Healthcare',
      avgCTR: 1.8,
      avgEngagement: 1.3,
      avgConversion: 1.2,
      avgROI: 2.8,
    },
    '523110': {
      industryCode: '523110',
      industryName: 'Finance',
      avgCTR: 2.0,
      avgEngagement: 1.1,
      avgConversion: 1.8,
      avgROI: 3.2,
    },
    '531210': {
      industryCode: '531210',
      industryName: 'Real Estate',
      avgCTR: 2.4,
      avgEngagement: 1.4,
      avgConversion: 1.6,
      avgROI: 3.0,
    },
    default: {
      industryCode: 'default',
      industryName: 'General',
      avgCTR: 2.2,
      avgEngagement: 1.3,
      avgConversion: 1.5,
      avgROI: 3.0,
    },
  };

  /**
   * Predict performance for a template selection
   */
  predictPerformance(
    templateId: string,
    templateType: 'content' | 'campaign',
    industryCode?: string,
    additionalFactors?: Partial<PerformanceFactor>[]
  ): PerformancePrediction {
    const baseMetrics = this.getBaseMetrics(templateId, templateType);
    const factors = this.analyzeFactors(templateId, templateType, additionalFactors);

    // Calculate final metrics with factor adjustments
    const factorMultiplier = this.calculateFactorMultiplier(factors);

    return {
      expectedCTR: Math.round(baseMetrics.ctr * factorMultiplier * 10) / 10,
      expectedEngagement: Math.round(baseMetrics.engagement * factorMultiplier * 10) / 10,
      expectedConversion: Math.round(baseMetrics.conversion * factorMultiplier * 10) / 10,
      expectedROI: baseMetrics.roi
        ? Math.round(baseMetrics.roi * factorMultiplier * 10) / 10
        : undefined,
      confidenceScore: this.calculateConfidence(factors),
      factors,
    };
  }

  /**
   * Get aggregated prediction with industry comparison
   */
  getAggregatedPrediction(
    templateId: string,
    templateType: 'content' | 'campaign',
    industryCode?: string,
    additionalFactors?: Partial<PerformanceFactor>[]
  ): AggregatedPrediction {
    const prediction = this.predictPerformance(
      templateId,
      templateType,
      industryCode,
      additionalFactors
    );

    const benchmark = this.getBenchmark(industryCode);

    const comparison = {
      ctrVsBenchmark: Math.round((prediction.expectedCTR / benchmark.avgCTR - 1) * 100),
      engagementVsBenchmark: Math.round(
        (prediction.expectedEngagement / benchmark.avgEngagement - 1) * 100
      ),
      conversionVsBenchmark: Math.round(
        (prediction.expectedConversion / benchmark.avgConversion - 1) * 100
      ),
      roiVsBenchmark: prediction.expectedROI
        ? Math.round((prediction.expectedROI / benchmark.avgROI - 1) * 100)
        : undefined,
    };

    const overallScore = this.calculateOverallScore(comparison);
    const recommendation = this.generateRecommendation(overallScore, comparison);

    return {
      prediction,
      benchmark,
      comparison,
      overallScore,
      recommendation,
    };
  }

  /**
   * Get industry benchmark
   */
  getBenchmark(industryCode?: string): IndustryBenchmark {
    if (industryCode && this.industryBenchmarks[industryCode]) {
      return this.industryBenchmarks[industryCode];
    }
    return this.industryBenchmarks.default;
  }

  /**
   * Get base metrics for template
   */
  private getBaseMetrics(
    templateId: string,
    templateType: 'content' | 'campaign'
  ): { ctr: number; engagement: number; conversion: number; roi?: number } {
    if (templateType === 'campaign') {
      return this.getCampaignBaseMetrics(templateId);
    }
    return this.getContentBaseMetrics(templateId);
  }

  /**
   * Get base metrics for content templates
   */
  private getContentBaseMetrics(templateId: string): {
    ctr: number;
    engagement: number;
    conversion: number;
  } {
    const metrics: Record<string, { ctr: number; engagement: number; conversion: number }> = {
      curiosity_gap: { ctr: 4.7, engagement: 2.0, conversion: 2.5 },
      pattern_interrupt: { ctr: 5.2, engagement: 2.5, conversion: 2.8 },
      specific_number: { ctr: 3.6, engagement: 1.8, conversion: 2.2 },
      contrarian: { ctr: 4.5, engagement: 2.2, conversion: 2.6 },
      mistake_exposer: { ctr: 3.8, engagement: 1.9, conversion: 2.4 },
      hidden_cost: { ctr: 4.2, engagement: 2.1, conversion: 2.7 },
      quick_win: { ctr: 3.5, engagement: 1.7, conversion: 2.3 },
      transformation: { ctr: 4.0, engagement: 2.3, conversion: 2.8 },
      failure_to_success: { ctr: 3.8, engagement: 2.0, conversion: 2.5 },
      behind_the_scenes: { ctr: 3.2, engagement: 1.8, conversion: 2.0 },
      myth_buster: { ctr: 4.4, engagement: 2.1, conversion: 2.6 },
      guide_snippet: { ctr: 3.0, engagement: 1.6, conversion: 2.1 },
      comparison: { ctr: 4.1, engagement: 1.9, conversion: 2.5 },
      trend_jacker: { ctr: 4.8, engagement: 2.4, conversion: 2.7 },
      deadline_driver: { ctr: 4.3, engagement: 2.0, conversion: 3.0 },
      seasonal: { ctr: 3.9, engagement: 1.8, conversion: 2.4 },
      data_revelation: { ctr: 3.7, engagement: 1.9, conversion: 2.3 },
      expert_roundup: { ctr: 3.3, engagement: 1.7, conversion: 2.1 },
      case_study: { ctr: 3.5, engagement: 2.0, conversion: 2.6 },
      challenge_post: { ctr: 4.6, engagement: 2.6, conversion: 2.4 },
    };

    return metrics[templateId] || { ctr: 3.5, engagement: 1.8, conversion: 2.2 };
  }

  /**
   * Get base metrics for campaign templates
   */
  private getCampaignBaseMetrics(templateId: string): {
    ctr: number;
    engagement: number;
    conversion: number;
    roi: number;
  } {
    const metrics: Record<
      string,
      { ctr: number; engagement: number; conversion: number; roi: number }
    > = {
      race_journey: { ctr: 4.2, engagement: 2.5, conversion: 3.5, roi: 4.5 },
      pas_series: { ctr: 3.8, engagement: 2.2, conversion: 3.2, roi: 3.8 },
      bab_campaign: { ctr: 4.0, engagement: 2.3, conversion: 3.3, roi: 4.0 },
      trust_ladder: { ctr: 3.5, engagement: 2.8, conversion: 3.0, roi: 4.2 },
      heros_journey: { ctr: 4.5, engagement: 3.0, conversion: 3.8, roi: 5.0 },
      product_launch: { ctr: 4.8, engagement: 2.4, conversion: 4.0, roi: 4.8 },
      seasonal_urgency: { ctr: 5.0, engagement: 2.6, conversion: 4.2, roi: 4.5 },
      authority_builder: { ctr: 3.2, engagement: 2.2, conversion: 2.8, roi: 3.5 },
      comparison_campaign: { ctr: 4.4, engagement: 2.1, conversion: 3.4, roi: 4.0 },
      education_first: { ctr: 3.0, engagement: 2.5, conversion: 2.6, roi: 3.8 },
      social_proof: { ctr: 3.8, engagement: 2.4, conversion: 3.2, roi: 4.2 },
      objection_crusher: { ctr: 4.2, engagement: 2.3, conversion: 3.6, roi: 4.5 },
      quick_win_campaign: { ctr: 4.6, engagement: 2.0, conversion: 3.0, roi: 3.5 },
      scarcity_sequence: { ctr: 5.2, engagement: 2.5, conversion: 4.0, roi: 4.8 },
      value_stack: { ctr: 4.0, engagement: 2.2, conversion: 3.4, roi: 4.0 },
    };

    return metrics[templateId] || { ctr: 3.5, engagement: 2.0, conversion: 3.0, roi: 3.5 };
  }

  /**
   * Analyze performance factors
   */
  private analyzeFactors(
    templateId: string,
    templateType: 'content' | 'campaign',
    additionalFactors?: Partial<PerformanceFactor>[]
  ): PerformanceFactor[] {
    const factors: PerformanceFactor[] = [];

    // Template-specific factors
    if (templateType === 'campaign') {
      factors.push({
        name: 'Multi-piece narrative',
        impact: 20,
        description: 'Campaign arc builds engagement over time',
        positive: true,
      });
    }

    // Add common positive factors
    if (
      templateId.includes('urgency') ||
      templateId.includes('deadline') ||
      templateId.includes('scarcity')
    ) {
      factors.push({
        name: 'Urgency trigger',
        impact: 15,
        description: 'Time-sensitive messaging increases action',
        positive: true,
      });
    }

    if (
      templateId.includes('proof') ||
      templateId.includes('case') ||
      templateId.includes('transformation')
    ) {
      factors.push({
        name: 'Social proof',
        impact: 12,
        description: 'Evidence-based content builds trust',
        positive: true,
      });
    }

    // Add any additional factors
    if (additionalFactors) {
      for (const factor of additionalFactors) {
        if (factor.name && factor.impact !== undefined) {
          factors.push({
            name: factor.name,
            impact: factor.impact,
            description: factor.description || '',
            positive: factor.positive ?? true,
          });
        }
      }
    }

    return factors;
  }

  /**
   * Calculate multiplier from factors
   */
  private calculateFactorMultiplier(factors: PerformanceFactor[]): number {
    let multiplier = 1.0;

    for (const factor of factors) {
      const adjustment = factor.impact / 100;
      if (factor.positive) {
        multiplier += adjustment;
      } else {
        multiplier -= adjustment;
      }
    }

    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(factors: PerformanceFactor[]): number {
    // Base confidence of 70%
    let confidence = 70;

    // More factors = higher confidence
    confidence += Math.min(factors.length * 5, 20);

    // Positive factors increase confidence
    const positiveCount = factors.filter((f) => f.positive).length;
    confidence += positiveCount * 2;

    return Math.min(confidence, 95);
  }

  /**
   * Calculate overall score from comparison
   */
  private calculateOverallScore(comparison: {
    ctrVsBenchmark: number;
    engagementVsBenchmark: number;
    conversionVsBenchmark: number;
    roiVsBenchmark?: number;
  }): number {
    const scores = [
      comparison.ctrVsBenchmark,
      comparison.engagementVsBenchmark,
      comparison.conversionVsBenchmark,
    ];

    if (comparison.roiVsBenchmark !== undefined) {
      scores.push(comparison.roiVsBenchmark);
    }

    const avgImprovement = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Convert to 0-100 score (0% improvement = 50, 100%+ = 100)
    return Math.min(100, Math.max(0, 50 + avgImprovement / 2));
  }

  /**
   * Generate recommendation based on score
   */
  private generateRecommendation(
    overallScore: number,
    comparison: { ctrVsBenchmark: number; engagementVsBenchmark: number }
  ): string {
    if (overallScore >= 80) {
      return 'Excellent choice! This template is expected to significantly outperform industry benchmarks.';
    } else if (overallScore >= 65) {
      return 'Good selection. This template should deliver above-average results for your industry.';
    } else if (overallScore >= 50) {
      return 'Solid choice. Expected to meet industry benchmarks with room for optimization.';
    } else {
      return 'Consider alternative templates for better performance potential.';
    }
  }
}

// Export singleton instance
export const performancePredictor = new PerformancePredictorService();
