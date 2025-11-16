/**
 * Campaign Type Definitions
 * 
 * Defines the three core campaign types for Synapse:
 * - Authority Builder: Positions business as industry expert
 * - Social Proof: Leverages customer reviews and testimonials
 * - Local Pulse: Capitalizes on local events and timing
 */

export type CampaignTypeId = 'authority_builder' | 'social_proof' | 'local_pulse';

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
 * Campaign Type Registry
 * Complete definitions for all three campaign types
 */
export const CAMPAIGN_TYPES: Record<CampaignTypeId, CampaignTypeMetadata> = {
  authority_builder: {
    id: 'authority_builder',
    name: 'Authority Builder',
    description: 'Position your business as the go-to expert in your industry through thought leadership content',
    icon: 'GraduationCap',
    idealFor: [
      'Businesses with deep industry expertise',
      'Service providers and consultants',
      'B2B companies',
      'Professional services',
      'Technical or specialized fields'
    ],
    platforms: ['LinkedIn', 'X (Twitter)', 'Blog', 'Email'],
    contentFormats: [
      'Industry insights and trends',
      'Expert analysis and commentary',
      'How-to guides and tutorials',
      'Case studies',
      'Research-backed content'
    ],
    exampleOutputs: [
      '"5 Industry Trends Every [Industry] Should Watch in 2024"',
      '"Why Most [Industry] Companies Get [Problem] Wrong (And How to Fix It)"',
      '"The Data-Driven Approach to [Service]: Our 10-Year Study Results"'
    ],
    dataSources: [
      'Industry trends (SEMrush)',
      'Competitive intelligence',
      'News & publications',
      'Search trends (Serper)',
      'Website expertise analysis'
    ],
    color: 'blue'
  },
  
  social_proof: {
    id: 'social_proof',
    name: 'Social Proof',
    description: 'Leverage customer success stories, reviews, and testimonials to build trust and credibility',
    icon: 'Award',
    idealFor: [
      'Businesses with strong customer reviews',
      'Service-based companies',
      'Local businesses',
      'Companies with case studies',
      'High customer satisfaction scores'
    ],
    platforms: ['Facebook', 'Instagram', 'Google Business', 'TikTok'],
    contentFormats: [
      'Customer testimonial features',
      'Before/after success stories',
      'Review highlights',
      'User-generated content',
      'Achievement announcements'
    ],
    exampleOutputs: [
      '"How [Customer Name] Achieved [Result] in Just [Timeframe]"',
      '"Rated 4.9★ by 500+ Customers: Here\'s What They Say"',
      '"Real Results: [Customer] Saved $X Using Our [Service]"'
    ],
    dataSources: [
      'Google reviews (OutScraper)',
      'Social media mentions',
      'Customer testimonials',
      'Rating data',
      'Success metrics'
    ],
    color: 'green'
  },
  
  local_pulse: {
    id: 'local_pulse',
    name: 'Local Pulse',
    description: 'Capitalize on local events, weather, and timely opportunities to connect with your community',
    icon: 'MapPin',
    idealFor: [
      'Local businesses',
      'Brick-and-mortar stores',
      'Service area businesses',
      'Event-based businesses',
      'Weather-dependent services'
    ],
    platforms: ['Facebook', 'Instagram', 'Google Business', 'Nextdoor'],
    contentFormats: [
      'Event tie-ins',
      'Weather-based offers',
      'Local news commentary',
      'Community involvement',
      'Time-sensitive promotions'
    ],
    exampleOutputs: [
      '"[Weather Event] Coming? Here\'s How We Can Help"',
      '"Supporting [Local Event]: Special Offer for Attendees"',
      '"As Seen at [Local News]: Our Take on [Topic]"'
    ],
    dataSources: [
      'Weather data',
      'Local events (Perplexity)',
      'Local news',
      'Trending topics',
      'Location data'
    ],
    color: 'orange'
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
