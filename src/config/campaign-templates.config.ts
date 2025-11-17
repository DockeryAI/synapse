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
 * Social Proof Template
 * Testimonial-focused design highlighting customer success
 */
export const SOCIAL_PROOF_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'social_proof',
  templateId: 'TEMPLATE_SOCIAL_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Social Proof - Testimonial',
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
 * Local Pulse Template
 * Location-focused design emphasizing local relevance
 */
export const LOCAL_PULSE_TEMPLATE: CampaignTemplateConfig = {
  campaignType: 'local_pulse',
  templateId: 'TEMPLATE_LOCAL_001', // Placeholder - set after Bannerbear dashboard creation
  name: 'Local Pulse - Community',
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

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Complete registry of all campaign templates
 */
export const CAMPAIGN_TEMPLATES: Record<CampaignTypeId, CampaignTemplateConfig> = {
  authority_builder: AUTHORITY_BUILDER_TEMPLATE,
  social_proof: SOCIAL_PROOF_TEMPLATE,
  local_pulse: LOCAL_PULSE_TEMPLATE
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
