/**
 * Business Profile Resolver Service
 *
 * Single resolver that merges:
 * - Business segment (B2B/SMB + scope)
 * - Industry profile (from enhanced profiles)
 * - Competitor intelligence (from Perplexity)
 *
 * Returns unified feature set for dashboard consumption.
 * Config-driven, not code-driven - add industries by adding JSON, not code.
 */

import { enhancedProfileLoader, EnhancedIndustryProfile } from '../industry/enhanced-profile-loader.service';
import { detectSegment, BusinessSegment } from '@/components/dashboard/SegmentAwarePanel';
import type { DeepContext } from '@/types/synapse/deepContext.types';

/**
 * Competitor information discovered via Perplexity
 */
export interface DiscoveredCompetitor {
  name: string;
  description?: string;
  weaknesses?: string[];
  strengths?: string[];
  differentiator?: string;
}

/**
 * Gap with competitor context
 */
export interface CompetitorAwareGap {
  id: string;
  title: string;
  description: string;
  theVoid: string;        // What competitors don't address
  theDemand: string;      // Evidence of customer need
  yourAngle: string;      // How UVP addresses this
  competitors: string[];  // Which competitors this gap relates to
  confidence: number;
  source: 'profile' | 'perplexity' | 'uvp-correlation';

  // Customer context - who this gap applies to
  customerProfiles?: {
    segment: string;        // e.g., "Enterprise IT Leaders", "SMB Owners"
    painPoint: string;      // Specific pain this gap addresses for them
    readiness: 'high' | 'medium' | 'low'; // How ready they are to act
  }[];

  // Offerings context - which products/services address this gap
  applicableOfferings?: {
    offering: string;       // Product/service name or category
    fit: 'direct' | 'partial' | 'adjacent'; // How well it addresses the gap
    positioning: string;    // How to position against this gap
  }[];

  // Provenance - source evidence and quotes
  provenance?: {
    sourceType: string;     // 'reddit' | 'g2' | 'google-reviews' | 'industry-profile' | etc.
    sourceUrl?: string;     // Direct link if available
    quotes: string[];       // Actual quotes from the source
    sampleSize?: number;    // How many data points support this
    timestamp?: string;     // When this was observed
  };
}

/**
 * Resolved business profile with all merged data
 */
export interface ResolvedBusinessProfile {
  // Segment info
  segment: BusinessSegment;
  segmentLabel: string;

  // Industry profile
  industryProfile: EnhancedIndustryProfile | null;
  industryProfileId: string | null;

  // Competitors
  competitors: DiscoveredCompetitor[];

  // Competitor-aware gaps
  gaps: CompetitorAwareGap[];

  // Content assets from profile
  hooks: Record<string, string[]>;
  campaignTemplates: Record<string, unknown>;
  contentTemplates: Record<string, unknown>;
  customerTriggers: Array<{ trigger: string; urgency: number }>;
  competitiveAdvantages: string[];

  // Feature flags based on segment
  features: {
    showCompetitorWatch: boolean;
    showG2Reviews: boolean;
    showLinkedInInsights: boolean;
    showLocalSEO: boolean;
    showWeatherHooks: boolean;
    platformWeights: Record<string, number>;
  };

  // Metadata
  resolvedAt: string;
  profileSource: 'enhanced-profile' | 'fallback' | 'none';
}

/**
 * Segment labels for display
 */
const SEGMENT_LABELS: Record<BusinessSegment, string> = {
  smb_local: 'Local Business',
  smb_regional: 'Regional Business',
  b2b_national: 'B2B National',
  b2b_global: 'B2B Global',
};

/**
 * Platform weights by segment (where to prioritize content)
 */
const PLATFORM_WEIGHTS: Record<BusinessSegment, Record<string, number>> = {
  smb_local: {
    facebook: 0.35,
    instagram: 0.30,
    google_business: 0.25,
    tiktok: 0.10,
  },
  smb_regional: {
    facebook: 0.30,
    instagram: 0.30,
    linkedin: 0.20,
    tiktok: 0.20,
  },
  b2b_national: {
    linkedin: 0.45,
    twitter: 0.25,
    blog: 0.20,
    youtube: 0.10,
  },
  b2b_global: {
    linkedin: 0.50,
    blog: 0.25,
    twitter: 0.15,
    youtube: 0.10,
  },
};

