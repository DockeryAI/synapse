/**
 * Content Ideas Generator Service
 *
 * Transforms content ideas into platform-specific suggestions with
 * industry-optimized psychology from the 147 industry profiles database.
 *
 * Uses:
 * - Power words from industry profiles
 * - Emotional triggers
 * - Tone of voice guidelines
 * - Content themes
 * - Buyer persona insights
 */

import { createClient } from '@supabase/supabase-js'
import type { ContentIdea, Platform } from './calendar-population.service'
import type { SpecialtyDetection } from './specialty-detection.service'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

/**
 * Platform-specific content
 */
export interface PlatformContent {
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  estimatedEngagement: number;
  powerWordsUsed: string[];
  emotionalTriggers: string[];
}

/**
 * Content suggestion with platform variations
 */
export interface ContentSuggestion {
  idea: ContentIdea;
  platforms: Record<Platform, PlatformContent>;
  buyerPersona: string;
  synapseScore: number;
  industryBenchmark: number;
}

/**
 * Industry profile from database
 */
interface IndustryProfile {
  id: string;
  naics_code: string;
  industry: string;
  industry_name: string;
  power_words?: string[];
  customer_triggers?: any;
  tone_of_voice?: string;
  content_themes?: string[];
  typical_engagement_rate?: number;
  platform_priority?: string[];
  best_posting_times?: any;
}

/**
 * Content Ideas Generator Service
 *
 * Transforms ideas into platform-optimized content
 */
export class ContentIdeasGeneratorService {
  /**
   * Generate platform-specific suggestions from content ideas
   *
   * @param ideas - Content ideas from calendar population
   * @param specialty - Detected business specialty
   * @returns Array of content suggestions with platform variations
   */
  async generateSuggestions(
    ideas: ContentIdea[],
    specialty: SpecialtyDetection
  ): Promise<ContentSuggestion[]> {
    console.log(`🎨 Generating platform-specific content for ${ideas.length} ideas...`)

    // Fetch industry profile if available
    let industryProfile: IndustryProfile | null = null
    if (specialty.industryProfileId) {
      industryProfile = await this.getIndustryProfile(specialty.industryProfileId)
      console.log(`   Using industry profile: ${industryProfile?.industry_name}`)
    }

    // Generate suggestions for each idea
    const suggestions = await Promise.all(
      ideas.map(idea => this.optimizeContent(idea, specialty, industryProfile))
    )

    console.log(`   ✅ Generated ${suggestions.length} content suggestions`)

    return suggestions
  }

  /**
   * Get industry profile from database
   */
  private async getIndustryProfile(profileId: string): Promise<IndustryProfile | null> {
    try {
      const { data, error } = await supabase
        .from('industry_profiles')
        .select('id, naics_code, industry, industry_name, power_words, customer_triggers, tone_of_voice, content_themes, typical_engagement_rate, platform_priority, best_posting_times')
        .eq('id', profileId)
        .single()

      if (error) {
        console.warn('   ⚠️  Industry profile query error:', error.message)
        return null
      }

      return data
    } catch (error) {
      console.error('   ❌ Industry profile fetch error:', error)
      return null
    }
  }

  /**
   * Optimize content for all platforms
   */
  private async optimizeContent(
    idea: ContentIdea,
    specialty: SpecialtyDetection,
    profile: IndustryProfile | null
  ): Promise<ContentSuggestion> {
    // Get power words and triggers
    const powerWords = profile?.power_words || this.getDefaultPowerWords(idea.contentType)
    const triggers = this.extractTriggers(profile?.customer_triggers)
    const tone = profile?.tone_of_voice || 'professional and friendly'

    // Generate platform-specific content
    const platforms: Record<Platform, PlatformContent> = {
      instagram: this.generateInstagramContent(idea, powerWords, triggers),
      facebook: this.generateFacebookContent(idea, powerWords, triggers),
      twitter: this.generateTwitterContent(idea, powerWords, triggers),
      linkedin: this.generateLinkedInContent(idea, powerWords, triggers),
      tiktok: this.generateTikTokContent(idea, powerWords, triggers)
    }

    // Calculate scores
    const synapseScore = this.calculateSynapseScore(idea, powerWords, triggers)
    const industryBenchmark = profile?.typical_engagement_rate || 3.5

    return {
      idea,
      platforms,
      buyerPersona: specialty.targetMarket,
      synapseScore,
      industryBenchmark
    }
  }

