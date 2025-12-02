/**
 * Deadline Driver Template
 * Structure: Opportunity + Window + Action
 * Creates urgency with time-sensitive opportunities
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class DeadlineDriverTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'deadline-driver',
    name: 'Deadline Driver',
    category: 'urgency',
    description: 'Creates urgency with time-sensitive opportunities and clear deadlines',
    structure: ['The Opportunity', 'The Time Window', 'The Action Required'],
    bestFor: ['Promotions', 'Launches', 'Events', 'Limited offers'],
    avgCtrImprovement: 45,
    psychologicalTriggers: ['Scarcity', 'FOMO', 'Urgency', 'Loss aversion'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const opportunity = `A chance to master ${topic} before most ${targetAudience || 'people'} even know what's happening`;
    const window = `This window closes at the end of the month`;
    const action = `Take this one specific step today to lock in your advantage`;

    const hook = `⏰ Time-sensitive: This ${topic} opportunity won't last.`;
    const body = `I don't often create urgency. But this is different.\n\n**THE OPPORTUNITY:**\n${opportunity}\n\nThis isn't hype. This is a genuine window that's closing.\n\n**THE TIME WINDOW:**\n${window}\n\nAfter that, the landscape changes.\n\n**THE ACTION:**\n${action}\n\nFor ${targetAudience || 'anyone'} in ${industry || 'this space'}, this is the moment.\n\nWait too long and you're playing catch-up. Move now and you're ahead.`;
    const cta = `Ready to move? Comment "IN" and I'll send you the details.`;

    const sections = [
      this.createSection('Opportunity', opportunity, '[What\'s available]'),
      this.createSection('Window', window, '[Time limit]'),
      this.createSection('Action', action, '[What to do]'),
    ];

    return {
      title: `Last Chance: The ${topic} Opportunity Closing Soon`,
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
    return ['urgent', 'professional', 'friendly'];
  }

  protected getBestPlatforms(): string[] {
    return ['email', 'linkedin', 'instagram'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#limitedtime', '#deadline', '#actnow'];
  }
}
