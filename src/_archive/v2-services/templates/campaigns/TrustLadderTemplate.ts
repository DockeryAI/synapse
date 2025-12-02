/**
 * Trust Ladder Campaign Template
 *
 * 7 pieces over 28 days for progressive trust building.
 * Ideal for high-consideration purchases and skeptical audiences.
 *
 * Expected ROI: 4.0-5.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'trust-ladder'

const pieces: CampaignPiece[] = [
  // Rung 1: Awareness (Day 0)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Credibility Introduction',
    contentType: 'awareness',
    emotionalTrigger: 'curiosity',
    objective: 'Establish initial credibility without selling',
    raceStage: 'reach',
    keyMessage: 'Here\'s something most people get wrong about [topic]',
    callToAction: 'Follow for more contrarian insights',
    platforms: ['linkedin', 'facebook', 'twitter'],
    estimatedEngagement: 1.3
  },

  // Rung 2: Education (Days 4-8)
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 4,
    title: 'The Free Value Drop',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Provide genuine value with no strings',
    raceStage: 'reach',
    keyMessage: 'Complete guide to [valuable skill/knowledge]',
    callToAction: 'Save this for later',
    platforms: ['linkedin', 'facebook', 'blog', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 8,
    title: 'The Behind-the-Scenes',
    contentType: 'story',
    emotionalTrigger: 'trust',
    objective: 'Show authenticity and process transparency',
    raceStage: 'act',
    keyMessage: 'Here\'s exactly how we [process/approach]',
    callToAction: 'What questions do you have about our process?',
    platforms: ['linkedin', 'instagram', 'youtube'],
    estimatedEngagement: 1.4
  },

  // Rung 3: Proof (Days 12-16)
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 12,
    title: 'The Third-Party Validation',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Leverage external credibility sources',
    raceStage: 'act',
    keyMessage: 'What [authority/publication] says about [topic]',
    callToAction: 'Read the full feature (link in bio)',
    platforms: ['linkedin', 'facebook', 'twitter'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 16,
    title: 'The Client Success Story',
    contentType: 'proof',
    emotionalTrigger: 'hope',
    objective: 'Show real results from real people',
    raceStage: 'act',
    keyMessage: '[Client] achieved [specific metric] in [timeframe]',
    callToAction: 'Want similar results? Link in bio',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.6
  },

  // Rung 4: Risk Removal (Days 20-24)
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 20,
    title: 'The Objection Addresser',
    contentType: 'education',
    emotionalTrigger: 'relief',
    objective: 'Address top concerns proactively',
    raceStage: 'convert',
    keyMessage: 'The truth about [common objection]',
    callToAction: 'What other questions do you have?',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.5
  },

  // Rung 5: Action (Day 27)
  {
    id: createPieceId(TEMPLATE_ID, 7),
    dayOffset: 27,
    title: 'The Low-Risk Offer',
    contentType: 'offer',
    emotionalTrigger: 'trust',
    objective: 'Present risk-free way to engage',
    raceStage: 'convert',
    keyMessage: 'Here\'s how to get started with zero risk',
    callToAction: 'Book your free consultation / Try risk-free',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.4
  }
]

export const TrustLadderTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Trust Ladder Campaign',
    description: 'Progressive trust building over 28 days. Each piece climbs one rung higher on the trust ladder until the audience is ready to buy.',
    category: 'core-journey',
    pieceCount: 7,
    durationDays: 28,
    complexity: 'complex',
    bestFor: [
      'High-ticket services',
      'B2B sales',
      'Financial services',
      'Healthcare',
      'Skeptical audiences',
      'New market entrants'
    ],
    prerequisites: [
      'Strong credentials or expertise',
      'Client testimonials with specific results',
      'Third-party validation (optional but helpful)',
      'Risk-free offer option'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.5,
    engagementLift: 35,
    conversionLift: 45,
    factors: [
      'Progressive relationship building',
      'Multiple trust signals',
      'Risk removal strategy',
      'Patience-based conversion',
      'Higher quality leads'
    ]
  },
  emotionalProgression: [
    'curiosity',
    'empowerment',
    'trust',
    'validation',
    'hope',
    'relief',
    'trust'
  ],
  narrativeArc: 'Introduction → Free value → Transparency → External proof → Client proof → Objection handling → Risk-free action',
  successMetrics: [
    'Follower growth over campaign',
    'Content saves and shares',
    'Comment depth and quality',
    'Email list growth',
    'Consultation bookings',
    'Lead quality score',
    'Sales conversion rate'
  ]
}

export default TrustLadderTemplate
