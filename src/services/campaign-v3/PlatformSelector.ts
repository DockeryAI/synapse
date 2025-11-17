/**
 * Platform Selector
 *
 * Enforces 2-3 platform maximum and provides smart recommendations
 * based on business type, campaign type, and available integrations.
 *
 * Because trying to post to 7 different platforms is a recipe for burnout.
 */

import type {
  PlatformV3,
  PlatformOption,
  BusinessType,
  CampaignTypeV3,
  PlatformRecommendation,
  PlatformSelection,
} from '../../types/campaign-v3.types';

export class PlatformSelector {
  // Platform definitions with metadata
  private static readonly PLATFORMS: Record<PlatformV3, PlatformOption> = {
    facebook: {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      description: '84% of SMBs use Facebook - best for local businesses',
      bestFor: ['local-service', 'restaurant', 'retail', 'b2b'],
      requirements: ['Facebook Business Page'],
    },

    instagram: {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      description: 'Visual storytelling and shopping - ideal for products',
      bestFor: ['retail', 'ecommerce', 'restaurant', 'creator'],
      requirements: ['Instagram Business Account'],
    },

    linkedin: {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'B2B and professional services - decision makers',
      bestFor: ['b2b', 'professional-service'],
      requirements: ['LinkedIn Company Page'],
    },

    twitter: {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: '𝕏',
      description: 'Real-time engagement and thought leadership',
      bestFor: ['b2b', 'creator', 'professional-service'],
      requirements: ['Twitter Business Account'],
    },

    tiktok: {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      description: 'Short-form video for massive reach and virality',
      bestFor: ['creator', 'restaurant', 'retail', 'ecommerce'],
      requirements: ['TikTok Business Account'],
    },

    'youtube-shorts': {
      id: 'youtube-shorts',
      name: 'YouTube Shorts',
      icon: '▶️',
      description: 'Short videos with long-term discoverability',
      bestFor: ['creator', 'professional-service', 'local-service'],
      requirements: ['YouTube Channel'],
    },

    'google-business': {
      id: 'google-business',
      name: 'Google Business',
      icon: '🗺️',
      description: 'Local SEO and Google Maps visibility',
      bestFor: ['local-service', 'restaurant', 'retail'],
      requirements: ['Google Business Profile (verified)'],
    },
  };

  /**
   * Maximum platforms allowed
   */
  static readonly MAX_PLATFORMS = 3;
  static readonly MIN_PLATFORMS = 2;

  /**
   * Get all available platforms
   */
  static getAllPlatforms(): PlatformOption[] {
    return Object.values(this.PLATFORMS);
  }

  /**
   * Get platform by ID
   */
  static getPlatform(id: PlatformV3): PlatformOption | undefined {
    return this.PLATFORMS[id];
  }

  /**
   * Get recommended platforms for business type and campaign
   */
  static getRecommendations(
    businessType: BusinessType,
    campaignType: CampaignTypeV3
  ): PlatformRecommendation {
    // Define platform combinations by business type
    const businessTypePlatforms: Record<BusinessType, PlatformV3[]> = {
      'local-service': ['facebook', 'google-business', 'instagram'],
      'restaurant': ['facebook', 'instagram', 'google-business'],
      'retail': ['facebook', 'instagram', 'tiktok'],
      'ecommerce': ['instagram', 'facebook', 'tiktok'],
      'professional-service': ['linkedin', 'facebook', 'youtube-shorts'],
      'b2b': ['linkedin', 'facebook', 'twitter'],
      'creator': ['tiktok', 'instagram', 'youtube-shorts'],
      'other': ['facebook', 'instagram', 'linkedin'],
    };

    // Campaign-specific platform preferences
    const campaignPlatforms: Record<CampaignTypeV3, PlatformV3[]> = {
      'authority-builder': ['linkedin', 'facebook', 'youtube-shorts'],
      'community-champion': ['facebook', 'instagram', 'google-business'],
      'trust-builder': ['facebook', 'instagram', 'linkedin'],
      'revenue-rush': ['instagram', 'facebook', 'tiktok'],
      'viral-spark': ['tiktok', 'instagram', 'youtube-shorts'],
    };

    // Get business type platforms
    const businessPlatforms = businessTypePlatforms[businessType];

    // Get campaign platforms
    const campaignPreferred = campaignPlatforms[campaignType];

    // Find intersection and prioritize
    const recommended = this.prioritizePlatforms(
      businessPlatforms,
      campaignPreferred
    );

    // Generate rationale
    const rationale = this.generateRationale(businessType, campaignType, recommended);

    return {
      businessType,
      campaignType,
      recommended: recommended.slice(0, 3), // Top 3
      rationale,
      maxPlatforms: 3,
    };
  }

