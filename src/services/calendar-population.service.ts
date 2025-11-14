/**
 * Calendar Population Service
 *
 * Generates 30 content ideas for the calendar based on business intelligence,
 * specialty detection, and content best practices.
 *
 * Distribution:
 * - 60% Educational content (Days 1-18)
 * - 30% Promotional content (Days 19-27)
 * - 10% Engagement content (Days 28-30)
 */

import type { SpecialtyDetection } from './specialty-detection.service'
import type { IntelligenceResult } from './parallel-intelligence.service'

/**
 * Platform types
 */
export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok'

/**
 * Content idea for calendar
 */
export interface ContentIdea {
  /** Unique identifier */
  id: string;
  /** Content topic */
  topic: string;
  /** Target platform */
  platform: Platform;
  /** Content type category */
  contentType: 'educational' | 'promotional' | 'engagement';
  /** Business specialty */
  specialty: string;
  /** Scheduled date (day number 1-30) */
  scheduledDay: number;
  /** Why this content was suggested */
  reasoning: string;
  /** Suggested posting time */
  suggestedTime?: string;
}

/**
 * Calendar Population Service
 *
 * Generates 30 days of content ideas with proper distribution
 */
export class CalendarPopulationService {
  private readonly TOTAL_IDEAS = 30
  private readonly EDUCATIONAL_RATIO = 0.6  // 60%
  private readonly PROMOTIONAL_RATIO = 0.3   // 30%
  private readonly ENGAGEMENT_RATIO = 0.1    // 10%

  /**
   * Platform distribution percentages
   */
  private readonly PLATFORM_DISTRIBUTION = {
    instagram: 0.4,  // 40%
    facebook: 0.3,   // 30%
    twitter: 0.2,    // 20%
    linkedin: 0.1    // 10%
  }

  /**
   * Generate 30 content ideas for the calendar
   *
   * @param brandId - Brand identifier
   * @param specialty - Detected business specialty
   * @param intelligenceData - Intelligence gathering results
   * @returns Array of 30 content ideas
   */
  async populate(
    brandId: string,
    specialty: SpecialtyDetection,
    intelligenceData: IntelligenceResult[]
  ): Promise<ContentIdea[]> {
    console.log(`📅 Generating 30 content ideas for ${specialty.specialty}...`)

    const ideas: ContentIdea[] = []

    // Calculate distribution
    const educationalCount = Math.round(this.TOTAL_IDEAS * this.EDUCATIONAL_RATIO)
    const promotionalCount = Math.round(this.TOTAL_IDEAS * this.PROMOTIONAL_RATIO)
    const engagementCount = this.TOTAL_IDEAS - educationalCount - promotionalCount

    console.log(`   Distribution: ${educationalCount} educational, ${promotionalCount} promotional, ${engagementCount} engagement`)

    // Generate educational content (Days 1-18)
    for (let i = 0; i < educationalCount; i++) {
      ideas.push(this.generateEducationalIdea(i + 1, specialty, intelligenceData))
    }

    // Generate promotional content (Days 19-27)
    for (let i = 0; i < promotionalCount; i++) {
      ideas.push(this.generatePromotionalIdea(educationalCount + i + 1, specialty, intelligenceData))
    }

    // Generate engagement content (Days 28-30)
    for (let i = 0; i < engagementCount; i++) {
      ideas.push(this.generateEngagementIdea(educationalCount + promotionalCount + i + 1, specialty, intelligenceData))
    }

    console.log(`   ✅ Generated ${ideas.length} content ideas`)

    return ideas
  }

  /**
   * Generate educational content idea
   */
  private generateEducationalIdea(
    day: number,
    specialty: SpecialtyDetection,
    intelligenceData: IntelligenceResult[]
  ): ContentIdea {
    const platform = this.selectPlatform(day)
    const topics = this.getEducationalTopics(specialty)
    const topic = topics[day % topics.length]

    return {
      id: `edu-${day}-${Date.now()}`,
      topic,
      platform,
      contentType: 'educational',
      specialty: specialty.specialty,
      scheduledDay: day,
      reasoning: `Educational content to establish expertise in ${specialty.specialty}`,
      suggestedTime: this.getSuggestedTime(platform, 'educational')
    }
  }

  /**
   * Generate promotional content idea
   */
  private generatePromotionalIdea(
    day: number,
    specialty: SpecialtyDetection,
    intelligenceData: IntelligenceResult[]
  ): ContentIdea {
    const platform = this.selectPlatform(day)
    const topics = this.getPromotionalTopics(specialty)
    const topic = topics[day % topics.length]

    return {
      id: `promo-${day}-${Date.now()}`,
      topic,
      platform,
      contentType: 'promotional',
      specialty: specialty.specialty,
      scheduledDay: day,
      reasoning: `Promotional content to drive conversions for ${specialty.specialty}`,
      suggestedTime: this.getSuggestedTime(platform, 'promotional')
    }
  }

