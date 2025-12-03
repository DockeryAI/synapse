/**
 * Performance Benchmark E2E Tests
 *
 * Tests performance tracking, Day 3 pivot logic, and auto-optimization.
 * Verifies engagement thresholds and pivot recommendations.
 *
 * Because we pivot fast or die slow.
 */

import { test, expect } from '@playwright/test';
import { expectedMetrics } from '../fixtures/smb-profiles';

test.describe('Performance Benchmark', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login
  });

  test('should display performance dashboard', async ({ page }) => {
    await page.goto('/analytics/performance');

    // Should show key performance metrics
    await expect(page.getByTestId('total-reach')).toBeVisible();
    await expect(page.getByTestId('total-engagement')).toBeVisible();
    await expect(page.getByTestId('engagement-rate')).toBeVisible();
    await expect(page.getByTestId('total-clicks')).toBeVisible();

    // Should show current active campaigns
    await expect(page.getByTestId('active-campaigns')).toBeVisible();

    // Should show performance chart
    await expect(page.getByTestId('performance-chart')).toBeVisible();
  });

  test('should track campaign performance in real-time', async ({ page }) => {
    await page.goto('/analytics/campaigns');

    // Mock campaign data
    await page.route('**/api/analytics/campaigns', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          campaigns: [
            {
              id: 'camp-001',
              name: 'Authority Builder - Q1 2025',
              type: 'authority-builder',
              status: 'active',
              days_running: 2,
              posts_published: 4,
              total_reach: 1250,
              total_engagement: 45,
              engagement_rate: 0.036, // 3.6%
              clicks: 12,
            },
          ],
        }),
      });
    });

    await page.reload();

    // Should show campaign card
    await expect(page.getByText('Authority Builder - Q1 2025')).toBeVisible();

    // Should show key metrics
    await expect(page.getByText('1,250')).toBeVisible(); // reach
    await expect(page.getByText('45')).toBeVisible(); // engagement
    await expect(page.getByText('3.6%')).toBeVisible(); // engagement rate

    // Should show days running
    await expect(page.getByText('Day 2')).toBeVisible();
  });

  test('should trigger Day 3 pivot check for low engagement', async ({ page }) => {
    await page.goto('/analytics/campaigns/camp-001');

    // Mock Day 3 data with low engagement (< 2%)
    await page.route('**/api/analytics/campaigns/camp-001', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'camp-001',
          name: 'Community Champion Campaign',
          type: 'community-champion',
          status: 'active',
          days_running: 3,
          posts_published: 6,
          total_reach: 2000,
          total_engagement: 30,
          engagement_rate: 0.015, // 1.5% - below 2% threshold
          clicks: 5,
          pivot_check: {
            should_pivot: true,
            reason: 'Engagement rate below 2% threshold on Day 3',
            recommendation: 'Consider switching campaign type or platforms',
          },
        }),
      });
    });

    await page.reload();

    // Should show pivot warning
    await expect(page.getByTestId('pivot-warning')).toBeVisible();
    await expect(page.getByText(/engagement.*below.*2%/i)).toBeVisible();

    // Should show recommendation
    await expect(page.getByText(/consider.*switching/i)).toBeVisible();

    // Should highlight engagement rate in red
    const engagementRate = page.getByTestId('engagement-rate');
    await expect(engagementRate).toHaveClass(/warning|danger|low/);
  });

  test('should NOT trigger pivot check for healthy engagement', async ({ page }) => {
    await page.goto('/analytics/campaigns/camp-002');

    // Mock Day 3 data with healthy engagement (> 2%)
    await page.route('**/api/analytics/campaigns/camp-002', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'camp-002',
          name: 'Revenue Rush Campaign',
          type: 'revenue-rush',
          status: 'active',
          days_running: 3,
          posts_published: 6,
          total_reach: 3000,
          total_engagement: 180,
          engagement_rate: 0.06, // 6% - well above threshold
          clicks: 45,
          pivot_check: {
            should_pivot: false,
            message: 'Campaign performing well - continue as planned',
          },
        }),
      });
    });

    await page.reload();

    // Should NOT show pivot warning
    await expect(page.getByTestId('pivot-warning')).not.toBeVisible();

    // Should show success indicator
    await expect(page.getByText(/performing.*well/i)).toBeVisible();

    // Engagement rate should be highlighted in green
    const engagementRate = page.getByTestId('engagement-rate');
    await expect(engagementRate).toHaveClass(/success|healthy|good/);
  });

  test('should show pivot recommendations based on performance data', async ({ page }) => {
    await page.goto('/analytics/campaigns/camp-001/pivot');

    // Mock pivot recommendation
    await page.route('**/api/analytics/campaigns/camp-001/pivot-recommendations', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          current_performance: {
            engagement_rate: 0.015,
            best_performing_platform: 'instagram',
            worst_performing_platform: 'linkedin',
            best_performing_content_type: 'video',
          },
          recommendations: [
            {
              type: 'platform_switch',
              suggestion: 'Replace LinkedIn with TikTok',
              reasoning: 'Your video content performs well on Instagram. TikTok could amplify this.',
              expected_improvement: '2-3x engagement',
            },
            {
              type: 'content_type_shift',
              suggestion: 'Increase video content from 40% to 70%',
              reasoning: 'Videos getting 4x more engagement than image posts',
              expected_improvement: '50% engagement boost',
            },
            {
              type: 'campaign_type_change',
              suggestion: 'Switch from Authority Builder to Viral Spark',
              reasoning: 'Your audience responds better to entertaining content',
              expected_improvement: '3-5x reach',
            },
          ],
        }),
      });
    });

    await page.reload();

    // Should show current performance
    await expect(page.getByText('Current Engagement: 1.5%')).toBeVisible();
    await expect(page.getByText('Best Platform: Instagram')).toBeVisible();

    // Should show all 3 recommendation types
    await expect(page.getByText('Replace LinkedIn with TikTok')).toBeVisible();
    await expect(page.getByText('Increase video content')).toBeVisible();
    await expect(page.getByText('Switch from Authority Builder to Viral Spark')).toBeVisible();

    // Should show expected improvements
    await expect(page.getByText('2-3x engagement')).toBeVisible();
    await expect(page.getByText('50% engagement boost')).toBeVisible();
    await expect(page.getByText('3-5x reach')).toBeVisible();
  });

  test('should apply pivot recommendation', async ({ page }) => {
    await page.goto('/analytics/campaigns/camp-001/pivot');

    // Mock recommendations (from previous test)
    await page.route('**/api/analytics/campaigns/camp-001/pivot-recommendations', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          recommendations: [
            {
              type: 'platform_switch',
              suggestion: 'Replace LinkedIn with TikTok',
            },
          ],
        }),
      });
    });

    await page.reload();

    // Click "Apply This Pivot"
    await page.click('[data-testid="apply-pivot-0"]');

    // Should show confirmation dialog
    await expect(page.getByText('Apply Pivot Recommendation?')).toBeVisible();
    await expect(page.getByText('This will update your campaign settings')).toBeVisible();

    // Confirm pivot
    await page.click('[data-testid="confirm-pivot"]');

    // Mock API response
    await page.route('**/api/campaigns/camp-001/pivot', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Campaign updated successfully',
          changes: {
            platforms_removed: ['linkedin'],
            platforms_added: ['tiktok'],
          },
        }),
      });
    });

    // Should show success message
    await expect(page.getByText(/pivot.*applied.*successfully/i)).toBeVisible();

    // Should update campaign details
    await page.goto('/campaigns/camp-001');
    await expect(page.getByText('TikTok')).toBeVisible();
    await expect(page.getByText('LinkedIn')).not.toBeVisible();
  });

  test('should track performance by platform', async ({ page }) => {
    await page.goto('/analytics/campaigns/camp-001/platforms');

    // Mock platform breakdown
    await page.route('**/api/analytics/campaigns/camp-001/platforms', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          platforms: [
            {
              platform: 'instagram',
              posts: 3,
              reach: 1500,
              engagement: 120,
              engagement_rate: 0.08, // 8%
              clicks: 25,
            },
            {
              platform: 'facebook',
              posts: 3,
              reach: 800,
              engagement: 20,
              engagement_rate: 0.025, // 2.5%
              clicks: 5,
            },
            {
              platform: 'linkedin',
              posts: 3,
              reach: 400,
              engagement: 8,
              engagement_rate: 0.02, // 2%
              clicks: 2,
            },
          ],
        }),
      });
    });

    await page.reload();

    // Should show all platforms
    await expect(page.getByText('Instagram')).toBeVisible();
    await expect(page.getByText('Facebook')).toBeVisible();
    await expect(page.getByText('LinkedIn')).toBeVisible();

    // Instagram should be marked as top performer
    const instagramCard = page.locator('[data-platform="instagram"]');
    await expect(instagramCard).toContainText('8%'); // engagement rate
    await expect(instagramCard.getByTestId('top-performer-badge')).toBeVisible();

    // Should show comparison chart
    await expect(page.getByTestId('platform-comparison-chart')).toBeVisible();
  });

  test('should track performance by content type', async ({ page }) => {
    await page.goto('/analytics/campaigns/camp-001/content-types');

    // Mock content type breakdown
    await page.route('**/api/analytics/campaigns/camp-001/content-types', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content_types: [
            {
              type: 'video',
              posts: 4,
              reach: 2500,
              engagement: 200,
              engagement_rate: 0.08, // 8%
            },
            {
              type: 'image',
              posts: 3,
              reach: 1200,
              engagement: 36,
              engagement_rate: 0.03, // 3%
            },
            {
              type: 'text',
              posts: 2,
              reach: 600,
              engagement: 18,
              engagement_rate: 0.03, // 3%
            },
          ],
        }),
      });
    });

    await page.reload();

    // Should show all content types
    await expect(page.getByText('Video')).toBeVisible();
    await expect(page.getByText('Image')).toBeVisible();
    await expect(page.getByText('Text')).toBeVisible();

    // Video should be top performer
    const videoCard = page.locator('[data-content-type="video"]');
    await expect(videoCard).toContainText('8%');
    await expect(videoCard.getByTestId('top-performer-badge')).toBeVisible();

    // Should show recommendation to increase video content
    await expect(page.getByText(/increase.*video.*content/i)).toBeVisible();
  });

  test('should show historical performance comparison', async ({ page }) => {
    await page.goto('/analytics/performance/history');

    // Mock historical data
    await page.route('**/api/analytics/performance/history', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          current_period: {
            start_date: '2025-01-01',
            end_date: '2025-01-17',
            total_reach: 15000,
            total_engagement: 900,
            engagement_rate: 0.06, // 6%
            campaigns_run: 3,
          },
          previous_period: {
            start_date: '2024-12-01',
            end_date: '2024-12-17',
            total_reach: 8000,
            total_engagement: 320,
            engagement_rate: 0.04, // 4%
            campaigns_run: 2,
          },
          improvement: {
            reach: 0.875, // 87.5% increase
            engagement: 1.8125, // 181.25% increase
            engagement_rate: 0.50, // 50% increase
          },
        }),
      });
    });

    await page.reload();

    // Should show current vs previous period
    await expect(page.getByText('15,000')).toBeVisible(); // current reach
    await expect(page.getByText('8,000')).toBeVisible(); // previous reach

    // Should show improvement percentages
    await expect(page.getByText(/87.*%.*increase/i)).toBeVisible(); // reach improvement
    await expect(page.getByText(/181.*%.*increase/i)).toBeVisible(); // engagement improvement
    await expect(page.getByText(/50.*%.*increase/i)).toBeVisible(); // rate improvement

    // Should show trend chart
    await expect(page.getByTestId('historical-trend-chart')).toBeVisible();
  });

  test('should auto-optimize posting times', async ({ page }) => {
    await page.goto('/analytics/optimization/posting-times');

    // Mock posting time analysis
    await page.route('**/api/analytics/optimization/posting-times', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          current_times: {
            instagram: '10:00',
            facebook: '10:00',
            linkedin: '10:00',
          },
          optimal_times: {
            instagram: '18:30', // Evening better for Instagram
            facebook: '12:00', // Lunch time better for Facebook
            linkedin: '08:00', // Morning better for LinkedIn
          },
          performance_by_time: {
            instagram: {
              '10:00': { engagement_rate: 0.04 },
              '18:30': { engagement_rate: 0.08 }, // 2x better
            },
            facebook: {
              '10:00': { engagement_rate: 0.03 },
              '12:00': { engagement_rate: 0.05 },
            },
            linkedin: {
              '10:00': { engagement_rate: 0.02 },
              '08:00': { engagement_rate: 0.04 }, // 2x better
            },
          },
        }),
      });
    });

    await page.reload();

    // Should show current vs optimal times
    await expect(page.getByText('Current: 10:00 AM')).toBeVisible();
    await expect(page.getByText('Optimal: 6:30 PM')).toBeVisible(); // Instagram

    // Should show expected improvement
    await expect(page.getByText(/2x.*better.*engagement/i)).toBeVisible();

    // Should have "Apply Optimal Times" button
    await expect(page.getByTestId('apply-optimal-times')).toBeVisible();

    // Apply optimization
    await page.click('[data-testid="apply-optimal-times"]');

    // Should show confirmation
    await expect(page.getByText(/posting.*times.*updated/i)).toBeVisible();
  });

  test('should auto-optimize content mix', async ({ page }) => {
    await page.goto('/analytics/optimization/content-mix');

    // Mock content mix analysis
    await page.route('**/api/analytics/optimization/content-mix', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          current_mix: {
            video: 40,
            image: 30,
            text: 20,
            carousel: 10,
          },
          optimal_mix: {
            video: 60, // Increase video
            image: 25,
            text: 10, // Decrease text
            carousel: 5,
          },
          performance_by_type: {
            video: { engagement_rate: 0.08 },
            image: { engagement_rate: 0.04 },
            text: { engagement_rate: 0.02 },
            carousel: { engagement_rate: 0.03 },
          },
          expected_improvement: 0.35, // 35% engagement boost
        }),
      });
    });

    await page.reload();

    // Should show current vs optimal mix
    await expect(page.getByText('Current: 40% video')).toBeVisible();
    await expect(page.getByText('Optimal: 60% video')).toBeVisible();

    // Should show recommendation
    await expect(page.getByText(/increase.*video.*60%/i)).toBeVisible();
    await expect(page.getByText(/decrease.*text.*10%/i)).toBeVisible();

    // Should show expected improvement
    await expect(page.getByText('35% engagement boost')).toBeVisible();

    // Should have visualization
    await expect(page.getByTestId('content-mix-chart')).toBeVisible();
  });

  test('should show Day 3 pivot banner on campaign page', async ({ page }) => {
    await page.goto('/campaigns/camp-001');

    // Mock campaign on Day 3 with low engagement
    await page.route('**/api/campaigns/camp-001', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'camp-001',
          name: 'My Campaign',
          days_running: 3,
          engagement_rate: 0.015, // 1.5%
          pivot_check: {
            should_pivot: true,
            reason: 'Low engagement on Day 3',
          },
        }),
      });
    });

    await page.reload();

    // Should show prominent pivot banner
    await expect(page.getByTestId('day-3-pivot-banner')).toBeVisible();
    await expect(page.getByText(/day 3.*pivot.*check/i)).toBeVisible();

    // Should have "View Recommendations" button
    await expect(page.getByTestId('view-pivot-recommendations')).toBeVisible();

    // Click to view recommendations
    await page.click('[data-testid="view-pivot-recommendations"]');

    // Should navigate to pivot page
    await expect(page).toHaveURL(/\/pivot$/);
  });

  test('should calculate engagement benchmark scores', async ({ page }) => {
    await page.goto('/analytics/benchmarks');

    // Mock benchmark data
    await page.route('**/api/analytics/benchmarks', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          your_performance: {
            engagement_rate: 0.06, // 6%
            video_engagement: 0.08,
            reach_growth: 0.45, // 45% month-over-month
          },
          industry_benchmarks: {
            engagement_rate: 0.03, // Industry average: 3%
            video_engagement: 0.05,
            reach_growth: 0.25,
          },
          scores: {
            engagement_score: 200, // 2x industry average
            video_score: 160, // 1.6x industry average
            growth_score: 180, // 1.8x industry average
            overall_score: 180, // Average of all scores
          },
        }),
      });
    });

    await page.reload();

    // Should show your performance vs industry
    await expect(page.getByText('Your Engagement: 6%')).toBeVisible();
    await expect(page.getByText('Industry Average: 3%')).toBeVisible();

    // Should show scores
    await expect(page.getByText('200')).toBeVisible(); // Engagement score
    await expect(page.getByText('180')).toBeVisible(); // Overall score

    // Should show "Above Average" badge
    await expect(page.getByTestId('above-average-badge')).toBeVisible();

    // Should show comparison chart
    await expect(page.getByTestId('benchmark-comparison-chart')).toBeVisible();
  });

  test('should export performance report', async ({ page }) => {
    await page.goto('/analytics/performance');

    // Should have export button
    await expect(page.getByTestId('export-report')).toBeVisible();

    // Click export
    await page.click('[data-testid="export-report"]');

    // Should show export options
    await expect(page.getByText('Export Format')).toBeVisible();
    await expect(page.getByText('PDF')).toBeVisible();
    await expect(page.getByText('CSV')).toBeVisible();
    await expect(page.getByText('Excel')).toBeVisible();

    // Select PDF
    await page.click('[data-testid="export-format-pdf"]');

    // Mock export
    const downloadPromise = page.waitForEvent('download');

    await page.click('[data-testid="confirm-export"]');

    const download = await downloadPromise;

    // Verify file name
    expect(download.suggestedFilename()).toContain('performance-report');
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
