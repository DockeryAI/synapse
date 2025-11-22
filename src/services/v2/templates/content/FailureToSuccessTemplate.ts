/**
 * Failure to Success Template
 * Structure: Failure + Learning + New Approach
 * Shares lessons learned from mistakes
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class FailureToSuccessTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'failure-to-success',
    name: 'Failure to Success',
    category: 'story',
    description: 'Shares authentic failures and the lessons that led to success',
    structure: ['The Failure', 'The Learning', 'The New Approach'],
    bestFor: ['Trust building', 'Vulnerability content', 'Educational stories', 'Relatability'],
    avgCtrImprovement: 41,
    psychologicalTriggers: ['Vulnerability', 'Authenticity', 'Learning', 'Connection'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const failure = `I completely failed at ${topic} my first time. Lost time, money, and credibility.`;
    const learning = `The failure taught me that expertise doesn't mean anything without execution`;
    const newApproach = `Now I focus on small wins first, build momentum, then scale what works`;

    const hook = `My biggest ${topic} failure (and why I'm grateful for it).`;
    const body = `Let me tell you about the time I completely bombed.\n\n**THE FAILURE:**\n${failure}\n\nI thought I knew what I was doing. I didn't.\n\n**THE LEARNING:**\n${learning}\n\nThis was humbling. But it was also the turning point.\n\n**THE NEW APPROACH:**\n${newApproach}\n\nNow, when ${targetAudience || 'others'} in ${industry || 'the industry'} ask me about ${topic}, I start with this story.\n\nBecause the failure is what made the success possible.`;
    const cta = `What's a failure that ended up being your best teacher? Let's share and learn together.`;

    const sections = [
      this.createSection('Failure', failure, '[What went wrong]'),
      this.createSection('Learning', learning, '[Key insight]'),
      this.createSection('New Approach', newApproach, '[What changed]'),
    ];

    return {
      title: `The ${topic} Failure That Changed Everything`,
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
    return ['linkedin', 'instagram', 'twitter'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#failforward', '#lessons', '#authenticity'];
  }
}
