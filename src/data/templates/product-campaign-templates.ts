/**
 * Product Campaign Templates
 *
 * Campaign and content templates specifically designed for product-centric marketing.
 * Each template is optimized for promoting specific products based on insights.
 *
 * Part of Phase 3: Product Campaign Templates
 */

import type { Product } from '@/features/product-marketing/types/product.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductTemplateContext {
  product: Product;
  insight?: string;
  targetCustomer?: string;
  competitorGap?: string;
  seasonalContext?: string;
  urgency?: 'high' | 'medium' | 'low';
}

export interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  campaignType: string;
  platforms: string[];
  structure: {
    hook: string;
    body: string;
    cta: string;
  };
  variables: string[];
  bestFor: string[];
  exampleOutput?: string;
}

export interface GeneratedProductContent {
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  platform: string;
}

// ============================================================================
// PRODUCT CAMPAIGN TEMPLATES
// ============================================================================

export const PRODUCT_CAMPAIGN_TEMPLATES: ProductTemplate[] = [
  // Product Launch
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Introduce a new product or service with anticipation and excitement',
    campaignType: 'product_launch',
    platforms: ['instagram', 'facebook', 'linkedin', 'twitter'],
    structure: {
      hook: 'Introducing {productName} - {uniqueBenefit}',
      body: '{productDescription}\n\nWhy {targetCustomer} love it:\n{benefits}',
      cta: 'Be the first to try {productName} → {ctaLink}',
    },
    variables: ['productName', 'uniqueBenefit', 'productDescription', 'targetCustomer', 'benefits', 'ctaLink'],
    bestFor: ['new products', 'service launches', 'feature releases'],
  },

  // Feature Spotlight
  {
    id: 'feature-spotlight',
    name: 'Feature Spotlight',
    description: 'Highlight specific product features that solve customer problems',
    campaignType: 'feature_spotlight',
    platforms: ['instagram', 'linkedin', 'twitter'],
    structure: {
      hook: 'Did you know {productName} can {featureAction}?',
      body: '{featureDescription}\n\nThis means you can:\n{featureBenefits}',
      cta: 'See how → {ctaLink}',
    },
    variables: ['productName', 'featureAction', 'featureDescription', 'featureBenefits', 'ctaLink'],
    bestFor: ['complex products', 'feature education', 'differentiation'],
  },

  // Seasonal Push
  {
    id: 'seasonal-push',
    name: 'Seasonal Push',
    description: 'Promote products relevant to current season, weather, or holidays',
    campaignType: 'seasonal_push',
    platforms: ['instagram', 'facebook', 'twitter'],
    structure: {
      hook: '{seasonalEmoji} {seasonContext} is here! Time for {productName}',
      body: 'Perfect for {seasonalNeed}.\n\n{productDescription}\n\n⏰ {urgencyMessage}',
      cta: 'Get yours before {deadline} → {ctaLink}',
    },
    variables: ['seasonalEmoji', 'seasonContext', 'productName', 'seasonalNeed', 'productDescription', 'urgencyMessage', 'deadline', 'ctaLink'],
    bestFor: ['seasonal products', 'limited time offers', 'holiday promotions'],
  },

  // Problem-Solver
  {
    id: 'problem-solver',
    name: 'Problem-Solver',
    description: 'Address a specific customer pain point with your product as the solution',
    campaignType: 'problem_solver',
    platforms: ['linkedin', 'facebook', 'instagram'],
    structure: {
      hook: 'Tired of {painPoint}?',
      body: '{painDescription}\n\nThat\'s exactly why we created {productName}.\n\n{solutionExplanation}',
      cta: 'See the difference → {ctaLink}',
    },
    variables: ['painPoint', 'painDescription', 'productName', 'solutionExplanation', 'ctaLink'],
    bestFor: ['problem-aware customers', 'competitive positioning', 'value demonstration'],
  },

  // Comparison
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Position your product against alternatives or competitors',
    campaignType: 'comparison',
    platforms: ['linkedin', 'twitter'],
    structure: {
      hook: 'Why {targetCustomer} choose {productName} over {alternative}',
      body: '{comparisonPoints}\n\nThe difference? {keyDifferentiator}',
      cta: 'Make the switch → {ctaLink}',
    },
    variables: ['targetCustomer', 'productName', 'alternative', 'comparisonPoints', 'keyDifferentiator', 'ctaLink'],
    bestFor: ['competitive markets', 'premium positioning', 'switching customers'],
  },

  // Bundle Promotion
  {
    id: 'bundle-promotion',
    name: 'Bundle Promotion',
    description: 'Promote complementary products together for added value',
    campaignType: 'bundle_promotion',
    platforms: ['instagram', 'facebook'],
    structure: {
      hook: 'The perfect combo: {productName} + {bundledProduct}',
      body: 'Get more value with our bundle:\n{bundleDescription}\n\n💰 Save {savingsAmount}',
      cta: 'Grab the bundle → {ctaLink}',
    },
    variables: ['productName', 'bundledProduct', 'bundleDescription', 'savingsAmount', 'ctaLink'],
    bestFor: ['cross-selling', 'increasing order value', 'complementary products'],
  },

  // Bestseller Highlight
  {
    id: 'bestseller-highlight',
    name: 'Bestseller Highlight',
    description: 'Leverage social proof by featuring your most popular products',
    campaignType: 'social_proof',
    platforms: ['instagram', 'facebook', 'twitter'],
    structure: {
      hook: '⭐ Our #1 bestseller: {productName}',
      body: 'There\'s a reason {customerCount}+ customers love {productName}:\n\n{topReasons}\n\n"{customerQuote}"',
      cta: 'See why it\'s #1 → {ctaLink}',
    },
    variables: ['productName', 'customerCount', 'topReasons', 'customerQuote', 'ctaLink'],
    bestFor: ['building trust', 'new customers', 'social proof'],
  },

  // Behind the Scenes
  {
    id: 'behind-the-scenes',
    name: 'Behind the Scenes',
    description: 'Show the story and quality behind your product',
    campaignType: 'storytelling',
    platforms: ['instagram', 'linkedin', 'facebook'],
    structure: {
      hook: 'Ever wonder how we make {productName}?',
      body: '{behindTheScenes}\n\nEvery {productName} is {qualityStatement}.',
      cta: 'Experience the quality → {ctaLink}',
    },
    variables: ['productName', 'behindTheScenes', 'qualityStatement', 'ctaLink'],
    bestFor: ['premium products', 'handmade items', 'quality differentiation'],
  },
];

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

