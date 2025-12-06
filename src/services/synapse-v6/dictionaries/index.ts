/**
 * Dictionary Module Index
 *
 * Exports all dictionary builders and utilities
 */

export {
  type IndustryDictionary,
  buildIndustryDictionary,
  matchesIndustryDictionary,
  getIndustrySicCodes,
  INDUSTRY_EXPANSIONS,
} from './industry.dictionary';

export {
  type AudienceDictionary,
  buildAudienceDictionary,
  matchesAudienceDictionary,
  ROLE_EXPANSIONS,
} from './audience.dictionary';

export {
  type SourceType,
  type PainVocabulary,
  PAIN_DICTIONARIES,
  getSourceType,
  getPainVocabulary,
  matchesPainDictionary,
  getMatchedPainTerms,
} from './pain.dictionary';

export {
  type CategoryDictionary,
  buildCategoryDictionary,
  getCategoryBoost,
  matchesCategoryDictionary,
  CATEGORY_EXPANSIONS,
} from './category.dictionary';
