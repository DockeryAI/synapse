/**
 * Comparison Campaign Template
 *
 * 5 pieces over 14 days for competitive positioning.
 * Helps buyers make informed decisions (in your favor).
 *
 * Expected ROI: 3.5-4.5x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'comparison-campaign'

const pieces: CampaignPiece[] = [
  // Set the Stage (Day 0)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Buying Dilemma',
    contentType: 'awareness',
    emotionalTrigger: 'validation',
    objective: 'Acknowledge the difficulty of choosing',
    raceStage: 'reach',
    keyMessage: 'Choosing between [options] is harder than it should be',
    callToAction: 'Which option are you considering?',
    platforms: ['linkedin', 'facebook', 'twitter'],
    estimatedEngagement: 1.4
  },

  // Establish Criteria (Days 3-6)
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Criteria Framework',
    contentType: 'education',
    emotionalTrigger: 'empowerment',
    objective: 'Define how to evaluate options (favoring your strengths)',
    raceStage: 'act',
    keyMessage: 'The 5 factors that actually matter when choosing [solution]',
    callToAction: 'Save this checklist',
    platforms: ['linkedin', 'blog', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 6,
    title: 'The Honest Comparison',
    contentType: 'comparison',
    emotionalTrigger: 'trust',
    objective: 'Compare options using your criteria',
    raceStage: 'act',
    keyMessage: 'A vs B vs C: Here\'s how they stack up',
    callToAction: 'Which factor matters most to you?',
    platforms: ['linkedin', 'blog', 'youtube'],
    estimatedEngagement: 1.6
  },

  // Differentiate (Days 10-13)
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 10,
    title: 'The Hidden Difference',
    contentType: 'education',
    emotionalTrigger: 'curiosity',
    objective: 'Highlight unique differentiator',
    raceStage: 'convert',
    keyMessage: 'What most [solutions] don\'t tell you about [key factor]',
    callToAction: 'Ask your provider about this',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 13,
    title: 'The Right Fit',
    contentType: 'offer',
    emotionalTrigger: 'validation',
    objective: 'Position as ideal choice for specific needs',
    raceStage: 'convert',
    keyMessage: 'We\'re the right choice if you need [specific outcomes]',
    callToAction: 'See if we\'re the right fit - book a call',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.4
  }
]

export const ComparisonCampaignTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Comparison Campaign',
    description: 'Help buyers navigate choices while positioning your solution favorably. Builds trust through transparency and education.',
    category: 'authority',
    pieceCount: 5,
    durationDays: 14,
    complexity: 'moderate',
    bestFor: [
      'Competitive markets',
      'B2B software/SaaS',
      'High-consideration purchases',
      'Commodity differentiation',
      'Category creation'
    ],
    prerequisites: [
      'Clear competitive differentiators',
      'Understanding of competitor weaknesses',
      'Strong positioning on chosen criteria',
      'Confidence in comparison'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.0,
    engagementLift: 42,
    conversionLift: 38,
    factors: [
      'Buyer education',
      'Trust through transparency',
      'Criteria anchoring',
      'Competitive differentiation',
      'Qualified lead generation'
    ]
  },
  emotionalProgression: [
    'validation',
    'empowerment',
    'trust',
    'curiosity',
    'validation'
  ],
  narrativeArc: 'Acknowledge difficulty → Provide framework → Honest comparison → Key differentiator → Right fit positioning',
  successMetrics: [
    'Comparison content engagement',
    'Shares and saves',
    'Time on comparison page',
    'Direct competitor mentions decrease',
    'Lead quality improvement',
    'Win rate against competitors',
    'Deal cycle reduction'
  ]
}

export default ComparisonCampaignTemplate
