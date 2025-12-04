/**
 * Content Framework Library
 *
 * Comprehensive library of proven copywriting and content frameworks
 * for conversion-optimized content generation.
 *
 * Frameworks organized by:
 * - Social Media (LinkedIn, Twitter, Instagram)
 * - Email Marketing
 * - Blog Posts
 * - Landing Pages
 *
 * Each framework includes:
 * - Structure definition
 * - Psychology principles
 * - Use case recommendations
 * - Platform optimizations
 *
 * Created: 2025-11-11
 */

import type { SynapseInsight } from '@/types/synapse.types';

// ============================================================================
// FRAMEWORK TYPES
// ============================================================================

export type FrameworkType =
  // Social Media Frameworks
  | 'hook-story-offer'
  | 'problem-agitate-solution'
  | 'aida'
  | 'before-after-bridge'
  | 'curiosity-gap'
  | 'controversy-debate'

  // Email Frameworks
  | 'email-aida'
  | 'email-pas'
  | 'email-4ps'
  | 'email-story'

  // Blog Frameworks
  | 'blog-how-to'
  | 'blog-listicle'
  | 'blog-ultimate-guide'
  | 'blog-case-study'
  | 'blog-comparison'

  // Landing Page Frameworks
  | 'landing-hero'
  | 'landing-pastor'
  | 'landing-storybrand'
  | 'landing-problem-promise-proof-proposal';

export type ContentChannel = 'social' | 'email' | 'blog' | 'landing-page';

export type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'generic';

export type ContentGoal =
  | 'engagement'
  | 'conversion'
  | 'awareness'
  | 'education'
  | 'trust-building'
  | 'lead-generation';

// ============================================================================
// FRAMEWORK DEFINITIONS
// ============================================================================

export interface FrameworkStage {
  name: string;
  purpose: string;
  guidelines: string[];
  psychologyPrinciple?: string;
  exampleFormulas?: string[];
}

export interface ContentFramework {
  id: FrameworkType;
  name: string;
  channel: ContentChannel;
  description: string;
  bestFor: string[];
  stages: FrameworkStage[];
  platforms?: Platform[];
  lengthGuideline?: string;
  conversionFocus: number; // 0-1, how conversion-focused
  engagementFocus: number; // 0-1, how engagement-focused
}

// ============================================================================
// SOCIAL MEDIA FRAMEWORKS
// ============================================================================

export const HOOK_STORY_OFFER: ContentFramework = {
  id: 'hook-story-offer',
  name: 'Hook-Story-Offer',
  channel: 'social',
  description: 'Social media standard: grab attention, build connection, drive action',
  bestFor: ['LinkedIn posts', 'Twitter threads', 'Instagram captions'],
  platforms: ['linkedin', 'twitter', 'instagram'],
  lengthGuideline: '200-500 words',
  conversionFocus: 0.7,
  engagementFocus: 0.9,
  stages: [
    {
      name: 'Hook',
      purpose: 'Stop the scroll - create pattern interrupt',
      psychologyPrinciple: 'Curiosity Gap + Pattern Interrupt',
      guidelines: [
        'First 1-2 lines must grab attention',
        'Use curiosity, controversy, or unexpected statement',
        'Make it about the reader, not you',
        'Avoid generic openings'
      ],
      exampleFormulas: [
        '[Surprising Fact] that changes everything about [Topic]',
        'I just realized [Uncomfortable Truth] about [Industry]',
        'Stop [Common Action]. Here\'s what to do instead.',
        '[Big Number/Stat] + [Unexpected Insight]'
      ]
    },
    {
      name: 'Story',
      purpose: 'Build connection through narrative',
      psychologyPrinciple: 'Narrative Transportation + Empathy',
      guidelines: [
        'Share personal experience or case study',
        'Make it relatable - show vulnerability',
        'Include transformation or discovery',
        'Use concrete details, not abstractions'
      ],
      exampleFormulas: [
        'Here\'s what happened when I [Action]...',
        'I used to believe [Old Belief]. Then I discovered [New Truth]',
        'Last week, I [Experience]. It revealed [Insight]'
      ]
    },
    {
      name: 'Offer',
      purpose: 'Clear call-to-action with value',
      psychologyPrinciple: 'Commitment + Reciprocity',
      guidelines: [
        'One clear CTA - don\'t give too many options',
        'Frame as opportunity, not demand',
        'Provide clear next step',
        'Optional: Add urgency or scarcity'
      ],
      exampleFormulas: [
        'Want [Outcome]? [Simple Action]',
        'I\'m sharing [Resource]. Comment [Word] to get it',
        'Ready to [Benefit]? Here\'s how: [Action]'
      ]
    }
  ]
};

