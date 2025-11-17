/**
 * UGC Contest Service
 * Generate user-generated content contests that drive 30% engagement boost at $0 cost
 *
 * Contest Types: Photo, Video, Review, Testimonial, Story
 * Features: Auto-rules, hashtag gen, prize suggestions, templates, tracking
 */

import {
  UGCContest,
  UGCContestType,
  Prize,
  ContestTemplates,
  ContestTracking,
  BusinessContext,
  ServiceResponse,
  SocialPlatform,
} from '../../types/tactics.types';

export class UGCContestService {
  /**
   * Generate a complete UGC contest based on business type
   */
  async generateContest(
    businessContext: BusinessContext,
    contestType: UGCContestType,
    customization?: Partial<UGCContest>
  ): Promise<ServiceResponse<UGCContest>> {
    try {
      const contest: UGCContest = {
        id: this.generateId(),
        businessId: businessContext.id,
        type: contestType,
        title: this.generateTitle(businessContext, contestType),
        description: this.generateDescription(businessContext, contestType),
        rules: this.generateRules(contestType, businessContext),
        hashtag: this.generateContestHashtag(businessContext, contestType),
        additionalHashtags: this.generateAdditionalHashtags(businessContext),
        prize: this.suggestPrize(businessContext, contestType),
        startDate: customization?.startDate || new Date(),
        endDate: customization?.endDate || this.calculateEndDate(contestType),
        platforms: this.selectPlatforms(contestType, businessContext.platforms),
        templates: this.generateTemplates(businessContext, contestType),
        tracking: this.initializeTracking(),
        status: 'draft',
        createdAt: new Date(),
        ...customization,
      };

      return {
        success: true,
        data: contest,
        metadata: {
          expectedEngagement: '30%',
          cost: '$0',
          setupTime: '15 minutes',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate contest',
      };
    }
  }

  /**
   * Generate contest title based on business and type
   */
  private generateTitle(context: BusinessContext, type: UGCContestType): string {
    const titles = {
      photo: [
        `Show Us Your ${context.specialty || 'Style'}! Photo Contest`,
        `${context.name} Photo Challenge`,
        `Capture the Moment: ${context.specialty} Edition`,
      ],
      video: [
        `Share Your Story Video Contest`,
        `${context.name} Video Challenge`,
        `Show & Tell: ${context.specialty} Videos`,
      ],
      review: [
        `Review & Win Contest`,
        `Tell Us Your Experience`,
        `Share Your ${context.name} Story`,
      ],
      testimonial: [
        `Customer Success Story Contest`,
        `Share Your Transformation`,
        `Before & After Challenge`,
      ],
      story: [
        `Instagram Stories Takeover Contest`,
        `24-Hour Story Challenge`,
        `Behind the Scenes Stories`,
      ],
    };

    return this.randomChoice(titles[type]);
  }

  /**
   * Generate contest description
   */
  private generateDescription(context: BusinessContext, type: UGCContestType): string {
    const descriptions = {
      photo: `We want to see how ${context.name} fits into your life! Share a photo showing off ${
        context.specialty || 'our products/services'
      }, tag us, use our contest hashtag, and you could win an amazing prize!`,
      video: `Create a short video (15-60 seconds) sharing your experience with ${context.name}. Show us the before & after, give us a tour, or share your favorite moment. Most creative video wins!`,
      review: `Already a customer? Share your honest review on ${this.formatPlatforms(
        context.platforms
      )} and you're automatically entered to win! We love hearing your stories.`,
      testimonial: `Share your transformation story! How did ${context.name} help you achieve your goals? Written or video testimonials accepted. Real stories win real prizes.`,
      story: `Post Instagram/Facebook Stories featuring ${
        context.name
      } for 24 hours! Tag us and use our hashtag. Most creative daily story wins!`,
    };

    return descriptions[type];
  }

  /**
   * Auto-generate contest rules (legal-friendly)
   */
  private generateRules(type: UGCContestType, context: BusinessContext): string[] {
    const baseRules = [
      'Must be 18+ to enter (or have parental consent)',
      `Must follow ${context.name} on ${this.formatPlatforms(context.platforms)}`,
      'Content must be original and created by you',
      'By entering, you grant permission to repost your content',
      'Winner selected based on creativity and engagement',
      'No purchase necessary',
      'Void where prohibited by law',
    ];

    const typeSpecificRules = {
      photo: [
        'Photo must clearly show/feature our product or service',
        'Must tag our account and use contest hashtag',
        'Entries accepted until contest end date',
        'One entry per person (unless otherwise stated)',
      ],
      video: [
        'Video must be 15-60 seconds long',
        'Content must be appropriate for all ages',
        'Must tag our account in video description',
        'Higher quality videos have better chances',
      ],
      review: [
        'Review must be honest and genuine',
        'Must be posted on our official pages',
        'Fake reviews will be disqualified',
        'Winner drawn randomly from all reviews',
      ],
      testimonial: [
        'Must be a real customer/client',
        'Share specific results or transformations',
        'Video testimonials preferred but written accepted',
        'Before/after photos encouraged',
      ],
      story: [
        'Stories must remain up for 24 hours minimum',
        'Must tag our account in each story',
        'Use contest hashtag visible in story',
        'Multiple stories = more entries',
      ],
    };

    return [...baseRules, ...typeSpecificRules[type]];
  }

  /**
   * Generate contest hashtag
   */
  private generateContestHashtag(context: BusinessContext, type: UGCContestType): string {
    const businessName = context.name.replace(/\s+/g, '');
    const year = new Date().getFullYear();

    const options = [
      `#${businessName}Contest${year}`,
      `#${businessName}Challenge`,
      `#Win${businessName}`,
      `#${businessName}Giveaway`,
      `#Show${businessName}`,
    ];

    return this.randomChoice(options);
  }

  /**
   * Generate additional hashtags for reach
   */
  private generateAdditionalHashtags(context: BusinessContext): string[] {
    const general = ['#contest', '#giveaway', '#win'];
    const industry = context.industry
      ? [`#${context.industry.replace(/\s+/g, '')}Contest`, `#${context.industry.replace(/\s+/g, '')}`]
      : [];
    const location = context.location
      ? [`#${context.location.replace(/\s+/g, '')}`, `#${context.location.replace(/\s+/g, '')}Business`]
      : [];

    return [...general, ...industry, ...location].slice(0, 5);
  }

  /**
   * Suggest prize based on business type and contest
   */
  private suggestPrize(context: BusinessContext, type: UGCContestType): Prize {
    // Prize value should be 5-10% of average sale or $50-$100 minimum
    const prizeOptions: Record<string, Prize[]> = {
      restaurant: [
        {
          type: 'gift_card',
          description: '$100 Dining Gift Card',
          value: 100,
          currency: 'USD',
          winnerCount: 1,
        },
        {
          type: 'discount',
          description: '50% off your next visit (up to $75)',
          value: 75,
          currency: 'USD',
          winnerCount: 3,
        },
      ],
      retail: [
        {
          type: 'product',
          description: '$200 Shopping Spree',
          value: 200,
          currency: 'USD',
          winnerCount: 1,
        },
        {
          type: 'discount',
          description: '30% off entire purchase',
          value: 100,
          currency: 'USD',
          winnerCount: 5,
        },
      ],
      service: [
        {
          type: 'service',
          description: 'Free service (up to $300 value)',
          value: 300,
          currency: 'USD',
          winnerCount: 1,
        },
        {
          type: 'discount',
          description: '25% off any service',
          value: 100,
          currency: 'USD',
          winnerCount: 3,
        },
      ],
      default: [
        {
          type: 'giveaway',
          description: 'Grand Prize Package ($150 value)',
          value: 150,
          currency: 'USD',
          winnerCount: 1,
        },
        {
          type: 'discount',
          description: '20% off discount code',
          value: 50,
          currency: 'USD',
          winnerCount: 10,
        },
      ],
    };

    const industryKey = context.industry.toLowerCase();
    const prizes =
      prizeOptions[industryKey] || prizeOptions.retail || prizeOptions.default;

    // Select based on contest type
    if (type === 'review' || type === 'testimonial') {
      // Reviews get bigger prizes because they're more valuable
      return prizes[0];
    } else {
      // Other contests can have multiple winners
      return prizes[Math.random() > 0.5 ? 0 : 1];
    }
  }

  /**
   * Generate post templates for contest promotion
   */
  private generateTemplates(context: BusinessContext, type: UGCContestType): ContestTemplates {
    const hashtag = this.generateContestHashtag(context, type);

    return {
      announcement: this.generateAnnouncementTemplate(context, type, hashtag),
      reminder: this.generateReminderTemplate(context, hashtag),
      winner: this.generateWinnerTemplate(context, hashtag),
      thankYou: this.generateThankYouTemplate(context, hashtag),
    };
  }

  private generateAnnouncementTemplate(
    context: BusinessContext,
    type: UGCContestType,
    hashtag: string
  ): string {
    return `🎉 CONTEST ALERT! 🎉

We're giving away [PRIZE] to [NUMBER] lucky winner(s)!

📸 How to Enter:
1. Follow us @${context.name.replace(/\s+/g, '').toLowerCase()}
2. ${this.getContestAction(type)}
3. Tag us and use ${hashtag}
4. That's it!

Contest runs until [END_DATE]. Winner announced [WINNER_DATE].

Good luck! 🍀

${hashtag}
#contest #giveaway #win

[Full rules: link in bio]`;
  }

  private generateReminderTemplate(context: BusinessContext, hashtag: string): string {
    return `⏰ LAST CHANCE REMINDER! ⏰

Only [DAYS_LEFT] days left to enter our contest!

We've seen some AMAZING entries so far... but we want to see YOURS! 👀

Don't miss out on winning [PRIZE]!

Enter now: ${hashtag}

Winner announced [DATE]!

${hashtag}`;
  }

  private generateWinnerTemplate(context: BusinessContext, hashtag: string): string {
    return `🏆 WINNER ANNOUNCEMENT 🏆

Congratulations to @[WINNER_USERNAME]!

You've won [PRIZE]! 🎉

We'll DM you shortly with details on how to claim your prize.

HUGE thank you to everyone who entered! We loved seeing all your amazing [photos/videos/stories]. You all rock! ❤️

Stay tuned for more contests coming soon...

${hashtag}`;
  }

  private generateThankYouTemplate(context: BusinessContext, hashtag: string): string {
    return `Thank you to EVERYONE who entered our ${hashtag} contest! 🙏

The response was incredible! We're blown away by your creativity and support.

Even though the contest is over, we'd LOVE to keep seeing your content. Tag us anytime!

Next contest coming soon... 👀

${hashtag}`;
  }

  /**
   * Get contest action verb based on type
   */
  private getContestAction(type: UGCContestType): string {
    const actions = {
      photo: 'Post a photo showing [WHAT TO SHOW]',
      video: 'Share a video (15-60 sec) about [TOPIC]',
      review: 'Leave an honest review on [PLATFORM]',
      testimonial: 'Share your transformation story',
      story: 'Post Instagram/Facebook Stories for 24 hours',
    };
    return actions[type];
  }

  /**
   * Select optimal platforms for contest type
   */
  private selectPlatforms(
    type: UGCContestType,
    availablePlatforms: SocialPlatform[]
  ): SocialPlatform[] {
    const bestPlatforms: Record<UGCContestType, SocialPlatform[]> = {
      photo: ['instagram', 'facebook'],
      video: ['instagram', 'tiktok', 'youtube'],
      review: ['facebook', 'google_business'],
      testimonial: ['facebook', 'linkedin', 'instagram'],
      story: ['instagram', 'facebook'],
    };

    const recommended = bestPlatforms[type];
    return availablePlatforms.filter((p) => recommended.includes(p));
  }

  /**
   * Initialize tracking object
   */
  private initializeTracking(): ContestTracking {
    return {
      entries: 0,
      uniqueParticipants: 0,
      totalEngagement: 0,
      reach: 0,
      hashtagUses: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate contest end date based on type
   */
  private calculateEndDate(type: UGCContestType): Date {
    const durations = {
      photo: 14, // 2 weeks
      video: 21, // 3 weeks (more time for video creation)
      review: 30, // 1 month
      testimonial: 30, // 1 month
      story: 7, // 1 week (short & urgent)
    };

    const days = durations[type];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate;
  }

  /**
   * Update contest tracking metrics
   */
  async updateTracking(
    contestId: string,
    metrics: Partial<ContestTracking>
  ): Promise<ServiceResponse<ContestTracking>> {
    try {
      // In real implementation, this would update the database
      const updated: ContestTracking = {
        ...metrics,
        lastUpdated: new Date(),
      } as ContestTracking;

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tracking',
      };
    }
  }

  /**
   * Get all contests for a business
   */
  async getContests(businessId: string): Promise<ServiceResponse<UGCContest[]>> {
    try {
      // In real implementation, fetch from database
      // For now, return empty array
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contests',
      };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateId(): string {
    return `ugc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private formatPlatforms(platforms: SocialPlatform[]): string {
    if (platforms.length === 0) return 'social media';
    if (platforms.length === 1) return platforms[0];
    if (platforms.length === 2) return `${platforms[0]} and ${platforms[1]}`;
    return `${platforms.slice(0, -1).join(', ')}, and ${platforms[platforms.length - 1]}`;
  }
}

// Singleton export
export const ugcContestService = new UGCContestService();
