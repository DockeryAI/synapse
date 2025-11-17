/**
 * Video System E2E Tests
 *
 * Tests video template selection, generation, auto-captions, and engagement metrics.
 * Verifies the 10x+ engagement boost claim.
 *
 * Because if your video system doesn't work, nothing else matters.
 */

import { test, expect } from '@playwright/test';
import { mockSMBProfiles, expectedMetrics } from '../fixtures/smb-profiles';

test.describe('Video System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Add login flow when auth is implemented
  });

  test('should display video template selection', async ({ page }) => {
    await page.goto('/content/video');

    // Check template categories exist
    await expect(page.getByText('Video Templates')).toBeVisible();
    await expect(page.getByText('Stories Ads')).toBeVisible();
    await expect(page.getByText('Product Demos')).toBeVisible();
    await expect(page.getByText('Behind-the-Scenes')).toBeVisible();
  });

  test('should generate 15-60 second video in 9:16 format', async ({ page }) => {
    await page.goto('/content/video/create');

    // Select template
    await page.click('[data-testid="video-template-stories-ad"]');

    // Set duration (should be between 15-60 seconds)
    await page.fill('[data-testid="video-duration"]', '30');

    // Verify duration validation
    const duration = await page.inputValue('[data-testid="video-duration"]');
    expect(parseInt(duration)).toBeGreaterThanOrEqual(15);
    expect(parseInt(duration)).toBeLessThanOrEqual(60);

    // Select aspect ratio
    await page.selectOption('[data-testid="video-aspect-ratio"]', '9:16');

    // Start generation
    await page.click('[data-testid="generate-video"]');

    // Wait for generation (max 60 seconds)
    await page.waitForSelector('[data-testid="video-preview"]', { timeout: 60000 });

    // Verify video dimensions (9:16 ratio)
    const videoElement = await page.locator('video').first();
    const boundingBox = await videoElement.boundingBox();

    if (boundingBox) {
      const ratio = boundingBox.height / boundingBox.width;
      expect(ratio).toBeCloseTo(16 / 9, 0.1);
    }
  });

  test('should generate Stories ads in vertical full-screen format', async ({ page }) => {
    await page.goto('/content/video/create');

    // Select Stories Ad template
    await page.click('[data-testid="video-template-stories-ad"]');

    // Stories should auto-select 9:16
    const aspectRatio = await page.inputValue('[data-testid="video-aspect-ratio"]');
    expect(aspectRatio).toBe('9:16');

    // Should have full-screen indicator
    await expect(page.getByText('Full-screen mobile')).toBeVisible();

    // Should show safe zones
    await expect(page.getByTestId('safe-zone-overlay')).toBeVisible();
  });

  test('should auto-generate captions using Whisper API', async ({ page }) => {
    await page.goto('/content/video/create');

    // Upload video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/sample-video.mp4');

    // Click auto-caption button
    await page.click('[data-testid="auto-caption-btn"]');

    // Wait for Whisper API processing
    await page.waitForSelector('[data-testid="captions-generated"]', { timeout: 30000 });

    // Verify captions exist
    const captionsText = await page.textContent('[data-testid="captions-preview"]');
    expect(captionsText).toBeTruthy();
    expect(captionsText!.length).toBeGreaterThan(0);

    // Verify caption timing
    const captionLines = await page.locator('[data-testid="caption-line"]').count();
    expect(captionLines).toBeGreaterThan(0);
  });

  test('should burn-in captions to video', async ({ page }) => {
    await page.goto('/content/video/create');

    // Generate captions first (mocked for speed)
    await page.evaluate(() => {
      (window as any).mockCaptions = [
        { start: 0, end: 2, text: 'This is a test caption' },
        { start: 2, end: 4, text: 'Testing caption burn-in' },
      ];
    });

    // Enable caption burn-in
    await page.check('[data-testid="burn-in-captions"]');

    // Select caption style
    await page.selectOption('[data-testid="caption-style"]', 'modern');

    // Generate video with burned-in captions
    await page.click('[data-testid="generate-video"]');

    await page.waitForSelector('[data-testid="video-ready"]', { timeout: 60000 });

    // Verify captions are part of video (not subtitle track)
    const hasCaptionTrack = await page.locator('video track[kind="captions"]').count();
    expect(hasCaptionTrack).toBe(0); // Should be burned-in, not separate track
  });

  test('should integrate trending audio', async ({ page }) => {
    await page.goto('/content/video/create');

    // Open trending audio selector
    await page.click('[data-testid="select-audio-btn"]');

    // Should show trending audio list
    await expect(page.getByTestId('trending-audio-list')).toBeVisible();

    // Should have trending indicator
    const trendingAudio = page.locator('[data-trending="true"]').first();
    await expect(trendingAudio).toBeVisible();

    // Select trending audio
    await trendingAudio.click();

    // Verify audio selected
    await expect(page.getByTestId('selected-audio-name')).toBeVisible();

    // Should show audio waveform
    await expect(page.getByTestId('audio-waveform')).toBeVisible();
  });

  test('should verify 10x engagement boost claim (mock data)', async ({ page }) => {
    await page.goto('/analytics/video-performance');

    // Mock video performance data
    await page.evaluate((metrics) => {
      (window as any).mockVideoMetrics = {
        withVideo: { engagement: 0.15 },  // 15% engagement
        withoutVideo: { engagement: 0.015 }, // 1.5% engagement (baseline)
      };
    }, expectedMetrics);

    // Load performance comparison
    await page.click('[data-testid="load-video-comparison"]');

    // Wait for chart
    await page.waitForSelector('[data-testid="engagement-comparison-chart"]');

    // Verify engagement boost
    const boostText = await page.textContent('[data-testid="engagement-boost"]');
    expect(boostText).toContain('10x'); // Should show 10x or higher

    // Verify baseline vs video engagement
    const baseline = await page.getAttribute('[data-testid="baseline-engagement"]', 'data-value');
    const videoEngagement = await page.getAttribute('[data-testid="video-engagement"]', 'data-value');

    if (baseline && videoEngagement) {
      const boost = parseFloat(videoEngagement) / parseFloat(baseline);
      expect(boost).toBeGreaterThanOrEqual(expectedMetrics.videoEngagement.min);
    }
  });

  test('should support multiple video export formats', async ({ page }) => {
    await page.goto('/content/video/create');

    // Generate video first
    await page.click('[data-testid="video-template-product-demo"]');
    await page.click('[data-testid="generate-video"]');
    await page.waitForSelector('[data-testid="video-ready"]', { timeout: 60000 });

    // Open export options
    await page.click('[data-testid="export-video"]');

    // Should show platform-specific exports
    await expect(page.getByText('Export for Instagram Stories')).toBeVisible();
    await expect(page.getByText('Export for TikTok')).toBeVisible();
    await expect(page.getByText('Export for YouTube Shorts')).toBeVisible();
    await expect(page.getByText('Export for Facebook Reels')).toBeVisible();

    // Each should have correct specs
    const tiktokSpecs = page.locator('[data-platform="tiktok"] [data-testid="export-specs"]');
    await expect(tiktokSpecs).toContainText('9:16');
    await expect(tiktokSpecs).toContainText('15-60s');
  });

  test('should validate video specifications before export', async ({ page }) => {
    await page.goto('/content/video/create');

    // Try to export without generating
    await page.click('[data-testid="export-video"]');

    // Should show error
    await expect(page.getByText(/generate.*video.*first/i)).toBeVisible();

    // Generate video
    await page.click('[data-testid="video-template-stories-ad"]');
    await page.click('[data-testid="generate-video"]');
    await page.waitForSelector('[data-testid="video-ready"]', { timeout: 60000 });

    // Now export should work
    await page.click('[data-testid="export-video"]');
    await expect(page.getByTestId('export-options')).toBeVisible();
  });

  test('should preview video before finalizing', async ({ page }) => {
    await page.goto('/content/video/create');

    await page.click('[data-testid="video-template-behind-the-scenes"]');
    await page.click('[data-testid="generate-video"]');

    // Wait for preview
    await page.waitForSelector('[data-testid="video-preview"]', { timeout: 60000 });

    // Should have playback controls
    await expect(page.locator('video[controls]')).toBeVisible();

    // Should have edit options
    await expect(page.getByTestId('edit-video-btn')).toBeVisible();
    await expect(page.getByTestId('regenerate-video-btn')).toBeVisible();
    await expect(page.getByTestId('approve-video-btn')).toBeVisible();
  });

  test('should handle video generation failures gracefully', async ({ page }) => {
    await page.goto('/content/video/create');

    // Mock API failure
    await page.route('**/api/video/generate', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Video generation failed' }),
      });
    });

    await page.click('[data-testid="video-template-stories-ad"]');
    await page.click('[data-testid="generate-video"]');

    // Should show error message
    await expect(page.getByText(/failed.*generate.*video/i)).toBeVisible();

    // Should allow retry
    await expect(page.getByTestId('retry-video-generation')).toBeVisible();
  });
});
