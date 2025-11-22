/**
 * Education First Campaign Template
 *
 * 7 pieces over 21 days for complex sale support.
 * Builds authority through deep educational content.
 *
 * Expected ROI: 3.5-4.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'education-first'

const pieces: CampaignPiece[] = [
  // Foundational Knowledge (Days 0-6)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The 101 Introduction',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Establish foundational understanding',
    raceStage: 'reach',
    keyMessage: 'Everything you need to know about [topic] in one post',
    callToAction: 'Save this as your reference guide',
    platforms: ['linkedin', 'blog', 'youtube', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Common Mistakes',
    contentType: 'education',
    emotionalTrigger: 'fear',
    objective: 'Position as knowledgeable guide',
    raceStage: 'reach',
    keyMessage: '7 mistakes people make with [topic] and how to avoid them',
    callToAction: 'Which of these have you made?',
    platforms: ['linkedin', 'facebook', 'blog'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 6,
    title: 'The Deep Dive',
    contentType: 'education',
    emotionalTrigger: 'curiosity',
    objective: 'Demonstrate depth of expertise',
    raceStage: 'act',
    keyMessage: 'The advanced guide to [specific subtopic]',
    callToAction: 'Want the full PDF? Comment "guide"',
    platforms: ['linkedin', 'blog', 'youtube'],
    estimatedEngagement: 1.5
  },

  // Applied Knowledge (Days 10-14)
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 10,
    title: 'The Framework',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Provide actionable methodology',
    raceStage: 'act',
    keyMessage: 'The [number]-step framework for [outcome]',
    callToAction: 'Try step 1 today and tell me how it goes',
    platforms: ['linkedin', 'blog', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 14,
    title: 'The Real Example',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Show education in action',
    raceStage: 'act',
    keyMessage: 'How [client] used this framework to achieve [result]',
    callToAction: 'See full case study',
    platforms: ['linkedin', 'facebook', 'blog', 'email'],
    estimatedEngagement: 1.6
  },

  // Advanced Application (Days 17-20)
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 17,
    title: 'The Q&A Session',
    contentType: 'engagement',
    emotionalTrigger: 'trust',
    objective: 'Address specific questions and edge cases',
    raceStage: 'convert',
    keyMessage: 'Your top [topic] questions answered',
    callToAction: 'What question did I miss? Ask below',
    platforms: ['linkedin', 'instagram', 'youtube'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 7),
    dayOffset: 20,
    title: 'The Next Level',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Offer deeper engagement',
    raceStage: 'convert',
    keyMessage: 'Ready to master [topic]? Here\'s how to work with us',
    callToAction: 'Apply for our program / Book a strategy call',
    platforms: ['linkedin', 'email'],
    estimatedEngagement: 1.3
  }
]

export const EducationFirstTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Education First Campaign',
    description: 'Lead with education to build trust and authority before offering. Perfect for complex sales that require buyer education.',
    category: 'authority',
    pieceCount: 7,
    durationDays: 21,
    complexity: 'complex',
    bestFor: [
      'Complex B2B sales',
      'High-ticket services',
      'Technical products',
      'Course creators',
      'Professional services'
    ],
    prerequisites: [
      'Deep subject matter expertise',
      'Educational content library',
      'Framework or methodology',
      'Case studies for proof'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.2,
    engagementLift: 40,
    conversionLift: 35,
    factors: [
      'Expertise demonstration',
      'Value-first positioning',
      'Long-term trust building',
      'Educated buyer creation',
      'Premium positioning'
    ]
  },
  emotionalProgression: [
    'empowerment',
    'fear',
    'curiosity',
    'empowerment',
    'validation',
    'trust',
    'hope'
  ],
  narrativeArc: 'Foundation → Mistakes → Deep knowledge → Framework → Proof → Q&A → Offer',
  successMetrics: [
    'Content saves and shares',
    'Time on educational content',
    'Download/lead capture rate',
    'Email list growth',
    'Question engagement',
    'Application/call bookings',
    'Sales cycle length reduction'
  ]
}

export default EducationFirstTemplate
