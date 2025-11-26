/**
 * Extraction Services Index
 *
 * Exports all extraction-related services and utilities.
 */

// Base extractor
export {
  BaseExtractor,
  type ExtractorContext,
  type ExtractorConfig,
  type ExtractorFactory,
} from './base-extractor';

// Individual extractors
export {
  UVPExtractor,
  createUVPExtractor,
} from './uvp-extractor.service';

export {
  WebsiteExtractor,
  createWebsiteExtractor,
} from './website-extractor.service';

export {
  ReviewExtractor,
  createReviewExtractor,
} from './review-extractor.service';

export {
  KeywordExtractor,
  createKeywordExtractor,
} from './keyword-extractor.service';

// Orchestrator
export {
  ExtractionOrchestrator,
  createExtractionOrchestrator,
  quickExtract,
  fullExtract,
} from './extraction-orchestrator.service';
