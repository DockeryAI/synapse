/**
 * Value Stack Campaign Template
 *
 * 6 pieces over 14 days for ROI demonstration.
 * Builds perceived value before revealing price.
 *
 * Expected ROI: 4.0-5.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'value-stack'

const pieces: CampaignPiece[] = [
  // Establish the Problem Cost (Day 0)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The True Cost',
    contentType: 'awareness',
    emotionalTrigger: 'fear',
    objective: 'Quantify the cost of the problem',
    raceStage: 'reach',
    keyMessage: 'Not solving [problem] is costing you $[X] per [period]',
    callToAction: 'Calculate your cost (link in bio)',
    platforms: ['linkedin', 'facebook', 'twitter'],
    estimatedEngagement: 1.4
  },

  // Stack the Value (Days 3-10)
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Core Value',
    contentType: 'education',
    emotionalTrigger: 'hope',
    objective: 'Present core offer value',
    raceStage: 'act',
    keyMessage: 'The [main deliverable] alone is worth $[X] because...',
    callToAction: 'This is just the beginning',
    platforms: ['linkedin', 'facebook', 'blog', 'email'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 6,
    title: 'The Bonus Stack',
    contentType: 'education',
    emotionalTrigger: 'excitement',
    objective: 'Add bonus values to the stack',
    raceStage: 'act',
    keyMessage: 'Plus you get [bonus 1] ($X value) and [bonus 2] ($Y value)',
    callToAction: 'Full value stack coming soon',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 9,
    title: 'The ROI Proof',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Show real ROI from customers',
    raceStage: 'act',
    keyMessage: '[Client] invested $[X] and got $[10X] in return',
    callToAction: 'See the full case study',
    platforms: ['linkedin', 'facebook', 'blog', 'email'],
    estimatedEngagement: 1.6
  },

  // Reveal and Convert (Days 12-13)
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 12,
    title: 'The Price Reveal',
    contentType: 'offer',
    emotionalTrigger: 'surprise',
    objective: 'Reveal price against stacked value',
    raceStage: 'convert',
    keyMessage: 'Total value: $[big number]. Your investment: $[small number]',
    callToAction: 'Get everything for [fraction of value]',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.6
  },
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 13,
    title: 'The Easy Yes',
    contentType: 'offer',
    emotionalTrigger: 'relief',
    objective: 'Make the decision feel obvious',
    raceStage: 'convert',
    keyMessage: 'When the ROI is this clear, it\'s an easy decision',
    callToAction: 'Get started today',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.4
  }
]

export const ValueStackTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Value Stack Campaign',
    description: 'Build overwhelming perceived value before price reveal. Makes investment feel like a no-brainer through ROI demonstration.',
    category: 'conversion',
    pieceCount: 6,
    durationDays: 14,
    complexity: 'moderate',
    bestFor: [
      'High-ticket offers',
      'Course/program launches',
      'Service packages',
      'B2B sales',
      'Consulting engagements'
    ],
    prerequisites: [
      'Clear value components',
      'Quantifiable ROI',
      'Customer ROI proof',
      'Bonuses to stack'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.5,
    engagementLift: 40,
    conversionLift: 45,
    factors: [
      'Value anchoring',
      'ROI justification',
      'Progressive value building',
      'Price contrast psychology',
      'Social proof of returns'
    ]
  },
  emotionalProgression: [
    'fear',
    'hope',
    'excitement',
    'validation',
    'surprise',
    'relief'
  ],
  narrativeArc: 'Problem cost → Core value → Bonus stack → ROI proof → Price reveal → Easy decision',
  successMetrics: [
    'Engagement on value content',
    'Calculator/tool usage',
    'Click-through on proof',
    'Price reveal engagement',
    'Conversion rate',
    'Average order value',
    'Objection reduction in sales calls'
  ]
}

export default ValueStackTemplate
