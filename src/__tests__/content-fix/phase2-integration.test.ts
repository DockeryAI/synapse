/**
 * Phase 2 Integration Tests
 *
 * End-to-end tests for customer-first title generation
 */

import { describe, it, expect } from 'vitest';
import { customerTitleGenerator } from '@/services/content/CustomerTitleGenerator.service';
import { titleQualityValidator } from '@/services/content/TitleQualityValidator.service';
import { frameworkSelector } from '@/services/content/FrameworkSelector.service';
import { frameworkLibrary } from '@/services/synapse/generation/ContentFrameworkLibrary';
import type { DataPoint } from '@/types/connections.types';

describe('Phase 2: Customer-First Title Generation', () => {
  describe('CustomerTitleGenerator', () => {
    it('should generate customer-focused title from problem data', () => {
      const problemData: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Wait times are terrible during lunch rush',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Always have to wait 20 minutes for a table',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const framework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const pattern = frameworkSelector.analyzeDataPattern(problemData);

      const result = customerTitleGenerator.generateCustomerTitle({
        dataPoints: problemData,
        framework,
        dataPattern: pattern,
        industry: 'restaurant'
      });

      expect(result).toBeDefined();
      expect(result.formula).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should generate customer-focused title from desire data', () => {
      const desireData: DataPoint[] = [
        {
          id: '1',
          source: 'google_trends',
          content: 'Customers love fresh ingredients and local sourcing',
          type: 'trending_topic',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const framework = frameworkLibrary.getFramework('aida')!;
      const pattern = frameworkSelector.analyzeDataPattern(desireData);

      const result = customerTitleGenerator.generateCustomerTitle({
        dataPoints: desireData,
        framework,
        dataPattern: pattern,
        industry: 'restaurant'
      });

      expect(result).toBeDefined();
      expect(result.formula).toContain('desire');
    });

    it('should select appropriate title formula based on pattern', () => {
      const problemData: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Slow service frustrates customers',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const framework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const pattern = frameworkSelector.analyzeDataPattern(problemData);

      const result = customerTitleGenerator.generateCustomerTitle({
        dataPoints: problemData,
        framework,
        dataPattern: pattern
      });

      // Should use problem-focused formula for problem pattern
      expect(result.formula.toLowerCase()).toMatch(/problem|solution/);
    });
  });

  describe('TitleQualityValidator', () => {
    it('should detect keyword concatenation', () => {
      const bad = 'Social media + engagement + bakery';
      const validation = titleQualityValidator.validateTitle(bad);

      expect(validation.passed).toBe(false);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].type).toBe('keyword_concatenation');
      expect(validation.score).toBeLessThan(7);
    });

    it('should detect business owner focus', () => {
      const bad = 'How to improve your bakery operations';
      const validation = titleQualityValidator.validateTitle(bad);

      expect(validation.passed).toBe(false);
      expect(validation.issues.some(i => i.type === 'business_focus')).toBe(true);
    });

    it('should detect generic patterns', () => {
      const bad = 'Product Quality Loved';
      const validation = titleQualityValidator.validateTitle(bad);

      expect(validation.passed).toBe(false);
      expect(validation.issues.some(i => i.type === 'generic')).toBe(true);
    });

    it('should accept customer-focused titles', () => {
      const good = 'Why Your Weekend Croissants Taste Better Here';
      const validation = titleQualityValidator.validateTitle(good);

      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(7);
      expect(validation.issues).toHaveLength(0);
    });

    it('should accept benefit-focused titles', () => {
      const good = 'Skip the Line: Text Orders Ready in 5 Minutes';
      const validation = titleQualityValidator.validateTitle(good);

      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(7);
    });

    it('should accept specific outcome titles', () => {
      const good = 'Fresh Ingredients Everyone Notices';
      const validation = titleQualityValidator.validateTitle(good);

      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(7);
    });

    it('should provide helpful suggestions for bad titles', () => {
      const bad = 'Bakery + Social Media = Great Content';
      const validation = titleQualityValidator.validateTitle(bad);

      expect(validation.suggestions).toBeDefined();
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-industry validation', () => {
    const industries: Array<{
      name: string;
      data: DataPoint[];
      expected: {
        shouldPassValidation: boolean;
        shouldBeCustomerFocused: boolean;
      };
    }> = [
      {
        name: 'restaurant',
        data: [
          {
            id: '1',
            source: 'serper',
            content: 'Fresh ingredients and daily specials',
            type: 'sentiment',
            metadata: { sentiment: 'positive' },
            createdAt: new Date()
          }
        ],
        expected: { shouldPassValidation: true, shouldBeCustomerFocused: true }
      },
      {
        name: 'healthcare',
        data: [
          {
            id: '1',
            source: 'serper',
            content: 'Quick appointments and caring staff',
            type: 'sentiment',
            metadata: { sentiment: 'positive' },
            createdAt: new Date()
          }
        ],
        expected: { shouldPassValidation: true, shouldBeCustomerFocused: true }
      },
      {
        name: 'saas',
        data: [
          {
            id: '1',
            source: 'google_trends',
            content: 'Fast onboarding and easy setup',
            type: 'trending_topic',
            metadata: { sentiment: 'positive' },
            createdAt: new Date()
          }
        ],
        expected: { shouldPassValidation: true, shouldBeCustomerFocused: true }
      },
      {
        name: 'retail',
        data: [
          {
            id: '1',
            source: 'serper',
            content: 'Quality products at good prices',
            type: 'sentiment',
            metadata: { sentiment: 'positive' },
            createdAt: new Date()
          }
        ],
        expected: { shouldPassValidation: true, shouldBeCustomerFocused: true }
      },
      {
        name: 'professional-services',
        data: [
          {
            id: '1',
            source: 'serper',
            content: 'Expert advice and personalized service',
            type: 'sentiment',
            metadata: { sentiment: 'positive' },
            createdAt: new Date()
          }
        ],
        expected: { shouldPassValidation: true, shouldBeCustomerFocused: true }
      }
    ];

    it('should generate industry-appropriate titles', () => {
      for (const industry of industries) {
        const frameworkResult = frameworkSelector.selectBestFramework(
          industry.data,
          'social',
          'engagement'
        );

        const titleResult = customerTitleGenerator.generateCustomerTitle({
          dataPoints: industry.data,
          framework: frameworkResult.selected,
          dataPattern: frameworkResult.dataPattern,
          industry: industry.name
        });

        expect(titleResult).toBeDefined();
        expect(titleResult.formula).toBeDefined();

        // Validate generated guidance
        const validation = customerTitleGenerator.validateCustomerFocus(titleResult.title);
        expect(validation.isCustomerFocused).toBe(industry.expected.shouldBeCustomerFocused);
      }
    });
  });

  describe('Customer focus enforcement', () => {
    it('should detect lack of customer benefit', () => {
      const noCustomerBenefit = 'Best bakery in town';
      const validation = titleQualityValidator.validateTitle(noCustomerBenefit);

      // Should warn about missing customer benefit
      expect(validation.issues.some(i => i.type === 'no_benefit' || i.type === 'generic')).toBe(true);
    });

    it('should detect unclear action', () => {
      const unclearAction = 'Our story and history';
      const validation = titleQualityValidator.validateTitle(unclearAction);

      expect(validation.passed).toBe(false);
    });

    it('should reward clear customer language', () => {
      const goodTitles = [
        'You Save 10 Minutes Every Morning',
        'Your Coffee Stays Hot for 2 Hours',
        'No More Waiting in Line',
        'Get Fresh Bread Delivered Before 7am'
      ];

      for (const title of goodTitles) {
        const validation = titleQualityValidator.validateTitle(title);
        expect(validation.score).toBeGreaterThanOrEqual(7);
      }
    });
  });

  describe('Bad pattern detection', () => {
    const badPatterns = [
      {
        title: 'Social + Media + Engagement = Success',
        expectedIssue: 'keyword_concatenation'
      },
      {
        title: 'Improve your restaurant operations',
        expectedIssue: 'business_focus'
      },
      {
        title: 'Best Bakery Pattern',
        expectedIssue: 'generic'
      },
      {
        title: 'Product Quality Loved By All',
        expectedIssue: 'generic'
      },
      {
        title: 'How to optimize your bakery workflow',
        expectedIssue: 'business_focus'
      }
    ];

    it('should detect all bad patterns', () => {
      for (const { title, expectedIssue } of badPatterns) {
        const validation = titleQualityValidator.validateTitle(title);

        expect(validation.passed).toBe(false);
        expect(validation.issues.some(i => i.type === expectedIssue)).toBe(true);
      }
    });
  });

  describe('Integration with frameworks', () => {
    it('should align title formula with framework type', () => {
      const problemData: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Long wait times frustrate customers',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      // PAS framework should suggest problem-focused formula
      const pasFramework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const pattern = frameworkSelector.analyzeDataPattern(problemData);

      const result = customerTitleGenerator.generateCustomerTitle({
        dataPoints: problemData,
        framework: pasFramework,
        dataPattern: pattern
      });

      expect(result.formula.toLowerCase()).toMatch(/problem/);
    });

    it('should align with AIDA framework for desire patterns', () => {
      const desireData: DataPoint[] = [
        {
          id: '1',
          source: 'google_trends',
          content: 'Amazing coffee and cozy atmosphere',
          type: 'trending_topic',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const pattern = frameworkSelector.analyzeDataPattern(desireData);

      const result = customerTitleGenerator.generateCustomerTitle({
        dataPoints: desireData,
        framework: aidaFramework,
        dataPattern: pattern
      });

      expect(result.formula.toLowerCase()).toMatch(/desire|benefit/);
    });
  });
});
