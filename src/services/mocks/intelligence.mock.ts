/**
 * Mock Intelligence Data for Testing
 *
 * Provides realistic mock data for all 17 intelligence sources
 * Used for independent development before backend services are complete
 */

import { IntelligenceResult, SpecialtyDetection } from '../synapse-calendar-bridge.service';

// ============================================================================
// INTELLIGENCE SOURCE MOCKS
// ============================================================================

export const intelligenceMock: IntelligenceResult[] = [
  // 1. Apify - Web Scraping
  {
    source: 'apify',
    success: true,
    duration: 5000,
    data: {
      websiteContent: {
        about: 'We specialize in custom wedding cakes and elegant dessert displays for your special day.',
        services: ['Custom Wedding Cakes', 'Cake Tastings', 'Delivery & Setup'],
        mentions: {
          'custom cakes': 47,
          'wedding': 89,
          'handcrafted': 23
        }
      },
      socialProfiles: {
        instagram: '@sweetweddingcakes',
        facebook: 'SweetWeddingCakes',
        pinterest: 'sweetweddingcakes'
      }
    }
  },

  // 2. OutScraper - Google Business Profile
  {
    source: 'outscaper',
    success: true,
    duration: 8000,
    data: {
      businessProfile: {
        name: 'Sweet Wedding Cakes',
        rating: 4.8,
        totalReviews: 127,
        category: 'Bakery',
        address: '123 Main St, Portland, OR 97201',
        phone: '(503) 555-0123',
        hours: 'Tue-Sat 10AM-6PM'
      },
      reviews: [
        {
          rating: 5,
          text: 'Amazing custom cake for our wedding! The attention to detail was incredible.',
          author: 'Sarah M.',
          date: '2024-10-15',
          likes: 12
        },
        {
          rating: 5,
          text: 'Best wedding cake we\'ve ever tasted. Beautifully designed too!',
          author: 'James K.',
          date: '2024-09-22',
          likes: 8
        }
      ],
      commonMentions: ['custom design', 'fresh ingredients', 'professional service', 'on-time delivery']
    }
  },

  // 3-10. Serper - 8 endpoints
  {
    source: 'serper',
    success: true,
    duration: 3000,
    data: {
      search: {
        topResults: [
          { title: 'Wedding Cake Trends 2024', url: 'example.com/trends' },
          { title: 'Choosing the Perfect Wedding Cake', url: 'example.com/guide' }
        ]
      },
      news: {
        articles: [
          { title: 'Wedding Industry Booming in Portland', source: 'Portland Business Journal', date: '2024-11-01' }
        ]
      },
      trends: {
        rising: ['minimalist wedding cakes', 'naked cakes', 'sustainable ingredients'],
        steady: ['classic tiered cakes', 'fondant designs']
      },
      autocomplete: {
        suggestions: ['wedding cakes near me', 'custom wedding cake prices', 'wedding cake flavors']
      },
      places: {
        competitors: [
          { name: 'Cake Boutique', rating: 4.6, reviews: 89 },
          { name: 'Portland Pastries', rating: 4.4, reviews: 156 }
        ]
      },
      images: {
        topImages: ['wedding-cake-1.jpg', 'wedding-cake-2.jpg']
      },
      videos: {
        trending: ['How to Choose a Wedding Cake', 'Wedding Cake Decorating Tutorial']
      },
      shopping: {
        products: ['Cake Toppers', 'Fondant Tools', 'Cake Stands']
      }
    }
  },

  // 11. SEMrush - SEO Intelligence
  {
    source: 'semrush',
    success: true,
    duration: 6000,
    data: {
      keywords: [
        { keyword: 'wedding cakes portland', volume: 1200, difficulty: 45 },
        { keyword: 'custom wedding cakes', volume: 890, difficulty: 52 },
        { keyword: 'wedding cake delivery', volume: 560, difficulty: 38 }
      ],
      organicTraffic: 2400,
      backlinks: 34,
      topPages: ['/custom-cakes', '/wedding-packages', '/gallery']
    }
  },

  // 12. YouTube API - Video Intelligence
  {
    source: 'youtube',
    success: true,
    duration: 4000,
    data: {
      trendingTopics: ['Cake Decorating Hacks', 'Wedding Cake Fails', 'DIY Wedding Cakes'],
      topVideos: [
        { title: 'Amazing Wedding Cake Transformation', views: 1200000 },
        { title: 'Behind the Scenes: Wedding Cake Making', views: 890000 }
      ]
    }
  },

  // 13. News API - Media Intelligence
  {
    source: 'news',
    success: true,
    duration: 3000,
    data: {
      articles: [
        {
          title: 'Wedding Season Kicks Off Strong in Portland',
          source: 'Oregon Live',
          date: '2024-11-10',
          summary: 'Local wedding businesses seeing 30% increase in bookings'
        }
      ]
    }
  },

  // 14. Weather API - Contextual Intelligence
  {
    source: 'weather',
    success: true,
    duration: 2000,
    data: {
      forecast: [
        { date: '2024-11-20', condition: 'sunny', temp: 68, wedding_weather_score: 95 },
        { date: '2024-11-21', condition: 'partly cloudy', temp: 65, wedding_weather_score: 85 }
      ],
      seasonalTrends: 'Peak wedding season approaching (May-September)'
    }
  },

  // 15. Claude AI - Brand Intelligence
  {
    source: 'claude',
    success: true,
    duration: 12000,
    data: {
      brandVoice: {
        tone: 'warm and professional',
        style: 'conversational with expertise',
        keywords: ['custom', 'handcrafted', 'elegant', 'special day']
      },
      valuePropositions: [
        'Custom designs tailored to your vision',
        'Fresh, quality ingredients',
        'Experienced wedding cake specialists',
        'Reliable delivery and setup'
      ],
      targetAudience: {
        primary: 'Engaged couples planning weddings',
        secondary: 'Event planners, wedding coordinators'
      }
    }
  },

  // 16. Google Maps - Location Intelligence
  {
    source: 'maps',
    success: true,
    duration: 2000,
    data: {
      geocoding: {
        lat: 45.5152,
        lng: -122.6784,
        city: 'Portland',
        state: 'Oregon',
        country: 'USA'
      },
      serviceArea: ['Portland Metro', 'Beaverton', 'Lake Oswego', 'Vancouver WA']
    }
  },

  // 17. Reddit - SMB Opportunity Intelligence
  {
    source: 'reddit',
    success: true,
    duration: 5000,
    data: {
      opportunities: [
        {
          subreddit: 'r/weddingplanning',
          post: 'Looking for wedding cake recommendations in Portland',
          upvotes: 45,
          comments: 23,
          opportunity_type: 'direct_request'
        },
        {
          subreddit: 'r/Portland',
          post: 'Best bakeries for custom cakes?',
          upvotes: 78,
          comments: 56,
          opportunity_type: 'indirect_request'
        }
      ],
      topCommunities: [
        'r/weddingplanning',
        'r/Portland',
        'r/Baking',
        'r/wedding',
        'r/Oregon'
      ],
      contentIdeas: [
        'Wedding cake pricing guide',
        'How to choose flavors for your wedding cake',
        'Wedding cake trends 2024',
        'Delivery and setup FAQ'
      ],
      commonQuestions: [
        'How much do custom wedding cakes cost?',
        'How far in advance should I order?',
        'Do you do tastings?',
        'What flavors do you offer?'
      ]
    }
  }
];

