/**
 * Curiosity Gap Template
 * Structure: Known + Unknown + Stakes
 * Creates information gap that compels readers to learn more
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class CuriosityGapTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    category: 'hook',
    description: 'Creates an information gap between what the reader knows and what they want to know',
    structure: ['Known Element', 'Unknown Element', 'Stakes'],
    bestFor: ['Lead generation', 'Click-through', 'Email subject lines', 'Social hooks'],
    avgCtrImprovement: 47,
    psychologicalTriggers: ['Curiosity', 'FOMO', 'Knowledge gap'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const known = `Most ${targetAudience || 'professionals'} already know that ${topic} matters`;
    const unknown = `But there's a hidden factor that ${industry || 'industry'} leaders discovered`;
    const stakes = `Missing this could cost you significant opportunities`;

    const hook = `${known}. ${unknown} that's changing everything.`;
    const body = `Here's what the data reveals:\n\n${stakes}.\n\nThe ${topic} approach that's working right now isn't what you'd expect. ${unknown}, and it's delivering results that traditional methods can't match.\n\nHere's what they're doing differently...`;
    const cta = `Want to know the specific strategy? Comment "REVEAL" and I'll share the breakdown.`;

    const sections = [
      this.createSection('Known', known, '[What audience already knows]'),
      this.createSection('Unknown', unknown, '[The gap/mystery]'),
      this.createSection('Stakes', stakes, '[Why it matters]'),
    ];

    return {
      title: `The ${topic} Secret That ${industry || 'Industry'} Leaders Won't Share`,
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
    return ['professional', 'authoritative', 'casual'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'email', 'twitter'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#insider', '#revealed', '#mustknow'];
  }
}
