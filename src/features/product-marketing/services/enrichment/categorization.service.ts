/**
 * Categorization Enrichment Service
 *
 * Automatically categorizes products based on their attributes.
 * Uses pattern matching and keyword analysis.
 */

import type { Product, ProductCategory } from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { listCategories, updateProduct } from '../catalog';
import { getPMSupabaseClient } from '../catalog/supabase-pm.client';

// ============================================================================
// TYPES
// ============================================================================

export interface CategorizationResult {
  productId: string;
  suggestedCategoryId: string | null;
  confidence: number;
  matchedKeywords: string[];
  alternativeCategories: Array<{
    categoryId: string;
    confidence: number;
  }>;
}

export interface CategorizationConfig {
  minConfidence?: number;
  autoApply?: boolean;
  maxAlternatives?: number;
}

// ============================================================================
// CATEGORY PATTERNS
// ============================================================================

const CATEGORY_PATTERNS: Record<string, {
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}> = {
  'products': {
    keywords: ['product', 'item', 'goods', 'merchandise', 'equipment', 'device', 'tool'],
    patterns: [/\b(product|item|device|tool|equipment)\b/i],
    weight: 1.0,
  },
  'services': {
    keywords: ['service', 'consulting', 'support', 'maintenance', 'repair', 'installation'],
    patterns: [/\b(service|consulting|support|maintenance)\b/i],
    weight: 1.0,
  },
  'subscriptions': {
    keywords: ['subscription', 'monthly', 'annual', 'plan', 'membership', 'recurring'],
    patterns: [/\b(subscription|membership|plan)\b/i, /\b(monthly|annual|yearly)\b/i],
    weight: 1.2,
  },
  'bundles': {
    keywords: ['bundle', 'package', 'combo', 'kit', 'set', 'collection'],
    patterns: [/\b(bundle|package|combo|kit|set)\b/i],
    weight: 1.1,
  },
};

// ============================================================================
// CATEGORIZATION SERVICE
// ============================================================================

/**
 * Categorize a single product
 */
export async function categorizeProduct(
  product: Product,
  config: CategorizationConfig = {}
): Promise<CategorizationResult> {
  if (!isFeatureEnabled('ENRICHMENT_CATEGORIZATION_ENABLED')) {
    return {
      productId: product.id,
      suggestedCategoryId: null,
      confidence: 0,
      matchedKeywords: [],
      alternativeCategories: [],
    };
  }

  const minConfidence = config.minConfidence ?? 0.3;
  const maxAlternatives = config.maxAlternatives ?? 3;

  // Get available categories (global categories, not brand-specific)
  const categories = await listCategories();

  if (categories.length === 0) {
    return {
      productId: product.id,
      suggestedCategoryId: null,
      confidence: 0,
      matchedKeywords: [],
      alternativeCategories: [],
    };
  }

  // Build text to analyze
  const textToAnalyze = [
    product.name,
    product.description || '',
    (product.tags || []).join(' '),
  ].join(' ').toLowerCase();

  // Score each category
  const scores: Array<{
    category: ProductCategory;
    score: number;
    matchedKeywords: string[];
  }> = [];

  for (const category of categories) {
    const { score, matchedKeywords } = scoreCategory(category, textToAnalyze);
    if (score > 0) {
      scores.push({ category, score, matchedKeywords });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Get best match
  const best = scores[0];
  const confidence = best ? Math.min(1, best.score) : 0;

  const result: CategorizationResult = {
    productId: product.id,
    suggestedCategoryId: best && confidence >= minConfidence ? best.category.id : null,
    confidence,
    matchedKeywords: best?.matchedKeywords || [],
    alternativeCategories: scores.slice(1, maxAlternatives + 1).map(s => ({
      categoryId: s.category.id,
      confidence: Math.min(1, s.score),
    })),
  };

  // Auto-apply if configured
  if (config.autoApply && result.suggestedCategoryId) {
    await updateProduct(product.id, { categoryId: result.suggestedCategoryId });
  }

  return result;
}

/**
 * Categorize multiple products
 */
export async function categorizeProducts(
  products: Product[],
  config: CategorizationConfig = {}
): Promise<CategorizationResult[]> {
  const results: CategorizationResult[] = [];

  for (const product of products) {
    const result = await categorizeProduct(product, config);
    results.push(result);
  }

  return results;
}

/**
 * Score a category against product text
 */
function scoreCategory(
  category: ProductCategory,
  text: string
): { score: number; matchedKeywords: string[] } {
  let score = 0;
  const matchedKeywords: string[] = [];

  // Check category name
  const categoryName = category.name.toLowerCase();
  if (text.includes(categoryName)) {
    score += 0.5;
    matchedKeywords.push(categoryName);
  }

  // Check against known patterns
  const patternConfig = CATEGORY_PATTERNS[category.slug] || CATEGORY_PATTERNS[categoryName];

  if (patternConfig) {
    // Check keywords
    for (const keyword of patternConfig.keywords) {
      if (text.includes(keyword)) {
        score += 0.2 * patternConfig.weight;
        matchedKeywords.push(keyword);
      }
    }

    // Check patterns
    for (const pattern of patternConfig.patterns) {
      if (pattern.test(text)) {
        score += 0.3 * patternConfig.weight;
      }
    }
  }

  // Check category description keywords
  if (category.description) {
    const descWords = category.description.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length > 4 && text.includes(word)) {
        score += 0.1;
        if (!matchedKeywords.includes(word)) {
          matchedKeywords.push(word);
        }
      }
    }
  }

  return { score, matchedKeywords: [...new Set(matchedKeywords)] };
}

/**
 * Suggest new categories based on uncategorized products
 */
export async function suggestNewCategories(
  brandId: string,
  minProducts = 3
): Promise<Array<{ name: string; productCount: number; sampleProducts: string[] }>> {
  const client = getPMSupabaseClient();

  // Get uncategorized products
  const { data: products } = await client
    .from('pm_products')
    .select('id, name, tags')
    .eq('brand_id', brandId)
    .is('category_id', null)
    .limit(100);

  if (!products || products.length < minProducts) {
    return [];
  }

  // Extract common terms
  const termCounts = new Map<string, { count: number; products: string[] }>();

  for (const product of products) {
    const terms = extractTerms(product.name);

    for (const term of terms) {
      const existing = termCounts.get(term);
      if (existing) {
        existing.count++;
        if (existing.products.length < 5) {
          existing.products.push(product.name);
        }
      } else {
        termCounts.set(term, { count: 1, products: [product.name] });
      }
    }
  }

  // Filter to terms appearing in multiple products
  const suggestions: Array<{ name: string; productCount: number; sampleProducts: string[] }> = [];

  for (const [term, data] of termCounts) {
    if (data.count >= minProducts) {
      suggestions.push({
        name: capitalizeFirst(term),
        productCount: data.count,
        sampleProducts: data.products,
      });
    }
  }

  return suggestions.sort((a, b) => b.productCount - a.productCount).slice(0, 10);
}

/**
 * Extract meaningful terms from text
 */
function extractTerms(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

  return words.filter(w => w.length > 3 && !stopWords.includes(w));
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
