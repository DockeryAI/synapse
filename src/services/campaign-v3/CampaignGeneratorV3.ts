/**
 * Campaign Generator V3
 *
 * Main orchestrator for V3 campaign generation.
 * Brings together campaign types, platform selection, and duration enforcement.
 *
 * Because someone needs to be the conductor of this circus.
 */

import { CampaignTypeEngine } from './CampaignTypeEngine';
import { PlatformSelector } from './PlatformSelector';
import { DurationEnforcer } from './DurationEnforcer';
import type {
  CampaignV3Config,
  CampaignGenerationRequest,
  CampaignGenerationResult,
  CampaignPostV3,
  CampaignCalendar,
  CampaignDay,
  CampaignValidationResult,
  BusinessType,
  BusinessGoal,
  CampaignTypeV3,
  PlatformV3,
  CampaignDuration,
} from '../../types/campaign-v3.types';

export class CampaignGeneratorV3 {
  /**
   * Generate complete campaign from config
   */
  static async generateCampaign(
    request: CampaignGenerationRequest
  ): Promise<CampaignGenerationResult> {
    const { config, generateContent, useAI } = request;

    // Validate configuration
    const validation = this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Generate calendar structure
    const calendar = this.generateCalendar(config);

    // Generate posts
    const posts = await this.generatePosts(config, calendar, generateContent, useAI);

    // Calculate estimates
    const estimatedReach = this.calculateEstimatedReach(config.platforms.platforms);
    const estimatedEngagement = this.calculateEstimatedEngagement(
      config.campaignType,
      posts.length
    );

    return {
      campaign: config,
      calendar,
      posts,
      estimatedReach,
      estimatedEngagement,
    };
  }

