/**
 * Campaign Calendar Generator
 *
 * Generates 5-14 day content calendars with multi-platform orchestration
 * Because apparently posting content without a PhD in scheduling is too much to ask
 *
 * Features:
 * - Day-by-day post breakdown
 * - 2-3 platform distribution
 * - Content type variety
 * - Hook rotation (prevent fatigue)
 * - Optimal timing
 *
 * @author Roy (calendar whisperer since Google Calendar v1)
 */

import {
  CampaignCalendar,
  CalendarPost,
  CalendarGenerationRequest,
  CalendarDuration,
  SocialPlatform,
  ContentType,
  PostContent,
  CalendarMetadata,
  CalendarStatistics,
  HookType,
  CALENDAR_CONSTANTS,
  PLATFORM_LIMITS,
} from '../../types/calendar.types';

export class CalendarGenerator {
  /**
   * Generate a complete campaign calendar
   * Main entry point - this is where the magic (chaos) happens
   */
  static async generate(request: CalendarGenerationRequest): Promise<CampaignCalendar> {
    // Validate request
    this.validateRequest(request);

    // Calculate dates
    const { startDate, endDate } = this.calculateDateRange(request.startDate, request.duration);

    // Determine post distribution
    const postDistribution = this.calculatePostDistribution(
      request.duration,
      request.platforms,
      request.businessContext.isLocal,
      request.preferences?.postFrequency || 'moderate'
    );

    // Generate posts
    const posts = await this.generatePosts(
      request,
      postDistribution,
      startDate
    );

    // Calculate statistics
    const statistics = this.calculateStatistics(posts, request.platforms);

    // Build metadata
    const metadata: CalendarMetadata = {
      businessId: request.businessContext.businessId,
      businessName: request.businessContext.businessName,
      industry: request.businessContext.industry,
      targetAudience: request.businessContext.targetAudience,
      goals: request.contentStrategy.goals,
      tone: request.businessContext.brandVoice,
      generatedBy: 'content-mixer',
      generationModel: 'claude-sonnet-4',
      tokensUsed: posts.reduce((sum, post) => sum + post.metadata.tokensUsed, 0),
    };

    // Create calendar
    const calendar: CampaignCalendar = {
      id: this.generateId('calendar'),
      campaignId: request.campaignId,
      campaignType: request.campaignType,
      duration: request.duration,
      startDate,
      endDate,
      platforms: request.platforms,
      posts,
      metadata,
      statistics,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return calendar;
  }

  /**
   * Calculate post distribution across days and platforms
   * This is where we figure out who posts what when
   */
  private static calculatePostDistribution(
    duration: CalendarDuration,
    platforms: SocialPlatform[],
    isLocal: boolean,
    frequency: 'conservative' | 'moderate' | 'aggressive'
  ): PostDistributionPlan {
    // Base posts per day based on frequency
    const basePostsPerDay: Record<string, number> = {
      conservative: 1,
      moderate: 2,
      aggressive: 3,
    };

    const postsPerDay = basePostsPerDay[frequency];
    const totalPosts = duration * postsPerDay;

    // Distribute posts across platforms
    const platformDistribution = this.distributePlatforms(platforms, totalPosts, isLocal);

    // Distribute content types
    const contentTypeDistribution = this.distributeContentTypes(totalPosts, platforms, isLocal);

    // Daily breakdown
    const dailyBreakdown: DayDistribution[] = [];
    for (let day = 0; day < duration; day++) {
      dailyBreakdown.push({
        dayIndex: day,
        postCount: postsPerDay,
        platforms: this.selectPlatformsForDay(platforms, day, postsPerDay),
        contentTypes: this.selectContentTypesForDay(contentTypeDistribution, day, postsPerDay),
      });
    }

    return {
      totalPosts,
      postsPerDay,
      dailyBreakdown,
      platformDistribution,
      contentTypeDistribution,
    };
  }

  /**
   * Distribute posts across platforms
   * Ensures balanced coverage while respecting platform limits
   */
  private static distributePlatforms(
    platforms: SocialPlatform[],
    totalPosts: number,
    isLocal: boolean
  ): Record<SocialPlatform, number> {
    const distribution: Record<SocialPlatform, number> = {} as any;

    // If local business with GMB, allocate 2 posts per week
    if (isLocal && platforms.includes('gmb')) {
      const gmbPosts = Math.min(Math.floor(totalPosts * 0.15), 4); // Max 4 GMB posts
      distribution.gmb = gmbPosts;
    }

    // Distribute remaining posts across other platforms
    const remainingPosts = totalPosts - (distribution.gmb || 0);
    const socialPlatforms = platforms.filter(p => p !== 'gmb');

    // Equal distribution with slight randomness
    const basePerPlatform = Math.floor(remainingPosts / socialPlatforms.length);
    const remainder = remainingPosts % socialPlatforms.length;

    socialPlatforms.forEach((platform, index) => {
      distribution[platform] = basePerPlatform + (index < remainder ? 1 : 0);
    });

    return distribution;
  }

  /**
   * Distribute content types across calendar
   * Ensures variety and platform compatibility
   */
  private static distributeContentTypes(
    totalPosts: number,
    platforms: SocialPlatform[],
    isLocal: boolean
  ): Record<ContentType, number> {
    // Default content mix (video-first for 2025)
    const mix = {
      video: 0.35, // 35% video (reels, shorts, TikTok)
      image: 0.25, // 25% images
      carousel: 0.15, // 15% carousels
      story: 0.15, // 15% stories
      text: 0.10, // 10% text posts
    };

    // Adjust based on platforms
    if (platforms.includes('tiktok') || platforms.includes('instagram')) {
      mix.video += 0.10; // More video for short-form platforms
      mix.image -= 0.05;
      mix.text -= 0.05;
    }

    if (platforms.includes('linkedin')) {
      mix.text += 0.10; // More text for LinkedIn
      mix.story -= 0.10;
    }

    // Calculate distribution
    const distribution: Record<ContentType, number> = {
      video: Math.round(totalPosts * mix.video),
      image: Math.round(totalPosts * mix.image),
      carousel: Math.round(totalPosts * mix.carousel),
      story: Math.round(totalPosts * mix.story),
      text: Math.round(totalPosts * mix.text),
      reel: 0,
      short: 0,
      gmb: isLocal ? Math.min(4, Math.floor(totalPosts * 0.15)) : 0,
    };

    // Adjust to match total (rounding errors)
    const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (sum < totalPosts) {
      distribution.video += totalPosts - sum;
    } else if (sum > totalPosts) {
      distribution.image -= sum - totalPosts;
    }

    return distribution;
  }

  /**
   * Select platforms for a specific day
   * Rotates platforms to avoid fatigue
   */
  private static selectPlatformsForDay(
    platforms: SocialPlatform[],
    dayIndex: number,
    postsPerDay: number
  ): SocialPlatform[] {
    // For 2-3 posts per day, use 2-3 different platforms
    const platformsForDay: SocialPlatform[] = [];
    const platformsCopy = [...platforms];

    // Rotate based on day to ensure coverage
    for (let i = 0; i < Math.min(postsPerDay, platforms.length); i++) {
      const index = (dayIndex * postsPerDay + i) % platformsCopy.length;
      platformsForDay.push(platformsCopy[index]);
    }

    return platformsForDay;
  }

  /**
   * Select content types for a specific day
   * Ensures variety day-to-day
   */
  private static selectContentTypesForDay(
    distribution: Record<ContentType, number>,
    dayIndex: number,
    postsPerDay: number
  ): ContentType[] {
    const contentTypes: ContentType[] = [];
    const availableTypes = Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([type]) => type as ContentType);

    // Round-robin selection
    for (let i = 0; i < postsPerDay; i++) {
      const index = (dayIndex * postsPerDay + i) % availableTypes.length;
      contentTypes.push(availableTypes[index]);
    }

    return contentTypes;
  }

