/**
 * RACE Journey Campaign Template
 *
 * 7 pieces over 21 days following the RACE framework:
 * Reach → Act → Convert → Engage
 *
 * The most successful overall campaign structure based on Content Bible data.
 * Expected ROI: 3.5-4.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'race-journey'

const pieces: CampaignPiece[] = [
  // REACH Phase (Days 0-3)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Attention Grabber',
    contentType: 'awareness',
    emotionalTrigger: 'curiosity',
    objective: 'Capture attention and build initial awareness',
    raceStage: 'reach',
    keyMessage: 'A surprising truth about [problem/opportunity]',
    callToAction: 'Follow for more insights',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Problem Illuminator',
    contentType: 'awareness',
    emotionalTrigger: 'fear',
    objective: 'Deepen understanding of the problem',
    raceStage: 'reach',
    keyMessage: 'Here\'s what happens when you ignore [problem]',
    callToAction: 'Save this for later',
    platforms: ['linkedin', 'facebook', 'blog'],
    estimatedEngagement: 1.3
  },

  // ACT Phase (Days 6-10)
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 6,
    title: 'The Education Drop',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Provide actionable value',
    raceStage: 'act',
    keyMessage: '3 things you can do right now to [benefit]',
    callToAction: 'Try this today and tell me how it goes',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 10,
    title: 'The Deep Dive',
    contentType: 'education',
    emotionalTrigger: 'curiosity',
    objective: 'Establish expertise through depth',
    raceStage: 'act',
    keyMessage: 'The complete framework for [outcome]',
    callToAction: 'Comment "guide" to get the full breakdown',
    platforms: ['linkedin', 'blog', 'email'],
    estimatedEngagement: 1.4
  },

  // CONVERT Phase (Days 13-17)
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 13,
    title: 'The Social Proof',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Build credibility through results',
    raceStage: 'convert',
    keyMessage: 'How [client] achieved [specific result]',
    callToAction: 'Want similar results? Link in bio',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.6
  },
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 17,
    title: 'The Offer',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Present solution with clear value',
    raceStage: 'convert',
    keyMessage: 'Here\'s how we can help you [achieve outcome]',
    callToAction: 'Book a call / Get started today',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.3
  },

  // ENGAGE Phase (Day 20)
  {
    id: createPieceId(TEMPLATE_ID, 7),
    dayOffset: 20,
    title: 'The Community Builder',
    contentType: 'engagement',
    emotionalTrigger: 'pride',
    objective: 'Foster loyalty and advocacy',
    raceStage: 'engage',
    keyMessage: 'Welcome to our community of [transformation seekers]',
    callToAction: 'Share your biggest challenge below',
    platforms: ['facebook', 'instagram', 'email'],
    estimatedEngagement: 1.7
  }
]

export const RACEJourneyTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'RACE Journey Campaign',
    description: 'Full-funnel campaign following Reach → Act → Convert → Engage framework. Proven to deliver consistent results across industries.',
    category: 'core-journey',
    pieceCount: 7,
    durationDays: 21,
    complexity: 'moderate',
    bestFor: [
      'New product/service awareness',
      'Brand building',
      'Lead generation',
      'Service businesses',
      'B2B companies'
    ],
    prerequisites: [
      'Clear value proposition',
      'At least one customer testimonial',
      'Lead capture mechanism'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.0,
    engagementLift: 45,
    conversionLift: 38,
    factors: [
      'Full funnel coverage',
      'Psychological sequencing',
      'Multiple touchpoints',
      'Social proof integration',
      'Clear conversion path'
    ]
  },
  emotionalProgression: [
    'curiosity',
    'fear',
    'empowerment',
    'curiosity',
    'validation',
    'hope',
    'pride'
  ],
  narrativeArc: 'Discovery → Problem awareness → Capability building → Proof → Solution → Community',
  successMetrics: [
    'Reach growth (followers, impressions)',
    'Engagement rate per piece',
    'Click-through to website/landing page',
    'Lead captures',
    'Conversion to customers',
    'Community engagement (comments, shares)'
  ]
}

export default RACEJourneyTemplate
