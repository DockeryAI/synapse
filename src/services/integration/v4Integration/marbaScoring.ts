import type {
  BrandHealthScore,
  MARBAScores,
  BrandMirrorScores,
  ScoreBreakdown,
  ScoreFactor,
  ScoreInsight,
  ScoreHistory,
} from '@/types/MARBAScore';
import type { CompleteBrandAnalysis } from '@/types/BrandMirror';

/**
 * MARBA Scoring Service
 * Calculates brand health scores by blending MARBA + Brand Mirror frameworks
 */
export class MARBAScoring {
  /**
   * Calculate complete brand health score
   */
  calculateBrandHealthScore(
    analysis: CompleteBrandAnalysis,
    history?: ScoreHistory[]
  ): BrandHealthScore {
    const marbaScores = this.calculateMARBAScores(analysis);
    const mirrorScores = this.calculateMirrorScores(analysis);
    const totalScore = this.blendScores(marbaScores, mirrorScores);
    const categoryDetails = this.generateCategoryDetails(analysis, marbaScores);
    const insights = this.generateInsights(marbaScores, mirrorScores, analysis);
    const trend = history ? this.calculateTrend(totalScore, history) : undefined;

    return {
      total: Math.round(totalScore),
      status: this.getScoreStatus(totalScore),
      marbaBreakdown: marbaScores,
      mirrorBreakdown: mirrorScores,
      categoryDetails,
      insights,
      lastCalculated: new Date().toISOString(),
      trend,
    };
  }

  private calculateMARBAScores(analysis: CompleteBrandAnalysis): MARBAScores {
    return {
      messaging: this.calculateMessagingScore(analysis),
      audience: this.calculateAudienceScore(analysis),
      reviews: this.calculateReviewsScore(analysis),
      brand: this.calculateBrandScore(analysis),
      ads: this.calculateAdsScore(analysis),
    };
  }

  private calculateMessagingScore(analysis: CompleteBrandAnalysis): number {
    let score = 0;
    if (analysis.positioning?.valueProposition) score += 25;
    else if (analysis.positioning?.differentiators?.length > 0) score += 15;
    if (analysis.voice?.consistency >= 80) score += 25;
    else if (analysis.voice?.consistency >= 60) score += 15;
    if (analysis.positioning?.statement) {
      score += analysis.positioning.statement.length > 50 ? 25 : 15;
    }
    const ctaCount = analysis.messaging?.themes?.filter(t =>
      t.toLowerCase().includes('call') || t.toLowerCase().includes('action')
    ).length || 0;
    if (ctaCount >= 3) score += 25;
    else if (ctaCount >= 1) score += 15;
    return Math.min(score, 100);
  }

  private calculateAudienceScore(analysis: CompleteBrandAnalysis): number {
    let score = 0;
    const personaCount = analysis.audience?.personas?.length || 0;
    if (personaCount >= 2) score += 35;
    else if (personaCount >= 1) score += 20;
    if (analysis.industry?.confidence >= 85) score += 35;
    else if (analysis.industry?.confidence >= 70) score += 20;
    if (analysis.positioning?.target) score += 30;
    return Math.min(score, 100);
  }

  private calculateReviewsScore(analysis: CompleteBrandAnalysis): number {
    let score = 0;
    if (analysis.brandHealth?.engagement >= 80) score += 40;
    else if (analysis.brandHealth?.engagement >= 60) score += 25;
    score += 20; // Assume moderate review presence
    score += 15; // Assume some response activity
    return Math.min(score, 100);
  }

  private calculateBrandScore(analysis: CompleteBrandAnalysis): number {
    let score = 0;
    const primaryArchetypeScore = analysis.archetype?.archetypes?.[0]?.score || 0;
    if (primaryArchetypeScore >= 80) score += 35;
    else if (primaryArchetypeScore >= 60) score += 20;
    if (analysis.visualAssets) {
      const hasLogo = analysis.visualAssets.logo !== undefined;
      const hasColors = analysis.visualAssets.colors?.length > 0;
      const hasFonts = analysis.visualAssets.typography !== undefined;
      if (hasLogo && hasColors && hasFonts) score += 35;
      else if (hasLogo || hasColors) score += 20;
    }
    if (analysis.brandHealth?.clarity >= 80) score += 30;
    else if (analysis.brandHealth?.clarity >= 60) score += 15;
    return Math.min(score, 100);
  }

  private calculateAdsScore(analysis: CompleteBrandAnalysis): number {
    let score = 25; // Assume moderate channel presence
    if (analysis.brandHealth?.engagement >= 75) score += 30;
    else if (analysis.brandHealth?.engagement >= 50) score += 15;
    if (analysis.brandHealth?.consistency >= 80) score += 30;
    else if (analysis.brandHealth?.consistency >= 60) score += 15;
    return Math.min(score, 100);
  }

  private calculateMirrorScores(analysis: CompleteBrandAnalysis): BrandMirrorScores {
    return {
      goldenCircle: this.calculateGoldenCircleScore(analysis),
      archetype: this.calculateArchetypeScore(analysis),
      tone: this.calculateToneScore(analysis),
      competitive: this.calculateCompetitiveScore(analysis),
    };
  }

