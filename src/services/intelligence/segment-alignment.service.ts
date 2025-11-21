/**
 * Customer Segment Alignment Service
 *
 * Maps content to target personas and adjusts trigger weights
 * based on customer segments and purchase stages.
 *
 * Created: November 21, 2025
 */

export type CustomerSegment =
  | 'b2b_enterprise'
  | 'b2b_smb'
  | 'b2c_premium'
  | 'b2c_value'
  | 'professional_services'
  | 'technical_buyer'
  | 'executive_buyer';

export type PurchaseStage =
  | 'awareness'
  | 'consideration'
  | 'decision';

export interface SegmentProfile {
  segment: CustomerSegment;
  name: string;
  description: string;
  triggerWeights: {
    curiosity: number;
    fear: number;
    urgency: number;
    achievement: number;
    desire: number;
    trust: number;
    belonging: number;
  };
  stageWeights: {
    awareness: number;
    consideration: number;
    decision: number;
  };
  preferredTone: 'formal' | 'casual' | 'technical' | 'emotional';
  decisionDrivers: string[];
  objections: string[];
}

export interface SegmentAlignmentResult {
  segmentMatch: number; // 0-100
  stageMatch: number; // 0-100
  adjustedEQScore: number;
  recommendations: string[];
  bestSegments: CustomerSegment[];
}

// Segment profiles with psychographic data
const SEGMENT_PROFILES: Record<CustomerSegment, SegmentProfile> = {
  b2b_enterprise: {
    segment: 'b2b_enterprise',
    name: 'Enterprise B2B Buyer',
    description: 'Large organization decision-makers focused on risk mitigation and ROI',
    triggerWeights: {
      curiosity: 0.6,
      fear: 0.9, // Risk aversion is high
      urgency: 0.5,
      achievement: 0.7,
      desire: 0.4,
      trust: 1.0, // Trust is paramount
      belonging: 0.8 // Industry leadership
    },
    stageWeights: {
      awareness: 0.3,
      consideration: 0.4,
      decision: 0.3
    },
    preferredTone: 'formal',
    decisionDrivers: ['ROI', 'Risk mitigation', 'Scalability', 'Compliance', 'Integration'],
    objections: ['Implementation complexity', 'Total cost of ownership', 'Vendor lock-in']
  },
  b2b_smb: {
    segment: 'b2b_smb',
    name: 'SMB B2B Buyer',
    description: 'Small-medium business owners seeking efficiency and value',
    triggerWeights: {
      curiosity: 0.7,
      fear: 0.8,
      urgency: 0.8, // Time-poor
      achievement: 0.9, // Growth focused
      desire: 0.7,
      trust: 0.8,
      belonging: 0.6
    },
    stageWeights: {
      awareness: 0.25,
      consideration: 0.35,
      decision: 0.4 // Quick decision makers
    },
    preferredTone: 'casual',
    decisionDrivers: ['Price', 'Ease of use', 'Time savings', 'Support', 'Quick setup'],
    objections: ['Too expensive', 'Too complex', 'No time to learn']
  },
  b2c_premium: {
    segment: 'b2c_premium',
    name: 'Premium Consumer',
    description: 'Quality-focused consumers willing to pay for best-in-class',
    triggerWeights: {
      curiosity: 0.8,
      fear: 0.6,
      urgency: 0.5,
      achievement: 0.9, // Status and success
      desire: 1.0, // Aspiration driven
      trust: 0.9,
      belonging: 0.8 // Exclusive community
    },
    stageWeights: {
      awareness: 0.3,
      consideration: 0.4,
      decision: 0.3
    },
    preferredTone: 'emotional',
    decisionDrivers: ['Quality', 'Status', 'Experience', 'Brand reputation', 'Exclusivity'],
    objections: ['Is it worth the premium?', 'Are there comparable alternatives?']
  },
  b2c_value: {
    segment: 'b2c_value',
    name: 'Value-Conscious Consumer',
    description: 'Price-sensitive consumers seeking best bang for buck',
    triggerWeights: {
      curiosity: 0.7,
      fear: 0.9, // Fear of overpaying
      urgency: 0.9, // Limited-time deals
      achievement: 0.6,
      desire: 0.7,
      trust: 0.7,
      belonging: 0.5
    },
    stageWeights: {
      awareness: 0.2,
      consideration: 0.3,
      decision: 0.5 // Deal-driven decisions
    },
    preferredTone: 'casual',
    decisionDrivers: ['Price', 'Value', 'Deals', 'Reviews', 'Warranty'],
    objections: ['Too expensive', 'Can I find it cheaper?', 'Do I really need it?']
  },
  professional_services: {
    segment: 'professional_services',
    name: 'Professional Services Buyer',
    description: 'Seeking expertise and long-term relationships',
    triggerWeights: {
      curiosity: 0.6,
      fear: 0.8,
      urgency: 0.6,
      achievement: 0.7,
      desire: 0.5,
      trust: 1.0, // Trust is everything
      belonging: 0.7
    },
    stageWeights: {
      awareness: 0.25,
      consideration: 0.45, // Long consideration
      decision: 0.3
    },
    preferredTone: 'formal',
    decisionDrivers: ['Expertise', 'Track record', 'References', 'Communication', 'Chemistry'],
    objections: ['How do I know you understand my situation?', 'What if it doesn\'t work?']
  },
  technical_buyer: {
    segment: 'technical_buyer',
    name: 'Technical Buyer',
    description: 'Engineers and developers evaluating technical capabilities',
    triggerWeights: {
      curiosity: 1.0, // How does it work?
      fear: 0.5,
      urgency: 0.4,
      achievement: 0.8,
      desire: 0.5,
      trust: 0.7,
      belonging: 0.6
    },
    stageWeights: {
      awareness: 0.2,
      consideration: 0.5, // Deep evaluation
      decision: 0.3
    },
    preferredTone: 'technical',
    decisionDrivers: ['Technical specs', 'Documentation', 'API quality', 'Performance', 'Security'],
    objections: ['Does it scale?', 'How secure is it?', 'What\'s the learning curve?']
  },
  executive_buyer: {
    segment: 'executive_buyer',
    name: 'Executive Buyer',
    description: 'C-suite focused on strategic outcomes and competitive advantage',
    triggerWeights: {
      curiosity: 0.5,
      fear: 0.7,
      urgency: 0.6,
      achievement: 1.0, // Strategic wins
      desire: 0.8,
      trust: 0.9,
      belonging: 0.9 // Industry leadership
    },
    stageWeights: {
      awareness: 0.35,
      consideration: 0.35,
      decision: 0.3
    },
    preferredTone: 'formal',
    decisionDrivers: ['Strategic value', 'Competitive advantage', 'Market position', 'ROI', 'Team buy-in'],
    objections: ['Will my team adopt it?', 'How does this fit our strategy?']
  }
};

