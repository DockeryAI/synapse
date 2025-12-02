/**
 * Comparison Template
 * Structure: A vs B + Criteria + Winner
 * Compares options objectively
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class ComparisonTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'comparison',
    name: 'Comparison Post',
    category: 'educational',
    description: 'Objectively compares two approaches with clear criteria and recommendation',
    structure: ['Option A vs Option B', 'Evaluation Criteria', 'Clear Winner'],
    bestFor: ['Decision support', 'SEO content', 'Authority building', 'Purchase intent'],
    avgCtrImprovement: 36,
    psychologicalTriggers: ['Decision facilitation', 'Analysis', 'Trust'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const comparison = `Traditional ${topic} approach vs Modern ${topic} approach`;
    const criteria = `Speed, Cost, Scalability, Results consistency`;
    const winner = `The modern approach wins 3 out of 4 criteria for most ${targetAudience || 'teams'}`;

    const hook = `${topic}: Traditional vs Modern approach. Here's my honest breakdown.`;
    const body = `Let's compare these head-to-head.\n\n**THE COMPARISON:**\n${comparison}\n\n**EVALUATION CRITERIA:**\n${criteria}\n\n**TRADITIONAL APPROACH:**\n✅ Proven track record\n✅ Familiar to most teams\n❌ Slower execution\n❌ Higher resource requirements\n\n**MODERN APPROACH:**\n✅ 3x faster implementation\n✅ Lower ongoing costs\n✅ Better scalability\n❌ Requires new skill development\n\n**THE VERDICT:**\n${winner}\n\nBut here's the nuance: the "right" choice depends on where you are in ${industry || 'your industry'}.`;
    const cta = `Which approach are you currently using? Drop it in the comments.`;

    const sections = [
      this.createSection('A vs B', comparison, '[Two options]'),
      this.createSection('Criteria', criteria, '[Evaluation factors]'),
      this.createSection('Winner', winner, '[Recommendation]'),
    ];

    return {
      title: `${topic}: Traditional vs Modern - Which Is Better?`,
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
    return ['#comparison', '#versus', '#decision'];
  }
}
