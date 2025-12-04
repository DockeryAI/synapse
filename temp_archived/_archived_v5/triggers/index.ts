/**
 * Triggers Services - Barrel Export
 *
 * Triggers 3.0 service modules for psychological buying trigger
 * discovery, validation, and scoring.
 *
 * Phase 1 (Foundation Layer):
 * - recency-calculator: Exponential decay weighting for signal freshness
 * - competitor-attribution: Fuzzy matching for brand mentions
 * - trigger-title-generator: Semantic, source-aware title generation
 * - confidence-scorer: Multi-signal confidence scoring
 *
 * Phase 2 (SMB Signal Pipeline):
 * - reddit-smb-analyzer: SMB subreddit coverage & recommendation detection
 * - review-aggregator: Cross-platform review aggregation
 * - smb-classifier: Company size, decision-maker, budget estimation
 * - urgency-detector: Buying urgency classification
 *
 * Phase 3 (Profile-Specific Pipelines):
 * - profile-router: Routes signals to appropriate processing pipelines
 * - local-signals: Local service profile signal processing (B2B + B2C)
 * - regional-signals: Regional profile signal processing (Agency + Retail)
 * - national-signals: National/global profile signal processing (SaaS + Product)
 * - profile-configs: Centralized profile configuration
 *
 * Phase 4 (Enterprise ABM Layer):
 * - signal-stacker: Cross-source correlation and signal clustering
 * - surge-detector: Anomaly detection and activity spike identification
 * - buying-stage-classifier: Buyer journey stage classification
 *
 * Phase 5 (Caching & Performance):
 * - trigger-cache: Intelligent caching with background refresh
 *
 * Existing Services:
 * - trigger-consolidation: Groups evidence under synthesized triggers
 * - source-quality: Profile-aware source tier weighting
 * - profile-detection: Business profile detection from UVP
 * - llm-trigger-synthesizer: AI synthesis of triggers from raw data
 *
 * Created: 2025-12-01
 */

// =============================================================================
// PHASE 1: Foundation Layer Services (Triggers 3.0)
// =============================================================================

// Recency Calculator - Exponential decay for signal freshness
export {
  recencyCalculatorService,
  RecencyCalculatorService,
  type RecencyConfig,
  type RecencyResult,
  type TriggerEventType,
} from './recency-calculator.service';

// Competitor Attribution - Fuzzy matching for brand mentions
export {
  competitorAttributionService,
  CompetitorAttributionService,
  type CompetitorAlias,
  type CompetitorMention,
  type CompetitorAttributionResult,
  type FuzzyMatchResult,
} from './competitor-attribution.service';

// Trigger Title Generator - Semantic, source-aware titles
// DEPRECATED: Archived in V5 Simplified - titles now come directly from LLM synthesis
export {
  triggerTitleGeneratorService,
  TriggerTitleGeneratorService,
  type TriggerSentiment,
  type TitleGenerationContext,
  type GeneratedTitle,
  type TitleTemplate,
} from './_archived/trigger-title-generator.service';

// Confidence Scorer - Multi-signal confidence scoring
export {
  confidenceScorerService,
  ConfidenceScorerService,
  type ConfidenceLevel,
  type ConfidenceFactors,
  type ConfidenceExplanation,
  type ConfidenceResult,
  type TriggerSignal,
  type ConfidenceScoringInput,
  CONFIDENCE_THRESHOLDS,
  MINIMUM_QUALITY_BAR,
} from './confidence-scorer.service';

// =============================================================================
// PHASE 2: SMB Signal Pipeline Services (Triggers 3.0)
// =============================================================================

// Reddit SMB Analyzer - Enhanced Reddit integration for SMB
export {
  redditSMBAnalyzerService,
  RedditSMBAnalyzerService,
  type RedditSMBPost,
  type RedditSMBComment,
  type RecommendationRequest,
  type SMBSignal,
  type RedditSMBAnalysisResult,
} from './reddit-smb-analyzer.service';

