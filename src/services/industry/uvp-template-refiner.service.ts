/**
 * UVP Template Refiner Service
 *
 * Refines industry profile templates based on UVP signals.
 * Runs during UVP flow to generate specialty-aligned content.
 *
 * Architecture:
 * 1. Load NAICS-matched profile as baseline
 * 2. Score templates against UVP signals
 * 3. Flag low-alignment templates for refinement
 * 4. Generate refined templates using UVP context
 * 5. Cache refined profile per brand
 *
 * Created: 2025-11-30
 * Related: template-alignment-scorer.service.ts
 */

import { supabase } from '@/lib/supabase';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { EnhancedIndustryProfile } from '@/types/industry-profile.types';
import {
  templateAlignmentScorerService,
  extractUVPSignals,
  type UVPSignals,
  type TemplateScoreResult,
  type AlignmentScore,
} from './template-alignment-scorer.service';
import { loadProfileBySlug } from '@/services/intelligence/enhanced-profile-loader.service';

// =============================================================================
// TYPES
// =============================================================================

export interface RefinedTemplate {
  original: string;
  refined: string;
  score: AlignmentScore;
  refinementType: 'industry' | 'persona' | 'benefit' | 'solution';
}

export interface RefinedProfileCache {
  brandId: string;
  baseProfileId: string;
  refinedAt: string;
  signals: UVPSignals;
  refinedHooks: RefinedTemplate[];
  refinedHeadlines: RefinedTemplate[];
  refinedCTAs: RefinedTemplate[];
  alignmentSummary: {
    totalTemplates: number;
    refined: number;
    avgScoreBefore: number;
    avgScoreAfter: number;
  };
}

export interface RefinerOptions {
  /** Threshold below which templates are refined (default: 0.5) */
  refinementThreshold?: number;
  /** Skip caching results (default: false) */
  skipCache?: boolean;
  /** Maximum templates to refine per type (default: 5) */
  maxRefinementsPerType?: number;
}

// =============================================================================
// TEMPLATE REFINEMENT PATTERNS
// =============================================================================

/**
 * Inject UVP context into a template
 */
function injectUVPContext(
  template: string,
  signals: UVPSignals,
  refinementType: 'industry' | 'persona' | 'benefit' | 'solution'
): string {
  let refined = template;

  switch (refinementType) {
    case 'industry':
      // Replace generic industry references with specific ones
      if (signals.targetIndustry.length > 0) {
        const industryTerm = signals.targetIndustry[0];
        refined = refined
          .replace(/\byour industry\b/gi, `the ${industryTerm} industry`)
          .replace(/\byour business\b/gi, `your ${industryTerm} business`)
          .replace(/\bcompanies\b/gi, `${industryTerm} companies`)
          .replace(/\bprofessionals\b/gi, `${industryTerm} professionals`);
      }
      break;

    case 'persona':
      // Replace generic audience terms with specific personas
      if (signals.targetPersona.length > 0) {
        const personaTerm = signals.targetPersona[0];
        refined = refined
          .replace(/\bdecision makers\b/gi, personaTerm)
          .replace(/\bleaders\b/gi, `${personaTerm}s`)
          .replace(/\bexecutives\b/gi, personaTerm);
      }
      break;

    case 'benefit':
      // Inject pain point language
      if (signals.keyPainPoints.length > 0) {
        const painPoint = signals.keyPainPoints[0];
        // Add pain point context if not already present
        if (!refined.toLowerCase().includes(painPoint.toLowerCase())) {
          // Insert pain point mention at a natural point
          if (refined.includes('without')) {
            refined = refined.replace(/without\s+\w+/i, `without ${painPoint}`);
          } else if (refined.includes('avoiding')) {
            refined = refined.replace(/avoiding\s+\w+/i, `avoiding ${painPoint}`);
          }
        }
      }
      break;

    case 'solution':
      // Inject solution keywords
      if (signals.solutionKeywords.length > 0) {
        const solutionKey = signals.solutionKeywords[0];
        // Add solution context
        if (!refined.toLowerCase().includes(solutionKey.toLowerCase())) {
          // Prepend solution context for certain patterns
          if (refined.match(/^[Hh]ow to/)) {
            refined = refined.replace(/^([Hh]ow to)/, `$1 use ${solutionKey} to`);
          } else if (refined.match(/^[Ww]hy/)) {
            refined = refined.replace(/^([Ww]hy)/, `$1 ${solutionKey}`);
          }
        }
      }

      // Add compliance context if relevant
      if (signals.complianceTerms.length > 0) {
        const complianceTerm = signals.complianceTerms[0];
        if (!refined.toLowerCase().includes(complianceTerm.toLowerCase())) {
          refined = `${refined} (${complianceTerm}-compliant)`;
        }
      }
      break;
  }

  return refined;
}