  /**
   * Prioritize platforms based on business and campaign alignment
   */
  private static prioritizePlatforms(
    businessPlatforms: PlatformV3[],
    campaignPlatforms: PlatformV3[]
  ): PlatformV3[] {
    // Platforms in both lists get highest priority
    const intersection = businessPlatforms.filter(p => campaignPlatforms.includes(p));

    // Then business platforms not in campaign
    const businessOnly = businessPlatforms.filter(p => !campaignPlatforms.includes(p));

    // Then campaign platforms not in business
    const campaignOnly = campaignPlatforms.filter(p => !businessPlatforms.includes(p));

    return [...intersection, ...businessOnly, ...campaignOnly];
  }

  /**
   * Generate human-readable rationale
   */
  private static generateRationale(
    businessType: BusinessType,
    campaignType: CampaignTypeV3,
    platforms: PlatformV3[]
  ): string {
    const businessLabels: Record<BusinessType, string> = {
      'local-service': 'local service businesses',
      'restaurant': 'restaurants',
      'retail': 'retail stores',
      'ecommerce': 'e-commerce businesses',
      'professional-service': 'professional services',
      'b2b': 'B2B companies',
      'creator': 'content creators',
      'other': 'businesses like yours',
    };

    const campaignLabels: Record<CampaignTypeV3, string> = {
      'authority-builder': 'building authority',
      'community-champion': 'local community engagement',
      'trust-builder': 'building trust',
      'revenue-rush': 'driving sales',
      'viral-spark': 'maximizing reach',
    };

    const platformNames = platforms
      .slice(0, 3)
      .map(p => this.PLATFORMS[p].name)
      .join(', ');

    return `Best for ${businessLabels[businessType]} focused on ${campaignLabels[campaignType]}. ${platformNames} will give you the highest engagement and conversions.`;
  }

