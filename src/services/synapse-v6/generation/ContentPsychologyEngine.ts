// PRD Feature: SYNAPSE-V6
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
   * Explain psychological trigger (V1 psychology principles, NOT emotions)
   * Maps to Cialdini's principles + cognitive psychology
   */
  private explainTrigger(trigger: { type: string; strength: number }): string {
    // V1 Psychology Principles - NOT emotion labels
    const principles: Record<string, string> = {
      // Cialdini's 6 Principles
      'social_proof': 'Leverages "others like me are doing this" to reduce decision uncertainty',
      'authority': 'Establishes credibility through expertise, data, or recognized sources',
      'scarcity': 'Creates urgency through limited availability or time-sensitive opportunity',
      'reciprocity': 'Triggers obligation by providing value first',
      'commitment': 'Uses small agreements to build toward larger action',
      'liking': 'Creates connection through relatability and shared values',

      // Cognitive Psychology Principles
      'curiosity_gap': 'Creates information gap that the brain feels compelled to close',
      'pattern_interrupt': 'Breaks expected flow, switching from autopilot to active attention',
      'loss_aversion': 'Frames potential loss (2.5x stronger than equivalent gain)',
      'cognitive_dissonance': 'Challenges existing beliefs, creating mental tension that demands resolution',
      'narrative_transportation': 'Uses story structure to bypass logical resistance'
    };

    return principles[trigger.type] || 'Activates psychological principle for engagement';
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

  /**
   * Analyze VoC insight against all 9 psychology principles
   * Returns scored analysis with explanations
   */
  analyzeVoCInsight(insight: VoCInsight): PsychologyPrincipleAnalysis {
    const content = insight.text || insight.title || '';
    const contentLower = content.toLowerCase();

    const principleScores: PrincipleScore[] = [
      this.scoreCuriosityGap(contentLower, content),
      this.scoreLossAversion(contentLower, content),
      this.scoreSocialProof(contentLower, content),
      this.scoreAuthority(contentLower, content),
      this.scoreScarcity(contentLower, content),
      this.scoreReciprocity(contentLower, content),
      this.scoreCommitmentConsistency(contentLower, content),
      this.scoreLikingSimilarity(contentLower, content),
      this.scoreContrast(contentLower, content),
    ];

    // Sort by score descending
    principleScores.sort((a, b) => b.score - a.score);

    return {
      insight_id: insight.id,
      insight_text: content.substring(0, 200),
      principle_scores: principleScores,
      top_principles: principleScores.slice(0, 3),
      overall_psychology_score: this.calculateOverallScore(principleScores),
      recommended_content_angle: this.generateContentAngle(principleScores[0]),
    };
  }

  /**
   * Batch analyze multiple VoC insights
   * Returns array of analyses sorted by overall psychology score
   */
  analyzeVoCInsightsBatch(insights: VoCInsight[]): BatchPsychologyAnalysis {
    console.log(`[ContentPsychologyEngine] Analyzing ${insights.length} VoC insights for psychology principles`);

    const analyses = insights.map(insight => this.analyzeVoCInsight(insight));

    // Sort by overall score descending
    analyses.sort((a, b) => b.overall_psychology_score - a.overall_psychology_score);

    // Calculate aggregate statistics
    const principleFrequency = this.calculatePrincipleFrequency(analyses);
    const avgOverallScore = analyses.reduce((sum, a) => sum + a.overall_psychology_score, 0) / analyses.length;

    return {
      total_analyzed: insights.length,
      analyses,
      top_performers: analyses.slice(0, 5),
      average_psychology_score: Number(avgOverallScore.toFixed(1)),
      principle_frequency: principleFrequency,
      recommendations: this.generateBatchRecommendations(principleFrequency, analyses),
    };
  }

  /**
   * Calculate which principles appear most frequently as top scorers
   */
  private calculatePrincipleFrequency(analyses: PsychologyPrincipleAnalysis[]): Record<string, number> {
    const frequency: Record<string, number> = {};

    analyses.forEach(analysis => {
      const topPrinciple = analysis.top_principles[0].principle;
      frequency[topPrinciple] = (frequency[topPrinciple] || 0) + 1;
    });

    return frequency;
  }

  /**
   * Generate strategic recommendations based on batch analysis
   */
  private generateBatchRecommendations(
    principleFrequency: Record<string, number>,
    analyses: PsychologyPrincipleAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // Sort principles by frequency
    const sortedPrinciples = Object.entries(principleFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Recommendation 1: Top principle focus
    if (sortedPrinciples.length > 0) {
      const [topPrinciple, count] = sortedPrinciples[0];
      const percentage = ((count / analyses.length) * 100).toFixed(0);
      recommendations.push(
        `${percentage}% of insights trigger ${topPrinciple}. Create content series focused on this principle for maximum resonance.`
      );
    }

    // Recommendation 2: Diversification opportunity
    if (sortedPrinciples.length > 1) {
      const topThree = sortedPrinciples.map(([p]) => p).join(', ');
      recommendations.push(
        `Create content variety using your top 3 principles: ${topThree}. This ensures broad audience appeal.`
      );
    }

    // Recommendation 3: Low-hanging fruit
    const highScorers = analyses.filter(a => a.overall_psychology_score >= 7);
    if (highScorers.length > 0) {
      recommendations.push(
        `${highScorers.length} insights scored 7+ overall. Prioritize these for immediate content creation.`
      );
    }

    // Recommendation 4: Underutilized principles
    const allPrinciples = [
      'Curiosity Gap', 'Loss Aversion', 'Social Proof', 'Authority',
      'Scarcity', 'Reciprocity', 'Commitment & Consistency',
      'Liking/Similarity', 'Contrast'
    ];
    const unusedPrinciples = allPrinciples.filter(p => !principleFrequency[p]);
    if (unusedPrinciples.length > 0) {
      recommendations.push(
        `Underutilized principles: ${unusedPrinciples.join(', ')}. Consider gathering VoC data that triggers these angles.`
      );
    }

    return recommendations;
  }

  /**
   * Score: Curiosity Gap (0-10)
   */
  private scoreCuriosityGap(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Questions create curiosity
    if (contentLower.includes('?')) {
      score += 3;
      triggers.push('Contains question that creates information gap');
    }

    // Incomplete information
    const gapWords = ['wondering', 'confused', 'don\'t understand', 'how does', 'why does', 'what is', 'curious'];
    gapWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.5;
        triggers.push(`"${word}" signals missing information`);
      }
    });

    // Mystery/hidden info
    const mysteryWords = ['secret', 'hidden', 'surprising', 'unexpected', 'discover', 'reveal'];
    mysteryWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
        triggers.push(`"${word}" hints at undisclosed information`);
      }
    });

    score = Math.min(score, 10);

    return {
      principle: 'Curiosity Gap',
      score: Number(score.toFixed(1)),
      explanation: this.explainCuriosityGap(triggers, score),
      triggers,
      content_application: `Use open loops: "What if I told you..." or "The surprising reason why..." to amplify curiosity`,
    };
  }

  private explainCuriosityGap(triggers: string[], score: number): string {
    if (score >= 7) return 'High curiosity potential - customer is actively seeking missing information. Creates strong drive to close the gap.';
    if (score >= 4) return 'Moderate curiosity - some information gaps present that content can expand on.';
    return 'Low curiosity signal - customer statement is more declarative than inquisitive.';
  }

  /**
   * Score: Loss Aversion (0-10)
   */
  private scoreLossAversion(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Direct loss language
    const lossWords = ['losing', 'lose', 'lost', 'miss out', 'missing', 'waste', 'wasting', 'behind', 'falling behind'];
    lossWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 2;
        triggers.push(`"${word}" expresses fear of loss`);
      }
    });

    // Negative consequences
    const negativeWords = ['problem', 'issue', 'struggle', 'failing', 'worried', 'concerned', 'frustrat', 'annoying'];
    negativeWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
        triggers.push(`"${word}" indicates pain that could worsen`);
      }
    });

    // Competitor advantage
    if (contentLower.includes('competitor') || contentLower.includes('others are')) {
      score += 2;
      triggers.push('Competitor comparison triggers loss aversion');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Loss Aversion',
      score: Number(score.toFixed(1)),
      explanation: score >= 6
        ? 'Strong loss aversion trigger - customer fears falling behind or losing ground. Frame solutions as preventing loss first, gains second.'
        : 'Moderate loss aversion - some fear present but not dominant motivator.',
      triggers,
      content_application: `Frame as: "Don't let [current pain] cost you [specific loss]" or "Stop losing [metric] to [alternative]"`,
    };
  }

  /**
   * Score: Social Proof (0-10)
   */
  private scoreSocialProof(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Peer references
    const peerWords = ['everyone', 'others', 'people', 'colleagues', 'peers', 'competitors', 'industry'];
    peerWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.5;
        triggers.push(`"${word}" references peer behavior`);
      }
    });

    // Popularity indicators
    const popularWords = ['popular', 'common', 'standard', 'typical', 'most', 'many', 'all'];
    popularWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
        triggers.push(`"${word}" signals bandwagon effect`);
      }
    });

    // Recommendations/reviews
    if (contentLower.includes('recommend') || contentLower.includes('review') || contentLower.includes('rating')) {
      score += 2;
      triggers.push('Mentions recommendations or reviews');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Social Proof',
      score: Number(score.toFixed(1)),
      explanation: score >= 6
        ? 'High social proof sensitivity - customer values what others do/think. Lead with testimonials and peer comparisons.'
        : 'Low social proof indicators - customer may be more independent in decision-making.',
      triggers,
      content_application: `Use: "Join [X number] who already..." or "Top performers in [industry] use..."`,
    };
  }

  /**
   * Score: Authority (0-10)
   */
  private scoreAuthority(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Expert references
    const expertWords = ['expert', 'professional', 'certified', 'research', 'study', 'data', 'proven'];
    expertWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.5;
        triggers.push(`"${word}" seeks authoritative sources`);
      }
    });

    // Credential indicators
    if (contentLower.includes('credential') || contentLower.includes('licensed') || contentLower.includes('accredited')) {
      score += 2;
      triggers.push('Values credentials and certifications');
    }

    // Numbers/statistics
    if (/\d+%|\d+ year|\d+x/.test(content)) {
      score += 1;
      triggers.push('References data or statistics');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Authority',
      score: Number(score.toFixed(1)),
      explanation: score >= 6
        ? 'High authority orientation - customer values expertise and credentials. Lead with data, certifications, and expert positioning.'
        : 'Moderate authority signals - customer may prioritize other factors over expertise.',
      triggers,
      content_application: `Position as: "Industry experts recommend..." or "[X%] data shows..." or "Certified in..."`,
    };
  }

  /**
   * Score: Scarcity (0-10)
   */
  private scoreScarcity(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Time pressure
    const timeWords = ['urgent', 'asap', 'soon', 'quickly', 'immediately', 'deadline', 'running out'];
    timeWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 2;
        triggers.push(`"${word}" indicates time sensitivity`);
      }
    });

    // Limited availability
    const limitWords = ['limited', 'only', 'few', 'rare', 'exclusive', 'hard to find'];
    limitWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.5;
        triggers.push(`"${word}" signals scarcity awareness`);
      }
    });

    // Seasonal/event-driven
    if (contentLower.includes('season') || contentLower.includes('before')) {
      score += 1;
      triggers.push('Time-bound context mentioned');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Scarcity',
      score: Number(score.toFixed(1)),
      explanation: score >= 6
        ? 'High scarcity sensitivity - customer responds to urgency and limited availability. Use time-bound offers and limited slots.'
        : 'Low scarcity indicators - customer may not be motivated by urgency.',
      triggers,
      content_application: `Frame as: "Only [X] spots left" or "Available until [date]" or "Before [season/event]"`,
    };
  }

  /**
   * Score: Reciprocity (0-10)
   */
  private scoreReciprocity(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Value-first language
    const valueWords = ['free', 'help', 'advice', 'guide', 'tip', 'resource', 'share'];
    valueWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.5;
        triggers.push(`"${word}" indicates receptivity to value-first approach`);
      }
    });

    // Looking for support
    if (contentLower.includes('looking for') || contentLower.includes('need') || contentLower.includes('want')) {
      score += 1;
      triggers.push('Expresses need where value can be provided first');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Reciprocity',
      score: Number(score.toFixed(1)),
      explanation: score >= 5
        ? 'Good reciprocity opportunity - customer open to value exchange. Offer free resources/audit/consultation first.'
        : 'Low reciprocity signals present.',
      triggers,
      content_application: `Offer: "Get free [resource]" or "Free audit/consultation" or "Here's how to [solve] (no strings)"`,
    };
  }

  /**
   * Score: Commitment & Consistency (0-10)
   */
  private scoreCommitmentConsistency(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Past behavior/identity
    const identityWords = ['always', 'never', 'usually', 'typically', 'believe in', 'value', 'important to me'];
    identityWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 2;
        triggers.push(`"${word}" reveals identity or past pattern`);
      }
    });

    // Stated preferences
    if (contentLower.includes('prefer') || contentLower.includes('like to')) {
      score += 1.5;
      triggers.push('Stated preference creates consistency pressure');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Commitment & Consistency',
      score: Number(score.toFixed(1)),
      explanation: score >= 6
        ? 'Strong identity/pattern indicator - customer has established preferences. Align with their stated identity.'
        : 'Low commitment signals - customer may not have strong established patterns yet.',
      triggers,
      content_application: `Frame as: "Since you value [X], you'll want..." or "People who believe in [X] typically..."`,
    };
  }

  /**
   * Score: Liking & Similarity (0-10)
   */
  private scoreLikingSimilarity(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Relatable language
    const relateWords = ['like me', 'similar', 'same', 'understand', 'relate', 'us', 'we'];
    relateWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.5;
        triggers.push(`"${word}" seeks similarity or understanding`);
      }
    });

    // Shared experience
    if (contentLower.includes('also') || contentLower.includes('too')) {
      score += 1;
      triggers.push('References shared experiences');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Liking/Similarity',
      score: Number(score.toFixed(1)),
      explanation: score >= 5
        ? 'Good similarity opportunity - customer values relatability. Use "we understand because we\'ve been there" messaging.'
        : 'Low similarity signals.',
      triggers,
      content_application: `Use: "Other [persona type] tell us..." or "We understand [pain] because we've experienced..."`,
    };
  }

  /**
   * Score: Contrast (0-10)
   */
  private scoreContrast(contentLower: string, content: string): PrincipleScore {
    let score = 0;
    const triggers: string[] = [];

    // Comparison language
    const compareWords = ['vs', 'versus', 'compared to', 'better than', 'worse than', 'instead of', 'rather than'];
    compareWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 2;
        triggers.push(`"${word}" makes direct comparisons`);
      }
    });

    // Before/after
    if (contentLower.includes('before') || contentLower.includes('after') || contentLower.includes('used to')) {
      score += 1.5;
      triggers.push('References before/after states');
    }

    // Alternatives
    if (contentLower.includes('alternative') || contentLower.includes('option')) {
      score += 1;
      triggers.push('Considers alternatives (contrast opportunity)');
    }

    score = Math.min(score, 10);

    return {
      principle: 'Contrast',
      score: Number(score.toFixed(1)),
      explanation: score >= 6
        ? 'Strong contrast sensitivity - customer actively comparing options. Use side-by-side comparisons and stark before/after.'
        : 'Moderate contrast indicators.',
      triggers,
      content_application: `Show: "[Old way] vs [New way]" or "Before: [pain] → After: [benefit]" or comparison charts`,
    };
  }

  /**
   * Calculate overall psychology score from all principles
   */
  private calculateOverallScore(scores: PrincipleScore[]): number {
    // Top 3 principles weighted most heavily
    const top3Avg = scores.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / 3;
    const allAvg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

    // Weight top 3 at 70%, all others at 30%
    const overall = top3Avg * 0.7 + allAvg * 0.3;
    return Number(overall.toFixed(1));
  }

  /**
   * Generate content angle recommendation based on top principle
   */
  private generateContentAngle(topPrinciple: PrincipleScore): string {
    const angles: Record<string, string> = {
      'Curiosity Gap': 'Open with unanswered question or surprising statistic, reveal answer incrementally',
      'Loss Aversion': 'Lead with what they\'re losing/missing, then show how to prevent further loss',
      'Social Proof': 'Open with testimonial or "X people already doing this", create FOMO',
      'Authority': 'Lead with expert data, credentials, or research findings',
      'Scarcity': 'Time-bound or limited-availability offer, create urgency',
      'Reciprocity': 'Give valuable resource/audit/tool first, no strings attached',
      'Commitment & Consistency': 'Reference their stated values/identity, align solution with who they are',
      'Liking/Similarity': 'Show you understand their exact situation, use relatable story',
      'Contrast': 'Stark before/after or us-vs-them comparison',
    };

    return angles[topPrinciple.principle] || 'Create content that addresses customer need directly';
  }
}

// New types for psychology analysis
export interface VoCInsight {
  id: string;
  text: string;
  title: string;
}

export interface PrincipleScore {
  principle: string;
  score: number;
  explanation: string;
  triggers: string[];
  content_application: string;
}

export interface PsychologyPrincipleAnalysis {
  insight_id: string;
  insight_text: string;
  principle_scores: PrincipleScore[];
  top_principles: PrincipleScore[];
  overall_psychology_score: number;
  recommended_content_angle: string;
}

export interface BatchPsychologyAnalysis {
  total_analyzed: number;
  analyses: PsychologyPrincipleAnalysis[];
  top_performers: PsychologyPrincipleAnalysis[];
  average_psychology_score: number;
  principle_frequency: Record<string, number>;
  recommendations: string[];
}
