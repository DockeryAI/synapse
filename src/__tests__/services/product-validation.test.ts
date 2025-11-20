/**
 * Product Validation Service Tests
 *
 * Tests garbage filtering with real-world examples from Phoenix Insurance extraction
 *
 * Created: 2025-11-19
 */

import { describe, it, expect } from 'vitest';
import { productValidationService } from '@/services/intelligence/product-validation.service';
import type { ProductService } from '@/types/uvp-flow.types';

describe('ProductValidationService', () => {
  describe('validateProductName', () => {
    it('should reject single generic words', () => {
      const invalidNames = [
        'Texas',
        'Here',
        'protected',
        'services',
        'insurance'
      ];

      invalidNames.forEach(name => {
        const result = productValidationService.validateProductName(name);
        if (result.isValid) {
          console.log(`  FAILED TO REJECT: "${name}" - reason:`, result.reason);
        }
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject marketing phrases starting with "we"', () => {
      const marketingPhrases = [
        'We specialize in helping individuals and businesses',
        'We deliver personalized insurance solutions',
        'We provide customized policies',
        'We offer a wide range of insurance options',
        'We work with multiple insurance carriers'
      ];

      marketingPhrases.forEach(phrase => {
        const result = productValidationService.validateProductName(phrase);
        expect(result.isValid).toBe(false);
        // Reason can vary (garbage word or marketing phrase pattern)
        expect(result.reason).toBeDefined();
      });
    });

    it('should reject phrases starting with "our"', () => {
      const ourPhrases = [
        'Our team is committed to protecting',
        'Our expertise and dedication to exceptional service',
        'Our proactive support and commitment'
      ];

      ourPhrases.forEach(phrase => {
        const result = productValidationService.validateProductName(phrase);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject phrases starting with "from"', () => {
      const fromPhrases = [
        'From understanding the benefits',
        'From homes and businesses to classic'
      ];

      fromPhrases.forEach(phrase => {
        const result = productValidationService.validateProductName(phrase);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject phrases starting with "with"', () => {
      const withPhrases = [
        'With proactive renewal reviews',
        'With industry expertise and a commitment'
      ];

      withPhrases.forEach(phrase => {
        const result = productValidationService.validateProductName(phrase);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject incomplete sentences', () => {
      const incomplete = [
        'working directly with the insurance carrier to ensure quick',
        'personalized service than large'
      ];

      incomplete.forEach(phrase => {
        const result = productValidationService.validateProductName(phrase);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject company/job titles', () => {
      const titles = [
        'New Business Account Manager',
        'Account Manager',
        'Business Executive'
      ];

      titles.forEach(title => {
        const result = productValidationService.validateProductName(title);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject navigation/page elements', () => {
      const navElements = [
        'FREQUENTLY ASKED QUESTIONS',
        'Links Insurance Get in Touch',
        'Quick Links Insurance',
        'Insurance Knowledge. Stories. Tips.'
      ];

      navElements.forEach(element => {
        const result = productValidationService.validateProductName(element);
        if (result.isValid) {
          console.log(`  FAILED TO REJECT: "${element}" - reason:`, result.reason);
        }
        expect(result.isValid).toBe(false);
      });
    });

    it('should accept valid insurance products', () => {
      const validProducts = [
        'Exotic Car Insurance',
        'Collector Car Insurance',
        'Antique Car Insurance',
        'Classic Truck Insurance',
        'Modified Car Insurance',
        'High Performance Car Insurance',
        'Vintage Car Insurance',
        'Hot Rod Insurance',
        'Rat Rod Insurance',
        'Street Rod Insurance',
        'Track Day Insurance',
        'Real Estate Investment Insurance',
        'Home Insurance',
        'Umbrella Insurance',
        'Recreational Vehicle Insurance'
      ];

      validProducts.forEach(name => {
        const result = productValidationService.validateProductName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle edge cases gracefully', () => {
      // Empty string
      expect(productValidationService.validateProductName('').isValid).toBe(false);

      // Only whitespace
      expect(productValidationService.validateProductName('   ').isValid).toBe(false);

      // Only punctuation
      expect(productValidationService.validateProductName('...').isValid).toBe(false);
      expect(productValidationService.validateProductName('!!!').isValid).toBe(false);
    });
  });

  describe('validateProduct', () => {
    it('should filter out invalid products from array', () => {
      const products: ProductService[] = [
        // Valid
        {
          id: '1',
          name: 'Exotic Car Insurance',
          description: 'Insurance for exotic vehicles',
          category: 'Insurance',
          confidence: 100,
          source: 'website',
          sourceUrl: 'https://example.com',
          sourceExcerpt: 'Quote',
          confirmed: false
        },
        // Invalid - marketing phrase
        {
          id: '2',
          name: 'We specialize in protecting',
          description: '',
          category: 'primary',
          confidence: 100,
          source: 'website',
          sourceUrl: 'https://example.com',
          sourceExcerpt: 'Quote',
          confirmed: false
        },
        // Invalid - single word
        {
          id: '3',
          name: 'Texas',
          description: '',
          category: 'primary',
          confidence: 100,
          source: 'website',
          sourceUrl: 'https://example.com',
          sourceExcerpt: 'Quote',
          confirmed: false
        },
        // Valid
        {
          id: '4',
          name: 'Classic Truck Insurance',
          description: 'Insurance for classic trucks',
          category: 'Insurance',
          confidence: 100,
          source: 'website',
          sourceUrl: 'https://example.com',
          sourceExcerpt: 'Quote',
          confirmed: false
        }
      ];

      const validated = productValidationService.validateProducts(products);

      expect(validated.length).toBe(2);
      expect(validated[0].name).toBe('Exotic Car Insurance');
      expect(validated[1].name).toBe('Classic Truck Insurance');
    });
  });

  describe('extractProductFromMarketingText', () => {
    it('should extract product name from marketing text', () => {
      expect(
        productValidationService.extractProductFromMarketingText(
          'We offer Professional SEO Services'
        )
      ).toBe('Professional SEO Services');

      expect(
        productValidationService.extractProductFromMarketingText(
          'Our team provides Custom Web Design'
        )
      ).toBe('Custom Web Design');

      expect(
        productValidationService.extractProductFromMarketingText(
          'We specialize in Digital Marketing Solutions'
        )
      ).toBe('Digital Marketing Solutions');
    });

    it('should return null for pure marketing fluff', () => {
      expect(
        productValidationService.extractProductFromMarketingText(
          'We specialize in helping businesses grow'
        )
      ).toBeNull();

      expect(
        productValidationService.extractProductFromMarketingText(
          'Our team is committed to excellence'
        )
      ).toBeNull();
    });
  });

  describe('business name filtering', () => {
    it('should reject product names that exactly match the business name', () => {
      // Exact match
      const result1 = productValidationService.validateProductName(
        'Phoenix Insurance',
        undefined,
        'Phoenix Insurance'
      );
      expect(result1.isValid).toBe(false);
      expect(result1.reason).toContain('exactly the business name');

      // Match with "The" prefix
      const result2 = productValidationService.validateProductName(
        'The Phoenix Insurance',
        undefined,
        'Phoenix Insurance'
      );
      expect(result2.isValid).toBe(false);

      const result3 = productValidationService.validateProductName(
        'Phoenix Insurance',
        undefined,
        'The Phoenix Insurance'
      );
      expect(result3.isValid).toBe(false);
    });

    it('should accept product names that include business name with specifics', () => {
      // Business name + product type = VALID
      const result1 = productValidationService.validateProductName(
        'Phoenix Home Insurance',
        undefined,
        'Phoenix Insurance'
      );
      expect(result1.isValid).toBe(true);

      const result2 = productValidationService.validateProductName(
        'Phoenix Auto Coverage',
        undefined,
        'The Phoenix Insurance'
      );
      expect(result2.isValid).toBe(true);

      const result3 = productValidationService.validateProductName(
        'Phoenix Premium Protection Plans',
        undefined,
        'Phoenix Insurance'
      );
      expect(result3.isValid).toBe(true);
    });
  });
});
