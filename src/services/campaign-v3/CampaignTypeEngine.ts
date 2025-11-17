/**
 * Campaign Type Engine
 *
 * Defines the 5 V3 campaign types with all their metadata, story arcs,
 * and business logic. This is the source of truth for campaign definitions.
 *
 * Because someone decided we needed EXACTLY 5 campaign types, not 4, not 6.
 */

import type {
  CampaignTypeV3,
  CampaignTypeDefinition,
  BusinessGoal,
  BusinessType,
  PlatformV3,
} from '../../types/campaign-v3.types';

export class CampaignTypeEngine {
  private static readonly CAMPAIGN_TYPES: Record<CampaignTypeV3, CampaignTypeDefinition> = {
    'authority-builder': {
      id: 'authority-builder',
      name: 'Authority Builder',
      tagline: '7 days to visible expert',
      description: 'Establish yourself as the go-to expert in your industry through educational content, insights, and proof of expertise.',
      goal: 'build-authority',
      duration: 7,

      storyArc: {
        phase1: {
          days: 'Days 1-2',
          focus: 'Problem Awareness',
          contentTypes: ['Industry insights', 'Problem identification', 'Pain point posts'],
        },
        phase2: {
          days: 'Days 3-5',
          focus: 'Education & Solutions',
          contentTypes: ['How-to tutorials', 'Tips & tricks', 'Expert commentary'],
        },
        phase3: {
          days: 'Days 6-7',
          focus: 'Proof & Call to Action',
          contentTypes: ['Case studies', 'Testimonials', 'Consultation offers'],
        },
      },

      recommendedFor: ['professional-service', 'b2b', 'creator', 'local-service'],
      recommendedPlatforms: ['linkedin', 'facebook', 'youtube-shorts'],

      contentMix: {
        video: 40,
        image: 30,
        text: 20,
        carousel: 10,
      },

      psychologicalSequence: [
        'Awareness - Identify the problem',
        'Interest - Share insights',
        'Desire - Demonstrate expertise',
        'Action - Offer solution',
      ],

      successMetrics: [
        'Profile views increase',
        'Follower growth',
        'Engagement on educational content',
        'Consultation requests',
      ],

      icon: '🎓',
      color: '#3B82F6',
      gradient: 'from-blue-500 to-indigo-600',
    },

    'community-champion': {
      id: 'community-champion',
      name: 'Community Champion',
      tagline: 'Local community leader in 14 days',
      description: 'Build deep local connections and become the neighborhood business everyone knows and trusts.',
      goal: 'increase-local-traffic',
      duration: 14,

      storyArc: {
        phase1: {
          days: 'Days 1-4',
          focus: 'Local Spotlight & Connection',
          contentTypes: ['Community shoutouts', 'Local event coverage', 'Behind-the-scenes'],
        },
        phase2: {
          days: 'Days 5-10',
          focus: 'Customer Stories & Involvement',
          contentTypes: ['Customer spotlights', 'Local partnerships', 'Community involvement'],
        },
        phase3: {
          days: 'Days 11-14',
          focus: 'Local Offer & Urgency',
          contentTypes: ['Exclusive local offers', 'Limited-time deals', 'Neighborhood appreciation'],
        },
      },

      recommendedFor: ['local-service', 'restaurant', 'retail'],
      recommendedPlatforms: ['facebook', 'instagram', 'google-business'],

      contentMix: {
        video: 35,
        image: 45,
        text: 10,
        carousel: 10,
      },

      psychologicalSequence: [
        'Connection - Show you care about the community',
        'Trust - Demonstrate local involvement',
        'Social Proof - Share customer stories',
        'Urgency - Create FOMO with local exclusives',
      ],

      successMetrics: [
        'Local engagement increase',
        'Store visits',
        'GMB views and actions',
        'Local offer redemptions',
      ],

      icon: '🏘️',
      color: '#10B981',
      gradient: 'from-green-500 to-emerald-600',
    },

    'trust-builder': {
      id: 'trust-builder',
      name: 'Trust Builder',
      tagline: 'Build credibility in 10 days',
      description: 'Establish trust and credibility through customer transformations, social proof, and consistent results.',
      goal: 'build-trust',
      duration: 10,

      storyArc: {
        phase1: {
          days: 'Days 1-3',
          focus: 'Problem Identification & Empathy',
          contentTypes: ['Pain point posts', 'Empathy stories', 'Problem validation'],
        },
        phase2: {
          days: 'Days 4-7',
          focus: 'Customer Transformation Stories',
          contentTypes: ['Video testimonials', 'Before/after', 'Success stories'],
        },
        phase3: {
          days: 'Days 8-10',
          focus: 'Social Proof & Trust Signals',
          contentTypes: ['Review highlights', 'Credentials', 'Guarantee/offer'],
        },
      },

      recommendedFor: ['local-service', 'professional-service', 'ecommerce', 'b2b'],
      recommendedPlatforms: ['facebook', 'instagram', 'linkedin'],

      contentMix: {
        video: 50,
        image: 30,
        text: 10,
        carousel: 10,
      },

      psychologicalSequence: [
        'Empathy - Show you understand their problem',
        'Hope - Demonstrate transformation is possible',
        'Belief - Provide proof of consistent results',
        'Trust - Offer risk-free next step',
      ],

      successMetrics: [
        'Testimonial engagement',
        'Website clicks',
        'Quote requests',
        'Conversion rate increase',
      ],

      icon: '🤝',
      color: '#8B5CF6',
      gradient: 'from-purple-500 to-violet-600',
    },

    'revenue-rush': {
      id: 'revenue-rush',
      name: 'Revenue Rush',
      tagline: 'Drive immediate sales in 5 days',
      description: 'Fast-paced campaign designed to generate immediate sales through urgency, scarcity, and compelling offers.',
      goal: 'drive-sales',
      duration: 5,

      storyArc: {
        phase1: {
          days: 'Days 1-2',
          focus: 'Problem Agitation & Solution Tease',
          contentTypes: ['Problem amplification', 'Product teasers', 'Value demonstration'],
        },
        phase2: {
          days: 'Days 3-4',
          focus: 'Product Showcase & Social Proof',
          contentTypes: ['Product demos', 'Customer results', 'Shoppable posts'],
        },
        phase3: {
          days: 'Day 5',
          focus: 'Limited Offer & Urgency',
          contentTypes: ['Flash sale', 'Countdown posts', 'Last chance'],
        },
      },

      recommendedFor: ['ecommerce', 'retail', 'restaurant'],
      recommendedPlatforms: ['instagram', 'facebook', 'tiktok'],

      contentMix: {
        video: 45,
        image: 35,
        text: 5,
        carousel: 15,
      },

      psychologicalSequence: [
        'Desire - Create want for the product',
        'Proof - Show it works',
        'Urgency - Create scarcity',
        'Action - Make buying easy',
      ],

      successMetrics: [
        'Product page clicks',
        'Add to cart',
        'Purchases',
        'Revenue generated',
      ],

      icon: '💰',
      color: '#EF4444',
      gradient: 'from-red-500 to-orange-600',
    },

    'viral-spark': {
      id: 'viral-spark',
      name: 'Viral Spark',
      tagline: 'Massive reach in 7 days',
      description: 'Create viral momentum through trending content, challenges, and highly shareable posts designed for maximum reach.',
      goal: 'increase-awareness',
      duration: 7,

      storyArc: {
        phase1: {
          days: 'Days 1-2',
          focus: 'Trending Content Participation',
          contentTypes: ['Trending audio', 'Viral challenges', 'Hook content'],
        },
        phase2: {
          days: 'Days 3-5',
          focus: 'Behind-the-Scenes & Personality',
          contentTypes: ['BTS content', 'Relatable moments', 'Entertainment'],
        },
        phase3: {
          days: 'Days 6-7',
          focus: 'CTA & Follow-Up Engagement',
          contentTypes: ['Call to follow', 'Engagement posts', 'Community building'],
        },
      },

      recommendedFor: ['creator', 'restaurant', 'retail', 'ecommerce'],
      recommendedPlatforms: ['tiktok', 'instagram', 'youtube-shorts'],

      contentMix: {
        video: 90,
        image: 5,
        text: 0,
        carousel: 5,
      },

      psychologicalSequence: [
        'Stop Scroll - Grab attention instantly',
        'Relatability - Create connection',
        'Entertainment - Keep watching',
        'Follow - Convert to follower',
      ],

      successMetrics: [
        'Video views',
        'Shares and saves',
        'Follower growth',
        'Viral coefficient (shares per post)',
      ],

      icon: '🚀',
      color: '#F59E0B',
      gradient: 'from-yellow-500 to-pink-600',
    },
  };

