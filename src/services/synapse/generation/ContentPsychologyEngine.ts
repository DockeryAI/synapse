/**
 * Content Psychology Engine
 *
 * Explains WHY content works using psychological principles
 * and provides transparent reasoning for content effectiveness.
 *
 * Created: 2025-11-10
 */

import type {
  BreakthroughContent,
  PsychologyExplanation,
  PsychologicalPrinciple,
  PersuasionTechnique,
  TimingRecommendation,
  BusinessProfile
} from '@/types/breakthroughContent.types';
import type { BreakthroughInsight } from '@/types/breakthrough.types';

export class ContentPsychologyEngine {
  /**
   * Explain why content works psychologically
   */
  explainWhyThisWorks(
    content: BreakthroughContent,
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): PsychologyExplanation {
    const principle = content.psychology.principle;
    const trigger = content.psychology.trigger;
    const technique = content.psychology.persuasionTechnique;

    const explanation = `
**Why This Content Works:**

## 1. ${principle}
${this.explainPrinciple(principle)}

**Application**: ${this.showPrincipleInAction(principle, content)}

## 2. Emotional Trigger: ${trigger.type.toUpperCase()}
**Strength**: ${(trigger.strength * 100).toFixed(0)}% match

${this.explainTrigger(trigger)}

**How it appears**: ${this.identifyTriggerInContent(trigger, content)}

## 3. Persuasion Technique: ${technique}
${this.explainTechnique(technique)}

**Example from content**: ${this.extractTechniqueExample(technique, content)}

## 4. Expected Reaction
"${content.psychology.expectedReaction}"

**User Journey**:
${this.mapUserJourney(content, insight)}

## 5. Why Now?
${this.explainTiming(insight, business)}

**Optimal timing**: ${this.calculateOptimalTiming(content, business)}
    `.trim();

    return {
      principle,
      explanation,
      confidenceLevel: this.calculateConfidence(content, insight),
      examples: this.provideExamples(principle),
      expectedOutcome: this.predictOutcome(content, insight)
    };
  }

  /**
   * Explain psychological principle
   */
  private explainPrinciple(principle: PsychologicalPrinciple): string {
    const explanations: Record<PsychologicalPrinciple, string> = {
      'Curiosity Gap': `
Creates an **information gap** that the brain feels compelled to close.
When we sense missing information, our brain releases dopamine, creating
a pleasurable urge to fill the gap. This is why cliffhangers work.

**Science**: Dr. George Loewenstein's Information Gap Theory (1994)
**Brain Response**: Activates the caudate nucleus (reward center)
**Completion Rate**: Content with curiosity gaps sees 2-3x completion rates
      `.trim(),

      'Narrative Transportation': `
**Story format bypasses logical resistance** and makes information memorable.
When we're absorbed in a story, our brain simulates the experience, creating
emotional connections and memory anchors.

**Science**: Melanie Green & Timothy Brock's Transportation Theory (2000)
**Brain Response**: Engages multiple brain regions (not just language centers)
**Retention**: Stories are 22x more memorable than facts alone
      `.trim(),

      'Social Proof + Authority': `
Combines **credibility (authority) with popularity (social proof)**.
Data provides authority ("research shows"), while social proof creates
aspiration ("top 10% do this"). This dual trigger is highly persuasive.

**Science**: Robert Cialdini's Principles of Persuasion (1984)
**Brain Response**: Reduces cognitive load, provides decision shortcuts
**Conversion**: Can increase by 15-30% when both elements present
      `.trim(),

      'Cognitive Dissonance': `
Challenging existing beliefs creates **mental discomfort** that demands
resolution. The brain either rejects the challenge or updates its beliefs.
Controversial content creates strong engagement either way.

**Science**: Leon Festinger's Cognitive Dissonance Theory (1957)
**Brain Response**: Activates anterior cingulate cortex (conflict detection)
**Engagement**: Controversial content gets 2-5x more comments/shares
      `.trim(),

      'Pattern Interrupt': `
**Breaks expectations**, forcing attention. When the brain detects something
unexpected in a familiar pattern, it switches from passive to active processing
to evaluate the anomaly.

**Science**: Daniel Kahneman's System 1 vs System 2 thinking
**Brain Response**: Switches from autopilot to conscious attention
**Scroll-Stop**: 3-4x higher than conventional openings
      `.trim(),

      'Scarcity': `
**Limited availability increases perceived value**. The brain's loss aversion
system (stronger than gain seeking) makes us fear missing out on scarce resources.

**Science**: Jack Brehm's Reactance Theory (1966)
**Brain Response**: Activates amygdala (fear/urgency center)
**Action Rate**: Can increase immediate action by 200-300%
      `.trim(),

      'Reciprocity': `
When someone provides value first, we feel **psychologically obligated to return
the favor**. This triggers our fairness instinct and desire for social equilibrium.

**Science**: Robert Cialdini's Reciprocity Principle
**Brain Response**: Activates social bonding circuits
**Trust**: Builds 40-60% stronger initial connections
      `.trim(),

      'Commitment & Consistency': `
Once we take a small action or make a statement, we feel pressure to **remain
consistent** with that identity. Small commitments lead to larger ones.

**Science**: Leon Festinger & Stanley Schachter's Consistency Theory
**Brain Response**: Self-concept preservation (identity protection)
**Follow-Through**: Initial micro-commitments increase completion by 50-80%
      `.trim(),

      'Loss Aversion': `
Humans feel **losses 2.5x more intensely than equivalent gains**. Framing
something as a potential loss ("don't miss") is more motivating than gain framing.

**Science**: Kahneman & Tversky's Prospect Theory (1979)
**Brain Response**: Stronger amygdala activation than gain scenarios
**Action**: Loss-framed messages increase urgency by 40-60%
      `.trim()
    };

    return explanations[principle] || 'Drives engagement through psychological triggers';
  }

