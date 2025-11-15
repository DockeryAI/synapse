/**
 * OpportunityScorer - Intelligence layer for ranking content opportunities
 *
 * MARBA PHILOSOPHY:
 * This code enforces opportunity-focused language. Every output uses positive,
 * empowering framing. Never says "you're behind" - always "opportunity to grow".
 *
 * Analyzes 50+ potential content signals and ranks them by:
 * - Base urgency (weather alerts > trending > evergreen)
 * - Industry trigger alignment (proven customer psychology)
 * - Competitive advantage (gaps = opportunities, not failures)
 * - Platform and seasonal fit
 *
 * Returns sorted list of scored opportunities for content generation.
 */

import type {
  BusinessIntelligence,
  CustomerTrigger,
  OpportunityType,
  UrgencyLevel,
} from './types';

import { URGENCY_SCORES } from './types';

/**
 * A scored content opportunity ready for generation
 */
export interface ScoredOpportunity {
  /** Type of opportunity */
  type: OpportunityType;

  /** Score (0-100) - higher = better */
  score: number;

  /** How urgent this content is */
  urgency: UrgencyLevel;

  /** Human-readable explanation (<15 words, opportunity-focused) */
  reasoning: string;

  /** The actual signal data */
  data: any;

  /** Matched industry trigger if any */
  industryTriggerMatch?: CustomerTrigger;

  /** Competitive advantage being exploited (positive framing) */
  competitiveAdvantage?: string;
}

/**
 * Scores and ranks content opportunities from business intelligence data
 */
