/**
 * Dashboard Components - Centralized Exports
 *
 * Phase 1 Display Components - V2.1 Integration
 */

// ============================================================================
// CLUSTER & PATTERN COMPONENTS
// ============================================================================

/**
 * ClusterPatternCard - Displays insight clusters with framework data
 * Shows coherence score, sources, sentiment, and framework alignment
 */
export { ClusterPatternCard } from './ClusterPatternCard';
export type { ClusterPatternCardProps } from './ClusterPatternCard';

// ============================================================================
// BREAKTHROUGH & INSIGHT COMPONENTS
// ============================================================================

/**
 * BreakthroughCard - ARCHIVED (V5 types, replaced by V6InsightCard)
 * Displays breakthrough insights with quality scoring
 * Includes quality breakdown, confidence score, and Synapse generation button
 */
export { BreakthroughCard } from './_archived/BreakthroughCard';
export type { BreakthroughCardProps } from './_archived/BreakthroughCard';

// ============================================================================
// QUALITY & SCORING COMPONENTS
// ============================================================================

/**
 * EQScoreBadge - Displays emotional intelligence/quality scores
 * Compact or detailed variants with color-coded quality indicators
 */
export { EQScoreBadge } from './EQScoreBadge';
export type { EQScoreBadgeProps } from './EQScoreBadge';

// ============================================================================
// ANIMATION COMPONENTS
// ============================================================================

/**
 * CelebrationAnimation - Framer Motion celebration for high-scoring content
 * Triggers on quality scores 80+, with three intensity levels
 */
export { CelebrationAnimation } from './CelebrationAnimation';
export type { CelebrationAnimationProps } from './CelebrationAnimation';

// ============================================================================
// CAMPAIGN COMPONENTS
// ============================================================================

/**
 * CampaignTimeline - Dashboard-embedded timeline view
 * Shows campaign phases, milestones, and emotional progression
 */
export { CampaignTimeline } from './CampaignTimeline';
export type { CampaignTimelineProps } from './CampaignTimeline';

// ============================================================================
// EXISTING DASHBOARD COMPONENTS
// ============================================================================

/**
 * DashboardHeader - Main dashboard navigation header
 * ARCHIVED: Moved to _archived folder
 */
// export { DashboardHeader } from './DashboardHeader';

/**
 * IntelligenceLibraryV2 - Main intelligence library with Easy/Power modes
 * ARCHIVED: Moved to _archived folder
 */
// export { IntelligenceLibraryV2 } from './IntelligenceLibraryV2';
// export type { IntelligenceLibraryV2Props } from './IntelligenceLibraryV2';

/**
 * AI Picks Panel - Smart content suggestions
 */
export { AiPicksPanel } from './AiPicksPanel';
export { DashboardSmartPicks } from './DashboardSmartPicks';

// ============================================================================
// OPPORTUNITY & SCORING COMPONENTS (Phase 3)
// ============================================================================

/**
 * OpportunityRadar - Dashboard widget showing tiered content opportunities
 * Filters by urgent, high-value, and evergreen tiers
 */
export { OpportunityRadar } from './OpportunityRadar';
export type { OpportunityRadarProps } from './OpportunityRadar';

/**
 * BreakthroughScoreCard - 11-factor breakthrough scoring visualization
 * Includes radar chart, factor breakdown, and improvement suggestions
 */
export { BreakthroughScoreCard } from './BreakthroughScoreCard';
export type { default as BreakthroughScoreCardDefault } from './BreakthroughScoreCard';
