/**
 * Mock Data for Onboarding V5
 *
 * Realistic sample data for development and testing
 *
 * Created: 2025-11-18
 */

import type { ValueProposition } from './ValuePropositionPage';
import type { CustomerTrigger, BuyerPersona } from './BuyerIntelligencePage';
import type { CoreTruth } from './CoreTruthPage';
import type { Transformation } from './TransformationCascade';
import type { DataSource } from './SourceCitation';

/**
 * Sample Data Sources
 */
export const MOCK_SOURCES: DataSource[] = [
  {
    id: 'src-1',
    type: 'website',
    name: 'Company Website',
    url: 'https://example.com',
    extractedAt: new Date(Date.now() - 3600000),
    reliability: 95,
    dataPoints: 47,
    excerpt: 'We help businesses achieve sustainable growth through strategic consulting and data-driven insights.'
  },
  {
    id: 'src-2',
    type: 'reviews',
    name: 'Google Reviews',
    extractedAt: new Date(Date.now() - 7200000),
    reliability: 90,
    dataPoints: 128,
    excerpt: 'Working with them transformed our business. Revenue increased 40% in just 6 months!'
  },
  {
    id: 'src-3',
    type: 'youtube',
    name: 'YouTube Channel',
    url: 'https://youtube.com/example',
    extractedAt: new Date(Date.now() - 5400000),
    reliability: 85,
    dataPoints: 34,
    excerpt: '5 proven strategies to scale your business without burning out'
  },
  {
    id: 'src-4',
    type: 'social',
    name: 'LinkedIn Posts',
    extractedAt: new Date(Date.now() - 10800000),
    reliability: 80,
    dataPoints: 56,
    excerpt: 'Another client success story: From $500K to $2M ARR in 18 months'
  },
  {
    id: 'src-5',
    type: 'competitor',
    name: 'Competitive Analysis',
    extractedAt: new Date(Date.now() - 14400000),
    reliability: 75,
    dataPoints: 23,
    excerpt: 'Most competitors focus on one-size-fits-all solutions. We identified a gap in personalized strategic advisory.'
  }
];

/**
 * Sample Value Propositions
 */
export const MOCK_VALUE_PROPS: ValueProposition[] = [
  {
    id: 'vp-1',
    statement: 'We turn overwhelmed business owners into confident growth leaders through personalized strategic guidance and proven frameworks.',
    category: 'core',
    confidence: {
      overall: 92,
      dataQuality: 95,
      sourceCount: 5,
      modelAgreement: 89,
      reasoning: 'Strong alignment across multiple data sources with consistent transformation language in reviews and testimonials.'
    },
    sources: [MOCK_SOURCES[0], MOCK_SOURCES[1], MOCK_SOURCES[3]],
    marketPosition: 'Premium specialist - high-touch strategic advisory',
    differentiators: [
      'Personalized 1-on-1 strategic sessions vs generic group programs',
      'Proven frameworks validated across 200+ businesses',
      'Ongoing support and accountability, not just one-time consulting'
    ],
    validated: true
  },
  {
    id: 'vp-2',
    statement: 'We help service businesses scale profitably without sacrificing quality or burning out their teams.',
    category: 'secondary',
    confidence: {
      overall: 85,
      dataQuality: 88,
      sourceCount: 4,
      modelAgreement: 82,
      reasoning: 'Multiple testimonials mention sustainable growth and work-life balance improvements.'
    },
    sources: [MOCK_SOURCES[1], MOCK_SOURCES[2], MOCK_SOURCES[3]],
    marketPosition: 'Value specialist - sustainable growth focus',
    differentiators: [
      'Systems-first approach that reduces founder dependency',
      'Team development integrated with business growth',
      'Profitability metrics tracked alongside revenue'
    ],
    validated: false
  },
  {
    id: 'vp-3',
    statement: 'We empower entrepreneurs to build businesses that fund their dream lifestyles, not consume them.',
    category: 'aspirational',
    confidence: {
      overall: 78,
      dataQuality: 80,
      sourceCount: 3,
      modelAgreement: 76,
      reasoning: 'Strong aspirational language in social media and some testimonials, but less concrete evidence.'
    },
    sources: [MOCK_SOURCES[2], MOCK_SOURCES[3]],
    marketPosition: 'Premium lifestyle - freedom-focused positioning',
    differentiators: [
      'Lifestyle design integrated into business strategy',
      'Work-life harmony metrics as core success indicators',
      'Community of like-minded entrepreneurs building freedom businesses'
    ],
    validated: false
  }
];

