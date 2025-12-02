/**
 * Problem-Agitate-Solve (PAS) Series Template
 *
 * 5 pieces over 14 days following the classic PAS copywriting framework.
 * Highly effective for pain-point driven marketing.
 *
 * Expected ROI: 3.5-4.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'pas-series'

const pieces: CampaignPiece[] = [
  // PROBLEM Phase (Days 0-3)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Problem Revelation',
    contentType: 'awareness',
    emotionalTrigger: 'curiosity',
    objective: 'Identify the core problem your audience faces',
    raceStage: 'reach',
    keyMessage: 'Most [audience] don\'t realize this is costing them [outcome]',
    callToAction: 'Does this sound familiar? Comment below',
    platforms: ['linkedin', 'facebook', 'twitter'],
    estimatedEngagement: 1.4
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 3,
    title: 'The Hidden Costs',
    contentType: 'awareness',
    emotionalTrigger: 'fear',
    objective: 'Quantify the impact of the problem',
    raceStage: 'reach',
    keyMessage: 'Here\'s exactly what [problem] is costing you',
    callToAction: 'Calculate your own cost using this formula',
    platforms: ['linkedin', 'facebook', 'blog'],
    estimatedEngagement: 1.3
  },

  // AGITATE Phase (Days 6-9)
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 6,
    title: 'The Consequence Amplifier',
    contentType: 'story',
    emotionalTrigger: 'fear',
    objective: 'Intensify urgency through consequences',
    raceStage: 'act',
    keyMessage: 'If you don\'t fix [problem], here\'s what happens next',
    callToAction: 'Don\'t let this be you. Share with someone who needs to hear this',
    platforms: ['linkedin', 'facebook', 'instagram'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 9,
    title: 'The Failed Solutions',
    contentType: 'education',
    emotionalTrigger: 'validation',
    objective: 'Address why other solutions haven\'t worked',
    raceStage: 'act',
    keyMessage: 'Why the usual advice about [problem] doesn\'t work',
    callToAction: 'Have you tried these? Tell me what happened',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.4
  },

  // SOLVE Phase (Day 13)
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 13,
    title: 'The Solution Breakthrough',
    contentType: 'offer',
    emotionalTrigger: 'hope',
    objective: 'Present your solution as the answer',
    raceStage: 'convert',
    keyMessage: 'Here\'s the approach that actually works for [problem]',
    callToAction: 'Ready to solve this? Book a call / Get started',
    platforms: ['linkedin', 'facebook', 'email'],
    estimatedEngagement: 1.6
  }
]

export const PASSeriesTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Problem-Agitate-Solve Series',
    description: 'Classic copywriting framework that identifies pain, amplifies urgency, and presents your solution. Highly effective for direct response.',
    category: 'core-journey',
    pieceCount: 5,
    durationDays: 14,
    complexity: 'simple',
    bestFor: [
      'Pain-point marketing',
      'Direct response campaigns',
      'Service businesses',
      'B2B sales',
      'High-consideration purchases'
    ],
    prerequisites: [
      'Deep understanding of customer pain points',
      'Clear solution differentiation',
      'Specific outcome promises'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 3.8,
    engagementLift: 42,
    conversionLift: 35,
    factors: [
      'Pain-point resonance',
      'Urgency creation',
      'Clear problem-solution connection',
      'Emotional engagement',
      'Direct response optimization'
    ]
  },
  emotionalProgression: [
    'curiosity',
    'fear',
    'fear',
    'validation',
    'hope'
  ],
  narrativeArc: 'Problem identification → Cost revelation → Consequence warning → Solution failures → Your breakthrough',
  successMetrics: [
    'Comment engagement on problem posts',
    'Share rate (problem resonance)',
    'Click-through on solution piece',
    'Lead generation',
    'Sales conversions',
    'Time to conversion'
  ]
}

export default PASSeriesTemplate
