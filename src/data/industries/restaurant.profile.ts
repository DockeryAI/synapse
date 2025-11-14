/**
 * RESTAURANT INDUSTRY PROFILE
 *
 * Psychology and messaging for restaurants, cafes, bars, food trucks
 */

import type { IndustryProfile } from '../../types/industry-profile.types';

export const RestaurantProfile: IndustryProfile = {
  id: 'restaurant',
  name: 'Restaurant & Food Service',
  naicsCode: '722', // Food Services and Drinking Places

  // Audience
  targetAudience: 'Local diners, families, date nights, food lovers, special occasion seekers',
  audienceCharacteristics: [
    'Looking for experiences, not just food',
    'Value atmosphere and service',
    'Influenced by photos and reviews',
    'Active on Instagram/Facebook',
    'Make decisions based on craving/mood',
  ],

  // Pain Points
  commonPainPoints: [
    'Finding good restaurants nearby',
    'Not knowing what to order',
    'Long wait times',
    'Dietary restrictions/allergies',
    'Disappointing food quality',
    'Bad service experiences',
    'Uncertainty about price/value',
    'Parking and location challenges',
  ],

  // Buying Triggers
  commonBuyingTriggers: [
    'Special occasions (birthdays, anniversaries, celebrations)',
    'Craving specific cuisine or dish',
    'Seeing mouth-watering food photos',
    'Date night or romantic evening',
    'No time or energy to cook',
    'Trying new restaurants and experiences',
    'Good reviews or recommendations from friends',
    'Special offers or limited-time menus',
    'Weekend or holiday dining out',
    'Social gatherings with family or friends',
  ],

  // Trust Builders
  trustBuilders: [
    'Fresh, quality ingredients',
    'Chef expertise and credentials',
    'Customer photos and reviews',
    'Clean, welcoming atmosphere',
    'Consistent food quality',
    'Friendly, attentive service',
    'Family owned/operated',
    'Local sourcing',
    'Behind-the-scenes transparency',
  ],

  // Language Optimization
  powerWords: [
    // Food quality
    'fresh', 'homemade', 'authentic', 'premium', 'quality', 'signature',
    // Experience
    'special', 'favorite', 'famous', 'award-winning', 'original',
    // Action/urgency
    'tonight', 'today', 'now', 'limited', 'seasonal', 'while it lasts',
    // Emotion
    'delicious', 'mouthwatering', 'amazing', 'perfect', 'incredible',
    // Value
    'featured', 'exclusive', 'only', 'best', 'new',
    // Social
    'loved', 'popular', 'favorite', 'celebrated',
  ],

  avoidWords: [
    'cheap', 'fast food', 'frozen', 'processed', 'generic',
    'average', 'basic', 'standard', 'normal', 'mass-produced',
  ],

  toneGuidelines: 'Warm, inviting, sensory-focused. Make them taste it through the screen. Be personal and authentic, not corporate.',

  // Content Strategy
  contentThemes: [
    'Daily specials and featured dishes',
    'Behind-the-scenes kitchen prep',
    'Chef stories and expertise',
    'Customer favorites and testimonials',
    'Seasonal menu updates',
    'Ingredient sourcing stories',
    'Staff spotlights',
    'Special events and reservations',
    'Food photography (hero shots)',
    'Cooking tips from the chef',
    'Holiday menus and catering',
    'Happy hour and promotions',
    'Community involvement',
    'Restaurant atmosphere and ambiance',
  ],

  postingFrequency: {
    optimal: 5, // 5 posts per week
    minimum: 3,
    maximum: 7, // Daily can work for restaurants
  },

  // Timing
  bestPostingTimes: [
    { dayOfWeek: 'monday', hourOfDay: 11 }, // Lunch decision time
    { dayOfWeek: 'tuesday', hourOfDay: 17 }, // Dinner planning
    { dayOfWeek: 'wednesday', hourOfDay: 11 }, // Midweek lunch
    { dayOfWeek: 'thursday', hourOfDay: 16 }, // Weekend planning starts
    { dayOfWeek: 'friday', hourOfDay: 10 }, // Weekend dinner planning
    { dayOfWeek: 'friday', hourOfDay: 17 }, // Last-minute Friday night
    { dayOfWeek: 'saturday', hourOfDay: 9 }, // Brunch decisions
    { dayOfWeek: 'sunday', hourOfDay: 10 }, // Brunch time
  ],

  // Psychology Profile (Hidden)
  psychologyProfile: {
    primaryTriggers: ['desire', 'belonging', 'trust'],
    secondaryTriggers: ['urgency', 'curiosity'],
    buyerJourneyStage: 'decision', // Food decisions are often impulse
    decisionDrivers: [
      'Visual appeal (food photos)',
      'Social proof (reviews, crowds)',
      'Craving/emotion',
      'Convenience (location, hours)',
      'Value perception',
      'Atmosphere/experience',
    ],
    urgencyLevel: 'medium', // "Tonight's special" works, but not pushy
    trustImportance: 'high', // Food safety and quality are critical
  },
};
