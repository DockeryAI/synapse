/**
 * Behind the Scenes Template
 * Structure: Success + Process + Challenges
 * Shows the real work behind results
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class BehindTheScenesTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'behind-the-scenes',
    name: 'Behind the Scenes',
    category: 'story',
    description: 'Reveals the real process and challenges behind a success',
    structure: ['The Success', 'The Real Process', 'The Hidden Challenges'],
    bestFor: ['Authenticity', 'Trust building', 'Educational content', 'Transparency'],
    avgCtrImprovement: 33,
    psychologicalTriggers: ['Curiosity', 'Authenticity', 'Behind-the-curtain access'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const success = `The ${topic} results everyone sees`;
    const process = `What actually happens: 80% planning, testing, and iteration—20% execution`;
    const challenges = `Late nights, failed experiments, and moments of serious doubt`;

    const hook = `Here's what really goes into our ${topic} success (it's not pretty).`;
    const body = `You see the results. But you don't see what it took to get here.\n\n**THE SUCCESS:**\n${success}\n\n**THE REAL PROCESS:**\n${process}\n\nMost of what we do never sees the light of day. Ideas that didn't work. Approaches that failed. Hours of work that got scrapped.\n\n**THE HIDDEN CHALLENGES:**\n${challenges}\n\nEvery ${targetAudience || 'team'} in ${industry || 'this space'} deals with this. The difference is whether you keep going.\n\nThis is the unsexy truth about ${topic}. There are no shortcuts.`;
    const cta = `What's a behind-the-scenes truth from your work that people don't see?`;

    const sections = [
      this.createSection('Success', success, '[Visible outcome]'),
      this.createSection('Process', process, '[Real work]'),
      this.createSection('Challenges', challenges, '[Hidden struggles]'),
    ];

    return {
      title: `Behind the Scenes: What ${topic} Success Really Looks Like`,
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
    return ['casual', 'friendly', 'professional'];
  }

  protected getBestPlatforms(): string[] {
    return ['instagram', 'linkedin', 'twitter'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#behindthescenes', '#realwork', '#nofilter'];
  }
}
