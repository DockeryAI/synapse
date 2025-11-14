/**
 * CONSULTANT INDUSTRY PROFILE
 *
 * Psychology and messaging for business consultants, coaches, advisors
 */

import type { IndustryProfile } from '../../types/industry-profile.types';

export const ConsultantProfile: IndustryProfile = {
  id: 'consultant',
  name: 'Business Consulting & Coaching',
  naicsCode: '541611', // Administrative Management and General Management Consulting Services

  // Audience
  targetAudience: 'Small business owners, entrepreneurs, executives, professionals seeking growth',
  audienceCharacteristics: [
    'Time-starved and overwhelmed',
    'Need expert guidance but skeptical of "gurus"',
    'Value proven methodologies',
    'Want ROI and measurable results',
    'Research credentials heavily',
    'Prefer thought leadership content',
    'Long decision-making process',
  ],

  // Pain Points
  commonPainPoints: [
    'Stuck at current revenue level',
    'Working IN the business, not ON it',
    'Can\'t find good talent',
    'Marketing not working',
    'Systems and processes are broken',
    'Scaling challenges',
    'Work-life balance suffering',
    'Not sure what to focus on first',
    'Losing competitive edge',
    'Cash flow problems',
    'Leadership and management struggles',
  ],

  // Buying Triggers
  commonBuyingTriggers: [
    'Hit revenue plateau or declining sales',
    'Major competitor launched new offering',
    'Failed to meet quarterly or annual goals',
    'Lost key employee or client',
    'New market opportunity identified',
    'Business partner conflict or transition',
    'Preparing for major expansion or investment',
    'Regulatory or industry disruption',
    'Personal burnout or work-life imbalance crisis',
    'Received critical feedback from customers or team',
    'Seeking exit strategy or business sale preparation',
    'Beginning of new fiscal year or planning cycle',
  ],

  // Trust Builders
  trustBuilders: [
    'Proven client results and case studies',
    'Years of real business experience',
    'Specific methodology or framework',
    'Thought leadership content',
    'Speaking engagements and media',
    'Credentials and certifications',
    'Industry specialization',
    'Free valuable content',
    'Clear process and expectations',
    'Transparency about pricing',
    'Strong professional network',
  ],

  // Language Optimization
  powerWords: [
    // Results/transformation
    'transform', 'grow', 'scale', 'achieve', 'breakthrough', 'success',
    // Expertise
    'proven', 'expert', 'strategic', 'professional', 'experienced', 'certified',
    // Value
    'results', 'ROI', 'profit', 'revenue', 'growth', 'performance',
    // Process
    'framework', 'system', 'methodology', 'strategy', 'plan', 'roadmap',
    // Problem solving
    'solve', 'overcome', 'breakthrough', 'optimize', 'improve', 'enhance',
    // Action
    'implement', 'execute', 'achieve', 'build', 'create', 'develop',
    // Authority
    'insights', 'data', 'research', 'analysis', 'assessment',
  ],

  avoidWords: [
    'guru', 'secret', 'guaranteed', 'easy', 'overnight', 'magic',
    'tricks', 'hacks', 'foolproof', 'revolutionary',
  ],

  toneGuidelines: 'Professional and authoritative yet approachable. Be the trusted advisor, not the salesperson. Educate and demonstrate value. Data-driven but human.',

  // Content Strategy
  contentThemes: [
    'Industry insights and trends',
    'Client success stories and case studies',
    'Strategic frameworks and methodologies',
    'Common business mistakes',
    'Leadership and management tips',
    'Market analysis and data',
    'Behind-the-scenes process',
    'Quick wins and tactical advice',
    'Tools and resources recommendations',
    'Thought leadership articles',
    'Speaking events and media',
    'Book recommendations',
    'Business growth strategies',
    'Personal productivity and effectiveness',
  ],

  postingFrequency: {
    optimal: 3, // 3 quality posts per week
    minimum: 2,
    maximum: 5, // Don't overwhelm - quality over quantity
  },

  // Timing
  bestPostingTimes: [
    { dayOfWeek: 'monday', hourOfDay: 8 }, // Start of work week mindset
    { dayOfWeek: 'tuesday', hourOfDay: 14 }, // Afternoon thought leadership
    { dayOfWeek: 'wednesday', hourOfDay: 10 }, // Mid-week strategy
    { dayOfWeek: 'thursday', hourOfDay: 13 }, // Planning for week ahead
    { dayOfWeek: 'friday', hourOfDay: 9 }, // Friday motivation/reflection
  ],

  // Psychology Profile (Hidden)
  psychologyProfile: {
    primaryTriggers: ['achievement', 'trust', 'curiosity'],
    secondaryTriggers: ['fear', 'desire'],
    buyerJourneyStage: 'consideration', // Very long research and evaluation phase
    decisionDrivers: [
      'Proven track record with similar clients',
      'Clear methodology and process',
      'Thought leadership and expertise',
      'Cultural and values fit',
      'Referrals and testimonials',
      'Industry-specific knowledge',
      'ROI and measurable outcomes',
      'Personal connection with consultant',
      'Credentials and background',
    ],
    urgencyLevel: 'low', // Long sales cycle, strategic decisions
    trustImportance: 'high', // Critical - inviting into sensitive business matters
  },
};
