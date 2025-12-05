/**
 * VoC Psychology Integration Service
 * Phase 14C: Wire 9 psychology principles into VoC insights
 */

import { ContentPsychologyEngine } from './generation/ContentPsychologyEngine';
import type { V6Insight } from './v6-insight-types';

export interface VoCPsychologyResult {
  insight: V6Insight;
  psychologyAnalysis: any; // PsychologyPrincipleAnalysis from ContentPsychologyEngine
  topPrinciples: string[];
  overallScore: number;
  recommendedFormat: string;
}

export class VoCPsychologyIntegrationService {
  private psychologyEngine: ContentPsychologyEngine;

  constructor() {
    this.psychologyEngine = new ContentPsychologyEngine();
  }

  /**
   * Phase 14C: Analyze VoC insights against 9 psychology principles
   */
  async analyzeVoCInsights(insights: V6Insight[]): Promise<VoCPsychologyResult[]> {
    const results: VoCPsychologyResult[] = [];

    for (const insight of insights) {
      // Only analyze VoC insights
      if (insight.sourceTab !== 'voc') continue;

      try {
        // Convert V6Insight to VoCInsight format for psychology engine
        const vocInsight = {
          id: insight.id,
          text: insight.text,
          title: insight.text, // Use text as title if needed
        };

        // Analyze against 9 psychology principles
        const psychologyAnalysis = this.psychologyEngine.analyzeVoCInsight(vocInsight);

        // Extract top principles and format recommendation
        const topPrinciples = psychologyAnalysis.top_principles.map(p => p.principle);
        const overallScore = psychologyAnalysis.overall_psychology_score;
        const recommendedFormat = this.getRecommendedFormat(psychologyAnalysis.top_principles[0]);

        results.push({
          insight,
          psychologyAnalysis,
          topPrinciples,
          overallScore,
          recommendedFormat,
        });

      } catch (error) {
        console.error(`[VoCPsychology] Failed to analyze insight ${insight.id}:`, error);
        // Continue with next insight on error
      }
    }

    return results;
  }

  /**
   * Get recommended content format based on top psychology principle
   */
  private getRecommendedFormat(topPrinciple: any): string {
    if (!topPrinciple) return 'story-post';

    switch (topPrinciple.principle) {
      case 'curiosity_gap':
        return 'hook-post';
      case 'loss_aversion':
        return 'data-post';
      case 'social_proof':
      case 'authority':
        return 'data-post';
      case 'scarcity':
        return 'hook-post';
      case 'cognitive_dissonance':
        return 'controversial-post';
      case 'pattern_interrupt':
        return 'hook-post';
      default:
        return 'story-post';
    }
  }

  /**
   * Phase 14E: Auto-execution - analyze insights immediately when VoC loads
   */
  async autoAnalyzeOnLoad(insights: V6Insight[]): Promise<VoCPsychologyResult[]> {
    // Filter for VoC insights with sufficient content
    const vocInsights = insights.filter(
      insight => insight.sourceTab === 'voc' &&
      insight.text &&
      insight.text.length > 10
    );

    if (vocInsights.length === 0) {
      console.log('[VoCPsychology] No VoC insights to analyze');
      return [];
    }

    console.log(`[VoCPsychology] Auto-analyzing ${vocInsights.length} VoC insights`);
    return this.analyzeVoCInsights(vocInsights);
  }
}

// Export singleton instance
export const vocPsychologyService = new VoCPsychologyIntegrationService();