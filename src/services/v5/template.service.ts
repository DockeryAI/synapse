/**
 * V5 Template Service
 *
 * Manages template selection, filtering, and population.
 * Templates are the core of V5 - they provide guardrails for quality.
 *
 * Created: 2025-12-01
 */

import type {
  UniversalTemplate,
  Platform,
  CustomerCategory,
  ContentType,
  TemplateStructure,
  IndustryPsychology,
  ITemplateService,
} from './types';
import { UNIVERSAL_TEMPLATES } from '@/data/v5/universal-templates';

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

export interface TemplateSelectionOptions {
  platform: Platform;
  customerCategory: CustomerCategory;
  contentType?: ContentType;
  industrySlug?: string;
  structure?: TemplateStructure;
  excludeIds?: string[];  // For deduplication
}

/**
 * Select the best template for given criteria
 */
export async function selectTemplate(options: TemplateSelectionOptions): Promise<UniversalTemplate | null> {
  const {
    platform,
    customerCategory,
    contentType,
    structure,
    excludeIds = [],
  } = options;

  // Start with all templates for the platform
  let candidates = UNIVERSAL_TEMPLATES.filter(t => t.platform === platform);

  if (candidates.length === 0) {
    console.warn(`[V5 Template] No templates for platform: ${platform}`);
    return null;
  }

  // Filter by customer category
  candidates = candidates.filter(t =>
    t.customerCategories.includes(customerCategory)
  );

  // If no category match, fall back to all platform templates
  if (candidates.length === 0) {
    console.log(`[V5 Template] No category match for ${customerCategory}, using all ${platform} templates`);
    candidates = UNIVERSAL_TEMPLATES.filter(t => t.platform === platform);
  }

  // Filter by content type if specified
  if (contentType) {
    const typeFiltered = candidates.filter(t => t.contentType === contentType);
    if (typeFiltered.length > 0) {
      candidates = typeFiltered;
    }
  }

  // Filter by structure if specified
  if (structure) {
    const structureFiltered = candidates.filter(t => t.structure === structure);
    if (structureFiltered.length > 0) {
      candidates = structureFiltered;
    }
  }

  // Exclude already used templates
  candidates = candidates.filter(t => !excludeIds.includes(t.id));

  if (candidates.length === 0) {
    console.warn(`[V5 Template] No templates after filtering for ${platform}/${customerCategory}`);
    return null;
  }

  // Sort by average score (if available) and pick best
  candidates.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));

  // Add some randomization among top candidates (top 3)
  const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  console.log(`[V5 Template] Selected: ${selected.id} (${selected.structure}/${selected.contentType})`);
  return selected;
}

/**
 * Populate a template with variables
 */
export function populateTemplate(template: UniversalTemplate, variables: Record<string, string>): string {
  let result = template.template;

  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(variables)) {
    // Support both snake_case and camelCase
    const snakePattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const camelPattern = new RegExp(`\\{\\{\\s*${camelKey}\\s*\\}\\}`, 'gi');

    result = result.replace(snakePattern, value || '');
    result = result.replace(camelPattern, value || '');
  }

  // Clean up any remaining empty variables
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  // Clean up double spaces and trim
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}

/**
 * Get templates by customer category
 */
export function getTemplatesByCategory(category: CustomerCategory): UniversalTemplate[] {
  return UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes(category));
}

/**
 * Get templates by platform
 */
export function getTemplatesByPlatform(platform: Platform): UniversalTemplate[] {
  return UNIVERSAL_TEMPLATES.filter(t => t.platform === platform);
}

/**
 * Get templates by structure
 */
export function getTemplatesByStructure(structure: TemplateStructure): UniversalTemplate[] {
  return UNIVERSAL_TEMPLATES.filter(t => t.structure === structure);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): UniversalTemplate | undefined {
  return UNIVERSAL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get random hook from industry psychology
 */
export function getRandomHook(psychology: IndustryPsychology, type?: keyof IndustryPsychology['hookLibrary']): string {
  const library = psychology.hookLibrary;

  if (type && library[type] && library[type]!.length > 0) {
    const hooks = library[type]!;
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  // Get all hooks
  const allHooks = [
    ...library.numberHooks,
    ...library.questionHooks,
    ...library.storyHooks,
    ...library.fearHooks,
    ...library.howtoHooks,
    ...(library.curiosityHooks || []),
    ...(library.authorityHooks || []),
  ].filter(Boolean);

  if (allHooks.length === 0) return '';
  return allHooks[Math.floor(Math.random() * allHooks.length)];
}

/**
 * Get recommended hook type based on customer category
 */
export function getRecommendedHookType(category: CustomerCategory): keyof IndustryPsychology['hookLibrary'] {
  switch (category) {
    case 'pain-driven':
      return 'fearHooks';
    case 'aspiration-driven':
      return 'storyHooks';
    case 'trust-seeking':
      return 'authorityHooks';
    case 'convenience-driven':
      return 'howtoHooks';
    case 'value-driven':
      return 'numberHooks';
    case 'community-driven':
      return 'questionHooks';
    default:
      return 'questionHooks';
  }
}

/**
 * Count available templates by platform and category
 */
export function getTemplateStats(): Record<Platform, Record<CustomerCategory, number>> {
  const stats: Record<Platform, Record<CustomerCategory, number>> = {
    linkedin: { 'pain-driven': 0, 'aspiration-driven': 0, 'trust-seeking': 0, 'convenience-driven': 0, 'value-driven': 0, 'community-driven': 0 },
    facebook: { 'pain-driven': 0, 'aspiration-driven': 0, 'trust-seeking': 0, 'convenience-driven': 0, 'value-driven': 0, 'community-driven': 0 },
    instagram: { 'pain-driven': 0, 'aspiration-driven': 0, 'trust-seeking': 0, 'convenience-driven': 0, 'value-driven': 0, 'community-driven': 0 },
    twitter: { 'pain-driven': 0, 'aspiration-driven': 0, 'trust-seeking': 0, 'convenience-driven': 0, 'value-driven': 0, 'community-driven': 0 },
    tiktok: { 'pain-driven': 0, 'aspiration-driven': 0, 'trust-seeking': 0, 'convenience-driven': 0, 'value-driven': 0, 'community-driven': 0 },
  };

  for (const template of UNIVERSAL_TEMPLATES) {
    for (const category of template.customerCategories) {
      stats[template.platform][category]++;
    }
  }

  return stats;
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const templateService: ITemplateService = {
  selectTemplate,
  populateTemplate,
  getTemplatesByCategory,
};

export default templateService;
