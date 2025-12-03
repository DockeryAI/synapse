/**
 * V5 Industry Profile Service
 *
 * Loads and extracts psychology elements from 380 industry profiles in Supabase.
 * Provides simplified interface for V5 content generation.
 *
 * Key difference from V4: Extracts only psychology-relevant data, not everything.
 *
 * Created: 2025-12-01
 */

import { supabase } from '@/lib/supabase';
import type {
  IndustryPsychology,
  CustomerTrigger,
  Transformation,
  HookLibrary,
  ContentTemplateLibrary,
  IIndustryProfileService,
} from './types';
import type { EnhancedIndustryProfile } from '@/types/industry-profile.types';

// ============================================================================
// CACHE
// ============================================================================

const psychologyCache = new Map<string, IndustryPsychology>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: IndustryPsychology;
  loadedAt: number;
}

const cache = new Map<string, CacheEntry>();

// ============================================================================
// PROFILE INDEX (for matching)
// ============================================================================

interface ProfileIndexEntry {
  slug: string;
  industryName: string;
  naicsCode: string;
  category: string;
  keywords: string[];
}

let profileIndex: ProfileIndexEntry[] = [];
let indexLoaded = false;
let indexLoadPromise: Promise<void> | null = null;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Load psychology elements from an industry profile
 */
export async function loadPsychology(industrySlug: string): Promise<IndustryPsychology | null> {
  // Check cache first
  const cached = cache.get(industrySlug);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    console.log(`[V5 IndustryProfile] Using cached psychology: ${industrySlug}`);
    return cached.data;
  }

  try {
    console.log(`[V5 IndustryProfile] Loading psychology from Supabase: ${industrySlug}`);

    const { data, error } = await supabase
      .from('industry_profiles')
      .select('id, name, naics_code, profile_data')
      .eq('id', industrySlug)
      .single();

    if (error || !data?.profile_data) {
      console.warn(`[V5 IndustryProfile] Profile not found: ${industrySlug}`);
      return null;
    }

    const profile = data.profile_data as EnhancedIndustryProfile;
    const psychology = extractPsychology(industrySlug, profile);

    // Cache it
    cache.set(industrySlug, { data: psychology, loadedAt: Date.now() });
    console.log(`[V5 IndustryProfile] Loaded psychology: ${industrySlug} (${psychology.powerWords.length} power words)`);

    return psychology;
  } catch (err) {
    console.error(`[V5 IndustryProfile] Failed to load: ${industrySlug}`, err);
    return null;
  }
}

/**
 * Extract only psychology-relevant elements from a full profile
 */
