/**
 * Authority Builder Campaign Template
 *
 * 6 pieces over 21 days for establishing expertise and thought leadership.
 * Positions you as the go-to expert in your niche.
 *
 * Expected ROI: 3.5-4.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'authority-builder'

const pieces: CampaignPiece[] = [
  // Establish Expertise (Days 0-4)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Contrarian Take',
    contentType: 'awareness',
    emotionalTrigger: 'surprise',
    objective: 'Challenge conventional wisdom to stand out',
    raceStage: 'reach',
    keyMessage: 'Why everything you know about [topic] is wrong',
    callToAction: 'Agree or disagree? Comment below',
    platforms: ['linkedin', 'twitter', 'blog'],
    estimatedEngagement: 1.6
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 4,
    title: 'The Data Revelation',
    contentType: 'education',
    emotionalTrigger: 'curiosity',
    objective: 'Demonstrate expertise through original insights',
    raceStage: 'reach',
    keyMessage: 'We analyzed [X] and found something surprising',
    callToAction: 'Save for reference',
    platforms: ['linkedin', 'twitter', 'blog', 'email'],
    estimatedEngagement: 1.5
  },

  // Prove Credibility (Days 8-14)
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 8,
    title: 'The Prediction Piece',
    contentType: 'education',
    emotionalTrigger: 'curiosity',
    objective: 'Share forward-looking industry insights',
    raceStage: 'act',
    keyMessage: 'Here\'s what I see coming in [industry] next year',
    callToAction: 'What trends are you seeing? Add yours',
    platforms: ['linkedin', 'twitter', 'blog'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 11,
    title: 'The Case Breakdown',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Demonstrate expertise through detailed analysis',
    raceStage: 'act',
    keyMessage: 'How we achieved [result] - complete breakdown',
    callToAction: 'Want me to analyze your situation? DM me',
    platforms: ['linkedin', 'youtube', 'blog', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 14,
    title: 'The Expert Synthesis',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Curate and add value to existing knowledge',
    raceStage: 'act',
    keyMessage: 'I reviewed [top resources] and here\'s what actually matters',
    callToAction: 'What would you add to this list?',
    platforms: ['linkedin', 'twitter', 'blog'],
    estimatedEngagement: 1.4
  },

  // Offer Expertise (Day 20)
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 20,
    title: 'The Authority Offer',
    contentType: 'offer',
    emotionalTrigger: 'trust',
    objective: 'Convert authority into business opportunity',
    raceStage: 'convert',
    keyMessage: 'Put my [X] years of experience to work for you',
    callToAction: 'Book a strategy session',
    platforms: ['linkedin', 'email'],
    estimatedEngagement: 1.3
  }
]

export const AuthorityBuilderTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Authority Builder Series',
    description: 'Establish thought leadership through contrarian views, data insights, predictions, and expert analysis. Builds long-term credibility.',
    category: 'authority',
    pieceCount: 6,
    durationDays: 21,
    complexity: 'complex',
    bestFor: [
      'Consultants and advisors',
      'B2B service providers',
      'Industry experts',
      'Speakers and authors',
      'Professional services'
    ],
    prerequisites: [
      'Deep domain expertise',
      'Original insights or data',
      'Track record of results',
      'Time to create quality content'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.0,
    engagementLift: 38,
    conversionLift: 32,
    factors: [
      'Thought leadership positioning',
      'Original insight creation',
      'Long-term relationship building',
      'High-value lead attraction',
      'Premium pricing justification'
    ]
  },
  emotionalProgression: [
    'surprise',
    'curiosity',
    'curiosity',
    'validation',
    'empowerment',
    'trust'
  ],
  narrativeArc: 'Contrarian view → Data proof → Future insight → Results proof → Knowledge synthesis → Expert offer',
  successMetrics: [
    'Content engagement and shares',
    'Follower growth (especially decision-makers)',
    'Speaking/podcast invitations',
    'Inbound consultation requests',
    'Quality of leads generated',
    'Average deal size',
    'Media mentions and citations'
  ]
}

export default AuthorityBuilderTemplate
