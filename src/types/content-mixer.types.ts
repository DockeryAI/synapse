/**
 * Content Mixer Type Definitions
 *
 * Types for the drag-and-drop insight selection interface
 * where users can mix and match insights to generate campaigns
 */

import { SynapseInsight } from './synapse/synapse.types';

// ============================================================================
// INSIGHT CATEGORIES
// ============================================================================

export type InsightCategory =
  | 'local'         // Location-based insights (weather, local events, etc.)
  | 'trending'      // Trending topics, viral moments, cultural moments
  | 'seasonal'      // Seasonal patterns, holidays, industry cycles
  | 'industry'      // Industry trends, news, expert insights
  | 'reviews'       // Customer reviews, testimonials, feedback
  | 'competitive';  // Competitor analysis, market gaps, opportunities

// ============================================================================
// CATEGORIZED INSIGHTS
// ============================================================================

export interface CategorizedInsight extends SynapseInsight {
  /** Category this insight belongs to */
  category: InsightCategory;

  /** Display title for UI */
  displayTitle: string;

  /** Data source (e.g., "Weather API", "Reddit", "Google Reviews") */
  dataSource: string;

  /** Icon identifier for the category/source */
  icon?: string;
}

// ============================================================================
// INSIGHT SELECTION STATE
// ============================================================================

export interface InsightSelection {
  /** Selected insights (in order) */
  insights: CategorizedInsight[];

  /** Maximum insights allowed */
  maxInsights: number;

  /** Whether selection is valid (has at least 1) */
  isValid: boolean;
}

// ============================================================================
// INSIGHT POOL STATE
// ============================================================================

export interface InsightPool {
  /** All available insights grouped by category */
  byCategory: Record<InsightCategory, CategorizedInsight[]>;

  /** Total available insights */
  totalCount: number;

  /** Count per category */
  countByCategory: Record<InsightCategory, number>;
}

// ============================================================================
// CAMPAIGN PREVIEW
// ============================================================================

export interface CampaignPreview {
  /** Generated headline */
  headline: string;

  /** Generated hook/intro */
  hook: string;

  /** Partial body (first few lines) */
  bodyPreview: string;

  /** Full body (for full preview) */
  fullBody?: string;

  /** Call to action */
  cta?: string;

  /** Hashtags */
  hashtags?: string[];

  /** Estimated engagement score */
  engagementScore?: number;

  /** Platform being previewed */
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok';

  /** Loading state */
  isLoading: boolean;

  /** Error if preview failed */
  error?: string;
}

// ============================================================================
// CONTENT MIXER STATE
// ============================================================================

export interface ContentMixerState {
  /** Available insights pool */
  pool: InsightPool;

  /** Current selection */
  selection: InsightSelection;

  /** Live preview */
  preview: CampaignPreview;

  /** Active category tab */
  activeCategory: InsightCategory;

  /** Search filter (within category) */
  searchFilter: string;
}

// ============================================================================
// DRAG AND DROP
// ============================================================================

export interface DragInsightPayload {
  /** Insight being dragged */
  insight: CategorizedInsight;

  /** Source: pool or selection */
  source: 'pool' | 'selection';

  /** Original index (if from selection) */
  index?: number;
}