/**
 * Sample Customer Triggers
 */
export const MOCK_TRIGGERS: CustomerTrigger[] = [
  {
    id: 'trigger-1',
    type: 'pain',
    description: 'Feeling stuck at current revenue plateau despite working harder',
    urgency: 85,
    frequency: 92,
    emotionalWeight: 78,
    sources: [MOCK_SOURCES[1], MOCK_SOURCES[3]]
  },
  {
    id: 'trigger-2',
    type: 'fear',
    description: 'Fear of burning out before achieving financial freedom',
    urgency: 78,
    frequency: 73,
    emotionalWeight: 88,
    sources: [MOCK_SOURCES[1], MOCK_SOURCES[2]]
  },
  {
    id: 'trigger-3',
    type: 'desire',
    description: 'Want to build a business that runs without constant founder involvement',
    urgency: 70,
    frequency: 81,
    emotionalWeight: 65,
    sources: [MOCK_SOURCES[1], MOCK_SOURCES[3], MOCK_SOURCES[4]]
  },
  {
    id: 'trigger-4',
    type: 'aspiration',
    description: 'Dream of scaling to 7-figures while maintaining quality and team culture',
    urgency: 65,
    frequency: 68,
    emotionalWeight: 72,
    sources: [MOCK_SOURCES[2], MOCK_SOURCES[3]]
  }
];

/**
 * Sample Buyer Personas
 */
export const MOCK_PERSONAS: BuyerPersona[] = [
  {
    id: 'persona-1',
    name: 'Scaling Sarah',
    archetype: 'Mid-sized service business owner ready to scale systematically',
    demographics: {
      ageRange: '35-50',
      income: '$150K-$300K',
      location: 'Urban/Suburban US'
    },
    psychographics: {
      values: ['Quality', 'Sustainability', 'Team culture', 'Work-life balance'],
      fears: ['Losing control', 'Sacrificing quality', 'Burning out team', 'Wasting money on wrong hires'],
      goals: ['Double revenue in 2 years', 'Build systems', 'Take a 2-week vacation', 'Hire senior leadership']
    },
    decisionDrivers: {
      emotional: 60,
      rational: 30,
      social: 10
    },
    confidence: {
      overall: 88,
      dataQuality: 90,
      sourceCount: 4,
      modelAgreement: 86,
      reasoning: 'Consistent persona across multiple data sources with strong supporting evidence'
    }
  },
  {
    id: 'persona-2',
    name: 'Overwhelmed Oliver',
    archetype: 'Solo entrepreneur wearing too many hats',
    demographics: {
      ageRange: '30-45',
      income: '$75K-$150K',
      location: 'Anywhere (remote business)'
    },
    psychographics: {
      values: ['Freedom', 'Flexibility', 'Impact', 'Learning'],
      fears: ['Staying stuck', 'Missing opportunities', 'Financial instability', 'Regret'],
      goals: ['Systemize business', 'Hire first employee', 'Increase profitability', 'Reduce hours worked']
    },
    decisionDrivers: {
      emotional: 70,
      rational: 20,
      social: 10
    },
    confidence: {
      overall: 82,
      dataQuality: 85,
      sourceCount: 3,
      modelAgreement: 79,
      reasoning: 'Strong pain point language in reviews and testimonials'
    }
  }
];

/**
 * Sample Transformations
 */
