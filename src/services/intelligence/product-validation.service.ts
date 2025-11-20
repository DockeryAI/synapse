/**
 * Product/Service Validation Service
 *
 * Filters out garbage extractions like sentence fragments, marketing fluff,
 * single words, and non-product text that pattern matching incorrectly identifies.
 *
 * Created: 2025-11-19 (Quality Control)
 */

import type { ProductService } from '@/types/uvp-flow.types';
import type { DeepServiceData } from '@/types/deep-service.types';

/**
 * Garbage patterns that indicate text is NOT a product/service
 */
const GARBAGE_STARTING_WORDS = [
  // Common sentence starters
  'here', 'there', 'our', 'we', 'the', 'from', 'with', 'at', 'in', 'on',
  'if', 'when', 'whether', 'about', 'for', 'to', 'by', 'and', 'or',
  // Navigation/page elements (but NOT 'home' - that's valid for "Home Insurance")
  'faq', 'about', 'contact', 'links', 'back', 'next', 'previous',
  'login', 'signup', 'subscribe', 'newsletter', 'blog', 'news',
  'quick links', // Navigation garbage
  // Marketing fluff
  'meet', 'discover', 'learn', 'explore', 'see', 'view', 'read',
  // Job titles (not services)
  'account manager', 'business manager', 'executive', 'director',
  // Generic location names
  'texas', 'california', 'new york', 'florida', 'usa', 'america'
];

/**
 * Patterns that indicate marketing speak, not product names
 */
const MARKETING_PHRASE_PATTERNS = [
  /^we (specialize in|deliver|provide|offer|work with|help|believe|ensure)/i,
  /^our (team|expertise|experience|commitment|goal|mission|approach)/i,
  /^with (years of|industry|proactive|deep|a commitment)/i,
  /^from (understanding|homes|classic)/i,
  /^meet the (people|team)/i,
  /^(independent agencies|personalized service)/i,
  /working directly with/i,
  /(dedicated|committed) to (providing|protecting)/i
];

/**
 * Words/phrases that should never be standalone products
 */
const INVALID_STANDALONE_WORDS = [
  'texas', 'here', 'there', 'protected', 'services', 'service',
  'insurance', 'coverage', 'frequently asked questions', 'faq',
  'get in touch', 'contact us', 'about us', 'quick links',
  'new business', 'knowledge', 'stories', 'tips',
  'account manager', 'business manager', 'manager', 'executive',
  'director', 'specialist', 'consultant' // Job titles
];

/**
 * Job title patterns
 */
const JOB_TITLE_PATTERNS = [
  /\b(account|business|sales|marketing|operations|customer)\s+(manager|executive|director|specialist)\b/i,
  /\b(new business|senior|junior|lead|chief)\s+/i,
  /\b(ceo|cfo|cto|coo|vp|president)\b/i
];

/**
 * Incomplete sentence indicators
 */
const INCOMPLETE_SENTENCE_PATTERNS = [
  / fro$/i,      // "...from"
  / provid$/i,   // "...provide"
  / offer$/i,    // "...offer"
  / ensur$/i,    // "...ensure"
  / deliver$/i,  // "...deliver"
  /\.\.\.$/,     // Ends with ellipsis
  / and$/i,      // Ends with "and"
  / or$/i,       // Ends with "or"
  / to$/i,       // Ends with "to"
  / for$/i       // Ends with "for"
];

/**
 * Product/service name characteristics
 */
const VALID_PRODUCT_INDICATORS = [
  // Has specific product/service keywords
  /insurance$/i,
  /coverage$/i,
  /protection$/i,
  /plans?$/i,
  /packages?$/i,
  /services?$/i,
  /programs?$/i,
  /solutions?$/i,
  /consulting$/i,
  /management$/i,
  /support$/i,
  /maintenance$/i,
  /design$/i,
  /development$/i,
  /marketing$/i,
  /seo$/i,
  /optimization$/i
];

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedName?: string;
}