export const PROBLEM_AGITATE_SOLUTION: ContentFramework = {
  id: 'problem-agitate-solution',
  name: 'Problem-Agitate-Solution (PAS)',
  channel: 'social',
  description: 'Pain-focused framework: identify problem, amplify pain, provide solution',
  bestFor: ['High-intent audiences', 'Problem-aware markets', 'Solution positioning'],
  platforms: ['linkedin', 'twitter'],
  lengthGuideline: '250-400 words',
  conversionFocus: 0.9,
  engagementFocus: 0.7,
  stages: [
    {
      name: 'Problem',
      purpose: 'Identify specific, relatable pain point',
      psychologyPrinciple: 'Loss Aversion + Recognition',
      guidelines: [
        'Be specific - avoid generic problems',
        'Use reader\'s language (words they use)',
        'Make it urgent and relevant now',
        'Qualify your audience'
      ],
      exampleFormulas: [
        'If you\'re struggling with [Specific Problem]...',
        '[Audience] face this challenge every day: [Problem]',
        'You know that feeling when [Frustration]?'
      ]
    },
    {
      name: 'Agitate',
      purpose: 'Amplify the pain - make problem feel urgent',
      psychologyPrinciple: 'Loss Aversion Amplification',
      guidelines: [
        'Show what\'s at stake (cost of inaction)',
        'Use emotional language',
        'Connect to bigger consequences',
        'Don\'t be manipulative - be honest'
      ],
      exampleFormulas: [
        'Every day you don\'t solve this, you\'re losing [Cost]',
        'Here\'s what happens if this continues...',
        'The worst part? [Compounding Consequence]'
      ]
    },
    {
      name: 'Solution',
      purpose: 'Present clear path forward',
      psychologyPrinciple: 'Relief + Hope',
      guidelines: [
        'Make solution feel achievable',
        'Be specific about what changes',
        'Include proof if possible',
        'Clear call-to-action'
      ],
      exampleFormulas: [
        'Here\'s what works: [Solution]',
        'I solved this by [Approach]. Here\'s how you can too',
        'The solution is simpler than you think: [Steps]'
      ]
    }
  ]
};

export const AIDA_SOCIAL: ContentFramework = {
  id: 'aida',
  name: 'AIDA (Attention-Interest-Desire-Action)',
  channel: 'social',
  description: 'Classic conversion framework adapted for social',
  bestFor: ['Product launches', 'Service announcements', 'Event promotion'],
  platforms: ['linkedin', 'twitter', 'instagram', 'facebook'],
  lengthGuideline: '200-350 words',
  conversionFocus: 0.8,
  engagementFocus: 0.7,
  stages: [
    {
      name: 'Attention',
      purpose: 'Grab attention immediately',
      psychologyPrinciple: 'Pattern Interrupt',
      guidelines: [
        'Use bold statement or question',
        'Make it relevant to audience',
        'Create curiosity or surprise'
      ],
      exampleFormulas: [
        '[Bold Claim] (and here\'s proof)',
        'What if [Desired Outcome] was possible?',
        '[Surprising Stat] about [Topic]'
      ]
    },
    {
      name: 'Interest',
      purpose: 'Build interest with relevant details',
      psychologyPrinciple: 'Relevance + Specificity',
      guidelines: [
        'Show why they should care',
        'Use concrete details',
        'Connect to their situation'
      ]
    },
    {
      name: 'Desire',
      purpose: 'Create want through benefits',
      psychologyPrinciple: 'Desire + Visualization',
      guidelines: [
        'Paint picture of transformation',
        'Show benefits, not features',
        'Use emotional language'
      ]
    },
    {
      name: 'Action',
      purpose: 'Clear, simple next step',
      psychologyPrinciple: 'Commitment',
      guidelines: [
        'One clear CTA',
        'Remove friction',
        'Add urgency if appropriate'
      ]
    }
  ]
};