/**
 * Industry keyword to profile ID mapping
 */
const INDUSTRY_PROFILE_MAP: Record<string, string> = {
  // Software & Tech
  'software': 'software-development',
  'saas': 'software-development',
  'platform': 'software-development',
  'ai': 'software-development',
  'conversational': 'software-development',
  'chatbot': 'software-development',
  'app': 'app-development',
  'mobile': 'app-development',
  'it consulting': 'it-consulting',
  'msp': 'msp-managed-service-provider',
  'managed service': 'msp-managed-service-provider',

  // Professional Services
  'consulting': 'business-consulting',
  'marketing': 'marketing-consulting',
  'hr': 'hr-consulting',
  'leadership': 'leadership-development',

  // Other common
  'restaurant': 'fast-casual-restaurant',
  'fine dining': 'fine-dining-restaurant',
  'hotel': 'hotel-motel',
  'real estate': 'residential-real-estate',
  'cpa': 'cpa-firm',
  'accounting': 'cpa-firm',
  'car wash': 'car-wash',
  'auto': 'auto-repair',
};

class BusinessProfileResolverService {
  private cache: Map<string, ResolvedBusinessProfile> = new Map();

  /**
   * Main resolver function - merges segment + profile + competitors
   */
  async resolve(
    context: DeepContext | null,
    uvp?: { competitors?: string[]; unique_solution?: string; key_benefit?: string }
  ): Promise<ResolvedBusinessProfile> {
    const cacheKey = this.getCacheKey(context);

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('[BusinessProfileResolver] Using cached profile');
      return this.cache.get(cacheKey)!;
    }

    console.log('[BusinessProfileResolver] Resolving business profile...');

    // Step 1: Detect segment
    const segment = detectSegment(context);
    console.log('[BusinessProfileResolver] Detected segment:', segment);

    // Step 2: Find matching industry profile
    const industryProfile = await this.findIndustryProfile(context);
    console.log('[BusinessProfileResolver] Industry profile:', industryProfile?.industry || 'none');

    // Step 3: Extract competitors (from UVP or context)
    const competitors = this.extractCompetitors(context, uvp);

    // Step 4: Generate competitor-aware gaps
    const gaps = this.generateGaps(context, industryProfile, competitors, uvp);

    // Step 5: Build resolved profile
    const resolved: ResolvedBusinessProfile = {
      segment,
      segmentLabel: SEGMENT_LABELS[segment],
      industryProfile,
      industryProfileId: industryProfile?.industry?.toLowerCase().replace(/\s+/g, '-') || null,
      competitors,
      gaps,
      hooks: industryProfile?.hook_library || {},
      campaignTemplates: industryProfile?.campaign_templates || {},
      contentTemplates: industryProfile?.content_templates || {},
      customerTriggers: this.parseCustomerTriggers(industryProfile?.customer_triggers),
      competitiveAdvantages: industryProfile?.competitive_advantages || [],
      features: this.getFeatureFlags(segment),
      resolvedAt: new Date().toISOString(),
      profileSource: industryProfile ? 'enhanced-profile' : 'none',
    };

    // Cache the result
    this.cache.set(cacheKey, resolved);