export class ProductValidationService {
  /**
   * Validate if a product/service name is legitimate
   */
  validateProductName(name: string, description?: string, businessName?: string): ValidationResult {
    const trimmedName = name.trim();
    const lowerName = trimmedName.toLowerCase();
    const words = trimmedName.split(/\s+/);
    const wordCount = words.length;

    // 0. Check if product name is EXACTLY the business name (not just containing it)
    if (businessName) {
      const lowerBusinessName = businessName.toLowerCase();

      // Normalize both by removing "the" prefix and extra whitespace
      const normalizedProduct = lowerName.replace(/^the\s+/, '').trim();
      const normalizedBusiness = lowerBusinessName.replace(/^the\s+/, '').trim();

      // Only reject if it's an exact match
      if (normalizedProduct === normalizedBusiness) {
        return {
          isValid: false,
          reason: 'Product name is exactly the business name (not a specific service)'
        };
      }
    }

    // 1. Length constraints
    if (wordCount < 2) {
      // Single word - must be specific (e.g., "Insurance" alone is not a product)
      if (INVALID_STANDALONE_WORDS.includes(lowerName)) {
        return {
          isValid: false,
          reason: 'Single word is too generic'
        };
      }

      // Single word is OK only if it has valid product indicators in description
      if (description && description.length > 20) {
        // Has description, might be OK
      } else {
        return {
          isValid: false,
          reason: 'Single word without sufficient description'
        };
      }
    }

    if (wordCount > 12) {
      return {
        isValid: false,
        reason: 'Name too long (likely a sentence fragment)'
      };
    }

    // 2. Check for garbage starting words
    const firstWord = words[0].toLowerCase();
    if (GARBAGE_STARTING_WORDS.includes(firstWord)) {
      return {
        isValid: false,
        reason: `Starts with invalid word: "${firstWord}"`
      };
    }

    // 3. Check for marketing phrase patterns
    for (const pattern of MARKETING_PHRASE_PATTERNS) {
      if (pattern.test(trimmedName)) {
        return {
          isValid: false,
          reason: 'Marketing phrase, not a product name'
        };
      }
    }

    // 4. Check for incomplete sentences
    for (const pattern of INCOMPLETE_SENTENCE_PATTERNS) {
      if (pattern.test(trimmedName)) {
        return {
          isValid: false,
          reason: 'Incomplete sentence fragment'
        };
      }
    }

    // 4.5. Check for navigation/UI phrases anywhere in the name
    const navPhrases = ['quick links', 'get in touch', 'frequently asked', 'faq'];
    for (const phrase of navPhrases) {
      if (lowerName.includes(phrase)) {
        return {
          isValid: false,
          reason: `Navigation/UI element detected: "${phrase}"`
        };
      }
    }

    // 5. Check for invalid standalone words
    if (INVALID_STANDALONE_WORDS.includes(lowerName)) {
      return {
        isValid: false,
        reason: 'Invalid standalone word/phrase'
      };
    }

    // 5.5 Check for job title patterns
    for (const pattern of JOB_TITLE_PATTERNS) {
      if (pattern.test(trimmedName)) {
        return {
          isValid: false,
          reason: 'Job title detected, not a product/service'
        };
      }
    }

    // 6. Must not be just punctuation or special characters
    if (/^[^a-zA-Z0-9]+$/.test(trimmedName)) {
      return {
        isValid: false,
        reason: 'Only punctuation/special characters'
      };
    }

    // 6.5 Check for excessive punctuation (e.g., "Knowledge. Stories. Tips.")
    const punctuationCount = (trimmedName.match(/[.!?]/g) || []).length;
    if (punctuationCount >= 2) {
      return {
        isValid: false,
        reason: 'Excessive punctuation (likely a list or header)'
      };
    }

    // 7. Check for sentence-like structure (has verb patterns)
    const sentenceIndicators = [
      /\b(is|are|was|were|be|been|being)\b/i,
      /\b(can|could|will|would|should|may|might|must)\b/i,
      /\b(do|does|did|doing|done)\b/i,
      /\b(have|has|had|having)\b/i
    ];

    for (const pattern of sentenceIndicators) {
      if (pattern.test(trimmedName) && wordCount > 4) {
        return {
          isValid: false,
          reason: 'Sentence structure detected (contains verbs)'
        };
      }
    }

    // 8. Validate it looks like a product/service name
    const hasProductIndicator = VALID_PRODUCT_INDICATORS.some(p => p.test(lowerName));
    const hasCapitalization = /[A-Z]/.test(trimmedName);
    const hasNumbers = /\d/.test(trimmedName);

    // MUST have product indicator keywords to be valid
    // This prevents generic phrases like "exotic cars", "commercial buildings" from passing
    if (hasProductIndicator) {
      return { isValid: true };
    }

    // Special case: Proper nouns with clear capitalization (e.g., "SEO Services" without "Services" at end)
    // Must be 2-4 words, start with capital, and not be all caps
    const isProperNoun = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(trimmedName);
    if (isProperNoun && wordCount >= 2 && wordCount <= 4) {
      return { isValid: true };
    }

    // Everything else is rejected
    return {
      isValid: false,
      reason: 'Does not match product/service naming patterns (must end with insurance/coverage/service/plan/etc.)'
    };
  }