/**
 * Determine best refinement type based on score deficiencies
 */
function determineRefinementType(score: AlignmentScore): 'industry' | 'persona' | 'benefit' | 'solution' {
  const scores = [
    { type: 'industry' as const, value: score.industryMatch },
    { type: 'persona' as const, value: score.targetMatch },
    { type: 'benefit' as const, value: score.benefitMatch },
    { type: 'solution' as const, value: score.solutionMatch },
  ];

  // Find lowest score to prioritize that refinement
  scores.sort((a, b) => a.value - b.value);
  return scores[0].type === 'industry' ? scores[1].type : scores[0].type;
}

// =============================================================================
// CORE REFINEMENT LOGIC
// =============================================================================

/**
 * Refine a single template
 */
function refineTemplate(
  template: string,
  score: AlignmentScore,
  signals: UVPSignals
): RefinedTemplate {
  const refinementType = determineRefinementType(score);
  const refined = injectUVPContext(template, signals, refinementType);

  // Re-score the refined template
  const newScore = templateAlignmentScorerService.scoreTemplate(
    refined,
    signals,
    'hook' // Type doesn't matter much for re-scoring
  );

  return {
    original: template,
    refined,
    score: newScore,
    refinementType,
  };
}

/**
 * Extract templates from profile for scoring
 */