  /**
   * Generate engagement content idea
   */
  private generateEngagementIdea(
    day: number,
    specialty: SpecialtyDetection,
    intelligenceData: IntelligenceResult[]
  ): ContentIdea {
    const platform = this.selectPlatform(day)
    const topics = this.getEngagementTopics(specialty)
    const topic = topics[day % topics.length]

    return {
      id: `engage-${day}-${Date.now()}`,
      topic,
      platform,
      contentType: 'engagement',
      specialty: specialty.specialty,
      scheduledDay: day,
      reasoning: `Engagement content to build community around ${specialty.specialty}`,
      suggestedTime: this.getSuggestedTime(platform, 'engagement')
    }
  }

  /**
   * Select platform based on distribution
   */
  private selectPlatform(day: number): Platform {
    const platforms: Platform[] = ['instagram', 'facebook', 'twitter', 'linkedin']
    // Distribute evenly with preference for Instagram and Facebook
    const index = day % 5
    if (index === 0 || index === 1) return 'instagram'
    if (index === 2) return 'facebook'
    if (index === 3) return 'twitter'
    return 'linkedin'
  }

  /**
   * Get educational topics based on specialty
   */
  private getEducationalTopics(specialty: SpecialtyDetection): string[] {
    const industry = specialty.industry.toLowerCase()
    const spec = specialty.specialty.toLowerCase()

    // Industry-specific educational topics
    const baseTopics = [
      `How to choose the right ${spec}`,
      `Common mistakes to avoid with ${spec}`,
      `What to look for in ${spec}`,
      `The benefits of ${spec}`,
      `Expert tips for ${spec}`,
      `Understanding ${spec} options`,
      `The complete guide to ${spec}`,
      `${spec} best practices`,
      `What makes great ${spec}`,
      `Industry secrets about ${spec}`,
      `How ${spec} works`,
      `The science behind ${spec}`,
      `Comparing ${spec} options`,
      `${spec} maintenance tips`,
      `When you need ${spec}`,
      `${spec} FAQ answered`,
      `The history of ${spec}`,
      `Future trends in ${spec}`
    ]

    return baseTopics
  }

  /**
   * Get promotional topics based on specialty
   */
  private getPromotionalTopics(specialty: SpecialtyDetection): string[] {
    const spec = specialty.specialty.toLowerCase()

    return [
      `Book your ${spec} consultation today`,
      `Limited time offer on ${spec}`,
      `Schedule your ${spec} appointment`,
      `Get a free quote for ${spec}`,
      `New ${spec} packages available`,
      `Special pricing on ${spec}`,
      `${spec} now booking for next month`,
      `Don't miss our ${spec} promotion`,
      `Call today for ${spec} services`
    ]
  }

  /**
   * Get engagement topics based on specialty
   */
  private getEngagementTopics(specialty: SpecialtyDetection): string[] {
    const spec = specialty.specialty.toLowerCase()

    return [
      `What's your ${spec} experience? Share below!`,
      `Tag someone who needs ${spec}`,
      `What questions do you have about ${spec}?`,
      `Share your ${spec} success story`,
      `Poll: What's most important in ${spec}?`,
      `Drop a 👍 if you love ${spec}`,
      `Tell us: What's your dream ${spec}?`,
      `Comment your ${spec} questions below`
    ]
  }

  /**
   * Get suggested posting time based on platform and content type
   */
  private getSuggestedTime(platform: Platform, contentType: string): string {
    const timeMap: Record<Platform, Record<string, string>> = {
      instagram: {
        educational: '10:00 AM',
        promotional: '7:00 PM',
        engagement: '12:00 PM'
      },
      facebook: {
        educational: '1:00 PM',
        promotional: '8:00 PM',
        engagement: '3:00 PM'
      },
      twitter: {
        educational: '9:00 AM',
        promotional: '5:00 PM',
        engagement: '12:00 PM'
      },
      linkedin: {
        educational: '8:00 AM',
        promotional: '12:00 PM',
        engagement: '5:00 PM'
      },
      tiktok: {
        educational: '7:00 PM',
        promotional: '9:00 PM',
        engagement: '8:00 PM'
      }
    }

    return timeMap[platform]?.[contentType] || '12:00 PM'
  }

  /**
   * Get distribution statistics
   */
  getDistributionStats(ideas: ContentIdea[]): {
    byType: Record<string, number>;
    byPlatform: Record<string, number>;
    total: number;
  } {
    const byType: Record<string, number> = {}
    const byPlatform: Record<string, number> = {}

    ideas.forEach(idea => {
      byType[idea.contentType] = (byType[idea.contentType] || 0) + 1
      byPlatform[idea.platform] = (byPlatform[idea.platform] || 0) + 1
    })

    return {
      byType,
      byPlatform,
      total: ideas.length
    }
  }
}

// Export singleton
export const calendarPopulator = new CalendarPopulationService()
