/**
 * V4 Psychology Engine
 *
 * Applies psychological frameworks to content structure and
 * explains WHY content works using proven persuasion principles.
 *
 * Extracted and refined from V1 ContentPsychologyEngine.
 *
 * Created: 2025-11-26
 */

import type {
  PsychologyFramework,
  EmotionalTrigger,
  PsychologyProfile,
  FunnelStage
} from './types';

// ============================================================================
// FRAMEWORK DEFINITIONS
// ============================================================================

interface FrameworkDefinition {
  name: string;
  description: string;
  structure: string[];
  bestFor: string[];
  scienceBacking: string;
  conversionLift: string;
}

const FRAMEWORK_DEFINITIONS: Record<PsychologyFramework, FrameworkDefinition> = {
  AIDA: {
    name: 'AIDA',
    description: 'Attention → Interest → Desire → Action',
    structure: ['Attention: Grab with hook', 'Interest: Build with relevance', 'Desire: Create want', 'Action: Clear CTA'],
    bestFor: ['Sales pages', 'Product launches', 'Ads'],
    scienceBacking: 'Elias St. Elmo Lewis (1898) - Classic advertising model',
    conversionLift: '+15-20% baseline'
  },
  PAS: {
    name: 'PAS',
    description: 'Problem → Agitate → Solve',
    structure: ['Problem: Identify the pain', 'Agitate: Make it urgent', 'Solve: Present solution'],
    bestFor: ['Problem-aware audiences', 'Service businesses', 'B2B'],
    scienceBacking: 'Dan Kennedy - Pain-focused copywriting',
    conversionLift: '+35% for pain points'
  },
  BAB: {
    name: 'BAB',
    description: 'Before → After → Bridge',
    structure: ['Before: Current painful state', 'After: Desired transformed state', 'Bridge: How to get there'],
    bestFor: ['Transformation sales', 'Coaching', 'Courses'],
    scienceBacking: 'Story-based persuasion research',
    conversionLift: '+38% for aspirational'
  },
  PASTOR: {
    name: 'PASTOR',
    description: 'Problem → Amplify → Solution → Transformation → Offer → Response',
    structure: ['Problem: Name the pain', 'Amplify: Show consequences', 'Solution: Present your answer', 'Transformation: Paint the after', 'Offer: Make the pitch', 'Response: Call to action'],
    bestFor: ['High-ticket offers', 'Complex sales', 'Webinars'],
    scienceBacking: 'Ray Edwards - Long-form sales methodology',
    conversionLift: '+42% for complex sales'
  },
  StoryBrand: {
    name: 'StoryBrand',
    description: 'Customer as hero, Brand as guide',
    structure: ['Character: Customer with problem', 'Guide: Brand with solution', 'Plan: Clear steps', 'Call: Direct action', 'Success: Happy ending', 'Failure: Stakes if they don\'t'],
    bestFor: ['Brand storytelling', 'About pages', 'Video content'],
    scienceBacking: 'Donald Miller - StoryBrand Framework',
    conversionLift: '+30% with proper implementation'
  },
  CuriosityGap: {
    name: 'Curiosity Gap',
    description: 'Create information gap that demands resolution',
    structure: ['Hook: Present partial information', 'Tease: Build anticipation', 'Reveal: Deliver the answer'],
    bestFor: ['Headlines', 'Email subjects', 'Social hooks'],
    scienceBacking: 'George Loewenstein Information Gap Theory (1994)',
    conversionLift: '+47% CTR'
  },
  PatternInterrupt: {
    name: 'Pattern Interrupt',
    description: 'Break expectations to force attention',
    structure: ['Interrupt: Say something unexpected', 'Engage: Now that you have attention', 'Redirect: To your message'],
    bestFor: ['Social media', 'Cold outreach', 'Ads'],
    scienceBacking: 'Kahneman System 1/2 thinking',
    conversionLift: '+31% engagement'
  },
  SocialProof: {
    name: 'Social Proof',
    description: 'Leverage what others are doing/thinking',
    structure: ['Claim: Make assertion', 'Proof: Show others doing it', 'Validation: Reinforce with numbers'],
    bestFor: ['Testimonials', 'Case studies', 'Reviews'],
    scienceBacking: 'Robert Cialdini Principles of Persuasion (1984)',
    conversionLift: '+28% signups'
  },
  Scarcity: {
    name: 'Scarcity',
    description: 'Limited availability increases perceived value',
    structure: ['Value: Establish worth', 'Limit: Show scarcity', 'Urgency: Time pressure'],
    bestFor: ['Limited offers', 'Flash sales', 'Launches'],
    scienceBacking: 'Jack Brehm Reactance Theory (1966)',
    conversionLift: '+34% urgency'
  },
  Reciprocity: {
    name: 'Reciprocity',
    description: 'Give value first to trigger obligation',
    structure: ['Give: Provide free value', 'Establish: Build relationship', 'Ask: Make your request'],
    bestFor: ['Lead magnets', 'Free content', 'Newsletters'],
    scienceBacking: 'Cialdini Reciprocity Principle',
    conversionLift: '+23% conversion'
  },
  LossAversion: {
    name: 'Loss Aversion',
    description: 'Losses feel 2.5x more intense than gains',
    structure: ['Risk: What they might lose', 'Stakes: Consequences of inaction', 'Solution: How to avoid loss'],
    bestFor: ['Insurance', 'Security', 'Risk-based sales'],
    scienceBacking: 'Kahneman & Tversky Prospect Theory (1979)',
    conversionLift: '+29% action'
  },
  Authority: {
    name: 'Authority',
    description: 'Establish expertise and thought leadership',
    structure: ['Credential: Establish why you know', 'Insight: Share unique knowledge', 'Evidence: Back with proof', 'Application: How to apply'],
    bestFor: ['Thought leadership', 'Expert positioning', 'Industry analysis'],
    scienceBacking: 'Cialdini Authority Principle',
    conversionLift: '+33% trust'
  },
  FAB: {
    name: 'FAB',
    description: 'Feature → Advantage → Benefit',
    structure: ['Feature: What it is', 'Advantage: What it does', 'Benefit: What it means for them'],
    bestFor: ['Product features', 'Service descriptions', 'Comparisons'],
    scienceBacking: 'Classic sales methodology - benefits-focused selling',
    conversionLift: '+25% understanding'
  }
};

