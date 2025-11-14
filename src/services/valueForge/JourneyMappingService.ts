/**
 * Journey Mapping Service
 *
 * Maps discovery paths to AIDA (Awareness, Interest, Desire, Action) stages
 * and generates stage-specific messaging
 */

import type { ValueForgeContext, BuyerPersona } from '@/types/valueForge';
import type { DiscoveryPathScore } from './DiscoveryPathAnalyzer';
import type { BVPFormula } from '@/components/valueForge/BVPBuilder';

export interface AIDAStage {
  stage: 'awareness' | 'interest' | 'desire' | 'action';
  message: string;
  mechanism: string; // How to deliver the message
  discoveryPath: string; // Which path is most relevant
  performance: number; // 0-100
  opportunity: number; // 0-100
}

export class JourneyMappingServiceClass {
  /**
   * Generate AIDA stages from context and strategy
   */
  generateJourney(
    context: ValueForgeContext,
    personas: BuyerPersona[],
    pathScores: DiscoveryPathScore[],
    priorities: string[],
    bvp?: BVPFormula
  ): AIDAStage[] {
    const primaryPersona = personas[0];
    const primaryPath = priorities[0] || 'search';

    return [
      this.generateAwareness(context, primaryPersona, pathScores, primaryPath),
      this.generateInterest(context, primaryPersona, bvp),
      this.generateDesire(context, primaryPersona, bvp),
      this.generateAction(context, primaryPersona)
    ];
  }

  /**
   * Generate Awareness stage
   */
  private generateAwareness(
    context: ValueForgeContext,
    persona: BuyerPersona,
    pathScores: DiscoveryPathScore[],
    primaryPath: string
  ): AIDAStage {
    const pathScore = pathScores.find(p => p.path === primaryPath);

    // Generate awareness message based on pain points
    const painPoint = persona.motivations.fears[0] || 'challenges in their industry';
    const message = `Addressing ${painPoint} with proven solutions`;

    // Map discovery path to mechanism
    const mechanisms: Record<string, string> = {
      search: 'SEO-optimized content, blog posts, guides',
      trust: 'Social proof, testimonials, case studies',
      share: 'Viral content, social media, word-of-mouth',
      interrupt: 'Targeted ads, outbound campaigns',
      browse: 'Directory listings, marketplace presence'
    };

    return {
      stage: 'awareness',
      message,
      mechanism: mechanisms[primaryPath] || 'Content marketing',
      discoveryPath: primaryPath,
      performance: pathScore?.score || 50,
      opportunity: 100 - (pathScore?.score || 50)
    };
  }

  /**
   * Generate Interest stage
   */
  private generateInterest(
    context: ValueForgeContext,
    persona: BuyerPersona,
    bvp?: BVPFormula
  ): AIDAStage {
    // Use BVP "what" if available, otherwise use persona hopes
    const value = bvp?.what || persona.motivations.hopes[0] || 'exceptional value';
    const message = `Discover how we deliver ${value}`;

    return {
      stage: 'interest',
      message,
      mechanism: 'Educational content, webinars, product demos',
      discoveryPath: 'trust',
      performance: 60,
      opportunity: 40
    };
  }

  /**
   * Generate Desire stage
   */
  private generateDesire(
    context: ValueForgeContext,
    persona: BuyerPersona,
    bvp?: BVPFormula
  ): AIDAStage {
    // Use BVP unique differentiator
    const unique = bvp?.unique || 'our proven approach';
    const message = `Why choose us? ${this.capitalize(unique)}`;

    return {
      stage: 'desire',
      message,
      mechanism: 'Case studies, ROI calculators, free trials',
      discoveryPath: 'trust',
      performance: 55,
      opportunity: 45
    };
  }

  /**
   * Generate Action stage
   */
  private generateAction(
    context: ValueForgeContext,
    persona: BuyerPersona
  ): AIDAStage {
    const dream = persona.motivations.dreams[0] || 'your goals';
    const message = `Ready to achieve ${dream}? Let's get started`;

    return {
      stage: 'action',
      message,
      mechanism: 'Clear CTAs, easy contact forms, consultation booking',
      discoveryPath: 'interrupt',
      performance: 40,
      opportunity: 60
    };
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Validate journey consistency
   */
  validateJourney(stages: AIDAStage[], bvp?: BVPFormula): {
    consistent: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check if messaging is consistent across stages
    if (bvp) {
      const mentionsBVP = stages.some(s =>
        s.message.toLowerCase().includes(bvp.unique.toLowerCase())
      );
      if (!mentionsBVP) {
        issues.push('Journey messaging should incorporate your unique differentiator');
      }
    }

    // Check performance gaps
    const lowPerformance = stages.filter(s => s.performance < 40);
    if (lowPerformance.length > 2) {
      issues.push('Multiple stages have low performance - prioritize improvements');
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }
}

export const journeyMappingService = new JourneyMappingServiceClass();
