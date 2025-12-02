/**
 * Product Launch Campaign Template
 *
 * 7 pieces over 14 days following Tease → Reveal → Close structure.
 * Optimized for new product/service launches with momentum building.
 *
 * Expected ROI: 4.0-5.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'product-launch'

const pieces: CampaignPiece[] = [
  // TEASE Phase (Days 0-4)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Cryptic Tease',
    contentType: 'awareness',
    emotionalTrigger: 'curiosity',
    objective: 'Create intrigue and anticipation',
    raceStage: 'reach',
    keyMessage: 'Something big is coming that will change how you [outcome]',
    callToAction: 'Turn on notifications to be first to know',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 2,
    title: 'The Problem Statement',
    contentType: 'awareness',
    emotionalTrigger: 'validation',
    objective: 'Remind audience of the problem you\'re solving',
    raceStage: 'reach',
    keyMessage: 'You\'ve been dealing with [problem] for too long',
    callToAction: 'Tag someone who needs to see this',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 4,
    title: 'The Behind-the-Scenes',
    contentType: 'story',
    emotionalTrigger: 'trust',
    objective: 'Build connection through process transparency',
    raceStage: 'reach',
    keyMessage: 'Here\'s why we built [product] and what went into it',
    callToAction: 'What feature matters most to you?',
    platforms: ['linkedin', 'instagram', 'youtube'],
    estimatedEngagement: 1.4
  },

  // REVEAL Phase (Days 6-9)
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 6,
    title: 'The Big Reveal',
    contentType: 'offer',
    emotionalTrigger: 'excitement',
    objective: 'Launch the product with impact',
    raceStage: 'act',
    keyMessage: 'Introducing [Product]: The [transformation] you\'ve been waiting for',
    callToAction: 'Get early access now (link in bio)',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter', 'email'],
    estimatedEngagement: 1.8
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 8,
    title: 'The Deep Dive',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Explain key features and benefits',
    raceStage: 'act',
    keyMessage: 'Everything you need to know about [Product]',
    callToAction: 'Watch the full walkthrough',
    platforms: ['linkedin', 'youtube', 'blog', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 9,
    title: 'The Early Results',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Show first customer wins',
    raceStage: 'convert',
    keyMessage: 'What early users are saying about [Product]',
    callToAction: 'Join them today',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
    estimatedEngagement: 1.6
  },

  // CLOSE Phase (Day 13)
  {
    id: createPieceId(TEMPLATE_ID, 7),
    dayOffset: 13,
    title: 'The Final Call',
    contentType: 'urgency',
    emotionalTrigger: 'urgency',
    objective: 'Drive final conversions with deadline',
    raceStage: 'convert',
    keyMessage: 'Last chance to get [special offer/early pricing]',
    callToAction: 'Get it now before price increases',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.7
  }
]

export const ProductLaunchTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Product Launch Sequence',
    description: 'High-energy launch campaign with tease, reveal, and close phases. Builds anticipation and drives concentrated action.',
    category: 'launch',
    pieceCount: 7,
    durationDays: 14,
    complexity: 'moderate',
    bestFor: [
      'New product launches',
      'Course releases',
      'Software launches',
      'Book releases',
      'Event announcements'
    ],
    prerequisites: [
      'Product/offer ready to go',
      'Landing page or sales page',
      'Early access or launch offer',
      'Email list for announcements'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.5,
    engagementLift: 55,
    conversionLift: 48,
    factors: [
      'Anticipation building',
      'Concentrated attention',
      'Social proof during launch',
      'Urgency mechanics',
      'Multi-channel saturation'
    ]
  },
  emotionalProgression: [
    'curiosity',
    'validation',
    'trust',
    'excitement',
    'empowerment',
    'validation',
    'urgency'
  ],
  narrativeArc: 'Mystery → Problem reminder → Process peek → Big reveal → Education → Social proof → Final push',
  successMetrics: [
    'Pre-launch engagement and signups',
    'Launch day traffic and conversions',
    'Email open and click rates',
    'Social shares during reveal',
    'Total launch revenue',
    'Customer acquisition cost',
    'Post-launch retention'
  ]
}

export default ProductLaunchTemplate
