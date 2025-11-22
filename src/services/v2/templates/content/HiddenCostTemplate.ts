/**
 * Hidden Cost Template
 * Structure: Problem + Impact + Solution
 * Reveals unseen costs of common problems
 */

import {
  ContentTemplateBase,
  TemplateInput,
  GeneratedContent,
  TemplateMetadata,
} from '../template-base.service';

export class HiddenCostTemplate extends ContentTemplateBase {
  readonly metadata: TemplateMetadata = {
    id: 'hidden-cost',
    name: 'Hidden Cost Revealer',
    category: 'problem-solution',
    description: 'Exposes the true cost of problems that often go unnoticed',
    structure: ['Hidden Problem', 'True Impact', 'Clear Solution'],
    bestFor: ['B2B sales', 'Consultative selling', 'ROI content', 'Problem education'],
    avgCtrImprovement: 38,
    psychologicalTriggers: ['Loss aversion', 'Fear', 'Value realization'],
  };

  generate(input: TemplateInput): GeneratedContent {
    const { topic, industry, targetAudience, platform } = input;

    const problem = `Poor ${topic} practices that seem "good enough"`;
    const impact = `Silent drain on resources: wasted time, missed opportunities, and team frustration that compounds daily`;
    const solution = `A systematic approach that identifies gaps and implements proven fixes`;

    const hook = `The hidden cost of ignoring ${topic} is bigger than you think.`;
    const body = `Most ${targetAudience || 'businesses'} in ${industry || 'this space'} don't realize they have a ${topic} problem.\n\nThey think things are "fine."\n\nBut here's what "fine" actually costs:\n\n**The Hidden Problem:** ${problem}\n\n**The True Impact:** ${impact}\n\nWe're talking about invisible leaks that add up to massive losses over time.\n\n**The Solution:** ${solution}\n\nOnce you see the numbers, "fine" stops being acceptable.`;
    const cta = `Want to audit your own ${topic} costs? Reply "AUDIT" and I'll share our assessment framework.`;

    const sections = [
      this.createSection('Problem', problem, '[Hidden issue]'),
      this.createSection('Impact', impact, '[True cost]'),
      this.createSection('Solution', solution, '[Your answer]'),
    ];

    return {
      title: `The Hidden Cost of ${topic} Problems (And How to Fix It)`,
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
    return ['professional', 'authoritative', 'urgent'];
  }

  protected getBestPlatforms(): string[] {
    return ['linkedin', 'email', 'blog'];
  }

  protected getTemplateSpecificHashtags(): string[] {
    return ['#hiddencosts', '#ROI', '#businesstip'];
  }
}
