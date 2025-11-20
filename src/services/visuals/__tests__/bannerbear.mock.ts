/**
 * BANNERBEAR MOCK DATA
 *
 * Mock responses for testing Bannerbear integration
 * Simulates API responses without actual API calls
 *
 * Philosophy: "Test with reality, mock for reliability"
 */

import type { GenerateCampaignVisualRequest, GeneratedVisual, BatchVisualResult } from '../../../types/campaign-visual.types';
import type { CampaignTypeId } from '../../../types/campaign.types';

// ============================================================================
// MOCK API RESPONSES
// ============================================================================

/**
 * Mock Bannerbear image creation response
 */
export const mockBannerbearCreateResponse = {
  uid: 'abc123def456',
  status: 'pending' as const,
  created_at: new Date().toISOString(),
  self: 'https://api.bannerbear.com/v2/images/abc123def456',
};

/**
 * Mock Bannerbear completed image
 */
export const mockBannerbearCompletedImage = {
  uid: 'abc123def456',
  status: 'completed' as const,
  image_url: 'https://cdn.bannerbear.com/sample/abc123def456/final.png',
  image_url_png: 'https://cdn.bannerbear.com/sample/abc123def456/final.png',
  image_url_jpg: 'https://cdn.bannerbear.com/sample/abc123def456/final.jpg',
  created_at: new Date().toISOString(),
  self: 'https://api.bannerbear.com/v2/images/abc123def456',
};

/**
 * Mock template list
 */
export const mockBannerbearTemplates = [
  {
    uid: 'TEMPLATE_AUTHORITY_001',
    name: 'Authority Builder - Professional',
    width: 1200,
    height: 627,
    tags: ['authority', 'professional', 'linkedin'],
    available_modifications: ['headline', 'subheadline', 'key_stat', 'supporting_text', 'logo', 'primary_color'],
  },
  {
    uid: 'TEMPLATE_SOCIAL_001',
    name: 'Social Proof - Testimonial',
    width: 1080,
    height: 1080,
    tags: ['social-proof', 'testimonial', 'instagram'],
    available_modifications: ['headline', 'testimonial_text', 'customer_name', 'result_text', 'logo', 'primary_color'],
  },
  {
    uid: 'TEMPLATE_LOCAL_001',
    name: 'Local Pulse - Community',
    width: 1200,
    height: 630,
    tags: ['local', 'community', 'facebook'],
    available_modifications: ['headline', 'subheadline', 'location_text', 'date_text', 'event_description', 'logo', 'primary_color'],
  },
];

// ============================================================================
// MOCK GENERATED VISUALS
// ============================================================================

/**
 * Mock Authority Builder visual
 */
export const mockAuthorityBuilderVisual: GeneratedVisual = {
  id: 'visual_auth_001',
  campaignType: 'authority_builder',
  platform: 'linkedin',
  format: 'feed',
  imageUrl: 'https://cdn.bannerbear.com/sample/authority_builder_linkedin.png',
  bannerbearUid: 'auth_abc123',
  templateId: 'TEMPLATE_AUTHORITY_001',
  metadata: {
    generatedAt: new Date(),
    generationTime: 8500,
    dimensions: { width: 1200, height: 627 },
    aspectRatio: '1.91:1',
  },
  status: 'completed',
};

/**
 * Mock Social Proof visual
 */
export const mockSocialProofVisual: GeneratedVisual = {
  id: 'visual_social_001',
  campaignType: 'trust_builder',
  platform: 'instagram',
  format: 'feed',
  imageUrl: 'https://cdn.bannerbear.com/sample/social_proof_instagram.png',
  bannerbearUid: 'social_def456',
  templateId: 'TEMPLATE_SOCIAL_001',
  metadata: {
    generatedAt: new Date(),
    generationTime: 9200,
    dimensions: { width: 1080, height: 1080 },
    aspectRatio: '1:1',
  },
  status: 'completed',
};

/**
 * Mock Local Pulse visual
 */
export const mockLocalPulseVisual: GeneratedVisual = {
  id: 'visual_local_001',
  campaignType: 'community_champion',
  platform: 'facebook',
  format: 'feed',
  imageUrl: 'https://cdn.bannerbear.com/sample/local_pulse_facebook.png',
  bannerbearUid: 'local_ghi789',
  templateId: 'TEMPLATE_LOCAL_001',
  metadata: {
    generatedAt: new Date(),
    generationTime: 7800,
    dimensions: { width: 1200, height: 630 },
    aspectRatio: '1.91:1',
  },
  status: 'completed',
};

