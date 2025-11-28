/**
 * Enhanced Industry Profile Loader
 *
 * Loads the 138 AI-generated enhanced industry profiles from JSON.
 * These profiles include:
 * - Research-backed hooks and templates
 * - Customer language dictionaries
 * - Campaign templates with seasonal patterns
 * - Content templates for multiple platforms
 * - UGC prompts and viral triggers
 */

export interface EnhancedProfileIndex {
  id: string;
  name: string;
  naics: string;
  category: string;
}

export interface EnhancedIndustryProfile {
  industry: string;
  industry_name: string;
  naics_code: string;
  category: string;
  subcategory: string;
  customer_triggers: string[];
  customer_journey: Record<string, unknown>;
  transformations: Record<string, unknown>;
  success_metrics: string[];
  urgency_drivers: string[];
  objection_handlers: Record<string, string>;
  risk_reversal: string[];
  customer_language_dictionary: Record<string, string[]>;
  power_words: string[];
  avoid_words: string[];
  headline_templates: string[];
  cta_templates: string[];
  social_post_templates: Record<string, unknown>;
  value_propositions: string[];
  messaging_frameworks: Record<string, unknown>;
  trust_signals: string[];
  social_proof_statistics: string[];
  quality_indicators: string[];
  testimonial_capture_timing: string[];
  competitive_advantages: string[];
  pricing_psychology: Record<string, unknown>;
  seasonal_patterns: Record<string, unknown>;
  weekly_patterns: Record<string, unknown>;
  monthly_patterns: Record<string, unknown>;
  peak_crisis_times: string[];
  service_packages: Record<string, unknown>;
  upsell_paths: string[];
  retention_hooks: string[];
  referral_strategies: string[];
  research_brief: {
    top_performing_examples: Array<{
      hook: string;
      source: string;
      why_it_works: string;
    }>;
    platform_benchmarks: Array<{
      platform: string;
      avg_engagement: string;
      best_content_type: string;
    }>;
    proven_hooks: string[];
    customer_voice: {
      problem_phrases: string[];
      solution_phrases: string[];
      sources: string[];
    };
    competitive_gaps: string[];
  };
  campaign_templates: Record<string, {
    name: string;
    duration: string;
    posts_per_week: number;
    industry_themes: string[];
    content_mix: Record<string, number>;
    sample_posts: Array<{
      day: number;
      type: string;
      hook: string;
      body: string;
      cta: string;
    }>;
  }>;
  content_templates: Record<string, Record<string, Array<{
    hook: string;
    body: string;
    cta: string;
  }>>>;
  hook_library: Record<string, string[]>;
  video_scripts: Record<string, {
    hook: string;
    body: string;
    cta: string;
  }>;
  ugc_prompts: Array<{
    prompt: string;
    hashtag: string;
  }>;
  viral_triggers: Array<{
    angle: string;
    why: string;
  }>;
  freshness_metadata: {
    generated_at: string;
    version: string;
    source: string;
  };
}

class EnhancedProfileLoaderService {
  private cache: Map<string, EnhancedIndustryProfile> = new Map();
  private indexCache: EnhancedProfileIndex[] | null = null;
  private readonly basePath = '/data/enhanced-profiles';

  /**
   * Load the profile index (lightweight metadata for all profiles)
   */
  async loadIndex(): Promise<EnhancedProfileIndex[]> {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const response = await fetch(`${this.basePath}/index.json`);
      if (!response.ok) {
        throw new Error(`Failed to load index: ${response.status}`);
      }
      this.indexCache = await response.json();
      return this.indexCache!;
    } catch (error) {
      console.error('Failed to load enhanced profile index:', error);
      return [];
    }
  }

  /**
   * Load a specific profile by ID
   */
  async loadProfile(profileId: string): Promise<EnhancedIndustryProfile | null> {
    // Check cache first
    if (this.cache.has(profileId)) {
      return this.cache.get(profileId)!;
    }

    try {
      const response = await fetch(`${this.basePath}/${profileId}.json`);
      if (!response.ok) {
        console.warn(`Profile ${profileId} not found: ${response.status}`);
        return null;
      }
      const profile = await response.json();
      this.cache.set(profileId, profile);
      return profile;
    } catch (error) {
      console.error(`Failed to load profile ${profileId}:`, error);
      return null;
    }
  }

  /**
   * Find profile by NAICS code (matches prefix)
   */
  async findByNaics(naicsCode: string): Promise<EnhancedIndustryProfile | null> {
    const index = await this.loadIndex();
    const match = index.find(p =>
      naicsCode.startsWith(p.naics) || p.naics.startsWith(naicsCode)
    );
    if (!match) return null;
    return this.loadProfile(match.id);
  }

  /**
   * Search profiles by name or category
   */
  async search(query: string): Promise<EnhancedProfileIndex[]> {
    const index = await this.loadIndex();
    const lowerQuery = query.toLowerCase();
    return index.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all profiles in a category
   */
  async getByCategory(category: string): Promise<EnhancedProfileIndex[]> {
    const index = await this.loadIndex();
    return index.filter(p => p.category === category);
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const index = await this.loadIndex();
    return Array.from(new Set(index.map(p => p.category)));
  }

  /**
   * Get hooks for a specific profile
   */
  async getHooks(profileId: string): Promise<Record<string, string[]> | null> {
    const profile = await this.loadProfile(profileId);
    return profile?.hook_library || null;
  }

  /**
   * Get campaign templates for a profile
   */
  async getCampaignTemplates(profileId: string): Promise<Record<string, unknown> | null> {
    const profile = await this.loadProfile(profileId);
    return profile?.campaign_templates || null;
  }

  /**
   * Get content templates for a profile and platform
   */
  async getContentTemplates(
    profileId: string,
    platform: 'instagram' | 'linkedin' | 'twitter'
  ): Promise<Record<string, Array<{ hook: string; body: string; cta: string }>> | null> {
    const profile = await this.loadProfile(profileId);
    return profile?.content_templates?.[platform] || null;
  }

  /**
   * Get research brief for a profile
   */
  async getResearchBrief(profileId: string): Promise<EnhancedIndustryProfile['research_brief'] | null> {
    const profile = await this.loadProfile(profileId);
    return profile?.research_brief || null;
  }

  /**
   * Get customer language dictionary
   */
  async getCustomerLanguage(profileId: string): Promise<Record<string, string[]> | null> {
    const profile = await this.loadProfile(profileId);
    return profile?.customer_language_dictionary || null;
  }

  /**
   * Clear cache (useful for testing or refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.indexCache = null;
  }

  /**
   * Preload profiles (for better UX)
   */
  async preloadProfiles(profileIds: string[]): Promise<void> {
    await Promise.all(profileIds.map(id => this.loadProfile(id)));
  }
}

export const enhancedProfileLoader = new EnhancedProfileLoaderService();
