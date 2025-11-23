/**
 * Campaign Generator Service
 *
 * Converts breakthroughs into multi-piece campaign strategies
 * with emotional progression and timeline planning.
 */

import type { BreakthroughAngle } from './connection-discovery.service';
import type { InsightCluster } from './clustering.service';
import type { IndustryProfile } from './naics-database.service';

export interface CampaignPiece {
  day: number;
  title: string;
  hook: string;
  purpose: 'awareness' | 'education' | 'agitation' | 'solution' | 'proof' | 'conversion';
  channel: 'blog' | 'email' | 'social' | 'video';
  eqScore: number;
  angle: string;
  callToAction: string;
}

export interface Campaign {
  id: string;
  name: string;
  breakthrough: BreakthroughAngle;
  type: 'product-launch' | 'seasonal-push' | 'problem-education' | 'competitive-disruption' | 'trust-building';
  pieces: CampaignPiece[];
  timeline: number[]; // Days: [1, 3, 7, 14, 21]
  emotionalProgression: number[]; // EQ scores: [60, 70, 80, 85, 90]
  estimatedPerformance: {
    engagement: number; // % above baseline
    ctr: number; // Expected click-through rate
    conversion: number; // Expected conversion rate
  };
  reasoning: string;
  duration: number; // Days
}

class CampaignGeneratorService {
  /**
   * Generate campaign from breakthrough
   */
  generateCampaign(
    breakthrough: BreakthroughAngle,
    industryProfile: IndustryProfile,
    clusters: InsightCluster[]
  ): Campaign {
    // Determine campaign type based on urgency and themes
    const campaignType = this.determineCampaignType(breakthrough);

    // Generate 5-7 piece arc based on type
    const pieces = this.generateCampaignArc(breakthrough, campaignType, industryProfile);

    // Calculate timeline
    const timeline = this.calculateTimeline(campaignType, breakthrough.urgency);

    // Calculate emotional progression
    const emotionalProgression = pieces.map(p => p.eqScore);

    // Estimate performance
    const estimatedPerformance = this.estimatePerformance(breakthrough, clusters);

    // Generate campaign name
    const name = this.generateCampaignName(breakthrough, campaignType);

    // Generate reasoning
    const reasoning = this.generateReasoning(breakthrough, clusters, campaignType);

    return {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      breakthrough,
      type: campaignType,
      pieces,
      timeline,
      emotionalProgression,
      estimatedPerformance,
      reasoning,
      duration: timeline[timeline.length - 1]
    };
  }

  /**
   * Determine campaign type from breakthrough
   */
  private determineCampaignType(breakthrough: BreakthroughAngle): Campaign['type'] {
    const title = breakthrough.title.toLowerCase();
    const urgency = breakthrough.urgency;

    if (urgency === 'critical' || urgency === 'high') {
      return 'seasonal-push';
    }

    if (title.includes('competitor') || title.includes('alternative') || title.includes('vs')) {
      return 'competitive-disruption';
    }

    if (title.includes('trust') || title.includes('proof') || title.includes('testimonial')) {
      return 'trust-building';
    }

    if (title.includes('problem') || title.includes('mistake') || title.includes('avoid')) {
      return 'problem-education';
    }

    return 'problem-education'; // Default
  }