  /**
   * Validate platform selection
   */
  static validateSelection(platforms: PlatformV3[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum
    if (platforms.length < this.MIN_PLATFORMS) {
      errors.push(`Select at least ${this.MIN_PLATFORMS} platforms`);
    }

    // Check maximum (HARD LIMIT)
    if (platforms.length > this.MAX_PLATFORMS) {
      errors.push(`Maximum ${this.MAX_PLATFORMS} platforms allowed. Quality over quantity!`);
    }

    // Check for duplicates
    const unique = new Set(platforms);
    if (unique.size !== platforms.length) {
      errors.push('Duplicate platforms selected');
    }

    // Check platform compatibility
    const incompatibleCombos = this.checkIncompatibleCombos(platforms);
    if (incompatibleCombos.length > 0) {
      warnings.push(...incompatibleCombos);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check for incompatible platform combinations
   */
  private static checkIncompatibleCombos(platforms: PlatformV3[]): string[] {
    const warnings: string[] = [];

    // TikTok + LinkedIn is an odd combo
    if (platforms.includes('tiktok') && platforms.includes('linkedin')) {
      warnings.push('TikTok and LinkedIn have very different audiences. Consider focusing on one.');
    }

    // Twitter + TikTok requires different content strategies
    if (platforms.includes('twitter') && platforms.includes('tiktok')) {
      warnings.push('Twitter and TikTok require very different content styles.');
    }

    // GMB should always be paired with Facebook or Instagram for local
    if (
      platforms.includes('google-business') &&
      !platforms.includes('facebook') &&
      !platforms.includes('instagram')
    ) {
      warnings.push('Google Business works best when paired with Facebook or Instagram.');
    }

    return warnings;
  }

  /**
   * Create platform selection with primary platform
   */
  static createSelection(
    platforms: PlatformV3[],
    primaryPlatform?: PlatformV3
  ): PlatformSelection {
    // Validate first
    const validation = this.validateSelection(platforms);
    if (!validation.valid) {
      throw new Error(`Invalid platform selection: ${validation.errors.join(', ')}`);
    }

    // Determine primary platform
    let primary = primaryPlatform;
    if (!primary || !platforms.includes(primary)) {
      // Default to first platform
      primary = platforms[0];
    }

    return {
      platforms,
      primary,
    };
  }

  /**
   * Get platform-specific requirements
   */
  static getPlatformRequirements(platforms: PlatformV3[]): string[] {
    const requirements = new Set<string>();

    platforms.forEach(platformId => {
      const platform = this.PLATFORMS[platformId];
      if (platform.requirements) {
        platform.requirements.forEach(req => requirements.add(req));
      }
    });

    return Array.from(requirements);
  }

  /**
   * Check if platforms support shopping features
   */
  static getShoppingPlatforms(platforms: PlatformV3[]): {
    shopping: PlatformV3[];
    nonShopping: PlatformV3[];
  } {
    const shoppingPlatforms: PlatformV3[] = ['instagram', 'facebook', 'tiktok'];

    return {
      shopping: platforms.filter(p => shoppingPlatforms.includes(p)),
      nonShopping: platforms.filter(p => !shoppingPlatforms.includes(p)),
    };
  }

  /**
   * Get video-first platforms
   */
  static getVideoFirstPlatforms(platforms: PlatformV3[]): PlatformV3[] {
    const videoFirst: PlatformV3[] = ['tiktok', 'youtube-shorts', 'instagram'];
    return platforms.filter(p => videoFirst.includes(p));
  }

  /**
   * Get estimated reach per platform
   */
  static getEstimatedReach(platforms: PlatformV3[]): Record<PlatformV3, number> {
    // Base reach estimates (very rough averages for SMB)
    const baseReach: Record<PlatformV3, number> = {
      facebook: 1000,
      instagram: 800,
      linkedin: 500,
      twitter: 400,
      tiktok: 2000, // Viral potential
      'youtube-shorts': 1500,
      'google-business': 600,
    };

    const reach: Partial<Record<PlatformV3, number>> = {};
    platforms.forEach(platform => {
      reach[platform] = baseReach[platform];
    });

    return reach as Record<PlatformV3, number>;
  }

  /**
   * Sort platforms by priority for a campaign type
   */
  static sortByPriority(
    platforms: PlatformV3[],
    campaignType: CampaignTypeV3
  ): PlatformV3[] {
    // Priority by campaign type
    const priority: Record<CampaignTypeV3, Record<PlatformV3, number>> = {
      'authority-builder': {
        linkedin: 1,
        facebook: 2,
        'youtube-shorts': 3,
        instagram: 4,
        twitter: 5,
        tiktok: 6,
        'google-business': 7,
      },
      'community-champion': {
        facebook: 1,
        'google-business': 2,
        instagram: 3,
        'youtube-shorts': 4,
        tiktok: 5,
        linkedin: 6,
        twitter: 7,
      },
      'trust-builder': {
        facebook: 1,
        instagram: 2,
        linkedin: 3,
        'google-business': 4,
        'youtube-shorts': 5,
        twitter: 6,
        tiktok: 7,
      },
      'revenue-rush': {
        instagram: 1,
        facebook: 2,
        tiktok: 3,
        'google-business': 4,
        'youtube-shorts': 5,
        linkedin: 6,
        twitter: 7,
      },
      'viral-spark': {
        tiktok: 1,
        instagram: 2,
        'youtube-shorts': 3,
        facebook: 4,
        twitter: 5,
        linkedin: 6,
        'google-business': 7,
      },
    };

    const campaignPriority = priority[campaignType];

    return [...platforms].sort((a, b) => {
      const aPriority = campaignPriority[a] || 999;
      const bPriority = campaignPriority[b] || 999;
      return aPriority - bPriority;
    });
  }

  /**
   * Get platform icon
   */
  static getPlatformIcon(platform: PlatformV3): string {
    return this.PLATFORMS[platform].icon;
  }

  /**
   * Get platform color (for UI)
   */
  static getPlatformColor(platform: PlatformV3): string {
    const colors: Record<PlatformV3, string> = {
      facebook: '#1877F2',
      instagram: '#E4405F',
      linkedin: '#0A66C2',
      twitter: '#000000',
      tiktok: '#000000',
      'youtube-shorts': '#FF0000',
      'google-business': '#4285F4',
    };
    return colors[platform];
  }
}

export default PlatformSelector;