  /**
   * Clean and validate a ProductService object
   */
  validateProduct(product: ProductService, businessName?: string): ProductService | null {
    const validation = this.validateProductName(product.name, product.description, businessName);

    if (!validation.isValid) {
      console.log(`[ProductValidation] Rejected: "${product.name}" - ${validation.reason}`);
      return null;
    }

    // Clean up the name
    const cleanedName = this.cleanProductName(product.name);

    return {
      ...product,
      name: cleanedName,
      // Reduce confidence for questionable names
      confidence: validation.reason ? Math.max(product.confidence - 10, 50) : product.confidence
    };
  }

  /**
   * Clean up product name by removing extra whitespace, quotes, etc.
   */
  private cleanProductName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/^["']|["']$/g, '')    // Remove leading/trailing quotes
      .replace(/\s*\.\s*$/, '')       // Remove trailing period
      .trim();
  }

  /**
   * Validate and filter an array of products
   */
  validateProducts(products: ProductService[], businessName?: string): ProductService[] {
    const validated = products
      .map(p => this.validateProduct(p, businessName))
      .filter((p): p is ProductService => p !== null);

    const rejected = products.length - validated.length;
    if (rejected > 0) {
      console.log(`[ProductValidation] Filtered out ${rejected} invalid products`);
    }

    return validated;
  }

  /**
   * Validate DeepServiceData (convert to ProductService format first)
   */
  validateDeepService(service: DeepServiceData, businessName?: string): boolean {
    const validation = this.validateProductName(service.name, service.description, businessName);

    if (!validation.isValid) {
      console.log(`[ProductValidation] Rejected deep service: "${service.name}" - ${validation.reason}`);
    }

    return validation.isValid;
  }

  /**
   * Batch validate DeepServiceData array
   */
  validateDeepServices(services: DeepServiceData[], businessName?: string): DeepServiceData[] {
    const validated = services.filter(s => this.validateDeepService(s, businessName));

    const rejected = services.length - validated.length;
    if (rejected > 0) {
      console.log(`[ProductValidation] Filtered out ${rejected} invalid deep services`);
    }

    return validated;
  }

  /**
   * Extract potential product name from marketing text
   * Example: "We offer Professional SEO Services" → "Professional SEO Services"
   */
  extractProductFromMarketingText(text: string): string | null {
    // Remove common marketing prefixes
    let cleaned = text
      .replace(/^(we |our |the )?(team )?(offer|offers|provide|provides|deliver|delivers|specialize in|work with)\s+/i, '')
      .replace(/^(a |an |the )\s+/i, '')
      .trim();

    // Must have at least 2 words left
    if (cleaned.split(/\s+/).length < 2) {
      return null;
    }

    // Must contain product indicator words
    const hasProductIndicator = VALID_PRODUCT_INDICATORS.some(p => p.test(cleaned.toLowerCase()));
    if (!hasProductIndicator) {
      // Doesn't look like a product name
      return null;
    }

    // If what's left is valid, return it
    const validation = this.validateProductName(cleaned);
    if (validation.isValid) {
      return this.cleanProductName(cleaned);
    }

    return null;
  }
}

/**
 * Singleton instance
 */
export const productValidationService = new ProductValidationService();
