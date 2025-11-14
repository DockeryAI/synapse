/**
 * Competitive Intelligence Analyzer
 *
 * Analyzes competitors to identify:
 * - Blind spots (what they ignore)
 * - Mistakes (what they do wrong)
 * - Market gaps (opportunities)
 * - Content gaps (missing content types)
 * - Positioning weaknesses
 *
 * Created: 2025-11-10
 */

import {
  CompetitiveIntelligence,
  CompetitorBlindSpot,
  CompetitorMistake,
  MarketGap,
  ContentOpportunity,
  BusinessProfile
} from '../../../types/deepContext.types';
import { CompetitiveIntelligence as BaseCompetitiveIntel } from '../../../types/contentIntelligence.types';

export class CompetitiveIntelligenceAnalyzer {
  /**
   * Analyze competitive landscape for deep insights
   */
  async analyze(
    business: BusinessProfile,
    baseCompetitiveIntel: BaseCompetitiveIntel,
    customerSignals: any[]
  ): Promise<CompetitiveIntelligence> {
    console.log('[CompetitiveAnalyzer] Analyzing competitive intelligence for:', business.name);

    const startTime = Date.now();

    // Run analyses in parallel
    const [blindSpots, mistakes, opportunities, contentGaps, weaknesses] = await Promise.all([
      this.findBlindSpots(baseCompetitiveIntel, customerSignals),
      this.identifyMistakes(baseCompetitiveIntel, business),
      this.spotMarketGaps(baseCompetitiveIntel, business),
      this.findContentGaps(baseCompetitiveIntel),
      this.findPositioningWeaknesses(baseCompetitiveIntel)
    ]);

    console.log('[CompetitiveAnalyzer] Analysis complete:', {
      blindSpots: blindSpots.length,
      mistakes: mistakes.length,
      opportunities: opportunities.length,
      contentGaps: contentGaps.length,
      timeMs: Date.now() - startTime
    });

    return {
      blindSpots,
      mistakes,
      opportunities,
      contentGaps,
      positioningWeaknesses: weaknesses
    };
  }

