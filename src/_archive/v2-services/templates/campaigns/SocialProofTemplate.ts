/**
 * Social Proof Campaign Template
 *
 * 6 pieces over 18 days for credibility building through others' voices.
 * Leverages testimonials, results, and community validation.
 *
 * Expected ROI: 4.0-5.0x baseline
 */

import {
  CampaignTemplate,
  CampaignPiece,
  createPieceId
} from '../campaign-template-base.service'

const TEMPLATE_ID = 'social-proof'

const pieces: CampaignPiece[] = [
  // Initial Social Proof (Days 0-4)
  {
    id: createPieceId(TEMPLATE_ID, 1),
    dayOffset: 0,
    title: 'The Numbers Speak',
    contentType: 'proof',
    emotionalTrigger: 'validation',
    objective: 'Lead with impressive aggregate numbers',
    raceStage: 'reach',
    keyMessage: '[X] customers can\'t be wrong: Here\'s what they achieved',
    callToAction: 'Want to join them? Link in bio',
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 2),
    dayOffset: 4,
    title: 'The Video Testimonial',
    contentType: 'proof',
    emotionalTrigger: 'trust',
    objective: 'Show real person sharing real results',
    raceStage: 'reach',
    keyMessage: 'Hear directly from [Client] about their experience',
    callToAction: 'Your story could be next',
    platforms: ['linkedin', 'facebook', 'instagram', 'youtube'],
    estimatedEngagement: 1.6
  },

  // Diverse Proof Points (Days 8-11)
  {
    id: createPieceId(TEMPLATE_ID, 3),
    dayOffset: 8,
    title: 'The Before and After',
    contentType: 'proof',
    emotionalTrigger: 'hope',
    objective: 'Visual transformation evidence',
    raceStage: 'act',
    keyMessage: '[Client] went from [before] to [after] in [timeframe]',
    callToAction: 'See their full story',
    platforms: ['instagram', 'facebook', 'linkedin'],
    estimatedEngagement: 1.7
  },
  {
    id: createPieceId(TEMPLATE_ID, 4),
    dayOffset: 11,
    title: 'The Expert Endorsement',
    contentType: 'proof',
    emotionalTrigger: 'trust',
    objective: 'Leverage third-party credibility',
    raceStage: 'act',
    keyMessage: 'What [Industry Expert/Publication] says about us',
    callToAction: 'Read the full feature',
    platforms: ['linkedin', 'twitter', 'facebook'],
    estimatedEngagement: 1.4
  },

  // Community Proof (Days 14-17)
  {
    id: createPieceId(TEMPLATE_ID, 5),
    dayOffset: 14,
    title: 'The Community Showcase',
    contentType: 'proof',
    emotionalTrigger: 'pride',
    objective: 'Show thriving community of customers',
    raceStage: 'convert',
    keyMessage: 'Meet our community: [X] members achieving [outcomes]',
    callToAction: 'Join the community',
    platforms: ['facebook', 'instagram', 'linkedin'],
    estimatedEngagement: 1.5
  },
  {
    id: createPieceId(TEMPLATE_ID, 6),
    dayOffset: 17,
    title: 'The Success Compilation',
    contentType: 'offer',
    emotionalTrigger: 'validation',
    objective: 'Overwhelming proof before offer',
    raceStage: 'convert',
    keyMessage: '[X] success stories and counting. Ready to add yours?',
    callToAction: 'Start your success story today',
    platforms: ['linkedin', 'facebook', 'instagram', 'email'],
    estimatedEngagement: 1.6
  }
]

export const SocialProofTemplate: CampaignTemplate = {
  metadata: {
    id: TEMPLATE_ID,
    name: 'Social Proof Cascade',
    description: 'Build overwhelming credibility through diverse proof points: numbers, testimonials, transformations, endorsements, and community.',
    category: 'conversion',
    pieceCount: 6,
    durationDays: 18,
    complexity: 'moderate',
    bestFor: [
      'New businesses building trust',
      'High-competition markets',
      'High-consideration purchases',
      'Skeptical audiences',
      'Service businesses'
    ],
    prerequisites: [
      'Multiple customer testimonials',
      'Specific results and metrics',
      'Before/after examples if applicable',
      'Community or user base to showcase'
    ]
  },
  pieces,
  roi: {
    expectedMultiplier: 4.5,
    engagementLift: 45,
    conversionLift: 42,
    factors: [
      'Multiple proof types',
      'Progressive trust building',
      'Emotional and logical appeal',
      'Community validation',
      'Overwhelming evidence'
    ]
  },
  emotionalProgression: [
    'validation',
    'trust',
    'hope',
    'trust',
    'pride',
    'validation'
  ],
  narrativeArc: 'Numbers proof → Personal story → Visual proof → Expert validation → Community → Culminating offer',
  successMetrics: [
    'Testimonial content engagement',
    'Share rate of proof content',
    'Click-through on testimonials',
    'Lead captures',
    'Conversion rate',
    'Customer acquisition cost',
    'Time to conversion'
  ]
}

export default SocialProofTemplate
