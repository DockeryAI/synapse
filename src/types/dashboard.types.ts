/**
 * Dashboard Type Definitions
 * Centralized types for Dashboard V2.1 components
 *
 * Created: Phase 1 - Display Components Integration
 */

import type { InsightCluster } from '@/services/intelligence/clustering.service';
import type { SynapseInsight } from './synapse/synapse.types';
import type { TimelineVisualizationData, TimelineMilestone } from './v2/preview.types';

// ============================================================================
// CLUSTER PATTERN CARD
// ============================================================================

export interface ClusterPatternCardProps {
  /** Cluster data with framework, coherence, sources */
  cluster: InsightCluster;

  /** Handler for "Generate Campaign" button */
  onGenerateCampaign?: (cluster: InsightCluster) => void;

  /** Handler for card click */
  onClick?: (cluster: InsightCluster) => void;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// BREAKTHROUGH CARD
// ============================================================================

export interface BreakthroughCardProps {
  /** Synapse insight with quality scoring */
  insight: SynapseInsight;

  /** Handler for "Generate with Synapse" button */
  onGenerateWithSynapse?: (insight: SynapseInsight) => void;

  /** Handler for card click */
  onClick?: (insight: SynapseInsight) => void;

  /** Show quality score badge */
  showQualityScore?: boolean;

  /** Compact variant (smaller card) */
  compact?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// EQ SCORE BADGE
// ============================================================================

export interface EQScoreBadgeProps {
  /** Quality/EQ score (0-100) */
  score: number;

  /** Display variant */
  variant?: 'compact' | 'detailed';

  /** Custom label (defaults to auto-generated label based on score) */
  label?: string;

  /** Show heart icon */
  showIcon?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// CELEBRATION ANIMATION
// ============================================================================

export interface CelebrationAnimationProps {
  /** Trigger animation */
  trigger: boolean;

  /** Score that determines intensity (80-85, 85-90, 90+) */
  score: number;

  /** Callback when animation completes */
  onComplete?: () => void;

  /** Enable sound effect */
  enableSound?: boolean;

  /** Animation duration in milliseconds */
  duration?: number;
}

// ============================================================================
// CAMPAIGN TIMELINE
// ============================================================================

export interface CampaignTimelineProps {
  /** Timeline visualization data */
  data: TimelineVisualizationData;

  /** Campaign name for header */
  campaignName?: string;

  /** Handler for expand button */
  onExpand?: () => void;

  /** Handler for milestone click */
  onMilestoneClick?: (milestone: TimelineMilestone) => void;

  /** Compact mode (horizontal timeline) */
  compact?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// DASHBOARD STATE TYPES
// ============================================================================

export interface DashboardViewMode {
  /** Current view mode */
  mode: 'easy' | 'power' | 'campaign';

  /** Previous mode (for back navigation) */
  previousMode?: 'easy' | 'power' | 'campaign';
}

export interface DashboardFilters {
  /** Active insight type filter */
  insightType: 'all' | 'customer' | 'market' | 'competition' | 'local' | 'opportunity';

  /** Show only high-quality insights (80+) */
  highQualityOnly: boolean;

  /** Selected framework filter */
  framework?: string;

  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DashboardStats {
  /** Total insights available */
  totalInsights: number;

  /** Insights with quality scores */
  withQuality: number;

  /** High-quality insights (80+) */
  highQuality: number;

  /** Average quality score */
  avgQuality: number;

  /** Total clusters discovered */
  totalClusters: number;

  /** Total breakthrough insights */
  totalBreakthroughs: number;
}

// ============================================================================
// RE-EXPORTS (for convenience)
// ============================================================================

// Re-export common types from other modules
export type { InsightCluster } from '@/services/intelligence/clustering.service';
export type { SynapseInsight } from './synapse/synapse.types';
export type { TimelineVisualizationData, TimelineMilestone } from './v2/preview.types';
