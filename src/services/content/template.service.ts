/**
 * TEMPLATE SERVICE
 *
 * Manages content templates: selection, population, scoring.
 * The bridge between templates, brand data, and Synapse scoring.
 */

import type {
  Template,
  TemplateSelectionCriteria,
  TemplateMatch,
  TemplatePopulationData,
  PopulatedTemplate,
  TemplateContent,
  TemplateStructure,
  ContentType,
  TemplateRegistry,
} from '../../types/template.types';

import { UNIVERSAL_TEMPLATES } from '../../data/templates/universal-templates';
import { synapseCoreService } from '../synapse/synapse-core.service';
import { industryRegistry } from '../../data/industries';

// ============================================================================
// TEMPLATE REGISTRY IMPLEMENTATION
// ============================================================================

class TemplateRegistryImpl implements TemplateRegistry {
  templates = UNIVERSAL_TEMPLATES;

  getById(id: string): Template | undefined {
    return this.templates.find((t) => t.id === id);
  }

  getByStructure(structure: TemplateStructure): Template[] {
    return this.templates.filter((t) => t.structure === structure);
  }

  search(criteria: TemplateSelectionCriteria): TemplateMatch[] {
    let filtered = [...this.templates];

    // Filter by industry
    if (criteria.industryId) {
      filtered = filtered.filter(
        (t) => t.industryTags.includes('all') || t.industryTags.includes(criteria.industryId!)
      );
    }

    // Filter by content type
    if (criteria.contentType) {
      const types = Array.isArray(criteria.contentType) ? criteria.contentType : [criteria.contentType];
      filtered = filtered.filter((t) => types.includes(t.contentType));
    }

    // Filter by platform
    if (criteria.platform) {
      const platforms = Array.isArray(criteria.platform) ? criteria.platform : [criteria.platform];
      filtered = filtered.filter((t) => t.platform.some((p) => platforms.includes(p)));
    }

    // Filter by minimum score
    if (criteria.minScore !== undefined) {
      filtered = filtered.filter((t) => (t.averageSynapseScore || 0) >= criteria.minScore!);
    }

    // Exclude specific IDs
    if (criteria.excludeIds) {
      filtered = filtered.filter((t) => !criteria.excludeIds!.includes(t.id));
    }

    // Convert to matches with scoring
    const matches: TemplateMatch[] = filtered.map((template) => {
      const score = this.calculateMatchScore(template, criteria);
      return {
        template,
        score,
        reason: this.generateMatchReason(template, criteria),
      };
    });

    // Sort by match score
    matches.sort((a, b) => b.score - a.score);

    // Apply limit
    if (criteria.limit) {
      return matches.slice(0, criteria.limit);
    }

    return matches;
  }

  getTotalCount(): number {
    return this.templates.length;
  }

  getByIndustry(industryId: string): Template[] {
    return this.templates.filter((t) => t.industryTags.includes('all') || t.industryTags.includes(industryId));
  }

  getMostUsed(limit: number): Template[] {
    return [...this.templates].sort((a, b) => (b.useCount || 0) - (a.useCount || 0)).slice(0, limit);
  }

  private calculateMatchScore(template: Template, criteria: TemplateSelectionCriteria): number {
    let score = 50; // Base score

    // Industry match bonus
    if (criteria.industryId) {
      if (template.industryTags.includes(criteria.industryId)) {
        score += 30; // Perfect industry match
      } else if (template.industryTags.includes('all')) {
        score += 15; // Universal template
      }
    }

    // Historical performance bonus
    if (template.averageSynapseScore) {
      score += (template.averageSynapseScore / 100) * 20; // Up to 20 points
    }

    // Usage bonus (popular templates)
    if (template.useCount && template.useCount > 10) {
      score += Math.min(10, template.useCount / 10); // Up to 10 points
    }

    return Math.min(100, score);
  }

  private generateMatchReason(template: Template, criteria: TemplateSelectionCriteria): string {
    const reasons: string[] = [];

    if (criteria.industryId && template.industryTags.includes(criteria.industryId)) {
      reasons.push('Perfect match for your industry');
    }

    if (template.averageSynapseScore && template.averageSynapseScore > 80) {
      reasons.push('High performer');
    }

    if (template.useCount && template.useCount > 20) {
      reasons.push('Popular with similar businesses');
    }

    return reasons.length > 0 ? reasons.join('. ') : 'Good match for your needs';
  }
}

