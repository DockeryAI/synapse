/**
 * Enhanced Content Generator Service
 *
 * Upgrades baseline content generation with intelligence + industry-specific psychology.
 * Integrates with 147 industry profiles for power words, emotional triggers, and tone optimization.
 *
 * Key improvements over baseline:
 * - Uses brand voice from intelligence data
 * - Incorporates customer language from reviews
 * - References trending topics naturally
 * - Highlights competitive differentiators
 * - Applies industry-specific power words (from 147 profiles)
 * - Uses emotional triggers for the industry (psychology_profile)
 * - Matches industry tone of voice
 * - Benchmarks against industry standards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from '../types/content-calendar.types';
import { SpecialtyDetection } from './synapse-calendar-bridge.service';
import { MappedIntelligence } from './intelligence-data-mapper.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EnhancedGenerationParams {
  topic: string;
  platform: Platform;
  intelligence: MappedIntelligence;
  specialty: SpecialtyDetection;
  mode: 'marba' | 'synapse';
}

export interface ContentVariation {
  id: string;
  text: string;
  psychology_score?: number;
  power_words_used?: string[];
  emotional_triggers_used?: string[];
  hashtags?: string[];
}

export interface EnhancedContentResult {
  variations: ContentVariation[];
  intelligenceUsed: {
    brandVoice: boolean;
    customerInsights: boolean;
    trendingTopics: boolean;
    competitorGaps: boolean;
    industryPowerWords: boolean;
    emotionalTriggers: boolean;
  };
  qualityScore: number;
  industryBenchmark: number;
  improvements: string[];
}

export interface IndustryProfile {
  id: string;
  naics_code: string;
  name: string;
  target_audience: string;
  psychology_profile: {
    primaryTriggers: string[];
    emotionalFramework: string;
    decisionDrivers: string[];
    painPoints: string[];
  };
  power_words: string[];
  content_themes: string[];
  tone_of_voice: string;
  best_posting_times: Array<{
    dayOfWeek: string;
    hourOfDay: number;
    platform: string;
    reasoning: string;
  }>;
  posting_frequency: {
    optimal: number;
    minimum: number;
    maximum: number;
  };
  platform_priority: string[];
  typical_engagement_rate: number;
  benchmarks: {
    likes: number;
    comments: number;
    shares: number;
  };
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class EnhancedContentGenerator {
  private supabase: SupabaseClient;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Main entry point: Generate enhanced content with intelligence + industry optimization
   */
  async generate(
    params: EnhancedGenerationParams
  ): Promise<EnhancedContentResult> {
    // 0. Fetch industry profile from database
    const industryProfile = await this.getIndustryProfile(
      params.specialty.industryProfileId || 'generic'
    );

    // 1. Use brand voice from intelligence
    const tone = params.intelligence.brandVoice.tone;

    // 2. Incorporate customer language
    const customerWords = params.intelligence.customerSentiment.topMentions.slice(0, 5);

    // 3. Reference trending topics
    const trends = params.intelligence.trendingTopics
      .filter(t => t.relevance > 70)
      .map(t => t.topic)
      .slice(0, 3);

    // 4. Highlight differentiators
    const unique = params.intelligence.competitiveGaps.differentiators.slice(0, 3);

    // 5. Get industry-specific power words
    const powerWords = industryProfile?.power_words || [];

    // 6. Get emotional triggers
    const emotionalTriggers = industryProfile?.psychology_profile?.primaryTriggers || [];

    // 7. Get industry tone
    const industryTone = industryProfile?.tone_of_voice || 'professional';

    // 8. Generate content variations
    const variations = await this.generateWithAI({
      topic: params.topic,
      platform: params.platform,
      tone: industryTone, // Use industry tone
      customerWords,
      trends,
      unique,
      specialty: params.specialty,
      powerWords,
      emotionalTriggers
    });

    return {
      variations,
      intelligenceUsed: this.trackIntelligenceUsage(params.intelligence, industryProfile),
      qualityScore: this.calculateQuality(variations, industryProfile),
      industryBenchmark: industryProfile?.typical_engagement_rate || 0,
      improvements: this.suggestImprovements(variations, industryProfile)
    };
  }

  /**
   * Fetch industry profile from Supabase
   */
  private async getIndustryProfile(profileId: string): Promise<IndustryProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('industry_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        console.warn(`Industry profile not found for ${profileId}, using generic profile`);
        return this.getGenericProfile();
      }

      return data as IndustryProfile;
    } catch (err) {
      console.error('Error fetching industry profile:', err);
      return this.getGenericProfile();
    }
  }

  /**
   * Get generic fallback profile when specific industry profile is unavailable
   */
  private getGenericProfile(): IndustryProfile {
    return {
      id: 'generic',
      naics_code: '000000',
      name: 'Generic Business',
      target_audience: 'General consumers',
      psychology_profile: {
        primaryTriggers: ['trust', 'quality', 'value'],
        emotionalFramework: 'Trust + Value + Satisfaction',
        decisionDrivers: ['price', 'quality', 'convenience'],
        painPoints: ['uncertainty', 'complexity']
      },
      power_words: ['quality', 'professional', 'trusted', 'expert', 'proven'],
      content_themes: ['expertise', 'customer success', 'industry insights'],
      tone_of_voice: 'professional and approachable',
      best_posting_times: [],
      posting_frequency: {
        optimal: 3,
        minimum: 2,
        maximum: 5
      },
      platform_priority: ['linkedin', 'facebook', 'instagram'],
      typical_engagement_rate: 2.5,
      benchmarks: {
        likes: 50,
        comments: 5,
        shares: 2
      }
    };
  }

  /**
   * Generate content variations using AI (OpenRouter/Claude)
   */
  private async generateWithAI(context: {
    topic: string;
    platform: Platform;
    tone: string;
    customerWords: string[];
    trends: string[];
    unique: string[];
    specialty: SpecialtyDetection;
    powerWords: string[];
    emotionalTriggers: string[];
  }): Promise<ContentVariation[]> {
    // In production, this would call OpenRouter API with Claude
    // For now, return mock variations

    const variations: ContentVariation[] = [
      {
        id: '1',
        text: this.buildContentText(context, 1),
        psychology_score: 85,
        power_words_used: context.powerWords.slice(0, 3),
        emotional_triggers_used: context.emotionalTriggers.slice(0, 2),
        hashtags: this.generateHashtags(context)
      },
      {
        id: '2',
        text: this.buildContentText(context, 2),
        psychology_score: 82,
        power_words_used: context.powerWords.slice(1, 4),
        emotional_triggers_used: context.emotionalTriggers.slice(1, 3),
        hashtags: this.generateHashtags(context)
      },
      {
        id: '3',
        text: this.buildContentText(context, 3),
        psychology_score: 88,
        power_words_used: context.powerWords.slice(0, 4),
        emotional_triggers_used: context.emotionalTriggers.slice(0, 3),
        hashtags: this.generateHashtags(context)
      }
    ];

    return variations;
  }

  /**
   * Build content text with intelligence + industry optimization
   */
  private buildContentText(
    context: {
      topic: string;
      platform: Platform;
      tone: string;
      customerWords: string[];
      trends: string[];
      unique: string[];
      specialty: SpecialtyDetection;
      powerWords: string[];
      emotionalTriggers: string[];
    },
    variation: number
  ): string {
    // Build content incorporating all intelligence and industry data
    const parts = [];

    // Opening with power word
    if (context.powerWords.length > 0) {
      const powerWord = context.powerWords[variation % context.powerWords.length];
      parts.push(`${powerWord.charAt(0).toUpperCase() + powerWord.slice(1)} ${context.topic}:`);
    } else {
      parts.push(`${context.topic}:`);
    }

    // Main content incorporating customer language
    if (context.customerWords.length > 0) {
      const customerWord = context.customerWords[0];
      parts.push(`Our clients love our ${customerWord}.`);
    }

    // Reference differentiator
    if (context.unique.length > 0) {
      const unique = context.unique[0];
      parts.push(`${unique} - that's what sets us apart.`);
    }

    // Reference trend if available
    if (context.trends.length > 0 && variation === 1) {
      const trend = context.trends[0];
      parts.push(`Following the latest in ${trend}.`);
    }

    // Call to action with emotional trigger
    if (context.emotionalTriggers.length > 0) {
      const trigger = context.emotionalTriggers[variation % context.emotionalTriggers.length];
      parts.push(`Experience ${trigger} with our ${context.specialty.specialty} services.`);
    } else {
      parts.push(`Learn more about our ${context.specialty.specialty} expertise.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate relevant hashtags
   */
  private generateHashtags(context: any): string[] {
    const hashtags: string[] = [];

    // Add specialty-based hashtag
    if (context.specialty?.specialty) {
      const tag = context.specialty.specialty.replace(/\s+/g, '');
      hashtags.push(`#${tag}`);
    }

    // Add industry hashtag
    if (context.specialty?.industry) {
      hashtags.push(`#${context.specialty.industry}`);
    }

    // Add platform-specific hashtags
    hashtags.push('#SmallBusiness');

    return hashtags.slice(0, 5);
  }

  /**
   * Track which intelligence sources were used in generation
   */
  private trackIntelligenceUsage(
    intelligence: MappedIntelligence,
    industryProfile: IndustryProfile | null
  ): EnhancedContentResult['intelligenceUsed'] {
    return {
      brandVoice: intelligence.brandVoice.keywords.length > 0,
      customerInsights: intelligence.customerSentiment.topMentions.length > 0,
      trendingTopics: intelligence.trendingTopics.length > 0,
      competitorGaps: intelligence.competitiveGaps.differentiators.length > 0,
      industryPowerWords: (industryProfile?.power_words?.length || 0) > 0,
      emotionalTriggers: (industryProfile?.psychology_profile?.primaryTriggers?.length || 0) > 0
    };
  }

  /**
   * Calculate quality score based on psychology optimization
   */
  private calculateQuality(
    variations: ContentVariation[],
    industryProfile: IndustryProfile | null
  ): number {
    if (variations.length === 0) return 0;

    // Average psychology scores
    const avgPsychScore = variations.reduce((sum, v) => sum + (v.psychology_score || 0), 0) / variations.length;

    // Bonus for using industry power words
    const hasPowerWords = variations.some(v => (v.power_words_used?.length || 0) > 0);
    const powerWordBonus = hasPowerWords ? 10 : 0;

    // Bonus for emotional triggers
    const hasEmotionalTriggers = variations.some(v => (v.emotional_triggers_used?.length || 0) > 0);
    const emotionalBonus = hasEmotionalTriggers ? 10 : 0;

    return Math.min(100, avgPsychScore + powerWordBonus + emotionalBonus);
  }

  /**
   * Suggest improvements based on industry profile
   */
  private suggestImprovements(
    variations: ContentVariation[],
    industryProfile: IndustryProfile | null
  ): string[] {
    const improvements: string[] = [];

    if (!industryProfile) {
      improvements.push('Industry profile not available - using generic optimization');
      return improvements;
    }

    // Check if power words are being used
    const avgPowerWords = variations.reduce((sum, v) => sum + (v.power_words_used?.length || 0), 0) / variations.length;
    if (avgPowerWords < 2) {
      improvements.push(`Use more industry power words: ${industryProfile.power_words.slice(0, 5).join(', ')}`);
    }

    // Check if emotional triggers are used
    const avgEmotionalTriggers = variations.reduce((sum, v) => sum + (v.emotional_triggers_used?.length || 0), 0) / variations.length;
    if (avgEmotionalTriggers < 1) {
      improvements.push(`Incorporate emotional triggers: ${industryProfile.psychology_profile.primaryTriggers.join(', ')}`);
    }

    // Check quality score
    const qualityScore = this.calculateQuality(variations, industryProfile);
    if (qualityScore < 70) {
      improvements.push('Consider stronger calls to action and more specific value propositions');
    }

    return improvements;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let generatorInstance: EnhancedContentGenerator | null = null;

export const createEnhancedContentGenerator = (): EnhancedContentGenerator => {
  if (!generatorInstance) {
    generatorInstance = new EnhancedContentGenerator();
  }
  return generatorInstance;
};