  /**
   * Generate campaign arc with 5-7 pieces
   */
  private generateCampaignArc(
    breakthrough: BreakthroughAngle,
    type: Campaign['type'],
    industryProfile: IndustryProfile
  ): CampaignPiece[] {
    const baseEQ = 60;
    const pieces: CampaignPiece[] = [];

    switch (type) {
      case 'seasonal-push':
        pieces.push(
          {
            day: 1,
            title: `Why ${this.extractKey(breakthrough)} Matters This ${this.getSeason()}`,
            hook: breakthrough.hook,
            purpose: 'awareness',
            channel: 'social',
            eqScore: baseEQ,
            angle: 'Urgency trigger',
            callToAction: 'Learn more'
          },
          {
            day: 3,
            title: `The ${this.extractKey(breakthrough)} Timeline: What Happens If You Wait`,
            hook: `Most people don't realize...`,
            purpose: 'education',
            channel: 'blog',
            eqScore: baseEQ + 10,
            angle: 'Consequence education',
            callToAction: 'Get your free guide'
          },
          {
            day: 7,
            title: `${this.extractKey(breakthrough)}: Your Complete Action Plan`,
            hook: `Here's exactly what to do...`,
            purpose: 'solution',
            channel: 'email',
            eqScore: baseEQ + 20,
            angle: 'Solution framework',
            callToAction: 'Start your plan'
          },
          {
            day: 10,
            title: `How [Customer Name] Solved ${this.extractKey(breakthrough)} in 48 Hours`,
            hook: `They were in your exact situation...`,
            purpose: 'proof',
            channel: 'blog',
            eqScore: baseEQ + 25,
            angle: 'Social proof',
            callToAction: 'See their story'
          },
          {
            day: 14,
            title: `Last Call: ${this.extractKey(breakthrough)} Deadline Approaching`,
            hook: `Time is running out...`,
            purpose: 'conversion',
            channel: 'email',
            eqScore: baseEQ + 30,
            angle: 'Urgency close',
            callToAction: 'Get started now'
          }
        );
        break;

      case 'problem-education':
        pieces.push(
          {
            day: 1,
            title: breakthrough.title,
            hook: breakthrough.hook,
            purpose: 'awareness',
            channel: 'blog',
            eqScore: baseEQ,
            angle: 'Problem identification',
            callToAction: 'Learn more'
          },
          {
            day: 3,
            title: `Why ${this.extractKey(breakthrough)} is Costing You Money`,
            hook: `The hidden costs add up...`,
            purpose: 'agitation',
            channel: 'email',
            eqScore: baseEQ + 15,
            angle: 'Cost amplification',
            callToAction: 'Calculate your losses'
          },
          {
            day: 7,
            title: `The Right Way to Handle ${this.extractKey(breakthrough)}`,
            hook: `Here's what actually works...`,
            purpose: 'solution',
            channel: 'blog',
            eqScore: baseEQ + 20,
            angle: 'Solution education',
            callToAction: 'Get the guide'
          },
          {
            day: 14,
            title: `${this.extractKey(breakthrough)}: Success Stories`,
            hook: `Real results from real customers...`,
            purpose: 'proof',
            channel: 'social',
            eqScore: baseEQ + 25,
            angle: 'Social proof',
            callToAction: 'See more stories'
          },
          {
            day: 21,
            title: `Ready to Solve ${this.extractKey(breakthrough)}? Start Here`,
            hook: `Your path to success starts now...`,
            purpose: 'conversion',
            channel: 'email',
            eqScore: baseEQ + 30,
            angle: 'Soft CTA',
            callToAction: 'Get started'
          }
        );
        break;

      case 'competitive-disruption':
        pieces.push(
          {
            day: 1,
            title: breakthrough.title,
            hook: breakthrough.hook,
            purpose: 'awareness',
            channel: 'blog',
            eqScore: baseEQ + 10,
            angle: 'Competitor weakness',
            callToAction: 'See the comparison'
          },
          {
            day: 3,
            title: `What Your Current [Solution] Isn't Telling You`,
            hook: `They don't want you to know...`,
            purpose: 'agitation',
            channel: 'email',
            eqScore: baseEQ + 20,
            angle: 'Gap exposure',
            callToAction: 'Learn the truth'
          },
          {
            day: 7,
            title: `The Better Alternative to ${this.extractKey(breakthrough)}`,
            hook: `There's a smarter way...`,
            purpose: 'solution',
            channel: 'blog',
            eqScore: baseEQ + 25,
            angle: 'Positioning',
            callToAction: 'Compare options'
          },
          {
            day: 10,
            title: `Why [Number] Businesses Switched From [Competitor]`,
            hook: `They made the move and never looked back...`,
            purpose: 'proof',
            channel: 'social',
            eqScore: baseEQ + 28,
            angle: 'Migration stories',
            callToAction: 'Read their stories'
          },
          {
            day: 14,
            title: `Make the Switch: Your Migration Guide`,
            hook: `We make it easy...`,
            purpose: 'conversion',
            channel: 'email',
            eqScore: baseEQ + 32,
            angle: 'Conversion ease',
            callToAction: 'Start your migration'
          }
        );
        break;

      case 'trust-building':
        pieces.push(
          {
            day: 1,
            title: breakthrough.title,
            hook: breakthrough.hook,
            purpose: 'awareness',
            channel: 'blog',
            eqScore: baseEQ,
            angle: 'Credibility hook',
            callToAction: 'Learn our story'
          },
          {
            day: 5,
            title: `How We've Helped [Number] Customers With ${this.extractKey(breakthrough)}`,
            hook: `Real results, real people...`,
            purpose: 'proof',
            channel: 'social',
            eqScore: baseEQ + 15,
            angle: 'Social proof',
            callToAction: 'See testimonials'
          },
          {
            day: 10,
            title: `Behind the Scenes: Our ${this.extractKey(breakthrough)} Process`,
            hook: `We're pulling back the curtain...`,
            purpose: 'education',
            channel: 'blog',
            eqScore: baseEQ + 20,
            angle: 'Transparency',
            callToAction: 'Watch the video'
          },
          {
            day: 14,
            title: `Why [Authority Figure] Trusts Us With ${this.extractKey(breakthrough)}`,
            hook: `Industry leaders choose us because...`,
            purpose: 'proof',
            channel: 'email',
            eqScore: baseEQ + 25,
            angle: 'Authority endorsement',
            callToAction: 'See our credentials'
          },
          {
            day: 21,
            title: `Ready to Experience ${this.extractKey(breakthrough)}? Let's Talk`,
            hook: `Join hundreds of satisfied customers...`,
            purpose: 'conversion',
            channel: 'email',
            eqScore: baseEQ + 28,
            angle: 'Soft invitation',
            callToAction: 'Schedule a call'
          }
        );
        break;

      default:
        pieces.push(
          {
            day: 1,
            title: breakthrough.title,
            hook: breakthrough.hook,
            purpose: 'awareness',
            channel: 'blog',
            eqScore: baseEQ,
            angle: 'Hook',
            callToAction: 'Learn more'
          }
        );
    }

    return pieces;
  }

