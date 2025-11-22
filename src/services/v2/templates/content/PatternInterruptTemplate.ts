/**
 * Pattern Interrupt Template
 * Structure: Belief + Contradiction + Possibility
 * Disrupts expectations to capture attention
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class PatternInterruptTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'pattern-interrupt',
    name: 'Pattern Interrupt',
    category: 'hook',
    description: 'Challenges common beliefs to create cognitive dissonance and engagement',
    structure: ['Common Belief', 'Contradiction', 'New Possibility'],
    bestFor: ['Thought leadership', 'Viral content', 'Engagement', 'Brand differentiation'],
    avgCtrImprovement: 52,
    psychologicalTriggers: ['Cognitive dissonance', 'Surprise', 'Curiosity'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const belief = `Everyone believes that ${topic} requires more effort and resources`;
    const contradiction = `But the top performers in ${industry || 'this space'} are doing the opposite`;
    const possibility = `What if less is actually more when it comes to ${topic}?`;

    const hook = `Stop doing more ${topic}. It's making things worse.`;
    const body = `${belief}.\n\n${contradiction}.\n\nHere's what I discovered after analyzing successful ${targetAudience || 'professionals'}:\n\nThe ones getting the best results aren't working harder—they're being more strategic.\n\n${possibility}\n\nThe evidence is clear: complexity kills performance. Simplicity scales.`;
    const cta = `What's one thing you could STOP doing today? Drop it in the comments.`;

    const sections = [
      this.createSection('Belief', belief, '[Common assumption]'),
      this.createSection('Contradiction', contradiction, '[Surprising opposite]'),
      this.createSection('Possibility', possibility, '[New opportunity]'),
    ];

    return {
      title: `Why Everything You Know About ${topic} Is Wrong`,
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
    return ['authoritative', 'professional', 'casual'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'twitter', 'blog'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#mythbusted', '#rethink', '#contrarian'];
  }
}
