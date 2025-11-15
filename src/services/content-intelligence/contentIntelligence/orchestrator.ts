/**
 * ContentOrchestrator - Coordinates the entire Content Intelligence Engine
 *
 * MARBA'S CONTENT INTELLIGENCE ENGINE:
 * This is the main entry point that coordinates:
 * 1. OpportunityScorer - Ranks 50+ opportunities from BusinessIntelligence
 * 2. SearchSocialGenerator - Creates 3 Search + 3 Social pieces
 * 3. ReviewsGenerator - Creates 3 Customer Review pieces
 * 4. ContentPerformanceGenerator - Creates 3 Content Performance pieces
 *
 * OUTPUT: 12 ready-to-post, validated content pieces (3 per MARBA category)
 *
 * NOTE: Content is ADDITIVE to existing nested scoring breakdown.
 * These pieces appear alongside the drill-down data, not replacing it.
 *
 * PERFORMANCE TARGET: <15 seconds total (parallel generation)
 *
 * VALIDATION: All content passes ContentValidator (6/7 checks, opportunity-focused)
 */

import type { BusinessIntelligence, ContentPiece, MARBACategory } from './types';

import { OpportunityScorer } from './scorer';
import { SearchSocialGenerator } from './generators/searchSocial';
import { ReviewsGenerator } from './generators/reviews';
import { ContentPerformanceGenerator } from './generators/contentPerformance';

/**
 * Result from content generation
 */
export interface ContentGenerationResult {
  /** All 12 generated pieces (3 per category) */
  allContent: ContentPiece[];

  /** Content organized by MARBA category */
  byCategory: {
    search_visibility: ContentPiece[];
    social_presence: ContentPiece[];
    customer_reviews: ContentPiece[];
    content_performance: ContentPiece[];
  };

  /** Performance metrics */
  metrics: {
    totalPieces: number;
    validPieces: number;
    avgValidationScore: number;
    generationTimeMs: number;
    opportunitiesScored: number;
  };

  /** Any errors encountered (non-fatal) */
  errors: string[];
}

/**
 * Main orchestrator for Content Intelligence Engine
 */
export class ContentOrchestrator {
  private scorer: OpportunityScorer;
  private searchSocialGen: SearchSocialGenerator;
  private reviewsGen: ReviewsGenerator;
  private contentPerfGen: ContentPerformanceGenerator;

  constructor() {
    this.scorer = new OpportunityScorer();
    this.searchSocialGen = new SearchSocialGenerator();
    this.reviewsGen = new ReviewsGenerator();
    this.contentPerfGen = new ContentPerformanceGenerator();
  }

  /**
   * Generate all 12 content pieces from BusinessIntelligence
   *
   * Flow:
   * 1. Score and rank all opportunities (OpportunityScorer)
   * 2. Generate content in parallel (4 generators)
   * 3. Validate all content (ContentValidator in each generator)
   * 4. Return organized result
   *
   * Performance: <15 seconds (parallel execution)
   */
  async generateAllContent(
    businessIntel: BusinessIntelligence
  ): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Step 1: Score and rank ALL opportunities
      const rankedOpportunities = this.scorer.rankOpportunities(businessIntel);

      // Step 2: Generate content in parallel (4 async calls)
      const [searchContent, socialContent, reviewsContent, contentPerfContent] =
        await Promise.all([
          this.searchSocialGen
            .generateSearchVisibilityContent(businessIntel, rankedOpportunities)
            .catch((error) => {
              errors.push(`Search visibility generation failed: ${error.message}`);
              return [];
            }),

          this.searchSocialGen
            .generateSocialPresenceContent(businessIntel, rankedOpportunities)
            .catch((error) => {
              errors.push(`Social presence generation failed: ${error.message}`);
              return [];
            }),

          this.reviewsGen
            .generateReviewsContent(businessIntel, rankedOpportunities)
            .catch((error) => {
              errors.push(`Reviews generation failed: ${error.message}`);
              return [];
            }),

          this.contentPerfGen
            .generateContentPerformanceContent(businessIntel, rankedOpportunities)
            .catch((error) => {
              errors.push(`Content performance generation failed: ${error.message}`);
              return [];
            }),
        ]);