// ============================================================================
// SPECIALTY DETECTION MOCK
// ============================================================================

export const specialtyMock: SpecialtyDetection = {
  industry: 'bakery',
  specialty: 'wedding cakes',
  nicheKeywords: ['custom cakes', 'wedding events', 'handcrafted desserts', 'elegant designs'],
  targetMarket: 'engaged couples',
  confidence: 87,
  reasoning: 'Website mentions "wedding cakes" 89 times, "custom cakes" 47 times, and reviews frequently reference wedding events',
  industryProfileId: 'bakery-wedding'
};

// ============================================================================
// FAILED INTELLIGENCE MOCK (for testing graceful degradation)
// ============================================================================

export const failedIntelligenceMock: IntelligenceResult[] = [
  {
    source: 'apify',
    success: false,
    duration: 30000,
    error: 'Timeout after 30 seconds',
    data: null
  },
  {
    source: 'outscaper',
    success: true,
    duration: 8000,
    data: intelligenceMock[1].data
  },
  {
    source: 'serper',
    success: true,
    duration: 3000,
    data: intelligenceMock[2].data
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get mock intelligence data for a specific source
 */
export const getMockIntelligence = (source: string): IntelligenceResult | undefined => {
  return intelligenceMock.find(intel => intel.source === source);
};

/**
 * Get successful intelligence sources count
 */
export const getSuccessfulSourcesCount = (intelligence: IntelligenceResult[]): number => {
  return intelligence.filter(intel => intel.success).length;
};

/**
 * Check if minimum viable data threshold is met (50% of sources)
 */
export const meetsMinimumDataThreshold = (intelligence: IntelligenceResult[]): boolean => {
  const successful = getSuccessfulSourcesCount(intelligence);
  const total = intelligence.length;
  return (successful / total) >= 0.5;
};