  /**
   * Validate campaign configuration
   */
  static validateConfiguration(config: CampaignV3Config): CampaignValidationResult {
    const errors: any[] = [];

    // Validate campaign type exists
    const campaignType = CampaignTypeEngine.getType(config.campaignType);
    if (!campaignType) {
      errors.push({
        field: 'campaignType',
        message: `Invalid campaign type: ${config.campaignType}`,
        code: 'INVALID_BUSINESS_TYPE',
      });
    }

    // Validate platforms (2-3 max)
    const platformValidation = PlatformSelector.validateSelection(
      config.platforms.platforms
    );
    if (!platformValidation.valid) {
      platformValidation.errors.forEach(error => {
        errors.push({
          field: 'platforms',
          message: error,
          code: 'INVALID_PLATFORM_COUNT',
        });
      });
    }

    // Validate duration
    const durationValidation = DurationEnforcer.validateDuration(config.duration);
    if (!durationValidation.valid) {
      errors.push({
        field: 'duration',
        message: durationValidation.error || 'Invalid duration',
        code: 'INVALID_DURATION',
      });
    }

    // Validate duration matches campaign type
    if (campaignType && config.duration !== campaignType.duration) {
      errors.push({
        field: 'duration',
        message: `${campaignType.name} campaigns must be ${campaignType.duration} days`,
        code: 'INVALID_DURATION',
      });
    }

    // Validate required fields
    if (!config.businessName) {
      errors.push({
        field: 'businessName',
        message: 'Business name is required',
        code: 'MISSING_REQUIRED',
      });
    }

    if (!config.industry) {
      errors.push({
        field: 'industry',
        message: 'Industry is required',
        code: 'MISSING_REQUIRED',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: platformValidation.warnings,
    };
  }

  /**
   * Generate calendar structure
   */
  static generateCalendar(config: CampaignV3Config): CampaignCalendar {
    // Generate day structure
    const dayStructures = DurationEnforcer.generateCalendarStructure(
      config.startDate,
      config.duration,
      config.campaignType
    );

    // Calculate posting schedule
    const schedule = DurationEnforcer.calculatePostingSchedule(
      config.duration,
      config.platforms.platforms,
      config.campaignType
    );

    // Build full calendar days
    const days: CampaignDay[] = dayStructures.map((dayStructure, index) => {
      const postsForDay = schedule.postDistribution[index];

      return {
        ...dayStructure,
        posts: [], // Will be filled by generatePosts
        postCount: postsForDay,
      };
    });

    // Count posts by platform
    const postsByPlatform: Partial<Record<PlatformV3, number>> = {};
    config.platforms.platforms.forEach(platform => {
      postsByPlatform[platform] = schedule.totalPosts / config.platforms.platforms.length;
    });

    return {
      campaignId: config.id,
      totalDays: config.duration,
      days,
      totalPosts: schedule.totalPosts,
      postsByPlatform: postsByPlatform as Record<PlatformV3, number>,
    };
  }

  /**
   * Generate posts for calendar
   */
  private static async generatePosts(
    config: CampaignV3Config,
    calendar: CampaignCalendar,
    generateContent: boolean,
    useAI: boolean
  ): Promise<CampaignPostV3[]> {
    const posts: CampaignPostV3[] = [];
    const campaignType = CampaignTypeEngine.getType(config.campaignType);

    if (!campaignType) {
      throw new Error('Invalid campaign type');
    }

    // Generate posts for each day
    for (const day of calendar.days) {
      const postsForDay = day.postCount;

      for (let postNum = 1; postNum <= postsForDay; postNum++) {
        // Distribute posts across platforms
        const platformIndex = (posts.length % config.platforms.platforms.length);
        const platform = config.platforms.platforms[platformIndex];

        // Determine content type based on phase
        const contentType = this.selectContentType(
          campaignType,
          day.phase,
          postNum,
          postsForDay
        );

        // Generate post
        const post: CampaignPostV3 = {
          id: `${config.id}-day${day.dayNumber}-post${postNum}`,
          campaignId: config.id,
          dayNumber: day.dayNumber,
          postNumber: postNum,
          platform,
          content: generateContent
            ? await this.generatePostContent(config, campaignType, day, contentType, useAI)
            : this.getPlaceholderContent(contentType),
          phase: day.phase,
          psychologicalIntent: this.getPsychologicalIntent(campaignType, day.phase),
          contentType,
          scheduledFor: this.calculatePostTime(day.date, postNum, config.postingSchedule),
          status: 'draft',
        };

        posts.push(post);
      }
    }

    // Add posts to calendar days
    posts.forEach(post => {
      const day = calendar.days.find(d => d.dayNumber === post.dayNumber);
      if (day) {
        day.posts.push(post);
      }
    });

    return posts;
  }

  /**
   * Select content type for post
   */
  private static selectContentType(
    campaignType: any,
    phase: 'phase1' | 'phase2' | 'phase3',
    postNum: number,
    totalPosts: number
  ): string {
    const contentTypes = campaignType.storyArc[phase].contentTypes;
    const index = (postNum - 1) % contentTypes.length;
    return contentTypes[index];
  }

  /**
   * Get psychological intent for phase
   */
  private static getPsychologicalIntent(
    campaignType: any,
    phase: 'phase1' | 'phase2' | 'phase3'
  ): string {
    const phaseIndex = phase === 'phase1' ? 0 : phase === 'phase2' ? 1 : 2;
    return campaignType.psychologicalSequence[phaseIndex] || 'Engage';
  }

  /**
   * Generate post content (placeholder for now)
   */
  private static async generatePostContent(
    config: CampaignV3Config,
    campaignType: any,
    day: CampaignDay,
    contentType: string,
    useAI: boolean
  ): Promise<CampaignPostV3['content']> {
    // TODO: Integrate with AI content generation
    // For now, return template-based content

    const text = `${contentType} - Day ${day.dayNumber}\n\n${config.businessName} | ${config.industry}\n\n${day.focus}`;

    return {
      text,
      hashtags: this.generateHashtags(config.industry, campaignType.name),
    };
  }

  /**
   * Get placeholder content
   */
  private static getPlaceholderContent(contentType: string): CampaignPostV3['content'] {
    return {
      text: `[${contentType} content will be generated here]`,
    };
  }

  /**
   * Generate hashtags
   */
  private static generateHashtags(industry: string, campaignName: string): string[] {
    return [
      '#SmallBusiness',
      '#Local',
      `#${industry.replace(/\s+/g, '')}`,
      '#Marketing',
      '#GrowYourBusiness',
    ].slice(0, 3);
  }

  /**
   * Calculate post time
   */
  private static calculatePostTime(
    dayDate: Date,
    postNum: number,
    schedule: CampaignV3Config['postingSchedule']
  ): Date {
    const postTime = new Date(dayDate);
    const timeIndex = (postNum - 1) % schedule.timesOfDay.length;
    const time = schedule.timesOfDay[timeIndex];

    const [hours, minutes] = time.split(':').map(Number);
    postTime.setHours(hours, minutes, 0, 0);

    return postTime;
  }

  /**
   * Calculate estimated reach
   */
  private static calculateEstimatedReach(platforms: PlatformV3[]): number {
    const platformReach = PlatformSelector.getEstimatedReach(platforms);
    const totalReach = Object.values(platformReach).reduce((sum, reach) => sum + reach, 0);

    // Apply multiplier based on platform count (diminishing returns)
    const multiplier = platforms.length === 2 ? 1.2 : platforms.length === 3 ? 1.5 : 1;

    return Math.round(totalReach * multiplier);
  }

  /**
   * Calculate estimated engagement
   */
  private static calculateEstimatedEngagement(
    campaignType: CampaignTypeV3,
    postCount: number
  ): number {
    // Engagement rate varies by campaign type
    const engagementRates: Record<CampaignTypeV3, number> = {
      'authority-builder': 0.03,
      'community-champion': 0.045,
      'trust-builder': 0.035,
      'revenue-rush': 0.025,
      'viral-spark': 0.08, // Viral content gets higher engagement
    };

    const rate = engagementRates[campaignType];
    const baseEngagement = 1000; // Base audience size

    return Math.round(baseEngagement * rate * postCount);
  }

  /**
   * Create quick campaign from selections
   */
  static createQuickCampaign(
    userId: string,
    goal: BusinessGoal,
    businessType: BusinessType,
    businessName: string,
    industry: string,
    location?: string
  ): CampaignV3Config {
    // Match goal to campaign type
    const campaignType = CampaignTypeEngine.getTypeForGoal(goal);

    if (!campaignType) {
      throw new Error(`No campaign type found for goal: ${goal}`);
    }

    // Get recommended platforms
    const platformRec = PlatformSelector.getRecommendations(
      businessType,
      campaignType.id
    );

    // Create platform selection
    const platforms = PlatformSelector.createSelection(platformRec.recommended);

    // Get recommended posting times
    const postingTimes = DurationEnforcer.getRecommendedPostingTimes(
      campaignType.id,
      platforms.platforms
    );

    // Create config
    const config: CampaignV3Config = {
      id: `campaign-${Date.now()}`,
      userId,
      campaignType: campaignType.id,
      goal,
      platforms,
      duration: campaignType.duration,
      businessType,
      businessName,
      industry,
      location,
      startDate: new Date(),
      postingSchedule: {
        timesOfDay: postingTimes,
        postsPerDay: 2,
      },
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return config;
  }
}

export default CampaignGeneratorV3;