function extractPsychology(slug: string, profile: EnhancedIndustryProfile): IndustryPsychology {
  // Extract customer triggers
  const customerTriggers: CustomerTrigger[] = [];
  if (profile.customer_triggers) {
    for (const t of profile.customer_triggers) {
      if (typeof t === 'object' && t.trigger) {
        customerTriggers.push({
          trigger: t.trigger,
          urgency: t.urgency || 5,
          frequency: t.frequency,
        });
      } else if (typeof t === 'string') {
        customerTriggers.push({ trigger: t, urgency: 5 });
      }
    }
  }

  // Extract transformations
  const transformations: Transformation[] = [];
  if (profile.transformations) {
    for (const t of profile.transformations) {
      if (typeof t === 'object' && t.from && t.to) {
        transformations.push({
          from: t.from,
          to: t.to,
          emotionalValue: t.emotional_value || '',
        });
      }
    }
  }

  // Extract hook library
  const hookLibrary: HookLibrary = {
    numberHooks: profile.hook_library?.number_hooks || [],
    questionHooks: profile.hook_library?.question_hooks || [],
    storyHooks: profile.hook_library?.story_hooks || [],
    fearHooks: profile.hook_library?.fear_hooks || [],
    howtoHooks: profile.hook_library?.howto_hooks || [],
    curiosityHooks: profile.hook_library?.curiosity_hooks || [],
    authorityHooks: profile.hook_library?.authority_hooks || [],
  };

  // Extract content templates
  const contentTemplates: ContentTemplateLibrary = {};

  if (profile.content_templates?.linkedin) {
    contentTemplates.linkedin = {
      educational: profile.content_templates.linkedin.educational ? {
        hook: profile.content_templates.linkedin.educational.hook || '',
        body: profile.content_templates.linkedin.educational.body,
        cta: profile.content_templates.linkedin.educational.cta || '',
        framework: profile.content_templates.linkedin.educational.framework,
      } : undefined,
      authority: profile.content_templates.linkedin.authority ? {
        hook: profile.content_templates.linkedin.authority.hook || '',
        body: profile.content_templates.linkedin.authority.body,
        cta: profile.content_templates.linkedin.authority.cta || '',
        framework: profile.content_templates.linkedin.authority.framework,
      } : undefined,
      promotional: profile.content_templates.linkedin.promotional ? {
        hook: profile.content_templates.linkedin.promotional.hook || '',
        body: profile.content_templates.linkedin.promotional.body,
        cta: profile.content_templates.linkedin.promotional.cta || '',
        framework: profile.content_templates.linkedin.promotional.framework,
      } : undefined,
    };
  }

  if (profile.content_templates?.instagram) {
    contentTemplates.instagram = {
      educational: profile.content_templates.instagram.educational ? {
        hook: profile.content_templates.instagram.educational.hook || '',
        body: profile.content_templates.instagram.educational.body,
        cta: profile.content_templates.instagram.educational.cta || '',
      } : undefined,
    };
  }

  if (profile.content_templates?.tiktok) {
    contentTemplates.tiktok = {
      educational: profile.content_templates.tiktok.educational ? {
        hook: profile.content_templates.tiktok.educational.hook || '',
        script: profile.content_templates.tiktok.educational.script || '',
        framework: profile.content_templates.tiktok.educational.framework,
      } : undefined,
    };
  }

  return {
    industrySlug: slug,
    industryName: profile.industry_name || profile.industry || slug,
    naicsCode: profile.naics_code || '',

    // Core psychology
    powerWords: ensureStringArray(profile.power_words, 50),
    avoidWords: ensureStringArray(profile.avoid_words, 20),
    customerTriggers,
    urgencyDrivers: ensureStringArray(profile.urgency_drivers, 10),
    transformations,

    // Hooks and templates
    hookLibrary,
    contentTemplates,

    loadedAt: new Date(),
  };
}

/**
 * Ensure we have a string array, handling various input formats
 */
function ensureStringArray(input: unknown, maxLength: number = 50): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .filter((item): item is string => typeof item === 'string')
      .slice(0, maxLength);
  }

  if (typeof input === 'string') {
    return input.split(',').map(s => s.trim()).filter(Boolean).slice(0, maxLength);
  }

  return [];
}

/**
 * Find best matching profile for given criteria
 */
