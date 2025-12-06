/**
 * B2B Cortex Principles
 *
 * 5 additional psychology principles specific to B2B buyers.
 * Based on research: FOMU > FOMO, Personal Value > Business Value.
 */

export interface CortexPrinciple {
  id: string;
  name: string;
  description: string;
  brainResponse: string;
  application: string;
  examples: string[];
}

/**
 * Original 9 B2C Principles (from V1)
 */
export const B2C_PRINCIPLES: CortexPrinciple[] = [
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Create information gap that demands closure',
    brainResponse: 'Dopamine release',
    application: 'Headlines, hooks, subject lines',
    examples: [
      "You won't believe what we found about X",
      "The one thing successful [role]s do differently",
    ],
  },
  {
    id: 'narrative-transportation',
    name: 'Narrative Transportation',
    description: 'Story structure that pulls reader into another world',
    brainResponse: 'Multiple brain regions activate',
    application: 'Case studies, testimonials, origin stories',
    examples: [
      "problem→insight→solution arc",
      "Before/after transformation",
    ],
  },
  {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Others like me have done this',
    brainResponse: 'Decision shortcut activation',
    application: 'Testimonials, logos, numbers',
    examples: [
      "10,000+ companies trust us",
      "Join industry leaders like X, Y, Z",
    ],
  },
  {
    id: 'authority',
    name: 'Authority',
    description: 'Expert or institution endorsement',
    brainResponse: 'Trust center activation',
    application: 'Expert quotes, certifications, research',
    examples: [
      "Research shows X",
      "As featured in Forbes, TechCrunch",
    ],
  },
  {
    id: 'cognitive-dissonance',
    name: 'Cognitive Dissonance',
    description: 'Belief conflict that demands resolution',
    brainResponse: 'Conflict detection',
    application: 'Contrarian angles, myth-busting',
    examples: [
      "Everything you know about X is backwards",
      "Why the common approach to Y fails",
    ],
  },
  {
    id: 'pattern-interrupt',
    name: 'Pattern Interrupt',
    description: 'Break expectations to capture attention',
    brainResponse: 'Switches autopilot off',
    application: 'Opening statements, ad creative',
    examples: [
      "Stop scrolling. This is important.",
      "Ignore everything you've heard about X",
    ],
  },
  {
    id: 'scarcity',
    name: 'Scarcity',
    description: 'Limited availability increases value',
    brainResponse: 'Amygdala activation',
    application: 'Offers, launches, deadlines',
    examples: [
      "Only X spots available",
      "Offer ends Friday",
    ],
  },
  {
    id: 'reciprocity',
    name: 'Reciprocity',
    description: 'Give value first, receive later',
    brainResponse: 'Social bonding',
    application: 'Free resources, value-first content',
    examples: [
      "Free guide: How to X",
      "Here's everything we learned about Y",
    ],
  },
  {
    id: 'loss-aversion',
    name: 'Loss Aversion',
    description: 'Losses hurt 2.5x more than equivalent gains',
    brainResponse: 'Pain center activation',
    application: 'Cost comparisons, risk framing',
    examples: [
      "Don't miss X beats Get X",
      "What you're losing every day without Y",
    ],
  },
];

/**
 * 5 Additional B2B Principles
 */
export const B2B_PRINCIPLES: CortexPrinciple[] = [
  {
    id: 'career-safety',
    name: 'Career Safety',
    description: 'FOMU - Fear of Messing Up (2x stronger than FOMO)',
    brainResponse: 'Self-preservation instinct',
    application: 'Risk mitigation, trusted brands, case studies',
    examples: [
      "Never be blamed for this decision",
      "The safe choice that performs",
      "Join 500+ companies who made this switch",
    ],
  },
  {
    id: 'consensus-enabling',
    name: 'Consensus Enabling',
    description: 'Make it easy to sell internally (avg 11 stakeholders)',
    brainResponse: 'Social coordination',
    application: 'Shareable assets, executive summaries, ROI calcs',
    examples: [
      "Easy to defend to stakeholders",
      "One-page summary for your CFO",
      "Built-in ROI calculator for board presentations",
    ],
  },
  {
    id: 'status-quo-risk',
    name: 'Status Quo Risk',
    description: 'The cost of doing nothing (40-60% deals end in no-decision)',
    brainResponse: 'Inertia override',
    application: 'Cost of inaction, competitive risk, market timing',
    examples: [
      "The cost of doing nothing is X per month",
      "While you wait, competitors are...",
      "Every day without Y costs your team Z hours",
    ],
  },
  {
    id: 'personal-value',
    name: 'Personal Value',
    description: 'Career impact > business value (CEB research: 2x more influential)',
    brainResponse: 'Self-interest alignment',
    application: 'Career advancement, reduced stress, recognition',
    examples: [
      "Be the one who brought this to the team",
      "Reduce your weekend firefighting by 80%",
      "The tool that got her promoted",
    ],
  },
  {
    id: 'risk-mitigation',
    name: 'Risk Mitigation',
    description: 'B2B buyers risk careers, not just money',
    brainResponse: 'Threat reduction',
    application: 'Pilots, phased rollouts, guarantees, support',
    examples: [
      "Start with a 30-day pilot, no commitment",
      "Dedicated success manager from day 1",
      "Money-back guarantee if you don't see results",
    ],
  },
];

/**
 * All 14 Cortex Principles
 */
export const ALL_PRINCIPLES = [...B2C_PRINCIPLES, ...B2B_PRINCIPLES];

/**
 * Get principle by ID
 */
export function getPrinciple(id: string): CortexPrinciple | undefined {
  return ALL_PRINCIPLES.find(p => p.id === id);
}

/**
 * Get principles by IDs
 */
export function getPrinciples(ids: string[]): CortexPrinciple[] {
  return ids.map(id => getPrinciple(id)).filter(Boolean) as CortexPrinciple[];
}
