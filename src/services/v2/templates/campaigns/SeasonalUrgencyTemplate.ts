/**
 * Seasonal Urgency Campaign Template
 *
 * 5 pieces over 10 days for time-sensitive seasonal pushes.
 * Optimized for Black Friday, holidays, end-of-year, etc.
 *
 * Expected ROI: 4.5-6.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'seasonal-urgency'

const pieces: CampaignPiece[] = [
  // Pre-Season Alert (Day 0)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Seasonal Hook',
    contentType: 'awareness',
    emotionalTrigger: 'excitement',
    objective: 'Connect offering to seasonal moment',
    raceStage: 'reach',
    keyMessage: '[Season/Event] is here, and it\'s the perfect time to [outcome]',
    callToAction: 'Save this post for [date]',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
    estimatedEngagement: 1.5
  },

  // Build Urgency (Days 3-5)
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Countdown Begins',
    contentType: 'urgency',
    emotionalTrigger: 'urgency',
    objective: 'Create time pressure',
    raceStage: 'act',
    keyMessage: 'Only [X] days until [offer/event/deadline]',
    callToAction: 'Get on the early list now',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 5,
    title: 'The Value Stack',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Present the full seasonal offer',
    raceStage: 'act',
    keyMessage: 'Everything included in our [Season] special',
    callToAction: 'Claim your [Season] deal',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.6
  },

  // Peak Urgency (Days 7-9)
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 7,
    title: 'The Social Proof Blitz',
    contentType: 'proof',
    emotionalTrigger: 'fear',
    objective: 'Show what others are getting',
    raceStage: 'convert',
    keyMessage: '[X] people have already grabbed this deal',
    callToAction: 'Don\'t miss out - join them',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
    estimatedEngagement: 1.7
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 9,
    title: 'The Final Countdown',
    contentType: 'urgency',
    emotionalTrigger: 'urgency',
    objective: 'Drive final conversions',
    raceStage: 'convert',
    keyMessage: 'Hours left: [Offer] ends at midnight',
    callToAction: 'Last chance - act now',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.9
  }
]

export const SeasonalUrgencyTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Seasonal Urgency Campaign',
    description: 'Fast-paced seasonal campaign with built-in deadlines and FOMO triggers. Perfect for holiday sales and time-limited promotions.',
    category: 'launch',
    pieceCount: 5,
    durationDays: 10,
    complexity: 'simple',
    bestFor: [
      'Black Friday/Cyber Monday',
      'Holiday promotions',
      'End of year sales',
      'Seasonal services',
      'Limited-time offers',
      'Event-based marketing'
    ],
    prerequisites: [
      'Clear deadline or season',
      'Special offer or discount',
      'Inventory or capacity limits (real or perceived)',
      'Fast checkout/purchase process'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 5.2,
    engagementLift: 48,
    conversionLift: 55,
    factors: [
      'Natural deadline urgency',
      'Seasonal buying intent',
      'FOMO mechanics',
      'Concentrated campaign period',
      'High frequency touchpoints'
    ]
  },
  emotionalProgression: [
    'excitement',
    'urgency',
    'hope',
    'fear',
    'urgency'
  ],
  narrativeArc: 'Seasonal connection → Countdown start → Full offer reveal → Social proof → Final push',
  successMetrics: [
    'Early list signups',
    'Daily conversion rate',
    'Email open rates during campaign',
    'Peak day revenue',
    'Total campaign revenue',
    'Average order value',
    'Cart abandonment recovery'
  ]
}

export default SeasonalUrgencyTemplate
