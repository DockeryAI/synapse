/**
 * V5 Industry Template Extractor
 *
 * Extracts and transforms templates from 380 industry profiles into V5 format.
 * Enables industry-specific template overrides while falling back to universal templates.
 *
 * Created: 2025-12-01
 */

import type { Platform, CustomerCategory, ContentType, UniversalTemplate, IndustryPsychology } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface IndustryTemplateSource {
  industrySlug: string;
  platform: Platform;
  templates: RawIndustryTemplate[];
}

export interface RawIndustryTemplate {
  category?: string;
  template: string;
  hooks?: string[];
  ctas?: string[];
  hashtags?: string[];
}

export interface ExtractionResult {
  extracted: UniversalTemplate[];
  skipped: SkippedTemplate[];
  stats: ExtractionStats;
}

export interface SkippedTemplate {
  industrySlug: string;
  platform: Platform;
  reason: string;
  template: string;
}

export interface ExtractionStats {
  totalProcessed: number;
  totalExtracted: number;
  totalSkipped: number;
  byPlatform: Record<Platform, number>;
  byCategory: Record<CustomerCategory, number>;
}

// ============================================================================
// TEMPLATE CATEGORY MAPPING
// ============================================================================

const CATEGORY_KEYWORDS: Record<CustomerCategory, string[]> = {
  'pain-driven': [
    'pain', 'problem', 'struggle', 'frustrat', 'tired of', 'sick of',
    'mistake', 'wrong', 'fail', 'risk', 'danger', 'urgent', 'emergency',
  ],
  'aspiration-driven': [
    'dream', 'goal', 'aspir', 'transform', 'achieve', 'success',
    'grow', 'improve', 'better', 'best', 'future', 'vision',
  ],
  'trust-seeking': [
    'trust', 'reliable', 'proven', 'certified', 'expert', 'professional',
    'experience', 'guarantee', 'quality', 'reputation', 'recommend',
  ],
  'convenience-driven': [
    'easy', 'simple', 'quick', 'fast', 'convenient', 'hassle-free',
    'effortless', 'streamline', 'one-stop', 'time-saving',
  ],
  'value-driven': [
    'value', 'worth', 'save', 'afford', 'budget', 'cost-effective',
    'roi', 'invest', 'return', 'free', 'deal', 'offer',
  ],
  'community-driven': [
    'community', 'local', 'neighbor', 'family', 'team', 'together',
    'belong', 'join', 'share', 'connect', 'support', 'celebrate',
  ],
};

// ============================================================================
// INDUSTRY TEMPLATE EXTRACTOR
// ============================================================================

class IndustryTemplateExtractor {
  private templateIdCounter = 0;

  /**
   * Extract templates from industry profile data
   */
  extractFromProfile(
    industrySlug: string,
    psychology: IndustryPsychology
  ): ExtractionResult {
    const extracted: UniversalTemplate[] = [];
    const skipped: SkippedTemplate[] = [];

    const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];

    for (const platform of platforms) {
      const platformTemplates = this.getTemplatesFromPsychology(psychology, platform);

      for (const rawTemplate of platformTemplates) {
        const result = this.transformTemplate(industrySlug, platform, rawTemplate);

        if (result.success && result.template) {
          extracted.push(result.template);
        } else {
          skipped.push({
            industrySlug,
            platform,
            reason: result.reason || 'Unknown',
            template: rawTemplate.template.substring(0, 100),
          });
        }
      }
    }

