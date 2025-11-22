/**
 * Mistake Exposer Template
 * Structure: Mistake + Why + Fix + Result
 * Reveals common errors and provides solutions
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class MistakeExposerTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'mistake-exposer',
    name: 'Mistake Exposer',
    category: 'problem-solution',
    description: 'Identifies common mistakes and provides actionable fixes',
    structure: ['Common Mistake', 'Why It Happens', 'The Fix', 'Expected Result'],
    bestFor: ['Educational content', 'Lead generation', 'Authority building', 'Newsletter content'],
    avgCtrImprovement: 35,
    psychologicalTriggers: ['Loss aversion', 'Self-improvement', 'Problem recognition'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const mistake = `Treating ${topic} as a one-time project instead of an ongoing process`;
    const why = `It's easier to "launch and forget" than to continuously optimize`;
    const fix = `Implement weekly review cycles with clear metrics and adjustment protocols`;
    const result = `Consistent improvement and compounding results over time`;

    const hook = `The #1 ${topic} mistake I see ${targetAudience || 'people'} make (and how to fix it).`;
    const body = `After working with dozens of ${targetAudience || 'teams'} in ${industry || 'various industries'}, I keep seeing the same mistake:\n\n**The Mistake:** ${mistake}\n\n**Why It Happens:** ${why}\n\n**The Fix:** ${fix}\n\n**The Result:** ${result}\n\nThis single change transforms ${topic} from a frustrating guessing game into a predictable growth engine.`;
    const cta = `Which mistake have you made? Drop a comment below—no judgment, we've all been there.`;

    const sections = [
      this.createSection('Mistake', mistake, '[Common error]'),
      this.createSection('Why', why, '[Root cause]'),
      this.createSection('Fix', fix, '[Solution]'),
      this.createSection('Result', result, '[Outcome]'),
    ];

    return {
      title: `The ${topic} Mistake Costing ${targetAudience || 'You'} Time and Money`,
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
    return ['professional', 'friendly', 'authoritative'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'blog', 'email'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#mistakes', '#lessons', '#protip'];
  }
}
