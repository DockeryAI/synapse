/**
 * V5 Hooks Index
 *
 * Phase 7: All V5 generation hooks for UI integration.
 *
 * Created: 2025-12-01
 */

// Power Mode - Full control generation with insight selection
export {
  useV5PowerModeGeneration,
  type SelectedInsight,
  type PowerModeOptions,
  type PowerModeResult,
  type UseV5PowerModeGenerationReturn,
} from '../useV5PowerModeGeneration';

// Easy Mode - One-click campaign and quick post generation
export {
  useV5EasyModeGeneration,
  type EasyModeOptions,
  type QuickPostOptions,
  type CampaignPost,
  type CampaignResult,
  type QuickPostResult,
  type ContextStatus,
  type UseV5EasyModeGenerationReturn,
} from '../useV5EasyModeGeneration';

// Campaign Mode - Structured campaign generation
export {
  useV5CampaignGeneration,
  type CampaignType,
  type CampaignConfig,
  type WeekTheme,
  type CampaignPost as CampaignModePost,
  type CampaignGenerationOptions,
  type CampaignState,
  type UseV5CampaignGenerationReturn,
} from '../useV5CampaignGeneration';

// Live Preview - Real-time preview with suggestions
export {
  useV5LivePreview,
  type PreviewOptions,
  type PreviewContent,
  type InsightSuggestion,
  type UseV5LivePreviewReturn,
} from '../useV5LivePreview';

// Original V5 Content Generation (Phase 5)
export {
  default as useV5ContentGeneration,
} from '../useV5ContentGeneration';

// Resolved Sources - Triggers 4.0 Display Layer Separation
export {
  useResolvedSources,
  useResolvedSource,
  type ResolvedSource,
  type UseResolvedSourcesReturn,
} from './useResolvedSources';
