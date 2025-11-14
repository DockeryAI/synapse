/**
 * REALTOR INDUSTRY PROFILE
 *
 * Psychology and messaging for real estate agents, brokers, property managers
 */

import type { IndustryProfile } from '../../types/industry-profile.types';

export const RealtorProfile: IndustryProfile = {
  id: 'realtor',
  name: 'Real Estate',
  naicsCode: '531210', // Offices of Real Estate Agents and Brokers

  // Audience
  targetAudience: 'First-time homebuyers, growing families, downsizers, investors, relocating professionals',
  audienceCharacteristics: [
    'Making one of life\'s biggest decisions',
    'Emotionally invested but need facts',
    'Comparing multiple agents',
    'Research-heavy (online first)',
    'Need hand-holding through process',
    'Want responsive communication',
    'Visual-first decision makers',
  ],

  // Customer Segments (Typical buyer personas for residential real estate)
  customerSegments: [
    {
      name: 'First-Time Homebuyers',
      description: 'Young professionals or couples buying their first home, often transitioning from renting',
      demographics: {
        ageRange: '25-35',
        incomeRange: '$50k-$80k',
        locationType: 'Suburban starter home areas',
        occupation: 'Young professionals, dual-income couples',
      },
      painPoints: [
        'Confused by the home buying process',
        'Worried about making a costly mistake',
        'Struggling to save for down payment',
        'Uncertain about mortgage options',
        'Competing with experienced buyers',
      ],
      goals: [
        'Build equity instead of paying rent',
        'Find affordable starter home in good area',
        'Navigate the buying process confidently',
        'Get the best deal possible',
        'Start building long-term wealth',
      ],
      buyingTriggers: [
        'Lease ending or rent increase',
        'Marriage or partnership',
        'Tax benefits realization',
        'Friends buying homes',
        'Interest rate changes',
      ],
    },
    {
      name: 'Growing Families',
      description: 'Families outgrowing their current home, seeking more space and better schools',
      demographics: {
        ageRange: '30-45',
        incomeRange: '$75k-$150k',
        locationType: 'Suburban family neighborhoods',
        occupation: 'Established professionals, dual-income families',
      },
      painPoints: [
        'Outgrowing current home',
        'Need better school district',
        'Timing the sale and purchase',
        'Finding home that fits growing family',
        'Balancing wants vs. budget',
      ],
      goals: [
        'Move up to larger home',
        'Live in top-rated school district',
        'Have space for growing family',
        'Build long-term wealth through real estate',
        'Find safe, family-friendly neighborhood',
      ],
      buyingTriggers: [
        'New baby on the way',
        'Children starting school',
        'Outgrown current space',
        'Job promotion or raise',
        'Found dream home in perfect location',
      ],
    },
    {
      name: 'Empty Nesters Downsizing',
      description: 'Couples or individuals whose children have moved out, looking to downsize to smaller, more manageable homes',
      demographics: {
        ageRange: '55-70',
        incomeRange: '$100k+',
        locationType: 'Low-maintenance communities, condos, 55+ areas',
        occupation: 'Pre-retirees, retirees, established professionals',
      },
      painPoints: [
        'Home is too large to maintain',
        'High maintenance costs',
        'Too much yard work',
        'Stairs becoming difficult',
        'Feeling isolated in large home',
      ],
      goals: [
        'Downsize to more manageable home',
        'Reduce maintenance burden',
        'Free up equity for retirement',
        'Move closer to amenities or family',
        'Simplify lifestyle',
      ],
      buyingTriggers: [
        'Retirement approaching or starting',
        'Children moved out',
        'Health or mobility concerns',
        'Desire to travel more',
        'Wanting to be closer to grandchildren',
      ],
    },
    {
      name: 'Luxury Home Buyers',
      description: 'High-net-worth individuals seeking premium properties with upscale amenities',
      demographics: {
        ageRange: '40-60',
        incomeRange: '$200k+',
        locationType: 'Luxury neighborhoods, waterfront, exclusive communities',
        occupation: 'Executives, business owners, high-earning professionals',
      },
      painPoints: [
        'Finding truly unique properties',
        'Ensuring privacy and security',
        'Getting white-glove service',
        'Verifying property value and investment potential',
        'Coordinating complex transactions',
      ],
      goals: [
        'Own prestigious, high-end property',
        'Enjoy premium amenities and finishes',
        'Make sound investment in luxury market',
        'Experience exceptional service',
        'Maintain or elevate lifestyle',
      ],
      buyingTriggers: [
        'Significant wealth increase',
        'Business success or exit',
        'Desire for upgraded lifestyle',
        'Unique property opportunity',
        'Status and prestige',
      ],
    },
    {
      name: 'Real Estate Investors',
      description: 'Buyers focused on income-generating properties or fix-and-flip opportunities',
      demographics: {
        ageRange: '35-55',
        incomeRange: '$75k-$200k+',
        locationType: 'Rental markets, appreciation areas, value-add opportunities',
        occupation: 'Investors, entrepreneurs, professionals with investment capital',
      },
      painPoints: [
        'Finding properties with good ROI',
        'Analyzing market trends accurately',
        'Coordinating financing for multiple properties',
        'Managing time between job and investing',
        'Finding reliable property management',
      ],
      goals: [
        'Build passive income through rentals',
        'Grow real estate portfolio',
        'Achieve financial independence',
        'Capitalize on market opportunities',
        'Create generational wealth',
      ],
      buyingTriggers: [
        'Market conditions favoring buyers',
        'Interest rate opportunities',
        'Undervalued property discovered',
        '1031 exchange deadline',
        'Portfolio diversification need',
      ],
    },
  ],

  // Pain Points
  commonPainPoints: [
    'Fear of overpaying or underselling',
    'Market uncertainty and timing',
    'Complex paperwork and process',
    'Finding the "right" property',
    'Unresponsive agents',
    'Hidden property problems',
    'Negotiation stress',
    'Financing confusion',
    'Moving logistics overwhelm',
    'Not knowing if agent has their best interest',
  ],

  // Buying Triggers (What Prompts Action)
  commonBuyingTriggers: [
    'Life changes (marriage, new baby, job relocation)',
    'Outgrowing current home',
    'Interest rate changes',
    'Market conditions (seller\'s vs buyer\'s market)',
    'New job or career change',
    'Retirement or downsizing',
    'Investment opportunity',
    'Lease ending or rental increases',
    'School district considerations',
    'Desire to build equity instead of renting',
    'Seeing "dream home" listing',
    'Tax benefits and financial planning',
    'Family growth or multi-generational living needs',
    'Neighborhood safety or quality of life concerns',
    'Price drop on desired property',
  ],

  // Trust Builders
  trustBuilders: [
    'Recent successful sales',
    'Years in the local market',
    'Client testimonials with photos',
    'Neighborhood expertise',
    'Responsive communication',
    'Professional photography',
    'Market data and insights',
    'Clear process explanations',
    'Awards and recognition',
    'Active community involvement',
    'Video tours and walk-throughs',
  ],

  // Language Optimization
  powerWords: [
    // Emotional/aspirational
    'dream', 'perfect', 'ideal', 'stunning', 'beautiful', 'gorgeous',
    // Location/value
    'neighborhood', 'location', 'opportunity', 'value', 'investment',
    // Urgency
    'just listed', 'new', 'exclusive', 'limited', 'won\'t last', 'hot market',
    // Trust
    'experienced', 'local expert', 'proven', 'trusted', 'professional',
    // Results
    'sold', 'closed', 'success', 'helped', 'found', 'saved',
    // Process
    'smooth', 'easy', 'guided', 'supported', 'simplified',
    // Market
    'competitive', 'market value', 'comparable', 'appreciation',
  ],

  avoidWords: [
    'cheap', 'fixer-upper', 'cozy',
    'needs TLC', 'dated', 'potential', 'as-is', 'motivated seller',
  ],

  toneGuidelines: 'Professional yet warm. Balance emotion with facts. Be the confident guide through a complex journey. Show, do not just tell.',

  // Content Strategy
  contentThemes: [
    'New listings with stunning photos',
    'Just sold success stories',
    'Market updates and trends',
    'Neighborhood spotlights',
    'Home buying/selling tips',
    'Client testimonials',
    'Open house announcements',
    'Local events and community',
    'Market statistics and data',
    'First-time buyer education',
    'Home staging tips',
    'Investment opportunities',
    'Behind-the-scenes of deals',
    'Seasonal market insights',
    'Virtual tours and videos',
  ],

  postingFrequency: {
    optimal: 5, // 5 posts per week
    minimum: 3,
    maximum: 7, // Daily works well for active agents
  },

  // Timing
  bestPostingTimes: [
    { dayOfWeek: 'monday', hourOfDay: 19 }, // Evening browsing
    { dayOfWeek: 'tuesday', hourOfDay: 12 }, // Lunch scrolling
    { dayOfWeek: 'wednesday', hourOfDay: 20 }, // Evening browsing
    { dayOfWeek: 'thursday', hourOfDay: 11 }, // Morning listings
    { dayOfWeek: 'friday', hourOfDay: 17 }, // Weekend planning
    { dayOfWeek: 'saturday', hourOfDay: 10 }, // Weekend browsing
    { dayOfWeek: 'sunday', hourOfDay: 14 }, // Afternoon browsing
  ],

  // Psychology Profile (Hidden)
  psychologyProfile: {
    primaryTriggers: ['desire', 'trust', 'achievement'],
    secondaryTriggers: ['fear', 'urgency', 'belonging'],
    buyerJourneyStage: 'consideration', // Long research, but some urgency
    decisionDrivers: [
      'Visual appeal of properties',
      'Track record of success',
      'Local market knowledge',
      'Responsiveness and availability',
      'Communication style fit',
      'Negotiation skills',
      'Professional network (lenders, inspectors)',
      'Personal connection and trust',
    ],
    urgencyLevel: 'high', // "Just listed" and "under contract" create FOMO
    trustImportance: 'high', // Huge financial decision requires deep trust
  },
};