export const BEFORE_AFTER_BRIDGE: ContentFramework = {
  id: 'before-after-bridge',
  name: 'Before-After-Bridge (BAB)',
  channel: 'social',
  description: 'Transformation framework showing the journey',
  bestFor: ['Transformation stories', 'Results showcases', 'Method reveals'],
  platforms: ['linkedin', 'instagram'],
  lengthGuideline: '300-500 words',
  conversionFocus: 0.7,
  engagementFocus: 0.8,
  stages: [
    {
      name: 'Before',
      purpose: 'Establish the starting point (relatable struggle)',
      psychologyPrinciple: 'Empathy + Recognition',
      guidelines: [
        'Be specific about the struggle',
        'Make it relatable',
        'Show vulnerability',
        'Avoid exaggeration'
      ],
      exampleFormulas: [
        'Six months ago, I was [Struggle]',
        'Like most [Audience], I used to [Problem Behavior]',
        'The old me would [Limiting Behavior]'
      ]
    },
    {
      name: 'After',
      purpose: 'Show the transformation achieved',
      psychologyPrinciple: 'Aspiration + Proof',
      guidelines: [
        'Show specific results',
        'Use numbers/metrics if possible',
        'Make transformation feel achievable',
        'Be credible, not boastful'
      ],
      exampleFormulas: [
        'Now I [New Reality]',
        'Today, [Positive Outcome]',
        'The difference: [Metric Improvement]'
      ]
    },
    {
      name: 'Bridge',
      purpose: 'Reveal the method/path to transformation',
      psychologyPrinciple: 'Solution + Hope',
      guidelines: [
        'Explain what changed',
        'Make path feel clear',
        'Offer to help others cross bridge',
        'Include clear CTA'
      ],
      exampleFormulas: [
        'Here\'s what changed everything: [Method]',
        'The bridge: [Approach/Strategy]',
        'Want to make this shift? Here\'s how [Action]'
      ]
    }
  ]
};

// ============================================================================
// EMAIL FRAMEWORKS
// ============================================================================

export const EMAIL_AIDA: ContentFramework = {
  id: 'email-aida',
  name: 'Email AIDA',
  channel: 'email',
  description: 'Classic AIDA optimized for email format',
  bestFor: ['Newsletter', 'Product emails', 'Announcement emails'],
  lengthGuideline: '150-300 words',
  conversionFocus: 0.9,
  engagementFocus: 0.6,
  stages: [
    {
      name: 'Subject Line (Attention)',
      purpose: 'Get email opened',
      psychologyPrinciple: 'Curiosity + Relevance',
      guidelines: [
        '6-10 words ideal',
        'Create curiosity or urgency',
        'Personalize when possible',
        'Test with/without emojis'
      ],
      exampleFormulas: [
        '[Name], this changes [Topic]',
        'The [Outcome] you\'ve been waiting for',
        '⚡ [Benefit] in [Timeframe]',
        'Your [Problem] solution (finally)'
      ]
    },
    {
      name: 'Opening (Interest)',
      purpose: 'Hook them in first 2 lines',
      guidelines: [
        'Deliver on subject line promise',
        'Make it about them, not you',
        'Create pattern interrupt'
      ]
    },
    {
      name: 'Body (Desire)',
      purpose: 'Build want for outcome',
      guidelines: [
        'Show benefits clearly',
        'Use short paragraphs',
        'Include social proof if possible',
        'Address objections'
      ]
    },
    {
      name: 'CTA (Action)',
      purpose: 'Clear, single action',
      guidelines: [
        'One primary CTA button/link',
        'Action-oriented language',
        'Add urgency if appropriate',
        'Include P.S. with additional value'
      ]
    }
  ]
};

