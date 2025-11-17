/**
 * Video Template Service
 *
 * Manages video templates for different content formats
 * Templates: Behind-the-scenes, Product demo, Testimonial, Tutorial, Trending
 * Duration: 15-60 seconds, Aspect ratio: 9:16 vertical
 */

import type {
  VideoTemplate,
  VideoTemplateType,
  VideoDuration,
  VideoHook,
  VideoBody,
  VideoCTA
} from '@/types/video.types';

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

/**
 * Behind-the-Scenes Template
 * Show authentic, unpolished moments from your business
 */
export const BEHIND_THE_SCENES_TEMPLATE: VideoTemplate = {
  id: 'bts_001',
  type: 'behind_the_scenes',
  name: 'Behind-the-Scenes',
  description: 'Authentic, unpolished moments showing the real side of your business',

  duration: {
    min: 15,
    max: 45,
    optimal: 30
  },

  aspectRatio: '9:16',

  hook: {
    duration: 3,
    strategies: [
      'POV: Opening your business at 6 AM',
      'Things you didn\'t know about [industry]',
      'A day in the life of [role]'
    ],
    examples: [
      'POV: You walk into our kitchen before we open',
      'Here\'s what happens when we close for the day',
      'Watch me prep 100 orders in 30 seconds'
    ]
  },

  body: {
    duration: 24,
    structure: [
      'Show real process (no staging)',
      'Include team members',
      'Reveal something unexpected',
      'Connect to customer value'
    ],
    pacing: 'fast'
  },

  cta: {
    duration: 3,
    types: [
      'Visit us today',
      'Follow for more behind-the-scenes',
      'Tag someone who needs to see this'
    ],
    placement: 'overlay'
  },

  platforms: ['tiktok', 'instagram_reels', 'youtube_shorts', 'facebook_reels'],

  idealFor: [
    'Local businesses (restaurants, salons, retail)',
    'Service businesses showing expertise',
    'Building authenticity and trust',
    'Humanizing your brand'
  ],

  engagementMultiplier: 12 // 12x vs static posts
};

/**
 * Product Demo Template
 * Showcase products in action with clear value proposition
 */
export const PRODUCT_DEMO_TEMPLATE: VideoTemplate = {
  id: 'demo_001',
  type: 'product_demo',
  name: 'Product Demo',
  description: 'Show your product solving a problem in under 30 seconds',

  duration: {
    min: 15,
    max: 30,
    optimal: 25
  },

  aspectRatio: '9:16',

  hook: {
    duration: 3,
    strategies: [
      'Problem statement',
      'Bold claim',
      'Before/after tease'
    ],
    examples: [
      'Tired of [problem]? Watch this',
      'This changed everything for me',
      'You\'ve been doing this wrong'
    ]
  },

  body: {
    duration: 19,
    structure: [
      'Show problem clearly',
      'Introduce product',
      'Demonstrate solution',
      'Show result'
    ],
    pacing: 'fast'
  },

  cta: {
    duration: 3,
    types: [
      'Shop now - link in bio',
      'Save this for later',
      'Tag someone who needs this'
    ],
    placement: 'both'
  },

  platforms: ['instagram_reels', 'tiktok', 'facebook_reels'],

  idealFor: [
    'E-commerce businesses',
    'Physical products',
    'Service packages',
    'Revenue Rush campaigns'
  ],

  engagementMultiplier: 15 // 15x vs static product photos
};

/**
 * Testimonial Template
 * Customer success stories and social proof
 */
export const TESTIMONIAL_TEMPLATE: VideoTemplate = {
  id: 'test_001',
  type: 'testimonial',
  name: 'Testimonial',
  description: 'Real customer results build trust and credibility',

  duration: {
    min: 20,
    max: 45,
    optimal: 35
  },

  aspectRatio: '9:16',

  hook: {
    duration: 3,
    strategies: [
      'Customer transformation tease',
      'Bold result statement',
      'Relatable problem'
    ],
    examples: [
      'How [Customer] saved $5000',
      'From struggling to thriving in 30 days',
      'I was skeptical until this happened'
    ]
  },

  body: {
    duration: 36,
    structure: [
      'Customer introduction (brief)',
      'What was their problem?',
      'How you helped',
      'What was the result?',
      'Customer quote or reaction'
    ],
    pacing: 'medium'
  },

  cta: {
    duration: 3,
    types: [
      'Get the same results - link in bio',
      'See more customer stories',
      'Ready to transform? Book now'
    ],
    placement: 'end_screen'
  },

  platforms: ['facebook_reels', 'instagram_reels', 'youtube_shorts'],

  idealFor: [
    'Service businesses',
    'High-consideration purchases',
    'Trust Builder campaigns',
    'Overcoming skepticism'
  ],

  engagementMultiplier: 18 // 18x - social proof is powerful
};