  /**
   * Generate Instagram-specific content
   */
  private generateInstagramContent(
    idea: ContentIdea,
    powerWords: string[],
    triggers: string[]
  ): PlatformContent {
    const usedPowerWords = this.selectPowerWords(powerWords, 3)

    return {
      headline: this.createHeadline(idea.topic, usedPowerWords, 'short'),
      body: this.createBody(idea.topic, usedPowerWords, 'visual', 150),
      hashtags: this.generateHashtags(idea.topic, idea.specialty, 10),
      callToAction: this.createCTA(idea.contentType, 'instagram'),
      estimatedEngagement: this.estimateEngagement('instagram', idea.contentType),
      powerWordsUsed: usedPowerWords,
      emotionalTriggers: triggers
    }
  }

  /**
   * Generate Facebook-specific content
   */
  private generateFacebookContent(
    idea: ContentIdea,
    powerWords: string[],
    triggers: string[]
  ): PlatformContent {
    const usedPowerWords = this.selectPowerWords(powerWords, 4)

    return {
      headline: this.createHeadline(idea.topic, usedPowerWords, 'medium'),
      body: this.createBody(idea.topic, usedPowerWords, 'conversational', 300),
      hashtags: this.generateHashtags(idea.topic, idea.specialty, 5),
      callToAction: this.createCTA(idea.contentType, 'facebook'),
      estimatedEngagement: this.estimateEngagement('facebook', idea.contentType),
      powerWordsUsed: usedPowerWords,
      emotionalTriggers: triggers
    }
  }

  /**
   * Generate Twitter-specific content
   */
  private generateTwitterContent(
    idea: ContentIdea,
    powerWords: string[],
    triggers: string[]
  ): PlatformContent {
    const usedPowerWords = this.selectPowerWords(powerWords, 2)

    return {
      headline: this.createHeadline(idea.topic, usedPowerWords, 'very-short'),
      body: this.createBody(idea.topic, usedPowerWords, 'concise', 100),
      hashtags: this.generateHashtags(idea.topic, idea.specialty, 3),
      callToAction: this.createCTA(idea.contentType, 'twitter'),
      estimatedEngagement: this.estimateEngagement('twitter', idea.contentType),
      powerWordsUsed: usedPowerWords,
      emotionalTriggers: triggers
    }
  }

  /**
   * Generate LinkedIn-specific content
   */
  private generateLinkedInContent(
    idea: ContentIdea,
    powerWords: string[],
    triggers: string[]
  ): PlatformContent {
    const usedPowerWords = this.selectPowerWords(powerWords, 3)

    return {
      headline: this.createHeadline(idea.topic, usedPowerWords, 'medium'),
      body: this.createBody(idea.topic, usedPowerWords, 'professional', 400),
      hashtags: this.generateHashtags(idea.topic, idea.specialty, 5),
      callToAction: this.createCTA(idea.contentType, 'linkedin'),
      estimatedEngagement: this.estimateEngagement('linkedin', idea.contentType),
      powerWordsUsed: usedPowerWords,
      emotionalTriggers: triggers
    }
  }

  /**
   * Generate TikTok-specific content
   */
  private generateTikTokContent(
    idea: ContentIdea,
    powerWords: string[],
    triggers: string[]
  ): PlatformContent {
    const usedPowerWords = this.selectPowerWords(powerWords, 2)

    return {
      headline: this.createHeadline(idea.topic, usedPowerWords, 'hook'),
      body: this.createBody(idea.topic, usedPowerWords, 'energetic', 80),
      hashtags: this.generateHashtags(idea.topic, idea.specialty, 8),
      callToAction: this.createCTA(idea.contentType, 'tiktok'),
      estimatedEngagement: this.estimateEngagement('tiktok', idea.contentType),
      powerWordsUsed: usedPowerWords,
      emotionalTriggers: triggers
    }
  }