// ============================================================================
// EMOTIONAL TRIGGER DEFINITIONS
// ============================================================================

interface TriggerDefinition {
  description: string;
  intensity: 'high' | 'medium' | 'low';
  keywords: string[];
  bestPairings: PsychologyFramework[];
}

const TRIGGER_DEFINITIONS: Record<EmotionalTrigger, TriggerDefinition> = {
  curiosity: {
    description: 'Makes readers want to know more',
    intensity: 'high',
    keywords: ['secret', 'hidden', 'discover', 'revealed', 'what if', 'why'],
    bestPairings: ['CuriosityGap', 'PatternInterrupt', 'AIDA']
  },
  fear: {
    description: 'Activates concern about negative outcomes',
    intensity: 'high',
    keywords: ['avoid', 'mistake', 'warning', 'risk', 'danger', 'lose'],
    bestPairings: ['PAS', 'LossAversion', 'Scarcity']
  },
  surprise: {
    description: 'Disrupts expectations and creates memorable moments',
    intensity: 'medium',
    keywords: ['unexpected', 'shocking', 'unbelievable', 'actually'],
    bestPairings: ['PatternInterrupt', 'CuriosityGap']
  },
  aspiration: {
    description: 'Connects to desire for improvement',
    intensity: 'high',
    keywords: ['transform', 'achieve', 'success', 'dream', 'become', 'unlock'],
    bestPairings: ['BAB', 'StoryBrand', 'PASTOR']
  },
  validation: {
    description: 'Confirms existing beliefs or experiences',
    intensity: 'medium',
    keywords: ['you\'re right', 'you know', 'like you', 'understand'],
    bestPairings: ['SocialProof', 'Reciprocity']
  },
  anger: {
    description: 'Activates sense of injustice',
    intensity: 'high',
    keywords: ['unfair', 'wrong', 'lie', 'scam', 'truth'],
    bestPairings: ['PatternInterrupt', 'PAS']
  },
  hope: {
    description: 'Creates optimism about future outcomes',
    intensity: 'medium',
    keywords: ['possible', 'can', 'will', 'imagine', 'future'],
    bestPairings: ['BAB', 'StoryBrand', 'Reciprocity']
  },
  urgency: {
    description: 'Creates time pressure for action',
    intensity: 'high',
    keywords: ['now', 'today', 'limited', 'deadline', 'last chance'],
    bestPairings: ['Scarcity', 'AIDA', 'LossAversion']
  }
};

