/**
 * Contrarian Template
 * Structure: Norm + Why Wrong + Better Way
 * Takes controversial stance to drive engagement
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class ContrarianTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'contrarian',
    name: 'Contrarian Take',
    category: 'hook',
    description: 'Challenges industry norms with a controversial but defensible position',
    structure: ['Industry Norm', 'Why It\'s Wrong', 'Better Alternative'],
    bestFor: ['Thought leadership', 'Viral potential', 'Brand positioning', 'Discussion generation'],
    avgCtrImprovement: 42,
    psychologicalTriggers: ['Controversy', 'Cognitive dissonance', 'Authority challenge'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const norm = `${industry || 'Industry'} experts say you need to focus on ${topic}`;
    const whyWrong = `But this advice is outdated and costs ${targetAudience || 'businesses'} time and money`;
    const betterWay = `Instead, the top performers are taking a completely different approach`;

    const hook = `Unpopular opinion: Most ${topic} advice is dead wrong.`;
    const body = `${norm}.\n\n${whyWrong}.\n\nHere's why the conventional wisdom fails:\n\n• It assumes infinite resources\n• It ignores changing market dynamics\n• It focuses on vanity metrics over real outcomes\n\n${betterWay}.\n\nThey're prioritizing impact over activity, results over rituals.\n\nThe data backs this up. The ${targetAudience || 'companies'} winning right now aren't following the playbook—they're rewriting it.`;
    const cta = `Agree or disagree? Let's debate in the comments.`;

    const sections = [
      this.createSection('Norm', norm, '[Common practice]'),
      this.createSection('Why Wrong', whyWrong, '[Problems with norm]'),
      this.createSection('Better Way', betterWay, '[Your alternative]'),
    ];

    return {
      title: `Why the Best ${targetAudience || 'Professionals'} Ignore ${topic} Best Practices`,
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
    return ['#unpopularopinion', '#hottake', '#rethink'];
  }
}
