/**
 * Scarcity Sequence Campaign Template
 *
 * 5 pieces over 10 days for urgency-driven conversions.
 * Uses legitimate scarcity and deadlines to drive action.
 *
 * Expected ROI: 4.0-5.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'scarcity-sequence'

const pieces: CampaignPiece[] = [
  // Announce Scarcity (Day 0)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Limited Opportunity',
    contentType: 'awareness',
    emotionalTrigger: 'curiosity',
    objective: 'Announce the limited opportunity',
    raceStage: 'reach',
    keyMessage: 'Opening [X] spots for [offer] - first time in [period]',
    callToAction: 'Get on the priority list',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.5
  },

  // Build Value (Days 3-5)
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Why Now',
    contentType: 'education',
    emotionalTrigger: 'fear',
    objective: 'Explain why timing matters',
    raceStage: 'act',
    keyMessage: 'Why waiting costs you more than the investment',
    callToAction: 'Don\'t let this slip away',
    platforms: ['linkedin', 'facebook', 'blog', 'email'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 5,
    title: 'The Fast Mover Proof',
    contentType: 'proof',
    emotionalTrigger: 'urgency',
    objective: 'Show early buyers and results',
    raceStage: 'act',
    keyMessage: '[X] spots already claimed - here\'s who jumped in',
    callToAction: '[Y] spots remaining - claim yours',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
    estimatedEngagement: 1.6
  },

  // Final Push (Days 8-9)
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 8,
    title: 'The Last Call',
    contentType: 'urgency',
    emotionalTrigger: 'urgency',
    objective: 'Create final urgency push',
    raceStage: 'convert',
    keyMessage: 'Final [X] spots closing in 48 hours',
    callToAction: 'Secure your spot now',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.7
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 9,
    title: 'The Door Closing',
    contentType: 'urgency',
    emotionalTrigger: 'fear',
    objective: 'Final conversion push',
    raceStage: 'convert',
    keyMessage: 'Last chance - doors close at midnight',
    callToAction: 'Don\'t miss out - act now',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.9
  }
]

export const ScarcitySequenceTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Scarcity Sequence',
    description: 'Urgency-driven campaign using legitimate scarcity (spots, time, bonuses) to accelerate decisions. High-conversion for deadline-driven offers.',
    category: 'conversion',
    pieceCount: 5,
    durationDays: 10,
    complexity: 'simple',
    bestFor: [
      'Cohort-based programs',
      'Limited availability services',
      'Bonus/pricing deadlines',
      'Event registrations',
      'Seasonal offers'
    ],
    prerequisites: [
      'Legitimate scarcity (capacity, time, price)',
      'Clear deadline',
      'Strong offer value',
      'Systems to track availability'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.8,
    engagementLift: 45,
    conversionLift: 52,
    factors: [
      'Urgency psychology',
      'FOMO activation',
      'Decision acceleration',
      'Concentrated action',
      'High conversion rate'
    ]
  },
  emotionalProgression: [
    'curiosity',
    'fear',
    'urgency',
    'urgency',
    'fear'
  ],
  narrativeArc: 'Limited opportunity → Cost of waiting → Social proof → Countdown → Final push',
  successMetrics: [
    'Waitlist signups',
    'Daily conversion rate',
    'Revenue per day curve',
    'Final day conversion spike',
    'Total campaign revenue',
    'Average order value',
    'Cart completion rate'
  ]
}

export default ScarcitySequenceTemplate
