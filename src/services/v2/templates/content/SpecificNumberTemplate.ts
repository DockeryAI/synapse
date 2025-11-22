/**
 * Specific Number Template
 * Structure: Number + Outcome + Timeframe
 * Uses specific numbers to create credibility and urgency
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class SpecificNumberTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'specific-number',
    name: 'Specific Number',
    category: 'hook',
    description: 'Uses precise numbers to create credibility and concrete expectations',
    structure: ['Specific Number', 'Concrete Outcome', 'Clear Timeframe'],
    bestFor: ['Case studies', 'Results sharing', 'Lead magnets', 'Credibility building'],
    avgCtrImprovement: 36,
    psychologicalTriggers: ['Specificity bias', 'Social proof', 'Achievability'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const number = '3';
    const outcome = `measurable improvements in ${topic}`;
    const timeframe = '30 days';

    const hook = `${number} ${topic} strategies that generated ${outcome} in just ${timeframe}.`;
    const body = `Last month, I tested everything about ${topic}.\n\nHere are the ${number} strategies that actually moved the needle:\n\n1. Strategy One: Focus on the 20% that drives 80% of results\n2. Strategy Two: Eliminate friction points before adding features\n3. Strategy Three: Measure what matters, ignore vanity metrics\n\nThe ${targetAudience || 'teams'} in ${industry || 'our industry'} who implemented these saw ${outcome} within ${timeframe}.\n\nNo fluff. Just what works.`;
    const cta = `Save this post for your next ${topic} planning session. Which strategy will you try first?`;

    const sections = [
      this.createSection('Number', number, '[Specific count]'),
      this.createSection('Outcome', outcome, '[Measurable result]'),
      this.createSection('Timeframe', timeframe, '[Clear timeline]'),
    ];

    return {
      title: `${number} ${topic} Strategies That Deliver ${outcome} in ${timeframe}`,
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
    return ['linkedin', 'blog', 'email'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#results', '#proven', '#datadriven'];
  }
}
