/**
 * Transformation Analyzer Service
 *
 * Analyzes pain → pleasure transformations and scores clarity of the value proposition
 */

import type { ValueForgeContext } from '@/types/valueForge';

export interface PainPoint {
  id: string;
  pain: string;
  severity: number; // 0-100
  frequency: number; // 0-100
  source: 'detected' | 'industry' | 'user_added';
}

export interface PleasureGoal {
  id: string;
  pleasure: string;
  desirability: number; // 0-100
  achievability: number; // 0-100
  source: 'detected' | 'industry' | 'user_added';
}

export interface Transformation {
  painId: string;
  pleasureId: string;
  clarityScore: number; // 0-100 - how clear the transformation is
  confidence: number;
  mechanism?: string; // How the transformation happens
}

export interface TransformationAnalysis {
  pains: PainPoint[];
  pleasures: PleasureGoal[];
  transformations: Transformation[];
  overallClarity: number;
}

export class TransformationAnalyzerService {
  /**
   * Analyze pain points and pleasure goals from context
   */
  analyzeTransformations(context: ValueForgeContext): TransformationAnalysis {
    const pains = this.detectPainPoints(context);
    const pleasures = this.detectPleasureGoals(context);
    const transformations = this.mapTransformations(pains, pleasures, context);

    const overallClarity = this.calculateOverallClarity(transformations);

    return {
      pains,
      pleasures,
      transformations,
      overallClarity
    };
  }

  /**
   * Detect pain points from website and industry data
   */
  private detectPainPoints(context: ValueForgeContext): PainPoint[] {
    const pains: PainPoint[] = [];
    const websiteAnalysis = context.businessIntel?.website_analysis;
    const industryProfile = context.industryProfile;

    // From website problems/challenges
    if (websiteAnalysis?.problems) {
      websiteAnalysis.problems.forEach((problem: string, idx: number) => {
        pains.push({
          id: `pain-web-${idx}`,
          pain: problem,
          severity: 80,
          frequency: 75,
          source: 'detected'
        });
      });
    }

    // From industry customer triggers (negative emotions)
    if (industryProfile?.customerTriggers) {
      industryProfile.customerTriggers
        .filter((t: any) => t.emotion && this.isNegativeEmotion(t.emotion))
        .slice(0, 5)
        .forEach((trigger: any, idx: number) => {
          pains.push({
            id: `pain-ind-${idx}`,
            pain: trigger.trigger || trigger.situation,
            severity: 70,
            frequency: 65,
            source: 'industry'
          });
        });
    }

    // From industry transformations (before state)
    if (industryProfile?.transformations) {
      industryProfile.transformations
        .slice(0, 3)
        .forEach((trans: any, idx: number) => {
          if (trans.before) {
            pains.push({
              id: `pain-trans-${idx}`,
              pain: trans.before,
              severity: 85,
              frequency: 80,
              source: 'industry'
            });
          }
        });
    }

    return this.deduplicatePains(pains);
  }

  /**
   * Detect pleasure goals from website and industry data
   */
  private detectPleasureGoals(context: ValueForgeContext): PleasureGoal[] {
    const pleasures: PleasureGoal[] = [];
    const websiteAnalysis = context.businessIntel?.website_analysis;
    const industryProfile = context.industryProfile;

    // From website solutions/benefits
    if (websiteAnalysis?.solutions) {
      websiteAnalysis.solutions.forEach((solution: string, idx: number) => {
        pleasures.push({
          id: `pleasure-web-${idx}`,
          pleasure: solution,
          desirability: 85,
          achievability: 80,
          source: 'detected'
        });
      });
    }

    // From industry customer triggers (positive outcomes)
    if (industryProfile?.customerTriggers) {
      industryProfile.customerTriggers
        .filter((t: any) => t.emotion && this.isPositiveEmotion(t.emotion))
        .slice(0, 5)
        .forEach((trigger: any, idx: number) => {
          pleasures.push({
            id: `pleasure-ind-${idx}`,
            pleasure: trigger.desire || trigger.goal || 'Achieve desired outcome',
            desirability: 75,
            achievability: 70,
            source: 'industry'
          });
        });
    }

    // From industry transformations (after state)
    if (industryProfile?.transformations) {
      industryProfile.transformations
        .slice(0, 3)
        .forEach((trans: any, idx: number) => {
          if (trans.after) {
            pleasures.push({
              id: `pleasure-trans-${idx}`,
              pleasure: trans.after,
              desirability: 90,
              achievability: 85,
              source: 'industry'
            });
          }
        });
    }

    return this.deduplicatePleasures(pleasures);
  }

