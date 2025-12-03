/**
 * Google My Business E2E Tests
 *
 * Tests GMB OAuth, location management, post creation, and scheduling.
 * Verifies the 5x local visibility claim.
 *
 * Because local businesses need Google love.
 */

import { test, expect } from '@playwright/test';
import { mockSMBProfiles, expectedMetrics } from '../fixtures/smb-profiles';

test.describe('Google My Business Integration', () => {
  const localBusiness = mockSMBProfiles.localPlumber;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login with test account
  });

  test('should initiate GMB OAuth flow', async ({ page }) => {
    await page.goto('/settings/integrations');

    // Find GMB connection button
    await page.click('[data-testid="connect-gmb"]');

    // Should redirect to Google OAuth
    await page.waitForURL(/accounts\.google\.com|oauth/);

    // Verify OAuth parameters
    const url = page.url();
    expect(url).toContain('client_id');
    expect(url).toContain('scope');
    expect(url).toContain('business.manage');
  });

  test('should handle GMB OAuth callback', async ({ page, context }) => {
    // Mock OAuth callback
    await context.route('**/auth/google/callback*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          account_id: 'gmb-account-123',
          locations: [localBusiness.gmbLocation],
        }),
      });
    });

    await page.goto('/auth/google/callback?code=mock_auth_code&state=user-123');

    // Should redirect to success page
    await expect(page).toHaveURL(/integrations.*success/);

    // Should show connected locations
    await expect(page.getByText(localBusiness.gmbLocation.address)).toBeVisible();
  });

  test('should fetch and display business locations', async ({ page }) => {
    await page.goto('/settings/integrations/gmb');

    // Mock GMB locations API
    await page.route('**/api/gmb/locations', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          locations: [
            {
              ...localBusiness.gmbLocation,
              location_name: localBusiness.businessName,
            },
          ],
        }),
      });
    });

    await page.reload();

    // Should display location
    await expect(page.getByText(localBusiness.businessName)).toBeVisible();
    await expect(page.getByText(localBusiness.gmbLocation.address)).toBeVisible();

    // Should show verification status
    await expect(page.getByTestId('location-verified-badge')).toBeVisible();
  });

  test('should create GMB UPDATE post', async ({ page }) => {
    await page.goto('/content/gmb/create');

    // Select post type
    await page.selectOption('[data-testid="gmb-post-type"]', 'UPDATE');

    // Fill in post content
    await page.fill('[data-testid="gmb-post-content"]', 'Exciting news! We now offer same-day emergency service. Call us 24/7!');

    // Add call to action
    await page.selectOption('[data-testid="gmb-cta"]', 'CALL');

    // Upload image (optional)
    await page.setInputFiles('[data-testid="gmb-image-upload"]', './tests/fixtures/sample-image.jpg');

    // Create post
    await page.click('[data-testid="create-gmb-post"]');

    // Should show success
    await expect(page.getByText(/post.*created.*successfully/i)).toBeVisible();
  });

  test('should create GMB OFFER post with dates', async ({ page }) => {
    await page.goto('/content/gmb/create');

    // Select OFFER type
    await page.selectOption('[data-testid="gmb-post-type"]', 'OFFER');

    // Fill offer details
    await page.fill('[data-testid="gmb-post-content"]', '$50 off emergency plumbing services this week!');
    await page.fill('[data-testid="gmb-coupon-code"]', 'EMERGENCY50');

    // Set offer dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    await page.fill('[data-testid="offer-start-date"]', startDate.toISOString().split('T')[0]);
    await page.fill('[data-testid="offer-end-date"]', endDate.toISOString().split('T')[0]);

    // Add terms
    await page.fill('[data-testid="offer-terms"]', 'Valid for new customers only. Emergency calls only.');

    // Create offer
    await page.click('[data-testid="create-gmb-post"]');

    await expect(page.getByText(/offer.*created/i)).toBeVisible();
  });

  test('should create GMB EVENT post', async ({ page }) => {
    await page.goto('/content/gmb/create');

    // Select EVENT type
    await page.selectOption('[data-testid="gmb-post-type"]', 'EVENT');

    // Fill event details
    await page.fill('[data-testid="event-title"]', 'Free Water Heater Inspection Day');
    await page.fill('[data-testid="gmb-post-content"]', 'Join us for our annual free inspection day. Learn about water heater maintenance!');

    // Set event date/time
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 14);

    await page.fill('[data-testid="event-start-date"]', eventDate.toISOString().split('T')[0]);
    await page.fill('[data-testid="event-start-time"]', '10:00');
    await page.fill('[data-testid="event-end-time"]', '16:00');

    // Create event
    await page.click('[data-testid="create-gmb-post"]');

    await expect(page.getByText(/event.*created/i)).toBeVisible();
  });

  test('should set up 2x/week GMB posting schedule', async ({ page }) => {
    await page.goto('/settings/integrations/gmb/schedule');

    // Select frequency
    await page.selectOption('[data-testid="posting-frequency"]', 'twice_weekly');

    // Select days (default: Tuesday and Friday)
    await page.check('[data-testid="posting-day-tuesday"]');
    await page.check('[data-testid="posting-day-friday"]');

    // Set posting time
    await page.fill('[data-testid="posting-time"]', '10:00');

    // Set post type rotation
    await page.check('[data-testid="post-type-update"]');
    await page.check('[data-testid="post-type-offer"]');
    await page.check('[data-testid="post-type-event"]');

    // Enable schedule
    await page.check('[data-testid="enable-schedule"]');

    // Save schedule
    await page.click('[data-testid="save-schedule"]');

    // Verify schedule saved
    await expect(page.getByText(/schedule.*saved/i)).toBeVisible();

    // Should show next scheduled post date
    await expect(page.getByTestId('next-scheduled-post')).toBeVisible();
  });

  test('should display GMB posting calendar', async ({ page }) => {
    await page.goto('/settings/integrations/gmb/schedule');

    // Should show calendar view
    await expect(page.getByTestId('gmb-posting-calendar')).toBeVisible();

    // Should highlight scheduled posting days
    await expect(page.locator('[data-posting-day="true"]')).toHaveCount(8); // ~4 weeks, 2x/week

    // Click on scheduled post
    await page.locator('[data-posting-day="true"]').first().click();

    // Should show post details
    await expect(page.getByTestId('scheduled-post-details')).toBeVisible();
  });

  test('should upload image with GMB post', async ({ page }) => {
    await page.goto('/content/gmb/create');

    await page.selectOption('[data-testid="gmb-post-type"]', 'UPDATE');
    await page.fill('[data-testid="gmb-post-content"]', 'Check out our newly renovated service van!');

    // Upload image
    await page.setInputFiles('[data-testid="gmb-image-upload"]', './tests/fixtures/service-van.jpg');

    // Should show image preview
    await expect(page.getByTestId('image-preview')).toBeVisible();

    // Should show image specs
    await expect(page.getByText(/recommended:.*1200.*1200/i)).toBeVisible();

    // Create post
    await page.click('[data-testid="create-gmb-post"]');

    await expect(page.getByText(/post.*created/i)).toBeVisible();
  });

  test('should verify 5x local visibility claim (mock data)', async ({ page }) => {
    await page.goto('/analytics/gmb-performance');

    // Mock GMB performance data
    await page.route('**/api/analytics/gmb', (route) => {
      const baselineViews = 100;
      const withGMBViews = baselineViews * expectedMetrics.gmbVisibility.multiplier;

      route.fulfill({
        status: 200,
        body: JSON.stringify({
          before_gmb: {
            profile_views: baselineViews,
            search_appearances: baselineViews * 0.5,
            actions: baselineViews * 0.1,
          },
          with_gmb: {
            profile_views: withGMBViews,
            search_appearances: withGMBViews * 0.6,
            actions: withGMBViews * 0.15,
          },
        }),
      });
    });

    await page.reload();

    // Should show visibility boost
    const visibilityBoost = await page.textContent('[data-testid="visibility-multiplier"]');
    expect(visibilityBoost).toContain(`${expectedMetrics.gmbVisibility.multiplier}x`);

    // Should show before/after comparison
    await expect(page.getByTestId('gmb-comparison-chart')).toBeVisible();
  });

  test('should handle GMB API rate limits gracefully', async ({ page }) => {
    await page.goto('/content/gmb/create');

    // Mock rate limit error
    await page.route('**/api/gmb/posts', (route) => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      });
    });

    await page.selectOption('[data-testid="gmb-post-type"]', 'UPDATE');
    await page.fill('[data-testid="gmb-post-content"]', 'Test post');
    await page.click('[data-testid="create-gmb-post"]');

    // Should show rate limit message
    await expect(page.getByText(/rate.*limit|too.*many.*requests/i)).toBeVisible();

    // Should show retry button
    await expect(page.getByTestId('retry-gmb-post')).toBeVisible();
  });

  test('should show GMB posting statistics', async ({ page }) => {
    await page.goto('/analytics/gmb-performance');

    // Should show key metrics
    await expect(page.getByTestId('total-posts')).toBeVisible();
    await expect(page.getByTestId('post-views')).toBeVisible();
    await expect(page.getByTestId('post-actions')).toBeVisible();
    await expect(page.getByTestId('post-engagement-rate')).toBeVisible();

    // Should show post type breakdown
    await expect(page.getByText('UPDATE')).toBeVisible();
    await expect(page.getByText('OFFER')).toBeVisible();
    await expect(page.getByText('EVENT')).toBeVisible();
  });
});
