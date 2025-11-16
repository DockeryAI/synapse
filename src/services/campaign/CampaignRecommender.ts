/**
 * Campaign Recommender Service
 * 
 * Analyzes DeepContext intelligence data to recommend the best campaign type
 * for a given business based on:
 * - Available data strength (reviews, location, expertise)
 * - Industry characteristics
 * - Business type and goals
 */

import { DeepContext } from '../../types/synapse/deepContext.types';
import { CampaignType, CampaignTypeId, CAMPAIGN_TYPES } from '../../types/campaign.types';

export interface RecommendationResult {
  recommended: CampaignType;
  all: CampaignType[];
  reasoning: string;
  confidenceScore: number;
  dataStrength: {
    authority: number;
    socialProof: number;
    localPulse: number;
  };
}

/**
 * Campaign Recommender
 */
export class CampaignRecommender {
  
  /**
   * Recommend the best campaign type based on DeepContext
   */
  recommendCampaignType(context: DeepContext): RecommendationResult {
    const scores = this.calculateScores(context);
    
    // Determine which has highest score
    const highestScore = Math.max(scores.authority, scores.socialProof, scores.localPulse);
    
    let recommendedId: CampaignTypeId;
    let reasoning: string;
    
    if (scores.authority === highestScore) {
      recommendedId = 'authority_builder';
      reasoning = this.getAuthorityReasoning(context, scores);
    } else if (scores.socialProof === highestScore) {
      recommendedId = 'social_proof';
      reasoning = this.getSocialProofReasoning(context, scores);
    } else {
      recommendedId = 'local_pulse';
      reasoning = this.getLocalPulseReasoning(context, scores);
    }
    
    // Build response with all types and mark recommended
    const allTypes: CampaignType[] = Object.values(CAMPAIGN_TYPES).map(type => ({
      ...type,
      recommended: type.id === recommendedId,
      recommendationReason: type.id === recommendedId ? reasoning : undefined,
      confidenceScore: this.getConfidenceForType(type.id, scores)
    }));
    
    const recommended = allTypes.find(t => t.id === recommendedId)!;
    
    return {
      recommended,
      all: allTypes,
      reasoning,
      confidenceScore: highestScore,
      dataStrength: {
        authority: scores.authority,
        socialProof: scores.socialProof,
        localPulse: scores.localPulse
      }
    };
  }
  
  /**
   * Calculate scores for each campaign type (0-1)
   */
  private calculateScores(context: DeepContext): {
    authority: number;
    socialProof: number;
    localPulse: number;
  } {
    return {
      authority: this.scoreAuthority(context),
      socialProof: this.scoreSocialProof(context),
      localPulse: this.scoreLocalPulse(context)
    };
  }
  
  /**
   * Score Authority Builder potential (0-1)
   * Based on: industry expertise, trends data, competitive intelligence
   */
  private scoreAuthority(context: DeepContext): number {
    let score = 0;
    let factors = 0;
    
    // Check for industry expertise data
    if (context.business?.specialty && context.business.specialty.length > 0) {
      score += 0.3;
      factors++;
    }
    
    // Check for industry trends
    if (context.industry?.trends && context.industry.trends.length > 0) {
      score += 0.2;
      factors++;
    }
    
    // Check for competitive intelligence
    if (context.competitiveIntel?.gaps && context.competitiveIntel.gaps.length > 0) {
      score += 0.2;
      factors++;
    }
    
    // Check for synthesis insights (indicates strong analytical capacity)
    if (context.synthesis?.insights && context.synthesis.insights.length > 3) {
      score += 0.15;
      factors++;
    }
    
    // B2B businesses score higher for authority
    if (context.business?.industry && 
        (context.business.industry.toLowerCase().includes('consulting') ||
         context.business.industry.toLowerCase().includes('professional') ||
         context.business.industry.toLowerCase().includes('service'))) {
      score += 0.15;
      factors++;
    }
    
    return factors > 0 ? Math.min(score, 1) : 0.3; // Minimum baseline
  }
  
  /**
   * Score Social Proof potential (0-1)
   * Based on: customer reviews, testimonials, success stories
   */
  private scoreSocialProof(context: DeepContext): number {
    let score = 0;
    let factors = 0;
    
    // Check for review data (OutScraper)
    // Note: DeepContext structure may vary, adapt as needed
    const hasReviews = context.business?.reviews !== undefined && 
                       context.business?.reviews !== null;
    
    if (hasReviews) {
      score += 0.4; // Strong indicator
      factors++;
    }
    
    // Check for customer psychology insights
    if (context.customerPsychology?.desires && 
        context.customerPsychology.desires.length > 0) {
      score += 0.2;
      factors++;
    }
    
    // Check for testimonial-worthy insights
    if (context.synthesis?.opportunities && 
        context.synthesis.opportunities.some(opp => 
          opp.toLowerCase().includes('customer') || 
          opp.toLowerCase().includes('review')
        )) {
      score += 0.2;
      factors++;
    }
    
    // Local businesses often have strong review presence
    if (context.business?.location && context.business.location.city) {
      score += 0.2;
      factors++;
    }
    
    return factors > 0 ? Math.min(score, 1) : 0.3; // Minimum baseline
  }
  
