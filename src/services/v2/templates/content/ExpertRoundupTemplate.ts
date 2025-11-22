/**
 * Expert Roundup Template
 * Structure: Question + Answers + Synthesis
 * Compiles expert perspectives
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class ExpertRoundupTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'expert-roundup',
    name: 'Expert Roundup',
    category: 'authority',
    description: 'Compiles insights from multiple experts with synthesis',
    structure: ['Central Question', 'Expert Answers', 'Key Synthesis'],
    bestFor: ['Authority by association', 'Networking content', 'High shareability', 'Link building'],
    avgCtrImprovement: 42,
    psychologicalTriggers: ['Authority', 'Social proof', 'Expert validation'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const question = `What's the one ${topic} change that would have the biggest impact for ${targetAudience || 'professionals'}?`;
    const answers = `Expert 1: "Focus on consistency over perfection"\nExpert 2: "Measure outcomes, not activities"\nExpert 3: "Simplify before you scale"`;
    const synthesis = `The common thread: successful ${topic} is about fundamentals executed well, not advanced tactics implemented poorly`;

    const hook = `I asked 3 ${industry || 'industry'} experts one ${topic} question. Their answers align perfectly.`;
    const body = `**THE QUESTION:**\n"${question}"\n\n**THE EXPERT ANSWERS:**\n\n${answers}\n\nNotice a pattern?\n\n**THE SYNTHESIS:**\n${synthesis}\n\nThree different experts, three different backgrounds, one consistent message.\n\nThat's not a coincidence. That's truth.`;
    const cta = `What would YOUR answer be to this question? Add to the roundup below.`;

    const sections = [
      this.createSection('Question', question, '[Central inquiry]'),
      this.createSection('Answers', answers, '[Expert responses]'),
      this.createSection('Synthesis', synthesis, '[Key takeaway]'),
    ];

    return {
      title: `3 ${industry || 'Industry'} Experts Answer: The #1 ${topic} Change to Make`,
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
    return ['professional', 'authoritative', 'friendly'];
  }

  protected getBestPlatforms(): string[] {
    return ['blog', 'linkedin', 'email'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#experts', '#roundup', '#advice'];
  }
}
