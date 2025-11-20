/**
 * EQ Campaign Integration Service
 *
 * Enhances campaign generation with EQ-aware content adjustments.
 * Wraps existing campaign generators to inject emotional intelligence.
 *
 * Integration Points:
 * 1. Pre-generation: Enrich BusinessProfile with EQ context
 * 2. Platform adjustment: Apply EQ modifiers for each platform
 * 3. Post-generation: Track performance for learning
 *
 * Created: 2025-11-19
 */

import { eqIntegration } from './eq-integration.service';
import { eqStorage } from './eq-storage.service';
import type {
  EQCalculationResult,
  EQScore,
  Platform as EQPlatform,
  SeasonalAdjustment,
  EQAdjustmentContext,
} from '@/types/eq-calculator.types';
import type { BusinessProfile } from '@/types/synapseContent.types';
import type { Platform } from '@/types/campaign-generation.types';

/**
 * EQ-enriched business profile for content generation
 */
export interface EQEnrichedProfile extends BusinessProfile {
  eqContext: {
    overall_eq: number;
    emotional_score: number;
    rational_score: number;
    confidence: number;
    specialty?: string;
    tone_guidance: ToneGuidance;
    recommendations: string[];
  };
}

/**
 * Tone guidance for content generation
 */
export interface ToneGuidance {
  primary_tone: string;
  secondary_tone: string;
  messaging_focus: string;
  cta_style: string;
}

/**
 * EQ-adjusted platform context
 */
export interface PlatformEQContext {
  platform: Platform;
  base_eq: number;
  adjusted_eq: number;
  adjustment: number;
  tone_guidance: ToneGuidance;
}

/**
 * Full EQ context for campaign generation
 */
export interface CampaignEQContext {
  brandId: string;
  base_eq: EQScore;
  platform_adjustments: PlatformEQContext[];
  seasonal_adjustment?: number;
  campaign_type_adjustment?: number;
  final_eq: number;
  tone_guidance: ToneGuidance;
  recommendations: string[];
}

/**
 * EQ Campaign Integration Service
 */
class EQCampaignIntegrationService {
  /**
   * Enrich BusinessProfile with EQ context for content generation
   */
  async enrichBusinessProfile(
    profile: BusinessProfile,
    brandId: string,
    options: {
      websiteContent?: string[];
      specialty?: string;
      forceRecalculate?: boolean;
    } = {}
  ): Promise<EQEnrichedProfile> {
    try {
      let eqResult: EQCalculationResult | null = null;

      // Try to load cached EQ first
      if (!options.forceRecalculate) {
        eqResult = await eqStorage.loadEQScore(brandId);
      }

      // Calculate if not cached or force recalculate
      if (!eqResult && options.websiteContent) {
        eqResult = await eqIntegration.calculateEQ({
          businessName: profile.name || 'Unknown Business',
          websiteContent: options.websiteContent,
          specialty: options.specialty,
        });

        // Save for future use
        await eqStorage.saveEQScore(brandId, eqResult);
      }

      // Fallback to default EQ if no calculation available
      const eqScore = eqResult?.eq_score || {
        emotional: 50,
        rational: 50,
        overall: 50,
        confidence: 50,
        calculation_method: 'content_only' as const,
      };

      const toneGuidance = eqIntegration.getToneGuidance(eqScore.overall);

      // Enrich profile with EQ context
      const enrichedProfile: EQEnrichedProfile = {
        ...profile,
        eqContext: {
          overall_eq: eqScore.overall,
          emotional_score: eqScore.emotional,
          rational_score: eqScore.rational,
          confidence: eqScore.confidence,
          specialty: eqResult?.specialty_context?.specialty,
          tone_guidance: toneGuidance,
          recommendations: eqResult?.recommendations.map((r) => r.recommendation) || [],
        },
      };

      console.log('[EQCampaignIntegration] Enriched profile with EQ:', eqScore.overall);

      return enrichedProfile;
    } catch (error) {
      console.error('[EQCampaignIntegration] Failed to enrich profile:', error);

      // Return profile with default EQ context
      return {
        ...profile,
        eqContext: {
          overall_eq: 50,
          emotional_score: 50,
          rational_score: 50,
          confidence: 50,
          tone_guidance: eqIntegration.getToneGuidance(50),
          recommendations: [],
        },
      };
    }
  }