  /**
   * Get all campaign type definitions
   */
  static getAllTypes(): CampaignTypeDefinition[] {
    return Object.values(this.CAMPAIGN_TYPES);
  }

  /**
   * Get campaign type by ID
   */
  static getType(id: CampaignTypeV3): CampaignTypeDefinition | undefined {
    return this.CAMPAIGN_TYPES[id];
  }

  /**
   * Get campaign types for a business goal
   */
  static getTypesByGoal(goal: BusinessGoal): CampaignTypeDefinition[] {
    return this.getAllTypes().filter(type => type.goal === goal);
  }

  /**
   * Get recommended campaign types for business type
   */
  static getRecommendedTypes(businessType: BusinessType): CampaignTypeDefinition[] {
    return this.getAllTypes().filter(type =>
      type.recommendedFor.includes(businessType)
    );
  }

  /**
   * Get campaign type by goal (primary match)
   */
  static getTypeForGoal(goal: BusinessGoal): CampaignTypeDefinition | undefined {
    return this.getAllTypes().find(type => type.goal === goal);
  }

  /**
   * Match business type to best campaign type
   */
  static matchBusinessTypeToCampaign(
    businessType: BusinessType,
    preferredGoal?: BusinessGoal
  ): CampaignTypeDefinition {
    // If goal is specified, try to match that first
    if (preferredGoal) {
      const typeForGoal = this.getTypeForGoal(preferredGoal);
      if (typeForGoal && typeForGoal.recommendedFor.includes(businessType)) {
        return typeForGoal;
      }
    }

    // Default matching logic
    const defaultMatches: Record<BusinessType, CampaignTypeV3> = {
      'local-service': 'community-champion',
      'restaurant': 'community-champion',
      'retail': 'revenue-rush',
      'ecommerce': 'revenue-rush',
      'professional-service': 'authority-builder',
      'b2b': 'authority-builder',
      'creator': 'viral-spark',
      'other': 'authority-builder', // Safe default
    };

    const matchedType = defaultMatches[businessType];
    return this.CAMPAIGN_TYPES[matchedType];
  }