  /**
   * Select power words for content
   */
  private selectPowerWords(powerWords: string[], count: number): string[] {
    if (!powerWords || powerWords.length === 0) return []
    return powerWords.slice(0, Math.min(count, powerWords.length))
  }

  /**
   * Extract emotional triggers from profile
   */
  private extractTriggers(customerTriggers: any): string[] {
    if (!customerTriggers) return ['trust', 'value']
    if (Array.isArray(customerTriggers)) return customerTriggers.slice(0, 3)
    if (typeof customerTriggers === 'object' && customerTriggers.primaryTriggers) {
      return customerTriggers.primaryTriggers.slice(0, 3)
    }
    return ['trust', 'value']
  }

  /**
   * Create headline based on style
   */
  private createHeadline(topic: string, powerWords: string[], style: string): string {
    const firstWord = powerWords[0] || 'Discover'
    if (style === 'very-short' || style === 'hook') {
      return `${firstWord}: ${topic.substring(0, 40)}...`
    }
    return `${firstWord} ${topic}`
  }

  /**
   * Create body content
   */
  private createBody(topic: string, powerWords: string[], tone: string, maxLength: number): string {
    const intro = tone === 'professional' ? 'Learn about' : 'Check out'
    const body = `${intro} ${topic.toLowerCase()}. ${powerWords.slice(0, 2).join(' and ')} for best results.`
    return body.substring(0, maxLength)
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(topic: string, specialty: string, count: number): string[] {
    const words = [...topic.toLowerCase().split(' '), ...specialty.toLowerCase().split(' ')]
      .filter(w => w.length > 3)
      .map(w => `#${w.replace(/[^a-z0-9]/g, '')}`)

    return Array.from(new Set(words)).slice(0, count)
  }

  /**
   * Create call-to-action
   */
  private createCTA(contentType: string, platform: Platform): string {
    const ctaMap: Record<string, Record<string, string>> = {
      educational: {
        instagram: 'Tap the link in bio to learn more',
        facebook: 'Click to read the full guide',
        twitter: 'Learn more ↓',
        linkedin: 'Read our comprehensive guide',
        tiktok: 'Check link in bio!'
      },
      promotional: {
        instagram: 'Book now - link in bio',
        facebook: 'Schedule your appointment today',
        twitter: 'Book now →',
        linkedin: 'Contact us to get started',
        tiktok: 'Link in bio to book!'
      },
      engagement: {
        instagram: 'Comment below!',
        facebook: 'Share your thoughts',
        twitter: 'Reply with your answer',
        linkedin: 'Join the conversation',
        tiktok: 'Drop a comment!'
      }
    }

    return ctaMap[contentType]?.[platform] || 'Learn more'
  }

  /**
   * Estimate engagement rate
   */
  private estimateEngagement(platform: Platform, contentType: string): number {
    const baseRates: Record<Platform, number> = {
      instagram: 3.5,
      facebook: 2.5,
      twitter: 1.5,
      linkedin: 2.0,
      tiktok: 5.0
    }

    const typeMultiplier = contentType === 'engagement' ? 1.5 : contentType === 'promotional' ? 0.8 : 1.0

    return baseRates[platform] * typeMultiplier
  }

  /**
   * Calculate Synapse optimization score
   */
  private calculateSynapseScore(
    idea: ContentIdea,
    powerWords: string[],
    triggers: string[]
  ): number {
    let score = 60 // Base score

    // Bonus for power words
    score += Math.min(powerWords.length * 5, 20)

    // Bonus for triggers
    score += Math.min(triggers.length * 5, 15)

    // Bonus for content type
    if (idea.contentType === 'educational') score += 5

    return Math.min(score, 100)
  }

  /**
   * Get default power words when industry profile unavailable
   */
  private getDefaultPowerWords(contentType: string): string[] {
    const defaults: Record<string, string[]> = {
      educational: ['Discover', 'Learn', 'Master', 'Expert', 'Guide'],
      promotional: ['Limited', 'Exclusive', 'Special', 'Now', 'Today'],
      engagement: ['Share', 'Join', 'Tell', 'Vote', 'Choose']
    }

    return defaults[contentType] || ['Quality', 'Professional', 'Trusted']
  }
}

// Export singleton
export const contentGenerator = new ContentIdeasGeneratorService()
