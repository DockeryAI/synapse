/**
 * V2 Services Index
 */

export { CampaignStorageService, campaignStorage } from './campaign-storage.service';
export {
  TemplateSelectorService,
  templateSelector,
  type ConnectionAnalysis,
  type DataPointPattern,
  type TemplateRecommendation,
} from './template-selector.service';
export {
  PerformancePredictorService,
  performancePredictor,
  type PerformancePrediction,
  type PerformanceFactor,
  type IndustryBenchmark,
  type AggregatedPrediction,
} from './performance-predictor.service';