    return resolved;
  }

  /**
   * Find matching industry profile based on context
   */
  private async findIndustryProfile(context: DeepContext | null): Promise<EnhancedIndustryProfile | null> {
    if (!context?.business?.profile?.industry) {
      return null;
    }

    const industry = context.business.profile.industry.toLowerCase();

    // Try direct match from map
    for (const [keyword, profileId] of Object.entries(INDUSTRY_PROFILE_MAP)) {
      if (industry.includes(keyword)) {
        const profile = await enhancedProfileLoader.loadProfile(profileId);
        if (profile) return profile;
      }
    }

    // Try search by industry name
    const searchResults = await enhancedProfileLoader.search(industry);
    if (searchResults.length > 0) {
      return enhancedProfileLoader.loadProfile(searchResults[0].id);
    }

    // Try by NAICS if available
    const naicsCode = context.business?.profile?.naicsCode;
    if (naicsCode) {
      const profile = await enhancedProfileLoader.findByNaics(naicsCode);
      if (profile) return profile;
    }

    // Default to software-development for B2B/tech
    if (this.looksLikeTech(industry)) {
      return enhancedProfileLoader.loadProfile('software-development');
    }

    return null;
  }

  /**
   * Check if industry looks like tech/software
   */
  private looksLikeTech(industry: string): boolean {
    const techKeywords = [
      'software', 'saas', 'platform', 'tech', 'digital', 'ai',
      'machine learning', 'automation', 'cloud', 'data', 'analytics',
      'enterprise', 'b2b', 'api', 'integration'
    ];
    return techKeywords.some(kw => industry.includes(kw));
  }

  /**
   * Extract competitors from UVP or context
   */
  private extractCompetitors(
    context: DeepContext | null,
    uvp?: { competitors?: string[] }
  ): DiscoveredCompetitor[] {
    const competitors: DiscoveredCompetitor[] = [];

    // From UVP
    if (uvp?.competitors) {
      competitors.push(...uvp.competitors.map(name => ({ name })));
    }

    // From DeepContext competitive intel
    if (context?.competitiveIntel?.opportunities) {
      context.competitiveIntel.opportunities.forEach(opp => {
        if (opp.gap && !competitors.find(c => c.name === opp.gap)) {
          competitors.push({
            name: opp.gap,
            description: opp.positioning,
          });
        }
      });
    }

    // From blind spots
    if (context?.competitiveIntel?.blindSpots) {
      context.competitiveIntel.blindSpots.forEach(bs => {
        if (bs.topic && bs.topic.includes(' vs ')) {
          const parts = bs.topic.split(' vs ');
          parts.forEach(part => {
            const name = part.trim();
            if (name && !competitors.find(c => c.name === name)) {
              competitors.push({ name });
            }
          });
        }
      });
    }

    return competitors.slice(0, 10); // Limit to 10
  }

  /**
   * Generate competitor-aware gaps
   */
  private generateGaps(
    context: DeepContext | null,
    profile: EnhancedIndustryProfile | null,
    competitors: DiscoveredCompetitor[],
    uvp?: { unique_solution?: string; key_benefit?: string }
  ): CompetitorAwareGap[] {
    const gaps: CompetitorAwareGap[] = [];

    // Extract target customer from UVP context for customer profiles
    const targetCustomer = context?.business?.uvp?.targetCustomer || 'Target Customers';
    const customerProblem = context?.business?.uvp?.customerProblem || '';

    // From profile's competitive_gaps in research_brief
    if (profile?.research_brief?.competitive_gaps) {
      profile.research_brief.competitive_gaps.forEach((gap, idx) => {
        const problemPhrase = profile.research_brief.customer_voice?.problem_phrases?.[idx];
        gaps.push({
          id: `profile-gap-${idx}`,
          title: this.extractGapTitle(gap),
          description: gap,
          theVoid: gap,
          theDemand: problemPhrase || 'Market demand identified',
          yourAngle: uvp?.unique_solution || 'Your solution addresses this gap',
          competitors: competitors.slice(0, 3).map(c => c.name),
          confidence: 0.8,
          source: 'profile',
          customerProfiles: [
            {
              segment: targetCustomer,
              painPoint: customerProblem || gap,
              readiness: 'high',
            }
          ],
          applicableOfferings: uvp?.unique_solution ? [
            {
              offering: profile.industry || 'Core Solution',
              fit: 'direct',
              positioning: uvp.unique_solution,
            }
          ] : undefined,
          provenance: {
            sourceType: 'industry-profile',
            quotes: problemPhrase ? [problemPhrase] : [gap],
            timestamp: new Date().toISOString(),
          },
        });
      });
    }

    // From profile's competitive_advantages (inverse = competitor weakness)
    if (profile?.competitive_advantages) {
      profile.competitive_advantages.slice(0, 3).forEach((adv, idx) => {
        const triggerText = profile.customer_triggers?.[idx]?.toString() || 'Customer need identified';
        gaps.push({
          id: `advantage-gap-${idx}`,
          title: `Competitive Edge: ${this.truncate(adv, 50)}`,
          description: adv,
          theVoid: `Competitors lack: ${adv}`,
          theDemand: triggerText,
          yourAngle: uvp?.key_benefit || adv,
          competitors: competitors.slice(0, 2).map(c => c.name),
          confidence: 0.75,
          source: 'profile',
          customerProfiles: [
            {
              segment: targetCustomer,
              painPoint: `Need for: ${adv}`,
              readiness: 'medium',
            }
          ],
          applicableOfferings: [
            {
              offering: profile.industry || 'Differentiated Solution',
              fit: 'direct',
              positioning: adv,
            }
          ],
          provenance: {
            sourceType: 'industry-profile',
            quotes: [triggerText],
            timestamp: new Date().toISOString(),
          },
        });
      });
    }

    // From DeepContext blind spots
    if (context?.competitiveIntel?.blindSpots) {
      context.competitiveIntel.blindSpots.slice(0, 3).forEach((bs, idx) => {
        // Extract evidence quotes
        const evidenceQuotes: string[] = [];
        if (bs.evidence) {
          if (Array.isArray(bs.evidence)) {
            evidenceQuotes.push(...bs.evidence);
          } else {
            evidenceQuotes.push(bs.evidence);
          }
        }
        if (bs.reasoning) {
          evidenceQuotes.push(bs.reasoning);
        }

        gaps.push({
          id: `blindspot-gap-${idx}`,
          title: bs.topic || 'Market Blind Spot',
          description: bs.reasoning || bs.topic || '',
          theVoid: bs.reasoning || 'Competitors not addressing this area',
          theDemand: bs.actionableInsight || 'Opportunity identified',
          yourAngle: uvp?.unique_solution || 'Position to fill this gap',
          competitors: [],
          confidence: (bs.opportunityScore || 60) / 100,
          source: 'uvp-correlation',
          customerProfiles: [
            {
              segment: targetCustomer,
              painPoint: bs.topic || 'Unaddressed market need',
              readiness: bs.opportunityScore && bs.opportunityScore > 70 ? 'high' : 'medium',
            }
          ],
          provenance: {
            sourceType: bs.source || 'market-analysis',
            quotes: evidenceQuotes.length > 0 ? evidenceQuotes : [bs.topic || 'Market blind spot identified'],
            sampleSize: bs.sampleSize,
            timestamp: bs.timestamp || new Date().toISOString(),
          },
        });
      });
    }

    // From customer psychology unarticulated needs
    if (context?.customerPsychology?.unarticulated) {
      context.customerPsychology.unarticulated.slice(0, 2).forEach((need, idx) => {
        // Handle evidence which can be string or string[]
        const evidenceQuotes: string[] = [];
        if (need.evidence) {
          if (Array.isArray(need.evidence)) {
            evidenceQuotes.push(...need.evidence);
          } else {
            evidenceQuotes.push(need.evidence);
          }
        }

        gaps.push({
          id: `unarticulated-gap-${idx}`,
          title: `Unmet Need: ${this.truncate(need.need || '', 50)}`,
          description: need.need || '',
          theVoid: 'Market not addressing this need',
          theDemand: evidenceQuotes.join('; ') || need.emotionalDriver || 'Customer need',
          yourAngle: uvp?.key_benefit || 'Your solution addresses this',
          competitors: competitors.slice(0, 2).map(c => c.name),
          confidence: need.confidence || 0.65,
          source: 'uvp-correlation',
          customerProfiles: [
            {
              segment: targetCustomer,
              painPoint: need.need || 'Unarticulated need',
              readiness: need.confidence > 0.7 ? 'high' : 'medium',
            }
          ],
          applicableOfferings: need.approach ? [
            {
              offering: 'Solution Approach',
              fit: 'partial',
              positioning: need.approach,
            }
          ] : undefined,
          provenance: {
            sourceType: need.source || 'customer-psychology',
            quotes: evidenceQuotes.length > 0 ? evidenceQuotes : [need.emotionalDriver || 'Customer insight'],
            sampleSize: need.sampleSize,
            timestamp: need.timestamp || new Date().toISOString(),
          },
        });
      });
    }

    // From Perplexity competitive gaps (highest priority - real evidence with quotes)
    if (context?.competitiveIntel?.perplexityGaps) {
      context.competitiveIntel.perplexityGaps.forEach((pg, idx) => {
        gaps.push({
          id: `perplexity-gap-${idx}`,
          title: this.extractGapTitle(pg.gap),
          description: pg.gap,
          theVoid: pg.gap,
          theDemand: pg.evidence,
          yourAngle: pg.opportunity,
          competitors: pg.competitors || [],
          confidence: 0.9, // High confidence - from real web research
          source: 'perplexity',
          customerProfiles: [
            {
              segment: targetCustomer,
              painPoint: pg.gap,
              readiness: 'high', // Perplexity evidence = validated market gap
            }
          ],
          applicableOfferings: uvp?.unique_solution ? [
            {
              offering: 'Core Solution',
              fit: 'direct',
              positioning: pg.opportunity,
            }
          ] : undefined,
          provenance: {
            sourceType: 'perplexity-research',
            quotes: [pg.evidence], // The evidence IS the quote
            timestamp: new Date().toISOString(),
          },
        });
      });
    }

    // Sort gaps by confidence (Perplexity gaps will float to top)
    gaps.sort((a, b) => b.confidence - a.confidence);

    return gaps.slice(0, 10); // Increased from 8 to 10 to accommodate Perplexity gaps
  }

  /**
   * Extract a title from gap text
   */
  private extractGapTitle(gap: string): string {
    // Take first sentence or first 60 chars
    const firstSentence = gap.split(/[.!?]/)[0];
    return this.truncate(firstSentence, 60);
  }

  /**
   * Truncate string with ellipsis
   */
  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }

  /**
   * Parse customer triggers from various formats
   */
  private parseCustomerTriggers(
    triggers: unknown
  ): Array<{ trigger: string; urgency: number }> {
    if (!triggers) return [];

    if (Array.isArray(triggers)) {
      return triggers.map(t => {
        if (typeof t === 'string') {
          return { trigger: t, urgency: 5 };
        }
        if (typeof t === 'object' && t !== null) {
          return {
            trigger: (t as { trigger?: string }).trigger || String(t),
            urgency: (t as { urgency?: number }).urgency || 5,
          };
        }
        return { trigger: String(t), urgency: 5 };
      });
    }

    return [];
  }

  /**
   * Get feature flags based on segment
   */
  private getFeatureFlags(segment: BusinessSegment): ResolvedBusinessProfile['features'] {
    const isB2B = segment === 'b2b_national' || segment === 'b2b_global';
    const isLocal = segment === 'smb_local';
    const isGlobal = segment === 'b2b_global';

    return {
      showCompetitorWatch: isB2B,
      showG2Reviews: isB2B,
      showLinkedInInsights: isB2B,
      showLocalSEO: isLocal,
      showWeatherHooks: isLocal,
      platformWeights: PLATFORM_WEIGHTS[segment],
    };
  }

  /**
   * Generate cache key from context
   */
  private getCacheKey(context: DeepContext | null): string {
    if (!context) return 'default';
    const brand = context.business?.profile?.name || 'unknown';
    const industry = context.business?.profile?.industry || 'unknown';
    return `${brand}-${industry}`.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get hooks by type from resolved profile
   */
  getHooksByType(
    resolved: ResolvedBusinessProfile,
    hookType: 'number_hooks' | 'question_hooks' | 'story_hooks' | 'fear_hooks' | 'howto_hooks'
  ): string[] {
    return resolved.hooks[hookType] || [];
  }

  /**
   * Get content template for platform and type
   */
  getContentTemplate(
    resolved: ResolvedBusinessProfile,
    platform: string,
    contentType: string
  ): { hook: string; body: string; cta: string } | null {
    const platformTemplates = resolved.contentTemplates[platform] as Record<string, unknown>;
    if (!platformTemplates) return null;

    const template = platformTemplates[contentType];
    if (!template) return null;

    if (Array.isArray(template) && template.length > 0) {
      return template[0] as { hook: string; body: string; cta: string };
    }

    return template as { hook: string; body: string; cta: string };
  }
}

export const businessProfileResolver = new BusinessProfileResolverService();
