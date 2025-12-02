/**
 * Before-After-Bridge (BAB) Campaign Template
 *
 * 6 pieces over 18 days following the transformation narrative structure.
 * Powerful for showcasing transformations and outcomes.
 *
 * Expected ROI: 3.5-4.2x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'bab-campaign'

const pieces: CampaignPiece[] = [
  // BEFORE Phase (Days 0-5)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Current Reality',
    contentType: 'awareness',
    emotionalTrigger: 'validation',
    objective: 'Paint the "before" picture that resonates',
    raceStage: 'reach',
    keyMessage: 'If you\'re experiencing [symptoms], you\'re not alone',
    callToAction: 'Tag someone who can relate',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 5,
    title: 'The Struggle Story',
    contentType: 'story',
    emotionalTrigger: 'empowerment',
    objective: 'Share a relatable struggle narrative',
    raceStage: 'reach',
    keyMessage: 'Here\'s what it looks like when [problem] goes unaddressed',
    callToAction: 'Have you been there? Share your story',
    platforms: ['linkedin', 'facebook', 'blog'],
    estimatedEngagement: 1.5
  },

  // AFTER Phase (Days 8-12)
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 8,
    title: 'The Transformation Vision',
    contentType: 'story',
    emotionalTrigger: 'hope',
    objective: 'Show the desired "after" state',
    raceStage: 'act',
    keyMessage: 'Imagine waking up to [desired outcome] every day',
    callToAction: 'What would this change for you?',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 12,
    title: 'The Proof of Possibility',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Demonstrate real transformations',
    raceStage: 'act',
    keyMessage: 'Meet [client] who went from [before] to [after]',
    callToAction: 'See full case study (link in bio)',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.6
  },

  // BRIDGE Phase (Days 15-17)
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 15,
    title: 'The Bridge Reveal',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Explain how to get from before to after',
    raceStage: 'convert',
    keyMessage: 'Here\'s the bridge that takes you from [before] to [after]',
    callToAction: 'Ready to cross? Comment "bridge" for details',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 17,
    title: 'The Invitation',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Invite to take the first step',
    raceStage: 'convert',
    keyMessage: 'Your transformation starts with one decision',
    callToAction: 'Book your call / Start today',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.4
  }
]

export const BABCampaignTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Before-After-Bridge Campaign',
    description: 'Transformation narrative that shows the journey from problem state to desired outcome. Excellent for visual and story-driven industries.',
    category: 'core-journey',
    pieceCount: 6,
    durationDays: 18,
    complexity: 'moderate',
    bestFor: [
      'Transformation services',
      'Health and fitness',
      'Coaching and consulting',
      'Home improvement',
      'Education and training'
    ],
    prerequisites: [
      'Before/after examples or testimonials',
      'Clear transformation story',
      'Visual proof if possible'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 3.9,
    engagementLift: 40,
    conversionLift: 36,
    factors: [
      'Transformation narrative power',
      'Visual storytelling',
      'Social proof integration',
      'Hope-based motivation',
      'Clear outcome visualization'
    ]
  },
  emotionalProgression: [
    'validation',
    'empowerment',
    'hope',
    'validation',
    'empowerment',
    'hope'
  ],
  narrativeArc: 'Current state recognition → Struggle acknowledgment → Future vision → Proof of change → How to get there → Invitation to begin',
  successMetrics: [
    'Story engagement (comments, saves)',
    'Testimonial piece performance',
    'Click-through on transformation content',
    'Lead captures from bridge piece',
    'Conversion rate',
    'Time from first touch to conversion'
  ]
}

export default BABCampaignTemplate
