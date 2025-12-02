/**
 * Quick Win Campaign Template
 *
 * 4 pieces over 7 days for rapid momentum building.
 * Fast-paced campaign for immediate results.
 *
 * Expected ROI: 3.0-4.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'quick-win'

const pieces: CampaignPiece[] = [
  // Day 1: Immediate Value
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Instant Win',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Deliver immediate, actionable value',
    raceStage: 'reach',
    keyMessage: 'Do this ONE thing today to [quick result]',
    callToAction: 'Try it and report back',
    platforms: ['linkedin', 'twitter', 'instagram', 'facebook'],
    estimatedEngagement: 1.6
  },

  // Day 3: Build on Win
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 2,
    title: 'The Quick Results',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Show others getting quick wins',
    raceStage: 'act',
    keyMessage: 'People who did this yesterday already seeing [results]',
    callToAction: 'Join them today',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.5
  },

  // Day 5: Amplify
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 4,
    title: 'The Level Up',
    contentType: 'education',
    emotionalTrigger: 'excitement',
    objective: 'Show how to get bigger results',
    raceStage: 'act',
    keyMessage: 'Ready for 10x results? Here\'s the next step',
    callToAction: 'Get the full framework',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.4
  },

  // Day 7: Convert
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 6,
    title: 'The Fast Track',
    contentType: 'offer',
    emotionalTrigger: 'urgency',
    objective: 'Convert momentum into action',
    raceStage: 'convert',
    keyMessage: 'Skip the learning curve and get results faster',
    callToAction: 'Get started now',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.5
  }
]

export const QuickWinCampaignTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Quick Win Campaign',
    description: 'Fast-paced 7-day campaign that builds momentum through immediate value and quick results. Perfect for energizing audiences.',
    category: 'conversion',
    pieceCount: 4,
    durationDays: 7,
    complexity: 'simple',
    bestFor: [
      'Lead magnets',
      'Low-ticket offers',
      'Email list building',
      'Re-engagement campaigns',
      'Momentum building'
    ],
    prerequisites: [
      'Simple, actionable tip to share',
      'Quick-result proof available',
      'Low-friction offer ready',
      'Fast response capability'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 3.5,
    engagementLift: 42,
    conversionLift: 35,
    factors: [
      'Immediate value delivery',
      'Quick social proof',
      'Momentum psychology',
      'Low-friction conversion',
      'High engagement rate'
    ]
  },
  emotionalProgression: [
    'empowerment',
    'validation',
    'excitement',
    'urgency'
  ],
  narrativeArc: 'Instant value → Social proof → Level up tease → Fast-track offer',
  successMetrics: [
    'Immediate engagement (reactions, comments)',
    'Action rate (people trying the tip)',
    'User-generated results content',
    'Email captures',
    'Conversion to offer',
    'Campaign velocity'
  ]
}

export default QuickWinCampaignTemplate