export const MOCK_TRANSFORMATIONS: Transformation[] = [
  {
    id: 'trans-1',
    painPoint: 'Stuck at $500K revenue plateau, working 70+ hours/week',
    pleasureGoal: 'Scaled to $2M revenue, working 40 hours/week with empowered team',
    mechanism: 'Strategic assessment → Systems design → Team empowerment → Scale execution',
    clarity: 85,
    confidence: {
      overall: 85,
      dataQuality: 80,
      sourceCount: 15,
      modelAgreement: 90,
      reasoning: 'High confidence based on 15 similar case studies and consistent outcomes across implementations'
    }
  },
  {
    id: 'trans-2',
    painPoint: 'Solo entrepreneur doing everything, inconsistent income',
    pleasureGoal: 'Predictable $250K revenue with automated systems',
    mechanism: 'Process documentation → Automation → Strategic delegation',
    clarity: 78,
    confidence: {
      overall: 78,
      dataQuality: 75,
      sourceCount: 12,
      modelAgreement: 85,
      reasoning: 'Strong evidence from 12 similar implementations in solo-to-team transitions'
    }
  }
];

/**
 * Sample Core Truth
 */
export const MOCK_CORE_TRUTH: CoreTruth = {
  id: 'core-truth-1',
  narrative: 'We believe every business owner deserves to build a company that serves their life, not consumes it. Through personalized strategic guidance and proven systems, we transform overwhelmed entrepreneurs into confident leaders who scale profitably while reclaiming their time and sanity.',
  tagline: 'Build a business that fuels your life, not burns it.',
  positioning: 'Premium strategic advisory for service business owners (500K-2M) who want sustainable, profitable growth without sacrificing their wellbeing or team culture.',
  messagingPillars: [
    {
      id: 'pillar-1',
      title: 'Sustainable Growth',
      description: 'Scale revenue without sacrificing quality, team culture, or your sanity',
      supportingPoints: [
        'Systems-first approach reduces founder dependency',
        'Team empowerment built into growth strategy',
        'Profitability tracked alongside revenue metrics'
      ],
      whenToUse: 'When addressing burnout concerns or sustainable scaling questions'
    },
    {
      id: 'pillar-2',
      title: 'Personalized Strategy',
      description: 'Custom frameworks tailored to your business, not cookie-cutter programs',
      supportingPoints: [
        '1-on-1 strategic planning sessions',
        'Industry-specific best practices',
        'Flexible implementation timelines'
      ],
      whenToUse: 'When differentiating from generic group programs or DIY courses'
    },
    {
      id: 'pillar-3',
      title: 'Proven Systems',
      description: 'Battle-tested frameworks validated across 200+ successful businesses',
      supportingPoints: [
        'Average 3x revenue growth in 18 months',
        '40% reduction in founder working hours',
        '95% client satisfaction rate'
      ],
      whenToUse: 'When establishing credibility and managing risk concerns'
    },
    {
      id: 'pillar-4',
      title: 'Ongoing Partnership',
      description: 'Continuous support and accountability, not one-and-done consulting',
      supportingPoints: [
        'Weekly check-ins during implementation',
        'Quarterly strategic reviews',
        'Access to private community of growth-focused owners'
      ],
      whenToUse: 'When addressing implementation concerns or need for support'
    }
  ],
  brandVoice: {
    personality: ['Confident', 'Empathetic', 'Direct', 'Supportive'],
    tone: ['Professional yet approachable', 'Data-informed but human', 'Ambitious but realistic'],
    avoidWords: ['Hustle', 'Grind', 'Crushing it', 'Disruption', 'Guru']
  },
  keyTransformation: MOCK_TRANSFORMATIONS[0],
  confidence: {
    overall: 90,
    dataQuality: 92,
    sourceCount: 5,
    modelAgreement: 88,
    reasoning: 'Strong consensus across all data sources with validated outcomes and clear differentiation'
  }
};

/**
 * Complete mock onboarding data
 */
export const MOCK_ONBOARDING_DATA = {
  businessName: 'Strategic Growth Partners',
  industry: 'Business Consulting',
  eqScore: 72,
  valuePropositions: MOCK_VALUE_PROPS,
  customerTriggers: MOCK_TRIGGERS,
  buyerPersonas: MOCK_PERSONAS,
  transformations: MOCK_TRANSFORMATIONS,
  coreTruth: MOCK_CORE_TRUTH
};
