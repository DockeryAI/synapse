/**
 * Smart Picks Service
 *
 * Generates top campaign and content recommendations from intelligence data
 */

import type { BreakthroughAngle } from './connection-discovery.service';
import type { Breakthrough } from './breakthrough-generator.service';
import type { InsightCluster } from './clustering.service';
import type { IndustryProfile } from './naics-database.service';
import type { Campaign } from './campaign-generator.service';
import { campaignGenerator } from './campaign-generator.service';

export interface SmartPick {
  id: string;
  type: 'campaign' | 'content';
  title: string;
  description: string;
  confidence: number; // 0-100
  reasoning: string;
  expectedPerformance?: {
    metric: string;
    value: string;
    comparison: string;
  }[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  provenance: string[];
  data?: Campaign | BreakthroughAngle;
}

class SmartPicksService {
  /**
   * Generate smart picks from real breakthroughs (NEW)
   */
  generateSmartPicksFromBreakthroughs(
    breakthroughs: Breakthrough[],
    industryProfile: IndustryProfile
  ): { campaigns: SmartPick[]; content: SmartPick[] } {
    // Sort by score
    const sorted = [...breakthroughs].sort((a, b) => b.score - a.score);

    // Top 3 for campaigns
    const campaignPicks: SmartPick[] = sorted.slice(0, 3).map((bt, i) => ({
      id: `campaign_${bt.id}`,
      type: 'campaign' as const,
      title: bt.title,
      description: bt.description,
      confidence: bt.score,
      reasoning: bt.provenance,
      expectedPerformance: [
        {
          metric: 'Engagement',
          value: `+${Math.round(bt.score * 0.5)}%`,
          comparison: 'vs baseline'
        },
        {
          metric: 'Validation',
          value: `${bt.validation.totalDataPoints} data points`,
          comparison: `from ${bt.validation.sourceTypes.length} sources`
        },
        {
          metric: 'EQ Score',
          value: `${bt.emotionalResonance.eqScore}/100`,
          comparison: 'emotional resonance'
        }
      ],
      urgency: bt.category,
      category: this.getCategoryLabel(bt.category),
      provenance: bt.validation.sourceTypes,
      data: bt
    }));

    // Next 3 for content
    const contentPicks: SmartPick[] = sorted.slice(3, 6).map((bt, i) => ({
      id: `content_${bt.id}`,
      type: 'content' as const,
      title: bt.suggestedAngles[0] || bt.title,
      description: bt.description,
      confidence: bt.score,
      reasoning: bt.validation.validationStatement,
      expectedPerformance: [
        {
          metric: 'Confidence',
          value: `${bt.score}%`,
          comparison: 'AI confidence'
        },
        {
          metric: 'Sources',
          value: `${bt.validation.sourceTypes.length}`,
          comparison: 'data types'
        }
      ],
      urgency: bt.category,
      category: this.getCategoryLabel(bt.category),
      provenance: bt.validation.sourceTypes,
      data: bt
    }));

    return {
      campaigns: campaignPicks,
      content: contentPicks
    };
  }

