/**
 * Industry Customization Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  industryCustomizationService,
  IndustryCustomizationService,
  ContentToCustomize,
} from '../../../services/v2/industry-customization.service';
import {
  getIndustryProfile,
  getIndustryByNaics,
  getAllIndustryIds,
  getIndustryCount,
} from '../../../services/v2/data/industry-profiles';

describe('Industry Profiles Data', () => {
  it('should have 12+ industry profiles', () => {
    expect(getIndustryCount()).toBeGreaterThanOrEqual(12);
  });

  it('should retrieve industry by id', () => {
    const insurance = getIndustryProfile('insurance');
    expect(insurance).toBeDefined();
    expect(insurance?.name).toBe('Insurance');
  });

  it('should retrieve industry by NAICS code', () => {
    const profile = getIndustryByNaics('524110');
    expect(profile).toBeDefined();
    expect(profile?.id).toBe('insurance');
  });

  it('should return all industry IDs', () => {
    const ids = getAllIndustryIds();
    expect(ids).toContain('insurance');
    expect(ids).toContain('saas');
    expect(ids).toContain('healthcare');
    expect(ids.length).toBeGreaterThanOrEqual(12);
  });
});

describe('IndustryCustomizationService', () => {
  const testContent: ContentToCustomize = {
    title: 'Test Title',
    hook: 'This is a test hook for content',
    body: 'This is the main body of the content with important information.',
    cta: 'Take action now',
    templateType: 'curiosity-gap',
  };

  describe('getEmotionalTriggerWeights', () => {
    it('should return correct weights for insurance', () => {
      const weights = industryCustomizationService.getEmotionalTriggerWeights('insurance');
      expect(weights.fear).toBe(35);
      expect(weights.trust).toBe(30);
      expect(weights.security).toBe(35);
      expect(weights.efficiency).toBe(0);
    });

    it('should return correct weights for SaaS', () => {
      const weights = industryCustomizationService.getEmotionalTriggerWeights('saas');
      expect(weights.efficiency).toBe(40);
      expect(weights.growth).toBe(35);
      expect(weights.innovation).toBe(25);
      expect(weights.fear).toBe(0);
    });

    it('should return correct weights for healthcare', () => {
      const weights = industryCustomizationService.getEmotionalTriggerWeights('healthcare');
      expect(weights.hope).toBe(30);
      expect(weights.trust).toBe(25);
      expect(weights.security).toBe(20);
    });

    it('should return default weights for unknown industry', () => {
      const weights = industryCustomizationService.getEmotionalTriggerWeights('nonexistent');
      expect(weights.trust).toBe(20);
      expect(weights.efficiency).toBe(15);
    });
  });

  describe('getDominantTriggers', () => {
    it('should return top triggers for insurance', () => {
      const triggers = industryCustomizationService.getDominantTriggers('insurance', 3);
      expect(triggers).toHaveLength(3);
      expect(triggers[0].weight).toBeGreaterThanOrEqual(triggers[1].weight);
      expect(triggers[1].weight).toBeGreaterThanOrEqual(triggers[2].weight);
    });

    it('should return correct top trigger for ecommerce', () => {
      const triggers = industryCustomizationService.getDominantTriggers('ecommerce', 1);
      expect(triggers[0].trigger).toBe('urgency');
      expect(triggers[0].weight).toBe(30);
    });
  });

  describe('getIndustryVocabulary', () => {
    it('should return vocabulary for valid industry', () => {
      const vocab = industryCustomizationService.getIndustryVocabulary('insurance');
      expect(vocab).not.toBeNull();
      expect(vocab?.preferredTerms).toContain('protection');
      expect(vocab?.avoidTerms).toContain('cheap');
      expect(vocab?.powerWords.length).toBeGreaterThan(0);
    });

    it('should return null for invalid industry', () => {
      const vocab = industryCustomizationService.getIndustryVocabulary('nonexistent');
      expect(vocab).toBeNull();
    });

    it('should have CTA phrases for each industry', () => {
      const industries = getAllIndustryIds();
      for (const id of industries) {
        const vocab = industryCustomizationService.getIndustryVocabulary(id);
        expect(vocab?.callToActionPhrases.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateIndustryExamples', () => {
    it('should generate examples for industry', () => {
      const examples = industryCustomizationService.generateIndustryExamples('insurance');
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].type).toBeDefined();
      expect(examples[0].expectedCtr).toBeGreaterThan(0);
    });

    it('should replace variables in examples', () => {
      const examples = industryCustomizationService.generateIndustryExamples('insurance', {
        coverage_type: 'home insurance',
        audience: 'homeowners',
      });
      expect(examples[0].template).toContain('home insurance');
      expect(examples[0].template).toContain('homeowners');
    });

    it('should return empty array for invalid industry', () => {
      const examples = industryCustomizationService.generateIndustryExamples('nonexistent');
      expect(examples).toHaveLength(0);
    });
  });

  describe('checkCompliance', () => {
    it('should flag banned terms in insurance content', () => {
      const badContent: ContentToCustomize = {
        ...testContent,
        body: 'Get guaranteed savings on your insurance today!',
      };
      const issues = industryCustomizationService.checkCompliance(badContent, 'insurance');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBeDefined();
    });

    it('should not flag compliant content', () => {
      const goodContent: ContentToCustomize = {
        ...testContent,
        body: 'Protect your family with comprehensive coverage. Actual savings may vary.',
      };
      const issues = industryCustomizationService.checkCompliance(goodContent, 'insurance');
      const errors = issues.filter(i => i.severity === 'error' && i.flaggedContent);
      expect(errors.length).toBe(0);
    });

    it('should flag healthcare cure claims', () => {
      const badContent: ContentToCustomize = {
        ...testContent,
        body: 'Our miracle cure will fix all your problems!',
      };
      const issues = industryCustomizationService.checkCompliance(badContent, 'healthcare');
      expect(issues.some(i => i.flaggedContent?.includes('cure'))).toBe(true);
    });

    it('should flag finance guaranteed returns', () => {
      const badContent: ContentToCustomize = {
        ...testContent,
        body: 'Invest now for guaranteed returns!',
      };
      const issues = industryCustomizationService.checkCompliance(badContent, 'finance');
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid industry', () => {
      const issues = industryCustomizationService.checkCompliance(testContent, 'nonexistent');
      expect(issues).toHaveLength(0);
    });
  });

  describe('applyIndustryOverlay', () => {
    it('should apply overlay to content', () => {
      const customized = industryCustomizationService.applyIndustryOverlay(
        testContent,
        'insurance'
      );
      expect(customized.industryId).toBe('insurance');
      expect(customized.industryName).toBe('Insurance');
      expect(customized.appliedOverlays).toContain('vocabulary');
      expect(customized.appliedOverlays).toContain('compliance-check');
    });

    it('should enhance title with power words', () => {
      const shortTitle: ContentToCustomize = {
        ...testContent,
        title: 'Short Title',
      };
      const customized = industryCustomizationService.applyIndustryOverlay(
        shortTitle,
        'insurance'
      );
      expect(customized.title.length).toBeGreaterThan(shortTitle.title.length);
    });

    it('should add emotional weights to result', () => {
      const customized = industryCustomizationService.applyIndustryOverlay(
        testContent,
        'saas'
      );
      expect(customized.emotionalWeights).toBeDefined();
      expect(customized.emotionalWeights.efficiency).toBe(40);
    });

    it('should include compliance warnings', () => {
      const badContent: ContentToCustomize = {
        ...testContent,
        body: 'Get guaranteed savings now!',
      };
      const customized = industryCustomizationService.applyIndustryOverlay(
        badContent,
        'insurance'
      );
      expect(customized.complianceWarnings.length).toBeGreaterThan(0);
    });

    it('should replace custom variables', () => {
      const content: ContentToCustomize = {
        ...testContent,
        body: 'Special offer for {audience} in {location}!',
      };
      const customized = industryCustomizationService.applyIndustryOverlay(
        content,
        'insurance',
        {
          customVariables: {
            audience: 'homeowners',
            location: 'Florida',
          },
        }
      );
      expect(customized.body).toContain('homeowners');
      expect(customized.body).toContain('Florida');
    });

    it('should throw error for invalid industry', () => {
      expect(() => {
        industryCustomizationService.applyIndustryOverlay(testContent, 'nonexistent');
      }).toThrow('Industry profile not found');
    });

    it('should generate industry hashtags', () => {
      const customized = industryCustomizationService.applyIndustryOverlay(
        testContent,
        'insurance'
      );
      expect(customized.suggestedHashtags.length).toBeGreaterThan(0);
      expect(customized.suggestedHashtags[0]).toMatch(/^#/);
    });
  });

  describe('getContentGuidelines', () => {
    it('should return guidelines for industry', () => {
      const guidelines = industryCustomizationService.getContentGuidelines('insurance');
      expect(guidelines.length).toBeGreaterThan(0);
      expect(guidelines[0]).toContain('protection');
    });

    it('should return empty array for invalid industry', () => {
      const guidelines = industryCustomizationService.getContentGuidelines('nonexistent');
      expect(guidelines).toHaveLength(0);
    });
  });

  describe('getSeasonalTriggers', () => {
    it('should return seasonal triggers', () => {
      const triggers = industryCustomizationService.getSeasonalTriggers('insurance');
      expect(triggers.length).toBeGreaterThan(0);
      expect(triggers).toContain('hurricane season');
    });
  });

  describe('getAllIndustries', () => {
    it('should return all industries with required fields', () => {
      const industries = industryCustomizationService.getAllIndustries();
      expect(industries.length).toBeGreaterThanOrEqual(12);
      industries.forEach(ind => {
        expect(ind.id).toBeDefined();
        expect(ind.name).toBeDefined();
        expect(ind.description).toBeDefined();
      });
    });
  });

  describe('findIndustryByNaics', () => {
    it('should find insurance by NAICS', () => {
      const profile = industryCustomizationService.findIndustryByNaics('524110');
      expect(profile?.id).toBe('insurance');
    });

    it('should find SaaS by NAICS', () => {
      const profile = industryCustomizationService.findIndustryByNaics('511210');
      expect(profile?.id).toBe('saas');
    });
  });

  describe('calculateEmotionalAlignment', () => {
    it('should calculate high alignment for matching triggers', () => {
      const contentTriggers = {
        fear: 30,
        trust: 30,
        security: 30,
      };
      const score = industryCustomizationService.calculateEmotionalAlignment(
        contentTriggers,
        'insurance'
      );
      expect(score).toBeGreaterThan(80);
    });

    it('should calculate low alignment for mismatched triggers', () => {
      const contentTriggers = {
        efficiency: 50,
        innovation: 50,
      };
      const score = industryCustomizationService.calculateEmotionalAlignment(
        contentTriggers,
        'insurance'
      );
      expect(score).toBe(0);
    });
  });

  describe('suggestTemplateTypes', () => {
    it('should suggest templates for insurance', () => {
      const templates = industryCustomizationService.suggestTemplateTypes('insurance');
      expect(templates.length).toBeGreaterThan(0);
      // Insurance should have fear-based templates
      expect(templates.some(t =>
        t.includes('hidden-cost') || t.includes('mistake-exposer')
      )).toBe(true);
    });

    it('should suggest templates for SaaS', () => {
      const templates = industryCustomizationService.suggestTemplateTypes('saas');
      // SaaS should have efficiency-based templates
      expect(templates.some(t =>
        t.includes('specific-number') || t.includes('quick-win')
      )).toBe(true);
    });

    it('should return defaults for unknown industry', () => {
      const templates = industryCustomizationService.suggestTemplateTypes('nonexistent');
      expect(templates).toContain('curiosity-gap');
      expect(templates).toContain('transformation');
    });
  });
});

describe('Compliance Rules Coverage', () => {
  const industries = getAllIndustryIds();

  it('each industry should have compliance rules', () => {
    industries.forEach(id => {
      const profile = getIndustryProfile(id);
      expect(profile?.complianceRules.length).toBeGreaterThan(0);
    });
  });

  it('each industry should have examples', () => {
    industries.forEach(id => {
      const profile = getIndustryProfile(id);
      expect(profile?.examples.length).toBeGreaterThan(0);
    });
  });

  it('emotional triggers should sum to 100 for major industries', () => {
    const majorIndustries = ['insurance', 'saas', 'healthcare', 'finance'];
    majorIndustries.forEach(id => {
      const weights = industryCustomizationService.getEmotionalTriggerWeights(id);
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    });
  });
});
