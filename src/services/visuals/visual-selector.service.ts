/**
 * VISUAL SELECTOR SERVICE
 *
 * Intelligently selects visual templates based on:
 * - Content type and psychology
 * - Brand identity and colors
 * - Platform requirements
 * - Performance history
 *
 * Philosophy: "Smart selection, simple output"
 */

import type { VisualTemplate, VisualSelectionCriteria, VisualTemplateMatch, BrandVisualIdentity } from '../../types/visual.types';
import type { BrandData } from '../../types/content-generation.types';

// Mock data for visual templates (TODO: implement proper template system)
const ALL_VISUAL_TEMPLATES: any[] = [];

function getVisualTemplateById(id: string): any {
  return ALL_VISUAL_TEMPLATES.find(t => t.id === id);
}

function getTemplatesForContentType(contentType: string): any[] {
  return ALL_VISUAL_TEMPLATES;
}

function getTemplatesForPlatform(platform: string): any[] {
  return ALL_VISUAL_TEMPLATES;
}

function getDefaultTemplate(): any {
  return {
    id: 'default',
    name: 'Default Template',
    suitableFor: [],
    platforms: [],
    style: 'professional',
    colorScheme: 'neutral',
    aspectRatio: '1:1',
  };
}

// ============================================================================
// VISUAL SELECTOR SERVICE
// ============================================================================

class VisualSelectorService {
  /**
   * Select best template for content
   * Main entry point - uses smart matching
   */
  selectTemplate(contentType: string, platform: string, brand?: BrandData): VisualTemplate {
    const matches = this.findMatches({
      contentType,
      platform,
    });

    if (matches.length === 0) {
      return getDefaultTemplate();
    }

    // Get best match
    const bestMatch = matches[0];

    // Apply brand customization if available
    if (brand) {
      return this.applyBrandCustomization(bestMatch.template, brand);
    }

    return bestMatch.template;
  }

  /**
   * Find matching templates with scoring
   */
  findMatches(criteria: VisualSelectionCriteria): VisualTemplateMatch[] {
    const { contentType, platform, colorScheme, style, aspectRatio } = criteria;

    // Start with templates suitable for content type
    let candidates = getTemplatesForContentType(contentType);

    // Filter by platform
    if (platform) {
      const platformTemplates = getTemplatesForPlatform(platform);
      candidates = candidates.filter((t) => platformTemplates.includes(t));
    }

    // Filter by aspect ratio if specified
    if (aspectRatio) {
      candidates = candidates.filter((t) => t.aspectRatio === aspectRatio);
    }

    // Score each candidate
    const matches: VisualTemplateMatch[] = candidates.map((template) => {
      let score = 50; // Base score

      // Content type match (already filtered, so bonus)
      score += 20;

      // Platform match
      if (platform && template.platforms.includes(platform)) {
        score += 15;
      }

      // Color scheme match
      if (colorScheme && template.colorScheme === colorScheme) {
        score += 10;
      }

      // Style match
      if (style && template.style === style) {
        score += 10;
      }

      // Performance bonus (if available)
      if (template.avgPerformance && template.avgPerformance > 0.5) {
        score += template.avgPerformance * 10; // Up to 10 points
      }

      // Usage bonus (popular templates)
      if (template.useCount && template.useCount > 10) {
        score += Math.min(5, template.useCount / 10); // Up to 5 points
      }

      return {
        template,
        score: Math.min(100, score),
        reason: this.generateMatchReason(template, criteria),
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Get templates by style
   */
  getTemplatesByStyle(style: string): VisualTemplate[] {
    return ALL_VISUAL_TEMPLATES.filter((t) => t.style === style);
  }

  /**
   * Get templates by color scheme
   */
  getTemplatesByColorScheme(colorScheme: string): VisualTemplate[] {
    return ALL_VISUAL_TEMPLATES.filter((t) => t.colorScheme === colorScheme);
  }

  /**
   * Select template based on psychology
   * Hidden complexity - selects based on emotional triggers
   */
  selectByPsychology(params: {
    contentType: string;
    platform: string;
    primaryEmotion: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    trustLevel: 'low' | 'medium' | 'high';
  }): VisualTemplate {
    const { contentType, platform, primaryEmotion, urgencyLevel, trustLevel } = params;

    const matches = this.findMatches({ contentType, platform });

    // Filter by psychology tags
    const psychologyMatches = matches.filter((match) => {
      const tags = match.template.psychologyTags;
      if (!tags) return true;

      // Match urgency level
      if (urgencyLevel === 'high' && tags.urgencyLevel !== 'high') {
        return false;
      }

      // Match trust level
      if (trustLevel === 'high' && tags.trustLevel !== 'high') {
        return false;
      }

      return true;
    });

    return psychologyMatches[0]?.template || matches[0]?.template || getDefaultTemplate();
  }

  /**
   * Get recommended templates for an industry
   */
  getRecommendedForIndustry(industry: string, contentType: string): VisualTemplate[] {
    // Industry-specific recommendations
    const industryPreferences: Record<string, string[]> = {
      restaurant: ['offer-promo', 'instagram-story', 'bold-announcement'],
      cpa: ['professional-post', 'list-item', 'quote-testimonial'],
      realtor: ['professional-post', 'bold-announcement', 'quote-testimonial'],
      dentist: ['professional-post', 'list-item', 'quote-testimonial'],
      consultant: ['professional-post', 'list-item', 'quote-testimonial'],
    };

    const preferredIds = industryPreferences[industry] || [];
    const preferred = preferredIds
      .map((id) => getVisualTemplateById(id))
      .filter((t): t is VisualTemplate => t !== undefined);

    // Fall back to content type if no industry preference
    if (preferred.length === 0) {
      return getTemplatesForContentType(contentType);
    }

    return preferred;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateMatchReason(template: VisualTemplate, criteria: VisualSelectionCriteria): string {
    const reasons: string[] = [];

    if (template.suitableFor.includes(criteria.contentType)) {
      reasons.push('Perfect for this content type');
    }

    if (criteria.platform && template.platforms.includes(criteria.platform)) {
      reasons.push('Optimized for this platform');
    }

    if (template.avgPerformance && template.avgPerformance > 0.7) {
      reasons.push('High performer');
    }

    if (template.useCount && template.useCount > 20) {
      reasons.push('Popular choice');
    }

    return reasons.length > 0 ? reasons.join('. ') : 'Good match for your content';
  }

  private applyBrandCustomization(template: VisualTemplate, brand: BrandData): VisualTemplate {
    // For MVP, return template as-is
    // Full version would customize colors, fonts, etc. based on brand identity
    return template;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const visualSelectorService = new VisualSelectorService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick template selection
 */
export function selectVisualTemplate(params: {
  contentType: string;
  platform: string;
  brand?: BrandData;
}): VisualTemplate {
  return visualSelectorService.selectTemplate(params.contentType, params.platform, params.brand);
}

/**
 * Get visual template recommendations
 */
export function getVisualRecommendations(params: {
  contentType: string;
  platform: string;
  industry?: string;
  limit?: number;
}): VisualTemplate[] {
  const { contentType, platform, industry, limit = 3 } = params;

  if (industry) {
    return visualSelectorService.getRecommendedForIndustry(industry, contentType).slice(0, limit);
  }

  const matches = visualSelectorService.findMatches({ contentType, platform });
  return matches.slice(0, limit).map((m) => m.template);
}