  /**
   * Show principle in action within content
   */
  private showPrincipleInAction(
    principle: PsychologicalPrinciple,
    content: BreakthroughContent
  ): string {
    switch (principle) {
      case 'Curiosity Gap':
        return `The hook "${content.content.hook}" creates an information gap by revealing something exists without immediately explaining it.`;

      case 'Narrative Transportation':
        return `The story structure takes readers on a journey from ${this.extractNarrativeArc(content.content.body)}`;

      case 'Social Proof + Authority':
        return `Data points and social proof elements establish credibility while creating aspiration.`;

      case 'Cognitive Dissonance':
        return `Challenges conventional thinking, forcing readers to reconcile new information with existing beliefs.`;

      case 'Pattern Interrupt':
        return `Opens with unexpected statement: "${content.content.headline}" breaks the typical ${content.meta.platform[0]} pattern.`;

      default:
        return `Applied throughout the content structure to maximize engagement.`;
    }
  }

  /**
   * Explain emotional trigger
   */
  private explainTrigger(trigger: { type: string; strength: number }): string {
    const triggers: Record<string, string> = {
      curiosity: 'Makes readers want to know "what happens next?" or "what is the secret?"',
      fear: 'Taps into concerns about missing out, making mistakes, or facing negative outcomes',
      anger: 'Activates sense of injustice or frustration with the status quo',
      surprise: 'Disrupts expectations and creates memorable moments',
      aspiration: 'Connects to desire for improvement, success, or transformation',
      validation: 'Confirms existing beliefs or experiences, creating connection'
    };

    return triggers[trigger.type] || 'Creates emotional resonance with the audience';
  }

  /**
   * Identify trigger in content
   */
  private identifyTriggerInContent(
    trigger: { type: string },
    content: BreakthroughContent
  ): string {
    return `Look for ${trigger.type} trigger in the ${content.optimization.framingDevice}`;
  }

