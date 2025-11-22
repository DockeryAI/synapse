/**
 * Seasonal Template
 * Structure: Trigger + Problem + Solution
 * Leverages seasonal/timely triggers
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class SeasonalTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'seasonal',
    name: 'Seasonal Angle',
    category: 'urgency',
    description: 'Connects your message to seasonal events and timely triggers',
    structure: ['Seasonal Trigger', 'Related Problem', 'Timely Solution'],
    bestFor: ['Q1-Q4 planning', 'Holiday content', 'Event marketing', 'Timely relevance'],
    avgCtrImprovement: 37,
    psychologicalTriggers: ['Timeliness', 'Relevance', 'Preparation'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const trigger = `It's that time of year when ${targetAudience || 'teams'} start thinking about ${topic}`;
    const problem = `Most will make the same mistakes they made last year`;
    const solution = `Here's how to approach this season differently and actually see results`;

    const hook = `It's planning season. Don't make the same ${topic} mistakes as last year.`;
    const body = `**THE SEASONAL TRIGGER:**\n${trigger}\n\nGoals get set. Plans get made. And then...\n\n**THE PROBLEM:**\n${problem}\n\nSame approaches. Same results. Another year of "we'll do better next time."\n\n**THE SOLUTION:**\n${solution}\n\nThis time, start with:\n1. Clear metrics (not vague goals)\n2. Weekly check-ins (not quarterly reviews)\n3. Flexibility to pivot (not rigid annual plans)\n\nFor ${targetAudience || 'everyone'} in ${industry || 'every industry'}, this is the reset moment. Use it wisely.`;
    const cta = `What's your #1 ${topic} priority this season? Let's compare notes.`;

    const sections = [
      this.createSection('Trigger', trigger, '[Seasonal moment]'),
      this.createSection('Problem', problem, '[Common mistake]'),
      this.createSection('Solution', solution, '[Better approach]'),
    ];

    return {
      title: `Your ${topic} Season Guide: Don't Repeat Last Year's Mistakes`,
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
    return ['professional', 'friendly', 'urgent'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'email', 'blog'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#planning', '#seasonal', '#newseason'];
  }
}