/**
 * Tutorial Template
 * Educational content positioning you as expert
 */
export const TUTORIAL_TEMPLATE: VideoTemplate = {
  id: 'tut_001',
  type: 'tutorial',
  name: 'Tutorial',
  description: 'Quick how-to content showcasing your expertise',

  duration: {
    min: 30,
    max: 60,
    optimal: 45
  },

  aspectRatio: '9:16',

  hook: {
    duration: 3,
    strategies: [
      'Problem everyone has',
      'Counterintuitive statement',
      'Result promise'
    ],
    examples: [
      'Here\'s the right way to [task]',
      'Stop doing [common mistake]',
      'Learn [skill] in 60 seconds'
    ]
  },

  body: {
    duration: 51,
    structure: [
      'Step 1 (10 seconds)',
      'Step 2 (10 seconds)',
      'Step 3 (10 seconds)',
      'Pro tip or common mistake to avoid (8 seconds)',
      'Final result (8 seconds)'
    ],
    pacing: 'medium'
  },

  cta: {
    duration: 3,
    types: [
      'Save this for later',
      'Follow for more tips',
      'Want more help? Link in bio'
    ],
    placement: 'overlay'
  },

  platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'],

  idealFor: [
    'Authority Builder campaigns',
    'B2B and professional services',
    'Building expertise and credibility',
    'Educational content'
  ],

  engagementMultiplier: 14 // 14x - educational content performs well
};

/**
 * Trending Template
 * Viral-style content using trending formats and audio
 */
