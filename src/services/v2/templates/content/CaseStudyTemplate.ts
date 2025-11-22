/**
 * Case Study Template
 * Structure: Challenge + Strategy + Results
 * Shares detailed success stories
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class CaseStudyTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'case-study',
    name: 'Case Study',
    category: 'authority',
    description: 'Detailed success story with challenge, strategy, and measurable results',
    structure: ['The Challenge', 'The Strategy', 'The Results'],
    bestFor: ['Sales enablement', 'Proof content', 'Conversion', 'Portfolio building'],
    avgCtrImprovement: 38,
    psychologicalTriggers: ['Social proof', 'Credibility', 'Results focus'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const challenge = `A ${industry || 'company'} struggling with ${topic}—inconsistent results, wasted resources, frustrated team`;
    const strategy = `Implemented a systematic approach: audit, simplify, standardize, then scale`;
    const results = `3x improvement in key metrics within 90 days, plus sustainable systems for ongoing growth`;

    const hook = `Case study: How we transformed ${topic} results from frustrating to predictable.`;
    const body = `Real results from a real client. No fluff.\n\n**THE CHALLENGE:**\n${challenge}\n\nSound familiar? They'd tried multiple approaches. Nothing stuck.\n\n**THE STRATEGY:**\n${strategy}\n\nWe didn't reinvent the wheel. We just applied proven principles consistently.\n\n**THE RESULTS:**\n${results}\n\nHere's what made the difference: they committed to the fundamentals before chasing tactics.\n\nThis works for any ${targetAudience || 'team'} in ${industry || 'any industry'} willing to do the work.`;
    const cta = `Want a similar transformation? Let's talk about what this could look like for you.`;

    const sections = [
      this.createSection('Challenge', challenge, '[Starting problem]'),
      this.createSection('Strategy', strategy, '[Approach taken]'),
      this.createSection('Results', results, '[Measurable outcomes]'),
    ];

    return {
      title: `Case Study: 3x ${topic} Results in 90 Days`,
      hook,
      body: this.formatForPlatform(body, platform),
      cta,
      sections,
      hashtags: this.generateHashtags(input),
      performance: this.predictPerformance(input),
      templateType: this.metadata.id,
      templateCategory: this.metadata.category,
    };
  }

  protected getOptimalTones(): string[] {
    return ['professional', 'authoritative', 'friendly'];
  }

  protected getBestPlatforms(): string[] {
    return ['blog', 'linkedin', 'email'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#casestudy', '#results', '#success'];
  }
}