// Review Aggregator - Cross-platform review aggregation
export {
  reviewAggregatorService,
  ReviewAggregatorService,
  type ReviewPlatform,
  type NormalizedReview,
  type ReviewSentimentAnalysis,
  type AggregatedReviewData,
  type ReviewAggregationConfig,
} from './review-aggregator.service';

// SMB Classifier - Company size, decision-maker, budget estimation
export {
  smbClassifierService,
  SMBClassifierService,
  type CompanySize,
  type DecisionMakerRole,
  type BudgetRange,
  type SMBSegment,
  type CompanySizeIndicators,
  type DecisionMakerIndicators,
  type BudgetIndicators,
  type SMBClassification,
  type ClassificationInput,
} from './smb-classifier.service';

// Urgency Detector - Buying urgency classification
export {
  urgencyDetectorService,
  UrgencyDetectorService,
  type UrgencyLevel,
  type UrgencyTriggerType,
  type UrgencyIndicator,
  type UrgencyAnalysis,
  type UrgencyDetectionInput,
} from './urgency-detector.service';

// =============================================================================
// PHASE 3: Profile-Specific Pipeline Services (Triggers 3.0)
// =============================================================================

// Profile Router - Routes signals to appropriate processing pipelines
export {
  profileRouterService,
  ProfileRouterService,
  type SignalCategory,
  type RawSignal,
  type ProcessedSignal,
  type RoutingDecision,
  type GeographicFilter,
  type ProfileRoutingConfig,
  type SeasonalPattern,
  type RouterStats,
} from './profile-router.service';

// Local Signals - Local service profile signal processing
export {
  localSignalsService,
  LocalSignalsService,
  type LocalSignalType,
  type GeoLocation,
  type LocalSignal,
  type LocalSignalMetadata,
  type LifeEventType,
  type LocalSignalResult,
  type LocalAreaAnalysis,
  type SeasonalTrend,
  type LocalRadiusConfig,
  type LocalSignalProcessingConfig,
} from './local-signals.service';

// Regional Signals - Regional profile signal processing
export {
  regionalSignalsService,
  RegionalSignalsService,
  type RegionalSignalType,
  type Territory,
  type RegionalSignal,
  type LocationMention,
  type RegionalSignalMetadata,
  type ContractCycle,
  type FranchisePattern,
  type RegionalSignalResult,
  type TerritoryAnalysis,
  type ContractCycleActivity,
  type RegionalProcessingConfig,
} from './regional-signals.service';

// National Signals - National/global profile signal processing
export {
  nationalSignalsService,
  NationalSignalsService,
  type NationalSignalType,
  type ReviewPlatformType,
  type TechStack,
  type NationalSignal,
  type NationalSignalMetadata,
  type SocialProofType,
  type ChurnSignal,
  type IntegrationEcosystem,
  type NationalSignalResult,
  type MarketIntelligence,
  type CompetitorIntelligence,
  type ChurnIndicator,
  type IntegrationDemand,
  type PricingSentiment,
  type NationalProcessingConfig,
} from './national-signals.service';

// Profile Configs - Centralized profile configuration
export {
  PROFILE_PIPELINE_CONFIGS,
  getProfileConfig,
  getProfilesByPipeline,
  getProfilesWithCompliance,
  getTier1Sources,
  getActiveSeasonalPatterns,
  getSeasonalBoost,
  getConfidenceThreshold,
  isGeographicFilteringEnabled,
  getProfileDisplayNames,
  type ProfilePipelineConfig,
  type SignalSourceConfig,
  type ConfidenceConfig,
  type RecencyConfig as ProfileRecencyConfig,
  type GeographicConfig,
  type TriggerGenerationConfig,
  type ScoringWeights,
  type SeasonalPatternConfig,
} from './profile-configs';

// =============================================================================
// PHASE 4: Enterprise ABM Layer Services (Triggers 3.0)
// =============================================================================

// Signal Stacker - Cross-source correlation and clustering
export {
  signalStackerService,
  SignalStackerService,
  type SignalSource,
  type IntentType,
  type RawSignalInput,
  type CorrelatedSignal,
  type SignalCluster,
  type StackedSignalResult,
  type StackingSummary,
  type CorrelationConfig,
  type ClusteringCriteria,
} from './signal-stacker.service';