  /**
   * Generate actual posts for the calendar
   * This is where content gets created
   */
  private static async generatePosts(
    request: CalendarGenerationRequest,
    distribution: PostDistributionPlan,
    startDate: Date
  ): Promise<CalendarPost[]> {
    const posts: CalendarPost[] = [];
    const hookRotation = this.initializeHookRotation(request.contentStrategy.hookTypes);

    for (const dayPlan of distribution.dailyBreakdown) {
      const dayPosts = await this.generatePostsForDay(
        request,
        dayPlan,
        startDate,
        hookRotation,
        posts.length
      );
      posts.push(...dayPosts);
    }

    return posts;
  }

  /**
   * Generate posts for a specific day
   */
  private static async generatePostsForDay(
    request: CalendarGenerationRequest,
    dayPlan: DayDistribution,
    startDate: Date,
    hookRotation: HookType[],
    currentPostCount: number
  ): Promise<CalendarPost[]> {
    const posts: CalendarPost[] = [];
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + dayPlan.dayIndex);

    for (let i = 0; i < dayPlan.postCount; i++) {
      const platform = dayPlan.platforms[i];
      const contentType = dayPlan.contentTypes[i];
      const hookType = this.getNextHook(hookRotation);
      const optimalTime = this.getOptimalTime(platform, i);

      const content = await this.generatePostContent(
        request,
        platform,
        contentType,
        hookType,
        dayPlan.dayIndex
      );

      const post: CalendarPost = {
        id: this.generateId('post'),
        calendarId: '', // Will be set by parent
        dayIndex: dayPlan.dayIndex,
        scheduledDate,
        scheduledTime: optimalTime,
        platforms: [platform],
        contentType,
        content,
        orchestration: {
          isPrimary: true,
          crossPlatformStrategy: 'adapted',
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
            [platform]: {
              platform,
              isScheduled: false,
              status: 'pending',
            },
          } as any,
          schedulingAttempts: [],
        },
        metadata: {
          generatedFrom: 'insight',
          aiModel: 'claude-sonnet-4',
          tokensUsed: Math.floor(Math.random() * 500) + 200, // Mock
          generationTime: Math.floor(Math.random() * 3000) + 1000,
          confidence: 0.85 + Math.random() * 0.15,
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      posts.push(post);
    }

    return posts;
  }

