/**
 * Immediate Win Tactics E2E Tests
 *
 * Tests UGC contests, hashtag formulas, email capture, seasonal calendars.
 * Verifies 30% engagement boost for UGC and Q4 40% revenue emphasis.
 *
 * Because some tactics work immediately, and we need to prove it.
 */

import { test, expect } from '@playwright/test';
import { mockSMBProfiles, expectedMetrics } from '../fixtures/smb-profiles';

test.describe('Immediate Win Tactics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login
  });

  test('should generate UGC contest template', async ({ page }) => {
    await page.goto('/tactics/ugc-contest');

    // Select contest type
    await page.selectOption('[data-testid="contest-type"]', 'photo_contest');

    // Fill contest details
    await page.fill('[data-testid="contest-name"]', 'Show Us Your Style Challenge');
    await page.fill('[data-testid="contest-hashtag"]', '#MyStyleChallenge');
    await page.fill('[data-testid="contest-prize"]', '$100 Gift Card');

    // Set contest duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    await page.fill('[data-testid="contest-start"]', startDate.toISOString().split('T')[0]);
    await page.fill('[data-testid="contest-end"]', endDate.toISOString().split('T')[0]);

    // Generate contest post
    await page.click('[data-testid="generate-ugc-contest"]');

    // Should show generated contest post
    await expect(page.getByTestId('generated-contest-post')).toBeVisible();

    // Verify post includes key elements
    const postText = await page.textContent('[data-testid="generated-contest-post"]');
    expect(postText).toContain('#MyStyleChallenge');
    expect(postText).toContain('$100 Gift Card');
    expect(postText).toContain('tag us');
    expect(postText).toMatch(/entry.*requirements|how.*enter/i);
  });

  test('should generate hashtag formula (3 branded + 10 niche + 5 trending)', async ({ page }) => {
    await page.goto('/tactics/hashtag-generator');

    // Enter business info
    await page.fill('[data-testid="business-name"]', 'Sustainable Style Co');
    await page.fill('[data-testid="industry"]', 'Fashion & Apparel');
    await page.fill('[data-testid="post-topic"]', 'organic cotton t-shirt launch');

    // Generate hashtags
    await page.click('[data-testid="generate-hashtags"]');

    await expect(page.getByTestId('generated-hashtags')).toBeVisible();

    // Count hashtags by type
    const branded = await page.locator('[data-hashtag-type="branded"]').count();
    const niche = await page.locator('[data-hashtag-type="niche"]').count();
    const trending = await page.locator('[data-hashtag-type="trending"]').count();

    // Verify formula: 3 branded + 10 niche + 5 trending
    expect(branded).toBe(3);
    expect(niche).toBe(10);
    expect(trending).toBe(5);

    // Total should be 18
    const total = branded + niche + trending;
    expect(total).toBe(18);

    // Verify hashtags are properly formatted
    const firstHashtag = await page.locator('[data-hashtag-type="branded"]').first().textContent();
    expect(firstHashtag).toMatch(/^#/);
  });

  test('should create email capture landing page', async ({ page }) => {
    await page.goto('/tactics/landing-page');

    // Select template
    await page.click('[data-testid="template-lead-magnet"]');

    // Fill landing page details
    await page.fill('[data-testid="headline"]', 'Get 20% Off Your First Order');
    await page.fill('[data-testid="subheadline"]', 'Plus exclusive access to new arrivals');
    await page.fill('[data-testid="cta-button"]', 'Claim My Discount');

    // Configure form fields
    await page.check('[data-testid="field-email"]'); // Always required
    await page.check('[data-testid="field-first-name"]');
    await page.uncheck('[data-testid="field-phone"]'); // Optional

    // Set thank you page
    await page.fill('[data-testid="thank-you-url"]', '/thank-you');

    // Generate landing page
    await page.click('[data-testid="generate-landing-page"]');

    // Should show preview
    await expect(page.getByTestId('landing-page-preview')).toBeVisible();

    // Should show form
    await expect(page.getByTestId('email-capture-form')).toBeVisible();

    // Verify form has required fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).not.toBeVisible(); // Phone unchecked
  });

  test('should detect seasonal opportunities from calendar', async ({ page }) => {
    await page.goto('/tactics/seasonal-calendar');

    // Mock current date to test season detection
    await page.evaluate(() => {
      const mockDate = new Date('2024-11-15'); // Mid-November
      Date.now = () => mockDate.getTime();
    });

    await page.reload();

    // Should highlight upcoming seasonal events
    await expect(page.getByText('Black Friday')).toBeVisible();
    await expect(page.getByText('Cyber Monday')).toBeVisible();
    await expect(page.getByText('Holiday Season')).toBeVisible();

    // Should show days until event
    const blackFridayCard = page.locator('[data-event="black-friday"]');
    await expect(blackFridayCard).toContainText(/\d+\s*days/i);

    // Should show recommended actions
    await blackFridayCard.click();
    await expect(page.getByText(/prepare.*sale.*campaign/i)).toBeVisible();
  });

  test('should emphasize Q4 revenue opportunities (40% claim)', async ({ page }) => {
    await page.goto('/tactics/seasonal-calendar');

    // Select Q4 (October-December)
    await page.click('[data-quarter="Q4"]');

    // Should show revenue emphasis
    await expect(page.getByText(/40%.*annual.*revenue/i)).toBeVisible();

    // Should show key Q4 dates
    await expect(page.getByText('Halloween')).toBeVisible();
    await expect(page.getByText('Black Friday')).toBeVisible();
    await expect(page.getByText('Cyber Monday')).toBeVisible();
    await expect(page.getByText('Christmas')).toBeVisible();
    await expect(page.getByText('New Year')).toBeVisible();

    // Should show Q4 campaign templates
    await expect(page.getByTestId('q4-campaign-templates')).toBeVisible();

    // Verify Q4 revenue percentage
    const revenuePercentage = await page.textContent('[data-testid="q4-revenue-percentage"]');
    expect(revenuePercentage).toContain('40%');
  });

  test('should verify 30% engagement boost for UGC (mock data)', async ({ page }) => {
    await page.goto('/analytics/ugc-performance');

    // Mock UGC analytics
    await page.route('**/api/analytics/ugc', (route) => {
      const baselineEngagement = 0.05; // 5%
      const ugcEngagement = baselineEngagement * (1 + expectedMetrics.ugcEngagement.boost);

      route.fulfill({
        status: 200,
        body: JSON.stringify({
          regular_posts: {
            engagement_rate: baselineEngagement,
            likes: 100,
            comments: 10,
            shares: 5,
          },
          ugc_posts: {
            engagement_rate: ugcEngagement,
            likes: 130,
            comments: 15,
            shares: 10,
          },
        }),
      });
    });

    await page.reload();

    // Should show engagement boost
    const boostPercentage = await page.textContent('[data-testid="ugc-engagement-boost"]');
    expect(boostPercentage).toContain('30%');

    // Should show comparison chart
    await expect(page.getByTestId('ugc-comparison-chart')).toBeVisible();
  });

  test('should generate seasonal campaign from calendar event', async ({ page }) => {
    await page.goto('/tactics/seasonal-calendar');

    // Click on Black Friday
    await page.click('[data-event="black-friday"]');

    // Should show event details
    await expect(page.getByTestId('event-details-panel')).toBeVisible();

    // Click "Generate Campaign"
    await page.click('[data-testid="generate-seasonal-campaign"]');

    // Should navigate to campaign builder with pre-filled data
    await expect(page).toHaveURL(/campaign\/create/);

    // Verify pre-filled values
    const campaignName = await page.inputValue('[data-testid="campaign-name"]');
    expect(campaignName).toContain('Black Friday');

    // Should suggest Revenue Rush campaign type
    await expect(page.locator('[data-campaign-type="revenue-rush"][data-recommended="true"]')).toBeVisible();
  });

  test('should create multi-platform UGC contest', async ({ page }) => {
    await page.goto('/tactics/ugc-contest');

    await page.selectOption('[data-testid="contest-type"]', 'video_contest');
    await page.fill('[data-testid="contest-name"]', 'Show Your Morning Routine');
    await page.fill('[data-testid="contest-hashtag"]', '#MorningRoutineChallenge');

    // Select multiple platforms
    await page.check('[data-testid="platform-instagram"]');
    await page.check('[data-testid="platform-tiktok"]');
    await page.check('[data-testid="platform-facebook"]');

    // Generate cross-platform contest
    await page.click('[data-testid="generate-ugc-contest"]');

    // Should generate platform-specific posts
    await expect(page.getByTestId('instagram-contest-post')).toBeVisible();
    await expect(page.getByTestId('tiktok-contest-post')).toBeVisible();
    await expect(page.getByTestId('facebook-contest-post')).toBeVisible();

    // Each should have platform-specific formatting
    const tiktokPost = await page.textContent('[data-testid="tiktok-contest-post"]');
    expect(tiktokPost).toContain('duet'); // TikTok-specific language
  });

  test('should track email capture conversion rate', async ({ page }) => {
    await page.goto('/analytics/landing-pages');

    // Mock landing page analytics
    await page.route('**/api/analytics/landing-pages', (route) => {
      const visitors = 1000;
      const captures = 250;

      route.fulfill({
        status: 200,
        body: JSON.stringify({
          total_visitors: visitors,
          email_captures: captures,
          conversion_rate: captures / visitors,
          bounce_rate: 0.35,
          avg_time_on_page: 45,
        }),
      });
    });

    await page.reload();

    // Should show conversion rate
    await expect(page.getByTestId('conversion-rate')).toBeVisible();
    const conversionRate = await page.textContent('[data-testid="conversion-rate"]');
    expect(conversionRate).toContain('25%');

    // Should show email list growth
    await expect(page.getByTestId('email-captures')).toContainText('250');
  });

  test('should generate hashtag sets for different platforms', async ({ page }) => {
    await page.goto('/tactics/hashtag-generator');

    await page.fill('[data-testid="business-name"]', 'Bella Vita Trattoria');
    await page.fill('[data-testid="industry"]', 'Restaurant');
    await page.fill('[data-testid="post-topic"]', 'new pasta special');

    // Generate for Instagram (allows 30 hashtags)
    await page.selectOption('[data-testid="platform"]', 'instagram');
    await page.click('[data-testid="generate-hashtags"]');

    let hashtagCount = await page.locator('[data-testid="hashtag-tag"]').count();
    expect(hashtagCount).toBeLessThanOrEqual(30);

    // Generate for TikTok (recommends fewer)
    await page.selectOption('[data-testid="platform"]', 'tiktok');
    await page.click('[data-testid="generate-hashtags"]');

    hashtagCount = await page.locator('[data-testid="hashtag-tag"]').count();
    expect(hashtagCount).toBeLessThanOrEqual(8); // TikTok best practice
  });
});