  /**
   * Get full EQ context for campaign generation across multiple platforms
   */
  async getCampaignEQContext(
    brandId: string,
    platforms: Platform[],
    options: {
      businessName: string;
      websiteContent?: string[];
      specialty?: string;
      season?: 'holiday' | 'tax-season' | 'back-to-school' | 'q4-planning' | 'summer' | 'custom';
      campaignType?: 'brand-awareness' | 'direct-response' | 'nurture' | 'retention';
      forceRecalculate?: boolean;
    }
  ): Promise<CampaignEQContext> {
    try {
      // Load or calculate base EQ
      let eqResult: EQCalculationResult | null = null;

      if (!options.forceRecalculate) {
        eqResult = await eqStorage.loadEQScore(brandId);
      }

      if (!eqResult && options.websiteContent) {
        eqResult = await eqIntegration.calculateEQ({
          businessName: options.businessName,
          websiteContent: options.websiteContent,
          specialty: options.specialty,
        });

        await eqStorage.saveEQScore(brandId, eqResult);
      }

      const baseEQ = eqResult?.eq_score || {
        emotional: 50,
        rational: 50,
        overall: 50,
        confidence: 50,
        calculation_method: 'content_only' as const,
      };

      // Calculate platform adjustments
      const platformAdjustments: PlatformEQContext[] = [];

      for (const platform of platforms) {
        const platformType = this.mapPlatformToEQPlatform(platform);
        const adjustedEQ = await eqIntegration.getPlatformAdjustedEQ({
          businessName: options.businessName,
          websiteContent: options.websiteContent || [],
          platform: platformType,
          specialty: options.specialty,
        });

        const adjustment = adjustedEQ.overall - baseEQ.overall;
        const toneGuidance = eqIntegration.getToneGuidance(adjustedEQ.overall);

        platformAdjustments.push({
          platform,
          base_eq: baseEQ.overall,
          adjusted_eq: adjustedEQ.overall,
          adjustment,
          tone_guidance: toneGuidance,
        });
      }

      // Calculate seasonal adjustment (if season is provided)
      let seasonalAdjustment = 0;
      if (options.season && options.websiteContent) {
        // For now, we'll apply a simple modifier based on season
        // This would ideally call a method on eqIntegration
        seasonalAdjustment = 0; // Placeholder - implement seasonal logic
      }

      // Calculate campaign type adjustment (if type is provided)
      let campaignTypeAdjustment = 0;
      if (options.campaignType && options.websiteContent) {
        // For now, we'll apply a simple modifier based on campaign type
        // This would ideally call a method on eqIntegration
        campaignTypeAdjustment = 0; // Placeholder - implement campaign type logic
      }

      // Calculate final EQ (average of platform adjustments + seasonal + campaign type)
      const avgPlatformEQ =
        platformAdjustments.reduce((sum, p) => sum + p.adjusted_eq, 0) /
        platformAdjustments.length;
      const finalEQ = Math.max(
        0,
        Math.min(100, avgPlatformEQ + seasonalAdjustment + campaignTypeAdjustment)
      );

      const finalToneGuidance = eqIntegration.getToneGuidance(finalEQ);

      return {
        brandId,
        base_eq: baseEQ,
        platform_adjustments: platformAdjustments,
        seasonal_adjustment: seasonalAdjustment,
        campaign_type_adjustment: campaignTypeAdjustment,
        final_eq: finalEQ,
        tone_guidance: finalToneGuidance,
        recommendations: eqResult?.recommendations.map((r) => r.recommendation) || [],
      };
    } catch (error) {
      console.error('[EQCampaignIntegration] Failed to get campaign EQ context:', error);

      // Return default context
      return {
        brandId,
        base_eq: {
          emotional: 50,
          rational: 50,
          overall: 50,
          confidence: 50,
          calculation_method: 'content_only',
        },
        platform_adjustments: platforms.map((platform) => ({
          platform,
          base_eq: 50,
          adjusted_eq: 50,
          adjustment: 0,
          tone_guidance: eqIntegration.getToneGuidance(50),
        })),
        final_eq: 50,
        tone_guidance: eqIntegration.getToneGuidance(50),
        recommendations: [],
      };
    }
  }

