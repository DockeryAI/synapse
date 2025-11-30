/**
 * Enhanced Industry Profile Loader Service
 *
 * Loads and matches 143+ enhanced industry profiles from the brandock output.
 * Provides fuzzy matching by NAICS code, industry name, and keywords.
 *
 * Created: 2025-11-29
 * Source: /Users/byronhudson/brandock/industry-enhancement/output/enhanced-profiles/
 */

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

// Profile index built from available profiles
// This will be populated dynamically or can be pre-built
const PROFILE_INDEX: ProfileIndexEntry[] = [
  // Technology
  { slug: 'app-development', industry: 'App Development', naics_code: '541511', category: 'Technology', subcategory: 'Mobile & Web Applications', keywords: ['mobile app', 'software', 'developer', 'ios', 'android', 'web app'] },
  { slug: 'cloud-services', industry: 'Cloud Services', naics_code: '541512', category: 'Technology', subcategory: 'Cloud Computing', keywords: ['cloud', 'saas', 'aws', 'azure', 'hosting', 'infrastructure'] },
  { slug: 'computer-repair', industry: 'Computer Repair', naics_code: '811212', category: 'Technology', subcategory: 'IT Services', keywords: ['computer repair', 'it support', 'tech support', 'pc repair'] },
  { slug: 'cybersecurity', industry: 'Cybersecurity', naics_code: '541512', category: 'Technology', subcategory: 'Security', keywords: ['security', 'cyber', 'infosec', 'penetration testing', 'vulnerability'] },
  { slug: 'it-consulting', industry: 'IT Consulting', naics_code: '541512', category: 'Technology', subcategory: 'Consulting', keywords: ['it consulting', 'technology consulting', 'systems integration'] },

  // Professional Services
  { slug: 'business-consulting', industry: 'Business Consulting', naics_code: '541611', category: 'Professional Services', subcategory: 'Management Consulting', keywords: ['consultant', 'strategy', 'management', 'advisor', 'coach'] },
  { slug: 'business-law', industry: 'Business Law', naics_code: '541110', category: 'Professional Services', subcategory: 'Legal', keywords: ['lawyer', 'attorney', 'legal', 'law firm', 'corporate law'] },
  { slug: 'bookkeeping-services', industry: 'Bookkeeping Services', naics_code: '541219', category: 'Professional Services', subcategory: 'Accounting', keywords: ['bookkeeping', 'accounting', 'cpa', 'tax', 'financial'] },
  { slug: 'career-coaching', industry: 'Career Coaching', naics_code: '624310', category: 'Professional Services', subcategory: 'Coaching', keywords: ['career', 'coaching', 'resume', 'interview', 'job search'] },
  { slug: 'content-writing', industry: 'Content Writing', naics_code: '541890', category: 'Professional Services', subcategory: 'Creative Services', keywords: ['content', 'copywriting', 'writer', 'blog', 'marketing content'] },

  // Health & Wellness
  { slug: 'acupuncture', industry: 'Acupuncture', naics_code: '621399', category: 'Health & Wellness', subcategory: 'Alternative Medicine', keywords: ['acupuncture', 'chinese medicine', 'holistic', 'wellness'] },
  { slug: 'aesthetics-skincare', industry: 'Aesthetics & Skincare', naics_code: '812111', category: 'Health & Wellness', subcategory: 'Beauty', keywords: ['aesthetics', 'skincare', 'botox', 'facial', 'med spa'] },
  { slug: 'chiropractic', industry: 'Chiropractic', naics_code: '621310', category: 'Health & Wellness', subcategory: 'Healthcare', keywords: ['chiropractor', 'spine', 'back pain', 'adjustment'] },
  { slug: 'cosmetic-dentistry', industry: 'Cosmetic Dentistry', naics_code: '621210', category: 'Health & Wellness', subcategory: 'Dental', keywords: ['dentist', 'cosmetic dentistry', 'veneers', 'whitening', 'smile'] },

  // Food & Beverage
  { slug: 'bakery', industry: 'Bakery', naics_code: '311811', category: 'Food & Beverage', subcategory: 'Specialty Food', keywords: ['bakery', 'bread', 'pastry', 'cake', 'baking'] },
  { slug: 'bar-pub', industry: 'Bar & Pub', naics_code: '722410', category: 'Food & Beverage', subcategory: 'Hospitality', keywords: ['bar', 'pub', 'tavern', 'nightlife', 'cocktail'] },
  { slug: 'brewery-winery', industry: 'Brewery & Winery', naics_code: '312120', category: 'Food & Beverage', subcategory: 'Beverage Manufacturing', keywords: ['brewery', 'winery', 'craft beer', 'wine', 'distillery'] },
  { slug: 'cafe-coffee-shop', industry: 'Cafe & Coffee Shop', naics_code: '722515', category: 'Food & Beverage', subcategory: 'Quick Service', keywords: ['cafe', 'coffee', 'espresso', 'coffee shop', 'barista'] },
  { slug: 'catering-services', industry: 'Catering Services', naics_code: '722320', category: 'Food & Beverage', subcategory: 'Events', keywords: ['catering', 'events', 'wedding catering', 'corporate catering'] },

  // Retail
  { slug: 'bookstore', industry: 'Bookstore', naics_code: '451211', category: 'Retail', subcategory: 'Specialty Retail', keywords: ['bookstore', 'books', 'reading', 'literature'] },
  { slug: 'boutique-clothing-store', industry: 'Boutique Clothing Store', naics_code: '448120', category: 'Retail', subcategory: 'Fashion', keywords: ['boutique', 'clothing', 'fashion', 'apparel', 'designer'] },

  // Automotive
  { slug: 'auto-detailing', industry: 'Auto Detailing', naics_code: '811192', category: 'Automotive', subcategory: 'Services', keywords: ['auto detailing', 'car wash', 'car care', 'detailing'] },
  { slug: 'auto-repair', industry: 'Auto Repair', naics_code: '811111', category: 'Automotive', subcategory: 'Services', keywords: ['auto repair', 'mechanic', 'car repair', 'garage', 'automotive'] },
  { slug: 'car-wash', industry: 'Car Wash', naics_code: '811192', category: 'Automotive', subcategory: 'Services', keywords: ['car wash', 'auto wash', 'vehicle cleaning'] },

  // Home Services
  { slug: 'cleaning-services', industry: 'Cleaning Services', naics_code: '561720', category: 'Home Services', subcategory: 'Janitorial', keywords: ['cleaning', 'maid', 'janitorial', 'house cleaning', 'commercial cleaning'] },
  { slug: 'concrete-contractor', industry: 'Concrete Contractor', naics_code: '238110', category: 'Construction', subcategory: 'Specialty Trade', keywords: ['concrete', 'contractor', 'foundation', 'cement', 'flatwork'] },
  { slug: 'commercial-construction', industry: 'Commercial Construction', naics_code: '236220', category: 'Construction', subcategory: 'General Contractor', keywords: ['construction', 'commercial', 'builder', 'general contractor'] },

  // Personal Care
  { slug: 'barbershop', industry: 'Barbershop', naics_code: '812111', category: 'Personal Care', subcategory: 'Hair Care', keywords: ['barber', 'barbershop', 'haircut', 'mens grooming'] },

  // Hospitality
  { slug: 'bed-breakfast', industry: 'Bed & Breakfast', naics_code: '721191', category: 'Hospitality', subcategory: 'Lodging', keywords: ['bed and breakfast', 'bnb', 'inn', 'lodging', 'guesthouse'] },

  // Education
  { slug: 'after-school-program', industry: 'After School Program', naics_code: '624410', category: 'Education', subcategory: 'Child Services', keywords: ['after school', 'tutoring', 'childcare', 'enrichment'] },

  // Real Estate
  { slug: 'commercial-real-estate', industry: 'Commercial Real Estate', naics_code: '531120', category: 'Real Estate', subcategory: 'Commercial', keywords: ['commercial real estate', 'cre', 'office space', 'retail space', 'industrial'] },

  // Healthcare
  { slug: 'compounding-pharmacy', industry: 'Compounding Pharmacy', naics_code: '446110', category: 'Healthcare', subcategory: 'Pharmacy', keywords: ['pharmacy', 'compounding', 'prescription', 'medications'] },
];

