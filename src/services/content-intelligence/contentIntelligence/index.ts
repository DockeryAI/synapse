/**
 * Content Intelligence Engine - Main Export
 *
 * MARBA'S CONTENT INTELLIGENCE:
 * Generates 12 ready-to-post content pieces by combining:
 * - 140+ industry profiles (customer triggers, power words, CTAs)
 * - Competitive intelligence (gaps = opportunities)
 * - Real-time signals (weather, trends, news)
 * - Claude AI (opportunity-focused content generation)
 * - ContentValidator (7-check quality control)
 *
 * USAGE:
 *
 * ```typescript
 * import { contentOrchestrator } from '@/services/contentIntelligence';
 *
 * // Generate all 12 pieces
 * const result = await contentOrchestrator.generateAllContent(businessIntel);
 *
 * // Access by category
 * const searchPieces = result.byCategory.search_visibility; // 3 pieces
 * const socialPieces = result.byCategory.social_presence;   // 3 pieces
 * const reviewPieces = result.byCategory.customer_reviews;  // 3 pieces
 * const contentPieces = result.byCategory.content_performance; // 3 pieces
 *
 * // Get opportunities without generating content
 * const opportunities = contentOrchestrator.getOpportunities(businessIntel);
 *
 * // Get urgent opportunities
 * const urgent = contentOrchestrator.getUrgentOpportunities(businessIntel);
 * ```
 *
 * PERFORMANCE:
 * - Full generation: <15 seconds (4 parallel AI calls)
 * - Single category: <5 seconds
 * - Opportunity scoring: <100ms
 *
 * VALIDATION:
 * - All content passes 6/7 checks (85%+ validation score)
 * - Check #7 (Opportunity-Focused Tone) is MOST CRITICAL
 * - Forbidden words: missing, lacking, behind, weak, must, need to, etc.
 * - Required words: 2+ of (opportunity, ready, discover, achieve, capture, etc.)
 */

// Main orchestrator (recommended entry point)
export { ContentOrchestrator, contentOrchestrator } from './orchestrator';
export type { ContentGenerationResult } from './orchestrator';

// Core components (for advanced usage)
export { OpportunityScorer } from './scorer';
export type { ScoredOpportunity } from './scorer';

// Export ScoredOpportunity for use in generators
export type { ScoredOpportunity as ScoredOpp } from './scorer';

export { ContentValidator } from './validator';

export { SearchSocialGenerator } from './generators/searchSocial';
export { ReviewsGenerator } from './generators/reviews';
export { ContentPerformanceGenerator } from './generators/contentPerformance';

// Types
export type {
  // Main types
  BusinessIntelligence,
  ContentPiece,
  MARBACategory,

  // Industry intelligence
  IndustryProfile,
  CustomerTrigger,
  PowerWord,
  ProvenCTA,
  SeasonalTrend,

  // Competitive intelligence
  CompetitiveIntelligence,
  SearchOpportunities,
  SocialOpportunities,
  ReviewOpportunities,
  KeywordGap,
  ContentGap,
  PlatformGap,
  TimingGap,
  FormatGap,
  ReviewAdvantage,
  CompetitorWeakness,

  // Real-time signals
  RealTimeSignals,
  WeatherSignal,

  // Review data
  ReviewData,
  Review,

  // Content metadata
  ContentBadge,
  OpportunityType,
  UrgencyLevel,
  ValidationResult,
} from './types';

// Constants
export {
  URGENCY_SCORES,
  OPPORTUNITY_TO_BADGE,
  FORBIDDEN_WORDS,
  OPPORTUNITY_WORDS,
  POSITIVE_FRAMING,
} from './types';