  /**
   * Map pain points to pleasure goals
   */
  private mapTransformations(
    pains: PainPoint[],
    pleasures: PleasureGoal[],
    context: ValueForgeContext
  ): Transformation[] {
    const transformations: Transformation[] = [];
    const industryTransformations = context.industryProfile?.transformations || [];

    // Create transformations from industry data first
    industryTransformations.slice(0, 3).forEach((trans: any, idx: number) => {
      const painMatch = pains.find(p => p.id === `pain-trans-${idx}`);
      const pleasureMatch = pleasures.find(p => p.id === `pleasure-trans-${idx}`);

      if (painMatch && pleasureMatch) {
        transformations.push({
          painId: painMatch.id,
          pleasureId: pleasureMatch.id,
          clarityScore: 90,
          confidence: 85,
          mechanism: trans.mechanism || 'Strategic intervention'
        });
      }
    });

    // Auto-match detected pains to detected pleasures
    const detectedPains = pains.filter(p => p.source === 'detected');
    const detectedPleasures = pleasures.filter(p => p.source === 'detected');

    detectedPains.forEach((pain, idx) => {
      if (detectedPleasures[idx]) {
        transformations.push({
          painId: pain.id,
          pleasureId: detectedPleasures[idx].id,
          clarityScore: 75,
          confidence: 70
        });
      }
    });

    return transformations;
  }

  /**
   * Calculate overall transformation clarity
   */
  private calculateOverallClarity(transformations: Transformation[]): number {
    if (transformations.length === 0) return 0;

    const avgClarity = transformations.reduce((sum, t) => sum + t.clarityScore, 0) / transformations.length;
    const avgConfidence = transformations.reduce((sum, t) => sum + t.confidence, 0) / transformations.length;

    return Math.round((avgClarity + avgConfidence) / 2);
  }

  /**
   * Check if emotion is negative
   */
  private isNegativeEmotion(emotion: string): boolean {
    const negativeEmotions = [
      'frustrated', 'overwhelmed', 'anxious', 'confused', 'disappointed',
      'stressed', 'worried', 'uncertain', 'fearful', 'angry', 'tired'
    ];
    return negativeEmotions.some(neg => emotion.toLowerCase().includes(neg));
  }

  /**
   * Check if emotion is positive
   */
  private isPositiveEmotion(emotion: string): boolean {
    const positiveEmotions = [
      'confident', 'excited', 'relieved', 'satisfied', 'proud',
      'empowered', 'successful', 'accomplished', 'happy', 'fulfilled'
    ];
    return positiveEmotions.some(pos => emotion.toLowerCase().includes(pos));
  }

  /**
   * Deduplicate pain points
   */
  private deduplicatePains(pains: PainPoint[]): PainPoint[] {
    const seen = new Map<string, PainPoint>();

    pains.forEach(pain => {
      const key = pain.pain.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, pain);
      } else {
        // Merge: keep highest severity
        const existing = seen.get(key)!;
        existing.severity = Math.max(existing.severity, pain.severity);
        existing.frequency = Math.max(existing.frequency, pain.frequency);
        if (pain.source === 'detected') {
          existing.source = 'detected'; // Prefer detected
        }
      }
    });

    // Sort by severity × frequency
    return Array.from(seen.values()).sort((a, b) => {
      const scoreA = a.severity * a.frequency;
      const scoreB = b.severity * b.frequency;
      return scoreB - scoreA;
    });
  }

  /**
   * Deduplicate pleasure goals
   */
  private deduplicatePleasures(pleasures: PleasureGoal[]): PleasureGoal[] {
    const seen = new Map<string, PleasureGoal>();

    pleasures.forEach(pleasure => {
      const key = pleasure.pleasure.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, pleasure);
      } else {
        // Merge: keep highest desirability
        const existing = seen.get(key)!;
        existing.desirability = Math.max(existing.desirability, pleasure.desirability);
        existing.achievability = Math.max(existing.achievability, pleasure.achievability);
        if (pleasure.source === 'detected') {
          existing.source = 'detected'; // Prefer detected
        }
      }
    });

    // Sort by desirability × achievability
    return Array.from(seen.values()).sort((a, b) => {
      const scoreA = a.desirability * a.achievability;
      const scoreB = b.desirability * b.achievability;
      return scoreB - scoreA;
    });
  }
}

export const transformationAnalyzer = new TransformationAnalyzerService();