  /**
   * Get category label
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'urgent': 'Urgent Opportunity',
      'high-value': 'High-Value Strategy',
      'evergreen': 'Strategic Content'
    };
    return labels[category] || 'Content Strategy';
  }

  /**
   * Generate top 3 campaign picks and top 3 content picks (LEGACY)
   */
  generateSmartPicks(
    breakthroughs: BreakthroughAngle[],
    clusters: InsightCluster[],
    industryProfile: IndustryProfile
  ): { campaigns: SmartPick[]; content: SmartPick[] } {
    // Sort breakthroughs by score
    const sortedBreakthroughs = [...breakthroughs].sort((a, b) => b.score - a.score);

    // Generate campaigns from top breakthroughs
    const campaignPicks: SmartPick[] = [];
    const contentPicks: SmartPick[] = [];

    // Top 3 campaigns
    for (let i = 0; i < Math.min(3, sortedBreakthroughs.length); i++) {
      const breakthrough = sortedBreakthroughs[i];
      const campaign = campaignGenerator.generateCampaign(breakthrough, industryProfile, clusters);

      campaignPicks.push({
        id: `campaign_pick_${i}`,
        type: 'campaign',
        title: campaign.name,
        description: `${campaign.pieces.length}-piece ${campaign.type.replace('-', ' ')} campaign over ${campaign.duration} days`,
        confidence: Math.round(breakthrough.score),
        reasoning: campaign.reasoning,
        expectedPerformance: [
          {
            metric: 'Engagement',
            value: `+${Math.round(campaign.estimatedPerformance.engagement)}%`,
            comparison: 'vs baseline'
          },
          {
            metric: 'CTR',
            value: `${campaign.estimatedPerformance.ctr.toFixed(1)}%`,
            comparison: `industry avg: 2.1%`
          },
          {
            metric: 'Conversion',
            value: `${campaign.estimatedPerformance.conversion.toFixed(1)}%`,
            comparison: `industry avg: 1.2%`
          }
        ],
        urgency: breakthrough.urgency,
        category: this.getCampaignCategory(campaign.type),
        provenance: breakthrough.provenance,
        data: campaign
      });
    }

    // Top 3 content pieces (from next breakthroughs)
    for (let i = 3; i < Math.min(6, sortedBreakthroughs.length); i++) {
      const breakthrough = sortedBreakthroughs[i];
      const clusterValidation = this.getClusterValidation(breakthrough, clusters);

      contentPicks.push({
        id: `content_pick_${i}`,
        type: 'content',
        title: breakthrough.title,
        description: breakthrough.hook,
        confidence: Math.round(breakthrough.score),
        reasoning: `Validated by ${breakthrough.provenance.length} data sources${clusterValidation ? `: ${clusterValidation}` : ''}. ${this.getUrgencyReason(breakthrough.urgency)}`,
        expectedPerformance: [
          {
            metric: 'EQ Score',
            value: `${Math.round(breakthrough.score * 0.85)}/100`,
            comparison: 'emotional resonance'
          },
          {
            metric: 'Uniqueness',
            value: this.hasCompetitorGap(breakthrough) ? 'High' : 'Medium',
            comparison: 'vs competitors'
          }
        ],
        urgency: breakthrough.urgency,
        category: this.getContentCategory(breakthrough),
        provenance: breakthrough.provenance,
        data: breakthrough
      });
    }

    return {
      campaigns: campaignPicks,
      content: contentPicks
    };
  }

  /**
   * Get campaign category label
   */
  private getCampaignCategory(type: Campaign['type']): string {
    const labels: Record<Campaign['type'], string> = {
      'seasonal-push': 'Seasonal Campaign',
      'problem-education': 'Educational Series',
      'competitive-disruption': 'Competitive Play',
      'trust-building': 'Authority Builder',
      'product-launch': 'Product Launch'
    };
    return labels[type];
  }

  /**
   * Get content category
   */
  private getContentCategory(breakthrough: BreakthroughAngle): string {
    const title = breakthrough.title.toLowerCase();

    if (title.includes('why') || title.includes('reason')) {
      return 'Educational Content';
    }
    if (title.includes('how') || title.includes('guide') || title.includes('step')) {
      return 'How-To Guide';
    }
    if (title.includes('mistake') || title.includes('avoid') || title.includes('warning')) {
      return 'Warning Content';
    }
    if (title.includes('vs') || title.includes('alternative') || title.includes('competitor')) {
      return 'Competitive Content';
    }
    if (title.includes('trend') || title.includes('future') || title.includes('coming')) {
      return 'Trend Analysis';
    }

    return 'Strategic Content';
  }

  /**
   * Get cluster validation text
   */
  private getClusterValidation(breakthrough: BreakthroughAngle, clusters: InsightCluster[]): string | null {
    // Find clusters related to this breakthrough's connections
    const relatedClusters = clusters.filter(cluster =>
      breakthrough.connections.some(conn =>
        conn.themes.some(theme =>
          cluster.theme.toLowerCase().includes(theme.toLowerCase()) ||
          theme.toLowerCase().includes(cluster.theme.toLowerCase())
        )
      )
    );

    if (relatedClusters.length === 0) return null;

    const totalPoints = relatedClusters.reduce((sum, c) => sum + c.size, 0);
    const themes = relatedClusters.slice(0, 2).map(c => `${c.size} mentions of "${c.theme}"`).join(', ');

    return `${totalPoints} data points clustered around ${themes}`;
  }

  /**
   * Get urgency reason
   */
  private getUrgencyReason(urgency: BreakthroughAngle['urgency']): string {
    switch (urgency) {
      case 'critical':
        return 'URGENT: Act within 24 hours for maximum impact.';
      case 'high':
        return 'High priority: Best executed this week.';
      case 'medium':
        return 'Good opportunity: Plan for next 2 weeks.';
      default:
        return 'Evergreen angle: Can be used anytime.';
    }
  }

  /**
   * Check if breakthrough has competitor gap
   */
  private hasCompetitorGap(breakthrough: BreakthroughAngle): boolean {
    return breakthrough.provenance.some(p =>
      p.toLowerCase().includes('competitor') ||
      p.toLowerCase().includes('gap') ||
      p.toLowerCase().includes('missing')
    );
  }
}

export const smartPicksService = new SmartPicksService();