// Stage-specific trigger adjustments
const STAGE_TRIGGER_MODIFIERS: Record<PurchaseStage, Record<string, number>> = {
  awareness: {
    curiosity: 1.3, // Discovery phase
    fear: 0.7,
    urgency: 0.5,
    achievement: 0.8,
    desire: 1.1,
    trust: 0.6,
    belonging: 0.8
  },
  consideration: {
    curiosity: 1.0,
    fear: 1.0,
    urgency: 0.8,
    achievement: 1.0,
    desire: 1.0,
    trust: 1.2, // Building trust
    belonging: 1.0
  },
  decision: {
    curiosity: 0.6,
    fear: 1.2, // Loss aversion
    urgency: 1.4, // Now or never
    achievement: 1.1,
    desire: 1.0,
    trust: 1.3, // Final trust check
    belonging: 1.1
  }
};

class SegmentAlignmentService {
  /**
   * Get all available segment profiles
   */
  getSegmentProfiles(): SegmentProfile[] {
    return Object.values(SEGMENT_PROFILES);
  }

  /**
   * Get a specific segment profile
   */
  getSegmentProfile(segment: CustomerSegment): SegmentProfile {
    return SEGMENT_PROFILES[segment];
  }

  /**
   * Adjust EQ score based on segment and stage
   */
  adjustEQScore(
    baseScore: number,
    triggerCounts: Record<string, number>,
    segment: CustomerSegment,
    stage: PurchaseStage
  ): number {
    const profile = SEGMENT_PROFILES[segment];
    const stageModifiers = STAGE_TRIGGER_MODIFIERS[stage];

    let adjustedScore = baseScore * 0.5; // Base contribution

    // Calculate weighted trigger score
    let triggerScore = 0;
    let totalWeight = 0;

    for (const [trigger, count] of Object.entries(triggerCounts)) {
      if (count > 0 && trigger in profile.triggerWeights) {
        const segmentWeight = profile.triggerWeights[trigger as keyof typeof profile.triggerWeights];
        const stageModifier = stageModifiers[trigger] || 1.0;
        const combinedWeight = segmentWeight * stageModifier;

        triggerScore += count * combinedWeight * 5;
        totalWeight += combinedWeight;
      }
    }

    if (totalWeight > 0) {
      adjustedScore += (triggerScore / totalWeight) * 0.5;
    }

    return Math.min(100, Math.max(0, Math.round(adjustedScore)));
  }

