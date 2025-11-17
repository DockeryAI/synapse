/**
 * Campaign Type Definitions (V3 - Research-Validated)
 *
 * Defines the five V3 campaign types for Synapse (5-14 days each):
 * - Authority Builder (7 days): Positions business as industry expert
 * - Community Champion (14 days): Local community connection and engagement
 * - Trust Builder (10 days): Leverages customer reviews and testimonials
 * - Revenue Rush (5 days): Social commerce for immediate sales
 * - Viral Spark (7 days): Video-first content for massive reach
 */

export type CampaignTypeId = 'authority_builder' | 'community_champion' | 'trust_builder' | 'revenue_rush' | 'viral_spark';

/**
 * Campaign Type Metadata
 */
export interface CampaignTypeMetadata {
  id: CampaignTypeId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  idealFor: string[];
  platforms: string[]; // Best platforms for this type
  contentFormats: string[]; // Types of content this generates
  exampleOutputs: string[];
  dataSources: string[]; // Which intelligence sources are used
  color: string; // Tailwind color class
}

/**
 * Campaign Type with Recommendation Context
 */
export interface CampaignType extends CampaignTypeMetadata {
  recommended?: boolean;
  recommendationReason?: string;
  confidenceScore?: number; // 0-1
}

/**
 * Campaign Type Registry (V3)
 * Complete definitions for all five V3 campaign types
 */
export const CAMPAIGN_TYPES: Record<CampaignTypeId, CampaignTypeMetadata> = {
  authority_builder: {
    id: 'authority_builder',
    name: 'Authority Builder',
    description: '7 days to visible expert - thought leadership content positioning you as the go-to industry authority',
    icon: 'GraduationCap',
    idealFor: [
      'B2B businesses and professional services',
      'Consultants and service providers',
      'Businesses with deep industry expertise',
      'Technical or specialized fields'
    ],
    platforms: ['LinkedIn', 'Facebook'],
    contentFormats: [
      'Video tutorials (15-60 seconds)',
      'Industry insights and trends',
      'How-to guides',
      'Behind-the-scenes expertise',
      'Quick tips and tutorials'
    ],
    exampleOutputs: [
      '"5 Industry Trends Every [Industry] Should Watch"',
      '"Why Most Companies Get [Problem] Wrong (And How to Fix It)"',
      '"Quick Tutorial: How to [Solve Problem] in 60 Seconds"'
    ],
    dataSources: [
      'YouTube content analysis',
      'Industry trends',
      'Website expertise',
      'Review insights'
    ],
    color: 'blue'
  },

  community_champion: {
    id: 'community_champion',
    name: 'Community Champion',
    description: 'Local community leader in 14 days - connection, customer stories, and local exclusive offers',
    icon: 'MapPin',
    idealFor: [
      'Local businesses (restaurant, salon, retail)',
      'Brick-and-mortar stores',
      'Service area businesses',
      'Neighborhood businesses'
    ],
    platforms: ['Facebook', 'Instagram', 'Google Business'],
    contentFormats: [
      'Behind-the-scenes videos',
      'Local event coverage',
      'Customer spotlights',
      'Community involvement posts',
      'Local exclusive offers'
    ],
    exampleOutputs: [
      '"Downtown parking problem affecting our neighbors"',
      '"Partnering with [local festival from Perplexity]"',
      '"How we helped Sarah from Main Street save $2000"'
    ],
    dataSources: [
      'Perplexity (local events)',
      'Weather patterns',
      'Local news',
      'Google Reviews'
    ],
    color: 'orange'
  },

  trust_builder: {
    id: 'trust_builder',
    name: 'Trust Builder',
    description: 'Build credibility in 10 days - customer transformation stories and video testimonials',
    icon: 'Award',
    idealFor: [
      'New businesses (< 2 years)',
      'High-consideration purchases',
      'Competitive markets',
      'Service businesses'
    ],
    platforms: ['Facebook', 'Instagram'],
    contentFormats: [
      'Customer video testimonials',
      'Before/after photos',
      'Review highlights',
      'Transformation stories',
      'Social proof amplification'
    ],
    exampleOutputs: [
      '"How [Customer Name] Achieved [Result] in Just [Timeframe]"',
      '"Rated 4.9★ by 500+ Customers: Here\'s What They Say"',
      '"Real Results: [Customer] Saved $X Using Our [Service]"'
    ],
    dataSources: [
      'Google Reviews',
      'Customer testimonials',
      'YouTube comments',
      'Social media mentions'
    ],
    color: 'green'
  },

  revenue_rush: {
    id: 'revenue_rush',
    name: 'Revenue Rush',
    description: 'Drive immediate sales in 5 days - shoppable posts and limited offers with social commerce',
    icon: 'DollarSign',
    idealFor: [
      'E-commerce businesses',
      'Retail stores',
      'Service packages',
      'Seasonal businesses'
    ],
    platforms: ['Instagram Shopping', 'Facebook Shop'],
    contentFormats: [
      'Product videos and demos',
      'Customer unboxings',
      'Shoppable posts/Stories',
      'Limited-time offers',
      'Countdown posts'
    ],
    exampleOutputs: [
      '"Flash Sale: 48 Hours Only - Shop Now"',
      '"Customer Favorite: See Why Everyone Loves This"',
      '"Limited Stock: Only 10 Left - Tag to Purchase"'
    ],
    dataSources: [
      'Product Scanner',
      'Review mining',
      'Seasonal triggers',
      'Competitive pricing'
    ],
    color: 'purple'
  },

  viral_spark: {
    id: 'viral_spark',
    name: 'Viral Spark',
    description: 'Massive reach in 7 days - trending TikTok/Reels content with authenticity over polish',
    icon: 'Sparkles',
    idealFor: [
      'All SMBs seeking visibility',
      'B2C businesses',
      'Local businesses',
      'Personality-driven brands'
    ],
    platforms: ['TikTok', 'Instagram Reels'],
    contentFormats: [
      'Trending challenges',
      'Behind-the-scenes moments',
      'Relatable content',
      'Personality-driven videos',
      'Trending audio participation'
    ],
    exampleOutputs: [
      '"POV: You walk into [Business] and see this"',
      '"Things you didn\'t know about [Industry]"',
      '"Trying the viral [trend] at our [business]"'
    ],
    dataSources: [
      'TikTok/Instagram trending sounds',
      'Viral challenge patterns',
      'YouTube Shorts analytics',
      'Competitor viral content'
    ],
    color: 'pink'
  }
};

/**
 * Get all campaign types as an array
 */
export function getAllCampaignTypes(): CampaignTypeMetadata[] {
  return Object.values(CAMPAIGN_TYPES);
}

/**
 * Get campaign type by ID
 */
export function getCampaignType(id: CampaignTypeId): CampaignTypeMetadata | undefined {
  return CAMPAIGN_TYPES[id];
}