    return {
      extracted,
      skipped,
      stats: this.calculateStats(extracted, skipped, platforms),
    };
  }

  /**
   * Extract templates from raw content templates object
   */
  extractFromRaw(
    industrySlug: string,
    contentTemplates: Record<string, RawIndustryTemplate[]>
  ): ExtractionResult {
    const extracted: UniversalTemplate[] = [];
    const skipped: SkippedTemplate[] = [];

    const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];

    for (const platform of platforms) {
      const key = `${platform}_content_templates`;
      const rawTemplates = contentTemplates[key] || [];

      for (const rawTemplate of rawTemplates) {
        const result = this.transformTemplate(industrySlug, platform, rawTemplate);

        if (result.success && result.template) {
          extracted.push(result.template);
        } else {
          skipped.push({
            industrySlug,
            platform,
            reason: result.reason || 'Unknown',
            template: rawTemplate.template?.substring(0, 100) || 'No template',
          });
        }
      }
    }

    return {
      extracted,
      skipped,
      stats: this.calculateStats(extracted, skipped, platforms),
    };
  }

  /**
   * Batch extract from multiple industry profiles
   */
  extractBatch(
    profiles: Array<{ industrySlug: string; psychology: IndustryPsychology }>
  ): ExtractionResult {
    const allExtracted: UniversalTemplate[] = [];
    const allSkipped: SkippedTemplate[] = [];

    for (const { industrySlug, psychology } of profiles) {
      const result = this.extractFromProfile(industrySlug, psychology);
      allExtracted.push(...result.extracted);
      allSkipped.push(...result.skipped);
    }

    const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];
    return {
      extracted: allExtracted,
      skipped: allSkipped,
      stats: this.calculateStats(allExtracted, allSkipped, platforms),
    };
  }

  /**
   * Transform a raw template into UniversalTemplate format
   */
  private transformTemplate(
    industrySlug: string,
    platform: Platform,
    raw: RawIndustryTemplate
  ): { success: boolean; template?: UniversalTemplate; reason?: string } {
    // Validate template content
    if (!raw.template || raw.template.length < 20) {
      return { success: false, reason: 'Template too short' };
    }

    if (raw.template.length > 2000) {
      return { success: false, reason: 'Template too long' };
    }

    // Detect customer categories from template content
    const categories = this.detectCategories(raw.template, raw.category);
    if (categories.length === 0) {
      categories.push('value-driven'); // Default fallback
    }

    // Detect content type
    const contentType = this.detectContentType(raw.template);

    // Detect structure
    const structure = this.detectStructure(raw.template);

    // Generate unique ID
    const id = `${industrySlug}-${platform}-${++this.templateIdCounter}`;

    const template: UniversalTemplate = {
      id,
      structure,
      contentType,
      platform,
      template: this.normalizeTemplate(raw.template),
      psychologyTags: {
        primaryTrigger: this.getPrimaryTrigger(categories[0]),
        secondaryTriggers: this.getSecondaryTriggers(raw.template),
        urgencyLevel: this.detectUrgencyLevel(raw.template),
      },
      customerCategories: categories,
      averageScore: 75, // Default, would be scored by synapse-scorer
      industrySlug, // Additional metadata
    };

    return { success: true, template };
  }

  /**
   * Detect customer categories from template content
   */
  private detectCategories(template: string, rawCategory?: string): CustomerCategory[] {
    const detected: CustomerCategory[] = [];
    const lowerTemplate = template.toLowerCase();

    // Check explicit category mapping first
    if (rawCategory) {
      const mapped = this.mapRawCategory(rawCategory);
      if (mapped) detected.push(mapped);
    }

    // Keyword-based detection
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const matchCount = keywords.filter(kw => lowerTemplate.includes(kw)).length;
      if (matchCount >= 2) {
        detected.push(category as CustomerCategory);
      }
    }

    // Deduplicate
    return [...new Set(detected)];
  }

  /**
   * Map raw category string to CustomerCategory
   */
  private mapRawCategory(raw: string): CustomerCategory | null {
    const lower = raw.toLowerCase();

    if (lower.includes('pain') || lower.includes('problem')) return 'pain-driven';
    if (lower.includes('aspir') || lower.includes('goal')) return 'aspiration-driven';
    if (lower.includes('trust') || lower.includes('authority')) return 'trust-seeking';
    if (lower.includes('convenience') || lower.includes('easy')) return 'convenience-driven';
    if (lower.includes('value') || lower.includes('offer')) return 'value-driven';
    if (lower.includes('community') || lower.includes('local')) return 'community-driven';

    return null;
  }

  /**
   * Detect content type from template
   */
  private detectContentType(template: string): ContentType {
    const lower = template.toLowerCase();

    if (lower.includes('learn') || lower.includes('tip') || lower.includes('how to')) {
      return 'educational';
    }
    if (lower.includes('community') || lower.includes('together') || lower.includes('share')) {
      return 'community';
    }
    if (lower.includes('expert') || lower.includes('proven') || lower.includes('years')) {
      return 'authority';
    }
    if (lower.includes('comment') || lower.includes('poll') || lower.includes('question')) {
      return 'engagement';
    }

    return 'promotional';
  }

  /**
   * Detect template structure
   */
  private detectStructure(template: string): string {
    const lower = template.toLowerCase();

    if (lower.includes('before') && lower.includes('after')) return 'transformation';
    if (/\d+\.\s/.test(template) || /•/.test(template)) return 'list';
    if (lower.includes('story') || lower.includes('once')) return 'storytelling';
    if (lower.includes('how to') || lower.includes('step')) return 'how-to';
    if (lower.includes('client said') || lower.includes('testimonial')) return 'testimonial';
    if (lower.includes('limited') || lower.includes('now') || lower.includes('today only')) return 'offer';

    return 'educational';
  }

  /**
   * Get primary trigger from category
   */
  private getPrimaryTrigger(category: CustomerCategory): string {
    const triggerMap: Record<CustomerCategory, string> = {
      'pain-driven': 'pain',
      'aspiration-driven': 'aspiration',
      'trust-seeking': 'trust',
      'convenience-driven': 'convenience',
      'value-driven': 'value',
      'community-driven': 'belonging',
    };
    return triggerMap[category] || 'value';
  }

  /**
   * Get secondary triggers from template content
   */
  private getSecondaryTriggers(template: string): string[] {
    const triggers: string[] = [];
    const lower = template.toLowerCase();

    if (lower.includes('proof') || lower.includes('result')) triggers.push('proof');
    if (lower.includes('fear') || lower.includes('risk')) triggers.push('fear');
    if (lower.includes('curious') || lower.includes('secret')) triggers.push('curiosity');
    if (lower.includes('free') || lower.includes('save')) triggers.push('incentive');
    if (lower.includes('exclusive') || lower.includes('limited')) triggers.push('scarcity');

    return triggers.slice(0, 3);
  }

  /**
   * Detect urgency level
   */
  private detectUrgencyLevel(template: string): 'low' | 'medium' | 'high' {
    const lower = template.toLowerCase();

    if (
      lower.includes('now') ||
      lower.includes('today') ||
      lower.includes('limited time') ||
      lower.includes('act fast')
    ) {
      return 'high';
    }

    if (
      lower.includes('soon') ||
      lower.includes('this week') ||
      lower.includes('don\'t miss')
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Normalize template placeholders to V5 format
   */
  private normalizeTemplate(template: string): string {
    return template
      // Normalize common placeholder patterns
      .replace(/\[business_?name\]/gi, '{{business_name}}')
      .replace(/\[company\]/gi, '{{business_name}}')
      .replace(/\[target_?customer\]/gi, '{{target_customer}}')
      .replace(/\[audience\]/gi, '{{target_customer}}')
      .replace(/\[key_?benefit\]/gi, '{{key_benefit}}')
      .replace(/\[benefit\]/gi, '{{key_benefit}}')
      .replace(/\[unique_?solution\]/gi, '{{unique_solution}}')
      .replace(/\[solution\]/gi, '{{unique_solution}}')
      .replace(/\[transformation\]/gi, '{{transformation}}')
      .replace(/\[differentiator\]/gi, '{{differentiator}}')
      // Clean up any remaining square bracket placeholders
      .replace(/\[([^\]]+)\]/g, (_, content) => {
        const normalized = content.toLowerCase().replace(/\s+/g, '_');
        return `{{${normalized}}}`;
      });
  }

  /**
   * Get templates from psychology object
   */
  private getTemplatesFromPsychology(
    psychology: IndustryPsychology,
    platform: Platform
  ): RawIndustryTemplate[] {
    const key = `${platform}_content_templates` as keyof IndustryPsychology;
    const templates = psychology.contentTemplates?.[platform] || [];

    if (Array.isArray(templates)) {
      return templates.map(t => {
        if (typeof t === 'string') {
          return { template: t };
        }
        return t as RawIndustryTemplate;
      });
    }

    return [];
  }

  /**
   * Calculate extraction statistics
   */
  private calculateStats(
    extracted: UniversalTemplate[],
    skipped: SkippedTemplate[],
    platforms: Platform[]
  ): ExtractionStats {
    const byPlatform: Record<Platform, number> = {
      linkedin: 0,
      facebook: 0,
      instagram: 0,
      twitter: 0,
      tiktok: 0,
    };

    const byCategory: Record<CustomerCategory, number> = {
      'pain-driven': 0,
      'aspiration-driven': 0,
      'trust-seeking': 0,
      'convenience-driven': 0,
      'value-driven': 0,
      'community-driven': 0,
    };

    for (const template of extracted) {
      byPlatform[template.platform]++;
      for (const category of template.customerCategories) {
        byCategory[category]++;
      }
    }

    return {
      totalProcessed: extracted.length + skipped.length,
      totalExtracted: extracted.length,
      totalSkipped: skipped.length,
      byPlatform,
      byCategory,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const industryTemplateExtractor = new IndustryTemplateExtractor();

export { IndustryTemplateExtractor };

export default industryTemplateExtractor;
