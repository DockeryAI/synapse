/**
 * V5 Content Engine
 *
 * Psychology-first content generation with template-driven approach.
 * Templates first, AI enhances, psychology gates quality.
 *
 * Phase 1 Foundation:
 * - IndustryProfileService: Load psychology from 380 profiles
 * - UVPProviderService: Extract template variables from brand data
 * - EQIntegrationService: Map EQ scores to 6 customer categories
 * - TemplateService: Select and populate templates
 *
 * Phase 2 Scoring Engine:
 * - SynapseScorerService: 6-dimension psychology scoring
 * - Power word analyzer, emotional trigger analyzer
 * - Readability scorer, CTA detector, hint generator
 *
 * Created: 2025-12-01
 */

// Types
export * from './types';

// Phase 1 Services
export { industryProfileService, loadPsychology, findBestMatch, getPowerWords, getHooks } from './industry-profile.service';
export { uvpProviderService, getVariables, formatForTemplate, populateTemplate, createFromRaw } from './uvp-provider.service';
export { eqIntegrationService, getProfile, mapToCustomerCategory, getEmotionalTemperature, getContentDistribution, getAITemperature, getPriorityTriggers } from './eq-integration.service';
export { templateService, selectTemplate, populateTemplate as populateTemplateWithVariables, getTemplatesByCategory, getTemplatesByPlatform, getTemplateById, getRandomHook } from './template.service';

// Phase 2 Services
export {
  synapseScorerService,
  scoreSync as score,
  analyzePowerWords,
  analyzeEmotionalTriggers,
  analyzeReadability,
  analyzeCTA,
  analyzeUrgency,
  analyzeTrust,
  generateHints,
} from './synapse-scorer.service';

// Phase 3 Services
export {
  aiEnhancerService,
  enhance,
  enhanceWithRetry,
  generateWithFallback,
  getFallbackTemplate,
  buildSystemPrompt,
  buildUserPrompt,
  logGeneration,
  getGenerationStats,
  getRecentLogs,
  DEFAULT_AI_CONFIG,
} from './ai-enhancer.service';

// Phase 4 Services
export {
  intelligenceService,
  getIntelligence,
  mergeIntoVariables,
  getIntelligencePowerWords,
  extractBestTrend,
  extractCompetitiveEdge,
  extractCustomerPhrases,
  extractProofPoint,
  clearCache as clearIntelligenceCache,
  getCacheStats as getIntelligenceCacheStats,
} from './intelligence.service';

// Phase 5 Services - Orchestration & Deduplication
export {
  contentOrchestrator,
  ContentOrchestrator,
  type V5Context,
  type GenerationOptions,
  type GenerationProgress,
  type ProgressCallback,
} from './content-orchestrator';

export {
  embeddingsService,
  EmbeddingsService,
  type ContentEmbedding,
  type DuplicateCheckResult,
  type EmbeddingsServiceConfig,
} from './embeddings.service';

// Data
export { UNIVERSAL_TEMPLATES } from '@/data/v5/universal-templates';
