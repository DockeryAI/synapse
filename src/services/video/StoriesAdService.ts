/**
 * Stories Ad Service
 *
 * Manages Stories ad templates optimized for Instagram and Facebook
 * Target CPM: $0.50-$2 (vs $8-$15 for feed ads)
 * Format: Always 9:16 vertical full-screen
 */

import type {
  StoriesAdTemplate,
  StoriesAdType,
  StoriesAdFeatures,
  BrandOverlay,
  VideoDuration
} from '@/types/video.types';

// ============================================================================
// STORIES AD TEMPLATES
// ============================================================================

/**
 * Flash Sale Stories Ad
 * Create urgency with countdown and limited-time offers
 */
export const FLASH_SALE_AD: StoriesAdTemplate = {
  id: 'stories_flash_001',
  type: 'flash_sale',
  name: 'Flash Sale - Countdown',
  description: 'Urgency-driven ad with countdown sticker for immediate action',

  aspectRatio: '9:16',

  duration: {
    min: 6,
    max: 15,
    optimal: 10
  },

  features: {
    countdownSticker: true,
    swipeUpCTA: true,
    productTags: true,
    pollSticker: false,
    questionSticker: false,
    brandOverlay: {
      logo: true,
      colors: true,
      position: 'top',
      opacity: 0.9
    }
  },

  targetCPM: {
    min: 0.50,
    max: 1.50
  },

  platforms: ['instagram', 'facebook']
};

/**
 * Product Launch Stories Ad
 * Announce new products with excitement and social proof
 */
export const PRODUCT_LAUNCH_AD: StoriesAdTemplate = {
  id: 'stories_launch_001',
  type: 'product_launch',
  name: 'Product Launch - Announcement',
  description: 'Generate excitement for new product launches',

  aspectRatio: '9:16',

  duration: {
    min: 10,
    max: 15,
    optimal: 12
  },

  features: {
    countdownSticker: false,
    swipeUpCTA: true,
    productTags: true,
    pollSticker: true, // "Are you excited?" poll for engagement
    questionSticker: false,
    brandOverlay: {
      logo: true,
      colors: true,
      position: 'corner',
      opacity: 0.8
    }
  },

  targetCPM: {
    min: 0.75,
    max: 2.00
  },

  platforms: ['instagram', 'facebook']
};

/**
 * Event Promotion Stories Ad
 * Drive attendance with clear event details and RSVP
 */
export const EVENT_PROMOTION_AD: StoriesAdTemplate = {
  id: 'stories_event_001',
  type: 'event_promotion',
  name: 'Event Promotion - RSVP',
  description: 'Promote local events and drive RSVPs',

  aspectRatio: '9:16',

  duration: {
    min: 8,
    max: 15,
    optimal: 10
  },

  features: {
    countdownSticker: true, // Countdown to event
    swipeUpCTA: true, // RSVP link
    productTags: false,
    pollSticker: false,
    questionSticker: true, // "Will you be there?"
    brandOverlay: {
      logo: true,
      colors: true,
      position: 'bottom',
      opacity: 0.85
    }
  },

  targetCPM: {
    min: 0.50,
    max: 1.25
  },

  platforms: ['instagram', 'facebook']
};

/**
 * Limited Offer Stories Ad
 * Scarcity-driven ad for exclusive deals
 */
