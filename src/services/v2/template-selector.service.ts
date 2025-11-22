/**
 * Template Selector Service
 * Smart template selection based on connection types, data patterns, and breakthrough scores
 */

import type {
  ContentTemplate,
  CampaignTemplate,
  TemplateMatch,
  TemplateSelectionCriteria,
  ContentTemplateId,
  CampaignTemplateId,
  CONTENT_TEMPLATE_IDS,
  CAMPAIGN_TEMPLATE_IDS,
} from '@/types/v2';
import type { DataPointType, ContentPurpose } from '@/types/v2';

export interface DataPointPattern {
  type: DataPointType;
  weight: number;
  keywords?: string[];
}

export interface ConnectionAnalysis {
  connectionType: 'two_way' | 'three_way' | 'multi_way';
  dataPoints: DataPointPattern[];
  strength: number;
  breakthroughScore?: number;
}

export interface TemplateRecommendation {
  templateId: string;
  templateName: string;
  templateType: 'content' | 'campaign';
  matchScore: number;
  matchReasons: string[];
  expectedPerformance: {
    ctrImprovement: number;
    engagementMultiplier: number;
    roiEstimate?: number;
  };
}

export class TemplateSelectorService {
  // Pattern to template mappings
  private readonly patternMappings: Record<DataPointType, string[]> = {
    trend: ['trend_jacker', 'seasonal', 'deadline_driver'],
    competitor_gap: ['contrarian', 'comparison', 'hidden_cost'],
    customer_pain: ['hidden_cost', 'mistake_exposer', 'problem_solution'],
    success_story: ['transformation', 'case_study', 'behind_the_scenes'],
    industry_insight: ['data_revelation', 'myth_buster', 'expert_roundup'],
    seasonal_trigger: ['seasonal', 'seasonal_urgency', 'deadline_driver'],
    news_event: ['trend_jacker', 'pattern_interrupt', 'contrarian'],
    review: ['transformation', 'social_proof', 'case_study'],
    social_signal: ['challenge_post', 'curiosity_gap', 'specific_number'],
  };

  // Score-based campaign template mappings
  private readonly scoreBasedCampaigns: Record<string, string[]> = {
    premium: ['heros_journey', 'race_journey', 'trust_ladder'], // 85+
    authority: ['authority_builder', 'education_first', 'social_proof'], // 70-84
    quickwin: ['quick_win_campaign', 'pas_series', 'value_stack'], // 60-69
  };

  /**
   * Select best template based on connection analysis
   */
  selectTemplate(analysis: ConnectionAnalysis): TemplateRecommendation {
    const { connectionType, dataPoints, breakthroughScore } = analysis;

    // Determine if we need content or campaign template
    const needsCampaign = this.shouldUseCampaign(connectionType, breakthroughScore);

    if (needsCampaign) {
      return this.selectCampaignTemplate(analysis);
    } else {
      return this.selectContentTemplate(analysis);
    }
  }

