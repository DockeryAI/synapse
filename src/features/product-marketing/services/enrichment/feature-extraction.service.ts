/**
 * Feature Extraction Enrichment Service
 *
 * Extracts and structures product features from descriptions.
 * Generates feature lists, key benefits, and specifications.
 */

import type { Product } from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { updateProduct, getPMSupabaseClient } from '../catalog';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedFeature {
  text: string;
  category: 'benefit' | 'specification' | 'feature' | 'use_case';
  confidence: number;
  keywords: string[];
}

export interface FeatureExtractionResult {
  productId: string;
  features: ExtractedFeature[];
  keyBenefits: string[];
  specifications: string[];
  useCases: string[];
  suggestedTags: string[];
}

export interface FeatureExtractionConfig {
  maxFeatures?: number;
  minConfidence?: number;
  autoApply?: boolean;
}

// ============================================================================
// FEATURE PATTERNS
// ============================================================================

const BENEFIT_PATTERNS: RegExp[] = [
  /(?:helps?|enables?|allows?|provides?|offers?|delivers?)\s+(.{10,100}?)(?:\.|,|$)/gi,
  /(?:save|reduce|increase|improve|enhance|boost|maximize)\s+(.{5,50}?)(?:\.|,|$)/gi,
  /(?:faster|better|easier|simpler|more\s+efficient)\s+(.{5,50}?)(?:\.|,|$)/gi,
];

const SPECIFICATION_PATTERNS: RegExp[] = [
  /(\d+(?:\.\d+)?)\s*(GB|MB|TB|KB|MHz|GHz|mm|cm|m|kg|lb|hours?|minutes?|seconds?)/gi,
  /(?:up to|supports?|compatible with)\s+(.{5,50}?)(?:\.|,|$)/gi,
  /(?:made of|built with|powered by)\s+(.{5,50}?)(?:\.|,|$)/gi,
];

const USE_CASE_PATTERNS: RegExp[] = [
  /(?:perfect for|ideal for|great for|designed for|best for)\s+(.{10,80}?)(?:\.|,|$)/gi,
  /(?:use it to|can be used to|helps you)\s+(.{10,80}?)(?:\.|,|$)/gi,
  /(?:whether you're|if you're|for those who)\s+(.{10,80}?)(?:\.|,|$)/gi,
];

const FEATURE_PATTERNS: RegExp[] = [
  /(?:includes?|features?|comes with|equipped with)\s+(.{5,80}?)(?:\.|,|$)/gi,
  /(?:built-in|integrated|automatic)\s+(.{5,50}?)(?:\.|,|$)/gi,
];

// ============================================================================
// FEATURE EXTRACTION SERVICE
// ============================================================================

/**
 * Extract features from a product
 */
export async function extractProductFeatures(
  product: Product,
  config: FeatureExtractionConfig = {}
): Promise<FeatureExtractionResult> {
  if (!isFeatureEnabled('ENRICHMENT_FEATURES_ENABLED')) {
    return createEmptyResult(product.id);
  }

  const maxFeatures = config.maxFeatures ?? 10;
  const minConfidence = config.minConfidence ?? 0.3;

  // Build text to analyze
  const textToAnalyze = [
    product.name,
    product.description || '',
    product.shortDescription || '',
  ].join(' ');

  // Extract different types of features
  const benefits = extractByPatterns(textToAnalyze, BENEFIT_PATTERNS, 'benefit');
  const specifications = extractByPatterns(textToAnalyze, SPECIFICATION_PATTERNS, 'specification');
  const useCases = extractByPatterns(textToAnalyze, USE_CASE_PATTERNS, 'use_case');
  const features = extractByPatterns(textToAnalyze, FEATURE_PATTERNS, 'feature');

  // Combine and deduplicate
  const allFeatures = [...benefits, ...specifications, ...useCases, ...features]
    .filter(f => f.confidence >= minConfidence)
    .slice(0, maxFeatures);

  // Generate suggested tags from features
  const suggestedTags = generateTagsFromFeatures(allFeatures);

  const result: FeatureExtractionResult = {
    productId: product.id,
    features: allFeatures,
    keyBenefits: benefits.map(f => f.text).slice(0, 5),
    specifications: specifications.map(f => f.text).slice(0, 5),
    useCases: useCases.map(f => f.text).slice(0, 5),
    suggestedTags,
  };

  // Auto-apply tags if configured
  if (config.autoApply && suggestedTags.length > 0) {
    const existingTags = product.tags || [];
    const newTags = [...new Set([...existingTags, ...suggestedTags])];
    await updateProduct(product.id, { tags: newTags });
  }

  return result;
}