// ============================================================================
// PSYCHOLOGY ENGINE CLASS
// ============================================================================

class PsychologyEngine {
  /**
   * Select best framework based on content goal and funnel stage
   */
  selectFramework(
    goal: 'engagement' | 'conversion' | 'authority' | 'awareness',
    funnelStage: FunnelStage = 'TOFU'
  ): PsychologyFramework {
    // Goal-based selection
    const goalMap: Record<string, PsychologyFramework[]> = {
      engagement: ['CuriosityGap', 'PatternInterrupt', 'StoryBrand'],
      conversion: ['PAS', 'PASTOR', 'AIDA', 'Scarcity'],
      authority: ['SocialProof', 'Reciprocity'],
      awareness: ['CuriosityGap', 'BAB', 'StoryBrand']
    };

    // Funnel stage adjustment
    const funnelMap: Record<FunnelStage, PsychologyFramework[]> = {
      TOFU: ['CuriosityGap', 'PatternInterrupt', 'StoryBrand', 'Reciprocity'],
      MOFU: ['PAS', 'BAB', 'SocialProof', 'Reciprocity'],
      BOFU: ['AIDA', 'PASTOR', 'Scarcity', 'LossAversion']
    };

    // Find intersection
    const goalFrameworks = goalMap[goal] || goalMap.engagement;
    const funnelFrameworks = funnelMap[funnelStage];

    const intersection = goalFrameworks.filter(f => funnelFrameworks.includes(f));

    // Return first match or default
    return intersection[0] || goalFrameworks[0] || 'AIDA';
  }

  /**
   * Select best emotional trigger for framework
   */
  selectTrigger(framework: PsychologyFramework): EmotionalTrigger {
    // Find triggers that pair well with this framework
    const pairings: [EmotionalTrigger, TriggerDefinition][] = Object.entries(TRIGGER_DEFINITIONS)
      .filter(([_, def]) => def.bestPairings.includes(framework)) as [EmotionalTrigger, TriggerDefinition][];

    if (pairings.length === 0) {
      return 'curiosity'; // Default
    }

    // Prefer high-intensity triggers
    const highIntensity = pairings.filter(([_, def]) => def.intensity === 'high');
    if (highIntensity.length > 0) {
      return highIntensity[0][0];
    }

    return pairings[0][0];
  }

  /**
   * Build psychology profile for content
   */
  buildProfile(
    goal: 'engagement' | 'conversion' | 'authority' | 'awareness',
    funnelStage: FunnelStage = 'TOFU'
  ): PsychologyProfile {
    const framework = this.selectFramework(goal, funnelStage);
    const primaryTrigger = this.selectTrigger(framework);

    // Select secondary trigger (different from primary)
    const allTriggers: EmotionalTrigger[] = ['curiosity', 'fear', 'surprise', 'aspiration', 'validation', 'anger', 'hope', 'urgency'];
    const secondaryOptions = allTriggers.filter(t => t !== primaryTrigger);
    const secondaryTrigger = secondaryOptions[Math.floor(Math.random() * secondaryOptions.length)];

    // Calculate intensity based on funnel stage
    const intensityMap: Record<FunnelStage, number> = {
      TOFU: 0.5,
      MOFU: 0.7,
      BOFU: 0.9
    };

    return {
      framework,
      primaryTrigger,
      secondaryTrigger,
      intensity: intensityMap[funnelStage]
    };
  }