// Cache for loaded profiles
const profileCache = new Map<string, EnhancedIndustryProfile>();

// =============================================================================
// PROFILE PATH CONFIGURATION
// =============================================================================

// Base path to enhanced profiles (in development, this loads from the brandock folder)
// In production, these would be bundled or served from a CDN/API
const PROFILES_BASE_PATH = '/Users/byronhudson/brandock/industry-enhancement/output/enhanced-profiles';

// =============================================================================
// CORE SERVICE FUNCTIONS
// =============================================================================

/**
 * Load a profile by slug
 * Fetches from /industry-profiles/{slug}.json (public folder)
 */
export async function loadProfileBySlug(slug: string): Promise<EnhancedIndustryProfile | null> {
  // Check cache first
  if (profileCache.has(slug)) {
    console.log(`[EnhancedProfileLoader] Using cached profile: ${slug}`);
    return profileCache.get(slug)!;
  }

  try {
    // Fetch from public folder
    const profileUrl = `/industry-profiles/${slug}.json`;
    console.log(`[EnhancedProfileLoader] Fetching profile: ${slug}`);

    const response = await fetch(profileUrl);
    if (!response.ok) {
      console.warn(`[EnhancedProfileLoader] Profile not found: ${slug} (${response.status})`);
      return null;
    }

    const profile = await response.json() as EnhancedIndustryProfile;

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
 */
export function findBestMatch(options: EnhancedProfileMatchOptions): EnhancedProfileLoadResult {
  let bestMatch: ProfileIndexEntry | null = null;
  let bestScore = 0;
  let matchedBy: EnhancedProfileLoadResult['matchedBy'] = null;

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
  getAvailableProfileSlugs,
  getProfilesByCategory,
  searchProfiles,
  getContentGoalOptions,
  getAudienceSegmentOptions,
  getPlatformOptions,
  getRandomHooks,
  getHooksByType,
  PROFILE_INDEX,
};

export default enhancedProfileLoaderService;