export async function findBestMatch(options: {
  naicsCode?: string;
  industryName?: string;
  keywords?: string[];
}): Promise<string | null> {
  await ensureIndexLoaded();

  // 1. Try exact NAICS match
  if (options.naicsCode) {
    const match = profileIndex.find(p => p.naicsCode === options.naicsCode);
    if (match) return match.slug;

    // Try partial NAICS (first 4 digits)
    const partial = profileIndex.find(p => p.naicsCode.startsWith(options.naicsCode!.slice(0, 4)));
    if (partial) return partial.slug;
  }

  // 2. Try industry name match
  if (options.industryName) {
    const normalized = options.industryName.toLowerCase().trim();

    // Exact match
    const exact = profileIndex.find(p =>
      p.industryName.toLowerCase() === normalized ||
      p.slug === normalized ||
      p.slug === normalized.replace(/\s+/g, '-')
    );
    if (exact) return exact.slug;

    // Partial match
    const partial = profileIndex.find(p =>
      p.industryName.toLowerCase().includes(normalized) ||
      normalized.includes(p.industryName.toLowerCase())
    );
    if (partial) return partial.slug;
  }

  // 3. Try keyword match
  if (options.keywords && options.keywords.length > 0) {
    const normalizedKeywords = options.keywords.map(k => k.toLowerCase());

    let bestMatch: ProfileIndexEntry | null = null;
    let bestScore = 0;

    for (const entry of profileIndex) {
      let score = 0;
      for (const keyword of normalizedKeywords) {
        if (entry.keywords.some(k => k.includes(keyword))) score += 2;
        if (entry.industryName.toLowerCase().includes(keyword)) score += 3;
        if (entry.category.toLowerCase().includes(keyword)) score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= 2) return bestMatch.slug;
  }

  return null;
}

/**
 * Get power words for an industry
 */
export async function getPowerWords(industrySlug: string): Promise<string[]> {
  const psychology = await loadPsychology(industrySlug);
  return psychology?.powerWords || [];
}

/**
 * Get hooks for an industry
 */
export async function getHooks(industrySlug: string, type?: keyof HookLibrary): Promise<string[]> {
  const psychology = await loadPsychology(industrySlug);
  if (!psychology) return [];

  if (type) {
    return psychology.hookLibrary[type] || [];
  }

  // Return all hooks
  return [
    ...psychology.hookLibrary.numberHooks,
    ...psychology.hookLibrary.questionHooks,
    ...psychology.hookLibrary.storyHooks,
    ...psychology.hookLibrary.fearHooks,
    ...psychology.hookLibrary.howtoHooks,
    ...(psychology.hookLibrary.curiosityHooks || []),
    ...(psychology.hookLibrary.authorityHooks || []),
  ];
}

/**
 * Load the profile index from Supabase
 */
async function ensureIndexLoaded(): Promise<void> {
  if (indexLoaded) return;

  if (indexLoadPromise) {
    await indexLoadPromise;
    return;
  }

  indexLoadPromise = (async () => {
    try {
      console.log('[V5 IndustryProfile] Loading profile index...');

      const { data, error } = await supabase
        .from('industry_profiles')
        .select('id, name, naics_code, profile_data')
        .eq('is_active', true);

      if (error || !data) {
        console.error('[V5 IndustryProfile] Failed to load index:', error);
        return;
      }

      profileIndex = data.map(row => {
        const profile = row.profile_data as EnhancedIndustryProfile;
        return {
          slug: row.id,
          industryName: row.name || profile?.industry_name || '',
          naicsCode: row.naics_code || profile?.naics_code || '',
          category: profile?.category || '',
          keywords: extractKeywords(profile),
        };
      });

      indexLoaded = true;
      console.log(`[V5 IndustryProfile] Loaded ${profileIndex.length} profiles in index`);
    } catch (err) {
      console.error('[V5 IndustryProfile] Index load error:', err);
    }
  })();

  await indexLoadPromise;
}

/**
 * Extract keywords from profile for matching
 */
function extractKeywords(profile: EnhancedIndustryProfile | null): string[] {
  if (!profile) return [];

  const keywords: string[] = [];

  if (profile.industry_name) {
    keywords.push(...profile.industry_name.toLowerCase().split(/\s+/));
  }
  if (profile.category) {
    keywords.push(profile.category.toLowerCase());
  }
  if (profile.subcategory) {
    keywords.push(profile.subcategory.toLowerCase());
  }

  // Add first few power words
  if (Array.isArray(profile.power_words)) {
    keywords.push(...profile.power_words.slice(0, 5).map(w => w.toLowerCase()));
  }

  return [...new Set(keywords)];
}

/**
 * Clear cache (for testing or forced refresh)
 */
export function clearCache(): void {
  cache.clear();
  console.log('[V5 IndustryProfile] Cache cleared');
}

/**
 * Get all available industry slugs
 */
export async function getAvailableSlugs(): Promise<string[]> {
  await ensureIndexLoaded();
  return profileIndex.map(p => p.slug);
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const industryProfileService: IIndustryProfileService = {
  loadPsychology,
  findBestMatch,
  getPowerWords,
  getHooks,
};

export default industryProfileService;
