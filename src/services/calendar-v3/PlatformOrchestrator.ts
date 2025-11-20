/**
 * Platform Orchestrator
 *
 * Coordinates content across 2-3 platforms without making you want to
 * throw your laptop out the window
 *
 * Handles:
 * - Cross-platform content adaptation
 * - Timing coordination (simultaneous/staggered/sequential)
 * - Platform-specific formatting
 * - Duplicate content detection
 * - GMB post scheduling for local businesses
 *
 * @author Roy (who's orchestrated more platforms than a symphony conductor)
 */

import {
  CalendarPost,
  SocialPlatform,
  PostContent,
  PlatformContent,
  OrchestrationConfig,
  ContentAdaptation,
  PLATFORM_LIMITS,
} from '../../types/calendar.types';

export class PlatformOrchestrator {
  /**
   * Orchestrate a single post across multiple platforms
   * Main entry point for cross-platform magic
   */
  static async orchestratePost(
    post: CalendarPost,
    additionalPlatforms: SocialPlatform[]
  ): Promise<CalendarPost> {
    // Add platforms to post
    const allPlatforms = [...new Set([...post.platforms, ...additionalPlatforms])];

    // Generate platform-specific content
    const platformVariants = await this.generatePlatformVariants(
      post.content,
      allPlatforms,
      post.contentType
    );

    // Update orchestration config
    const orchestration = this.createOrchestrationConfig(
      post.platforms[0], // Primary platform
      allPlatforms
    );

    // Detect content adaptations
    const adaptations = this.detectAdaptations(post.content, platformVariants);

    return {
      ...post,
      platforms: allPlatforms,
      content: {
        ...post.content,
        platformVariants,
      },
      orchestration: {
        ...orchestration,
        contentAdaptations: adaptations,
      },
    };
  }

  /**
   * Generate platform-specific content variants
   * Adapts content to each platform's requirements and best practices
   */
  static async generatePlatformVariants(
    baseContent: PostContent,
    platforms: SocialPlatform[],
    contentType: string
  ): Promise<Partial<Record<SocialPlatform, PlatformContent>>> {
    const variants: Partial<Record<SocialPlatform, PlatformContent>> = {};

    for (const platform of platforms) {
      variants[platform] = await this.adaptContentForPlatform(
        baseContent,
        platform,
        contentType
      );
    }

    return variants;
  }

  /**
   * Adapt content for a specific platform
   * This is where the platform-specific magic happens
   */
  private static async adaptContentForPlatform(
    baseContent: PostContent,
    platform: SocialPlatform,
    contentType: string
  ): Promise<PlatformContent> {
    const limits = PLATFORM_LIMITS[platform];

    // Build full text
    let text = baseContent.hook + '\n\n' + baseContent.body + '\n\n' + baseContent.cta;

    // Adapt for character limit
    if (text.length > limits.characterLimit) {
      text = await this.truncateSmartly(text, limits.characterLimit, platform);
    }

    // Adapt hashtags
    let hashtags = [...baseContent.hashtags];
    if (hashtags.length > limits.hashtagLimit) {
      hashtags = hashtags.slice(0, limits.hashtagLimit);
    }

    // Platform-specific formatting
    text = this.applyPlatformFormatting(text, platform);

    // Platform-specific fields
    const additionalFields = this.getPlatformSpecificFields(
      platform,
      baseContent,
      contentType
    );

    return {
      platform,
      text,
      hashtags,
      mediaUrls: baseContent.mediaUrls,
      additionalFields,
    };
  }

  /**
   * Truncate text smartly without breaking sentences
   * Better than just chopping at character limit
   */
  private static async truncateSmartly(
    text: string,
    limit: number,
    platform: SocialPlatform
  ): Promise<string> {
    if (text.length <= limit) return text;

    // Try to break at sentence boundary
    const sentences = text.split(/[.!?]\s+/);
    let truncated = '';

    for (const sentence of sentences) {
      if ((truncated + sentence).length > limit - 3) break;
      truncated += sentence + '. ';
    }

    // If we got something reasonable, return it
    if (truncated.length > limit * 0.5) {
      return truncated.trim() + '...';
    }

    // Otherwise, hard truncate
    return text.substring(0, limit - 3) + '...';
  }

