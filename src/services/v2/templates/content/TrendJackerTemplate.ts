/**
 * Trend Jacker Template
 * Structure: Event + Connection + Solution
 * Capitalizes on current trends and events
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class TrendJackerTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'trend-jacker',
    name: 'Trend Jacker',
    category: 'urgency',
    description: 'Connects current trends/events to your expertise for timely relevance',
    structure: ['Current Event/Trend', 'Relevant Connection', 'Your Solution'],
    bestFor: ['Viral potential', 'Timeliness', 'Newsjacking', 'Social engagement'],
    avgCtrImprovement: 44,
    psychologicalTriggers: ['Timeliness', 'Relevance', 'FOMO'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const event = `Everyone's talking about the latest changes in ${industry || 'the market'}`;
    const connection = `This directly impacts how ${targetAudience || 'you'} should approach ${topic}`;
    const solution = `Here's what to do right now to turn this disruption into an advantage`;

    const hook = `The ${industry || 'industry'} news everyone's missing—and why it matters for ${topic}.`;
    const body = `**THE EVENT:**\n${event}\n\nBut here's what most people aren't seeing.\n\n**THE CONNECTION:**\n${connection}\n\nThis isn't just news. This is a signal.\n\n**WHAT TO DO NOW:**\n${solution}\n\n1. Audit your current ${topic} approach\n2. Identify gaps exposed by this change\n3. Move quickly—first movers win\n\nThe ${targetAudience || 'people'} who act on this now will be ahead. The rest will be catching up.`;
    const cta = `Are you seeing this shift too? What's your take?`;

    const sections = [
      this.createSection('Event', event, '[Current trend]'),
      this.createSection('Connection', connection, '[Why it matters]'),
      this.createSection('Solution', solution, '[What to do]'),
    ];

    return {
      title: `Breaking: How This ${industry || 'Industry'} Shift Changes ${topic}`,
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
    return ['urgent', 'professional', 'authoritative'];
  }

  protected getBestPlatforms(): string[] {
    return ['twitter', 'linkedin', 'instagram'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#trending', '#news', '#breakingnews'];
  }
}