  /**
   * Analyze content alignment with segments
   */
  analyzeAlignment(
    content: string,
    targetSegments: CustomerSegment[],
    stage: PurchaseStage
  ): SegmentAlignmentResult {
    const contentLower = content.toLowerCase();

    // Count trigger patterns in content
    const triggerCounts = this.countTriggers(contentLower);

    // Calculate match scores for each target segment
    let totalSegmentMatch = 0;
    const segmentScores: Record<CustomerSegment, number> = {} as any;

    for (const segment of targetSegments) {
      const profile = SEGMENT_PROFILES[segment];
      let matchScore = 0;

      // Check decision drivers
      for (const driver of profile.decisionDrivers) {
        if (contentLower.includes(driver.toLowerCase())) {
          matchScore += 10;
        }
      }

      // Check tone alignment
      if (this.detectTone(contentLower) === profile.preferredTone) {
        matchScore += 15;
      }

      // Trigger alignment
      for (const [trigger, weight] of Object.entries(profile.triggerWeights)) {
        if (triggerCounts[trigger] > 0 && weight >= 0.8) {
          matchScore += weight * 10;
        }
      }

      segmentScores[segment] = Math.min(100, matchScore);
      totalSegmentMatch += matchScore;
    }

    const avgSegmentMatch = targetSegments.length > 0
      ? totalSegmentMatch / targetSegments.length
      : 50;

    // Calculate stage match
    const stageModifiers = STAGE_TRIGGER_MODIFIERS[stage];
    let stageMatch = 50;

    for (const [trigger, modifier] of Object.entries(stageModifiers)) {
      if (modifier >= 1.2 && triggerCounts[trigger] > 0) {
        stageMatch += 10;
      } else if (modifier <= 0.7 && triggerCounts[trigger] > 2) {
        stageMatch -= 5; // Wrong emphasis for this stage
      }
    }

    stageMatch = Math.min(100, Math.max(0, stageMatch));

    // Calculate adjusted EQ score
    const baseEQ = this.calculateBaseEQ(triggerCounts);
    const adjustedEQ = targetSegments.length > 0
      ? this.adjustEQScore(baseEQ, triggerCounts, targetSegments[0], stage)
      : baseEQ;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      triggerCounts,
      targetSegments,
      stage,
      segmentScores
    );

    // Find best matching segments
    const allSegmentScores = Object.entries(SEGMENT_PROFILES).map(([key, profile]) => {
      let score = 0;
      for (const [trigger, weight] of Object.entries(profile.triggerWeights)) {
        if (triggerCounts[trigger] > 0) {
          score += weight * triggerCounts[trigger];
        }
      }
      return { segment: key as CustomerSegment, score };
    });

