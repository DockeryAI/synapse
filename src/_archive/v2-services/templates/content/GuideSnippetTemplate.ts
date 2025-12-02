/**
 * Guide Snippet Template
 * Structure: Promise + Credibility + Process
 * Provides actionable guidance from authority
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class GuideSnippetTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'guide-snippet',
    name: 'Ultimate Guide Snippet',
    category: 'educational',
    description: 'Provides authoritative guidance with clear steps and credibility',
    structure: ['Clear Promise', 'Credibility Statement', 'Step-by-Step Process'],
    bestFor: ['Lead generation', 'Authority building', 'SEO content', 'Email opt-ins'],
    avgCtrImprovement: 34,
    psychologicalTriggers: ['Authority', 'Clarity', 'Achievability'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const promise = `Master the fundamentals of ${topic} in one week`;
    const credibility = `Based on working with 100+ ${targetAudience || 'professionals'} in ${industry || 'the industry'}`;
    const process = `Day 1-2: Foundation (understand core principles)\nDay 3-4: Application (implement key tactics)\nDay 5-6: Optimization (measure and adjust)\nDay 7: Mastery (systemize and scale)`;

    const hook = `The complete guide to ${topic} (saved you 40+ hours of research).`;
    const body = `**THE PROMISE:**\n${promise}\n\n**THE CREDIBILITY:**\n${credibility}, I've distilled what actually works.\n\n**THE PROCESS:**\n\n${process}\n\nThis isn't theory. This is the exact framework that delivers results.\n\nNo fluff. No filler. Just the essentials.`;
    const cta = `Want the full guide with templates and examples? Comment "GUIDE" and I'll send it over.`;

    const sections = [
      this.createSection('Promise', promise, '[What they\'ll achieve]'),
      this.createSection('Credibility', credibility, '[Why trust you]'),
      this.createSection('Process', process, '[How to do it]'),
    ];

    return {
      title: `The Complete ${topic} Guide for ${targetAudience || 'Professionals'}`,
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
    return ['authoritative', 'professional', 'friendly'];
  }

  protected getBestPlatforms(): string[] {
    return ['blog', 'linkedin', 'email'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#guide', '#howto', '#tutorial'];
  }
}
