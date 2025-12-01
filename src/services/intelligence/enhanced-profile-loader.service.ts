/**
 * Enhanced Industry Profile Loader Service
 *
 * Loads and matches 376+ enhanced industry profiles from Supabase.
 * Provides fuzzy matching by NAICS code, industry name, and keywords.
 *
 * Created: 2025-11-29
 * Updated: 2025-11-30 - Switched from local files to Supabase storage
 * Source: Supabase industry_profiles table (migrated from brandock output)
 */

import { supabase } from '@/lib/supabase';
import type {
  EnhancedIndustryProfile,
  EnhancedProfileLoadResult,
  EnhancedProfileMatchOptions,
  EnhancedContentGoalOption,
  EnhancedAudienceSegmentOption,
  EnhancedPlatformOption,
} from '@/types/industry-profile.types';

// =============================================================================
// PROFILE INDEX (slug -> metadata for fast lookup)
// =============================================================================

interface ProfileIndexEntry {
  slug: string;
  industry: string;
  naics_code: string;
  category: string;
  subcategory: string;
  keywords: string[];
}

// Dynamic profile index - loaded from Supabase on first access
let PROFILE_INDEX: ProfileIndexEntry[] = [];
let indexLoaded = false;
let indexLoadPromise: Promise<void> | null = null;

// Cache for loaded profiles
const profileCache = new Map<string, EnhancedIndustryProfile>();

// =============================================================================
// INDEX LOADING FROM SUPABASE
// =============================================================================

/**
 * Load the profile index from Supabase (lazy, one-time)
 */
