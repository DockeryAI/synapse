/**
 * Content Template Registry
 * Registers all 20 content templates and provides lookup functionality
 */

import { ContentTemplateBase, TemplateMetadata } from './template-base.service';

// Hook-based templates (4)
import { CuriosityGapTemplate } from './content/CuriosityGapTemplate';
import { PatternInterruptTemplate } from './content/PatternInterruptTemplate';
import { SpecificNumberTemplate } from './content/SpecificNumberTemplate';
import { ContrarianTemplate } from './content/ContrarianTemplate';

// Problem-Solution templates (3)
import { MistakeExposerTemplate } from './content/MistakeExposerTemplate';
import { HiddenCostTemplate } from './content/HiddenCostTemplate';
import { QuickWinTemplate } from './content/QuickWinTemplate';

// Story-based templates (3)
import { TransformationTemplate } from './content/TransformationTemplate';
import { FailureToSuccessTemplate } from './content/FailureToSuccessTemplate';
import { BehindTheScenesTemplate } from './content/BehindTheScenesTemplate';

// Educational templates (3)
import { MythBusterTemplate } from './content/MythBusterTemplate';
import { GuideSnippetTemplate } from './content/GuideSnippetTemplate';
import { ComparisonTemplate } from './content/ComparisonTemplate';

// Urgency templates (3)
import { TrendJackerTemplate } from './content/TrendJackerTemplate';
import { DeadlineDriverTemplate } from './content/DeadlineDriverTemplate';
import { SeasonalTemplate } from './content/SeasonalTemplate';

// Authority templates (3)
import { DataRevelationTemplate } from './content/DataRevelationTemplate';
import { ExpertRoundupTemplate } from './content/ExpertRoundupTemplate';
import { CaseStudyTemplate } from './content/CaseStudyTemplate';

// Engagement templates (1)
import { ChallengePostTemplate } from './content/ChallengePostTemplate';

export type TemplateType =
  | 'curiosity-gap'
  | 'pattern-interrupt'
  | 'specific-number'
  | 'contrarian'
  | 'mistake-exposer'
  | 'hidden-cost'
  | 'quick-win'
  | 'transformation'
  | 'failure-to-success'
  | 'behind-the-scenes'
  | 'myth-buster'
  | 'guide-snippet'
  | 'comparison'
  | 'trend-jacker'
  | 'deadline-driver'
  | 'seasonal'
  | 'data-revelation'
  | 'expert-roundup'
  | 'case-study'
  | 'challenge-post';

export type TemplateCategory =
  | 'hook'
  | 'problem-solution'
  | 'story'
  | 'educational'
  | 'urgency'
  | 'authority'
  | 'engagement';

export class ContentTemplateRegistry {
  private static instance: ContentTemplateRegistry;
  private templates: Map<string, ContentTemplateBase> = new Map();

  private constructor() {
    this.registerAllTemplates();
  }

  static getInstance(): ContentTemplateRegistry {
    if (!ContentTemplateRegistry.instance) {
      ContentTemplateRegistry.instance = new ContentTemplateRegistry();
    }
    return ContentTemplateRegistry.instance;
  }

  private registerAllTemplates(): void {
    // Hook-based templates
    this.register(new CuriosityGapTemplate());
    this.register(new PatternInterruptTemplate());
    this.register(new SpecificNumberTemplate());
    this.register(new ContrarianTemplate());

    // Problem-Solution templates
    this.register(new MistakeExposerTemplate());
    this.register(new HiddenCostTemplate());
    this.register(new QuickWinTemplate());

    // Story-based templates
    this.register(new TransformationTemplate());
    this.register(new FailureToSuccessTemplate());
    this.register(new BehindTheScenesTemplate());

    // Educational templates
    this.register(new MythBusterTemplate());
    this.register(new GuideSnippetTemplate());
    this.register(new ComparisonTemplate());

    // Urgency templates
    this.register(new TrendJackerTemplate());
    this.register(new DeadlineDriverTemplate());
    this.register(new SeasonalTemplate());

    // Authority templates
    this.register(new DataRevelationTemplate());
    this.register(new ExpertRoundupTemplate());
    this.register(new CaseStudyTemplate());

    // Engagement templates
    this.register(new ChallengePostTemplate());
  }

