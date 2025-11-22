/**
 * Content Templates Test Suite
 * Tests all 20 content templates and the registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContentTemplateRegistry,
  templateRegistry,
  CuriosityGapTemplate,
  PatternInterruptTemplate,
  SpecificNumberTemplate,
  ContrarianTemplate,
  MistakeExposerTemplate,
  HiddenCostTemplate,
  QuickWinTemplate,
  TransformationTemplate,
  FailureToSuccessTemplate,
  BehindTheScenesTemplate,
  MythBusterTemplate,
  GuideSnippetTemplate,
  ComparisonTemplate,
  TrendJackerTemplate,
  DeadlineDriverTemplate,
  SeasonalTemplate,
  DataRevelationTemplate,
  ExpertRoundupTemplate,
  CaseStudyTemplate,
  ChallengePostTemplate,
} from '../../../../services/v2/templates/content-template-registry';
import { TemplateInput } from '../../../../services/v2/templates/template-base.service';

describe('Content Template Registry', () => {
  it('should register all 20 templates', () => {
    expect(templateRegistry.getCount()).toBe(20);
  });

  it('should retrieve template by ID', () => {
    const template = templateRegistry.getTemplate('curiosity-gap');
    expect(template).toBeDefined();
    expect(template?.metadata.id).toBe('curiosity-gap');
  });

  it('should get templates by category', () => {
    const hookTemplates = templateRegistry.getByCategory('hook');
    expect(hookTemplates).toHaveLength(4);

    const storyTemplates = templateRegistry.getByCategory('story');
    expect(storyTemplates).toHaveLength(3);

    const engagementTemplates = templateRegistry.getByCategory('engagement');
    expect(engagementTemplates).toHaveLength(1);
  });

  it('should get all template metadata', () => {
    const metadata = templateRegistry.getAllMetadata();
    expect(metadata).toHaveLength(20);
    metadata.forEach(m => {
      expect(m.id).toBeDefined();
      expect(m.name).toBeDefined();
      expect(m.category).toBeDefined();
      expect(m.avgCtrImprovement).toBeGreaterThanOrEqual(27);
      expect(m.avgCtrImprovement).toBeLessThanOrEqual(52);
    });
  });

  it('should get templates by minimum CTR improvement', () => {
    const highPerformers = templateRegistry.getByMinCtrImprovement(40);
    expect(highPerformers.length).toBeGreaterThan(0);
    highPerformers.forEach(t => {
      expect(t.metadata.avgCtrImprovement).toBeGreaterThanOrEqual(40);
    });
  });

  it('should sort templates by CTR improvement', () => {
    const sorted = templateRegistry.getSortedByCtr();
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].metadata.avgCtrImprovement)
        .toBeGreaterThanOrEqual(sorted[i + 1].metadata.avgCtrImprovement);
    }
  });

  it('should get category summary', () => {
    const summary = templateRegistry.getCategorySummary();
    expect(summary.hook).toBe(4);
    expect(summary['problem-solution']).toBe(3);
    expect(summary.story).toBe(3);
    expect(summary.educational).toBe(3);
    expect(summary.urgency).toBe(3);
    expect(summary.authority).toBe(3);
    expect(summary.engagement).toBe(1);
  });

  it('should suggest templates based on goal', () => {
    const engagementTemplates = templateRegistry.suggestTemplates('engagement');
    expect(engagementTemplates.length).toBeGreaterThan(0);

    const authorityTemplates = templateRegistry.suggestTemplates('authority');
    expect(authorityTemplates.length).toBeGreaterThan(0);
  });
});

describe('Template Generation', () => {
  const testInput: TemplateInput = {
    topic: 'content marketing',
    industry: 'SaaS',
    targetAudience: 'B2B marketers',
    tone: 'professional',
    platform: 'linkedin',
  };

  describe('Hook-based Templates', () => {
    it('CuriosityGapTemplate generates valid content', () => {
      const template = new CuriosityGapTemplate();
      const result = template.generate(testInput);

      expect(result.title).toBeDefined();
      expect(result.hook).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.cta).toBeDefined();
      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('curiosity-gap');
      expect(result.templateCategory).toBe('hook');
    });

    it('PatternInterruptTemplate generates valid content', () => {
      const template = new PatternInterruptTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('pattern-interrupt');
      expect(result.performance.ctrImprovement).toBeGreaterThanOrEqual(27);
    });

    it('SpecificNumberTemplate generates valid content', () => {
      const template = new SpecificNumberTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('specific-number');
    });

    it('ContrarianTemplate generates valid content', () => {
      const template = new ContrarianTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('contrarian');
    });
  });

  describe('Problem-Solution Templates', () => {
    it('MistakeExposerTemplate generates valid content', () => {
      const template = new MistakeExposerTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(4);
      expect(result.templateType).toBe('mistake-exposer');
      expect(result.templateCategory).toBe('problem-solution');
    });

    it('HiddenCostTemplate generates valid content', () => {
      const template = new HiddenCostTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('hidden-cost');
    });

    it('QuickWinTemplate generates valid content', () => {
      const template = new QuickWinTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(4);
      expect(result.templateType).toBe('quick-win');
    });
  });

  describe('Story-based Templates', () => {
    it('TransformationTemplate generates valid content', () => {
      const template = new TransformationTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(4);
      expect(result.templateType).toBe('transformation');
      expect(result.templateCategory).toBe('story');
    });

    it('FailureToSuccessTemplate generates valid content', () => {
      const template = new FailureToSuccessTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('failure-to-success');
    });

    it('BehindTheScenesTemplate generates valid content', () => {
      const template = new BehindTheScenesTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('behind-the-scenes');
    });
  });

  describe('Educational Templates', () => {
    it('MythBusterTemplate generates valid content', () => {
      const template = new MythBusterTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('myth-buster');
      expect(result.templateCategory).toBe('educational');
    });

    it('GuideSnippetTemplate generates valid content', () => {
      const template = new GuideSnippetTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('guide-snippet');
    });

    it('ComparisonTemplate generates valid content', () => {
      const template = new ComparisonTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('comparison');
    });
  });

  describe('Urgency Templates', () => {
    it('TrendJackerTemplate generates valid content', () => {
      const template = new TrendJackerTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('trend-jacker');
      expect(result.templateCategory).toBe('urgency');
    });

    it('DeadlineDriverTemplate generates valid content', () => {
      const template = new DeadlineDriverTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('deadline-driver');
    });

    it('SeasonalTemplate generates valid content', () => {
      const template = new SeasonalTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('seasonal');
    });
  });

  describe('Authority Templates', () => {
    it('DataRevelationTemplate generates valid content', () => {
      const template = new DataRevelationTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('data-revelation');
      expect(result.templateCategory).toBe('authority');
    });

    it('ExpertRoundupTemplate generates valid content', () => {
      const template = new ExpertRoundupTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('expert-roundup');
    });

    it('CaseStudyTemplate generates valid content', () => {
      const template = new CaseStudyTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('case-study');
    });
  });

  describe('Engagement Templates', () => {
    it('ChallengePostTemplate generates valid content', () => {
      const template = new ChallengePostTemplate();
      const result = template.generate(testInput);

      expect(result.sections).toHaveLength(3);
      expect(result.templateType).toBe('challenge-post');
      expect(result.templateCategory).toBe('engagement');
    });
  });
});

describe('Performance Prediction', () => {
  const testInput: TemplateInput = {
    topic: 'marketing automation',
    industry: 'Technology',
    targetAudience: 'CTOs',
    tone: 'professional',
    platform: 'linkedin',
  };

  it('should predict performance within expected range', () => {
    const template = new CuriosityGapTemplate();
    const result = template.generate(testInput);

    expect(result.performance.ctrImprovement).toBeGreaterThanOrEqual(27);
    expect(result.performance.ctrImprovement).toBeLessThanOrEqual(52);
    expect(result.performance.engagementLift).toBeDefined();
    expect(result.performance.conversionPotential).toBeDefined();
    expect(result.performance.bestPlatforms).toBeDefined();
    expect(result.performance.optimalPostingTimes).toBeDefined();
    expect(result.performance.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.performance.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('should adjust prediction based on platform', () => {
    const template = new CuriosityGapTemplate();

    const linkedinResult = template.generate({ ...testInput, platform: 'linkedin' });
    const blogResult = template.generate({ ...testInput, platform: 'blog' });

    // LinkedIn should generally have higher prediction due to platform multiplier
    expect(linkedinResult.performance.ctrImprovement)
      .toBeGreaterThanOrEqual(blogResult.performance.ctrImprovement);
  });

  it('should have higher confidence with more complete input', () => {
    const template = new CuriosityGapTemplate();

    const completeInput: TemplateInput = {
      topic: 'marketing',
      industry: 'Tech',
      targetAudience: 'Developers',
      tone: 'professional',
      platform: 'linkedin',
    };

    const minimalInput: TemplateInput = {
      topic: 'marketing',
    };

    const completeResult = template.generate(completeInput);
    const minimalResult = template.generate(minimalInput);

    expect(completeResult.performance.confidenceScore)
      .toBeGreaterThan(minimalResult.performance.confidenceScore);
  });

  it('should calculate conversion potential based on CTR', () => {
    const allTemplates = templateRegistry.getAllTemplates();

    allTemplates.forEach(template => {
      const result = template.generate(testInput);
      const ctr = result.performance.ctrImprovement;
      const potential = result.performance.conversionPotential;

      if (ctr >= 45) {
        expect(potential).toBe('very-high');
      } else if (ctr >= 38) {
        expect(potential).toBe('high');
      } else if (ctr >= 32) {
        expect(potential).toBe('medium');
      } else {
        expect(potential).toBe('low');
      }
    });
  });
});

describe('Hashtag Generation', () => {
  it('should generate hashtags based on input', () => {
    const template = new CuriosityGapTemplate();
    const result = template.generate({
      topic: 'content marketing',
      industry: 'SaaS',
    });

    expect(result.hashtags).toBeDefined();
    expect(result.hashtags.length).toBeGreaterThan(0);
    expect(result.hashtags.length).toBeLessThanOrEqual(5);
    result.hashtags.forEach(tag => {
      expect(tag.startsWith('#')).toBe(true);
    });
  });
});

describe('Platform Formatting', () => {
  it('should respect Twitter character limit', () => {
    const template = new CuriosityGapTemplate();
    const result = template.generate({
      topic: 'A very long topic that could potentially create content exceeding platform limits',
      platform: 'twitter',
    });

    expect(result.body.length).toBeLessThanOrEqual(280);
  });
});