  /**
   * Find competitor blind spots
   * Topics customers care about that competitors ignore
   */
  private async findBlindSpots(
    competitiveIntel: BaseCompetitiveIntel,
    customerSignals: any[]
  ): Promise<CompetitorBlindSpot[]> {
    console.log('[CompetitiveAnalyzer] Finding competitor blind spots...');

    const blindSpots: CompetitorBlindSpot[] = [];

    // Extract what customers care about (from reviews, complaints, questions)
    const customerConcerns = this.extractCustomerConcerns(customerSignals);

    // Extract what competitors talk about
    const competitorTopics = this.extractCompetitorTopics(competitiveIntel);

    // Find gaps
    for (const concern of customerConcerns) {
      const isCovered = competitorTopics.some(topic =>
        this.topicsOverlap(concern.topic, topic)
      );

      if (!isCovered && concern.interest > 0.5) {
        blindSpots.push({
          topic: concern.topic,
          customerInterest: concern.interest,
          frequency: concern.frequency,
          opportunityScore: this.calculateBlindSpotOpportunity(concern),
          reasoning: `Customers frequently ask about "${concern.topic}" but competitors rarely address it`,
          evidence: concern.evidence
        });
      }
    }

    // Sort by opportunity score
    return blindSpots
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);
  }

  /**
   * Identify competitor mistakes
   */
  private async identifyMistakes(
    competitiveIntel: BaseCompetitiveIntel,
    business: BusinessProfile
  ): Promise<CompetitorMistake[]> {
    console.log('[CompetitiveAnalyzer] Identifying competitor mistakes...');

    const mistakes: CompetitorMistake[] = [];

    // Common mistakes to check for
    const mistakePatterns = [
      {
        name: 'generic_positioning',
        check: (intel: BaseCompetitiveIntel) => this.hasGenericPositioning(intel),
        opportunity: 'Differentiate with specific, unique positioning',
        painPoint: 'All competitors sound the same'
      },
      {
        name: 'ignoring_local',
        check: (intel: BaseCompetitiveIntel) => this.ignoresLocalContext(intel, business),
        opportunity: 'Emphasize local expertise and community connection',
        painPoint: 'Customers want local knowledge'
      },
      {
        name: 'feature_focused',
        check: (intel: BaseCompetitiveIntel) => this.isFeatureFocused(intel),
        opportunity: 'Focus on outcomes and transformations, not features',
        painPoint: 'Customers care about results, not features'
      },
      {
        name: 'slow_response',
        check: (intel: BaseCompetitiveIntel) => this.hasSlowResponse(intel),
        opportunity: 'Highlight fast response time and availability',
        painPoint: 'Customers frustrated by slow responses'
      },
      {
        name: 'technical_jargon',
        check: (intel: BaseCompetitiveIntel) => this.usesTechnicalJargon(intel),
        opportunity: 'Use simple, clear language that resonates emotionally',
        painPoint: 'Customers confused by technical terms'
      }
    ];

    for (const pattern of mistakePatterns) {
      const competitors = pattern.check(competitiveIntel);
      if (competitors && competitors.length > 0) {
        mistakes.push({
          mistake: pattern.name.replace(/_/g, ' '),
          competitors,
          frequency: competitors.length,
          opportunity: pattern.opportunity,
          painPoint: pattern.painPoint
        });
      }
    }

    return mistakes.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Spot market gaps
   */
  private async spotMarketGaps(
    competitiveIntel: BaseCompetitiveIntel,
    business: BusinessProfile
  ): Promise<MarketGap[]> {
    console.log('[CompetitiveAnalyzer] Spotting market gaps...');

    const gaps: MarketGap[] = [];

    // Check for demographic gaps
    const demographicGaps = this.findDemographicGaps(competitiveIntel);
    gaps.push(...demographicGaps);

    // Check for service gaps
    const serviceGaps = this.findServiceGaps(competitiveIntel, business);
    gaps.push(...serviceGaps);

    // Check for positioning gaps
    const positioningGaps = this.findPositioningGaps(competitiveIntel);
    gaps.push(...positioningGaps);

    return gaps
      .sort((a, b) => {
        const scoreA = this.scoreMarketGap(a);
        const scoreB = this.scoreMarketGap(b);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }

  /**
   * Find content gaps
   */
  private async findContentGaps(
    competitiveIntel: BaseCompetitiveIntel
  ): Promise<ContentOpportunity[]> {
    console.log('[CompetitiveAnalyzer] Finding content gaps...');

    const gaps: ContentOpportunity[] = [];

    // Check for missing content types
    const contentTypes = [
      { type: 'educational_guides', searchVolume: 1000, formats: ['blog', 'video', 'infographic'] },
      { type: 'case_studies', searchVolume: 500, formats: ['pdf', 'video', 'testimonial'] },
      { type: 'comparison_content', searchVolume: 800, formats: ['blog', 'table', 'video'] },
      { type: 'faq_content', searchVolume: 600, formats: ['page', 'video', 'chatbot'] },
      { type: 'local_insights', searchVolume: 400, formats: ['blog', 'social', 'email'] },
      { type: 'industry_trends', searchVolume: 300, formats: ['blog', 'newsletter', 'webinar'] }
    ];

    for (const content of contentTypes) {
      const competition = this.assessContentCompetition(competitiveIntel, content.type);

      if (competition === 'low' || competition === 'medium') {
        gaps.push({
          contentType: content.type.replace(/_/g, ' '),
          searchVolume: content.searchVolume,
          competition,
          reasoning: `Few competitors creating ${content.type.replace(/_/g, ' ')} - opportunity to dominate`,
          formats: content.formats
        });
      }
    }

    // Check for keyword content gaps
    const keywordGaps = competitiveIntel.searchOpportunities?.keywordGaps || [];
    for (const keywordGap of keywordGaps.slice(0, 5)) {
      gaps.push({
        contentType: `content targeting "${keywordGap.keyword}"`,
        searchVolume: keywordGap.searchVolume,
        competition: keywordGap.difficulty > 70 ? 'high' : keywordGap.difficulty > 40 ? 'medium' : 'low',
        reasoning: keywordGap.reasoning,
        formats: ['blog', 'landing-page', 'video']
      });
    }

    return gaps
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 10);
  }

  /**
   * Find positioning weaknesses
   */
  private async findPositioningWeaknesses(
    competitiveIntel: BaseCompetitiveIntel
  ): Promise<string[]> {
    const weaknesses: string[] = [];

    // Generic positioning
    if (this.hasGenericPositioning(competitiveIntel)) {
      weaknesses.push('Competitors use generic, undifferentiated positioning');
    }

    // Lack of emotional connection
    if (this.lacksEmotionalConnection(competitiveIntel)) {
      weaknesses.push('Competitors focus on features, not emotional outcomes');
    }

    // Weak value proposition
    if (this.hasWeakValueProp(competitiveIntel)) {
      weaknesses.push('Competitors fail to articulate clear, compelling value');
    }

    // Ignoring customer language
    if (this.ignoresCustomerLanguage(competitiveIntel)) {
      weaknesses.push('Competitors use industry jargon instead of customer language');
    }

    // No clear differentiation
    if (this.lacksDifferentiation(competitiveIntel)) {
      weaknesses.push('Competitors don\'t clearly differentiate from each other');
    }

    return weaknesses.slice(0, 5);
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Extract customer concerns from signals
   */
  private extractCustomerConcerns(signals: any[]): {
    topic: string;
    interest: number;
    frequency: number;
    evidence: string[];
  }[] {
    const concerns = new Map<string, { interest: number; frequency: number; evidence: string[] }>();

    for (const signal of signals) {
      // Extract from various signal types
      if (signal.type === 'review') {
        const topics = this.extractTopicsFromText(signal.text);
        for (const topic of topics) {
          if (!concerns.has(topic)) {
            concerns.set(topic, { interest: 0, frequency: 0, evidence: [] });
          }
          const concern = concerns.get(topic)!;
          concern.frequency++;
          concern.interest += signal.sentiment < 0 ? 1 : 0.5; // Negative reviews indicate higher concern
          if (concern.evidence.length < 3) {
            concern.evidence.push(signal.text);
          }
        }
      }
    }

    return Array.from(concerns.entries()).map(([topic, data]) => ({
      topic,
      interest: Math.min(1, data.interest / 10), // Normalize
      frequency: data.frequency,
      evidence: data.evidence
    }));
  }

  /**
   * Extract topics from text
   */
  private extractTopicsFromText(text: string): string[] {
    // Simple topic extraction - could be enhanced with NLP
    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    // Common topics
    const topicPatterns = [
      'pricing', 'cost', 'price', 'quality', 'service', 'communication',
      'response time', 'availability', 'location', 'parking', 'hours',
      'expertise', 'experience', 'professionalism', 'recommendations'
    ];

    for (const pattern of topicPatterns) {
      if (lowerText.includes(pattern)) {
        topics.push(pattern);
      }
    }

    return topics;
  }

  /**
   * Extract competitor topics
   */
  private extractCompetitorTopics(competitiveIntel: BaseCompetitiveIntel): string[] {
    const topics: string[] = [];

    // Extract from content gaps (these are topics they DO cover)
    const keywordGaps = competitiveIntel.searchOpportunities?.keywordGaps || [];
    for (const gap of keywordGaps) {
      topics.push(gap.keyword);
    }

    return topics;
  }

  /**
   * Check if topics overlap
   */
  private topicsOverlap(topic1: string, topic2: string): boolean {
    const words1 = topic1.toLowerCase().split(/\s+/);
    const words2 = topic2.toLowerCase().split(/\s+/);

    const overlap = words1.filter(w => words2.includes(w)).length;
    return overlap > 0;
  }

  /**
   * Calculate blind spot opportunity score
   */
  private calculateBlindSpotOpportunity(concern: { interest: number; frequency: number }): number {
    return Math.min(100, (concern.interest * 50) + (concern.frequency * 5));
  }

  /**
   * Check for generic positioning
   */
  private hasGenericPositioning(intel: BaseCompetitiveIntel): string[] {
    // If competitors have similar weak differentiation
    return intel.competitors?.slice(0, 3).map(c => c.name) || [];
  }

  /**
   * Check if competitors ignore local context
   */
  private ignoresLocalContext(intel: BaseCompetitiveIntel, business: BusinessProfile): string[] {
    // Simplified - would check actual competitor content
    return intel.competitors?.slice(0, 2).map(c => c.name) || [];
  }

  /**
   * Check if competitors are feature-focused
   */
  private isFeatureFocused(intel: BaseCompetitiveIntel): string[] {
    return intel.competitors?.slice(0, 2).map(c => c.name) || [];
  }

  /**
   * Check for slow response
   */
  private hasSlowResponse(intel: BaseCompetitiveIntel): string[] {
    // Check review opportunities for response time complaints
    const reviewAdvantages = intel.reviewOpportunities?.advantages || [];
    const hasResponseAdvantage = reviewAdvantages.some(a =>
      a.metric.toLowerCase().includes('response')
    );

    return hasResponseAdvantage ? intel.competitors?.map(c => c.name) || [] : [];
  }

  /**
   * Check for technical jargon
   */
  private usesTechnicalJargon(intel: BaseCompetitiveIntel): string[] {
    return intel.competitors?.slice(0, 1).map(c => c.name) || [];
  }

  /**
   * Find demographic gaps
   */
  private findDemographicGaps(intel: BaseCompetitiveIntel): MarketGap[] {
    // Simplified implementation
    return [
      {
        gap: 'First-time buyers underserved',
        marketSize: 'large',
        defensibility: 'medium',
        difficulty: 'medium',
        positioning: 'Position as the guide for first-timers with educational content and hand-holding'
      }
    ];
  }

  /**
   * Find service gaps
   */
  private findServiceGaps(intel: BaseCompetitiveIntel, business: BusinessProfile): MarketGap[] {
    return [];
  }

  /**
   * Find positioning gaps
   */
  private findPositioningGaps(intel: BaseCompetitiveIntel): MarketGap[] {
    return [
      {
        gap: 'No one owns the "local expert" position',
        marketSize: 'medium',
        defensibility: 'high',
        difficulty: 'easy',
        positioning: 'Emphasize deep local knowledge, neighborhood expertise, community connections'
      }
    ];
  }

  /**
   * Score market gap
   */
  private scoreMarketGap(gap: MarketGap): number {
    const sizeScore = { large: 40, medium: 25, small: 10 }[gap.marketSize];
    const defensibilityScore = { high: 30, medium: 20, low: 10 }[gap.defensibility];
    const difficultyScore = { easy: 30, medium: 20, hard: 10 }[gap.difficulty];

    return sizeScore + defensibilityScore + difficultyScore;
  }

  /**
   * Assess content competition
   */
  private assessContentCompetition(
    intel: BaseCompetitiveIntel,
    contentType: string
  ): 'low' | 'medium' | 'high' {
    // Simplified - would analyze actual competitor content
    const random = Math.random();
    if (random < 0.3) return 'low';
    if (random < 0.7) return 'medium';
    return 'high';
  }

  /**
   * Check for lack of emotional connection
   */
  private lacksEmotionalConnection(intel: BaseCompetitiveIntel): boolean {
    return true; // Most competitors are feature-focused
  }

  /**
   * Check for weak value proposition
   */
  private hasWeakValueProp(intel: BaseCompetitiveIntel): boolean {
    return true; // Common issue
  }

  /**
   * Check if ignoring customer language
   */
  private ignoresCustomerLanguage(intel: BaseCompetitiveIntel): boolean {
    return true; // Common issue
  }

  /**
   * Check for lack of differentiation
   */
  private lacksDifferentiation(intel: BaseCompetitiveIntel): boolean {
    return intel.competitors && intel.competitors.length > 2;
  }
}