  private register(template: ContentTemplateBase): void {
    this.templates.set(template.metadata.id, template);
  }

  /**
   * Get a template by its ID
   */
  getTemplate(id: TemplateType): ContentTemplateBase | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ContentTemplateBase[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get all template metadata
   */
  getAllMetadata(): TemplateMetadata[] {
    return this.getAllTemplates().map(t => t.metadata);
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): ContentTemplateBase[] {
    return this.getAllTemplates().filter(t => t.metadata.category === category);
  }

  /**
   * Get templates by minimum CTR improvement
   */
  getByMinCtrImprovement(minCtr: number): ContentTemplateBase[] {
    return this.getAllTemplates().filter(t => t.metadata.avgCtrImprovement >= minCtr);
  }

  /**
   * Get templates optimized for a specific platform
   */
  getByPlatform(platform: string): ContentTemplateBase[] {
    return this.getAllTemplates().filter(t =>
      t.metadata.bestFor.some(use => use.toLowerCase().includes(platform.toLowerCase()))
    );
  }

  /**
   * Get templates by use case
   */
  getByUseCase(useCase: string): ContentTemplateBase[] {
    return this.getAllTemplates().filter(t =>
      t.metadata.bestFor.some(use => use.toLowerCase().includes(useCase.toLowerCase()))
    );
  }

  /**
   * Get template count
   */
  getCount(): number {
    return this.templates.size;
  }

  /**
   * Get templates sorted by CTR improvement (highest first)
   */
  getSortedByCtr(): ContentTemplateBase[] {
    return this.getAllTemplates().sort(
      (a, b) => b.metadata.avgCtrImprovement - a.metadata.avgCtrImprovement
    );
  }

  /**
   * Get category summary
   */
  getCategorySummary(): Record<TemplateCategory, number> {
    const summary: Record<string, number> = {};
    this.getAllTemplates().forEach(t => {
      const category = t.metadata.category;
      summary[category] = (summary[category] || 0) + 1;
    });
    return summary as Record<TemplateCategory, number>;
  }

  /**
   * Suggest templates based on content goal
   */
  suggestTemplates(goal: string): ContentTemplateBase[] {
    const goalMap: Record<string, TemplateType[]> = {
      'engagement': ['challenge-post', 'pattern-interrupt', 'curiosity-gap', 'contrarian'],
      'authority': ['data-revelation', 'expert-roundup', 'case-study', 'guide-snippet'],
      'conversion': ['deadline-driver', 'hidden-cost', 'case-study', 'specific-number'],
      'trust': ['transformation', 'failure-to-success', 'behind-the-scenes', 'case-study'],
      'education': ['myth-buster', 'guide-snippet', 'comparison', 'quick-win'],
      'viral': ['pattern-interrupt', 'contrarian', 'trend-jacker', 'challenge-post'],
      'lead-generation': ['curiosity-gap', 'guide-snippet', 'quick-win', 'hidden-cost'],
    };

    const templateIds = goalMap[goal.toLowerCase()] || [];
    return templateIds
      .map(id => this.getTemplate(id))
      .filter((t): t is ContentTemplateBase => t !== undefined);
  }
}

// Export singleton instance
export const templateRegistry = ContentTemplateRegistry.getInstance();

// Export all template classes for direct use
export {
  CuriosityGapTemplate,
  PatternInterruptTemplate,
  SpecificNumberTemplate,
  ContrarianTemplate,
  MistakeExposerTemplate,
  HiddenCostTemplate,
  QuickWinTemplate,
  TransformationTemplate,
  FailureToSuccessTemplate,
  BehindTheScenesTemplate,
  MythBusterTemplate,
  GuideSnippetTemplate,
  ComparisonTemplate,
  TrendJackerTemplate,
  DeadlineDriverTemplate,
  SeasonalTemplate,
  DataRevelationTemplate,
  ExpertRoundupTemplate,
  CaseStudyTemplate,
  ChallengePostTemplate,
};