/**
 * Mock failed visual
 */
export const mockFailedVisual: GeneratedVisual = {
  id: 'visual_failed_001',
  campaignType: 'authority_builder',
  platform: 'twitter',
  format: 'feed',
  imageUrl: '',
  bannerbearUid: '',
  templateId: 'TEMPLATE_AUTHORITY_001',
  metadata: {
    generatedAt: new Date(),
    generationTime: 2000,
    dimensions: { width: 0, height: 0 },
    aspectRatio: '0:0',
  },
  status: 'failed',
  error: 'Template not configured in Bannerbear dashboard',
};

// ============================================================================
// MOCK BATCH RESULTS
// ============================================================================

/**
 * Mock batch visual generation (all platforms)
 */
export const mockBatchAllPlatforms: BatchVisualResult = {
  total: 4,
  completed: 3,
  failed: 1,
  visuals: [
    mockAuthorityBuilderVisual,
    {
      ...mockAuthorityBuilderVisual,
      id: 'visual_auth_002',
      platform: 'facebook',
      imageUrl: 'https://cdn.bannerbear.com/sample/authority_builder_facebook.png',
    },
    {
      ...mockAuthorityBuilderVisual,
      id: 'visual_auth_003',
      platform: 'instagram',
      imageUrl: 'https://cdn.bannerbear.com/sample/authority_builder_instagram.png',
      metadata: {
        ...mockAuthorityBuilderVisual.metadata,
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: '1:1',
      },
    },
    mockFailedVisual,
  ],
  errors: [
    { platform: 'twitter', error: 'Template not configured in Bannerbear dashboard' },
  ],
};

// ============================================================================
// MOCK REQUEST FACTORIES
// ============================================================================

/**
 * Create mock visual request for Authority Builder
 */
export function createMockAuthorityBuilderRequest(): GenerateCampaignVisualRequest {
  return {
    campaignType: 'authority_builder',
    platform: 'linkedin',
    format: 'feed',
    content: {
      headline: '5 Industry Trends Every Business Should Watch in 2024',
      subheadline: 'Expert Analysis',
      bodyText: 'Stay ahead of the competition with these data-driven insights',
      stats: ['73% growth in Q4'],
      brandName: 'Acme Industries',
    },
    branding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
    },
  };
}

/**
 * Create mock visual request for Social Proof
 */
export function createMockSocialProofRequest(): GenerateCampaignVisualRequest {
  return {
    campaignType: 'trust_builder',
    platform: 'instagram',
    format: 'feed',
    content: {
      headline: 'Real Results from Real Customers',
      testimonial: 'Working with Acme transformed our business. We saw results in just 2 weeks!',
      customerName: 'Sarah Johnson, CEO',
      brandName: 'Acme Industries',
    },
    branding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#10B981',
    },
  };
}

/**
 * Create mock visual request for Local Pulse
 */
export function createMockLocalPulseRequest(): GenerateCampaignVisualRequest {
  return {
    campaignType: 'community_champion',
    platform: 'facebook',
    format: 'feed',
    content: {
      headline: 'Supporting the Austin Tech Community',
      subheadline: 'Join Us This Weekend',
      location: 'Austin, TX',
      bodyText: 'Special offers for local tech startups at SXSW',
      brandName: 'Acme Industries',
    },
    branding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#F59E0B',
    },
  };
}

// ============================================================================
// MOCK SERVICE (FOR TESTING WITHOUT API)
// ============================================================================

/**
 * Mock Bannerbear service for testing
 * Simulates API behavior without making real requests
 */
export class MockBannerbearService {
  async generateCampaignVisual(request: GenerateCampaignVisualRequest): Promise<GeneratedVisual> {
    // Simulate network delay
    await this.delay(500);

    // Return appropriate mock based on campaign type
    switch (request.campaignType) {
      case 'authority_builder':
        return { ...mockAuthorityBuilderVisual, platform: request.platform };
      case 'trust_builder':
        return { ...mockSocialProofVisual, platform: request.platform };
      case 'community_champion':
        return { ...mockLocalPulseVisual, platform: request.platform };
      default:
        return mockFailedVisual;
    }
  }

  async generateAllPlatforms(request: { campaignType: CampaignTypeId }): Promise<BatchVisualResult> {
    // Simulate longer delay for batch
    await this.delay(2000);

    return mockBatchAllPlatforms;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const mockBannerbearService = new MockBannerbearService();
