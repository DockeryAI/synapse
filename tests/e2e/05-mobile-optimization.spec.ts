/**
 * Mobile Optimization E2E Tests
 *
 * Tests mobile preview, thumb-scroll stopping, responsive design, and touch interactions.
 * Verifies 70%+ thumb-scroll stopping score.
 *
 * Because 80% of social media is consumed on mobile, not your desktop.
 */

import { test, expect, devices } from '@playwright/test';
import { expectedMetrics } from '../fixtures/smb-profiles';

test.describe('Mobile Optimization', () => {
  test.use({ ...devices['iPhone 14'] });

  test('should display mobile preview mode', async ({ page }) => {
    await page.goto('/content/create');

    // Click mobile preview toggle
    await page.click('[data-testid="mobile-preview-toggle"]');

    // Should switch to mobile viewport
    await expect(page.getByTestId('mobile-preview-frame')).toBeVisible();

    // Should show device selector
    await expect(page.getByTestId('device-selector')).toBeVisible();

    // Select iPhone
    await page.selectOption('[data-testid="device-selector"]', 'iphone-14');

    // Verify viewport dimensions (iPhone 14: 390x844)
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeCloseTo(390, 10);
  });

  test('should test thumb-scroll stopping (70%+ score)', async ({ page }) => {
    await page.goto('/content/video/preview');

    // Run thumb-scroll test
    await page.click('[data-testid="run-scroll-test"]');

    // Simulate scroll behavior
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="scroll-simulator"]');
      scrollContainer?.dispatchEvent(new Event('scroll-start'));

      // Simulate stopping on compelling content
      setTimeout(() => {
        scrollContainer?.dispatchEvent(new Event('scroll-stop'));
      }, 1500);
    });

    // Wait for test completion
    await page.waitForSelector('[data-testid="scroll-test-results"]', { timeout: 10000 });

    // Check score
    const scoreText = await page.textContent('[data-testid="scroll-stop-score"]');
    const score = parseFloat(scoreText!.replace('%', '')) / 100;

    expect(score).toBeGreaterThanOrEqual(expectedMetrics.thumbScrollStopping.minScore);

    // Should show what made it stop
    await expect(page.getByTestId('scroll-stop-factors')).toBeVisible();
  });

  test('should validate 9:16 video format on mobile', async ({ page }) => {
    await page.goto('/content/video/preview');

    // Video should fill mobile screen
    const video = page.locator('video').first();
    const videoBounds = await video.boundingBox();
    const viewportSize = page.viewportSize();

    if (videoBounds && viewportSize) {
      // Should take up most of screen width
      expect(videoBounds.width).toBeGreaterThan(viewportSize.width * 0.9);

      // Should be vertical (9:16)
      const ratio = videoBounds.height / videoBounds.width;
      expect(ratio).toBeGreaterThan(1.5); // Roughly 16/9
    }
  });

  test('should validate text size on mobile', async ({ page }) => {
    await page.goto('/content/preview');

    // Check minimum font sizes
    const headings = await page.locator('h1, h2, h3').all();
    for (const heading of headings) {
      const fontSize = await heading.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      // Minimum 18px for mobile headings
      expect(fontSize).toBeGreaterThanOrEqual(18);
    }

    // Check body text
    const bodyText = await page.locator('p, span').first();
    const bodyFontSize = await bodyText.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // Minimum 16px for mobile body text
    expect(bodyFontSize).toBeGreaterThanOrEqual(16);
  });

  test('should validate video playback speed', async ({ page }) => {
    await page.goto('/content/video/preview');

    const video = page.locator('video').first();

    // Get video duration
    const duration = await video.evaluate((v: HTMLVideoElement) => v.duration);

    // Video should be between 15-60 seconds
    expect(duration).toBeGreaterThanOrEqual(15);
    expect(duration).toBeLessThanOrEqual(60);

    // Check playback rate (should be 1.0 for normal speed)
    const playbackRate = await video.evaluate((v: HTMLVideoElement) => v.playbackRate);
    expect(playbackRate).toBe(1.0);
  });

  test('should have touch-friendly buttons (44px minimum)', async ({ page }) => {
    await page.goto('/');

    // Check all clickable elements
    const buttons = await page.locator('button, a[href], [role="button"]').all();

    for (const button of buttons) {
      const bounds = await button.boundingBox();

      if (bounds) {
        // iOS Human Interface Guidelines: minimum 44px touch target
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should be responsive on iPhone 14', async ({ page }) => {
    test.use({ ...devices['iPhone 14'] });

    await page.goto('/');

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
    expect(viewport?.height).toBe(844);

    // Check no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Check content fits
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.offsetWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
  });

  test('should be responsive on Samsung Galaxy S23', async ({ page }) => {
    // Samsung Galaxy S23: 360x800
    await page.setViewportSize({ width: 360, height: 800 });

    await page.goto('/');

    // Check no overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Check navigation is accessible
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();

    // Check main content is readable
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();

    const contentWidth = await mainContent.evaluate((el) => el.offsetWidth);
    expect(contentWidth).toBeLessThanOrEqual(360);
  });

  test('should handle mobile breakpoints', async ({ page }) => {
    // Test different breakpoints
    const breakpoints = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 390, height: 844, name: 'iPhone 14' },
      { width: 393, height: 851, name: 'Pixel 7' },
      { width: 428, height: 926, name: 'iPhone 14 Pro Max' },
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('/');

      // Check no horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasOverflow).toBe(false);

      // Check key elements visible
      await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
    }
  });

  test('should support mobile gestures', async ({ page }) => {
    await page.goto('/content/gallery');

    // Swipe gesture on image gallery
    const gallery = page.locator('[data-testid="image-gallery"]');
    const bounds = await gallery.boundingBox();

    if (bounds) {
      // Swipe right to left (next image)
      await page.touchscreen.tap(bounds.x + bounds.width - 50, bounds.y + bounds.height / 2);
      await page.touchscreen.tap(bounds.x + 50, bounds.y + bounds.height / 2);

      // Should show next image
      await expect(page.getByTestId('gallery-image-2')).toBeVisible();
    }

    // Pinch to zoom (if supported)
    // Note: This is limited in Playwright, mostly for documentation
  });

  test('should have mobile-optimized forms', async ({ page }) => {
    await page.goto('/settings/profile');

    // Check input types for mobile keyboards
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email'); // Shows email keyboard

    const phoneInput = page.locator('input[type="tel"]');
    if (await phoneInput.count() > 0) {
      await expect(phoneInput).toHaveAttribute('type', 'tel'); // Shows phone keyboard
    }

    // Check input sizing
    const inputs = await page.locator('input, textarea').all();
    for (const input of inputs) {
      const height = await input.evaluate((el) => el.offsetHeight);
      expect(height).toBeGreaterThanOrEqual(44); // Touch-friendly
    }
  });

  test('should load images optimally on mobile', async ({ page }) => {
    await page.goto('/');

    // Check for responsive images
    const images = await page.locator('img').all();

    for (const img of images) {
      // Should have srcset or be appropriately sized
      const hasSrcset = await img.getAttribute('srcset');
      const src = await img.getAttribute('src');

      // At least one should exist
      expect(hasSrcset || src).toBeTruthy();

      // Check loading attribute
      const loading = await img.getAttribute('loading');
      if (loading) {
        expect(['lazy', 'eager']).toContain(loading);
      }
    }
  });

  test('should handle mobile menu', async ({ page }) => {
    await page.goto('/');

    // Mobile menu should be collapsed by default
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).not.toBeVisible();

    // Click hamburger menu
    await page.click('[data-testid="mobile-menu-toggle"]');

    // Menu should open
    await expect(mobileMenu).toBeVisible();

    // Should be full-screen or nearly full-screen
    const menuBounds = await mobileMenu.boundingBox();
    const viewport = page.viewportSize();

    if (menuBounds && viewport) {
      expect(menuBounds.width).toBeGreaterThan(viewport.width * 0.8);
    }

    // Close menu
    await page.click('[data-testid="mobile-menu-close"]');
    await expect(mobileMenu).not.toBeVisible();
  });

  test('should have proper spacing on mobile', async ({ page }) => {
    await page.goto('/');

    // Check padding/margins aren't too tight
    const containers = await page.locator('[class*="container"], main, section').all();

    for (const container of containers) {
      const padding = await container.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          left: parseFloat(styles.paddingLeft),
          right: parseFloat(styles.paddingRight),
        };
      });

      // Minimum 16px padding on mobile
      expect(padding.left).toBeGreaterThanOrEqual(16);
      expect(padding.right).toBeGreaterThanOrEqual(16);
    }
  });

  test('should handle orientation changes', async ({ page }) => {
    await page.goto('/content/video/preview');

    // Portrait mode (default)
    await page.setViewportSize({ width: 390, height: 844 });

    let video = page.locator('video').first();
    let bounds = await video.boundingBox();

    // Video should be vertical in portrait
    if (bounds) {
      expect(bounds.height).toBeGreaterThan(bounds.width);
    }

    // Landscape mode
    await page.setViewportSize({ width: 844, height: 390 });

    video = page.locator('video').first();
    bounds = await video.boundingBox();

    // Layout should adapt
    // (Specific behavior depends on design)
    expect(bounds).toBeTruthy();
  });
});