function extractTemplatesForScoring(
  profile: EnhancedIndustryProfile
): Array<{ id: string; content: string; type: 'hook' | 'headline' | 'cta' | 'campaign' }> {
  const templates: Array<{ id: string; content: string; type: 'hook' | 'headline' | 'cta' | 'campaign' }> = [];

  // Extract hooks from hook library
  if (profile.hook_library) {
    Object.entries(profile.hook_library).forEach(([hookType, hooks]) => {
      if (Array.isArray(hooks)) {
        hooks.forEach((hook, idx) => {
          templates.push({
            id: `${hookType}-${idx}`,
            content: hook,
            type: 'hook',
          });
        });
      }
    });
  }

  // Extract headline templates
  if (profile.headline_templates && Array.isArray(profile.headline_templates)) {
    profile.headline_templates.forEach((headline, idx) => {
      const content = typeof headline === 'string' ? headline : (headline as any).template || '';
      if (content) {
        templates.push({
          id: `headline-${idx}`,
          content,
          type: 'headline',
        });
      }
    });
  }

  // Extract CTA templates (from urgency_drivers or cta_templates)
  if (profile.urgency_drivers && Array.isArray(profile.urgency_drivers)) {
    profile.urgency_drivers.forEach((driver, idx) => {
      const content = typeof driver === 'string' ? driver : '';
      if (content) {
        templates.push({
          id: `cta-${idx}`,
          content,
          type: 'cta',
        });
      }
    });
  }

  return templates;
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Store refined profile in Supabase
 */
async function cacheRefinedProfile(
  brandId: string,
  cache: RefinedProfileCache
): Promise<void> {
  try {
    await supabase.from('refined_industry_profiles').upsert({
      id: `${brandId}-${cache.baseProfileId}`,
      brand_id: brandId,
      base_profile_id: cache.baseProfileId,
      refined_data: cache,
      refined_at: cache.refinedAt,
    });

    console.log(`[UVPTemplateRefiner] Cached refined profile for brand ${brandId}`);
  } catch (err) {
    console.error('[UVPTemplateRefiner] Failed to cache refined profile:', err);
    // Non-fatal - continue without caching
  }
}

/**
 * Load cached refined profile
 */
async function loadCachedProfile(
  brandId: string,
  baseProfileId: string
): Promise<RefinedProfileCache | null> {
  try {
    const { data, error } = await supabase
      .from('refined_industry_profiles')
      .select('refined_data')
      .eq('id', `${brandId}-${baseProfileId}`)
      .single();

    if (error || !data) return null;

    return data.refined_data as RefinedProfileCache;
  } catch (err) {
    console.warn('[UVPTemplateRefiner] Cache lookup failed:', err);
    return null;
  }
}

// =============================================================================
// MAIN REFINEMENT FUNCTION
// =============================================================================

/**
 * Refine industry profile templates based on UVP signals
 */
export async function refineProfileTemplates(
  brandId: string,
  profileSlug: string,
  uvp: CompleteUVP,
  options: RefinerOptions = {}
): Promise<RefinedProfileCache> {
  const {
    refinementThreshold = 0.5,
    skipCache = false,
    maxRefinementsPerType = 5,
  } = options;

  console.log(`[UVPTemplateRefiner] Starting refinement for brand ${brandId}, profile ${profileSlug}`);

  // Check cache first
  if (!skipCache) {
    const cached = await loadCachedProfile(brandId, profileSlug);
    if (cached) {
      console.log('[UVPTemplateRefiner] Using cached refined profile');
      return cached;
    }
  }

  // Load base profile from Supabase
  const profile = await loadProfileBySlug(profileSlug);
  if (!profile) {
    throw new Error(`Profile ${profileSlug} not found`);
  }

  // Extract UVP signals
  const signals = extractUVPSignals(uvp);
  console.log('[UVPTemplateRefiner] Extracted signals:', {
    industries: signals.targetIndustry,
    personas: signals.targetPersona,
    solutions: signals.solutionKeywords,
  });

  // Extract and score templates
  const templates = extractTemplatesForScoring(profile);
  const scored = templateAlignmentScorerService.scoreTemplates(templates, uvp);

  // Find templates needing refinement
  const needsRefinement = scored.filter(t => t.score.overall < refinementThreshold);
  console.log(`[UVPTemplateRefiner] ${needsRefinement.length}/${scored.length} templates need refinement`);

  // Refine templates by type
  const refinedHooks: RefinedTemplate[] = [];
  const refinedHeadlines: RefinedTemplate[] = [];
  const refinedCTAs: RefinedTemplate[] = [];

  needsRefinement.forEach(templateResult => {
    const refined = refineTemplate(templateResult.content, templateResult.score, signals);

    switch (templateResult.templateType) {
      case 'hook':
        if (refinedHooks.length < maxRefinementsPerType) {
          refinedHooks.push(refined);
        }
        break;
      case 'headline':
        if (refinedHeadlines.length < maxRefinementsPerType) {
          refinedHeadlines.push(refined);
        }
        break;
      case 'cta':
        if (refinedCTAs.length < maxRefinementsPerType) {
          refinedCTAs.push(refined);
        }
        break;
    }
  });

  // Calculate summary stats
  const totalRefined = refinedHooks.length + refinedHeadlines.length + refinedCTAs.length;
  const avgScoreBefore = needsRefinement.length > 0
    ? needsRefinement.reduce((sum, t) => sum + t.score.overall, 0) / needsRefinement.length
    : 0;
  const allRefined = [...refinedHooks, ...refinedHeadlines, ...refinedCTAs];
  const avgScoreAfter = allRefined.length > 0
    ? allRefined.reduce((sum, t) => sum + t.score.overall, 0) / allRefined.length
    : 0;

  // Build cache object
  const cache: RefinedProfileCache = {
    brandId,
    baseProfileId: profileSlug,
    refinedAt: new Date().toISOString(),
    signals,
    refinedHooks,
    refinedHeadlines,
    refinedCTAs,
    alignmentSummary: {
      totalTemplates: templates.length,
      refined: totalRefined,
      avgScoreBefore,
      avgScoreAfter,
    },
  };

  // Store in cache
  if (!skipCache) {
    await cacheRefinedProfile(brandId, cache);
  }

  console.log(`[UVPTemplateRefiner] Refinement complete:`, cache.alignmentSummary);

  return cache;
}

/**
 * Get refined hooks for a brand
 */
export async function getRefinedHooks(
  brandId: string,
  profileSlug: string,
  uvp: CompleteUVP
): Promise<string[]> {
  const cache = await refineProfileTemplates(brandId, profileSlug, uvp);
  return cache.refinedHooks.map(h => h.refined);
}

/**
 * Get refined headlines for a brand
 */
export async function getRefinedHeadlines(
  brandId: string,
  profileSlug: string,
  uvp: CompleteUVP
): Promise<string[]> {
  const cache = await refineProfileTemplates(brandId, profileSlug, uvp);
  return cache.refinedHeadlines.map(h => h.refined);
}

// =============================================================================
// SERVICE SINGLETON
// =============================================================================

export const uvpTemplateRefinerService = {
  refineProfileTemplates,
  getRefinedHooks,
  getRefinedHeadlines,
  extractUVPSignals,
  loadCachedProfile,
};

export default uvpTemplateRefinerService;