  /**
   * Get estimated post count for campaign
   */
  static getEstimatedPostCount(
    campaignType: CampaignTypeV3,
    platformCount: number
  ): number {
    const type = this.getType(campaignType);
    if (!type) return 0;

    // Base posts per day varies by campaign type
    const basePostsPerDay: Record<CampaignTypeV3, number> = {
      'authority-builder': 1.5,   // 7 days = ~10-11 posts
      'community-champion': 1.3,  // 14 days = ~18-20 posts
      'trust-builder': 1.5,       // 10 days = ~15 posts
      'revenue-rush': 2.4,        // 5 days = ~12 posts (intense)
      'viral-spark': 2,           // 7 days = ~14 posts
    };

    const basePosts = Math.ceil(type.duration * basePostsPerDay[campaignType]);

    // Multiply by platform count (each post goes to selected platforms)
    // But cap at 3 platforms max
    const effectivePlatformCount = Math.min(platformCount, 3);

    return basePosts * effectivePlatformCount;
  }

  /**
   * Validate campaign configuration
   */
  static validateConfig(config: {
    campaignType: CampaignTypeV3;
    platforms: PlatformV3[];
    duration: number;
    businessType: BusinessType;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate campaign type exists
    const type = this.getType(config.campaignType);
    if (!type) {
      errors.push(`Invalid campaign type: ${config.campaignType}`);
      return { valid: false, errors };
    }

    // Validate platform count (2-3 max)
    if (config.platforms.length < 2) {
      errors.push('Select at least 2 platforms');
    }
    if (config.platforms.length > 3) {
      errors.push('Maximum 3 platforms allowed');
    }

    // Validate duration matches campaign type
    if (config.duration !== type.duration) {
      errors.push(`${type.name} campaign must be ${type.duration} days`);
    }

    // Validate business type is recommended
    if (!type.recommendedFor.includes(config.businessType)) {
      errors.push(`${type.name} is not recommended for ${config.businessType} businesses (but you can still try it)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get content distribution for campaign
   */
  static getContentDistribution(campaignType: CampaignTypeV3): {
    day: number;
    phase: 'phase1' | 'phase2' | 'phase3';
    postsCount: number;
    focus: string;
  }[] {
    const type = this.getType(campaignType);
    if (!type) return [];

    const distribution: any[] = [];
    let currentDay = 1;

    // Phase 1
    const phase1Days = this.parseDayRange(type.storyArc.phase1.days);
    for (let i = 0; i < phase1Days; i++) {
      distribution.push({
        day: currentDay++,
        phase: 'phase1',
        postsCount: this.getPostsPerDay(campaignType, 'phase1'),
        focus: type.storyArc.phase1.focus,
      });
    }

    // Phase 2
    const phase2Days = this.parseDayRange(type.storyArc.phase2.days);
    for (let i = 0; i < phase2Days; i++) {
      distribution.push({
        day: currentDay++,
        phase: 'phase2',
        postsCount: this.getPostsPerDay(campaignType, 'phase2'),
        focus: type.storyArc.phase2.focus,
      });
    }

    // Phase 3 (if exists)
    if (type.storyArc.phase3) {
      const phase3Days = this.parseDayRange(type.storyArc.phase3.days);
      for (let i = 0; i < phase3Days; i++) {
        distribution.push({
          day: currentDay++,
          phase: 'phase3',
          postsCount: this.getPostsPerDay(campaignType, 'phase3'),
          focus: type.storyArc.phase3.focus,
        });
      }
    }

    return distribution;
  }

  /**
   * Parse day range string (e.g., "Days 1-3" -> 3)
   */
  private static parseDayRange(dayRange: string): number {
    const match = dayRange.match(/(\d+)-(\d+)/);
    if (!match) {
      // Single day (e.g., "Day 5")
      const singleMatch = dayRange.match(/(\d+)/);
      return singleMatch ? 1 : 0;
    }
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    return end - start + 1;
  }

  /**
   * Get posts per day for each phase
   */
  private static getPostsPerDay(
    campaignType: CampaignTypeV3,
    phase: 'phase1' | 'phase2' | 'phase3'
  ): number {
    // Revenue Rush is most intense
    if (campaignType === 'revenue-rush') {
      return phase === 'phase3' ? 3 : 2;
    }

    // Viral Spark needs consistent daily posting
    if (campaignType === 'viral-spark') {
      return 2;
    }

    // Others are more moderate
    return phase === 'phase1' ? 1 : phase === 'phase2' ? 2 : 1;
  }
}

export default CampaignTypeEngine;
