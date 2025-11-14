/**
 * DENTIST INDUSTRY PROFILE
 *
 * Psychology and messaging for dentists, orthodontists, dental practices
 */

import type { IndustryProfile } from '../../types/industry-profile.types';

export const DentistProfile: IndustryProfile = {
  id: 'dentist',
  name: 'Dental Practice',
  naicsCode: '621210', // Offices of Dentists

  // Audience
  targetAudience: 'Families, parents with children, professionals, seniors, cosmetic dental seekers',
  audienceCharacteristics: [
    'Many have dental anxiety/fear',
    'Put off care until there\'s a problem',
    'Want gentle, caring providers',
    'Value convenience (hours, location)',
    'Concerned about costs and insurance',
    'Looking for family-friendly practice',
    'Increasingly interested in cosmetic options',
  ],

  // Pain Points
  commonPainPoints: [
    'Dental anxiety and fear of pain',
    'Cost and insurance confusion',
    'Finding time for appointments',
    'Not knowing if they need work done',
    'Bad past dental experiences',
    'Fear of judgment for neglect',
    'Understanding treatment options',
    'Financing unexpected procedures',
    'Finding kid-friendly dentist',
    'Emergency dental pain',
  ],

  // Buying Triggers
  commonBuyingTriggers: [
    'Experiencing tooth pain or discomfort',
    'Visible dental issue (chipped, broken, or missing tooth)',
    'Upcoming important event (wedding, photos, interview)',
    'Insurance benefits about to expire (end of year)',
    'Dissatisfaction with current smile appearance',
    'Child needs first dental visit or school requirement',
    'New insurance coverage starting or moving to area',
    'Dental emergency or accident',
    'Recommendation from doctor or specialist',
    'Back-to-school checkup season (July - August)',
    'New Year wellness resolution',
    'Seeing friends or family member\'s smile transformation',
  ],

  // Trust Builders
  trustBuilders: [
    'Gentle, caring approach',
    'Modern technology and comfort options',
    'Clear communication about procedures',
    'Transparent pricing',
    'Accepting many insurance plans',
    'Family-friendly environment',
    'Emergency availability',
    'Before/after results',
    'Patient testimonials',
    'Doctor credentials and training',
    'Clean, modern office',
  ],

  // Language Optimization
  powerWords: [
    // Comfort/trust
    'gentle', 'comfortable', 'caring', 'friendly', 'welcoming', 'trusted',
    // Results
    'healthy', 'beautiful', 'confident', 'bright', 'transform',
    // Technology
    'advanced', 'modern', 'state-of-the-art', 'pain-free', 'comfortable',
    // Family
    'family', 'kids', 'children', 'everyone', 'all ages',
    // Service
    'emergency', 'same-day', 'convenient', 'flexible', 'available',
    // Value
    'affordable', 'insurance', 'financing', 'options', 'payment plans',
    // Quality
    'experienced', 'expert', 'professional', 'quality', 'excellence',
  ],

  avoidWords: [
    'pain', 'hurt', 'scary', 'drill',
    'expensive', 'complicated', 'invasive', 'serious', 'urgent',
  ],

  toneGuidelines: 'Warm, reassuring, professional. Address anxiety without highlighting it. Focus on positive outcomes. Be educational but not preachy.',

  // Content Strategy
  contentThemes: [
    'Oral health tips and education',
    'Before/after cosmetic results',
    'Patient success stories',
    'Meet the team introductions',
    'Technology and comfort features',
    'Kids\' dental health and fun',
    'Smile transformations',
    'Seasonal reminders (back to school, holidays)',
    'Common myths debunked',
    'Emergency care information',
    'Insurance and financing options',
    'Behind-the-scenes office culture',
    'Community involvement',
    'National health observances',
  ],

  postingFrequency: {
    optimal: 4, // 4 posts per week
    minimum: 2,
    maximum: 5,
  },

  // Timing
  bestPostingTimes: [
    { dayOfWeek: 'monday', hourOfDay: 18 }, // Evening after work
    { dayOfWeek: 'tuesday', hourOfDay: 12 }, // Lunch break
    { dayOfWeek: 'wednesday', hourOfDay: 19 }, // Evening
    { dayOfWeek: 'thursday', hourOfDay: 11 }, // Late morning
    { dayOfWeek: 'friday', hourOfDay: 16 }, // End of week
    { dayOfWeek: 'saturday', hourOfDay: 10 }, // Weekend browsing
  ],

  // Psychology Profile (Hidden)
  psychologyProfile: {
    primaryTriggers: ['trust', 'fear', 'desire'],
    secondaryTriggers: ['belonging', 'achievement'],
    buyerJourneyStage: 'consideration', // Research phase, or emergency (decision)
    decisionDrivers: [
      'Gentle, caring approach',
      'Modern technology and comfort',
      'Family-friendly environment',
      'Insurance acceptance',
      'Convenient location and hours',
      'Positive reviews and testimonials',
      'Doctor credentials and experience',
      'Office cleanliness and ambiance',
    ],
    urgencyLevel: 'low', // Except for emergencies - then it\'s urgent
    trustImportance: 'high', // Must overcome fear and build confidence
  },
};
