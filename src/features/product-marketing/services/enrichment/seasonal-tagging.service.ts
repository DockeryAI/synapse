/**
 * Seasonal Tagging Enrichment Service
 *
 * Identifies and tags products with seasonal relevance.
 * Determines best times to promote specific products.
 */

import type { Product } from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { updateProduct } from '../catalog';

// ============================================================================
// TYPES
// ============================================================================

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Holiday =
  | 'new_years'
  | 'valentines'
  | 'easter'
  | 'mothers_day'
  | 'fathers_day'
  | 'july_4th'
  | 'labor_day'
  | 'halloween'
  | 'thanksgiving'
  | 'black_friday'
  | 'christmas'
  | 'back_to_school';

export interface SeasonalTag {
  type: 'season' | 'holiday' | 'event';
  value: string;
  confidence: number;
  startMonth?: number;
  endMonth?: number;
}

export interface SeasonalAnalysisResult {
  productId: string;
  isSeasonal: boolean;
  primarySeason: Season | null;
  seasons: SeasonalTag[];
  holidays: SeasonalTag[];
  bestMonths: number[];
  peakDemandPeriod: string | null;
  suggestedTags: string[];
}

export interface SeasonalConfig {
  minConfidence?: number;
  autoApply?: boolean;
  includeHolidays?: boolean;
}

// ============================================================================
// SEASONAL PATTERNS
// ============================================================================

const SEASON_PATTERNS: Record<Season, {
  keywords: string[];
  months: number[];
}> = {
  spring: {
    keywords: ['spring', 'easter', 'garden', 'planting', 'allergy', 'pollen', 'renewal', 'fresh'],
    months: [3, 4, 5],
  },
  summer: {
    keywords: ['summer', 'beach', 'pool', 'vacation', 'outdoor', 'bbq', 'camping', 'sun', 'heat', 'cooling'],
    months: [6, 7, 8],
  },
  fall: {
    keywords: ['fall', 'autumn', 'harvest', 'back to school', 'halloween', 'thanksgiving', 'pumpkin', 'cozy'],
    months: [9, 10, 11],
  },
  winter: {
    keywords: ['winter', 'snow', 'holiday', 'christmas', 'cold', 'heating', 'warm', 'ski', 'ice'],
    months: [12, 1, 2],
  },
};

const HOLIDAY_PATTERNS: Record<Holiday, {
  keywords: string[];
  month: number;
  dayRange?: [number, number];
}> = {
  new_years: {
    keywords: ['new year', 'resolution', 'new beginning', 'fresh start'],
    month: 1,
    dayRange: [1, 15],
  },
  valentines: {
    keywords: ['valentine', 'love', 'romance', 'heart', 'couples', 'romantic', 'gift for her', 'gift for him'],
    month: 2,
    dayRange: [1, 14],
  },
  easter: {
    keywords: ['easter', 'bunny', 'egg', 'spring celebration'],
    month: 4,
  },
  mothers_day: {
    keywords: ['mother', 'mom', 'mommy', 'gift for mom', 'mothers day'],
    month: 5,
    dayRange: [1, 15],
  },
  fathers_day: {
    keywords: ['father', 'dad', 'daddy', 'gift for dad', 'fathers day'],
    month: 6,
    dayRange: [1, 21],
  },
  july_4th: {
    keywords: ['july 4th', 'fourth of july', 'independence day', 'patriotic', 'fireworks'],
    month: 7,
    dayRange: [1, 7],
  },
  labor_day: {
    keywords: ['labor day', 'end of summer'],
    month: 9,
    dayRange: [1, 10],
  },
  halloween: {
    keywords: ['halloween', 'costume', 'spooky', 'scary', 'trick or treat', 'pumpkin'],
    month: 10,
  },
  thanksgiving: {
    keywords: ['thanksgiving', 'turkey', 'gratitude', 'feast', 'family gathering'],
    month: 11,
    dayRange: [15, 30],
  },
  black_friday: {
    keywords: ['black friday', 'cyber monday', 'deals', 'sale', 'discount'],
    month: 11,
    dayRange: [20, 30],
  },
  christmas: {
    keywords: ['christmas', 'xmas', 'holiday gift', 'santa', 'stocking', 'gift giving'],
    month: 12,
  },
  back_to_school: {
    keywords: ['back to school', 'school supplies', 'student', 'classroom', 'education', 'learning'],
    month: 8,
  },
};

// ============================================================================
// SEASONAL TAGGING SERVICE
// ============================================================================

/**
 * Analyze seasonal relevance for a product
 */
export async function analyzeSeasonality(
  product: Product,
  config: SeasonalConfig = {}
): Promise<SeasonalAnalysisResult> {
  if (!isFeatureEnabled('ENRICHMENT_SEASONAL_ENABLED')) {
    return createEmptyResult(product.id);
  }

  const minConfidence = config.minConfidence ?? 0.3;
  const includeHolidays = config.includeHolidays ?? true;

  // Build text to analyze
  const textToAnalyze = [
    product.name,
    product.description || '',
    (product.tags || []).join(' '),
  ].join(' ').toLowerCase();

  // Analyze seasons
  const seasons = analyzeSeasons(textToAnalyze, minConfidence);

  // Analyze holidays
  const holidays = includeHolidays
    ? analyzeHolidays(textToAnalyze, minConfidence)
    : [];

  // Determine if product is seasonal
  const isSeasonal = seasons.length > 0 || holidays.length > 0;

  // Find primary season
  const primarySeason = seasons.length > 0
    ? seasons.sort((a, b) => b.confidence - a.confidence)[0].value as Season
    : null;

  // Calculate best months
  const bestMonths = calculateBestMonths(seasons, holidays);

  // Generate peak demand description
  const peakDemandPeriod = generatePeakDemandDescription(primarySeason, holidays);

  // Generate suggested tags
  const suggestedTags = generateSeasonalTags(seasons, holidays);

  const result: SeasonalAnalysisResult = {
    productId: product.id,
    isSeasonal,
    primarySeason,
    seasons,
    holidays,
    bestMonths,
    peakDemandPeriod,
    suggestedTags,
  };

  // Auto-apply if configured
  if (config.autoApply && (isSeasonal || suggestedTags.length > 0)) {
    const updates: Partial<Product> = {
      isSeasonal,
    };

    if (suggestedTags.length > 0) {
      const existingTags = product.tags || [];
      updates.tags = [...new Set([...existingTags, ...suggestedTags])];
    }

    await updateProduct(product.id, updates);
  }

  return result;
}