  /**
   * Generate content for a single post
   * Mocked for now - would call AI in production
   */
  private static async generatePostContent(
    request: CalendarGenerationRequest,
    platform: SocialPlatform,
    contentType: ContentType,
    hookType: HookType,
    dayIndex: number
  ): Promise<PostContent> {
    // Mock content generation
    // In production, this would call Claude via OpenRouter

    const hooks = {
      question: 'Did you know 70% of businesses struggle with this?',
      shock: 'This will completely change how you think about...',
      curiosity: 'The secret nobody talks about:',
      emotion: 'Remember when you first realized...',
      value: 'Here\'s exactly how to...',
      story: 'Last week, something incredible happened...',
      challenge: 'Think you can\'t do it? Watch this:',
    };

    const hook = hooks[hookType.type] || hooks.curiosity;

    return {
      hook,
      body: `Here's valuable content about ${request.contentStrategy.contentPillars[0]}. Day ${dayIndex + 1} insight that your audience needs to hear.`,
      cta: 'Click the link in bio to learn more!',
      hashtags: this.generateHashtags(platform, request.contentStrategy.contentPillars),
      platformVariants: {},
    };
  }

  /**
   * Generate hashtags for platform
   */
  private static generateHashtags(platform: SocialPlatform, pillars: string[]): string[] {
    const limit = PLATFORM_LIMITS[platform].hashtagLimit;
    if (limit === 0) return [];

    // Generate hashtags from content pillars
    const hashtags = pillars.slice(0, Math.min(3, limit));
    return hashtags.map(p => p.toLowerCase().replace(/\s+/g, ''));
  }

