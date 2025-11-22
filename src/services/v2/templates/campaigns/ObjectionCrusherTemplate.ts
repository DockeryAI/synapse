/**
 * Objection Crusher Campaign Template
 *
 * 5 pieces over 14 days for systematic barrier removal.
 * Addresses and neutralizes purchase hesitations.
 *
 * Expected ROI: 3.5-4.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'objection-crusher'

const pieces: CampaignPiece[] = [
  // Surface Objections (Day 0)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Elephant in the Room',
    contentType: 'awareness',
    emotionalTrigger: 'validation',
    objective: 'Acknowledge common hesitations openly',
    raceStage: 'reach',
    keyMessage: 'Let\'s talk about what\'s really stopping you from [outcome]',
    callToAction: 'Which of these resonates with you? Comment below',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.5
  },

  // Address Objections (Days 4-10)
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 4,
    title: 'The Price Objection',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Reframe cost as investment',
    raceStage: 'act',
    keyMessage: 'The true cost of NOT investing in [solution]',
    callToAction: 'Calculate your real cost of inaction',
    platforms: ['linkedin', 'facebook', 'blog', 'email'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 7,
    title: 'The Time Objection',
    contentType: 'proof',
    emotionalTrigger: 'relief',
    objective: 'Show how busy people succeed',
    raceStage: 'act',
    keyMessage: 'How [Client] achieved [result] with only [minimal time]',
    callToAction: 'Busy people get results too. Here\'s how',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 10,
    title: 'The Risk Objection',
    contentType: 'education',
    emotionalTrigger: 'relief',
    objective: 'Remove perceived risk',
    raceStage: 'convert',
    keyMessage: 'Why this is actually the lowest-risk option',
    callToAction: 'See our guarantee',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.4
  },

  // Final Push (Day 13)
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 13,
    title: 'The No-Brainer Offer',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Present risk-free way to proceed',
    raceStage: 'convert',
    keyMessage: 'We\'ve removed every barrier. Here\'s how to start risk-free',
    callToAction: 'Start with our guarantee',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.5
  }
]

export const ObjectionCrusherTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Objection Crusher Series',
    description: 'Systematically address and neutralize the top objections that prevent purchase. Turns hesitations into confidence.',
    category: 'conversion',
    pieceCount: 5,
    durationDays: 14,
    complexity: 'moderate',
    bestFor: [
      'High-ticket sales',
      'Stalled pipelines',
      'Skeptical audiences',
      'Competitive markets',
      'New or unfamiliar solutions'
    ],
    prerequisites: [
      'Clear understanding of objections',
      'Proof points for each objection',
      'Strong guarantee or risk reversal',
      'ROI data for cost objection'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.0,
    engagementLift: 38,
    conversionLift: 40,
    factors: [
      'Direct objection handling',
      'Progressive confidence building',
      'Risk removal',
      'ROI clarification',
      'Clear path to action'
    ]
  },
  emotionalProgression: [
    'validation',
    'empowerment',
    'relief',
    'relief',
    'hope'
  ],
  narrativeArc: 'Acknowledge hesitations → Reframe cost → Handle time → Remove risk → Risk-free action',
  successMetrics: [
    'Comment engagement on objections',
    'Content resonance (saves, shares)',
    'Pipeline movement',
    'Conversion rate improvement',
    'Time to conversion reduction',
    'Quality of sales conversations'
  ]
}

export default ObjectionCrusherTemplate