/**
 * Analyze multiple products for seasonality
 */
export async function analyzeProductsSeasonality(
  products: Product[],
  config: SeasonalConfig = {}
): Promise<SeasonalAnalysisResult[]> {
  const results: SeasonalAnalysisResult[] = [];

  for (const product of products) {
    const result = await analyzeSeasonality(product, config);
    results.push(result);
  }

  return results;
}

/**
 * Analyze text for seasonal patterns
 */
function analyzeSeasons(text: string, minConfidence: number): SeasonalTag[] {
  const results: SeasonalTag[] = [];

  for (const [season, config] of Object.entries(SEASON_PATTERNS)) {
    const matchedKeywords = config.keywords.filter(kw => text.includes(kw));
    const confidence = calculateConfidence(matchedKeywords.length, config.keywords.length);

    if (confidence >= minConfidence) {
      results.push({
        type: 'season',
        value: season,
        confidence,
        startMonth: config.months[0],
        endMonth: config.months[config.months.length - 1],
      });
    }
  }

  return results;
}

/**
 * Analyze text for holiday patterns
 */
function analyzeHolidays(text: string, minConfidence: number): SeasonalTag[] {
  const results: SeasonalTag[] = [];

  for (const [holiday, config] of Object.entries(HOLIDAY_PATTERNS)) {
    const matchedKeywords = config.keywords.filter(kw => text.includes(kw));
    const confidence = calculateConfidence(matchedKeywords.length, config.keywords.length);

    if (confidence >= minConfidence) {
      results.push({
        type: 'holiday',
        value: holiday,
        confidence,
        startMonth: config.month,
        endMonth: config.month,
      });
    }
  }

  return results;
}

/**
 * Calculate confidence based on keyword matches
 */
function calculateConfidence(matched: number, total: number): number {
  if (matched === 0) return 0;
  // At least one match gets base confidence
  const base = 0.4;
  // Additional matches increase confidence
  const additional = Math.min(0.5, (matched - 1) * 0.15);
  return base + additional;
}

/**
 * Calculate best months for promotion
 */
function calculateBestMonths(seasons: SeasonalTag[], holidays: SeasonalTag[]): number[] {
  const monthScores = new Map<number, number>();

  // Add season months
  for (const season of seasons) {
    if (season.startMonth && season.endMonth) {
      for (let m = season.startMonth; m <= season.endMonth; m++) {
        const current = monthScores.get(m) || 0;
        monthScores.set(m, current + season.confidence);
      }
    }
  }

  // Add holiday months (with higher weight)
  for (const holiday of holidays) {
    if (holiday.startMonth) {
      const current = monthScores.get(holiday.startMonth) || 0;
      monthScores.set(holiday.startMonth, current + holiday.confidence * 1.5);
    }
  }

  // Sort by score and return months
  return Array.from(monthScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([month]) => month);
}

/**
 * Generate peak demand description
 */
function generatePeakDemandDescription(
  primarySeason: Season | null,
  holidays: SeasonalTag[]
): string | null {
  const parts: string[] = [];

  if (primarySeason) {
    parts.push(capitalizeFirst(primarySeason));
  }

  if (holidays.length > 0) {
    const topHolidays = holidays
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2)
      .map(h => formatHolidayName(h.value));

    parts.push(...topHolidays);
  }

  if (parts.length === 0) return null;

  return parts.join(', ');
}

/**
 * Generate seasonal tags
 */
function generateSeasonalTags(seasons: SeasonalTag[], holidays: SeasonalTag[]): string[] {
  const tags: string[] = [];

  for (const season of seasons) {
    tags.push(season.value);
    tags.push(`${season.value}-season`);
  }

  for (const holiday of holidays) {
    tags.push(holiday.value.replace(/_/g, '-'));
  }

  return [...new Set(tags)];
}

/**
 * Format holiday name for display
 */
function formatHolidayName(holiday: string): string {
  return holiday
    .split('_')
    .map(capitalizeFirst)
    .join(' ');
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create empty result
 */
function createEmptyResult(productId: string): SeasonalAnalysisResult {
  return {
    productId,
    isSeasonal: false,
    primarySeason: null,
    seasons: [],
    holidays: [],
    bestMonths: [],
    peakDemandPeriod: null,
    suggestedTags: [],
  };
}

/**
 * Get current season
 */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Get upcoming holidays (next 60 days)
 */
export function getUpcomingHolidays(): Holiday[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  const upcoming: Holiday[] = [];

  for (const [holiday, config] of Object.entries(HOLIDAY_PATTERNS)) {
    if (config.month === currentMonth || config.month === nextMonth) {
      upcoming.push(holiday as Holiday);
    }
  }

  return upcoming;
}

/**
 * Check if a product is in-season right now
 */
export function isProductInSeason(result: SeasonalAnalysisResult): boolean {
  if (!result.isSeasonal) return true; // Non-seasonal products are always "in season"

  const currentMonth = new Date().getMonth() + 1;
  return result.bestMonths.includes(currentMonth);
}