    const bestSegments = allSegmentScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.segment);

    return {
      segmentMatch: Math.round(avgSegmentMatch),
      stageMatch,
      adjustedEQScore: adjustedEQ,
      recommendations,
      bestSegments
    };
  }

  /**
   * Count trigger patterns in content
   */
  private countTriggers(content: string): Record<string, number> {
    const triggers: Record<string, RegExp[]> = {
      curiosity: [/why\s/gi, /what\s/gi, /how\s/gi, /secret/gi, /reveal/gi, /discover/gi],
      fear: [/stop\s/gi, /avoid/gi, /mistake/gi, /risk/gi, /lose/gi, /danger/gi, /warning/gi],
      urgency: [/before\s/gi, /now\s/gi, /limited/gi, /deadline/gi, /hurry/gi, /last chance/gi],
      achievement: [/finally/gi, /success/gi, /achieve/gi, /master/gi, /unlock/gi, /breakthrough/gi],
      desire: [/want/gi, /need/gi, /imagine/gi, /dream/gi, /wish/gi, /get\s/gi],
      trust: [/proven/gi, /verified/gi, /guaranteed/gi, /trusted/gi, /expert/gi, /certified/gi],
      belonging: [/everyone/gi, /community/gi, /join/gi, /together/gi, /we\s/gi, /family/gi]
    };

    const counts: Record<string, number> = {};

    for (const [trigger, patterns] of Object.entries(triggers)) {
      counts[trigger] = 0;
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          counts[trigger] += matches.length;
        }
      }
    }

    return counts;
  }

  /**
   * Detect content tone
   */
  private detectTone(content: string): 'formal' | 'casual' | 'technical' | 'emotional' {
    const formalWords = ['therefore', 'furthermore', 'consequently', 'regarding', 'pursuant'];
    const casualWords = ['awesome', 'cool', 'hey', 'guys', 'super', 'totally'];
    const technicalWords = ['api', 'integration', 'scalable', 'architecture', 'infrastructure'];
    const emotionalWords = ['love', 'hate', 'amazing', 'terrible', 'incredible', 'devastating'];

    const scores = {
      formal: formalWords.filter(w => content.includes(w)).length,
      casual: casualWords.filter(w => content.includes(w)).length,
      technical: technicalWords.filter(w => content.includes(w)).length,
      emotional: emotionalWords.filter(w => content.includes(w)).length
    };

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'casual'; // Default

    return Object.entries(scores).find(([_, score]) => score === maxScore)![0] as any;
  }

  /**
   * Calculate base EQ score from trigger counts
   */
  private calculateBaseEQ(triggerCounts: Record<string, number>): number {
    let score = 40;
    let triggersFound = 0;

    for (const count of Object.values(triggerCounts)) {
      if (count > 0) {
        triggersFound++;
        score += 7 + Math.min(3, (count - 1) * 2);
      }
    }

    // Multi-trigger bonus
    if (triggersFound >= 4) score += 10;
    else if (triggersFound >= 3) score += 6;
    else if (triggersFound >= 2) score += 3;

    return Math.min(100, score);
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    triggerCounts: Record<string, number>,
    targetSegments: CustomerSegment[],
    stage: PurchaseStage,
    segmentScores: Record<CustomerSegment, number>
  ): string[] {
    const recommendations: string[] = [];

    if (targetSegments.length === 0) {
      recommendations.push('Define target customer segments for better alignment');
      return recommendations;
    }

    const profile = SEGMENT_PROFILES[targetSegments[0]];
    const stageModifiers = STAGE_TRIGGER_MODIFIERS[stage];

    // Check for missing high-weight triggers
    for (const [trigger, weight] of Object.entries(profile.triggerWeights)) {
      if (weight >= 0.9 && triggerCounts[trigger] === 0) {
        recommendations.push(
          `Add ${trigger} triggers - critical for ${profile.name} (weight: ${weight})`
        );
      }
    }

    // Check stage alignment
    for (const [trigger, modifier] of Object.entries(stageModifiers)) {
      if (modifier >= 1.3 && triggerCounts[trigger] === 0) {
        recommendations.push(
          `Add ${trigger} triggers - important for ${stage} stage`
        );
      }
    }

    // Check decision driver coverage
    const missingDrivers = profile.decisionDrivers.filter(
      d => !Object.keys(triggerCounts).some(t => t.includes(d.toLowerCase()))
    );
    if (missingDrivers.length > 2) {
      recommendations.push(
        `Address decision drivers: ${missingDrivers.slice(0, 3).join(', ')}`
      );
    }

    // Tone recommendation
    if (recommendations.length < 3) {
      recommendations.push(`Consider ${profile.preferredTone} tone for this segment`);
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Get trigger weights for a segment and stage combination
   */
  getCombinedWeights(
    segment: CustomerSegment,
    stage: PurchaseStage
  ): Record<string, number> {
    const profile = SEGMENT_PROFILES[segment];
    const stageModifiers = STAGE_TRIGGER_MODIFIERS[stage];

    const combined: Record<string, number> = {};

    for (const [trigger, weight] of Object.entries(profile.triggerWeights)) {
      const modifier = stageModifiers[trigger] || 1.0;
      combined[trigger] = weight * modifier;
    }

    return combined;
  }
}

export const segmentAlignment = new SegmentAlignmentService();
