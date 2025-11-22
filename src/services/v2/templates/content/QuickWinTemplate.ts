/**
 * Quick Win Template
 * Structure: Change + Result + Proof + How-to
 * Provides immediately actionable improvements
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class QuickWinTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'quick-win',
    name: 'Quick Win',
    category: 'problem-solution',
    description: 'Provides small, immediately actionable changes with fast results',
    structure: ['Simple Change', 'Immediate Result', 'Proof Point', 'How-To Steps'],
    bestFor: ['Engagement', 'List building', 'Trust building', 'Social sharing'],
    avgCtrImprovement: 31,
    psychologicalTriggers: ['Instant gratification', 'Achievability', 'Momentum'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const change = `Spend 10 minutes each morning reviewing your ${topic} priorities`;
    const result = `Immediate clarity and 2-3x faster decision-making throughout the day`;
    const proof = `Over 80% of high performers use some form of this technique`;
    const howTo = `1. Set a recurring 10-min calendar block\n2. Review yesterday's outcomes\n3. Identify today's top 3 priorities\n4. Clear obvious blockers`;

    const hook = `A 10-minute ${topic} habit that changed everything.`;
    const body = `Looking for a quick win that actually works?\n\n**The Change:** ${change}\n\n**The Result:** ${result}\n\n**Why It Works:** ${proof}\n\n**How to Do It:**\n${howTo}\n\nThis isn't complicated. It's not a "system" or a "framework."\n\nIt's just 10 minutes that compound into massive results for ${targetAudience || 'anyone'} in ${industry || 'any field'}.`;
    const cta = `Try this tomorrow morning and report back. What's your current morning ${topic} routine?`;

    const sections = [
      this.createSection('Change', change, '[Simple action]'),
      this.createSection('Result', result, '[Immediate benefit]'),
      this.createSection('Proof', proof, '[Validation]'),
      this.createSection('How-To', howTo, '[Steps]'),
    ];

    return {
      title: `The 10-Minute ${topic} Hack That Actually Works`,
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
    return ['friendly', 'casual', 'professional'];
  }

  protected getBestPlatforms(): string[] {
    return ['instagram', 'twitter', 'linkedin'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#quickwin', '#productivity', '#lifehack'];
  }
}