  /**
   * Apply platform-specific formatting
   */
  private static applyPlatformFormatting(text: string, platform: SocialPlatform): string {
    switch (platform) {
      case 'twitter':
        // Twitter loves line breaks
        return text.replace(/\n\n/g, '\n\n');

      case 'linkedin':
        // LinkedIn professional tone
        // Remove excessive emojis if present
        return text.replace(/[\u{1F600}-\u{1F64F}]{3,}/gu, '');

      case 'instagram':
      case 'tiktok':
        // These platforms love emojis and line breaks
        return text;

      case 'facebook':
        // Facebook is more casual
        return text;

      case 'gmb':
        // GMB is informational and local
        return text.replace(/hashtags?:\s*#\w+/gi, ''); // Remove hashtag references

      default:
        return text;
    }
  }

  /**
   * Get platform-specific fields
   */
  private static getPlatformSpecificFields(
    platform: SocialPlatform,
    content: PostContent,
    contentType: string
  ): Record<string, any> {
    const fields: Record<string, any> = {};

    switch (platform) {
      case 'gmb':
        fields.eventType = this.inferGMBEventType(content, contentType);
        fields.actionType = 'LEARN_MORE';
        break;

      case 'instagram':
        fields.contentType = contentType === 'video' ? 'reel' : 'post';
        break;

      case 'tiktok':
        fields.allowComments = true;
        fields.allowDuet = true;
        fields.allowStitch = true;
        break;

      case 'linkedin':
        fields.visibility = 'PUBLIC';
        break;
    }

    return fields;
  }

  /**
   * Infer GMB event type from content
   */
  private static inferGMBEventType(content: PostContent, contentType: string): string {
    const text = (content.hook + ' ' + content.body).toLowerCase();

    if (text.includes('offer') || text.includes('deal') || text.includes('discount')) {
      return 'OFFER';
    }
    if (text.includes('event') || text.includes('join us')) {
      return 'EVENT';
    }
    if (text.includes('new') || text.includes('launch')) {
      return 'PRODUCT';
    }

    return 'STANDARD';
  }

  /**
   * Create orchestration config
   */
  private static createOrchestrationConfig(
    primaryPlatform: SocialPlatform,
    allPlatforms: SocialPlatform[]
  ): OrchestrationConfig {
    return {
      isPrimary: true,
      crossPlatformStrategy: allPlatforms.length > 1 ? 'adapted' : 'identical',
      timingStrategy: this.determineTimingStrategy(allPlatforms),
      staggerDelayMinutes: allPlatforms.length > 1 ? 15 : undefined,
      contentAdaptations: [],
    };
  }

  /**
   * Determine timing strategy based on platforms
   */
  private static determineTimingStrategy(
    platforms: SocialPlatform[]
  ): 'simultaneous' | 'staggered' | 'sequential' {
    // If posting to story-based platforms, stagger slightly
    if (platforms.includes('instagram') && platforms.includes('tiktok')) {
      return 'staggered';
    }

    // If posting to very different platforms, go sequential
    if (platforms.includes('linkedin') && platforms.includes('tiktok')) {
      return 'sequential';
    }

    // Default: simultaneous
    return 'simultaneous';
  }

  /**
   * Detect content adaptations between platforms
   */
  private static detectAdaptations(
    baseContent: PostContent,
    variants: Partial<Record<SocialPlatform, PlatformContent>>
  ): ContentAdaptation[] {
    const adaptations: ContentAdaptation[] = [];
    const baseText = baseContent.hook + baseContent.body + baseContent.cta;

    for (const [platform, variant] of Object.entries(variants)) {
      if (!variant) continue;

      const changes: string[] = [];

      // Check for truncation
      if (variant.text.length < baseText.length * 0.9) {
        changes.push('Content shortened to fit character limit');
      }

      // Check for hashtag changes
      if (variant.hashtags.length < baseContent.hashtags.length) {
        changes.push(`Reduced hashtags from ${baseContent.hashtags.length} to ${variant.hashtags.length}`);
      }

      // Check for formatting changes
      if (variant.text !== baseText) {
        changes.push('Applied platform-specific formatting');
      }

      if (changes.length > 0) {
        adaptations.push({
          platform: platform as SocialPlatform,
          adaptationType: variant.text.length < baseText.length ? 'shorten' : 'reformat',
          changes,
          reasoning: `Adapted for ${platform}'s requirements and best practices`,
        });
      }
    }

    return adaptations;
  }

  /**
   * Validate orchestration (check for conflicts)
   */
  static validateOrchestration(posts: CalendarPost[]): OrchestrationValidation {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate content on same platform same day
    const platformDayMap: Map<string, Set<string>> = new Map();

    for (const post of posts) {
      for (const platform of post.platforms) {
        const key = `${platform}_${post.dayIndex}`;
        const contentHash = this.hashContent(post.content);

        if (!platformDayMap.has(key)) {
          platformDayMap.set(key, new Set());
        }

        if (platformDayMap.get(key)!.has(contentHash)) {
          issues.push(
            `Duplicate content detected on ${platform} for day ${post.dayIndex + 1}`
          );
        }

        platformDayMap.get(key)!.add(contentHash);
      }
    }

    // Check for posts too close together on same platform
    const platformTimings: Map<SocialPlatform, Date[]> = new Map();

    for (const post of posts) {
      for (const platform of post.platforms) {
        if (!platformTimings.has(platform)) {
          platformTimings.set(platform, []);
        }

        const postTime = new Date(post.scheduledDate);
        const [hours, minutes] = post.scheduledTime.split(':').map(Number);
        postTime.setHours(hours, minutes);

        const existing = platformTimings.get(platform)!;
        for (const existingTime of existing) {
          const diffMinutes = Math.abs(postTime.getTime() - existingTime.getTime()) / (1000 * 60);
          const minGap = PLATFORM_LIMITS[platform].minGapMinutes;

          if (diffMinutes < minGap) {
            warnings.push(
              `Posts on ${platform} are only ${diffMinutes.toFixed(0)}min apart (recommended: ${minGap}min)`
            );
          }
        }

        existing.push(postTime);
      }
    }

    // Check for exceeding daily limits
    const dailyPostCounts: Map<string, number> = new Map();

    for (const post of posts) {
      for (const platform of post.platforms) {
        const key = `${platform}_${post.dayIndex}`;
        dailyPostCounts.set(key, (dailyPostCounts.get(key) || 0) + 1);

        const limit = PLATFORM_LIMITS[platform].maxPostsPerDay;
        if (dailyPostCounts.get(key)! > limit) {
          issues.push(
            `Exceeds daily limit for ${platform} on day ${post.dayIndex + 1} (${dailyPostCounts.get(key)}/${limit})`
          );
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score: this.calculateOrchestrationScore(issues, warnings),
    };
  }

  /**
   * Hash content for duplicate detection
   */
  private static hashContent(content: PostContent): string {
    const text = content.hook + content.body + content.cta;
    // Simple hash - in production would use proper hash function
    return text.toLowerCase().replace(/\s+/g, '').substring(0, 50);
  }

  /**
   * Calculate orchestration quality score
   */
  private static calculateOrchestrationScore(issues: string[], warnings: string[]): number {
    let score = 100;
    score -= issues.length * 20; // Major penalty for issues
    score -= warnings.length * 5; // Minor penalty for warnings
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Add GMB posts for local businesses
   * Recommends 2x per week
   */
  static addGMBPosts(calendar: CalendarPost[], startDate: Date, duration: number): CalendarPost[] {
    const gmbPosts: CalendarPost[] = [];

    // Add 2 GMB posts per week (days 2 and 5 of each week)
    const gmbDays = duration >= 7 ? [2, 5, 9, 12] : [2, 5];

    for (const dayIndex of gmbDays) {
      if (dayIndex >= duration) continue;

      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + dayIndex);

      gmbPosts.push({
        id: `post_gmb_${dayIndex}_${Date.now()}`,
        calendarId: calendar[0]?.calendarId || '',
        dayIndex,
        scheduledDate,
        scheduledTime: '10:00', // Mid-morning for local visibility
        platforms: ['gmb'],
        contentType: 'gmb',
        content: {
          hook: 'Your local [business] is here to help!',
          body: 'Stop by today or call us to learn more about our services.',
          cta: 'Visit us today!',
          hashtags: [],
        },
        orchestration: {
          isPrimary: true,
          crossPlatformStrategy: 'unique',
          timingStrategy: 'simultaneous',
          contentAdaptations: [],
        },
        approval: {
          status: 'pending',
          revisionHistory: [],
        },
        scheduling: {
          isScheduled: false,
          scheduledToPlatforms: {
            gmb: {
              platform: 'gmb',
              isScheduled: false,
              status: 'pending',
            },
          } as Partial<Record<SocialPlatform, any>>,
          schedulingAttempts: [],
        },
        metadata: {
          generatedFrom: 'template',
          aiModel: 'claude-sonnet-4',
          tokensUsed: 150,
          generationTime: 500,
          confidence: 0.9,
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return [...calendar, ...gmbPosts];
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface OrchestrationValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  score: number;
}

export default PlatformOrchestrator;
