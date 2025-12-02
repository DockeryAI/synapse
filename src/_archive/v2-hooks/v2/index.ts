/**
 * V2 React Hooks - Barrel Export
 *
 * Custom hooks for UVP V2 optimization that bridge V2 services with React components.
 *
 * ISOLATION: Zero V1 imports
 */

export { useUVPGeneration } from './useUVPGeneration';
export type {
  GenerationPhase,
  UseUVPGenerationOptions,
  UseUVPGenerationReturn,
} from './useUVPGeneration';

export { useStreamingText } from './useStreamingText';
export type {
  StreamingStatus,
  UseStreamingTextOptions,
  UseStreamingTextReturn,
} from './useStreamingText';

export { useInlineEdit } from './useInlineEdit';
export type {
  UseInlineEditOptions,
  UseInlineEditReturn,
} from './useInlineEdit';

export { useQualityScore } from './useQualityScore';
export type {
  QualityLevel,
  QualityIndicator,
  UseQualityScoreReturn,
} from './useQualityScore';

export { useExtraction } from './useExtraction';
export type { UseExtractionReturn } from './useExtraction';