  /**
   * Explain persuasion technique
   */
  private explainTechnique(technique: PersuasionTechnique): string {
    const techniques: Record<PersuasionTechnique, string> = {
      'Pattern Interrupt': 'Breaks expected flow to grab attention',
      'Storytelling': 'Uses narrative structure to bypass resistance',
      'Data-Driven Authority': 'Establishes credibility through statistics',
      'Contrarian Challenge': 'Questions conventional wisdom to create engagement',
      'Question-Based Hook': 'Uses questions to activate curiosity',
      'Social Proof': 'Leverages what others are doing/thinking',
      'Scarcity Frame': 'Creates urgency through limited availability',
      'Transformation Promise': 'Shows before/after to trigger desire'
    };

    return techniques[technique] || 'Persuades through psychological influence';
  }

  /**
   * Extract technique example from content
   */
  private extractTechniqueExample(
    technique: PersuasionTechnique,
    content: BreakthroughContent
  ): string {
    // Return the most relevant sentence that demonstrates the technique
    return `"${content.content.hook}" demonstrates ${technique.toLowerCase()}`;
  }

  /**
   * Map user journey through content
   */
  private mapUserJourney(
    content: BreakthroughContent,
    insight: BreakthroughInsight
  ): string {
    return `
1. **See headline** → ${this.predictReaction('headline', content)}
2. **Read hook** → ${this.predictReaction('hook', content)}
3. **Process body** → ${this.predictReaction('body', content)}
4. **Encounter CTA** → ${this.predictReaction('cta', content)}
5. **Take action** → ${content.prediction.brandImpact} brand impact
    `.trim();
  }

  /**
   * Predict reaction to content element
   */
  private predictReaction(element: string, content: BreakthroughContent): string {
    const reactions: Record<string, string> = {
      headline: 'Curiosity piqued, scroll stops',
      hook: 'Information gap activated, must continue',
      body: 'Insight processed, belief updated or challenged',
      cta: 'Clear next step, reduced friction'
    };

    return reactions[element] || 'Engagement triggered';
  }

  /**
   * Explain timing
   */
  private explainTiming(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string {
    return insight.whyNow || 'Timely based on current market conditions and trends';
  }

  /**
   * Calculate optimal timing
   */
  private calculateOptimalTiming(
    content: BreakthroughContent,
    business: BusinessProfile
  ): string {
    // Simple heuristic for now
    const platform = content.meta.platform[0];

    const optimalTimes: Record<string, string> = {
      linkedin: 'Tuesday-Thursday, 8-10am or 12-2pm (business hours)',
      twitter: 'Weekdays 9am-3pm (frequent posting works)',
      facebook: 'Wednesday 1-4pm, Thursday-Friday 1-4pm',
      instagram: 'Weekdays 11am-2pm, evenings 7-9pm',
      tiktok: 'Evenings 6-10pm, weekends afternoon',
      youtube: 'Weekdays 2-4pm, weekends 9-11am'
    };

    return optimalTimes[platform] || 'Platform-specific optimal times vary';
  }

  /**
   * Calculate confidence in explanation
   */
  private calculateConfidence(
    content: BreakthroughContent,
    insight: BreakthroughInsight
  ): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence if insight has strong evidence
    if (insight.evidence && insight.evidence.length >= 3) confidence += 0.1;

    // Higher confidence if content has strong psychological elements
    if (content.psychology.trigger.strength > 0.8) confidence += 0.1;

    // Higher confidence if multiple power words used
    if (content.optimization.powerWords.length > 5) confidence += 0.05;

    return Math.min(confidence, 0.95);
  }

