/**
 * Transformation Story Template
 * Structure: Before + Journey + After + Lesson
 * Classic transformation narrative for emotional connection
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class TransformationTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'transformation',
    name: 'Transformation Story',
    category: 'story',
    description: 'Shares a complete transformation journey from struggle to success',
    structure: ['Before State', 'The Journey', 'After State', 'Key Lesson'],
    bestFor: ['Case studies', 'Testimonials', 'Brand stories', 'Personal branding'],
    avgCtrImprovement: 38,
    psychologicalTriggers: ['Empathy', 'Hope', 'Aspiration', 'Social proof'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const before = `Struggling with ${topic}, working long hours with little to show for it`;
    const journey = `The breakthrough came when we stopped chasing tactics and focused on fundamentals`;
    const after = `Now achieving consistent results with less stress and more clarity`;
    const lesson = `Success in ${topic} isn't about doing more—it's about doing the right things consistently`;

    const hook = `6 months ago, I was ready to give up on ${topic}.`;
    const body = `Here's my transformation story:\n\n**THE BEFORE:**\n${before}\n\nI tried everything. Every hack, every tool, every "guaranteed" method.\n\nNothing worked.\n\n**THE TURNING POINT:**\n${journey}\n\nI stripped everything back to basics. Focused on what actually moves the needle.\n\n**THE AFTER:**\n${after}\n\nThe difference is night and day.\n\n**THE LESSON:**\n${lesson}\n\nFor ${targetAudience || 'anyone'} in ${industry || 'any industry'} struggling with this—there is a better way.`;
    const cta = `What's your ${topic} transformation story? Share below.`;

    const sections = [
      this.createSection('Before', before, '[Starting struggle]'),
      this.createSection('Journey', journey, '[What changed]'),
      this.createSection('After', after, '[Current state]'),
      this.createSection('Lesson', lesson, '[Key takeaway]'),
    ];

    return {
      title: `My ${topic} Transformation: From Struggling to Succeeding`,
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
    return ['friendly', 'professional', 'casual'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'instagram', 'blog'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#transformation', '#journey', '#growth'];
  }
}