export const EMAIL_PAS: ContentFramework = {
  id: 'email-pas',
  name: 'Email PAS',
  channel: 'email',
  description: 'Problem-Agitate-Solution for email',
  bestFor: ['Problem-aware audiences', 'Solution emails', 'Educational series'],
  lengthGuideline: '200-350 words',
  conversionFocus: 0.85,
  engagementFocus: 0.7,
  stages: [
    {
      name: 'Subject Line',
      purpose: 'Call out the problem',
      guidelines: [
        'Reference their pain point',
        'Create recognition',
        'Make it feel urgent'
      ],
      exampleFormulas: [
        'Still struggling with [Problem]?',
        'The [Problem] no one talks about',
        'Why [Problem] keeps happening'
      ]
    },
    {
      name: 'Problem Identification',
      purpose: 'Show you understand their pain',
      guidelines: [
        'Be specific',
        'Use their language',
        'Show empathy'
      ]
    },
    {
      name: 'Agitate',
      purpose: 'Amplify urgency',
      guidelines: [
        'Show cost of inaction',
        'Use emotional language',
        'Don\'t be manipulative'
      ]
    },
    {
      name: 'Solution + CTA',
      purpose: 'Present clear path forward',
      guidelines: [
        'Make solution feel achievable',
        'Clear next step',
        'Add P.S. with benefit reminder'
      ]
    }
  ]
};

// ============================================================================
// BLOG FRAMEWORKS
// ============================================================================

export const BLOG_HOW_TO: ContentFramework = {
  id: 'blog-how-to',
  name: 'How-To Guide',
  channel: 'blog',
  description: 'Educational content with step-by-step instructions',
  bestFor: ['Tutorials', 'Process explanations', 'Skill building'],
  lengthGuideline: '1000-2000 words',
  conversionFocus: 0.5,
  engagementFocus: 0.8,
  stages: [
    {
      name: 'SEO-Optimized Headline',
      purpose: 'Rank for search + get clicks',
      guidelines: [
        'Include target keyword',
        'Promise clear outcome',
        'Use power words',
        'Keep under 60 characters'
      ],
      exampleFormulas: [
        'How to [Outcome] in [Timeframe]: [Method] Guide',
        '[Number] Steps to [Outcome] (Even if [Obstacle])',
        'The Complete Guide to [Topic]: [Benefit]'
      ]
    },
    {
      name: 'Introduction',
      purpose: 'Set context and promise value',
      guidelines: [
        'Hook with problem or opportunity',
        'Preview what they\'ll learn',
        'Establish credibility',
        'Keep under 200 words'
      ]
    },
    {
      name: 'Step-by-Step Content',
      purpose: 'Deliver actionable instructions',
      guidelines: [
        'Use H2/H3 subheadings for each step',
        'Include examples and visuals',
        'Make steps actionable',
        'Link to related resources'
      ]
    },
    {
      name: 'Conclusion + CTA',
      purpose: 'Reinforce value and drive action',
      guidelines: [
        'Summarize key points',
        'Encourage action',
        'Offer next step/upgrade path',
        'Include related content links'
      ]
    }
  ]
};

export const BLOG_LISTICLE: ContentFramework = {
  id: 'blog-listicle',
  name: 'Listicle',
  channel: 'blog',
  description: 'Numbered list format for easy scanning',
  bestFor: ['Tips compilations', 'Best practices', 'Resource roundups'],
  lengthGuideline: '800-1500 words',
  conversionFocus: 0.6,
  engagementFocus: 0.9,
  stages: [
    {
      name: 'Number + Benefit Headline',
      purpose: 'Set clear expectations',
      guidelines: [
        'Use odd numbers (perceived as more authentic)',
        'Promise specific outcome',
        'Include qualifying phrase'
      ],
      exampleFormulas: [
        '[Odd Number] [Topic] That [Benefit]',
        '[Number] Ways to [Outcome] Without [Common Obstacle]',
        '[Number] [Topic] Every [Audience] Should Know'
      ]
    },
    {
      name: 'Brief Intro',
      purpose: 'Set up the list value',
      guidelines: [
        'Keep to 100-150 words',
        'Explain why list matters',
        'Promise what they\'ll gain'
      ]
    },
    {
      name: 'List Items',
      purpose: 'Deliver numbered value points',
      guidelines: [
        'Use H2/H3 for each item',
        'Make each item standalone',
        '100-200 words per item',
        'Include examples',
        'Add visuals where helpful'
      ]
    },
    {
      name: 'Wrap-Up + CTA',
      purpose: 'Synthesize and drive action',
      guidelines: [
        'Quick summary',
        'Pick your favorite or start here',
        'Clear next step'
      ]
    }
  ]
};

