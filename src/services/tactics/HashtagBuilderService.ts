/**
 * Hashtag Formula Builder Service
 * Implements the proven 3+10+5 hashtag strategy
 *
 * Formula: 3 Branded + 10 Niche + 5 Trending = Maximum Reach
 * - Branded: Name, location, specialty (build your brand)
 * - Niche: 10K-50K post volume (sweet spot for visibility)
 * - Trending: Platform trending page (ride the wave)
 *
 * Includes: Performance tracking, rotation strategy, competitor research
 */

import {
  HashtagFormula,
  HashtagSet,
  HashtagPerformance,
  HashtagResearch,
  RotationStrategy,
  BusinessContext,
  ServiceResponse,
  SocialPlatform,
} from '../../types/tactics.types';

export class HashtagBuilderService {
  // Hashtag volume sweet spots
  private readonly NICHE_MIN_POSTS = 10000;
  private readonly NICHE_MAX_POSTS = 50000;
  private readonly TRENDING_REFRESH_HOURS = 24;

  /**
   * Generate complete hashtag formula for a business
   */
  async generateFormula(
    businessContext: BusinessContext,
    platform: SocialPlatform = 'instagram'
  ): Promise<ServiceResponse<HashtagSet>> {
    try {
      const branded = this.generateBrandedHashtags(businessContext);
      const niche = await this.generateNicheHashtags(businessContext, platform);
      const trending = await this.generateTrendingHashtags(businessContext, platform);

      const formula: HashtagFormula = {
        branded,
        niche,
        trending,
        total: branded.length + niche.length + trending.length,
        generatedAt: new Date(),
        expiresAt: this.calculateExpiryDate(),
      };

      const hashtagSet: HashtagSet = {
        id: this.generateId(),
        businessId: businessContext.id,
        industry: businessContext.industry,
        specialty: businessContext.specialty || businessContext.industry,
        location: businessContext.location,
        formula,
        performance: {} as HashtagPerformance, // Initialize empty, populate as used
        rotationStrategy: this.getDefaultRotationStrategy(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: hashtagSet,
        metadata: {
          formula: '3 branded + 10 niche + 5 trending',
          totalHashtags: formula.total,
          refreshSchedule: 'Trending: daily, Niche: weekly',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hashtag formula',
      };
    }
  }

  /**
   * Generate 3 branded hashtags
   * Based on: business name, location, specialty
   */
  private generateBrandedHashtags(context: BusinessContext): string[] {
    const hashtags: string[] = [];

    // 1. Business Name (cleaned)
    const businessHashtag = this.cleanHashtag(context.name);
    hashtags.push(businessHashtag);

    // 2. Location + Business (if location available)
    if (context.location) {
      const locationHashtag = this.cleanHashtag(`${context.location}${context.specialty || context.industry}`);
      hashtags.push(locationHashtag);
    } else if (context.specialty) {
      // If no location, use specialty
      const specialtyHashtag = this.cleanHashtag(context.specialty);
      hashtags.push(specialtyHashtag);
    }

    // 3. Unique brand identifier
    const uniqueHashtag = this.generateUniqueHashtag(context);
    hashtags.push(uniqueHashtag);

    // Ensure we have exactly 3
    return hashtags.slice(0, 3);
  }

  /**
   * Generate unique brand hashtag
   */
  private generateUniqueHashtag(context: BusinessContext): string {
    const options = [
      this.cleanHashtag(`${context.name}Official`),
      this.cleanHashtag(`The${context.name}`),
      this.cleanHashtag(`${context.name}Experience`),
      this.cleanHashtag(`${context.name}Life`),
    ];

    // Pick the shortest one that's still meaningful
    return options.reduce((a, b) => (a.length < b.length ? a : b));
  }

  /**
   * Generate 10 niche hashtags in the 10K-50K sweet spot
   * These give best visibility without getting lost in millions of posts
   */
  private async generateNicheHashtags(
    context: BusinessContext,
    platform: SocialPlatform
  ): Promise<string[]> {
    const hashtags: string[] = [];

    // Strategy: Combine industry + specialty + location + modifiers
    const seedTerms = this.generateSeedTerms(context);
    const modifiers = this.getNicheModifiers();

    // Generate candidate hashtags
    const candidates: string[] = [];

    // 1. Direct industry/specialty hashtags
    seedTerms.forEach((term) => {
      candidates.push(this.cleanHashtag(term));
    });

    // 2. Industry + modifiers (e.g., "bakery" + "love" = #BakeryLove)
    seedTerms.forEach((term) => {
      modifiers.forEach((modifier) => {
        candidates.push(this.cleanHashtag(`${term}${modifier}`));
        candidates.push(this.cleanHashtag(`${modifier}${term}`));
      });
    });

    // 3. Location-based niche (e.g., #NYCBakery)
    if (context.location) {
      seedTerms.forEach((term) => {
        candidates.push(this.cleanHashtag(`${context.location}${term}`));
      });
    }

    // In production, we'd query Instagram API for post counts
    // For MVP, we'll use a heuristic-based selection
    const nicheHashtags = await this.selectNicheHashtags(candidates, 10);

    return nicheHashtags;
  }

  /**
   * Generate seed terms from business context
   */
  private generateSeedTerms(context: BusinessContext): string[] {
    const terms: Set<string> = new Set();

    // Add industry
    terms.add(context.industry);

    // Add specialty (if different from industry)
    if (context.specialty && context.specialty !== context.industry) {
      terms.add(context.specialty);
    }

    // Add industry variations
    const industryVariations = this.getIndustryVariations(context.industry);
    industryVariations.forEach((v) => terms.add(v));

    // Add target audience hints (if available)
    if (context.targetAudience) {
      terms.add(context.targetAudience);
    }

    return Array.from(terms);
  }

  /**
   * Get industry-specific variations
   */
  private getIndustryVariations(industry: string): string[] {
    const variations: Record<string, string[]> = {
      restaurant: ['foodie', 'dining', 'eats', 'cuisine', 'chef'],
      bakery: ['baking', 'pastry', 'dessert', 'bread', 'cake'],
      coffee: ['cafe', 'coffeeshop', 'barista', 'espresso', 'brew'],
      fitness: ['gym', 'workout', 'training', 'health', 'wellness'],
      salon: ['hair', 'beauty', 'hairstyle', 'haircare', 'hairstylist'],
      photography: ['photographer', 'photo', 'portrait', 'photoshoot', 'pics'],
      consulting: ['consultant', 'advisor', 'strategy', 'business', 'coach'],
      retail: ['shop', 'shopping', 'store', 'boutique', 'fashion'],
    };

    const key = industry.toLowerCase();
    return variations[key] || [industry];
  }

  /**
   * Get niche modifiers that create sweet-spot hashtags
   */
  private getNicheModifiers(): string[] {
    return [
      'Love',
      'Life',
      'Daily',
      'Inspo',
      'Goals',
      'Vibes',
      'Community',
      'Lovers',
      'Addict',
      'Obsessed',
      'Style',
      'Gram',
      'Of',
      'The',
      'My',
      'Best',
      'Local',
      'Small',
    ];
  }

  /**
   * Select niche hashtags based on heuristics
   * In production, this would query actual post counts
   */
  private async selectNicheHashtags(candidates: string[], count: number): Promise<string[]> {
    // Heuristic: Longer hashtags tend to have fewer posts
    // We want medium-length (good balance)
    const scored = candidates.map((hashtag) => ({
      hashtag,
      score: this.calculateNicheScore(hashtag),
    }));

    // Sort by score and take top N unique
    scored.sort((a, b) => b.score - a.score);

    const selected = scored
      .map((s) => s.hashtag)
      .filter((h, i, arr) => arr.indexOf(h) === i) // unique
      .slice(0, count);

    // If we don't have enough, add some generic industry ones
    while (selected.length < count) {
      selected.push(`#${this.randomHashtag()}`);
    }

    return selected;
  }

  /**
   * Calculate niche score (higher = better fit for 10K-50K range)
   */
  private calculateNicheScore(hashtag: string): number {
    let score = 50; // Base score

    // Optimal length: 10-15 characters (sweet spot)
    const length = hashtag.length;
    if (length >= 10 && length <= 15) {
      score += 20;
    } else if (length < 10) {
      score -= 10; // Too short = too popular
    } else {
      score -= 5; // Too long = too obscure
    }

    // Has modifier = likely in sweet spot
    const modifiers = this.getNicheModifiers();
    if (modifiers.some((m) => hashtag.toLowerCase().includes(m.toLowerCase()))) {
      score += 15;
    }

    // No spaces or special chars (already cleaned)
    score += 10;

    // CamelCase = more specific = better
    if (this.isCamelCase(hashtag)) {
      score += 10;
    }

    return score;
  }

  /**
   * Generate 5 trending hashtags
   * These change daily - highest risk, highest reward
   */
  private async generateTrendingHashtags(
    context: BusinessContext,
    platform: SocialPlatform
  ): Promise<string[]> {
    // In production, this would query platform APIs for trending hashtags
    // For MVP, we'll use industry-relevant trending patterns

    const trending: string[] = [];

    // Current trends by platform
    const platformTrends = this.getPlatformTrends(platform);
    trending.push(...platformTrends.slice(0, 3));

    // Industry-specific trending
    const industryTrends = this.getIndustryTrends(context.industry);
    trending.push(...industryTrends.slice(0, 2));

    return trending.slice(0, 5);
  }

  /**
   * Get platform-specific trending hashtags
   * In production: Query API. For MVP: Static but updated regularly
   */
  private getPlatformTrends(platform: SocialPlatform): string[] {
    const trends: Record<SocialPlatform, string[]> = {
      instagram: ['#instagood', '#photooftheday', '#reelsinstagram', '#explorepage', '#viral'],
      tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#foryoupage'],
      twitter: ['#trending', '#viral', '#thread', '#news', '#breaking'],
      facebook: ['#viral', '#share', '#like', '#follow', '#community'],
      linkedin: ['#leadership', '#business', '#innovation', '#growth', '#success'],
      youtube: ['#youtubeshorts', '#viral', '#trending', '#subscribe', '#like'],
      google_business: ['#local', '#localbusiness', '#shoplocal', '#community', '#nearby'],
    };

    return trends[platform] || trends.instagram;
  }

  /**
   * Get industry-specific trending hashtags
   */
  private getIndustryTrends(industry: string): string[] {
    const trends: Record<string, string[]> = {
      restaurant: ['#foodporn', '#instafood', '#foodstagram', '#yummy', '#delicious'],
      bakery: ['#foodporn', '#homemade', '#dessert', '#sweettooth', '#yum'],
      coffee: ['#coffeetime', '#coffeelover', '#coffeeaddict', '#cafe', '#latteart'],
      fitness: ['#fitfam', '#gains', '#motivation', '#transformation', '#healthylifestyle'],
      salon: ['#hairgoals', '#hairtransformation', '#beforeandafter', '#newlook', '#selfcare'],
      photography: ['#photography', '#photooftheday', '#instagood', '#picoftheday', '#art'],
    };

    const key = industry.toLowerCase();
    return trends[key] || ['#small business', '#entrepreneur', '#local', '#shoplocal', '#community'];
  }

  /**
   * Track hashtag performance
   */
  async trackPerformance(
    hashtagSetId: string,
    hashtag: string,
    metrics: {
      reach: number;
      engagement: number;
      uses: number;
    }
  ): Promise<ServiceResponse<HashtagPerformance>> {
    try {
      const performance: HashtagPerformance = {
        hashtag,
        uses: metrics.uses,
        reach: metrics.reach,
        engagement: metrics.engagement,
        growthRate: this.calculateGrowthRate(metrics),
        lastUsed: new Date(),
      };

      // In production: Save to database
      return {
        success: true,
        data: performance,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track performance',
      };
    }
  }

  /**
   * Rotate hashtags based on strategy
   */
  async rotateHashtags(
    hashtagSet: HashtagSet,
    force: boolean = false
  ): Promise<ServiceResponse<HashtagFormula>> {
    try {
      const { formula, rotationStrategy } = hashtagSet;
      const newFormula = { ...formula };

      // Refresh trending if expired or forced
      if (this.shouldRefreshTrending(formula, rotationStrategy) || force) {
        newFormula.trending = await this.generateTrendingHashtags(
          {
            id: hashtagSet.businessId,
            name: 'Business', // Would fetch from context
            industry: hashtagSet.industry,
            specialty: hashtagSet.specialty,
            platforms: ['instagram'],
          },
          'instagram'
        );
      }

      // Rotate niche hashtags if strategy says so
      if (rotationStrategy.rotateNiche || force) {
        // Keep performing hashtags, replace underperformers
        // In production: Use performance data to decide
        // For MVP: Rotate 30% of niche hashtags
        const keepCount = Math.ceil(newFormula.niche.length * 0.7);
        const replaceCount = newFormula.niche.length - keepCount;

        // Keep top performers (would use actual data)
        const kept = newFormula.niche.slice(0, keepCount);

        // Generate new ones
        const newNiche = await this.generateNicheHashtags(
          {
            id: hashtagSet.businessId,
            name: 'Business',
            industry: hashtagSet.industry,
            specialty: hashtagSet.specialty,
            platforms: ['instagram'],
          },
          'instagram'
        );

        newFormula.niche = [...kept, ...newNiche.slice(0, replaceCount)];
      }

      newFormula.generatedAt = new Date();
      newFormula.expiresAt = this.calculateExpiryDate();

      return {
        success: true,
        data: newFormula,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rotate hashtags',
      };
    }
  }

  /**
   * Research competitor hashtags
   */
  async researchCompetitors(
    competitorHandles: string[],
    platform: SocialPlatform = 'instagram'
  ): Promise<ServiceResponse<HashtagResearch[]>> {
    try {
      // In production: Scrape competitor profiles and analyze hashtags
      // For MVP: Return mock data structure
      const research: HashtagResearch[] = [];

      return {
        success: true,
        data: research,
        metadata: {
          message: 'Competitor research feature - coming soon',
          competitors: competitorHandles.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to research competitors',
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Clean and format hashtag
   */
  private cleanHashtag(text: string): string {
    // Remove spaces, special chars, make camelCase
    const cleaned = text
      .replace(/[^a-zA-Z0-9]/g, '')
      .split(' ')
      .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('');

    return `#${cleaned}`;
  }

  /**
   * Check if string is CamelCase
   */
  private isCamelCase(str: string): boolean {
    return /[a-z][A-Z]/.test(str);
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(metrics: { reach: number; engagement: number; uses: number }): number {
    // Simple heuristic: engagement/reach ratio
    if (metrics.reach === 0) return 0;
    return (metrics.engagement / metrics.reach) * 100;
  }

  /**
   * Should refresh trending hashtags?
   */
  private shouldRefreshTrending(
    formula: HashtagFormula,
    strategy: RotationStrategy
  ): boolean {
    if (strategy.refreshTrending === 'never') return false;
    if (strategy.refreshTrending === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return formula.generatedAt < weekAgo;
    }
    // Default: daily
    return new Date() > formula.expiresAt;
  }

  /**
   * Calculate expiry date for formula
   */
  private calculateExpiryDate(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.TRENDING_REFRESH_HOURS);
    return expiry;
  }

  /**
   * Get default rotation strategy
   */
  private getDefaultRotationStrategy(): RotationStrategy {
    return {
      keepBranded: true, // Never change branded
      rotateNiche: true, // Rotate based on performance
      refreshTrending: 'daily',
      lastRotation: new Date(),
    };
  }

  /**
   * Generate random hashtag (fallback)
   */
  private randomHashtag(): string {
    const random = ['inspo', 'daily', 'life', 'love', 'goals', 'vibes'];
    return this.randomChoice(random);
  }

  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private generateId(): string {
    return `hashtag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton export
export const hashtagBuilderService = new HashtagBuilderService();
