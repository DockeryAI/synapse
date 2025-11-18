/**
 * Synapse Types - Re-export from synapse folder
 * This file re-exports all types from the synapse types
 */

// Re-export all types from the synapse folder
export * from './synapse/synapse.types';

// Re-export commonly used types explicitly for better IDE support
export type {
  SynapseInsight,
  ThinkingStyle,
  InsightType,
  ModelConfig,
  // Note: The following types were removed as they don't exist in synapse/synapse.types.ts:
  // SynapseScore, PowerWord, PowerWordCategory, PowerWordAnalysis,
  // EmotionalTrigger, EmotionalTriggerType, EmotionalTriggerAnalysis,
  // ReadabilityScore, CallToActionAnalysis, CTAType,
  // ContentOptimizationRequest, ContentOptimizationResult, OptimizationImprovement,
  // SynapseConfig, ContentQualityIndicator, SynapseBreakdown
  // synapseToUserFacing function
} from './synapse/synapse.types';