// ============================================================================
// LANDING PAGE FRAMEWORKS
// ============================================================================

export const LANDING_HERO: ContentFramework = {
  id: 'landing-hero',
  name: 'Hero Section Formula',
  channel: 'landing-page',
  description: 'Above-the-fold conversion optimization',
  bestFor: ['Product pages', 'Service pages', 'Lead gen pages'],
  lengthGuideline: 'Above fold: 50-100 words',
  conversionFocus: 1.0,
  engagementFocus: 0.5,
  stages: [
    {
      name: 'Value Proposition Headline',
      purpose: 'Communicate core value in 10 words or less',
      psychologyPrinciple: 'Clarity + Relevance',
      guidelines: [
        'Focus on outcome, not method',
        'Be specific, avoid jargon',
        'Make it about them',
        'Test multiple versions'
      ],
      exampleFormulas: [
        '[Outcome] Without [Common Obstacle]',
        'Get [Desired Result] in [Timeframe]',
        'The [Benefit] [Audience] Needs'
      ]
    },
    {
      name: 'Supporting Subheadline',
      purpose: 'Clarify who it\'s for and how it works',
      guidelines: [
        '15-25 words',
        'Add clarity to headline',
        'Qualify your audience',
        'Hint at the method'
      ]
    },
    {
      name: 'Primary CTA',
      purpose: 'Drive single clear action',
      guidelines: [
        'Action-oriented button text',
        'High contrast color',
        'Benefit-focused copy',
        'Remove friction'
      ],
      exampleFormulas: [
        'Get [Benefit] Now',
        'Start [Action] Free',
        'See How It Works'
      ]
    },
    {
      name: 'Trust Indicators',
      purpose: 'Build credibility immediately',
      guidelines: [
        'Social proof (user count, ratings)',
        'Logos of known clients/media',
        'Risk reversal (guarantee)',
        'Keep minimal - don\'t clutter'
      ]
    }
  ]
};

export const LANDING_PASTOR: ContentFramework = {
  id: 'landing-pastor',
  name: 'PASTOR Framework',
  channel: 'landing-page',
  description: 'Problem-Amplify-Story-Testimonial-Offer-Response',
  bestFor: ['Long-form sales pages', 'Course launches', 'High-ticket offers'],
  lengthGuideline: '1500-3000 words',
  conversionFocus: 0.95,
  engagementFocus: 0.7,
  stages: [
    {
      name: 'Problem',
      purpose: 'Identify the core pain point',
      psychologyPrinciple: 'Recognition + Empathy',
      guidelines: [
        'Be specific about the problem',
        'Use their language',
        'Show understanding'
      ]
    },
    {
      name: 'Amplify',
      purpose: 'Deepen understanding of problem cost',
      psychologyPrinciple: 'Loss Aversion',
      guidelines: [
        'Show what\'s at stake',
        'Emotional + logical costs',
        'Future consequences'
      ]
    },
    {
      name: 'Story',
      purpose: 'Share transformation journey',
      psychologyPrinciple: 'Narrative Transportation',
      guidelines: [
        'Personal or customer story',
        'Show before/after',
        'Make it relatable'
      ]
    },
    {
      name: 'Testimonials & Proof',
      purpose: 'Provide social proof',
      psychologyPrinciple: 'Social Proof + Authority',
      guidelines: [
        'Real customer results',
        'Specific outcomes',
        'Photos/videos if possible',
        'Address common objections'
      ]
    },
    {
      name: 'Offer',
      purpose: 'Present your solution clearly',
      psychologyPrinciple: 'Value Perception',
      guidelines: [
        'What they get (features → benefits)',
        'How it works',
        'What makes it unique',
        'Price positioning'
      ]
    },
    {
      name: 'Response',
      purpose: 'Clear CTA with urgency',
      psychologyPrinciple: 'Scarcity + Commitment',
      guidelines: [
        'Remove friction',
        'Add urgency if authentic',
        'Risk reversal (guarantee)',
        'Make action easy'
      ]
    }
  ]
};

// ============================================================================
// FRAMEWORK SELECTOR
// ============================================================================

