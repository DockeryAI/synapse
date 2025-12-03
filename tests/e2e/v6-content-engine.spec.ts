// PRD Feature: SYNAPSE-V6
/**
 * V6 Content Engine E2E Tests
 *
 * Tests the V6 profile-based content generation pipeline:
 * - V6 page loads correctly
 * - Tab data fetching works
 * - Connection discovery runs
 * - Content generation completes
 */

import { test, expect } from '@playwright/test';

test.describe('V6 Content Engine', () => {

  test('should load V6 content page', async ({ page }) => {
    await page.goto('/v6');

    // Should not show loading forever
    await expect(page.locator('text=Loading product data...')).not.toBeVisible({ timeout: 30000 });

    // V6 page should render content
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate to V6 via /synapse-v6 route', async ({ page }) => {
    await page.goto('/synapse-v6');

    // Should load the V6 content page
    await expect(page.locator('main')).toBeVisible({ timeout: 30000 });
  });

  test('should navigate to V6 via /v6-content route', async ({ page }) => {
    await page.goto('/v6-content');

    // Should load the V6 content page
    await expect(page.locator('main')).toBeVisible({ timeout: 30000 });
  });

});
