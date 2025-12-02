/**
 * Data Revelation Template
 * Structure: Statistic + Meaning + Action
 * Reveals insights from data
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class DataRevelationTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'data-revelation',
    name: 'Data Revelation',
    category: 'authority',
    description: 'Reveals surprising data and explains what it means for the audience',
    structure: ['Surprising Statistic', 'What It Means', 'Recommended Action'],
    bestFor: ['Authority building', 'Data-driven content', 'B2B thought leadership', 'Credibility'],
    avgCtrImprovement: 40,
    psychologicalTriggers: ['Authority', 'Surprise', 'Data credibility'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const statistic = `83% of ${targetAudience || 'professionals'} say ${topic} is a top priority, but only 12% feel they're doing it well`;
    const meaning = `There's a massive gap between intention and execution in ${industry || 'the market'}`;
    const action = `Focus on the fundamentals before chasing advanced tactics`;

    const hook = `This ${topic} data surprised me. ${statistic}.`;
    const body = `I dug into the research and found something interesting.\n\n**THE DATA:**\n${statistic}\n\nRead that again.\n\n**WHAT THIS MEANS:**\n${meaning}\n\nMost ${targetAudience || 'people'} know ${topic} matters. But knowing and doing are different things.\n\n**THE ACTION:**\n${action}\n\nThe 12% who feel confident aren't doing anything fancy. They're just doing the basics consistently.\n\nThat's the real insight here.`;
    const cta = `Does this data match what you're seeing? Share your perspective below.`;

    const sections = [
      this.createSection('Statistic', statistic, '[Key data point]'),
      this.createSection('Meaning', meaning, '[Interpretation]'),
      this.createSection('Action', action, '[What to do]'),
    ];

    return {
      title: `The ${topic} Data That Changes Everything (83% vs 12%)`,
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
    return ['authoritative', 'professional', 'friendly'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'blog', 'twitter'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#data', '#research', '#insights'];
  }
}