  /**
   * Get multiple template recommendations ranked by match score
   */
  getRecommendations(
    analysis: ConnectionAnalysis,
    limit: number = 3
  ): TemplateRecommendation[] {
    const needsCampaign = this.shouldUseCampaign(
      analysis.connectionType,
      analysis.breakthroughScore
    );

    const recommendations: TemplateRecommendation[] = [];

    if (needsCampaign) {
      // Get campaign recommendations
      const campaignRecs = this.getAllCampaignMatches(analysis);
      recommendations.push(...campaignRecs);
    } else {
      // Get content recommendations
      const contentRecs = this.getAllContentMatches(analysis);
      recommendations.push(...contentRecs);
    }

    // Sort by match score and return top N
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Determine if connection should use campaign vs content template
   */
  private shouldUseCampaign(
    connectionType: string,
    breakthroughScore?: number
  ): boolean {
    // 3+ way connections suggest campaign
    if (connectionType === 'three_way' || connectionType === 'multi_way') {
      return true;
    }

    // High breakthrough scores (85+) suggest campaign
    if (breakthroughScore && breakthroughScore >= 85) {
      return true;
    }

    return false;
  }

  /**
   * Select best content template
   */
  private selectContentTemplate(
    analysis: ConnectionAnalysis
  ): TemplateRecommendation {
    const matches = this.getAllContentMatches(analysis);
    return matches[0] || this.getDefaultContentTemplate();
  }

  /**
   * Select best campaign template
   */
  private selectCampaignTemplate(
    analysis: ConnectionAnalysis
  ): TemplateRecommendation {
    const matches = this.getAllCampaignMatches(analysis);
    return matches[0] || this.getDefaultCampaignTemplate();
  }

  /**
   * Get all content template matches with scores
   */
  private getAllContentMatches(
    analysis: ConnectionAnalysis
  ): TemplateRecommendation[] {
    const { dataPoints } = analysis;
    const templateScores: Map<string, { score: number; reasons: string[] }> = new Map();

    // Score each template based on data point patterns
    for (const dataPoint of dataPoints) {
      const matchingTemplates = this.patternMappings[dataPoint.type] || [];

      for (const templateId of matchingTemplates) {
        const current = templateScores.get(templateId) || { score: 0, reasons: [] };
        current.score += dataPoint.weight * 25;
        current.reasons.push(`Matches ${dataPoint.type} pattern`);
        templateScores.set(templateId, current);
      }
    }

    // Convert to recommendations
    const recommendations: TemplateRecommendation[] = [];

    for (const [templateId, { score, reasons }] of templateScores) {
      recommendations.push({
        templateId,
        templateName: this.formatTemplateName(templateId),
        templateType: 'content',
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
        expectedPerformance: this.getContentPerformance(templateId),
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get all campaign template matches with scores
   */
  private getAllCampaignMatches(
    analysis: ConnectionAnalysis
  ): TemplateRecommendation[] {
    const { breakthroughScore = 70, dataPoints } = analysis;
    const recommendations: TemplateRecommendation[] = [];

    // Determine tier based on score
    let tier: 'premium' | 'authority' | 'quickwin';
    if (breakthroughScore >= 85) {
      tier = 'premium';
    } else if (breakthroughScore >= 70) {
      tier = 'authority';
    } else {
      tier = 'quickwin';
    }

    // Get templates for this tier
    const tierTemplates = this.scoreBasedCampaigns[tier];

    for (const templateId of tierTemplates) {
      const matchScore = this.calculateCampaignMatchScore(
        templateId,
        dataPoints,
        breakthroughScore
      );

      recommendations.push({
        templateId,
        templateName: this.formatTemplateName(templateId),
        templateType: 'campaign',
        matchScore,
        matchReasons: [
          `Score ${breakthroughScore} → ${tier} tier`,
          `${dataPoints.length} data points support multi-piece campaign`,
        ],
        expectedPerformance: this.getCampaignPerformance(templateId),
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate campaign match score
   */
  private calculateCampaignMatchScore(
    templateId: string,
    dataPoints: DataPointPattern[],
    breakthroughScore: number
  ): number {
    let score = breakthroughScore * 0.5; // Base from breakthrough

    // Add points for data point diversity
    const uniqueTypes = new Set(dataPoints.map((dp) => dp.type));
    score += uniqueTypes.size * 5;

    // Add points for connection strength
    const avgWeight = dataPoints.reduce((sum, dp) => sum + dp.weight, 0) / dataPoints.length;
    score += avgWeight * 10;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Get performance expectations for content template
   */
  private getContentPerformance(templateId: string): TemplateRecommendation['expectedPerformance'] {
    // Performance data based on Content Bible research
    const performanceMap: Record<string, { ctr: number; engagement: number }> = {
      curiosity_gap: { ctr: 47, engagement: 2.0 },
      pattern_interrupt: { ctr: 52, engagement: 2.5 },
      specific_number: { ctr: 36, engagement: 1.8 },
      contrarian: { ctr: 45, engagement: 2.2 },
      mistake_exposer: { ctr: 38, engagement: 1.9 },
      hidden_cost: { ctr: 42, engagement: 2.1 },
      quick_win: { ctr: 35, engagement: 1.7 },
      transformation: { ctr: 40, engagement: 2.3 },
      failure_to_success: { ctr: 38, engagement: 2.0 },
      behind_the_scenes: { ctr: 32, engagement: 1.8 },
      myth_buster: { ctr: 44, engagement: 2.1 },
      guide_snippet: { ctr: 30, engagement: 1.6 },
      comparison: { ctr: 41, engagement: 1.9 },
      trend_jacker: { ctr: 48, engagement: 2.4 },
      deadline_driver: { ctr: 43, engagement: 2.0 },
      seasonal: { ctr: 39, engagement: 1.8 },
      data_revelation: { ctr: 37, engagement: 1.9 },
      expert_roundup: { ctr: 33, engagement: 1.7 },
      case_study: { ctr: 35, engagement: 2.0 },
      challenge_post: { ctr: 46, engagement: 2.6 },
    };

    const perf = performanceMap[templateId] || { ctr: 35, engagement: 1.8 };

    return {
      ctrImprovement: perf.ctr,
      engagementMultiplier: perf.engagement,
    };
  }

  /**
   * Get performance expectations for campaign template
   */
  private getCampaignPerformance(templateId: string): TemplateRecommendation['expectedPerformance'] {
    // ROI estimates based on Content Bible research
    const performanceMap: Record<string, { ctr: number; engagement: number; roi: number }> = {
      race_journey: { ctr: 42, engagement: 2.5, roi: 4.5 },
      pas_series: { ctr: 38, engagement: 2.2, roi: 3.8 },
      bab_campaign: { ctr: 40, engagement: 2.3, roi: 4.0 },
      trust_ladder: { ctr: 35, engagement: 2.8, roi: 4.2 },
      heros_journey: { ctr: 45, engagement: 3.0, roi: 5.0 },
      product_launch: { ctr: 48, engagement: 2.4, roi: 4.8 },
      seasonal_urgency: { ctr: 50, engagement: 2.6, roi: 4.5 },
      authority_builder: { ctr: 32, engagement: 2.2, roi: 3.5 },
      comparison_campaign: { ctr: 44, engagement: 2.1, roi: 4.0 },
      education_first: { ctr: 30, engagement: 2.5, roi: 3.8 },
      social_proof: { ctr: 38, engagement: 2.4, roi: 4.2 },
      objection_crusher: { ctr: 42, engagement: 2.3, roi: 4.5 },
      quick_win_campaign: { ctr: 46, engagement: 2.0, roi: 3.5 },
      scarcity_sequence: { ctr: 52, engagement: 2.5, roi: 4.8 },
      value_stack: { ctr: 40, engagement: 2.2, roi: 4.0 },
    };

    const perf = performanceMap[templateId] || { ctr: 35, engagement: 2.0, roi: 3.5 };

    return {
      ctrImprovement: perf.ctr,
      engagementMultiplier: perf.engagement,
      roiEstimate: perf.roi,
    };
  }

  /**
   * Format template ID to display name
   */
  private formatTemplateName(templateId: string): string {
    return templateId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get default content template
   */
  private getDefaultContentTemplate(): TemplateRecommendation {
    return {
      templateId: 'curiosity_gap',
      templateName: 'Curiosity Gap',
      templateType: 'content',
      matchScore: 50,
      matchReasons: ['Default selection for general content'],
      expectedPerformance: this.getContentPerformance('curiosity_gap'),
    };
  }

  /**
   * Get default campaign template
   */
  private getDefaultCampaignTemplate(): TemplateRecommendation {
    return {
      templateId: 'pas_series',
      templateName: 'PAS Series',
      templateType: 'campaign',
      matchScore: 50,
      matchReasons: ['Default selection for campaign content'],
      expectedPerformance: this.getCampaignPerformance('pas_series'),
    };
  }

  /**
   * Detect connection type from data points
   */
  detectConnectionType(dataPoints: DataPointPattern[]): 'two_way' | 'three_way' | 'multi_way' {
    const uniqueTypes = new Set(dataPoints.map((dp) => dp.type));

    if (uniqueTypes.size >= 4) {
      return 'multi_way';
    } else if (uniqueTypes.size >= 3) {
      return 'three_way';
    } else {
      return 'two_way';
    }
  }
}

// Export singleton instance
export const templateSelector = new TemplateSelectorService();
