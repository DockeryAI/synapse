/**
 * Story Post Generator
 *
 * Generates narrative-driven content using storytelling structures
 * to create emotional connection and memorable insights.
 *
 * Techniques:
 * - Hero's Journey
 * - Before/After transformation
 * - Problem/Solution narrative
 * - Personal anecdote framing
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

export class StoryPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private psychologyEngine: ContentPsychologyEngine;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.psychologyEngine = new ContentPsychologyEngine();
  }

  /**
   * Generate a story-based post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<BreakthroughContent> {
    const startTime = Date.now();

    // 1. Select narrative structure
    const structure = this.selectNarrativeStructure(insight);

    // 2. Generate initial draft using storytelling
    const draft = this.generateDraft(insight, business, structure);

    // 3. Optimize with power words
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // 4. Build complete content object
    const content: BreakthroughContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: 'story-post',

      content: {
        headline: optimized.headline,
        hook: optimized.hook,
        body: optimized.body,
        cta: optimized.cta,
        hashtags: this.generateHashtags(insight, business)
      },

      psychology: {
        principle: 'Narrative Transportation',
        trigger: {
          type: 'empathy',
          strength: 0.85,
          target: 'connection'
        },
        persuasionTechnique: 'Storytelling',
        expectedReaction: 'I relate to this. This is my story too.'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: structure,
        narrativeStructure: this.describeStructure(structure),
        pacing: 'Medium (story-driven)'
      },

      meta: {
        platform: this.selectPlatforms(business),
        tone: 'personal-authentic',
        length: this.calculateLength(optimized.body),
        targetAudience: business.targetMarket.primarySegments[0]?.description || 'business owners'
      },

      prediction: {
        engagementScore: this.predictEngagement(insight, structure),
        viralPotential: this.predictViralPotential(insight, structure),
        leadGeneration: this.predictLeadGeneration(business),
        brandImpact: this.predictBrandImpact(insight),
        confidenceInterval: [0.75, 0.92]
      },

      metadata: {
        generatedAt: new Date(),
        model: 'StoryPostGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };

    return content;
  }

  /**
   * Select the best narrative structure for this insight
   */
  private selectNarrativeStructure(insight: BreakthroughInsight): NarrativeStructure {
    const structureMap: Record<string, NarrativeStructure> = {
      'unexpected_connection': 'discovery',
      'counter_intuitive': 'reversal',
      'predictive_opportunity': 'transformation',
      'deep_psychology': 'revelation',
      'cultural_moment': 'observation',
      'hidden_pattern': 'discovery'
    };

    return structureMap[insight.type] || 'transformation';
  }

  /**
   * Generate draft using storytelling techniques
   */
  private generateDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    structure: NarrativeStructure
  ): ContentDraft {
    const generators: Record<NarrativeStructure, () => ContentDraft> = {
      'transformation': () => this.generateTransformationStory(insight, business),
      'discovery': () => this.generateDiscoveryStory(insight, business),
      'reversal': () => this.generateReversalStory(insight, business),
      'revelation': () => this.generateRevelationStory(insight, business),
      'observation': () => this.generateObservationStory(insight, business)
    };

    return generators[structure]();
  }

  /**
   * Transformation Story: Before → Struggle → Insight → After
   */
  private generateTransformationStory(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `How I Transformed My ${business.industry} Business With One Insight`;

    const hook = `Three years ago, I was stuck. My business was plateauing, and I couldn't figure out why. Then I discovered something that changed everything.`;

    const body = this.buildNarrative([
      {
        beat: 'Before',
        content: `Like most ${business.industry} businesses, I was focused on what everyone else was doing. Following the playbook. Playing it safe.`
      },
      {
        beat: 'Struggle',
        content: `But it wasn't working. Growth had stalled. Customers were unresponsive. Something had to change.`
      },
      {
        beat: 'Discovery',
        content: `Then I discovered this:\n\n${insight.insight}\n\n${insight.whyProfound}`
      },
      {
        beat: 'Action',
        content: `I completely changed my approach. Instead of doing what everyone else was doing, I leaned into this insight.`
      },
      {
        beat: 'Result',
        content: `The transformation was immediate. ${this.generateResult(business)}`
      }
    ]);

    const cta = `Want to apply this insight to your business? Let's talk about what transformation could look like for you.`;

    return { headline, hook, body, cta };
  }

  /**
   * Discovery Story: Question → Search → Find → Meaning
   */
  private generateDiscoveryStory(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `The Hidden Pattern I Discovered in ${business.industry}`;

    const hook = `I've been studying ${business.industry} for years. But I just discovered a pattern that changes everything.`;

    const body = this.buildNarrative([
      {
        beat: 'Question',
        content: `I kept asking myself: why do some ${business.industry} businesses succeed where others fail?`
      },
      {
        beat: 'Investigation',
        content: `I analyzed hundreds of businesses. Talked to customers. Studied the data. And then I saw it.`
      },
      {
        beat: 'Discovery',
        content: `Here's the pattern everyone is missing:\n\n${insight.insight}`
      },
      {
        beat: 'Evidence',
        content: `The evidence is everywhere:\n${insight.evidence.slice(0, 3).map(e => `• ${e}`).join('\n')}`
      },
      {
        beat: 'Meaning',
        content: `This changes how we should think about ${business.industry}. ${insight.whyProfound}`
      }
    ]);

    const cta = `I'm diving deeper into this pattern. Follow for the full breakdown.`;

    return { headline, hook, body, cta };
  }

  /**
   * Reversal Story: Belief → Challenge → Truth → Implication
   */
  private generateReversalStory(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `I Was Wrong About ${business.industry}. Here's What I Learned.`;

    const hook = `For years, I believed the conventional wisdom. It made sense. Everyone agreed. And it was completely wrong.`;

    const body = this.buildNarrative([
      {
        beat: 'Old Belief',
        content: `Like everyone else in ${business.industry}, I believed that success came from following the established playbook.`
      },
      {
        beat: 'Challenge',
        content: `But then I noticed something that didn't fit. A contradiction I couldn't ignore.`
      },
      {
        beat: 'Investigation',
        content: `I dug deeper. Questioned my assumptions. Looked at the data with fresh eyes.`
      },
      {
        beat: 'Truth',
        content: `Here's what I discovered:\n\n${insight.insight}\n\nThe opposite of what I believed was true.`
      },
      {
        beat: 'Implication',
        content: `This means everything changes. ${insight.whyProfound}`
      }
    ]);

    const cta = `If you're still following the old playbook, we should talk. There's a better way.`;

    return { headline, hook, body, cta };
  }

  /**
   * Revelation Story: Hidden → Clues → Reveal → Impact
   */
  private generateRevelationStory(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `What Your Customers Secretly Want (But Won't Tell You)`;

    const hook = `Your customers are telling you something. But they're not using words.`;

    const body = this.buildNarrative([
      {
        beat: 'Hidden',
        content: `Most ${business.industry} businesses listen to what customers say. That's a mistake.`
      },
      {
        beat: 'Behavior',
        content: `Instead, watch what they do. Their behavior reveals the truth they can't articulate.`
      },
      {
        beat: 'Revelation',
        content: `Here's what I discovered:\n\n${insight.insight}\n\nThis is what they really want.`
      },
      {
        beat: 'Psychology',
        content: `Why can't they tell you directly? ${insight.whyProfound}`
      },
      {
        beat: 'Action',
        content: `Once you understand this, you can give them what they actually need—not what they ask for.`
      }
    ]);

    const cta = `Want to decode what your customers really want? Let's analyze their behavior together.`;

    return { headline, hook, body, cta };
  }

  /**
   * Observation Story: Notice → Pattern → Insight → Relevance
   */
  private generateObservationStory(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `What ${this.extractCulturalMoment(insight)} Teaches Us About ${business.industry}`;

    const hook = `I noticed something happening in culture. At first, it seemed unrelated to ${business.industry}. But there's a deeper connection.`;

    const body = this.buildNarrative([
      {
        beat: 'Observation',
        content: `Here's what I'm seeing: ${insight.insight}`
      },
      {
        beat: 'Pattern',
        content: `This isn't random. It's part of a larger cultural shift.`
      },
      {
        beat: 'Connection',
        content: `And here's how it connects to ${business.industry}: ${insight.whyNow}`
      },
      {
        beat: 'Implication',
        content: `${insight.whyProfound}`
      },
      {
        beat: 'Opportunity',
        content: `The businesses that see this connection early will have a massive advantage.`
      }
    ]);

    const cta = `This is just the surface. Want to explore how this cultural moment affects your business? DM me.`;

    return { headline, hook, body, cta };
  }

  /**
   * Build narrative from story beats
   */
  private buildNarrative(beats: StoryBeat[]): string {
    return beats.map(beat => beat.content).join('\n\n');
  }

  /**
   * Describe narrative structure
   */
  private describeStructure(structure: NarrativeStructure): string {
    const descriptions: Record<NarrativeStructure, string> = {
      'transformation': 'Before → Struggle → Insight → After',
      'discovery': 'Question → Search → Find → Meaning',
      'reversal': 'Belief → Challenge → Truth → Implication',
      'revelation': 'Hidden → Clues → Reveal → Impact',
      'observation': 'Notice → Pattern → Insight → Relevance'
    };

    return descriptions[structure];
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string[] {
    const industry = business.industry.toLowerCase().replace(/\s+/g, '');
    return [
      industry,
      'story',
      'business',
      'transformation',
      'insight'
    ];
  }

  /**
   * Select platforms (stories work well on Instagram and LinkedIn)
   */
  private selectPlatforms(business: BusinessProfile): string[] {
    return ['LinkedIn', 'Instagram'];
  }

  /**
   * Calculate content length
   */
  private calculateLength(body: string): number {
    return body.length;
  }

  /**
   * Predict engagement (stories have high engagement due to emotional connection)
   */
  private predictEngagement(
    insight: BreakthroughInsight,
    structure: NarrativeStructure
  ): number {
    let score = 0.8; // Base score for storytelling

    // Transformation stories are highly engaging
    if (structure === 'transformation') {
      score += 0.1;
    }

    // Boost for high confidence insights
    score += insight.confidence * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Predict viral potential (personal stories are highly shareable)
   */
  private predictViralPotential(
    insight: BreakthroughInsight,
    structure: NarrativeStructure
  ): number {
    let score = 0.75; // Base score for stories

    // Reversal stories have high viral potential (mind-changing)
    if (structure === 'reversal') {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict lead generation (authentic stories build trust)
   */
  private predictLeadGeneration(business: BusinessProfile): number {
    return 0.75; // Stories build strong connections
  }

  /**
   * Predict brand impact (stories are memorable)
   */
  private predictBrandImpact(insight: BreakthroughInsight): number {
    return 0.85 + (insight.confidence * 0.1);
  }

  // Utility methods
  private extractCulturalMoment(insight: BreakthroughInsight): string {
    // Extract cultural reference from insight
    const text = insight.insight;
    const words = text.split(' ');
    return words.slice(0, 5).join(' ');
  }

  private generateResult(business: BusinessProfile): string {
    return `Engagement doubled. Leads increased by 40%. And customers finally understood what made us different.`;
  }
}

type NarrativeStructure =
  | 'transformation'
  | 'discovery'
  | 'reversal'
  | 'revelation'
  | 'observation';

interface StoryBeat {
  beat: string;
  content: string;
}