/**
 * Get the best template for a product-insight pairing
 */
export function selectTemplateForProduct(
  campaignType: string,
  product: Product
): ProductTemplate {
  // Find matching template by campaign type
  const template = PRODUCT_CAMPAIGN_TEMPLATES.find(t => t.campaignType === campaignType);

  if (template) return template;

  // Fallback selection based on product characteristics
  if (product.isSeasonal) {
    return PRODUCT_CAMPAIGN_TEMPLATES.find(t => t.id === 'seasonal-push')!;
  }
  if (product.isBestseller) {
    return PRODUCT_CAMPAIGN_TEMPLATES.find(t => t.id === 'bestseller-highlight')!;
  }
  if (product.isFeatured) {
    return PRODUCT_CAMPAIGN_TEMPLATES.find(t => t.id === 'feature-spotlight')!;
  }

  // Default to feature spotlight
  return PRODUCT_CAMPAIGN_TEMPLATES.find(t => t.id === 'feature-spotlight')!;
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate content from a template and product context
 */
export function generateProductContent(
  template: ProductTemplate,
  context: ProductTemplateContext,
  platform: string = 'instagram'
): GeneratedProductContent {
  const { product, insight, targetCustomer, competitorGap, seasonalContext } = context;

  // Build variable replacements
  const variables: Record<string, string> = {
    productName: product.name,
    productDescription: product.shortDescription || product.description || '',
    benefits: product.benefits?.join('\n• ') || '',
    features: product.features?.join('\n• ') || '',
    targetCustomer: targetCustomer || 'customers',
    price: product.priceDisplay || (product.price ? `$${product.price}` : ''),
    ctaLink: 'link in bio',
  };

  // Add context-specific variables
  if (insight) {
    variables.insight = insight;
    variables.painPoint = insight;
    variables.painDescription = insight;
  }
  if (competitorGap) {
    variables.competitorGap = competitorGap;
    variables.alternative = 'alternatives';
    variables.keyDifferentiator = competitorGap;
  }
  if (seasonalContext) {
    variables.seasonContext = seasonalContext;
    variables.seasonalNeed = seasonalContext;
    variables.urgencyMessage = 'Limited time offer';
  }

  // Generate content by replacing variables in template
  const hook = replaceVariables(template.structure.hook, variables);
  const body = replaceVariables(template.structure.body, variables);
  const cta = replaceVariables(template.structure.cta, variables);

  // Generate hashtags
  const hashtags = generateHashtags(product, template.campaignType);

  return {
    headline: product.name,
    hook,
    body,
    cta,
    hashtags,
    platform,
  };
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  // Clean up any remaining unreplaced variables
  result = result.replace(/\{[^}]+\}/g, '');
  return result.trim();
}

/**
 * Generate relevant hashtags for product content
 */
function generateHashtags(product: Product, campaignType: string): string[] {
  const hashtags: string[] = [];

  // Product-based hashtags
  const productWords = product.name.toLowerCase().split(' ');
  hashtags.push(`#${productWords.join('')}`);

  // Category/tag based
  if (product.tags) {
    hashtags.push(...product.tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`));
  }

  // Campaign type based
  const typeHashtags: Record<string, string[]> = {
    product_launch: ['#NewProduct', '#JustLaunched', '#ComingSoon'],
    seasonal_push: ['#SeasonalSpecial', '#LimitedTime', '#DontMissOut'],
    problem_solver: ['#Solution', '#ProblemSolved', '#GameChanger'],
    social_proof: ['#Bestseller', '#CustomerFavorite', '#Recommended'],
    feature_spotlight: ['#FeatureFriday', '#ProTip', '#DidYouKnow'],
  };

  if (typeHashtags[campaignType]) {
    hashtags.push(...typeHashtags[campaignType].slice(0, 2));
  }

  // Generic business hashtags
  hashtags.push('#SmallBusiness', '#ShopLocal');

  return [...new Set(hashtags)].slice(0, 10);
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Generate a multi-post campaign for a product
 */
export function generateProductCampaign(
  product: Product,
  context: Partial<ProductTemplateContext>,
  postCount: number = 3
): GeneratedProductContent[] {
  const posts: GeneratedProductContent[] = [];

  // Select templates for variety
  const templateRotation = [
    'feature-spotlight',
    'problem-solver',
    'bestseller-highlight',
  ];

  for (let i = 0; i < postCount; i++) {
    const templateId = templateRotation[i % templateRotation.length];
    const template = PRODUCT_CAMPAIGN_TEMPLATES.find(t => t.id === templateId)!;

    const fullContext: ProductTemplateContext = {
      product,
      ...context,
    };

    const content = generateProductContent(template, fullContext);
    posts.push(content);
  }

  return posts;
}

export default PRODUCT_CAMPAIGN_TEMPLATES;