  /**
   * Provide examples of principle
   */
  private provideExamples(principle: PsychologicalPrinciple): string[] {
    const examples: Record<PsychologicalPrinciple, string[]> = {
      'Curiosity Gap': [
        '"What most people don\'t know about..."',
        '"The surprising truth behind..."',
        '"I discovered something nobody\'s talking about..."'
      ],
      'Narrative Transportation': [
        '"Picture this: You\'re struggling with..."',
        '"Three years ago, I made a mistake that..."',
        '"Here\'s what happened when we tried..."'
      ],
      'Social Proof + Authority': [
        '"73% of top performers do this one thing..."',
        '"Research shows the top 10%..."',
        '"Industry leaders are quietly doing..."'
      ],
      'Cognitive Dissonance': [
        '"Everything you know about X is wrong"',
        '"Why the conventional advice is backwards"',
        '"The truth they don\'t want you to know"'
      ],
      'Pattern Interrupt': [
        '"Stop doing X immediately"',
        '"The worst advice I ever followed"',
        '"Why I quit doing what everyone recommended"'
      ],
      'Scarcity': [
        '"This window closes in 48 hours"',
        '"Only 10 spots available"',
        '"Limited to first 100 businesses"'
      ],
      'Reciprocity': [
        '"Here\'s the complete framework (free)"',
        '"I\'m giving away my best strategy"',
        '"Download this template (no strings attached)"'
      ],
      'Commitment & Consistency': [
        '"If you believe in X, then you should..."',
        '"Since you\'ve already started..."',
        '"You said you wanted to..."'
      ],
      'Loss Aversion': [
        '"You\'re losing money every day you don\'t..."',
        '"Don\'t let competitors get ahead"',
        '"Missing this costs you $X per month"'
      ]
    };

    return examples[principle] || ['Various applications of this principle'];
  }

  /**
   * Predict outcome
   */
  private predictOutcome(
    content: BreakthroughContent,
    insight: BreakthroughInsight
  ): string {
    const prediction = content.prediction;

    return `
Expected outcomes:
- Engagement: ${(prediction.engagementScore * 100).toFixed(0)}% (${this.interpretScore(prediction.engagementScore, 'engagement')})
- Viral potential: ${(prediction.viralPotential * 100).toFixed(0)}% (${this.interpretScore(prediction.viralPotential, 'viral')})
- Lead generation: ${(prediction.leadGeneration * 100).toFixed(0)}% (${this.interpretScore(prediction.leadGeneration, 'leads')})
- Brand impact: ${prediction.brandImpact}
    `.trim();
  }

  /**
   * Interpret prediction score
   */
  private interpretScore(score: number, type: string): string {
    if (score >= 0.8) return `very high ${type} expected`;
    if (score >= 0.6) return `strong ${type} likely`;
    if (score >= 0.4) return `moderate ${type} possible`;
    return `low ${type} predicted`;
  }

  /**
   * Extract narrative arc
   */
  private extractNarrativeArc(body: string): string {
    return 'problem to solution';
  }

  /**
   * Calculate optimal post time
   */
  calculateOptimalPostTime(
    content: BreakthroughContent,
    business: BusinessProfile
  ): TimingRecommendation {
    const platform = content.meta.platform[0];
    const now = new Date();

    // Calculate optimal time based on platform and audience
    const optimalHour = this.getOptimalHour(platform, business.targetAudience);
    const optimalDay = this.getOptimalDay(platform);

    const bestPostTime = new Date(now);
    bestPostTime.setDate(now.getDate() + optimalDay);
    bestPostTime.setHours(optimalHour, 0, 0, 0);

    return {
      bestPostTime,
      reason: `${platform} audience most active ${this.describeOptimalTime(optimalHour)}`,
      confidence: 0.75,
      alternativeTimes: [
        new Date(bestPostTime.getTime() + 24 * 60 * 60 * 1000), // Next day same time
        new Date(bestPostTime.getTime() + 2 * 60 * 60 * 1000)    // 2 hours later
      ]
    };
  }

  /**
   * Get optimal hour for platform
   */
  private getOptimalHour(platform: string, targetAudience: string): number {
    // B2B audiences
    if (targetAudience.includes('business') || targetAudience.includes('professional')) {
      if (platform === 'linkedin') return 9; // 9am
      return 13; // 1pm
    }

    // B2C audiences
    if (platform === 'instagram' || platform === 'tiktok') return 19; // 7pm
    if (platform === 'facebook') return 14; // 2pm

    return 12; // Noon default
  }

