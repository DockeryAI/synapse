/**
 * Campaign Flow E2E Tests
 *
 * Tests the complete campaign creation flow with V3 campaign types.
 * Verifies all 5 campaign types, 2-3 platform enforcement, and calendar generation.
 *
 * Because the campaign flow is the heart of Synapse.
 */

import { test, expect } from '@playwright/test';
import { mockSMBProfiles } from '../fixtures/smb-profiles';

test.describe('Campaign Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login
  });

  test('should display goal selection as first step', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Should show goal selection
    await expect(page.getByText('What\'s your primary goal?')).toBeVisible();

    // Should show all 5 goals
    await expect(page.getByText('Build Authority')).toBeVisible();
    await expect(page.getByText('Grow Community')).toBeVisible();
    await expect(page.getByText('Build Trust')).toBeVisible();
    await expect(page.getByText('Generate Revenue')).toBeVisible();
    await expect(page.getByText('Go Viral')).toBeVisible();

    // Should have helpful descriptions
    await expect(page.getByText(/become.*expert/i)).toBeVisible();
    await expect(page.getByText(/engaged.*audience/i)).toBeVisible();
  });

  test('should create Authority Builder campaign (7 days)', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Step 1: Select goal
    await page.click('[data-goal="build-authority"]');

    // Should auto-select Authority Builder campaign type
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Authority Builder');
    await expect(page.getByText('7 days to visible expert')).toBeVisible();

    // Should show story arc
    await expect(page.getByText('Phase 1: Problem Awareness')).toBeVisible();
    await expect(page.getByText('Phase 2: Education & Solutions')).toBeVisible();
    await expect(page.getByText('Phase 3: Proof & Call to Action')).toBeVisible();

    // Step 2: Select platforms (2-3 required)
    await page.click('[data-testid="next-step"]');

    // Should show platform selection
    await expect(page.getByText('Select 2-3 Platforms')).toBeVisible();

    // Select LinkedIn (good for authority)
    await page.check('[data-platform="linkedin"]');

    // Should show warning to select at least 2
    await expect(page.getByText(/select.*at least.*2/i)).toBeVisible();

    // Select YouTube Shorts
    await page.check('[data-platform="youtube-shorts"]');

    // Should now allow proceeding
    await expect(page.getByTestId('next-step')).not.toBeDisabled();

    // Try to select 4th platform (should be prevented)
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="instagram"]');

    // Should show max 3 platforms error
    await expect(page.getByText(/maximum.*3.*platforms/i)).toBeVisible();

    // Should disable further selections
    const tiktokCheckbox = page.locator('[data-platform="tiktok"]');
    await expect(tiktokCheckbox).toBeDisabled();

    // Uncheck one to continue
    await page.uncheck('[data-platform="instagram"]');

    // Step 3: Duration selection (should default to 7 for Authority Builder)
    await page.click('[data-testid="next-step"]');

    const durationValue = await page.inputValue('[data-testid="campaign-duration"]');
    expect(durationValue).toBe('7');

    // Should show only allowed durations
    const durationOptions = await page.locator('[data-testid="duration-option"]').all();
    expect(durationOptions.length).toBe(4); // 5, 7, 10, 14

    // Step 4: Review and generate calendar
    await page.click('[data-testid="next-step"]');

    // Should show campaign summary
    await expect(page.getByText('Campaign Summary')).toBeVisible();
    await expect(page.getByText('Authority Builder')).toBeVisible();
    await expect(page.getByText('7 days')).toBeVisible();

    // Generate calendar
    await page.click('[data-testid="generate-campaign"]');

    // Should show calendar with 7 days
    await expect(page.getByTestId('campaign-calendar')).toBeVisible();

    const calendarDays = await page.locator('[data-testid="calendar-day"]').count();
    expect(calendarDays).toBe(7);

    // Should show content mix
    await expect(page.getByText(/40%.*video/i)).toBeVisible();
    await expect(page.getByText(/30%.*image/i)).toBeVisible();
  });

  test('should create Community Champion campaign (10 days)', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Select community goal
    await page.click('[data-goal="grow-community"]');

    // Should recommend Community Champion
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Community Champion');
    await expect(page.getByText('10 days from strangers to family')).toBeVisible();

    // Verify story arc
    await expect(page.getByText('Phase 1: Show Up & Listen')).toBeVisible();
    await expect(page.getByText('Phase 2: Engage & Relate')).toBeVisible();
    await expect(page.getByText('Phase 3: Invite & Include')).toBeVisible();

    // Select platforms
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="instagram"]');

    // Duration should default to 10
    await page.click('[data-testid="next-step"]');
    const duration = await page.inputValue('[data-testid="campaign-duration"]');
    expect(duration).toBe('10');

    // Generate calendar
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should have 10 days
    const calendarDays = await page.locator('[data-testid="calendar-day"]').count();
    expect(calendarDays).toBe(10);

    // Community Champion should emphasize UGC
    await expect(page.getByText(/UGC.*content/i)).toBeVisible();
  });

  test('should create Trust Builder campaign (7 days)', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Select trust goal
    await page.click('[data-goal="build-trust"]');

    // Should recommend Trust Builder
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Trust Builder');
    await expect(page.getByText('7 days to credibility')).toBeVisible();

    // Verify story arc
    await expect(page.getByText('Phase 1: Transparency')).toBeVisible();
    await expect(page.getByText('Phase 2: Social Proof')).toBeVisible();
    await expect(page.getByText('Phase 3: Expertise')).toBeVisible();

    // Select platforms
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="google-business"]'); // Great for trust
    await page.check('[data-platform="facebook"]');

    // Generate
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should show behind-the-scenes content
    await expect(page.getByText(/behind.*scenes/i)).toBeVisible();
    await expect(page.getByText(/testimonial/i)).toBeVisible();
  });

  test('should create Revenue Rush campaign (5 days)', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Select revenue goal
    await page.click('[data-goal="generate-revenue"]');

    // Should recommend Revenue Rush
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Revenue Rush');
    await expect(page.getByText('5 days to cash flow')).toBeVisible();

    // Verify story arc
    await expect(page.getByText('Phase 1: Problem Agitation')).toBeVisible();
    await expect(page.getByText('Phase 2: Offer Introduction')).toBeVisible();
    await expect(page.getByText('Phase 3: Urgency & Close')).toBeVisible();

    // Should recommend Instagram + Facebook for e-commerce
    await page.click('[data-testid="next-step"]');

    // Should show Instagram Shopping recommendation
    await expect(page.getByText(/recommended.*instagram/i)).toBeVisible();

    await page.check('[data-platform="instagram"]');
    await page.check('[data-platform="facebook"]');

    // Duration should default to 5 (short revenue push)
    await page.click('[data-testid="next-step"]');
    const duration = await page.inputValue('[data-testid="campaign-duration"]');
    expect(duration).toBe('5');

    // Generate
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should have 5 days
    const calendarDays = await page.locator('[data-testid="calendar-day"]').count();
    expect(calendarDays).toBe(5);

    // Should emphasize shoppable posts
    await expect(page.getByText(/shoppable.*post/i)).toBeVisible();
    await expect(page.getByText(/discount/i)).toBeVisible();
  });

  test('should create Viral Spark campaign (5 days)', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Select viral goal
    await page.click('[data-goal="go-viral"]');

    // Should recommend Viral Spark
    await expect(page.getByTestId('selected-campaign-type')).toContainText('Viral Spark');
    await expect(page.getByText('5 days to explosive reach')).toBeVisible();

    // Verify story arc
    await expect(page.getByText('Phase 1: Hook Testing')).toBeVisible();
    await expect(page.getByText('Phase 2: Trend Amplification')).toBeVisible();
    await expect(page.getByText('Phase 3: Virality Push')).toBeVisible();

    // Should recommend TikTok + Instagram
    await page.click('[data-testid="next-step"]');
    await expect(page.getByText(/recommended.*tiktok/i)).toBeVisible();

    await page.check('[data-platform="tiktok"]');
    await page.check('[data-platform="instagram"]');

    // Generate
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should emphasize trending audio and hooks
    await expect(page.getByText(/trending.*audio/i)).toBeVisible();
    await expect(page.getByText(/hook/i)).toBeVisible();
  });

  test('should enforce platform incompatibilities', async ({ page }) => {
    await page.goto('/campaigns/create');

    await page.click('[data-goal="build-authority"]');
    await page.click('[data-testid="next-step"]');

    // Select TikTok
    await page.check('[data-platform="tiktok"]');

    // Try to select LinkedIn (should show warning)
    await page.check('[data-platform="linkedin"]');

    // Should show incompatibility warning
    await expect(page.getByText(/tiktok.*linkedin.*incompatible/i)).toBeVisible();

    // Should still allow selection (warning, not blocking)
    const linkedinCheckbox = page.locator('[data-platform="linkedin"]');
    await expect(linkedinCheckbox).toBeChecked();
  });

  test('should validate custom duration to closest allowed value', async ({ page }) => {
    await page.goto('/campaigns/create');

    await page.click('[data-goal="build-authority"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="linkedin"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');

    // Try to enter custom duration (e.g., 8 days)
    await page.fill('[data-testid="campaign-duration"]', '8');

    // Should show suggestion to use 7 or 10
    await expect(page.getByText(/try.*7.*or.*10.*days/i)).toBeVisible();

    // Should auto-correct to closest allowed
    await page.blur('[data-testid="campaign-duration"]');

    const correctedValue = await page.inputValue('[data-testid="campaign-duration"]');
    expect(['7', '10']).toContain(correctedValue);
  });

  test('should show progress bar through campaign creation', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Should show progress: Step 1/5
    await expect(page.getByTestId('progress-step')).toContainText('1 / 5');

    // Select goal
    await page.click('[data-goal="build-trust"]');
    await page.click('[data-testid="next-step"]');

    // Step 2/5
    await expect(page.getByTestId('progress-step')).toContainText('2 / 5');

    // Select platforms
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="instagram"]');
    await page.click('[data-testid="next-step"]');

    // Step 3/5
    await expect(page.getByTestId('progress-step')).toContainText('3 / 5');
  });

  test('should generate campaign calendar with proper post distribution', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Create 7-day campaign
    await page.click('[data-goal="build-authority"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="linkedin"]');
    await page.check('[data-platform="youtube-shorts"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should show 7 days
    const days = await page.locator('[data-testid="calendar-day"]').all();
    expect(days.length).toBe(7);

    // Each day should have posts
    for (const day of days) {
      const postsCount = await day.locator('[data-testid="day-post"]').count();
      expect(postsCount).toBeGreaterThan(0);
    }

    // Should show post types distributed by content mix
    const videoPosts = await page.locator('[data-post-type="video"]').count();
    const imagePosts = await page.locator('[data-post-type="image"]').count();
    const textPosts = await page.locator('[data-post-type="text"]').count();

    // Authority Builder: 40% video, 30% image, 20% text
    const totalPosts = videoPosts + imagePosts + textPosts;
    const videoPercentage = videoPosts / totalPosts;

    // Should be roughly 40% video (allow 10% tolerance)
    expect(videoPercentage).toBeGreaterThan(0.30);
    expect(videoPercentage).toBeLessThan(0.50);
  });

  test('should allow editing posts in calendar', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Generate campaign
    await page.click('[data-goal="grow-community"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="instagram"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Click on first post to edit
    await page.click('[data-testid="day-post"]');

    // Should open post editor
    await expect(page.getByTestId('post-editor')).toBeVisible();

    // Should show post content
    await expect(page.locator('[data-testid="post-content"]')).toBeVisible();

    // Edit content
    await page.fill('[data-testid="post-content"]', 'Updated post content for my community!');

    // Save changes
    await page.click('[data-testid="save-post"]');

    // Should update in calendar
    await expect(page.getByText('Updated post content')).toBeVisible();
  });

  test('should approve posts before scheduling', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Generate campaign
    await page.click('[data-goal="generate-revenue"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="instagram"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should show "Approve All" button
    await expect(page.getByTestId('approve-all-posts')).toBeVisible();

    // Approve all posts
    await page.click('[data-testid="approve-all-posts"]');

    // Should enable schedule button
    await expect(page.getByTestId('schedule-campaign')).not.toBeDisabled();

    // Individual posts should show approved badge
    const approvedBadges = await page.locator('[data-testid="approved-badge"]').count();
    expect(approvedBadges).toBeGreaterThan(0);
  });

  test('should schedule campaign to SocialPilot', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Generate and approve campaign
    await page.click('[data-goal="build-trust"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="facebook"]');
    await page.check('[data-platform="linkedin"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');
    await page.click('[data-testid="approve-all-posts"]');

    // Schedule to SocialPilot
    await page.click('[data-testid="schedule-campaign"]');

    // Should show SocialPilot integration dialog
    await expect(page.getByText('Schedule to SocialPilot')).toBeVisible();

    // Mock SocialPilot API
    await page.route('**/api/socialpilot/schedule', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          scheduled_posts: 14,
          campaign_id: 'sp-camp-123',
        }),
      });
    });

    // Confirm scheduling
    await page.click('[data-testid="confirm-schedule"]');

    // Should show success message
    await expect(page.getByText(/successfully.*scheduled/i)).toBeVisible();
    await expect(page.getByText('14 posts scheduled')).toBeVisible();
  });

  test('should include GMB posts for local businesses', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Create campaign for local business profile
    await page.evaluate((profile) => {
      (window as any).mockUserProfile = profile;
    }, mockSMBProfiles.localPlumber);

    // Generate campaign
    await page.click('[data-goal="build-trust"]');
    await page.click('[data-testid="next-step"]');

    // Should auto-suggest GMB for local business
    await expect(page.getByText(/recommended.*google.*business/i)).toBeVisible();

    await page.check('[data-platform="google-business"]');
    await page.check('[data-platform="facebook"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Should include GMB posts (2x/week for 7 days = 2 posts)
    const gmbPosts = await page.locator('[data-platform="google-business"]').count();
    expect(gmbPosts).toBeGreaterThanOrEqual(2);

    // GMB posts should show post type (UPDATE, OFFER, EVENT)
    const firstGmbPost = page.locator('[data-platform="google-business"]').first();
    await firstGmbPost.click();

    await expect(page.getByTestId('gmb-post-type')).toBeVisible();
  });

  test('should NOT show GMB for e-commerce businesses', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Set e-commerce business profile
    await page.evaluate((profile) => {
      (window as any).mockUserProfile = profile;
    }, mockSMBProfiles.ecommerceStore);

    await page.click('[data-goal="generate-revenue"]');
    await page.click('[data-testid="next-step"]');

    // GMB should not be recommended for e-commerce
    const gmbOption = page.locator('[data-platform="google-business"]');
    await expect(gmbOption).not.toBeVisible();
  });

  test('should show campaign preview before finalizing', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Create campaign
    await page.click('[data-goal="build-authority"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="linkedin"]');
    await page.check('[data-platform="youtube-shorts"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');

    // Should show preview before generating
    await expect(page.getByText('Campaign Preview')).toBeVisible();
    await expect(page.getByText('Authority Builder')).toBeVisible();
    await expect(page.getByText('7 days')).toBeVisible();
    await expect(page.getByText('LinkedIn, YouTube Shorts')).toBeVisible();

    // Should show estimated metrics
    await expect(page.getByTestId('estimated-reach')).toBeVisible();
    await expect(page.getByTestId('estimated-engagement')).toBeVisible();
    await expect(page.getByTestId('estimated-posts')).toBeVisible();
  });

  test('should allow regenerating individual posts', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Generate campaign
    await page.click('[data-goal="go-viral"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="tiktok"]');
    await page.check('[data-platform="instagram"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-campaign"]');

    // Click on a post
    const firstPost = page.locator('[data-testid="day-post"]').first();
    const originalContent = await firstPost.textContent();

    await firstPost.click();

    // Click regenerate
    await page.click('[data-testid="regenerate-post"]');

    // Should show loading state
    await expect(page.getByTestId('generating-post')).toBeVisible();

    // Wait for regeneration
    await page.waitForSelector('[data-testid="post-regenerated"]', { timeout: 10000 });

    // Content should be different
    const newContent = await firstPost.textContent();
    expect(newContent).not.toBe(originalContent);
  });

  test('should save campaign as draft', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Start campaign creation
    await page.click('[data-goal="build-authority"]');
    await page.click('[data-testid="next-step"]');
    await page.check('[data-platform="linkedin"]');
    await page.check('[data-platform="facebook"]');

    // Save as draft before completing
    await page.click('[data-testid="save-draft"]');

    // Should show success
    await expect(page.getByText(/draft.*saved/i)).toBeVisible();

    // Navigate to campaigns list
    await page.goto('/campaigns');

    // Should show draft campaign
    await expect(page.getByTestId('draft-campaign')).toBeVisible();
    await expect(page.getByText('Authority Builder')).toBeVisible();
    await expect(page.getByText('Draft')).toBeVisible();

    // Click to resume
    await page.click('[data-testid="resume-draft"]');

    // Should restore progress
    const linkedinCheckbox = page.locator('[data-platform="linkedin"]');
    await expect(linkedinCheckbox).toBeChecked();
  });

  test('should show business type recommendations', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Mock local service business
    await page.evaluate((profile) => {
      (window as any).mockUserProfile = profile;
    }, mockSMBProfiles.localPlumber);

    // Select goal
    await page.click('[data-goal="build-trust"]');

    // Should show recommendation based on business type
    await expect(page.getByText(/recommended.*local.*service/i)).toBeVisible();

    await page.click('[data-testid="next-step"]');

    // Should recommend GMB + Facebook for local services
    await expect(page.getByText(/google.*business.*recommended/i)).toBeVisible();
    await expect(page.getByText(/facebook.*recommended/i)).toBeVisible();
  });
});
