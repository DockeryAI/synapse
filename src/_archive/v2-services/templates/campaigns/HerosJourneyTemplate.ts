/**
 * Hero's Journey Campaign Template
 *
 * 8 pieces over 30 days following Joseph Campbell's monomyth structure.
 * The most powerful story-based campaign for deep emotional connection.
 *
 * Expected ROI: 4.5-5.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'heros-journey'

const pieces: CampaignPiece[] = [
  // Act 1: The Ordinary World & Call to Adventure (Days 0-4)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Ordinary World',
    contentType: 'story',
    emotionalTrigger: 'validation',
    objective: 'Establish the relatable starting point',
    raceStage: 'reach',
    keyMessage: 'Life before the transformation: [relatable struggle]',
    callToAction: 'Does this feel familiar? React if you can relate',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 4,
    title: 'The Call to Adventure',
    contentType: 'awareness',
    emotionalTrigger: 'curiosity',
    objective: 'Present the opportunity for change',
    raceStage: 'reach',
    keyMessage: 'The moment I realized [something had to change]',
    callToAction: 'Have you had this realization? Share your moment',
    platforms: ['linkedin', 'facebook', 'blog'],
    estimatedEngagement: 1.5
  },

  // Act 2: Refusal, Mentor, Threshold (Days 8-15)
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 8,
    title: 'The Refusal',
    contentType: 'story',
    emotionalTrigger: 'fear',
    objective: 'Acknowledge the resistance to change',
    raceStage: 'act',
    keyMessage: 'Why I almost didn\'t take the leap (and what held me back)',
    callToAction: 'What\'s holding you back? Be honest',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 12,
    title: 'Meeting the Mentor',
    contentType: 'education',
    emotionalTrigger: 'hope',
    objective: 'Introduce the guide or framework',
    raceStage: 'act',
    keyMessage: 'The insight/person/framework that changed everything',
    callToAction: 'Who or what has been your mentor?',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 15,
    title: 'Crossing the Threshold',
    contentType: 'story',
    emotionalTrigger: 'empowerment',
    objective: 'Show the commitment moment',
    raceStage: 'act',
    keyMessage: 'The day I finally committed to [transformation]',
    callToAction: 'Are you ready to cross your threshold?',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.4
  },

  // Act 3: Tests, Transformation, Return (Days 19-29)
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 19,
    title: 'Tests and Trials',
    contentType: 'story',
    emotionalTrigger: 'validation',
    objective: 'Share the challenges faced',
    raceStage: 'act',
    keyMessage: 'The obstacles I faced and how I overcame them',
    callToAction: 'What challenges are you facing right now?',
    platforms: ['linkedin', 'facebook', 'blog'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 7),
    dayOffset: 24,
    title: 'The Transformation',
    contentType: 'proof',
    emotionalTrigger: 'pride',
    objective: 'Reveal the outcome and change',
    raceStage: 'convert',
    keyMessage: 'The new reality: [specific results and changes]',
    callToAction: 'This is possible for you too. Link in bio',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.7
  },
  {
    id: createPieceId(TEMPLATE_ID, 8),
    dayOffset: 29,
    title: 'The Return with the Elixir',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Offer to guide others on the same journey',
    raceStage: 'convert',
    keyMessage: 'Now I help others achieve the same transformation',
    callToAction: 'Ready to start your hero\'s journey? Book a call',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.5
  }
]

export const HerosJourneyTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Hero\'s Journey Campaign',
    description: 'Story-based campaign following the classic monomyth structure. Creates deep emotional connection through narrative transformation.',
    category: 'core-journey',
    pieceCount: 8,
    durationDays: 30,
    complexity: 'complex',
    bestFor: [
      'Personal brands',
      'Coaches and consultants',
      'Transformation services',
      'Course creators',
      'Memoir-style marketing'
    ],
    prerequisites: [
      'Personal transformation story',
      'Authentic struggles to share',
      'Clear before/after results',
      'Willingness to be vulnerable'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 5.0,
    engagementLift: 52,
    conversionLift: 42,
    factors: [
      'Deep emotional storytelling',
      'Universal narrative structure',
      'Vulnerability-based trust',
      'Strong identification',
      'Inspiring transformation'
    ]
  },
  emotionalProgression: [
    'validation',
    'curiosity',
    'fear',
    'hope',
    'empowerment',
    'validation',
    'pride',
    'hope'
  ],
  narrativeArc: 'Ordinary world → Call to change → Resistance → Mentor guidance → Commitment → Challenges → Transformation → Sharing the gift',
  successMetrics: [
    'Story engagement (reactions, comments)',
    'Content shares (resonance indicator)',
    'Follower growth through campaign',
    'DM conversations initiated',
    'Email list signups',
    'Consultation bookings',
    'Emotional feedback in comments'
  ]
}

export default HerosJourneyTemplate
