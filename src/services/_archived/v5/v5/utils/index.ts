/**
 * V5 Utility Exports
 *
 * Phase 6 utilities for template management and validation.
 *
 * Created: 2025-12-01
 */

// Template Coverage Validation
export {
  templateCoverageValidator,
  TemplateCoverageValidator,
  type CoverageReport,
  type PlatformCoverage,
  type CategoryCoverage,
  type ContentTypeCoverage,
  type CrossCoverageMatrix,
  type CoverageGap,
} from './template-coverage-validator';

// Industry Template Extraction
export {
  industryTemplateExtractor,
  IndustryTemplateExtractor,
  type IndustryTemplateSource,
  type RawIndustryTemplate,
  type ExtractionResult,
  type SkippedTemplate,
  type ExtractionStats,
} from './industry-template-extractor';

// V4 vs V5 Comparison (for validation testing)
export {
  v4V5Comparison,
  V4V5Comparison,
  type ComparisonRequest,
  type ComparisonResult,
  type V4ContentSample,
  type V5SampleResult,
  type QualityComparison,
  type BatchComparisonResult,
} from './v4-v5-comparison';