// Surge Detector - Anomaly detection and activity spikes
export {
  surgeDetectorService,
  SurgeDetectorService,
  type SurgeType,
  type SurgeSeverity,
  type TimeGranularity,
  type SignalDataPoint,
  type TimeSeriesData,
  type BaselineStats,
  type SurgeEvent,
  type SurgeAnalysisResult,
  type SurgePrediction,
  type SurgeSummary,
  type SurgeDetectorConfig,
} from './surge-detector.service';

// Buying Stage Classifier - Buyer journey stage classification
export {
  buyingStageClassifierService,
  BuyingStageClassifierService,
  type BuyingStage,
  type StageVelocity,
  type StageIndicator,
  type BuyingSignal,
  type StageClassification,
  type DetectedIndicator,
  type JourneyAnalysis,
  type JourneyMapEntry,
  type StageHistoryEntry,
  type StageClassifierConfig,
} from './buying-stage-classifier.service';

// =============================================================================
// EXISTING SERVICES
// =============================================================================

// Trigger Consolidation - Groups evidence under triggers
export {
  type TriggerCategory,
  type EvidenceItem,
  type UVPAlignment,
  type BuyerJourneyStage,
  type ConsolidatedTrigger,
  type DataSourceSummary,
  type TriggerConsolidationResult,
} from './trigger-consolidation.service';

// =============================================================================
// ARCHIVED SERVICES (V5 Simplified)
// Re-exported from _archived for backwards compatibility
// =============================================================================

// Source Quality - Profile-aware source tier weighting
// DEPRECATED: Use trigger-synthesis.service.ts PROFILE_SOURCE_TIERS instead
export {
  sourceQualityService,
  type SourceTier,
  type SourceQualityConfig,
  type ProfileSourceWeights,
  type SourceQualityResult,
} from './_archived/source-quality.service';

// Profile Detection - Business profile detection from UVP
// DEPRECATED: Use trigger-synthesis.service.ts with profileType from BrandProfile
export {
  profileDetectionService,
  type BusinessProfileType,
  type ProfileTriggerConfig,
  type BusinessProfileAnalysis,
  type GatedApiType,
  PROFILE_CONFIGS,
  shouldRunApi,
  getApiPriorityOrder,
  getApiWeight,
  getEnabledApis,
} from './_archived/profile-detection.service';

// Trigger Relevance Scorer
export { triggerRelevanceScorerService } from './trigger-relevance-scorer.service';

// Buyer-Product Fit Service
export { buyerProductFitService } from './buyer-product-fit.service';

// JTBD Validator Service
export { jtbdValidatorService } from './jtbd-validator.service';

// Quote Validator Service
export { quoteValidatorService } from './quote-validator.service';

// UVP Vocabulary Service
export { uvpVocabularyService } from './uvp-vocabulary.service';

// Profile Relevance Service
export { profileRelevanceService } from './profile-relevance.service';

// Trigger Title Rewriter (legacy - use trigger-title-generator for new code)
export { triggerTitleRewriterService } from './trigger-title-rewriter.service';

// =============================================================================
// PHASE 5: Caching & Performance Services (Triggers 3.0)
// =============================================================================

// Trigger Cache - Intelligent caching with background refresh
export {
  triggerCacheService,
  TriggerCacheService,
  createTriggerCacheKey,
  preloadTriggers,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type CacheStatus,
  type CacheResult,
  type InvalidationStrategy,
  type InvalidationOptions,
} from './trigger-cache.service';

// =============================================================================
// TRIGGERS V5 SIMPLIFIED: Consolidated Multi-Pass Synthesis
// =============================================================================

// Trigger Synthesis Service - Consolidates LLM synthesis, consolidation, and scoring
// V1-style provenance with hard constraints: 2+ sources required, verbatim quotes, reasoning
export {
  triggerSynthesisService,
  type PassType,
  type RawDataSample,
  type BrandProfile,
  type PassResult,
  type MultiPassResult,
} from './trigger-synthesis.service';
