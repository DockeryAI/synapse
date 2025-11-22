/**
 * Challenge Post Template
 * Structure: Problem + Challenge + Framework
 * Engages audience with actionable challenges
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class ChallengePostTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'challenge-post',
    name: 'Challenge Post',
    category: 'engagement',
    description: 'Issues a challenge to the audience with clear framework and accountability',
    structure: ['The Problem', 'The Challenge', 'The Framework'],
    bestFor: ['Community building', 'Engagement', 'User-generated content', 'Momentum'],
    avgCtrImprovement: 48,
    psychologicalTriggers: ['Challenge acceptance', 'Commitment', 'Community', 'Gamification'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const problem = `Most ${targetAudience || 'people'} know what they should do with ${topic}, but they're not doing it`;
    const challenge = `Join me for a 7-day ${topic} challenge: one small action every day`;
    const framework = `Day 1: Audit\nDay 2: Prioritize\nDay 3: Eliminate\nDay 4: Simplify\nDay 5: Execute\nDay 6: Measure\nDay 7: Iterate`;

    const hook = `I'm starting a 7-day ${topic} challenge. Who's in?`;
    const body = `**THE PROBLEM:**\n${problem}\n\nKnowing isn't the problem. Doing is.\n\n**THE CHALLENGE:**\n${challenge}\n\nSmall actions. Big compound effect.\n\n**THE FRAMEWORK:**\n\n${framework}\n\nNo fancy tools. No expensive programs. Just 7 days of intentional action.\n\nEvery ${targetAudience || 'professional'} in ${industry || 'any field'} can do this.\n\nThe question is: will you?`;
    const cta = `Comment "I'M IN" to join. I'll be posting daily check-ins and sharing progress.`;

    const sections = [
      this.createSection('Problem', problem, '[Why we need this]'),
      this.createSection('Challenge', challenge, '[What we\'re doing]'),
      this.createSection('Framework', framework, '[Daily structure]'),
    ];

    return {
      title: `7-Day ${topic} Challenge: Who's Ready to Level Up?`,
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
    return ['friendly', 'casual', 'urgent'];
  }

  protected getBestPlatforms(): string[] {
    return ['instagram', 'linkedin', 'twitter'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#challenge', '#7daychallenge', '#joinme'];
  }
}
