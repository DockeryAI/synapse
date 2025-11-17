/**
 * Campaign Template Configurations
 *
 * Defines Bannerbear templates for each campaign type
 * Template IDs are placeholders - update after creating in Bannerbear dashboard
 */

import type { CampaignTemplateConfig } from '@/types/campaign-visual.types';
import type { CampaignTypeId } from '@/types/campaign.types';

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

/**
 * Authority Builder Template
 * Professional, data-focused design emphasizing expertise
 */
export const AUTHORITY_BUILDER_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'authority_builder',
  templateId: 'TEMPLATE_AUTHORITY_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Authority Builder - Professional',
  description: 'Clean, professional design with emphasis on data and expertise. Features bold headline, supporting stats, and trust elements.',

  fieldMappings: {
    headline: 'headline',
    subheadline: 'subheadline',
    stat: 'key_stat',
    bodyText: 'supporting_text',
    logoUrl: 'logo',
    brandColor: 'primary_color'
  },

  defaults: {
    subheadline: 'Industry Insights',
    supporting_text: 'Expert analysis backed by data'
  },

  style: {
    colorScheme: 'professional',
    layout: 'centered',
    typography: 'bold'
  }
};

/**
 * Trust Builder Template
 * Testimonial-focused design highlighting customer success and transformations
 */
export const TRUST_BUILDER_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'trust_builder',
  templateId: 'TEMPLATE_TRUST_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Trust Builder - Testimonial',
  description: 'Warm, trustworthy design featuring customer testimonials and ratings. Emphasizes real results and satisfaction.',

  fieldMappings: {
    headline: 'headline',
    testimonial: 'testimonial_text',
    customerName: 'customer_name',
    bodyText: 'result_text',
    logoUrl: 'logo',
    brandColor: 'primary_color'
  },

  defaults: {
    testimonial_text: 'Exceptional service and results!',
    customer_name: 'Verified Customer'
  },

  style: {
    colorScheme: 'warm',
    layout: 'split',
    typography: 'elegant'
  }
};

/**
 * Community Champion Template
 * Location-focused design emphasizing local relevance and community connection
 */
export const COMMUNITY_CHAMPION_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'community_champion',
  templateId: 'TEMPLATE_COMMUNITY_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Community Champion - Local',
  description: 'Vibrant, community-focused design highlighting local events and timing. Features location emphasis and timely messaging.',

  fieldMappings: {
    headline: 'headline',
    subheadline: 'subheadline',
    location: 'location_text',
    date: 'date_text',
    bodyText: 'event_description',
    logoUrl: 'logo',
    brandColor: 'primary_color'
  },

  defaults: {
    location_text: 'Your Local Community',
    date_text: 'This Week'
  },

  style: {
    colorScheme: 'vibrant',
    layout: 'overlay',
    typography: 'modern'
  }
};

/**
 * Revenue Rush Template
 * Social commerce design for immediate sales and shoppable posts
 */
export const REVENUE_RUSH_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'revenue_rush',
  templateId: 'TEMPLATE_REVENUE_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Revenue Rush - Commerce',
  description: 'Bold, urgency-driven design for social commerce. Features product focus, pricing, and clear CTAs for immediate sales.',

  fieldMappings: {
    headline: 'headline',
    price: 'price_text',
    offer: 'offer_text',
    bodyText: 'product_description',
    logoUrl: 'logo',
    brandColor: 'primary_color'
  },

  defaults: {
    offer_text: 'Limited Time Offer',
    product_description: 'Shop now and save'
  },

  style: {
    colorScheme: 'bold',
    layout: 'product-focused',
    typography: 'impactful'
  }
};

/**
 * Viral Spark Template
 * Video-first, trending content design for massive reach
 */
export const VIRAL_SPARK_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'viral_spark',
  templateId: 'TEMPLATE_VIRAL_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Viral Spark - Trending',
  description: 'Dynamic, attention-grabbing design for video-first content. Features bold text overlays and trending aesthetics.',

  fieldMappings: {
    headline: 'headline',
    trendingText: 'trending_text',
    bodyText: 'hook_text',
    logoUrl: 'logo',
    brandColor: 'primary_color'
  },

  defaults: {
    trending_text: 'POV:',
    hook_text: 'Watch till the end'
  },

  style: {
    colorScheme: 'dynamic',
    layout: 'vertical-video',
    typography: 'bold'
  }
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Complete registry of all campaign templates
 */
export const CAMPAIGN_TEMPLATES: Record<CampaignTypeId, CampaignTemplateConfig> = {
  authority_builder: AUTHORITY_BUILDER_TEMPLATE,
  trust_builder: TRUST_BUILDER_TEMPLATE,
  community_champion: COMMUNITY_CHAMPION_TEMPLATE,
  revenue_rush: REVENUE_RUSH_TEMPLATE,
  viral_spark: VIRAL_SPARK_TEMPLATE
};

/**
 * Get template config for a campaign type
 */
export function getTemplateForCampaignType(campaignType: CampaignTypeId): CampaignTemplateConfig {
  return CAMPAIGN_TEMPLATES[campaignType];
}

/**
 * Get all template configs
 */
export function getAllTemplates(): CampaignTemplateConfig[] {
  return Object.values(CAMPAIGN_TEMPLATES);
}

// ============================================================================
// TEMPLATE VALIDATION
// ============================================================================

/**
 * Check if a template is properly configured (has real template ID)
 */
export function isTemplateConfigured(campaignType: CampaignTypeId): boolean {
  const template = CAMPAIGN_TEMPLATES[campaignType];
  return !template.templateId.startsWith('TEMPLATE_'); // Real IDs don't start with TEMPLATE_
}

/**
 * Get list of unconfigured templates (need Bannerbear dashboard setup)
 */
export function getUnconfiguredTemplates(): CampaignTypeId[] {
  return Object.keys(CAMPAIGN_TEMPLATES).filter(
    type => !isTemplateConfigured(type as CampaignTypeId)
  ) as CampaignTypeId[];
}