export const templateRegistry = new TemplateRegistryImpl();

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export class TemplateService {
  private registry: TemplateRegistry;

  constructor(registry?: TemplateRegistry) {
    this.registry = registry || templateRegistry;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Get templates for a specific industry
   */
  getTemplatesForIndustry(industryId: string): Template[] {
    return this.registry.getByIndustry(industryId);
  }

  /**
   * Search templates with criteria
   */
  searchTemplates(criteria: TemplateSelectionCriteria): TemplateMatch[] {
    return this.registry.search(criteria);
  }

  /**
   * Populate a template with brand data
   */
  populateTemplate(template: Template, data: TemplatePopulationData): PopulatedTemplate {
    const missingVariables: string[] = [];
    let populatedText = this.generateBaseText(template, data);

    // Replace variables
    for (const variable of template.variables) {
      const value = this.getVariableValue(variable.key, data);

      if (!value) {
        if (variable.required && !variable.fallback) {
          missingVariables.push(variable.key);
        }
        // Use fallback or default
        const replacement = variable.fallback || variable.defaultValue || `[${variable.label}]`;
        populatedText = populatedText.replace(new RegExp(`{{${variable.key}}}`, 'g'), replacement);
      } else {
        populatedText = populatedText.replace(new RegExp(`{{${variable.key}}}`, 'g'), value);
      }
    }

    // Score the populated content
    const synapseScore = synapseCoreService.scoreContent(populatedText);

    // Create template content
    const content: TemplateContent = {
      templateId: template.id,
      body: populatedText,
      variables: this.extractPopulatedVariables(template, data),
      contentType: template.contentType,
      platform: template.platform[0], // Default to first platform
      synapseScore,
      characterCount: populatedText.length,
      wordCount: populatedText.split(/\s+/).length,
    };

    return {
      template,
      content,
      populatedText,
      missingVariables,
      synapseScore,
    };
  }

  /**
   * Score a template (without populating)
   * Useful for pre-selecting best templates
   */
  scoreTemplate(template: Template, data?: TemplatePopulationData): number {
    if (data) {
      const populated = this.populateTemplate(template, data);
      return populated.synapseScore?.overall || 0;
    }

    // Use historical average if available
    return template.averageSynapseScore || 50;
  }

  /**
   * Select best template from options
   */
  selectBestTemplate(templates: Template[], goal: string, data?: TemplatePopulationData): Template {
    // If we have brand data, score all templates
    if (data) {
      const scored = templates.map((template) => ({
        template,
        score: this.scoreTemplate(template, data),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored[0].template;
    }

    // Otherwise use historical performance
    const sorted = [...templates].sort((a, b) => (b.averageSynapseScore || 50) - (a.averageSynapseScore || 50));
    return sorted[0];
  }

  /**
   * Get recommended templates for content calendar
   * Distributes across content types for variety
   */
  getRecommendedTemplates(params: {
    industryId: string;
    count: number;
    distribution?: Record<ContentType, number>; // Percentage per type
  }): Template[] {
    const { industryId, count, distribution } = params;

    // Default distribution if not provided
    const dist = distribution || {
      promotional: 30,
      educational: 25,
      community: 20,
      authority: 15,
      announcement: 5,
      engagement: 5,
    };

    const selected: Template[] = [];
    const industryTemplates = this.getTemplatesForIndustry(industryId);

    // Calculate how many of each type
    for (const [contentType, percentage] of Object.entries(dist)) {
      const targetCount = Math.round((count * percentage) / 100);

      // Get templates of this type
      const typeTemplates = industryTemplates.filter((t) => t.contentType === contentType);

      // Select best ones
      const bestOfType = [...typeTemplates]
        .sort((a, b) => (b.averageSynapseScore || 50) - (a.averageSynapseScore || 50))
        .slice(0, targetCount);

      selected.push(...bestOfType);
    }

    // If we don't have enough, fill with best remaining
    if (selected.length < count) {
      const remaining = industryTemplates.filter((t) => !selected.includes(t));
      const needed = count - selected.length;
      const best = [...remaining]
        .sort((a, b) => (b.averageSynapseScore || 50) - (a.averageSynapseScore || 50))
        .slice(0, needed);
      selected.push(...best);
    }

    // Shuffle to avoid predictable patterns
    return this.shuffleArray(selected).slice(0, count);
  }

  /**
   * Get template by ID
   */
  getById(id: string): Template | undefined {
    return this.registry.getById(id);
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateBaseText(template: Template, data: TemplatePopulationData): string {
    // For MVP, we'll use a simple structure-based generation
    // Full version would use AI to generate from template structure

    const industryProfile = industryRegistry.getById(data.industry);
    const powerWords = industryProfile?.powerWords || [];

    switch (template.structure) {
      case 'authority':
        return `{{number}} things every {{business_type}} should know about {{topic}}.\n\nAs experts in {{business_type}}, we've seen it all. Here's what makes the difference...`;

      case 'list':
        return `Top {{number}} reasons to choose {{business_name}}:\n\n1. {{benefit}}\n\nWant to learn more? {{cta}}`;

      case 'announcement':
        return `Exciting news! {{business_name}} is thrilled to announce {{offering}}.\n\nThis means {{benefit}} for you.\n\n{{cta}}`;

      case 'offer':
        return `🎉 Special Offer Alert! 🎉\n\n{{offer_details}}\n\nSave {{discount}} when you {{cta}}\n\n⏰ {{deadline}} - Don't miss out!`;

      case 'transformation':
        return `From {{problem}} to {{solution}}.\n\nHere's how we helped transform this situation...\n\nReady for your own transformation? {{cta}}`;

      case 'faq':
        return `You asked: "{{question}}"\n\nHere's the answer:\n\n{{answer}}\n\nHave more questions? Just ask!`;

      default:
        return `{{business_name}} - {{benefit}}\n\n{{cta}}`;
    }
  }

  private getVariableValue(key: string, data: TemplatePopulationData): string | undefined {
    // Map common variables to data fields
    const mapping: Record<string, any> = {
      business_name: data.businessName,
      business_type: data.businessType,
      industry: data.industry,
      location: data.location,
      uvp: data.uvp,
      offer: data.currentOffer,
      cta: data.ctaText || 'Get in touch today',
      benefit: data.benefits?.[0],
      number: '5', // Default
      topic: data.contentThemes?.[0],
      ...data.customData,
    };

    return mapping[key]?.toString();
  }

  private extractPopulatedVariables(template: Template, data: TemplatePopulationData): Record<string, string> {
    const populated: Record<string, string> = {};

    for (const variable of template.variables) {
      const value = this.getVariableValue(variable.key, data);
      if (value) {
        populated[variable.key] = value;
      }
    }

    return populated;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const templateService = new TemplateService();