export const TRENDING_TEMPLATE: VideoTemplate = {
  id: 'trend_001',
  type: 'trending',
  name: 'Trending',
  description: 'Jump on trending sounds, challenges, and formats for maximum reach',

  duration: {
    min: 15,
    max: 30,
    optimal: 20
  },

  aspectRatio: '9:16',

  hook: {
    duration: 2,
    strategies: [
      'Use trending text overlay',
      'Start with trending audio beat drop',
      'Jump cut or visual surprise'
    ],
    examples: [
      'POV: [relatable situation]',
      'Tell me you\'re a [industry] without telling me',
      'Trying the viral [trend] at our business'
    ]
  },

  body: {
    duration: 15,
    structure: [
      'Follow trending format exactly',
      'Adapt to your business context',
      'Keep it authentic (don\'t force it)',
      'Move fast - match audio beat'
    ],
    pacing: 'fast'
  },

  cta: {
    duration: 3,
    types: [
      'Use trending CTA format',
      'Duet this',
      'Your turn - tag us'
    ],
    placement: 'overlay'
  },

  platforms: ['tiktok', 'instagram_reels'],

  idealFor: [
    'Viral Spark campaigns',
    'Maximum reach and visibility',
    'Brand awareness',
    'All SMBs seeking eyeballs'
  ],

  engagementMultiplier: 25 // 25x - trending content gets massive reach
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Complete registry of all video templates
 */
export const VIDEO_TEMPLATES: Record<VideoTemplateType, VideoTemplate> = {
  behind_the_scenes: BEHIND_THE_SCENES_TEMPLATE,
  product_demo: PRODUCT_DEMO_TEMPLATE,
  testimonial: TESTIMONIAL_TEMPLATE,
  tutorial: TUTORIAL_TEMPLATE,
  trending: TRENDING_TEMPLATE
};

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

/**
 * Video Template Service
 */
export class VideoTemplateService {
  /**
   * Get all video templates
   */
  static getAllTemplates(): VideoTemplate[] {
    return Object.values(VIDEO_TEMPLATES);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): VideoTemplate | undefined {
    return this.getAllTemplates().find(template => template.id === id);
  }

  /**
   * Get template by type
   */
  static getTemplateByType(type: VideoTemplateType): VideoTemplate {
    return VIDEO_TEMPLATES[type];
  }

  /**
   * Get templates by platform
   */
  static getTemplatesByPlatform(platform: string): VideoTemplate[] {
    return this.getAllTemplates().filter(template =>
      template.platforms.includes(platform as any)
    );
  }

  /**
   * Get templates by campaign type (V3)
   */
  static getTemplatesByCampaignType(campaignTypeId: string): VideoTemplate[] {
    const campaignTemplateMap: Record<string, VideoTemplateType[]> = {
      authority_builder: ['tutorial', 'behind_the_scenes'],
      community_champion: ['behind_the_scenes', 'testimonial'],
      trust_builder: ['testimonial', 'behind_the_scenes'],
      revenue_rush: ['product_demo', 'trending'],
      viral_spark: ['trending', 'behind_the_scenes']
    };

    const templateTypes = campaignTemplateMap[campaignTypeId] || [];
    return templateTypes.map(type => VIDEO_TEMPLATES[type]);
  }

  /**
   * Suggest best template for campaign type
   */
  static suggestTemplate(campaignTypeId: string): VideoTemplate {
    const templates = this.getTemplatesByCampaignType(campaignTypeId);

    // Return first template (primary recommendation)
    return templates[0] || BEHIND_THE_SCENES_TEMPLATE;
  }

  /**
   * Get templates sorted by engagement multiplier
   */
  static getTemplatesByEngagement(): VideoTemplate[] {
    return this.getAllTemplates().sort(
      (a, b) => b.engagementMultiplier - a.engagementMultiplier
    );
  }

  /**
   * Validate template configuration
   */
  static validateTemplate(template: VideoTemplate): boolean {
    // Duration validation
    if (template.duration.min < 10 || template.duration.max > 90) {
      return false;
    }

    // Aspect ratio validation
    if (template.aspectRatio !== '9:16') {
      return false;
    }

    // Hook timing validation (should be 2-3 seconds)
    if (template.hook.duration < 2 || template.hook.duration > 4) {
      return false;
    }

    // Platform validation
    if (template.platforms.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Get template recommendations with reasons
   */
  static getRecommendations(campaignTypeId: string) {
    const templates = this.getTemplatesByCampaignType(campaignTypeId);

    return templates.map(template => ({
      template,
      reason: this.getRecommendationReason(campaignTypeId, template.type),
      engagementBoost: `${template.engagementMultiplier}x vs static posts`
    }));
  }

  /**
   * Get recommendation reason
   */
  private static getRecommendationReason(
    campaignTypeId: string,
    templateType: VideoTemplateType
  ): string {
    const reasons: Record<string, Record<VideoTemplateType, string>> = {
      authority_builder: {
        tutorial: 'Educational content positions you as the industry expert',
        behind_the_scenes: 'Show your expertise in action',
        product_demo: 'Demonstrate your deep product knowledge',
        testimonial: 'Customer success validates your authority',
        trending: 'Reach more potential clients'
      },
      community_champion: {
        behind_the_scenes: 'Show the real people behind your local business',
        testimonial: 'Local customers sharing their experiences',
        product_demo: 'Showcase what makes you special locally',
        tutorial: 'Help your community with useful tips',
        trending: 'Join local conversations and trends'
      },
      trust_builder: {
        testimonial: 'Real customer results build immediate credibility',
        behind_the_scenes: 'Transparency builds trust',
        product_demo: 'Show exactly what customers get',
        tutorial: 'Prove your expertise through teaching',
        trending: 'Social proof through popularity'
      },
      revenue_rush: {
        product_demo: 'Show your product solving problems = immediate sales',
        trending: 'Viral reach drives traffic to your shop',
        testimonial: 'Social proof removes purchase hesitation',
        behind_the_scenes: 'Show product quality and care',
        tutorial: 'Teach how to use your product'
      },
      viral_spark: {
        trending: 'Designed for maximum reach and shares',
        behind_the_scenes: 'Authentic content resonates and spreads',
        product_demo: 'Compelling demos get shared',
        testimonial: 'Emotional stories go viral',
        tutorial: 'Valuable content gets saved and shared'
      }
    };

    return reasons[campaignTypeId]?.[templateType] || 'Great fit for your campaign';
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate optimal video duration based on platform and template
 */
export function getOptimalDuration(
  template: VideoTemplate,
  platform: string
): number {
  // Platform-specific adjustments
  const platformAdjustments: Record<string, number> = {
    tiktok: 1.0, // TikTok optimal duration
    instagram_reels: 0.9, // Instagram slightly shorter
    youtube_shorts: 1.1, // YouTube can be longer
    facebook_reels: 0.8 // Facebook shorter attention span
  };

  const adjustment = platformAdjustments[platform] || 1.0;
  return Math.round(template.duration.optimal * adjustment);
}

/**
 * Generate hook suggestions based on business context
 */
export function generateHookSuggestions(
  template: VideoTemplate,
  businessName: string,
  industry: string
): string[] {
  return template.hook.examples.map(example =>
    example
      .replace('[business]', businessName)
      .replace('[industry]', industry)
      .replace('[role]', `${industry} owner`)
  );
}