      // Step 3: Combine all content
      const allContent = [
        ...searchContent,
        ...socialContent,
        ...reviewsContent,
        ...contentPerfContent,
      ];

      // Step 4: Calculate metrics
      const validPieces = allContent.filter(
        (piece) => piece.validation && piece.validation.score >= 0.85
      ).length;

      const avgValidationScore =
        allContent.length > 0
          ? allContent.reduce((sum, piece) => sum + (piece.validation?.score || 0), 0) /
            allContent.length
          : 0;

      const generationTimeMs = Date.now() - startTime;

      // Step 5: Return organized result
      return {
        allContent,
        byCategory: {
          search_visibility: searchContent,
          social_presence: socialContent,
          customer_reviews: reviewsContent,
          content_performance: contentPerfContent,
        },
        metrics: {
          totalPieces: allContent.length,
          validPieces,
          avgValidationScore,
          generationTimeMs,
          opportunitiesScored: rankedOpportunities.length,
        },
        errors,
      };
    } catch (error) {
      // Fatal error - return empty result
      console.error('ContentOrchestrator fatal error:', error);
      return {
        allContent: [],
        byCategory: {
          search_visibility: [],
          social_presence: [],
          customer_reviews: [],
          content_performance: [],
        },
        metrics: {
          totalPieces: 0,
          validPieces: 0,
          avgValidationScore: 0,
          generationTimeMs: Date.now() - startTime,
          opportunitiesScored: 0,
        },
        errors: [`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Generate content for a single MARBA category
   * Useful when you only need to refresh one category
   *
   * Performance: <5 seconds
   */
  async generateCategoryContent(
    businessIntel: BusinessIntelligence,
    category: MARBACategory
  ): Promise<ContentPiece[]> {
    // Score opportunities first
    const rankedOpportunities = this.scorer.rankOpportunities(businessIntel);

    // Generate content based on category
    switch (category) {
      case 'search_visibility':
        return await this.searchSocialGen.generateSearchVisibilityContent(
          businessIntel,
          rankedOpportunities
        );

      case 'social_presence':
        return await this.searchSocialGen.generateSocialPresenceContent(
          businessIntel,
          rankedOpportunities
        );

      case 'customer_reviews':
        return await this.reviewsGen.generateReviewsContent(
          businessIntel,
          rankedOpportunities
        );

      case 'content_performance':
        return await this.contentPerfGen.generateContentPerformanceContent(
          businessIntel,
          rankedOpportunities
        );

      default:
        throw new Error(`Unknown category: ${category}`);
    }
  }

  /**
   * Get scored opportunities without generating content
   * Useful for displaying opportunity insights in UI
   *
   * Performance: <100ms
   */
  getOpportunities(businessIntel: BusinessIntelligence) {
    return this.scorer.rankOpportunities(businessIntel);
  }

  /**
   * Get top N opportunities by urgency
   * Useful for "what to post today" feature
   *
   * Performance: <100ms
   */
  getTopOpportunities(businessIntel: BusinessIntelligence, limit: number = 10) {
    const opportunities = this.scorer.rankOpportunities(businessIntel);
    return opportunities.slice(0, limit);
  }

  /**
   * Get urgent opportunities (immediate + today)
   * Useful for "action needed" alerts
   *
   * Performance: <100ms
   */
  getUrgentOpportunities(businessIntel: BusinessIntelligence) {
    const opportunities = this.scorer.rankOpportunities(businessIntel);
    return opportunities.filter((opp) => ['immediate', 'today'].includes(opp.urgency));
  }
}

/**
 * Singleton instance for easy import
 */
export const contentOrchestrator = new ContentOrchestrator();