async function ensureIndexLoaded(): Promise<void> {
  if (indexLoaded) return;

  // Prevent concurrent loads
  if (indexLoadPromise) {
    await indexLoadPromise;
    return;
  }

  indexLoadPromise = (async () => {
    try {
      console.log('[EnhancedProfileLoader] Loading profile index from Supabase...');

      const { data, error } = await supabase
        .from('industry_profiles')
        .select('id, name, naics_code, profile_data')
        .eq('is_active', true);

      if (error) {
        console.error('[EnhancedProfileLoader] Failed to load index from Supabase:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('[EnhancedProfileLoader] No profiles found in Supabase');
        return;
      }

      // Build index from Supabase data
      PROFILE_INDEX = data.map(row => {
        const profileData = row.profile_data as EnhancedIndustryProfile;
        return {
          slug: row.id,
          industry: row.name || profileData?.industry_name || '',
          naics_code: row.naics_code || profileData?.naics_code || '',
          category: profileData?.category || '',
          subcategory: profileData?.subcategory || '',
          keywords: extractKeywords(profileData),
        };
      });

      indexLoaded = true;
      console.log(`[EnhancedProfileLoader] Loaded ${PROFILE_INDEX.length} profiles from Supabase`);
    } catch (err) {
      console.error('[EnhancedProfileLoader] Error loading index:', err);
    }
  })();

  await indexLoadPromise;
}

/**
 * Extract keywords from profile data for matching
 */
function extractKeywords(profile: EnhancedIndustryProfile | null): string[] {
  if (!profile) return [];

  const keywords: string[] = [];

  // Add industry name words
  if (profile.industry_name) {
    keywords.push(...profile.industry_name.toLowerCase().split(/\s+/));
  }

  // Add category and subcategory
  if (profile.category) keywords.push(profile.category.toLowerCase());
  if (profile.subcategory) keywords.push(profile.subcategory.toLowerCase());

  // Add power words (first 5) - handle both string and array formats
  if (profile.power_words) {
    const powerWordsArray = Array.isArray(profile.power_words)
      ? profile.power_words
      : typeof profile.power_words === 'string'
        ? profile.power_words.split(',').map((s: string) => s.trim())
        : [];
    keywords.push(...powerWordsArray.slice(0, 5).map((w: string) => w.toLowerCase()));
  }

  return [...new Set(keywords)]; // Deduplicate
}

// =============================================================================
// CORE SERVICE FUNCTIONS
// =============================================================================

/**
 * Load a profile by slug from Supabase
 */
export async function loadProfileBySlug(slug: string): Promise<EnhancedIndustryProfile | null> {
  // Check cache first
  if (profileCache.has(slug)) {
    console.log(`[EnhancedProfileLoader] Using cached profile: ${slug}`);
    return profileCache.get(slug)!;
  }

  try {
    console.log(`[EnhancedProfileLoader] Fetching profile from Supabase: ${slug}`);

    const { data, error } = await supabase
      .from('industry_profiles')
      .select('profile_data')
      .eq('id', slug)
      .single();

    if (error) {
      console.warn(`[EnhancedProfileLoader] Profile not found: ${slug}`, error.message);
      return null;
    }

    if (!data?.profile_data) {
      console.warn(`[EnhancedProfileLoader] Profile ${slug} has no profile_data`);
      return null;
    }

    const profile = data.profile_data as EnhancedIndustryProfile;

    // Cache the loaded profile
    profileCache.set(slug, profile);
    console.log(`[EnhancedProfileLoader] Loaded and cached profile: ${slug}`);

    return profile;
  } catch (error) {
    console.error(`[EnhancedProfileLoader] Failed to load profile ${slug}:`, error);
    return null;
  }
}

/**
 * Find the best matching profile for a brand
 * Note: This is now sync but requires ensureIndexLoaded() to be called first
 * For async usage, call ensureIndexLoaded() before calling findBestMatch()
 */
export function findBestMatch(options: EnhancedProfileMatchOptions): EnhancedProfileLoadResult {
  let bestMatch: ProfileIndexEntry | null = null;
  let bestScore = 0;
  let matchedBy: EnhancedProfileLoadResult['matchedBy'] = null;

  // If index not loaded, return no match (caller should have awaited ensureIndexLoaded)
  if (!indexLoaded || PROFILE_INDEX.length === 0) {
    console.warn('[EnhancedProfileLoader] findBestMatch called before index loaded');
    return {
      profile: null,
      matched: false,
      matchedBy: null,
      confidence: 0,
    };
  }

  // 1. Try exact NAICS match (highest confidence)
  if (options.naicsCode) {
    const naicsMatch = PROFILE_INDEX.find(p => p.naics_code === options.naicsCode);
    if (naicsMatch) {
      return {
        profile: null, // Will be loaded async
        matched: true,
        matchedBy: 'naics',
        confidence: 0.95,
        slug: naicsMatch.slug,
      };
    }

    // Try partial NAICS match (first 4 digits)
    const partialNaics = options.naicsCode.slice(0, 4);
    const partialMatch = PROFILE_INDEX.find(p => p.naics_code.startsWith(partialNaics));
    if (partialMatch && 0.8 > bestScore) {
      bestMatch = partialMatch;
      bestScore = 0.8;
      matchedBy = 'naics';
    }
  }

  // 2. Try industry name match
  if (options.industryName) {
    const normalizedInput = options.industryName.toLowerCase().trim();

    for (const entry of PROFILE_INDEX) {
      const normalizedIndustry = entry.industry.toLowerCase();

      // Exact match
      if (normalizedIndustry === normalizedInput) {
        return {
          profile: null,
          matched: true,
          matchedBy: 'industry_name',
          confidence: 0.95,
          slug: entry.slug,
        };
      }

      // Partial match
      if (normalizedIndustry.includes(normalizedInput) || normalizedInput.includes(normalizedIndustry)) {
        const score = 0.7 + (0.2 * Math.min(normalizedIndustry.length, normalizedInput.length) / Math.max(normalizedIndustry.length, normalizedInput.length));
        if (score > bestScore) {
          bestMatch = entry;
          bestScore = score;
          matchedBy = 'industry_name';
        }
      }
    }
  }

  // 3. Try keyword match
  if (options.keywords && options.keywords.length > 0) {
    const normalizedKeywords = options.keywords.map(k => k.toLowerCase().trim());

    for (const entry of PROFILE_INDEX) {
      let keywordScore = 0;
      for (const keyword of normalizedKeywords) {
        if (entry.keywords.some(k => k.includes(keyword) || keyword.includes(k))) {
          keywordScore += 1;
        }
        if (entry.industry.toLowerCase().includes(keyword)) {
          keywordScore += 0.5;
        }
        if (entry.category.toLowerCase().includes(keyword)) {
          keywordScore += 0.3;
        }
      }

      const normalizedScore = 0.5 + (0.4 * Math.min(keywordScore, normalizedKeywords.length) / normalizedKeywords.length);
      if (normalizedScore > bestScore) {
        bestMatch = entry;
        bestScore = normalizedScore;
        matchedBy = 'keyword';
      }
    }
  }

  // 4. Try category match
  if (options.category && !bestMatch) {
    const normalizedCategory = options.category.toLowerCase().trim();
    const categoryMatch = PROFILE_INDEX.find(p =>
      p.category.toLowerCase() === normalizedCategory ||
      p.subcategory.toLowerCase() === normalizedCategory
    );
    if (categoryMatch) {
      bestMatch = categoryMatch;
      bestScore = 0.5;
      matchedBy = 'category';
    }
  }

  if (bestMatch) {
    return {
      profile: null,
      matched: true,
      matchedBy,
      confidence: bestScore,
      slug: bestMatch.slug,
    };
  }

  // No match found
  return {
    profile: null,
    matched: false,
    matchedBy: null,
    confidence: 0,
  };
}

/**
 * Async wrapper that ensures index is loaded before matching
 */
export async function findBestMatchAsync(options: EnhancedProfileMatchOptions): Promise<EnhancedProfileLoadResult> {
  await ensureIndexLoaded();
  return findBestMatch(options);
}

/**
 * Get all available profile slugs
 */
export function getAvailableProfileSlugs(): string[] {
  return PROFILE_INDEX.map(p => p.slug);
}

/**
 * Get profiles by category
 */
export function getProfilesByCategory(category: string): ProfileIndexEntry[] {
  return PROFILE_INDEX.filter(p =>
    p.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Search profiles by query
 */
export function searchProfiles(query: string, limit = 10): ProfileIndexEntry[] {
  const normalizedQuery = query.toLowerCase().trim();

  const scored = PROFILE_INDEX.map(entry => {
    let score = 0;

    if (entry.industry.toLowerCase().includes(normalizedQuery)) score += 10;
    if (entry.category.toLowerCase().includes(normalizedQuery)) score += 5;
    if (entry.subcategory.toLowerCase().includes(normalizedQuery)) score += 5;
    entry.keywords.forEach(k => {
      if (k.includes(normalizedQuery)) score += 2;
    });

    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

// =============================================================================
// DROPDOWN ENHANCEMENT HELPERS
// =============================================================================

/**
 * Get industry-enhanced content goal options
 */
export function getContentGoalOptions(profile: EnhancedIndustryProfile): EnhancedContentGoalOption[] {
  const templates = profile.content_templates;

  return [
    {
      id: 'educate',
      label: 'Educate',
      subtext: templates.linkedin?.educational?.hook?.slice(0, 50) || 'Share knowledge and insights',
      industryTheme: profile.transformations[0]?.to || 'Industry expertise',
    },
    {
      id: 'engage',
      label: 'Engage',
      subtext: 'Start conversations and build community',
      industryTheme: profile.customer_triggers[0]?.trigger?.slice(0, 50) || 'Community building',
    },
    {
      id: 'promote',
      label: 'Promote',
      subtext: templates.linkedin?.promotional?.hook?.slice(0, 50) || 'Showcase your solutions',
      industryTheme: profile.transformations[0]?.emotional_value || 'Value delivery',
    },
    {
      id: 'trust',
      label: 'Build Trust',
      subtext: templates.linkedin?.case_study?.hook?.slice(0, 50) || 'Social proof and credibility',
      industryTheme: profile.risk_reversal.proof_points[0] || 'Proven results',
    },
    {
      id: 'action',
      label: 'Drive Action',
      subtext: profile.headline_templates[0]?.template?.slice(0, 50) || 'Convert interest to action',
      industryTheme: profile.urgency_drivers[0]?.slice(0, 50) || 'Time-sensitive opportunity',
    },
  ];
}

/**
 * Get industry-enhanced audience segment options
 */
export function getAudienceSegmentOptions(profile: EnhancedIndustryProfile): EnhancedAudienceSegmentOption[] {
  const triggers = profile.customer_triggers;

  return [
    {
      id: 'decision_makers',
      label: 'Decision Makers',
      subtext: triggers[0]?.trigger?.slice(0, 60) || 'C-suite and executives',
      trigger: triggers[0]?.trigger,
    },
    {
      id: 'influencers',
      label: 'Influencers',
      subtext: triggers[1]?.trigger?.slice(0, 60) || 'Key stakeholders',
      trigger: triggers[1]?.trigger,
    },
    {
      id: 'pain_aware',
      label: 'Pain Aware',
      subtext: triggers[2]?.trigger?.slice(0, 60) || 'Actively seeking solutions',
      trigger: triggers[2]?.trigger,
    },
    {
      id: 'solution_ready',
      label: 'Solution Ready',
      subtext: triggers[3]?.trigger?.slice(0, 60) || 'Ready to buy',
      trigger: triggers[3]?.trigger,
    },
  ];
}

/**
 * Get industry-enhanced platform options
 */
export function getPlatformOptions(profile: EnhancedIndustryProfile): EnhancedPlatformOption[] {
  const templates = profile.content_templates;

  return [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      hasTemplates: !!templates.linkedin,
      recommended: true,
      bestFormat: 'long-form posts, carousels',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      hasTemplates: !!templates.instagram,
      recommended: false,
      bestFormat: 'reels, carousels',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      hasTemplates: !!templates.tiktok,
      recommended: false,
      bestFormat: 'short video',
    },
    {
      id: 'twitter',
      label: 'Twitter/X',
      hasTemplates: !!templates.twitter,
      recommended: false,
      bestFormat: 'threads, quick takes',
    },
    {
      id: 'email',
      label: 'Email',
      hasTemplates: !!templates.email,
      recommended: false,
      bestFormat: 'newsletters, sequences',
    },
  ];
}

// =============================================================================
// HOOK HELPERS
// =============================================================================

/**
 * Get random hooks from the library
 */
export function getRandomHooks(profile: EnhancedIndustryProfile, count = 3): string[] {
  const allHooks = [
    ...(profile.hook_library.number_hooks || []),
    ...(profile.hook_library.question_hooks || []),
    ...(profile.hook_library.story_hooks || []),
    ...(profile.hook_library.fear_hooks || []),
    ...(profile.hook_library.howto_hooks || []),
  ];

  const shuffled = allHooks.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get hooks by type
 */
export function getHooksByType(profile: EnhancedIndustryProfile, type: keyof EnhancedIndustryProfile['hook_library']): string[] {
  return profile.hook_library[type] || [];
}

// =============================================================================
// EXPORT SERVICE SINGLETON
// =============================================================================

export const enhancedProfileLoaderService = {
  loadProfileBySlug,
  findBestMatch,
  findBestMatchAsync,
  ensureIndexLoaded,
  getAvailableProfileSlugs,
  getProfilesByCategory,
  searchProfiles,
  getContentGoalOptions,
  getAudienceSegmentOptions,
  getPlatformOptions,
  getRandomHooks,
  getHooksByType,
  getProfileIndex: () => PROFILE_INDEX,
};

export { ensureIndexLoaded };
export default enhancedProfileLoaderService;