export const LIMITED_OFFER_AD: StoriesAdTemplate = {
  id: 'stories_offer_001',
  type: 'limited_offer',
  name: 'Limited Offer - Scarcity',
  description: 'Drive conversions with limited availability messaging',

  aspectRatio: '9:16',

  duration: {
    min: 6,
    max: 12,
    optimal: 8
  },

  features: {
    countdownSticker: true,
    swipeUpCTA: true,
    productTags: true,
    pollSticker: false,
    questionSticker: false,
    brandOverlay: {
      logo: true,
      colors: true,
      position: 'top',
      opacity: 0.9
    }
  },

  targetCPM: {
    min: 0.50,
    max: 1.75
  },

  platforms: ['instagram', 'facebook']
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Complete registry of all Stories ad templates
 */
export const STORIES_AD_TEMPLATES: Record<StoriesAdType, StoriesAdTemplate> = {
  flash_sale: FLASH_SALE_AD,
  product_launch: PRODUCT_LAUNCH_AD,
  event_promotion: EVENT_PROMOTION_AD,
  limited_offer: LIMITED_OFFER_AD
};

// ============================================================================
// STORIES AD SERVICE
// ============================================================================

/**
 * Stories Ad Service
 */
export class StoriesAdService {
  /**
   * Get all Stories ad templates
   */
  static getAllTemplates(): StoriesAdTemplate[] {
    return Object.values(STORIES_AD_TEMPLATES);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): StoriesAdTemplate | undefined {
    return this.getAllTemplates().find(template => template.id === id);
  }

  /**
   * Get template by type
   */
  static getTemplateByType(type: StoriesAdType): StoriesAdTemplate {
    return STORIES_AD_TEMPLATES[type];
  }

  /**
   * Get templates by campaign type (V3)
   */
  static getTemplatesByCampaignType(campaignTypeId: string): StoriesAdTemplate[] {
    const campaignTemplateMap: Record<string, StoriesAdType[]> = {
      authority_builder: ['product_launch'], // Launch new services/expertise
      community_champion: ['event_promotion', 'limited_offer'], // Local events, community deals
      trust_builder: ['product_launch'], // Build excitement and credibility
      revenue_rush: ['flash_sale', 'limited_offer'], // Immediate sales focus
      viral_spark: ['product_launch', 'event_promotion'] // Generate buzz
    };

    const templateTypes = campaignTemplateMap[campaignTypeId] || [];
    return templateTypes.map(type => STORIES_AD_TEMPLATES[type]);
  }

  /**
   * Suggest best Stories ad template for campaign
   */
  static suggestTemplate(campaignTypeId: string): StoriesAdTemplate {
    const templates = this.getTemplatesByCampaignType(campaignTypeId);
    return templates[0] || FLASH_SALE_AD;
  }

  /**
   * Calculate cost savings vs feed ads
   */
  static calculateSavings(
    storiesImpressions: number,
    feedImpressions: number
  ): {
    storiesCost: number;
    feedCost: number;
    savings: number;
    savingsPercentage: number;
  } {
    // Stories ads: $0.50-$2 CPM (use $1.25 average)
    const storiesAverageCPM = 1.25;
    const storiesCost = (storiesImpressions / 1000) * storiesAverageCPM;

    // Feed ads: $8-$15 CPM (use $11.50 average)
    const feedAverageCPM = 11.50;
    const feedCost = (feedImpressions / 1000) * feedAverageCPM;

    const savings = feedCost - storiesCost;
    const savingsPercentage = (savings / feedCost) * 100;

    return {
      storiesCost: Math.round(storiesCost * 100) / 100,
      feedCost: Math.round(feedCost * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      savingsPercentage: Math.round(savingsPercentage)
    };
  }

  /**
   * Get optimal duration for Stories ad
   */
  static getOptimalDuration(template: StoriesAdTemplate): number {
    // Stories ads should be quick to maintain attention
    // Optimal is slightly shorter than template optimal
    return Math.min(template.duration.optimal, 10);
  }

  /**
   * Validate Stories ad configuration
   */
  static validateStoriesAd(template: StoriesAdTemplate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Aspect ratio must be 9:16
    if (template.aspectRatio !== '9:16') {
      errors.push('Stories ads must be 9:16 vertical format');
    }

    // Duration validation (Stories ads should be short)
    if (template.duration.max > 15) {
      errors.push('Stories ads should not exceed 15 seconds');
    }

    // CPM validation
    if (template.targetCPM.min < 0.25 || template.targetCPM.max > 3.00) {
      errors.push('Target CPM should be between $0.25 and $3.00');
    }

    // Platform validation
    if (!template.platforms.includes('instagram') && !template.platforms.includes('facebook')) {
      errors.push('Stories ads must support Instagram or Facebook');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get feature recommendations based on goal
   */
  static getFeatureRecommendations(goal: string): {
    countdownSticker: boolean;
    swipeUpCTA: boolean;
    productTags: boolean;
    pollSticker: boolean;
    questionSticker: boolean;
  } {
    const recommendations: Record<string, any> = {
      urgency: {
        countdownSticker: true,
        swipeUpCTA: true,
        productTags: true,
        pollSticker: false,
        questionSticker: false
      },
      engagement: {
        countdownSticker: false,
        swipeUpCTA: true,
        productTags: false,
        pollSticker: true,
        questionSticker: true
      },
      sales: {
        countdownSticker: true,
        swipeUpCTA: true,
        productTags: true,
        pollSticker: false,
        questionSticker: false
      },
      awareness: {
        countdownSticker: false,
        swipeUpCTA: true,
        productTags: false,
        pollSticker: true,
        questionSticker: false
      }
    };

    return recommendations[goal] || recommendations.awareness;
  }

  /**
   * Generate Stories ad copy suggestions
   */
  static generateCopySuggestions(
    type: StoriesAdType,
    businessName: string,
    offer?: string
  ): {
    headline: string;
    subheadline: string;
    cta: string;
  }[] {
    const suggestions: Record<StoriesAdType, any[]> = {
      flash_sale: [
        {
          headline: '⚡ 24 HOUR FLASH SALE',
          subheadline: offer || 'Up to 50% off',
          cta: 'Shop Now →'
        },
        {
          headline: 'ENDS TONIGHT',
          subheadline: `Don't miss out on ${offer || 'our biggest sale'}`,
          cta: 'Swipe Up'
        },
        {
          headline: 'HURRY!',
          subheadline: `${offer || 'Limited time only'} at ${businessName}`,
          cta: 'Claim Now →'
        }
      ],
      product_launch: [
        {
          headline: '✨ NEW ARRIVAL',
          subheadline: 'Now available',
          cta: 'Shop New →'
        },
        {
          headline: 'JUST DROPPED',
          subheadline: `${businessName}'s latest collection`,
          cta: 'See It First'
        },
        {
          headline: 'FINALLY HERE',
          subheadline: 'What you\'ve been waiting for',
          cta: 'Explore →'
        }
      ],
      event_promotion: [
        {
          headline: 'YOU\'RE INVITED',
          subheadline: offer || 'Join us for a special event',
          cta: 'RSVP Now →'
        },
        {
          headline: 'SAVE THE DATE',
          subheadline: `${businessName} ${offer || 'special event'}`,
          cta: 'Learn More'
        },
        {
          headline: 'DON\'T MISS IT',
          subheadline: 'Limited spots available',
          cta: 'Reserve Spot →'
        }
      ],
      limited_offer: [
        {
          headline: 'WHILE SUPPLIES LAST',
          subheadline: offer || 'Only 10 left',
          cta: 'Get Yours →'
        },
        {
          headline: 'EXCLUSIVE OFFER',
          subheadline: `For ${businessName} followers only`,
          cta: 'Claim Now'
        },
        {
          headline: 'ALMOST GONE',
          subheadline: offer || 'Don\'t wait',
          cta: 'Shop Before It\'s Gone'
        }
      ]
    };

    return suggestions[type] || suggestions.flash_sale;
  }

  /**
   * Get CPM optimization tips
   */
  static getCPMOptimizationTips(): string[] {
    return [
      'Keep duration under 10 seconds for better completion rates',
      'Use countdown stickers to create urgency (lower CPM)',
      'Add product tags for direct shopping (increases conversions)',
      'Test multiple variations to find lowest CPM',
      'Use vertical 9:16 format (horizontal crops poorly)',
      'Add captions - 85% watch without sound',
      'Use bright colors and bold text for thumb-stopping',
      'Start with your hook in first 2 seconds',
      'Schedule during peak engagement times (lower CPM)',
      'Target warm audiences first (Instagram/Facebook retargeting)'
    ];
  }

  /**
   * Calculate estimated reach for budget
   */
  static estimateReach(budgetUSD: number, targetCPM?: number): {
    minReach: number;
    maxReach: number;
    averageReach: number;
  } {
    const minCPM = targetCPM || 0.50;
    const maxCPM = targetCPM || 2.00;
    const avgCPM = (minCPM + maxCPM) / 2;

    return {
      minReach: Math.floor((budgetUSD / maxCPM) * 1000),
      maxReach: Math.floor((budgetUSD / minCPM) * 1000),
      averageReach: Math.floor((budgetUSD / avgCPM) * 1000)
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate countdown text for Stories
 */
export function generateCountdownText(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} left`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
}

/**
 * Format price for Stories display
 */
export function formatStoriesPrice(price: number, comparePrice?: number): string {
  const formatted = `$${price.toFixed(2)}`;

  if (comparePrice && comparePrice > price) {
    const savings = comparePrice - price;
    const percentOff = Math.round((savings / comparePrice) * 100);
    return `${formatted} (${percentOff}% OFF)`;
  }

  return formatted;
}

/**
 * Validate Stories ad text length
 */
export function validateStoriesText(text: string): {
  valid: boolean;
  length: number;
  maxLength: number;
  recommendation?: string;
} {
  const maxLength = 80; // Optimal for mobile readability

  return {
    valid: text.length <= maxLength,
    length: text.length,
    maxLength,
    recommendation: text.length > maxLength
      ? 'Shorten text for better mobile readability'
      : undefined
  };
}
