/**
 * Mock SMB Profiles for E2E Testing
 *
 * Representative business profiles for different industries and use cases.
 * Because testing with "Test Business 1" tells you nothing.
 */

export interface MockSMBProfile {
  id: string;
  businessName: string;
  industry: string;
  businessType: 'local-service' | 'restaurant' | 'retail' | 'ecommerce' | 'professional-service' | 'b2b' | 'creator';
  location?: string;
  website?: string;
  phoneNumber?: string;
  description: string;
  products?: Array<{
    name: string;
    description: string;
    price: number;
    image_url?: string;
  }>;
  socialAccounts?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
  };
  gmbLocation?: {
    location_id: string;
    address: string;
    is_verified: boolean;
  };
  expectedCampaignType?: string;
  expectedPlatforms?: string[];
}

export const mockSMBProfiles: Record<string, MockSMBProfile> = {
  localPlumber: {
    id: 'local-plumber-001',
    businessName: 'Austin Emergency Plumbing',
    industry: 'Home Services',
    businessType: 'local-service',
    location: 'Austin, TX',
    website: 'https://austinemergencyplumbing.com',
    phoneNumber: '+1-512-555-0123',
    description: 'Fast, reliable emergency plumbing services available 24/7. Family-owned since 1998.',
    socialAccounts: {
      facebook: 'https://facebook.com/austinplumbing',
      instagram: 'https://instagram.com/austinplumbing',
    },
    gmbLocation: {
      location_id: 'loc-austin-plumbing',
      address: '123 Main St, Austin, TX 78701',
      is_verified: true,
    },
    expectedCampaignType: 'community-champion',
    expectedPlatforms: ['facebook', 'google-business', 'instagram'],
  },

  italianRestaurant: {
    id: 'restaurant-001',
    businessName: 'Bella Vita Trattoria',
    industry: 'Restaurant',
    businessType: 'restaurant',
    location: 'Brooklyn, NY',
    website: 'https://bellavitanyc.com',
    phoneNumber: '+1-718-555-0199',
    description: 'Authentic Italian cuisine in the heart of Brooklyn. Fresh pasta made daily.',
    products: [
      {
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, basil, San Marzano tomatoes',
        price: 18,
        image_url: 'https://example.com/pizza.jpg',
      },
      {
        name: 'Carbonara',
        description: 'Traditional Roman pasta with guanciale and pecorino',
        price: 22,
        image_url: 'https://example.com/carbonara.jpg',
      },
    ],
    socialAccounts: {
      facebook: 'https://facebook.com/bellavitanyc',
      instagram: 'https://instagram.com/bellavitanyc',
      tiktok: 'https://tiktok.com/@bellavitanyc',
    },
    gmbLocation: {
      location_id: 'loc-bellavita',
      address: '456 Smith St, Brooklyn, NY 11201',
      is_verified: true,
    },
    expectedCampaignType: 'community-champion',
    expectedPlatforms: ['instagram', 'facebook', 'tiktok'],
  },

  ecommerceStore: {
    id: 'ecommerce-001',
    businessName: 'Sustainable Style Co',
    industry: 'Fashion & Apparel',
    businessType: 'ecommerce',
    website: 'https://sustainablestyle.shop',
    description: 'Eco-friendly fashion for conscious consumers. Sustainable materials, ethical production.',
    products: [
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Fair-trade certified organic cotton tee',
        price: 32,
        image_url: 'https://example.com/tshirt.jpg',
      },
      {
        name: 'Recycled Denim Jeans',
        description: 'Made from 100% recycled denim',
        price: 89,
        image_url: 'https://example.com/jeans.jpg',
      },
      {
        name: 'Bamboo Hoodie',
        description: 'Soft, sustainable bamboo fabric',
        price: 68,
        image_url: 'https://example.com/hoodie.jpg',
      },
    ],
    socialAccounts: {
      instagram: 'https://instagram.com/sustainablestyle',
      facebook: 'https://facebook.com/sustainablestyle',
      tiktok: 'https://tiktok.com/@sustainablestyle',
    },
    expectedCampaignType: 'revenue-rush',
    expectedPlatforms: ['instagram', 'facebook', 'tiktok'],
  },

  b2bConsultant: {
    id: 'b2b-001',
    businessName: 'Strategic Growth Partners',
    industry: 'Management Consulting',
    businessType: 'b2b',
    location: 'San Francisco, CA',
    website: 'https://strategicgrowthpartners.com',
    phoneNumber: '+1-415-555-0177',
    description: 'Helping mid-market companies scale efficiently. 20+ years combined experience.',
    socialAccounts: {
      linkedin: 'https://linkedin.com/company/strategic-growth-partners',
      facebook: 'https://facebook.com/strategicgrowthpartners',
    },
    expectedCampaignType: 'authority-builder',
    expectedPlatforms: ['linkedin', 'facebook'],
  },

  contentCreator: {
    id: 'creator-001',
    businessName: 'TechLife with Sarah',
    industry: 'Content Creation',
    businessType: 'creator',
    description: 'Tech reviews, productivity tips, and digital lifestyle content for millennials.',
    socialAccounts: {
      tiktok: 'https://tiktok.com/@techlifewithsarah',
      instagram: 'https://instagram.com/techlifewithsarah',
      youtube: 'https://youtube.com/@techlifewithsarah',
    },
    expectedCampaignType: 'viral-spark',
    expectedPlatforms: ['tiktok', 'instagram', 'youtube-shorts'],
  },

  retailStore: {
    id: 'retail-001',
    businessName: 'Artisan Home Goods',
    industry: 'Home & Garden',
    businessType: 'retail',
    location: 'Portland, OR',
    website: 'https://artisanhomegoods.com',
    phoneNumber: '+1-503-555-0145',
    description: 'Curated collection of handcrafted home decor and furniture from local artisans.',
    products: [
      {
        name: 'Hand-Carved Wooden Bowl',
        description: 'Locally sourced oak, food-safe finish',
        price: 75,
        image_url: 'https://example.com/bowl.jpg',
      },
      {
        name: 'Ceramic Vase Set',
        description: 'Set of 3 hand-thrown ceramic vases',
        price: 120,
        image_url: 'https://example.com/vases.jpg',
      },
    ],
    socialAccounts: {
      instagram: 'https://instagram.com/artisanhomegoods',
      facebook: 'https://facebook.com/artisanhomegoods',
    },
    gmbLocation: {
      location_id: 'loc-artisan',
      address: '789 Pearl St, Portland, OR 97201',
      is_verified: true,
    },
    expectedCampaignType: 'revenue-rush',
    expectedPlatforms: ['instagram', 'facebook', 'google-business'],
  },
};

// Test user credentials
export const testUsers = {
  basic: {
    email: 'test+basic@synapse.test',
    password: 'TestPassword123!',
    userId: 'user-test-basic-001',
  },
  premium: {
    email: 'test+premium@synapse.test',
    password: 'TestPassword123!',
    userId: 'user-test-premium-001',
  },
  admin: {
    email: 'admin@dockeryai.com',
    password: 'admin123',
    userId: 'user-admin-001',
  },
};

// Expected performance metrics for verification
export const expectedMetrics = {
  videoEngagement: {
    min: 10, // 10x engagement boost claim
    baseline: 1,
  },
  gmbVisibility: {
    multiplier: 5, // 5x local visibility claim
  },
  socialCommerceConversion: {
    min: 0.02, // 2% conversion rate
    max: 0.04, // 4% conversion rate
  },
  ugcEngagement: {
    boost: 0.30, // 30% engagement boost claim
  },
  q4RevenueEmphasis: {
    percentage: 0.40, // 40% of annual revenue in Q4
  },
  thumbScrollStopping: {
    minScore: 0.70, // 70%+ stop rate
  },
  day3PivotThreshold: {
    engagement: 0.02, // < 2% engagement triggers pivot
  },
};

export default mockSMBProfiles;