export class OpportunityScorer {
  /**
   * Score and rank ALL opportunities from BusinessIntelligence
   * Returns sorted list (highest score first)
   *
   * Performance: <100ms for 50+ opportunities
   */
  rankOpportunities(businessIntel: BusinessIntelligence): ScoredOpportunity[] {
    const opportunities: ScoredOpportunity[] = [];

    // 1. REAL-TIME SIGNALS (High urgency - first mover advantage)

    // Weather alerts (immediate action needed)
    if (businessIntel.realTimeSignals.weather?.alert) {
      opportunities.push(
        this.scoreSignal('weather_alert', businessIntel.realTimeSignals.weather, businessIntel)
      );
    }

    // Trending topics (high interest right now)
    const trending = businessIntel.realTimeSignals.trending ?? [];
    trending.forEach((trend) => {
      opportunities.push(this.scoreSignal('trending', trend, businessIntel));
    });

    // Local news (timely relevance)
    const localNews = businessIntel.realTimeSignals.localNews ?? [];
    localNews.forEach((news) => {
      opportunities.push(this.scoreSignal('local_news', news, businessIntel));
    });

    // Reddit discussions (community engagement)
    const redditDiscussions = businessIntel.realTimeSignals.redditDiscussions ?? [];
    redditDiscussions.forEach((reddit) => {
      opportunities.push(this.scoreSignal('reddit_discussion', reddit, businessIntel));
    });

    // 2. COMPETITIVE OPPORTUNITIES (Strategic differentiation)

    // Keyword gaps (opportunity to stand out)
    const keywordGaps = businessIntel.competitive.searchOpportunities.keywordGaps ?? [];
    keywordGaps.slice(0, 10).forEach((gap) => {
      // Top 10 only for performance
      opportunities.push(this.scoreSignal('competitor_gap', gap, businessIntel));
    });

    // Content gaps (valuable topics to own)
    const contentGaps = businessIntel.competitive.searchOpportunities.contentGaps ?? [];
    contentGaps.slice(0, 5).forEach((gap) => {
      opportunities.push(this.scoreSignal('content_gap', gap, businessIntel));
    });

    // Platform gaps (untapped channels)
    const platformGaps = businessIntel.competitive.socialOpportunities.platformGaps ?? [];
    platformGaps.forEach((gap) => {
      opportunities.push(this.scoreSignal('platform_gap', gap, businessIntel));
    });

    // Timing gaps (open time slots)
    const timingGaps = businessIntel.competitive.socialOpportunities.timingGaps ?? [];
    timingGaps.forEach((gap) => {
      opportunities.push(this.scoreSignal('timing_gap', gap, businessIntel));
    });

    // Format gaps (format opportunities)
    const formatGaps = businessIntel.competitive.socialOpportunities.formatGaps ?? [];
    formatGaps.forEach((gap) => {
      opportunities.push(this.scoreSignal('format_gap', gap, businessIntel));
    });

    // 3. REVIEW OPPORTUNITIES (Showcase strengths)

    // Review advantages (highlight strengths)
    const advantages = businessIntel.competitive.reviewOpportunities.advantages ?? [];
    advantages.forEach((advantage) => {
      opportunities.push(this.scoreSignal('review_advantage', advantage, businessIntel));
    });

    // Competitor weaknesses (strategic positioning)
    const weaknesses = businessIntel.competitive.reviewOpportunities.weaknessesToExploit ?? [];
    weaknesses.forEach((weakness) => {
      opportunities.push(this.scoreSignal('competitor_weakness', weakness, businessIntel));
    });

    // Recent reviews (fresh customer success stories) - last 7 days only
    const recentReviews = businessIntel.reviewData.recentReviews ?? [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    recentReviews.forEach((review) => {
      try {
        const reviewDate = new Date(review.date).getTime();
        if (reviewDate > sevenDaysAgo) {
          opportunities.push(this.scoreSignal('recent_review', review, businessIntel));
        }
      } catch (e) {
        // Invalid date, skip this review
      }
    });

    // 4. SEASONAL OPPORTUNITIES (Current month only)

    const seasonalTrends = businessIntel.industryProfile.seasonalTrends ?? [];
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

    const currentSeasonalTrends = seasonalTrends.filter((trend) => trend.month === currentMonth);
    currentSeasonalTrends.forEach((trend) => {
      opportunities.push(this.scoreSignal('seasonal', trend, businessIntel));
    });

    // 5. EVERGREEN OPPORTUNITIES (Top 3 proven triggers as fallback)

    const customerTriggers = businessIntel.industryProfile.customerTriggers ?? [];
    customerTriggers.slice(0, 3).forEach((trigger) => {
      opportunities.push(this.scoreSignal('evergreen', trigger, businessIntel));
    });

    // Sort by score (highest first)
    return opportunities.sort((a, b) => b.score - a.score);
  }

  /**
   * Score a single signal/opportunity
   *
   * Algorithm:
   * 1. Base score from URGENCY_SCORES (0-100)
   * 2. Industry trigger match bonus (+20 max)
   * 3. Competitive advantage bonus (+15)
   * 4. Platform fit bonus (+10)
   * 5. Seasonal alignment bonus (+10)
   * 6. Cap at 100, calculate urgency
   */
  scoreSignal(
    signalType: OpportunityType,
    signalData: any,
    businessIntel: BusinessIntelligence
  ): ScoredOpportunity {
    // Step 1: Base score (0-100 scale)
    const baseUrgency = URGENCY_SCORES[signalType] ?? 5;
    let score = baseUrgency * 10;

    // Track what bonuses were applied (for reasoning)
    let industryTriggerMatch: CustomerTrigger | undefined;
    let competitiveAdvantage: string | undefined;
    let platformFit = false;
    let seasonalMatch = false;

    // Step 2: Industry Trigger Match (+20 max)
    const triggerMatch = this.matchesIndustryTrigger(signalData, businessIntel);
    if (triggerMatch) {
      const bonus = Math.min(20, triggerMatch.urgencyScore * 2);
      score += bonus;
      industryTriggerMatch = triggerMatch;
    }

    // Step 3: Competitive Advantage (+15)
    const advantage = this.hasCompetitiveAdvantage(signalType, businessIntel);
    if (advantage) {
      score += 15;
      competitiveAdvantage = advantage;
    }

    // Step 4: Platform Fit (+10)
    if (this.matchesBestPlatform(signalData, businessIntel)) {
      score += 10;
      platformFit = true;
    }

    // Step 5: Seasonal Alignment (+10)
    if (this.matchesSeasonalTrend(signalData, businessIntel)) {
      score += 10;
      seasonalMatch = true;
    }

    // Step 6: Cap at 100
    score = Math.min(100, score);

    // Calculate urgency level
    const urgency = this.calculateUrgency(signalType, score);

    // Build opportunity-focused reasoning string
    const reasoning = this.buildReasoning(
      signalType,
      triggerMatch,
      competitiveAdvantage || null,
      platformFit,
      seasonalMatch
    );

    return {
      type: signalType,
      score,
      urgency,
      reasoning,
      data: signalData,
      industryTriggerMatch,
      competitiveAdvantage,
    };
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Check if signal matches any industry trigger
   * Returns matched trigger or null
   *
   * Uses keyword matching between signal text and trigger phrases
   */
  private matchesIndustryTrigger(
    signalData: any,
    businessIntel: BusinessIntelligence
  ): CustomerTrigger | null {
    const triggers = businessIntel?.industryProfile?.customerTriggers ?? [];
    if (triggers.length === 0) return null;

    // Convert signal to searchable text
    const signalText = this.extractSignalText(signalData).toLowerCase();
    if (!signalText) return null;

    // Check each trigger for keyword overlap
    for (const trigger of triggers) {
      const triggerKeywords = trigger.trigger.toLowerCase().split(/\s+/);
      const hasMatch = triggerKeywords.some((keyword) => signalText.includes(keyword));

      if (hasMatch) {
        return trigger;
      }
    }

    return null;
  }

  /**
   * Extract searchable text from various signal data structures
   */
  private extractSignalText(signalData: any): string {
    if (!signalData) return '';
    if (typeof signalData === 'string') return signalData;

    // Handle different signal structures
    if (signalData.alert) return signalData.alert; // Weather
    if (signalData.topic) return signalData.topic; // Trending, Reddit
    if (signalData.headline) return signalData.headline; // Local news
    if (signalData.keyword) return signalData.keyword; // Keyword gap
    if (signalData.trigger) return signalData.trigger; // Customer trigger
    if (signalData.opportunity) return signalData.opportunity; // Platform/timing/format gap
    if (signalData.weakness) return signalData.weakness; // Competitor weakness
    if (signalData.text) return signalData.text; // Review

    // Fallback: stringify and hope for the best
    return JSON.stringify(signalData);
  }

  /**
   * Determine if signal represents competitive advantage
   * Returns positive-framed advantage description or null
   *
   * CRITICAL: All descriptions use opportunity-focused language
   */
  private hasCompetitiveAdvantage(
    signalType: OpportunityType,
    businessIntel: BusinessIntelligence
  ): string | null {
    // Mapping of types to POSITIVE advantage descriptions
    // ✅ "Opportunity to..." NOT "You're behind..."
    const advantages: Record<string, string> = {
      // Competitive gaps = opportunities to differentiate
      competitor_gap: 'Opportunity to stand out',
      content_gap: 'Valuable topic to own',
      platform_gap: 'Untapped channel ready',
      timing_gap: 'Open time slot available',
      format_gap: 'Format opportunity ready',

      // Review opportunities = showcase strengths
      review_advantage: 'Showcase your strength',
      competitor_weakness: 'Strategic advantage available',

      // Real-time signals = first mover advantage
      weather_alert: 'First mover advantage',
      local_news: 'First mover advantage',
      trending: 'First mover advantage',
      trending_search: 'First mover advantage',
      reddit_discussion: 'First mover advantage',
    };

    return advantages[signalType] || null;
  }

  /**
   * Check if signal matches best platforms for this industry
   */
  private matchesBestPlatform(signalData: any, businessIntel: BusinessIntelligence): boolean {
    const bestPlatforms = businessIntel?.industryProfile?.bestPlatforms ?? [];
    if (bestPlatforms.length === 0) return false;

    // Check if signal has platform data
    const platform = signalData?.platform;
    if (!platform) return false;

    return bestPlatforms.includes(platform);
  }

  /**
   * Check if signal aligns with current month's seasonal trends
   */
  private matchesSeasonalTrend(signalData: any, businessIntel: BusinessIntelligence): boolean {
    const seasonalTrends = businessIntel?.industryProfile?.seasonalTrends ?? [];
    if (seasonalTrends.length === 0) return false;

    // Get current month
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentTrend = seasonalTrends.find((trend) => trend.month === currentMonth);

    if (!currentTrend) return false;

    // NOTE: Database schema has { month, variation, reason } but no keywords field
    // Check if keywords field exists for backward compatibility
    if (!currentTrend.keywords || !Array.isArray(currentTrend.keywords)) {
      // Fallback: match based on reason text if keywords not available
      const signalText = this.extractSignalText(signalData).toLowerCase();
      const reasonText = currentTrend.reason?.toLowerCase() || '';
      return signalText.length > 0 && reasonText.length > 0 && signalText.includes(reasonText);
    }

    // Extract signal text
    const signalText = this.extractSignalText(signalData).toLowerCase();
    if (!signalText) return false;

    // Check if signal keywords overlap with seasonal keywords
    return currentTrend.keywords.some((keyword) => signalText.includes(keyword.toLowerCase()));
  }

  /**
   * Calculate urgency level based on type and score
   *
   * Urgency determines when content should be posted:
   * - immediate: Today ASAP (weather, breaking news)
   * - today: Today sometime (trending, recent reviews)
   * - this_week: Within 7 days (good opportunities)
   * - evergreen: Anytime (always relevant)
   */
  private calculateUrgency(signalType: OpportunityType, score: number): UrgencyLevel {
    // Always immediate for critical signals
    if (['weather_alert', 'local_news'].includes(signalType)) {
      return 'immediate';
    }

    // Always today for high-urgency signals
    if (['trending', 'trending_search', 'recent_review', 'reddit_discussion'].includes(signalType)) {
      return 'today';
    }

    // Score-based for everything else
    if (score >= 70) return 'today';
    if (score >= 50) return 'this_week';
    return 'evergreen';
  }

  /**
   * Build human-readable reasoning string
   * <15 words, opportunity-focused language only
   *
   * CRITICAL: Uses only positive, empowering framing
   * Never says "you're behind" - always "opportunity to grow"
   */
  private buildReasoning(
    type: OpportunityType,
    triggerMatch: CustomerTrigger | null,
    competitiveAdvantage: string | null,
    platformFit: boolean,
    seasonalMatch: boolean
  ): string {
    const reasons: string[] = [];

    // Base reasons (positive framing)
    const baseReasons: Record<OpportunityType, string> = {
      weather_alert: 'Creates urgency and relevance',
      trending: 'High interest right now',
      trending_search: 'High search interest',
      local_news: 'Timely local connection',
      reddit_discussion: 'Active community discussion',
      competitor_gap: 'Opportunity to differentiate',
      content_gap: 'Valuable topic available',
      platform_gap: 'Channel ready to activate',
      timing_gap: 'Perfect timing opportunity',
      format_gap: 'Format advantage available',
      review_advantage: 'Highlight your strength',
      recent_review: 'Fresh customer success',
      competitor_weakness: 'Strategic positioning ready',
      seasonal: 'Seasonal alignment',
      evergreen: 'Proven industry trigger',
      milestone: 'Achievement to celebrate',
    };

    reasons.push(baseReasons[type] ?? 'Strategic opportunity');

    // Add trigger match
    if (triggerMatch) {
      reasons.push(`matches "${triggerMatch.trigger}"`);
    }

    // Add competitive advantage (already positive-framed)
    if (competitiveAdvantage) {
      reasons.push(competitiveAdvantage);
    }

    // Add platform fit
    if (platformFit) {
      reasons.push('optimal platform');
    }

    // Add seasonal match
    if (seasonalMatch) {
      reasons.push('seasonal peak');
    }

    // Join with bullet separator, keep under 15 words (4 reasons max)
    return reasons.slice(0, 4).join(' • ');
  }
}