  private calculateGoldenCircleScore(analysis: CompleteBrandAnalysis): number {
    const why = analysis.goldenCircle?.why?.score?.total || 0;
    const how = analysis.goldenCircle?.how?.score?.total || 0;
    const what = analysis.goldenCircle?.what?.score?.total || 0;
    return Math.round((why + how + what) / 3);
  }

  private calculateArchetypeScore(analysis: CompleteBrandAnalysis): number {
    return analysis.archetype?.archetypes?.[0]?.score || 0;
  }

  private calculateToneScore(analysis: CompleteBrandAnalysis): number {
    const toneValues = Object.values(analysis.voice?.toneDimensions || {});
    if (toneValues.length === 0) return 0;
    return Math.round(toneValues.reduce((a, b) => a + b, 0) / toneValues.length);
  }

  private calculateCompetitiveScore(analysis: CompleteBrandAnalysis): number {
    if (analysis.competitive) {
      let score = 0;
      if (analysis.competitive.scorecards?.length > 0) score += 40;
      if (analysis.competitive.strategicInsights?.length > 0) score += 30;
      if (analysis.competitive.summary) score += 30;
      return score;
    }
    return 50;
  }

  private blendScores(marba: MARBAScores, mirror: BrandMirrorScores): number {
    const marbaScore =
      marba.messaging * 0.22 +
      marba.audience * 0.19 +
      marba.reviews * 0.24 +
      marba.brand * 0.20 +
      marba.ads * 0.15;
    const mirrorScore =
      mirror.goldenCircle * 0.30 +
      mirror.archetype * 0.25 +
      mirror.tone * 0.20 +
      mirror.competitive * 0.25;
    return marbaScore * 0.5 + mirrorScore * 0.5;
  }

  private getScoreStatus(score: number): 'excellent' | 'good' | 'fair' | 'needs-work' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'needs-work';
  }

  private generateCategoryDetails(
    analysis: CompleteBrandAnalysis,
    marba: MARBAScores
  ): ScoreBreakdown[] {
    return [
      {
        category: 'messaging',
        score: marba.messaging,
        maxScore: 100,
        factors: this.getMessagingFactors(analysis),
        status: this.getScoreStatus(marba.messaging),
      },
      {
        category: 'audience',
        score: marba.audience,
        maxScore: 100,
        factors: [],
        status: this.getScoreStatus(marba.audience),
      },
      {
        category: 'reviews',
        score: marba.reviews,
        maxScore: 100,
        factors: [],
        status: this.getScoreStatus(marba.reviews),
      },
      {
        category: 'brand',
        score: marba.brand,
        maxScore: 100,
        factors: [],
        status: this.getScoreStatus(marba.brand),
      },
      {
        category: 'ads',
        score: marba.ads,
        maxScore: 100,
        factors: [],
        status: this.getScoreStatus(marba.ads),
      },
    ];
  }

  private getMessagingFactors(analysis: CompleteBrandAnalysis): ScoreFactor[] {
    const factors: ScoreFactor[] = [];
    factors.push({
      name: 'Clear value proposition',
      points: analysis.positioning?.valueProposition ? 25 : 0,
      maxPoints: 25,
      status: analysis.positioning?.valueProposition ? 'complete' : 'missing',
      description: 'Clearly articulated unique value',
      suggestion: !analysis.positioning?.valueProposition ? 'Define what makes you unique' : undefined,
    });
    const consistency = analysis.voice?.consistency || 0;
    factors.push({
      name: 'Consistent brand voice',
      points: consistency >= 80 ? 25 : consistency >= 60 ? 15 : 0,
      maxPoints: 25,
      status: consistency >= 80 ? 'complete' : consistency >= 60 ? 'partial' : 'missing',
      description: 'Voice consistent across channels',
    });
    return factors;
  }

  private generateInsights(
    marba: MARBAScores,
    mirror: BrandMirrorScores,
    analysis: CompleteBrandAnalysis
  ): ScoreInsight[] {
    const insights: ScoreInsight[] = [];
    Object.entries(marba).forEach(([category, score]) => {
      if (score >= 85) {
        insights.push({
          type: 'strength',
          category,
          message: `Your ${category} is excellent`,
        });
      } else if (score >= 50 && score < 70) {
        insights.push({
          type: 'opportunity',
          category,
          message: `Opportunity to improve ${category}`,
          action: `Review ${category} recommendations`,
        });
      } else if (score < 50) {
        insights.push({
          type: 'warning',
          category,
          message: `${category} needs attention`,
          action: `Focus on ${category} improvements`,
        });
      }
    });
    return insights;
  }

  private calculateTrend(
    currentScore: number,
    history: ScoreHistory[]
  ): { previousScore: number; change: number; period: string } {
    if (history.length === 0) {
      return { previousScore: currentScore, change: 0, period: 'first calculation' };
    }
    const previous = history[history.length - 1];
    return {
      previousScore: previous.total,
      change: Math.round(currentScore - previous.total),
      period: '30 days',
    };
  }
}

export const marbaScoring = new MARBAScoring();