  /**
   * Get EQ guidance prompt for AI content generation
   */
  getEQGuidancePrompt(eq: number, toneGuidance?: ToneGuidance): string {
    const guidance = toneGuidance || eqIntegration.getToneGuidance(eq);

    if (eq >= 70) {
      return `
EMOTIONAL QUOTIENT: ${eq}/100 (Highly Emotional)

TONE GUIDANCE:
- Primary Tone: ${guidance.primary_tone} (emphasize storytelling, transformation, emotional resonance)
- Secondary Tone: ${guidance.secondary_tone}
- Messaging Focus: ${guidance.messaging_focus}
- CTA Style: ${guidance.cta_style}

CONTENT STRATEGY:
- Lead with emotional hooks and transformation stories
- Use sensory language and vivid imagery
- Emphasize "how it feels" over "how it works"
- Include customer stories and testimonials
- Create urgency through emotional connection
- Minimal technical details, focus on outcomes and feelings

AVOID:
- Heavy data and statistics
- Technical jargon
- Rational feature lists
- Corporate/formal language
`;
    } else if (eq >= 50) {
      return `
EMOTIONAL QUOTIENT: ${eq}/100 (Balanced)

TONE GUIDANCE:
- Primary Tone: ${guidance.primary_tone} (mix emotional resonance with practical benefits)
- Secondary Tone: ${guidance.secondary_tone}
- Messaging Focus: ${guidance.messaging_focus}
- CTA Style: ${guidance.cta_style}

CONTENT STRATEGY:
- Balance emotional hooks with practical benefits
- Lead with transformation, support with proof
- Use both stories AND data points
- Appeal to both heart and mind
- Mix aspirational and pragmatic messaging

BEST PRACTICES:
- Start emotional, end practical (or vice versa)
- Use concrete examples with emotional framing
- Include both customer stories and results
`;
    } else if (eq >= 30) {
      return `
EMOTIONAL QUOTIENT: ${eq}/100 (Functional-Leaning)

TONE GUIDANCE:
- Primary Tone: ${guidance.primary_tone} (emphasize results with relational warmth)
- Secondary Tone: ${guidance.secondary_tone}
- Messaging Focus: ${guidance.messaging_focus}
- CTA Style: ${guidance.cta_style}

CONTENT STRATEGY:
- Lead with measurable benefits and ROI
- Support with light emotional connection
- Use data, case studies, and proof points
- Maintain professional but approachable tone
- Focus on "how it works" with some "why it matters"

BEST PRACTICES:
- Open with compelling statistics or results
- Use bullet points and clear structure
- Include customer success metrics
- Keep emotional elements subtle (trust, reliability)
`;
    } else {
      return `
EMOTIONAL QUOTIENT: ${eq}/100 (Highly Rational)

TONE GUIDANCE:
- Primary Tone: ${guidance.primary_tone} (focus on data, ROI, and measurable outcomes)
- Secondary Tone: ${guidance.secondary_tone}
- Messaging Focus: ${guidance.messaging_focus}
- CTA Style: ${guidance.cta_style}

CONTENT STRATEGY:
- Lead with hard data, ROI, and efficiency gains
- Use technical accuracy and specificity
- Emphasize features, specifications, and capabilities
- Focus heavily on "how it works" and "what you get"
- Minimize emotional language
- Use authoritative, expert tone

BEST PRACTICES:
- Open with quantified value propositions
- Use comparison charts and data visualizations
- Include technical specifications
- Reference industry standards and certifications
- Keep language precise and professional

AVOID:
- Flowery or emotional language
- Vague aspirational messaging
- Personal stories without data
- Soft CTAs
`;
    }
  }

  /**
   * Track campaign performance for EQ validation
   */
  async trackCampaignPerformance(
    brandId: string,
    contentId: string,
    metrics: {
      platform: Platform;
      contentType: string;
      impressions?: number;
      engagementCount?: number;
      engagementRate?: number;
      clickCount?: number;
      clickRate?: number;
      conversionCount?: number;
      conversionRate?: number;
      publishedAt?: string;
    }
  ): Promise<void> {
    try {
      // Get the EQ used for this content
      const eqResult = await eqStorage.loadEQScore(brandId);

      if (!eqResult) {
        console.warn('[EQCampaignIntegration] No EQ found for brand, skipping tracking');
        return;
      }

      // Get platform-adjusted EQ
      const platformType = this.mapPlatformToEQPlatform(metrics.platform);
      const platformEQ = await eqIntegration.getPlatformAdjustedEQ({
        businessName: 'N/A', // Not needed for cached EQ
        websiteContent: [],
        platform: platformType,
      });

      // Track performance
      await eqStorage.trackPerformance({
        brandId,
        contentId,
        contentType: metrics.contentType,
        platform: metrics.platform,
        contentEQ: platformEQ.overall,
        targetEQ: eqResult.eq_score.overall,
        impressions: metrics.impressions,
        engagementCount: metrics.engagementCount,
        engagementRate: metrics.engagementRate,
        clickCount: metrics.clickCount,
        clickRate: metrics.clickRate,
        conversionCount: metrics.conversionCount,
        conversionRate: metrics.conversionRate,
        publishedAt: metrics.publishedAt,
      });

      console.log('[EQCampaignIntegration] Performance tracked for content:', contentId);
    } catch (error) {
      console.error('[EQCampaignIntegration] Failed to track performance:', error);
    }
  }

  /**
   * Get performance insights for a brand
   */
  async getPerformanceInsights(brandId: string) {
    return await eqStorage.getPerformanceInsights(brandId);
  }

  /**
   * Map Platform to EQPlatform
   */
  private mapPlatformToEQPlatform(platform: Platform): EQPlatform {
    const mapping: Record<string, EQPlatform> = {
      'linkedin': 'linkedin',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'twitter': 'twitter',
      'x': 'twitter',
      'tiktok': 'tiktok',
    };

    return mapping[platform] || 'linkedin';
  }
}

// Export singleton instance
export const eqCampaignIntegration = new EQCampaignIntegrationService();
export { EQCampaignIntegrationService };