  /**
   * Get optimal posting time for platform
   */
  private static getOptimalTime(platform: SocialPlatform, postIndex: number): string {
    const times = PLATFORM_LIMITS[platform].optimalTimes;
    return times[postIndex % times.length];
  }

  /**
   * Initialize hook rotation system
   */
  private static initializeHookRotation(hookTypes: string[]): HookType[] {
    return hookTypes.map((type, index) => ({
      type: type as any,
      examples: [],
      effectivenessScore: 75 + Math.random() * 25,
      usageCount: 0,
      lastUsedDay: -1,
    }));
  }

  /**
   * Get next hook type (rotation to prevent fatigue)
   */
  private static getNextHook(rotation: HookType[]): HookType {
    // Find least recently used hook
    const sorted = [...rotation].sort((a, b) => a.usageCount - b.usageCount);
    const nextHook = sorted[0];
    nextHook.usageCount++;
    return nextHook;
  }

  /**
   * Calculate calendar statistics
   */
  private static calculateStatistics(
    posts: CalendarPost[],
    platforms: SocialPlatform[]
  ): CalendarStatistics {
    const postsByPlatform: Record<SocialPlatform, number> = {} as any;
    platforms.forEach(p => (postsByPlatform[p] = 0));
    posts.forEach(post => {
      post.platforms.forEach(p => {
        postsByPlatform[p] = (postsByPlatform[p] || 0) + 1;
      });
    });

    const postsByType: Record<ContentType, number> = {} as any;
    posts.forEach(post => {
      postsByType[post.contentType] = (postsByType[post.contentType] || 0) + 1;
    });

    const postsByDay: Record<number, number> = {};
    posts.forEach(post => {
      postsByDay[post.dayIndex] = (postsByDay[post.dayIndex] || 0) + 1;
    });

    const approvedCount = posts.filter(p => p.approval.status === 'approved').length;
    const scheduledCount = posts.filter(p => p.scheduling.isScheduled).length;
    const publishedCount = posts.filter(p => p.status === 'published').length;

    return {
      totalPosts: posts.length,
      postsByPlatform,
      postsByType,
      postsByDay,
      approvalRate: posts.length > 0 ? (approvedCount / posts.length) * 100 : 0,
      scheduledCount,
      publishedCount,
    };
  }

  /**
   * Calculate date range
   */
  private static calculateDateRange(startDate: Date, duration: CalendarDuration): {
    startDate: Date;
    endDate: Date;
  } {
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(end.getDate() + duration - 1);

    return { startDate: start, endDate: end };
  }

  /**
   * Validate generation request
   */
  private static validateRequest(request: CalendarGenerationRequest): void {
    if (request.duration < CALENDAR_CONSTANTS.MIN_DURATION) {
      throw new Error(`Duration must be at least ${CALENDAR_CONSTANTS.MIN_DURATION} days`);
    }

    if (request.duration > CALENDAR_CONSTANTS.MAX_DURATION) {
      throw new Error(`Duration cannot exceed ${CALENDAR_CONSTANTS.MAX_DURATION} days`);
    }

    if (request.platforms.length < CALENDAR_CONSTANTS.MIN_PLATFORMS_PER_CALENDAR) {
      throw new Error(`Must select at least ${CALENDAR_CONSTANTS.MIN_PLATFORMS_PER_CALENDAR} platforms`);
    }

    if (request.platforms.length > CALENDAR_CONSTANTS.MAX_PLATFORMS_PER_CALENDAR) {
      throw new Error(`Cannot exceed ${CALENDAR_CONSTANTS.MAX_PLATFORMS_PER_CALENDAR} platforms`);
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface PostDistributionPlan {
  totalPosts: number;
  postsPerDay: number;
  dailyBreakdown: DayDistribution[];
  platformDistribution: Record<SocialPlatform, number>;
  contentTypeDistribution: Record<ContentType, number>;
}

interface DayDistribution {
  dayIndex: number;
  postCount: number;
  platforms: SocialPlatform[];
  contentTypes: ContentType[];
}

export default CalendarGenerator;
