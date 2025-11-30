/**
 * Competitor Intelligence Collectors
 *
 * Unified collectors that wrap existing APIs for the Gap Tab 2.0 enhanced intelligence system.
 * Each collector extracts specific intelligence from its data source and returns a standardized format.
 *
 * Created: 2025-11-29
 */

export { redditCollector } from './reddit-collector';
export { semrushCollector } from './semrush-collector';
export { youtubeCollector } from './youtube-collector';
export { serperCollector } from './serper-collector';
export { integrationGapCollector } from './integration-gap-collector';
export { talentSignalCollector } from './talent-signal-collector';

export type {
  CollectorResult,
  RedditCollectorResult,
  SEMrushCollectorResult,
  YouTubeCollectorResult,
  SerperCollectorResult,
  IntegrationGapResult,
  TalentSignalResult,
  EnhancedCollectorResults
} from './types';