  /**
   * Calculate timeline based on campaign type and urgency
   */
  private calculateTimeline(type: Campaign['type'], urgency: BreakthroughAngle['urgency']): number[] {
    if (urgency === 'critical') {
      return [1, 2, 4, 6, 8]; // Aggressive timeline
    }

    if (urgency === 'high') {
      return [1, 3, 7, 10, 14]; // Standard fast timeline
    }

    // Default timelines by type
    switch (type) {
      case 'seasonal-push':
        return [1, 3, 7, 10, 14];
      case 'competitive-disruption':
        return [1, 3, 7, 10, 14];
      case 'problem-education':
        return [1, 3, 7, 14, 21];
      case 'trust-building':
        return [1, 5, 10, 14, 21];
      default:
        return [1, 3, 7, 14, 21];
    }
  }

  /**
   * Estimate campaign performance based on breakthrough quality
   */
  private estimatePerformance(
    breakthrough: BreakthroughAngle,
    clusters: InsightCluster[]
  ): Campaign['estimatedPerformance'] {
    const baseEngagement = 20; // % above baseline
    const baseCTR = 2.5; // %
    const baseConversion = 1.5; // %

    // Calculate boosts
    const scoreBoost = (breakthrough.score / 100) * 20; // Up to +20%
    const urgencyBoost = breakthrough.urgency === 'critical' ? 15 : breakthrough.urgency === 'high' ? 10 : 0;
    const validationBoost = clusters.length * 2; // +2% per cluster

    return {
      engagement: baseEngagement + scoreBoost + urgencyBoost,
      ctr: baseCTR + (scoreBoost / 10) + (urgencyBoost / 10),
      conversion: baseConversion + (scoreBoost / 20) + (urgencyBoost / 15) + (validationBoost / 10)
    };
  }

  /**
   * Generate campaign name
   */
  private generateCampaignName(breakthrough: BreakthroughAngle, type: Campaign['type']): string {
    const key = this.extractKey(breakthrough);

    const names: Record<Campaign['type'], string> = {
      'seasonal-push': `${this.getSeason()} ${key} Campaign`,
      'problem-education': `${key} Education Series`,
      'competitive-disruption': `${key} Disruption Campaign`,
      'trust-building': `${key} Authority Builder`,
      'product-launch': `${key} Launch Campaign`
    };

    return names[type];
  }

  /**
   * Generate reasoning for campaign
   */
  private generateReasoning(
    breakthrough: BreakthroughAngle,
    clusters: InsightCluster[],
    type: Campaign['type']
  ): string {
    const validation = breakthrough.provenance.length;
    const clusterInfo = clusters.slice(0, 3).map(c => `${c.size} ${c.theme.toLowerCase()} mentions`).join(', ');

    return `This ${type.replace('-', ' ')} campaign is recommended based on: ${breakthrough.provenance.join(' + ')}. Validated by ${validation} data sources${clusterInfo ? ` including ${clusterInfo}` : ''}. Expected to perform ${Math.round(((breakthrough.score - 50) / 50) * 100)}% above baseline due to strong timing and validation.`;
  }

  /**
   * Extract key theme from breakthrough
   */
  private extractKey(breakthrough: BreakthroughAngle): string {
    // Extract the main theme from title
    const title = breakthrough.title;

    // Remove common prefixes
    const cleaned = title
      .replace(/^(Why|How|What|When|The|A|An)\s+/i, '')
      .replace(/\?$/, '')
      .split(':')[0]
      .split('—')[0]
      .trim();

    return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
  }

  /**
   * Get current season
   */
  private getSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }
}

export const campaignGenerator = new CampaignGeneratorService();