export class ContentFrameworkLibrary {
  private frameworks: Map<FrameworkType, ContentFramework>;

  constructor() {
    this.frameworks = new Map([
      // Social Media
      [HOOK_STORY_OFFER.id, HOOK_STORY_OFFER],
      [PROBLEM_AGITATE_SOLUTION.id, PROBLEM_AGITATE_SOLUTION],
      [AIDA_SOCIAL.id, AIDA_SOCIAL],
      [BEFORE_AFTER_BRIDGE.id, BEFORE_AFTER_BRIDGE],

      // Email
      [EMAIL_AIDA.id, EMAIL_AIDA],
      [EMAIL_PAS.id, EMAIL_PAS],

      // Blog
      [BLOG_HOW_TO.id, BLOG_HOW_TO],
      [BLOG_LISTICLE.id, BLOG_LISTICLE],

      // Landing Page
      [LANDING_HERO.id, LANDING_HERO],
      [LANDING_PASTOR.id, LANDING_PASTOR]
    ]);
  }

  /**
   * Get framework by ID
   */
  getFramework(id: FrameworkType): ContentFramework | undefined {
    return this.frameworks.get(id);
  }

  /**
   * Get all frameworks for a channel
   */
  getFrameworksByChannel(channel: ContentChannel): ContentFramework[] {
    return Array.from(this.frameworks.values()).filter(f => f.channel === channel);
  }

  /**
   * Select best framework based on insight type, channel, and goal
   */
  selectFramework(
    insight: SynapseInsight,
    channel: ContentChannel,
    goal: ContentGoal,
    platform?: Platform
  ): ContentFramework {
    const channelFrameworks = this.getFrameworksByChannel(channel);

    // Filter by platform if specified
    let candidates = platform
      ? channelFrameworks.filter(f =>
          !f.platforms || f.platforms.includes(platform) || f.platforms.includes('generic')
        )
      : channelFrameworks;

    // Score frameworks based on goal
    const scored = candidates.map(framework => {
      let score = 0;

      // Score based on goal alignment
      if (goal === 'conversion' || goal === 'lead-generation') {
        score += framework.conversionFocus * 10;
      } else if (goal === 'engagement') {
        score += framework.engagementFocus * 10;
      } else {
        // Balanced for awareness/education/trust
        score += (framework.conversionFocus + framework.engagementFocus) * 5;
      }

      // Boost based on insight type
      if (insight.type === 'counter_intuitive' && framework.id.includes('problem')) {
        score += 5;
      }
      if (insight.type === 'predictive_opportunity' && framework.id.includes('before-after')) {
        score += 5;
      }
      if (insight.type === 'deep_psychology' && framework.id.includes('story')) {
        score += 5;
      }

      return { framework, score };
    });

    // Return highest scoring framework
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.framework || channelFrameworks[0];
  }

  /**
   * Get all available frameworks
   */
  getAllFrameworks(): ContentFramework[] {
    return Array.from(this.frameworks.values());
  }

  /**
   * Get framework recommendations for an insight
   */
  getRecommendations(
    insight: SynapseInsight,
    channel: ContentChannel
  ): {
    primary: ContentFramework;
    alternatives: ContentFramework[];
    reasoning: string;
  } {
    const allForChannel = this.getFrameworksByChannel(channel);
    const primary = this.selectFramework(insight, channel, 'conversion');
    const alternatives = allForChannel.filter(f => f.id !== primary.id).slice(0, 2);

    let reasoning = `Selected ${primary.name} because `;
    if (insight.type === 'counter_intuitive') {
      reasoning += 'this insight challenges conventional wisdom, making problem-focused frameworks effective.';
    } else if (insight.type === 'predictive_opportunity') {
      reasoning += 'this insight shows future trends, making transformation frameworks compelling.';
    } else if (insight.type === 'deep_psychology') {
      reasoning += 'this insight reveals psychological drivers, making story-based frameworks engaging.';
    } else {
      reasoning += 'this framework balances conversion and engagement effectively.';
    }

    return {
      primary,
      alternatives,
      reasoning
    };
  }
}

// Export singleton instance
export const frameworkLibrary = new ContentFrameworkLibrary();