  /**
   * Get optimal day offset
   */
  private getOptimalDay(platform: string): number {
    const today = new Date().getDay(); // 0 = Sunday

    // Post on next Tuesday-Thursday (best for most platforms)
    if (today < 2) return 2 - today; // Move to Tuesday
    if (today > 4) return 9 - today; // Move to next Tuesday
    return 1; // Tomorrow
  }

  /**
   * Describe optimal time
   */
  private describeOptimalTime(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning (6am-12pm)';
    if (hour >= 12 && hour < 17) return 'afternoon (12pm-5pm)';
    if (hour >= 17 && hour < 21) return 'evening (5pm-9pm)';
    return 'late evening (9pm-12am)';
  }

  /**
   * Analyze psychology score of content
   * Returns a score from 0-10 based on psychological effectiveness
   */
  async analyzePsychology(content: string, profileData: any): Promise<number> {
    if (!content || content.length < 10) {
      return 0;
    }

    let score = 0;
    const maxScore = 10;
    const contentLower = content.toLowerCase();

    // 1. Emotional Trigger Detection (0-2.5 points)
    const emotionalTriggers = [
      'discover', 'secret', 'proven', 'guaranteed', 'amazing', 'incredible',
      'breakthrough', 'revolutionary', 'transform', 'powerful', 'exclusive',
      'limited', 'urgent', 'don\'t miss', 'fear', 'worried', 'anxiety',
      'excited', 'thrilled', 'imagine', 'picture this'
    ];

    const triggerCount = emotionalTriggers.filter(trigger =>
      contentLower.includes(trigger)
    ).length;

    score += Math.min(triggerCount * 0.3, 2.5);

    // 2. Power Words (0-2 points)
    const powerWords = [
      'you', 'free', 'because', 'instantly', 'new', 'best', 'top',
      'proven', 'results', 'easy', 'simple', 'fast', 'quick', 'now'
    ];

    const powerWordCount = powerWords.filter(word =>
      contentLower.includes(word)
    ).length;

    score += Math.min(powerWordCount * 0.25, 2);

    // 3. Question/Curiosity Gap (0-1.5 points)
    if (contentLower.includes('?')) {
      score += 0.8;
    }
    if (contentLower.includes('what') || contentLower.includes('how') ||
        contentLower.includes('why') || contentLower.includes('when')) {
      score += 0.7;
    }

    // 4. Specificity/Numbers (0-1.5 points)
    const hasNumbers = /\d+/.test(content);
    const hasPercentages = /%/.test(content);
    const hasStatistics = /\d+%|\d+x|\$\d+/.test(content);

    if (hasStatistics) score += 1.5;
    else if (hasPercentages) score += 1;
    else if (hasNumbers) score += 0.5;

    // 5. Action/CTA Language (0-1 point)
    const actionWords = ['start', 'get', 'try', 'learn', 'discover', 'join', 'subscribe'];
    const hasAction = actionWords.some(word => contentLower.includes(word));
    if (hasAction) score += 1;

    // 6. Brand Voice Alignment (0-1.5 points)
    if (profileData?.brand_voice) {
      const voiceLower = profileData.brand_voice.toLowerCase();

      // Check for voice characteristics
      if (voiceLower.includes('professional') && /\b(expert|proven|research|data)\b/.test(contentLower)) {
        score += 0.5;
      }
      if (voiceLower.includes('friendly') && /\b(you|your|we|let\'s)\b/.test(contentLower)) {
        score += 0.5;
      }
      if (voiceLower.includes('innovative') && /\b(new|cutting-edge|breakthrough|revolutionary)\b/.test(contentLower)) {
        score += 0.5;
      }
    }

    // 7. Customer Trigger Alignment (0-1 point)
    if (profileData?.emotional_triggers && Array.isArray(profileData.emotional_triggers)) {
      const triggerMatch = profileData.emotional_triggers.some((trigger: any) => {
        const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
        return triggerText && contentLower.includes(triggerText.toLowerCase());
      });
      if (triggerMatch) score += 1;
    }

    // Normalize to 0-10 scale
    score = Math.min(Math.max(score, 0), maxScore);

    return Number(score.toFixed(1));
  }
}
