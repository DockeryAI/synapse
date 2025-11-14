/**
 * Data Post Generator
 *
 * Generates data-driven, authority-building content using statistics,
 * research, and evidence-based arguments.
 *
 * Techniques:
 * - Stat-driven hooks
 * - Research citations
 * - Data visualization descriptions
 * - Expert positioning
 *
 * Created: 2025-11-10
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type { BusinessProfile } from '@/types/deepContext.types';
import type {
  ContentDraft,
  BreakthroughContent
} from '@/types/breakthroughContent.types';
import { PowerWordOptimizer } from '../PowerWordOptimizer';
import { ContentPsychologyEngine } from '../ContentPsychologyEngine';

export class DataPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private psychologyEngine: ContentPsychologyEngine;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.psychologyEngine = new ContentPsychologyEngine();
  }

  /**
   * Generate a data-driven post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<BreakthroughContent> {
    const startTime = Date.now();

    // 1. Select data presentation format
    const format = this.selectDataFormat(insight);

    // 2. Generate initial draft using data-driven techniques
    const draft = this.generateDraft(insight, business, format);

    // 3. Optimize with power words (light touch for data posts)
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // 4. Build complete content object
    const content: BreakthroughContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: 'data-post',

      content: {
        headline: optimized.headline,
        hook: optimized.hook,
        body: optimized.body,
        cta: optimized.cta,
        hashtags: this.generateHashtags(insight, business)
      },

      psychology: {
        principle: 'Social Proof + Authority',
        trigger: {
          type: 'trust',
          strength: 0.9,
          target: 'credibility'
        },
        persuasionTechnique: 'Data-Driven Authority',
        expectedReaction: 'This person knows what they\'re talking about. I trust this data.'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: format,
        narrativeStructure: this.describeStructure(format),
        pacing: 'Medium-Fast (data-driven)'
      },

      meta: {
        platform: this.selectPlatforms(business),
        tone: 'professional-authoritative',
        length: this.calculateLength(optimized.body),
        targetAudience: business.targetMarket.primarySegments[0]?.description || 'business owners'
      },

      prediction: {
        engagementScore: this.predictEngagement(insight),
        viralPotential: this.predictViralPotential(insight),
        leadGeneration: this.predictLeadGeneration(business),
        brandImpact: this.predictBrandImpact(insight),
        confidenceInterval: [0.8, 0.95]
      },

      metadata: {
        generatedAt: new Date(),
        model: 'DataPostGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };

    return content;
  }

  /**
   * Select the best data presentation format
   */
  private selectDataFormat(insight: BreakthroughInsight): DataFormat {
    // Match format to insight type
    const formatMap: Record<string, DataFormat> = {
      'unexpected_connection': 'research-finding',
      'counter_intuitive': 'myth-vs-reality',
      'predictive_opportunity': 'trend-analysis',
      'deep_psychology': 'behavioral-study',
      'hidden_pattern': 'data-analysis',
      'strategic_implication': 'case-study'
    };

    return formatMap[insight.type] || 'stat-driven';
  }

  /**
   * Generate draft using data-driven techniques
   */
  private generateDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    format: DataFormat
  ): ContentDraft {
    const generators: Record<DataFormat, () => ContentDraft> = {
      'stat-driven': () => this.generateStatDriven(insight, business),
      'research-finding': () => this.generateResearchFinding(insight, business),
      'trend-analysis': () => this.generateTrendAnalysis(insight, business),
      'myth-vs-reality': () => this.generateMythVsReality(insight, business),
      'case-study': () => this.generateCaseStudy(insight, business),
      'data-analysis': () => this.generateDataAnalysis(insight, business),
      'behavioral-study': () => this.generateBehavioralStudy(insight, business)
    };

    return generators[format]();
  }

  /**
   * Stat-Driven Format: Number → Context → Implication
   */
  private generateStatDriven(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = this.extractStatFromInsight(insight);

    const hook = `That number should terrify you. Or excite you. Depending on what you do next.`;

    const body = this.buildDataNarrative([
      {
        section: 'Context',
        content: `Here's what that means for ${business.industry}:`
      },
      {
        section: 'Breakdown',
        content: insight.insight
      },
      {
        section: 'Evidence',
        content: `The data is clear:\n${insight.evidence.slice(0, 3).map(e => `• ${e}`).join('\n')}`
      },
      {
        section: 'Implication',
        content: `Why this matters:\n\n${insight.whyProfound}`
      },
      {
        section: 'Timing',
        content: `Why now: ${insight.whyNow}`
      }
    ]);

    const cta = `Want to dive deeper into the data? I've built a comprehensive analysis. DM for details.`;

    return { headline, hook, body, cta };
  }

  /**
   * Research Finding Format: Study → Method → Results → Application
   */
  private generateResearchFinding(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `New Research Reveals ${this.extractFinding(insight)}`;

    const hook = `I just analyzed ${this.generateResearchScope(business)} and found something unexpected.`;

    const body = this.buildDataNarrative([
      {
        section: 'Question',
        content: `I wanted to understand: ${this.extractQuestion(insight)}`
      },
      {
        section: 'Method',
        content: `Research approach:\n• Analyzed ${this.generateSampleSize()}\n• Studied patterns over ${this.generateTimeframe()}\n• Controlled for ${this.generateVariables(business)}`
      },
      {
        section: 'Finding',
        content: `Here's what I discovered:\n\n${insight.insight}`
      },
      {
        section: 'Evidence',
        content: `Supporting data:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        section: 'Application',
        content: `What this means for your ${business.industry} business:\n\n${insight.whyProfound}`
      }
    ]);

    const cta = `I'm publishing the full research report next week. Follow to get it first.`;

    return { headline, hook, body, cta };
  }

  /**
   * Trend Analysis Format: Trend → Data → Prediction → Preparation
   */
  private generateTrendAnalysis(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `The ${business.industry} Trend Everyone's Missing (Data Inside)`;

    const hook = `I've been tracking ${business.industry} data for years. This trend is accelerating. And most businesses are completely unprepared.`;

    const body = this.buildDataNarrative([
      {
        section: 'Trend',
        content: `What's happening:\n\n${insight.insight}`
      },
      {
        section: 'Data Points',
        content: `Key indicators:\n${insight.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
      },
      {
        section: 'Trajectory',
        content: `Where this is going: ${insight.whyNow}`
      },
      {
        section: 'Impact',
        content: `Business impact:\n\n${insight.whyProfound}`
      },
      {
        section: 'Preparation',
        content: `Smart businesses are already adapting. Here's what they're doing: ${insight.contentAngle}`
      }
    ]);

    const cta = `Want a personalized trend report for your business? Let's analyze your position.`;

    return { headline, hook, body, cta };
  }

  /**
   * Myth vs Reality Format: Common Belief → Data → Truth
   */
  private generateMythVsReality(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `Data Destroys The Biggest Myth in ${business.industry}`;

    const hook = `Everyone believes this. The data says otherwise.`;

    const body = this.buildDataNarrative([
      {
        section: 'Myth',
        content: `The conventional wisdom: "${this.extractConventionalWisdom(insight)}"`
      },
      {
        section: 'Data',
        content: `But here's what the data actually shows:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        section: 'Reality',
        content: `The truth:\n\n${insight.insight}`
      },
      {
        section: 'Why',
        content: `Why everyone gets this wrong: ${insight.whyProfound}`
      },
      {
        section: 'Action',
        content: `What to do instead: ${insight.contentAngle}`
      }
    ]);

    const cta = `Still following the old playbook? Let's talk about what the data says you should do instead.`;

    return { headline, hook, body, cta };
  }

  /**
   * Case Study Format: Challenge → Approach → Results → Lessons
   */
  private generateCaseStudy(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `Case Study: How This ${business.industry} Business ${this.extractResult(insight)}`;

    const hook = `I love a good case study. This one has a surprising twist.`;

    const body = this.buildDataNarrative([
      {
        section: 'Challenge',
        content: `The problem: Most ${business.industry} businesses struggle with ${this.extractProblem(insight)}`
      },
      {
        section: 'Approach',
        content: `The unconventional solution:\n\n${insight.insight}`
      },
      {
        section: 'Results',
        content: `The data:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        section: 'Key Insight',
        content: `Why it worked: ${insight.whyProfound}`
      },
      {
        section: 'Application',
        content: `How to apply this: ${insight.contentAngle}`
      }
    ]);

    const cta = `Want a custom case study for your business? Let's identify your breakthrough opportunity.`;

    return { headline, hook, body, cta };
  }

  /**
   * Data Analysis Format: Dataset → Pattern → Insight
   */
  private generateDataAnalysis(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `I Analyzed ${this.generateDatasetSize()} ${business.industry} Businesses. Here's What I Found.`;

    const hook = `The pattern was hidden in plain sight. Once you see it, you can't unsee it.`;

    const body = this.buildDataNarrative([
      {
        section: 'Dataset',
        content: `What I analyzed:\n• ${this.generateSampleSize()}\n• ${this.generateTimeframe()}\n• ${this.generateMetrics()}`
      },
      {
        section: 'Pattern',
        content: `The hidden pattern:\n\n${insight.insight}`
      },
      {
        section: 'Evidence',
        content: `Supporting data:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        section: 'Significance',
        content: `Why this matters: ${insight.whyProfound}`
      }
    ]);

    const cta = `I'm releasing the full data analysis next week. Follow for insights backed by real numbers.`;

    return { headline, hook, body, cta };
  }

  /**
   * Behavioral Study Format: Behavior → Data → Psychology
   */
  private generateBehavioralStudy(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `Study: What ${this.generateAudienceSize()} Customers Revealed About ${business.industry}`;

    const hook = `I studied customer behavior for 6 months. What I discovered changes everything.`;

    const body = this.buildDataNarrative([
      {
        section: 'Study',
        content: `Research parameters:\n• ${this.generateAudienceSize()} customers\n• ${this.generateTimeframe()}\n• ${this.generateBehaviors()} tracked`
      },
      {
        section: 'Findings',
        content: insight.evidence.map((e, i) => `Finding ${i + 1}: ${e}`).join('\n\n')
      },
      {
        section: 'Core Insight',
        content: `The key insight:\n\n${insight.insight}`
      },
      {
        section: 'Psychology',
        content: `The psychological explanation: ${insight.whyProfound}`
      }
    ]);

    const cta = `Want to understand your customers at this level? Let's analyze your audience data.`;

    return { headline, hook, body, cta };
  }

  /**
   * Build data narrative from sections
   */
  private buildDataNarrative(sections: DataSection[]): string {
    return sections.map(section => {
      if (section.section) {
        return `**${section.section}**\n${section.content}`;
      }
      return section.content;
    }).join('\n\n');
  }

  /**
   * Describe narrative structure
   */
  private describeStructure(format: DataFormat): string {
    const descriptions: Record<DataFormat, string> = {
      'stat-driven': 'Number → Context → Implication',
      'research-finding': 'Study → Method → Results → Application',
      'trend-analysis': 'Trend → Data → Prediction → Preparation',
      'myth-vs-reality': 'Myth → Data → Reality',
      'case-study': 'Challenge → Approach → Results → Lessons',
      'data-analysis': 'Dataset → Pattern → Insight',
      'behavioral-study': 'Behavior → Data → Psychology'
    };

    return descriptions[format];
  }

  /**
   * Generate hashtags (authority-focused)
   */
  private generateHashtags(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string[] {
    const industry = business.industry.toLowerCase().replace(/\s+/g, '');
    return [
      industry,
      'data',
      'research',
      'insights',
      'business'
    ];
  }

  /**
   * Select platforms (data posts work best on LinkedIn)
   */
  private selectPlatforms(business: BusinessProfile): string[] {
    return ['LinkedIn', 'Twitter'];
  }

  /**
   * Calculate content length
   */
  private calculateLength(body: string): number {
    return body.length;
  }

  /**
   * Predict engagement (data posts build authority)
   */
  private predictEngagement(insight: BreakthroughInsight): number {
    return 0.75 + (insight.confidence * 0.15);
  }

  /**
   * Predict viral potential (surprising data can go viral)
   */
  private predictViralPotential(insight: BreakthroughInsight): number {
    let score = 0.65;

    // Counter-intuitive data has higher viral potential
    if (insight.type === 'counter_intuitive') {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict lead generation (data builds trust and authority)
   */
  private predictLeadGeneration(business: BusinessProfile): number {
    return 0.85; // Data-driven content is excellent for B2B lead gen
  }

  /**
   * Predict brand impact (authority positioning)
   */
  private predictBrandImpact(insight: BreakthroughInsight): number {
    return 0.9; // Data posts strongly build authority
  }

  // Utility methods for data generation
  private extractStatFromInsight(insight: BreakthroughInsight): string {
    // Extract or generate a compelling stat
    const stats = ['73%', '8 out of 10', '2.5x', '94%', '5x more likely'];
    return `${stats[Math.floor(Math.random() * stats.length)]} of ${insight.insight.split(' ').slice(0, 8).join(' ')}`;
  }

  private extractFinding(insight: BreakthroughInsight): string {
    return insight.insight.split('.')[0];
  }

  private extractQuestion(insight: BreakthroughInsight): string {
    return `What drives success in ${insight.insight.split(' ').slice(0, 5).join(' ')}?`;
  }

  private extractConventionalWisdom(insight: BreakthroughInsight): string {
    return `Traditional approaches to ${insight.insight.split(' ').slice(0, 5).join(' ')} are the best path`;
  }

  private extractResult(insight: BreakthroughInsight): string {
    return '3x\'d Revenue in 6 Months';
  }

  private extractProblem(insight: BreakthroughInsight): string {
    return insight.insight.split(' ').slice(0, 8).join(' ');
  }

  private generateResearchScope(business: BusinessProfile): string {
    return `${Math.floor(Math.random() * 500 + 200)} ${business.industry} businesses`;
  }

  private generateSampleSize(): string {
    const sizes = ['500+ businesses', '1,000+ customer interactions', '10,000+ data points'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private generateTimeframe(): string {
    const frames = ['6 months', '12 months', '2 years', '3 years'];
    return frames[Math.floor(Math.random() * frames.length)];
  }

  private generateVariables(business: BusinessProfile): string {
    return `industry variables, market conditions, and ${business.industry}-specific factors`;
  }

  private generateDatasetSize(): string {
    const sizes = ['500+', '1,000+', '2,500+'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private generateAudienceSize(): string {
    const sizes = ['1,000+', '2,500+', '5,000+'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private generateMetrics(): string {
    return 'Revenue, engagement, conversion rates, and customer satisfaction metrics';
  }

  private generateBehaviors(): string {
    return '15+ key behaviors';
  }
}

type DataFormat =
  | 'stat-driven'
  | 'research-finding'
  | 'trend-analysis'
  | 'myth-vs-reality'
  | 'case-study'
  | 'data-analysis'
  | 'behavioral-study';

interface DataSection {
  section?: string;
  content: string;
}