/**
 * Extract features for multiple products
 */
export async function extractFeaturesForProducts(
  products: Product[],
  config: FeatureExtractionConfig = {}
): Promise<FeatureExtractionResult[]> {
  const results: FeatureExtractionResult[] = [];

  for (const product of products) {
    const result = await extractProductFeatures(product, config);
    results.push(result);
  }

  return results;
}

/**
 * Extract matches using patterns
 */
function extractByPatterns(
  text: string,
  patterns: RegExp[],
  category: ExtractedFeature['category']
): ExtractedFeature[] {
  const features: ExtractedFeature[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    // Reset regex lastIndex
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const extracted = match[1]?.trim();
      if (extracted && extracted.length >= 5) {
        const normalized = extracted.toLowerCase();

        if (!seen.has(normalized)) {
          seen.add(normalized);
          features.push({
            text: cleanExtractedText(extracted),
            category,
            confidence: calculateFeatureConfidence(extracted, category),
            keywords: extractKeywords(extracted),
          });
        }
      }
    }
  }

  return features;
}

/**
 * Clean extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/^\s*[-•*]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate feature confidence
 */
function calculateFeatureConfidence(text: string, category: ExtractedFeature['category']): number {
  let confidence = 0.5;

  // Longer, more specific text = higher confidence
  if (text.length > 50) confidence += 0.2;
  else if (text.length > 25) confidence += 0.1;

  // Contains numbers (specifications) = higher confidence
  if (/\d/.test(text) && category === 'specification') {
    confidence += 0.2;
  }

  // Action verbs in benefits = higher confidence
  if (category === 'benefit' && /\b(save|improve|reduce|increase|boost)\b/i.test(text)) {
    confidence += 0.15;
  }

  return Math.min(1, confidence);
}

/**
 * Extract keywords from feature text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'your', 'you', 'it'];

  return words
    .filter(w => w.length > 3 && !stopWords.includes(w))
    .slice(0, 5);
}

/**
 * Generate tags from extracted features
 */
function generateTagsFromFeatures(features: ExtractedFeature[]): string[] {
  const tagCounts = new Map<string, number>();

  for (const feature of features) {
    for (const keyword of feature.keywords) {
      const count = tagCounts.get(keyword) || 0;
      tagCounts.set(keyword, count + 1);
    }
  }

  // Return most common keywords as tags
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
}

/**
 * Create empty result
 */
function createEmptyResult(productId: string): FeatureExtractionResult {
  return {
    productId,
    features: [],
    keyBenefits: [],
    specifications: [],
    useCases: [],
    suggestedTags: [],
  };
}

/**
 * Generate a feature summary for a product
 */
export function generateFeatureSummary(result: FeatureExtractionResult): string {
  const parts: string[] = [];

  if (result.keyBenefits.length > 0) {
    parts.push(`Key benefits: ${result.keyBenefits.slice(0, 3).join(', ')}`);
  }

  if (result.specifications.length > 0) {
    parts.push(`Specifications: ${result.specifications.slice(0, 3).join(', ')}`);
  }

  if (result.useCases.length > 0) {
    parts.push(`Best for: ${result.useCases.slice(0, 2).join(', ')}`);
  }

  return parts.join('. ');
}

/**
 * Compare features between two products
 */
export function compareProductFeatures(
  result1: FeatureExtractionResult,
  result2: FeatureExtractionResult
): {
  commonFeatures: string[];
  uniqueToFirst: string[];
  uniqueToSecond: string[];
} {
  const features1 = new Set(result1.features.map(f => f.text.toLowerCase()));
  const features2 = new Set(result2.features.map(f => f.text.toLowerCase()));

  const common = [...features1].filter(f => features2.has(f));
  const uniqueFirst = [...features1].filter(f => !features2.has(f));
  const uniqueSecond = [...features2].filter(f => !features1.has(f));

  return {
    commonFeatures: common,
    uniqueToFirst: uniqueFirst,
    uniqueToSecond: uniqueSecond,
  };
}
