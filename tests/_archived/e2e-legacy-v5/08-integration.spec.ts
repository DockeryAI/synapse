/**
 * Integration E2E Tests
 *
 * Tests cross-week compatibility and end-to-end flows.
 * Verifies Week 1-4 features work together without regressions.
 *
 * Because features should be friends, not frenemies.
 */

import { test, expect } from '@playwright/test';
import { mockSMBProfiles } from '../fixtures/smb-profiles';

test.describe('Integration Tests', () => {
  const ecommerceBusiness = mockSMBProfiles.ecommerceStore;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login
  });

  test('should integrate Product Scanner with Revenue Rush campaign', async ({ page }) => {
    // Step 1: Scan product to extract details
    await page.goto('/tools/product-scanner');

    // Enter Amazon URL
    await page.fill('[data-testid="product-url"]', 'https://www.amazon.com/dp/B08N5WRWNW');

    // Click scan
    await page.click('[data-testid="scan-product"]');

    // Mock Product Scanner API
    await page.route('**/api/product-scanner/scan', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          name: 'Wireless Bluetooth Headphones',
          price: 79.99,
          images: ['https://example.com/headphones.jpg'],
          description: 'Premium wireless headphones with noise cancellation',
          features: ['40-hour battery', 'Active Noise Cancellation', 'Comfortable fit'],
          reviews: {
            average_rating: 4.5,
            total_reviews: 12456,
          },
        }),
      });
    });

    // Wait for scan results
    await page.waitForSelector('[data-testid="scan-results"]', { timeout: 10000 });

    // Should show product details
    await expect(page.getByText('Wireless Bluetooth Headphones')).toBeVisible();
    await expect(page.getByText('$79.99')).toBeVisible();

    // Step 2: Create Revenue Rush campaign with product
    await page.click('[data-testid="create-campaign-from-product"]');

    // Should auto-navigate to campaign builder
    await expect(page).toHaveURL(/campaigns\/create/);

    // Should pre-select Revenue Rush
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Revenue Rush');

    // Should pre-fill product details
    await expect(page.getByTestId('campaign-product')).toContainText('Wireless Bluetooth Headphones');

    // Complete campaign setup
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="instagram"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 3: Verify campaign includes shoppable posts
    await expect(page.getByTestId('campaign-calendar')).toBeVisible();

    const shoppablePosts = await page.locator('[data-post-feature="shoppable"]').count();
    expect(shoppablePosts).toBeGreaterThan(0);

    // Posts should include product images
    await expect(page.getByText('Wireless Bluetooth Headphones')).toBeVisible();
  });

  test('should integrate UVP Generator with campaign creation', async ({ page }) => {
    // Step 1: Generate UVP
    await page.goto('/tools/uvp-generator');

    // Fill UVP form
    await page.fill('[data-testid="business-name"]', 'EcoHome Solutions');
    await page.fill('[data-testid="target-customer"]', 'environmentally conscious homeowners');
    await page.fill('[data-testid="main-benefit"]', 'reduce energy bills by 40%');
    await page.fill('[data-testid="differentiator"]', 'AI-powered energy optimization');

    // Generate UVP
    await page.click('[data-testid="generate-uvp"]');

    // Wait for results
    await page.waitForSelector('[data-testid="generated-uvp"]', { timeout: 10000 });

    const uvpText = await page.textContent('[data-testid="generated-uvp"]');
    expect(uvpText).toBeTruthy();
    expect(uvpText).toContain('EcoHome Solutions');

    // Step 2: Use UVP in Authority Builder campaign
    await page.click('[data-testid="use-in-campaign"]');

    // Should navigate to campaign builder
    await expect(page).toHaveURL(/campaigns\/create/);

    // Should pre-select Authority Builder (UVP = authority)
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Authority Builder');

    // Should include UVP in campaign brief
    await expect(page.getByTestId('campaign-brief')).toContainText(uvpText!);

    // Complete campaign
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="linkedin"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 3: Verify posts include UVP messaging
    const firstPost = page.locator('[data-testid="day-post"]').first();
    await firstPost.click();

    const postContent = await page.textContent('[data-testid="post-content"]');
    expect(postContent).toContain('energy'); // Should reference the UVP
  });

  test('should integrate Bannerbear with video template generation', async ({ page }) => {
    // Step 1: Create video with Bannerbear template
    await page.goto('/content/video/create');

    // Select Stories Ad template
    await page.click('[data-testid="video-template-stories-ad"]');

    // Fill video details
    await page.fill('[data-testid="video-headline"]', 'New Product Launch');
    await page.fill('[data-testid="video-subheadline"]', 'Limited Time Offer');

    // Upload product image
    await page.setInputFiles('[data-testid="product-image"]', './tests/fixtures/product-photo.jpg');

    // Generate video with Bannerbear
    await page.click('[data-testid="generate-video"]');

    // Mock Bannerbear API
    await page.route('**/api/bannerbear/generate', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          video_url: 'https://cdn.bannerbear.com/videos/test-video.mp4',
          thumbnail_url: 'https://cdn.bannerbear.com/images/test-thumbnail.jpg',
          duration: 15,
        }),
      });
    });

    // Wait for video generation
    await page.waitForSelector('[data-testid="video-preview"]', { timeout: 60000 });

    // Step 2: Add auto-captions with Whisper
    await page.click('[data-testid="add-captions"]');

    // Wait for captions
    await page.waitForSelector('[data-testid="captions-generated"]', { timeout: 30000 });

    // Step 3: Use video in Revenue Rush campaign
    await page.click('[data-testid="use-in-campaign"]');

    // Should navigate to campaign builder
    await expect(page).toHaveURL(/campaigns\/create/);

    // Should show video in campaign assets
    await expect(page.getByTestId('campaign-assets')).toBeVisible();
    await expect(page.locator('[data-asset-type="video"]')).toBeVisible();
  });

  test('should integrate GMB with local business campaigns', async ({ page }) => {
    // Set local business profile
    await page.evaluate((profile) => {
      (window as any).mockUserProfile = profile;
    }, mockSMBProfiles.localPlumber);

    // Step 1: Create Community Champion campaign
    await page.goto('/campaigns/create');

    await page.click('[data-goal="grow-community"]');
    await page.click('[data-testid="next-step"]');

    // Should auto-recommend GMB for local business
    await expect(page.getByText(/recommended.*google.*business/i)).toBeVisible();

    // Select GMB + Facebook
    await page.check('[data-platform="google-business"]');
    await page.check('[data-platform="facebook"]');

    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 2: Verify GMB posts scheduled 2x/week
    const gmbPosts = await page.locator('[data-platform="google-business"]').count();

    // 10-day campaign, 2x/week = ~3 GMB posts
    expect(gmbPosts).toBeGreaterThanOrEqual(2);
    expect(gmbPosts).toBeLessThanOrEqual(4);

    // Step 3: Verify GMB posts have correct types
    const firstGmbPost = page.locator('[data-platform="google-business"]').first();
    await firstGmbPost.click();

    // Should show GMB-specific fields
    await expect(page.getByTestId('gmb-post-type')).toBeVisible();
    await expect(page.getByTestId('gmb-cta')).toBeVisible();

    // Should have UPDATE, OFFER, or EVENT type
    const postType = await page.textContent('[data-testid="gmb-post-type"]');
    expect(['UPDATE', 'OFFER', 'EVENT']).toContain(postType);
  });

  test('should integrate Instagram Shopping with Revenue Rush campaign', async ({ page }) => {
    // Set e-commerce profile
    await page.evaluate((profile) => {
      (window as any).mockUserProfile = profile;
    }, ecommerceBusiness);

    // Step 1: Create Revenue Rush campaign
    await page.goto('/campaigns/create');

    await page.click('[data-goal="generate-revenue"]');
    await page.click('[data-testid="next-step"]');

    // Should recommend Instagram for e-commerce
    await expect(page.getByText(/recommended.*instagram/i)).toBeVisible();

    await page.check('[data-platform="instagram"]');
    await page.check('[data-platform="facebook"]');

    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 2: Tag products in posts
    const firstPost = page.locator('[data-testid="day-post"]').first();
    await firstPost.click();

    // Should show product tagging option
    await expect(page.getByTestId('tag-products-btn')).toBeVisible();

    // Tag product
    await page.click('[data-testid="tag-products-btn"]');

    // Should show product catalog
    await expect(page.getByTestId('product-catalog')).toBeVisible();

    // Select product from fixture
    await page.click(`[data-product-name="${ecommerceBusiness.products![0].name}"]`);

    // Should tag product to post
    await expect(page.getByTestId('product-tag')).toBeVisible();

    // Step 3: Verify shoppable post count
    await page.click('[data-testid="close-post-editor"]');

    const shoppablePosts = await page.locator('[data-post-feature="shoppable"]').count();

    // Revenue Rush should have high percentage of shoppable posts
    const totalPosts = await page.locator('[data-testid="day-post"]').count();
    const shoppablePercentage = shoppablePosts / totalPosts;

    expect(shoppablePercentage).toBeGreaterThan(0.5); // At least 50% shoppable
  });

  test('should integrate seasonal calendar with campaign creation', async ({ page }) => {
    // Step 1: View seasonal calendar
    await page.goto('/tactics/seasonal-calendar');

    // Mock current date to November
    await page.evaluate(() => {
      const mockDate = new Date('2024-11-15');
      Date.now = () => mockDate.getTime();
    });

    await page.reload();

    // Click Black Friday event
    await page.click('[data-event="black-friday"]');

    // Step 2: Generate campaign from event
    await page.click('[data-testid="generate-seasonal-campaign"]');

    // Should navigate to campaign builder
    await expect(page).toHaveURL(/campaigns\/create/);

    // Should pre-select Revenue Rush
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Revenue Rush');

    // Should pre-fill campaign name
    const campaignName = await page.inputValue('[data-testid="campaign-name"]');
    expect(campaignName).toContain('Black Friday');

    // Should pre-select 5-day duration (short push)
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="instagram"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');

    const duration = await page.inputValue('[data-testid="campaign-duration"]');
    expect(duration).toBe('5');

    // Step 3: Verify campaign includes urgency messaging
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    const posts = await page.locator('[data-testid="day-post"]').all();

    // Should include Black Friday urgency
    let hasUrgency = false;
    for (const post of posts) {
      const content = await post.textContent();
      if (content?.match(/black friday|limited time|today only|last chance/i)) {
        hasUrgency = true;
        break;
      }
    }

    expect(hasUrgency).toBe(true);
  });

  test('should integrate UGC contest with Community Champion campaign', async ({ page }) => {
    // Step 1: Generate UGC contest
    await page.goto('/tactics/ugc-contest');

    await page.selectOption('[data-testid="contest-type"]', 'photo_contest');
    await page.fill('[data-testid="contest-name"]', 'Summer Style Challenge');
    await page.fill('[data-testid="contest-hashtag"]', '#SummerStyleChallenge');
    await page.fill('[data-testid="contest-prize"]', '$200 Gift Card');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    await page.fill('[data-testid="contest-start"]', startDate.toISOString().split('T')[0]);
    await page.fill('[data-testid="contest-end"]', endDate.toISOString().split('T')[0]);

    await page.click('[data-testid="generate-ugc-contest"]');

    // Should show generated contest post
    await expect(page.getByTestId('generated-contest-post')).toBeVisible();

    // Step 2: Add to Community Champion campaign
    await page.click('[data-testid="add-to-campaign"]');

    // Should show campaign selector
    await expect(page.getByText('Add to Campaign')).toBeVisible();

    // Create new Community Champion campaign
    await page.click('[data-testid="create-new-campaign"]');

    // Should pre-select Community Champion
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Community Champion');

    // Complete campaign
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="instagram"]');
    await page.check('[data-platform="tiktok"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 3: Verify contest post is included
    const contestPost = page.locator('[data-post-type="ugc-contest"]');
    await expect(contestPost).toBeVisible();

    // Should include hashtag
    await contestPost.click();
    const content = await page.textContent('[data-testid="post-content"]');
    expect(content).toContain('#SummerStyleChallenge');
  });

  test('should integrate email capture landing page with Revenue Rush campaign', async ({ page }) => {
    // Step 1: Create landing page
    await page.goto('/tactics/landing-page');

    await page.click('[data-testid="template-lead-magnet"]');
    await page.fill('[data-testid="headline"]', 'Get 20% Off Your First Order');
    await page.fill('[data-testid="subheadline"]', 'Plus exclusive access to new arrivals');
    await page.fill('[data-testid="cta-button"]', 'Claim My Discount');

    await page.click('[data-testid="generate-landing-page"]');

    // Should show preview
    await expect(page.getByTestId('landing-page-preview')).toBeVisible();

    // Get landing page URL
    const landingPageUrl = await page.textContent('[data-testid="landing-page-url"]');

    // Step 2: Create Revenue Rush campaign with landing page link
    await page.click('[data-testid="use-in-campaign"]');

    // Should create Revenue Rush campaign
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Revenue Rush');

    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="instagram"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 3: Verify posts include landing page link
    const posts = await page.locator('[data-testid="day-post"]').all();

    let hasLandingPageLink = false;
    for (const post of posts) {
      await post.click();
      const content = await page.textContent('[data-testid="post-content"]');
      if (content?.includes(landingPageUrl!)) {
        hasLandingPageLink = true;
        break;
      }
      await page.click('[data-testid="close-post-editor"]');
    }

    expect(hasLandingPageLink).toBe(true);
  });

  test('should integrate trending audio with Viral Spark campaign', async ({ page }) => {
    // Step 1: Create Viral Spark campaign
    await page.goto('/campaigns/create');

    await page.click('[data-goal="go-viral"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="tiktok"]');
    await page.check('[data-platform="instagram"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Step 2: Verify video posts include trending audio option
    const videoPosts = await page.locator('[data-post-type="video"]').all();

    expect(videoPosts.length).toBeGreaterThan(0);

    // Click first video post
    await videoPosts[0].click();

    // Should have trending audio selector
    await expect(page.getByTestId('select-trending-audio')).toBeVisible();

    // Open trending audio
    await page.click('[data-testid="select-trending-audio"]');

    // Should show trending audio list
    await expect(page.getByTestId('trending-audio-list')).toBeVisible();

    // Should have audio marked as trending
    const trendingAudio = page.locator('[data-trending="true"]').first();
    await expect(trendingAudio).toBeVisible();

    // Select audio
    await trendingAudio.click();

    // Should show selected audio
    await expect(page.getByTestId('selected-audio-name')).toBeVisible();
  });

  test('should handle mobile-optimized content across all campaign types', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14

    // Create various campaign types and verify mobile optimization
    const campaignTypes = [
      { goal: 'build-authority', type: 'Authority Builder' },
      { goal: 'grow-community', type: 'Community Champion' },
      { goal: 'generate-revenue', type: 'Revenue Rush' },
    ];

    for (const campaign of campaignTypes) {
      await page.goto('/campaigns/create');

      await page.click(`[data-goal="${campaign.goal}"]`);
      await page.click('[data-testid="next-step"]');
      await page.check('[data-platform="instagram"]');
      await page.check('[data-platform="tiktok"]');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="generate-campaign"]');

      // Verify all video posts are 9:16
      const videoPosts = await page.locator('[data-post-type="video"]').all();

      for (const post of videoPosts) {
        await post.click();

        const aspectRatio = await page.getAttribute('[data-testid="video-aspect-ratio"]', 'data-value');
        expect(aspectRatio).toBe('9:16');

        await page.click('[data-testid="close-post-editor"]');
      }
    }
  });

  test('should prevent regressions in video generation', async ({ page }) => {
    // Create video
    await page.goto('/content/video/create');

    await page.click('[data-testid="video-template-stories-ad"]');
    await page.fill('[data-testid="video-duration"]', '30');
    await page.selectOption('[data-testid="video-aspect-ratio"]', '9:16');
    await page.click('[data-testid="generate-video"]');

    // Wait for generation
    await page.waitForSelector('[data-testid="video-preview"]', { timeout: 60000 });

    // Verify video properties
    const video = page.locator('video').first();
    const bounds = await video.boundingBox();

    if (bounds) {
      const ratio = bounds.height / bounds.width;
      expect(ratio).toBeCloseTo(16 / 9, 0.1); // 9:16 ratio
    }

    // Verify duration is within range
    const duration = await video.evaluate((v: HTMLVideoElement) => v.duration);
    expect(duration).toBeGreaterThanOrEqual(15);
    expect(duration).toBeLessThanOrEqual(60);

    // Add captions
    await page.click('[data-testid="add-captions"]');
    await page.waitForSelector('[data-testid="captions-generated"]', { timeout: 30000 });

    // Verify captions exist
    const captionsPreview = page.getByTestId('captions-preview');
    await expect(captionsPreview).toBeVisible();
  });

  test('should prevent regressions in platform selection enforcement', async ({ page }) => {
    await page.goto('/campaigns/create');

    await page.click('[data-goal="build-authority"]');
    await page.click('[data-testid="next-step"]');

    // Select 3 platforms
    await page.check('[data-platform="linkedin"]');
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="instagram"]');

    // Try to select 4th platform
    await page.check('[data-platform="tiktok"]');

    // Should show error
    await expect(page.getByText(/maximum.*3.*platforms/i)).toBeVisible();

    // 4th platform should be disabled or unchecked
    const tiktokCheckbox = page.locator('[data-platform="tiktok"]');
    const isChecked = await tiktokCheckbox.isChecked();
    const isDisabled = await tiktokCheckbox.isDisabled();

    expect(isChecked === false || isDisabled === true).toBe(true);
  });

  test('should prevent regressions in GMB posting frequency', async ({ page }) => {
    await page.goto('/settings/integrations/gmb/schedule');

    // Set up 2x/week schedule
    await page.selectOption('[data-testid="posting-frequency"]', 'twice_weekly');
    await page.check('[data-testid="posting-day-tuesday"]');
    await page.check('[data-testid="posting-day-friday"]');
    await page.fill('[data-testid="posting-time"]', '10:00');
    await page.click('[data-testid="save-schedule"]');

    // Verify saved
    await expect(page.getByText(/schedule.*saved/i)).toBeVisible();

    // Create campaign and verify GMB posts follow schedule
    await page.goto('/campaigns/create');

    await page.evaluate((profile) => {
      (window as any).mockUserProfile = profile;
    }, mockSMBProfiles.localPlumber);

    await page.click('[data-goal="build-trust"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="google-business"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Verify GMB posts are on Tuesday and Friday
    const gmbPosts = await page.locator('[data-platform="google-business"]').all();

    for (const post of gmbPosts) {
      const dayOfWeek = await post.getAttribute('data-day-of-week');
      expect(['Tuesday', 'Friday']).toContain(dayOfWeek);
    }
  });

  test('should prevent regressions in engagement benchmark calculations', async ({ page }) => {
    await page.goto('/analytics/performance');

    // Mock performance data
    await page.route('**/api/analytics/performance', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          total_reach: 10000,
          total_engagement: 600,
          engagement_rate: 0.06, // 6%
        }),
      });
    });

    await page.reload();

    // Verify engagement rate calculation
    const engagementRate = await page.textContent('[data-testid="engagement-rate"]');
    expect(engagementRate).toContain('6%');

    // Engagement should be: total_engagement / total_reach
    // 600 / 10000 = 0.06 = 6%
  });
});
