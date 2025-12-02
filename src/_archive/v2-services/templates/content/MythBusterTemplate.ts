/**
 * Myth Buster Template
 * Structure: Myth + Why Believed + Truth
 * Debunks common misconceptions
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class MythBusterTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'myth-buster',
    name: 'Myth Buster',
    category: 'educational',
    description: 'Debunks common myths and reveals the truth',
    structure: ['The Myth', 'Why People Believe It', 'The Actual Truth'],
    bestFor: ['Authority building', 'Educational content', 'Engagement', 'Thought leadership'],
    avgCtrImprovement: 39,
    psychologicalTriggers: ['Cognitive dissonance', 'Learning', 'Truth-seeking'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const myth = `You need to be an expert before you can succeed at ${topic}`;
    const whyBelieved = `Because "experts" keep telling us we need more credentials, more training, more preparation`;
    const truth = `The best practitioners learned by doing, failing, and iterating—not by waiting until they felt "ready"`;

    const hook = `MYTH: You need years of experience to succeed at ${topic}. Here's the truth.`;
    const body = `Let's bust this myth wide open.\n\n**THE MYTH:**\n"${myth}"\n\n**WHY PEOPLE BELIEVE IT:**\n${whyBelieved}\n\nThis keeps ${targetAudience || 'people'} stuck in perpetual preparation mode.\n\n**THE ACTUAL TRUTH:**\n${truth}\n\nIn ${industry || 'every industry'}, the top performers share one thing: they started before they were ready.\n\nPerfect preparation is a myth. Imperfect action is the path.`;
    const cta = `What ${topic} myth held you back the longest? Let's expose more of these below.`;

    const sections = [
      this.createSection('Myth', myth, '[Common misconception]'),
      this.createSection('Why Believed', whyBelieved, '[Source of myth]'),
      this.createSection('Truth', truth, '[Actual reality]'),
    ];

    return {
      title: `${topic} Myth BUSTED: The Truth Nobody Tells You`,
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
    return ['#mythbusted', '#truth', '#debunked'];
  }
}