  /**
   * Score Local Pulse potential (0-1)
   * Based on: location data, weather, local events, timing
   */
  private scoreLocalPulse(context: DeepContext): number {
    let score = 0;
    let factors = 0;
    
    // Strong location data is essential
    if (context.business?.location && context.business.location.city) {
      score += 0.3;
      factors++;
    }
    
    // Weather data available
    if (context.realTimeCultural?.weather !== undefined) {
      score += 0.25;
      factors++;
    }
    
    // Local events data
    if (context.realTimeCultural?.localEvents && 
        context.realTimeCultural.localEvents.length > 0) {
      score += 0.25;
      factors++;
    }
    
    // Trending local topics
    if (context.realTimeCultural?.trendingTopics && 
        context.realTimeCultural.trendingTopics.some(topic => 
          topic.scope === 'local'
        )) {
      score += 0.2;
      factors++;
    }
    
    return factors > 0 ? Math.min(score, 1) : 0.3; // Minimum baseline
  }
  
  /**
   * Get confidence score for a specific type
   */
  private getConfidenceForType(
    typeId: CampaignTypeId, 
    scores: { authority: number; socialProof: number; localPulse: number }
  ): number {
    switch (typeId) {
      case 'authority_builder':
        return scores.authority;
      case 'social_proof':
        return scores.socialProof;
      case 'local_pulse':
        return scores.localPulse;
      default:
        return 0.5;
    }
  }
  
  /**
   * Generate reasoning for Authority Builder recommendation
   */
  private getAuthorityReasoning(
    context: DeepContext, 
    scores: { authority: number; socialProof: number; localPulse: number }
  ): string {
    const reasons: string[] = [];
    
    if (context.business?.specialty) {
      reasons.push(`Your specialized expertise in ${context.business.specialty} positions you as an authority`);
    }
    
    if (context.industry?.trends && context.industry.trends.length > 0) {
      reasons.push(`${context.industry.trends.length} industry trends detected for thought leadership content`);
    }
    
    if (context.competitiveIntel?.gaps && context.competitiveIntel.gaps.length > 0) {
      reasons.push(`Identified ${context.competitiveIntel.gaps.length} competitive gaps to address with expert content`);
    }
    
    if (reasons.length === 0) {
      return 'Your industry and business type benefit most from establishing thought leadership';
    }
    
    return reasons.join('. ') + '.';
  }
  
  /**
   * Generate reasoning for Social Proof recommendation
   */
  private getSocialProofReasoning(
    context: DeepContext,
    scores: { authority: number; socialProof: number; localPulse: number }
  ): string {
    const reasons: string[] = [];
    
    if (context.business?.reviews) {
      reasons.push('Strong customer review presence detected');
    }
    
    if (context.customerPsychology?.desires) {
      reasons.push(`Understanding of ${context.customerPsychology.desires.length} customer desires enables compelling testimonial content`);
    }
    
    if (context.business?.location) {
      reasons.push('Local business profile ideal for customer success stories');
    }
    
    if (reasons.length === 0) {
      return 'Your customer base and service delivery model are perfect for social proof campaigns';
    }
    
    return reasons.join('. ') + '.';
  }
  
  /**
   * Generate reasoning for Local Pulse recommendation
   */
  private getLocalPulseReasoning(
    context: DeepContext,
    scores: { authority: number; socialProof: number; localPulse: number }
  ): string {
    const reasons: string[] = [];
    
    if (context.business?.location?.city) {
      reasons.push(`Strong local presence in ${context.business.location.city}`);
    }
    
    if (context.realTimeCultural?.weather) {
      reasons.push('Weather intelligence available for timely campaigns');
    }
    
    if (context.realTimeCultural?.localEvents && context.realTimeCultural.localEvents.length > 0) {
      reasons.push(`${context.realTimeCultural.localEvents.length} local events identified for tie-in opportunities`);
    }
    
    if (reasons.length === 0) {
      return 'Your local market position and timing opportunities are strongest';
    }
    
    return reasons.join('. ') + '.';
  }
}

// Export singleton instance
export const campaignRecommender = new CampaignRecommender();