  /**
   * Get framework structure for content generation
   */
  getFrameworkStructure(framework: PsychologyFramework): string[] {
    return FRAMEWORK_DEFINITIONS[framework]?.structure || [];
  }

  /**
   * Get framework explanation for transparency
   */
  explainFramework(framework: PsychologyFramework): {
    name: string;
    description: string;
    whyItWorks: string;
    conversionLift: string;
  } {
    const def = FRAMEWORK_DEFINITIONS[framework];
    return {
      name: def.name,
      description: def.description,
      whyItWorks: def.scienceBacking,
      conversionLift: def.conversionLift
    };
  }

  /**
   * Get trigger keywords for content enhancement
   */
  getTriggerKeywords(trigger: EmotionalTrigger): string[] {
    return TRIGGER_DEFINITIONS[trigger]?.keywords || [];
  }

  /**
   * Analyze existing content for psychology profile
   */
  analyzeContent(text: string): PsychologyProfile {
    const lowerText = text.toLowerCase();

    // Detect framework based on structure patterns
    let detectedFramework: PsychologyFramework = 'AIDA';

    if (lowerText.includes('problem') && lowerText.includes('agitate')) {
      detectedFramework = 'PAS';
    } else if (lowerText.includes('before') && lowerText.includes('after')) {
      detectedFramework = 'BAB';
    } else if (lowerText.includes('limited') || lowerText.includes('only')) {
      detectedFramework = 'Scarcity';
    } else if (lowerText.includes('story') || lowerText.includes('journey')) {
      detectedFramework = 'StoryBrand';
    }

    // Detect primary trigger
    let maxTriggerScore = 0;
    let detectedTrigger: EmotionalTrigger = 'curiosity';

    for (const [trigger, def] of Object.entries(TRIGGER_DEFINITIONS)) {
      const score = def.keywords.filter(k => lowerText.includes(k)).length;
      if (score > maxTriggerScore) {
        maxTriggerScore = score;
        detectedTrigger = trigger as EmotionalTrigger;
      }
    }

    return {
      framework: detectedFramework,
      primaryTrigger: detectedTrigger,
      intensity: maxTriggerScore > 3 ? 0.8 : maxTriggerScore > 1 ? 0.6 : 0.4
    };
  }

  /**
   * Generate psychology-based content outline
   */
  generateOutline(
    framework: PsychologyFramework,
    topic: string
  ): { section: string; purpose: string; example: string }[] {
    const structure = this.getFrameworkStructure(framework);

    return structure.map((step, index) => ({
      section: `Section ${index + 1}`,
      purpose: step,
      example: `Apply "${step}" to: ${topic}`
    }));
  }

  /**
   * Get all available frameworks
   */
  getAllFrameworks(): { framework: PsychologyFramework; definition: FrameworkDefinition }[] {
    return Object.entries(FRAMEWORK_DEFINITIONS).map(([framework, definition]) => ({
      framework: framework as PsychologyFramework,
      definition
    }));
  }

  /**
   * Get all available triggers
   */
  getAllTriggers(): { trigger: EmotionalTrigger; definition: TriggerDefinition }[] {
    return Object.entries(TRIGGER_DEFINITIONS).map(([trigger, definition]) => ({
      trigger: trigger as EmotionalTrigger,
      definition
    }));
  }
}

// Export singleton instance
export const psychologyEngine = new PsychologyEngine();

// Export class for testing
export { PsychologyEngine };
