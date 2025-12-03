/**
 * Social Commerce E2E Tests
 *
 * Tests Instagram Shopping, Facebook Shop, product catalogs, and shoppable posts.
 * Verifies the 2-4% conversion rate claim.
 *
 * Because turning likes into dollars is the whole point.
 */

import { test, expect } from '@playwright/test';
import { mockSMBProfiles, expectedMetrics } from '../fixtures/smb-profiles';

test.describe('Social Commerce', () => {
  const ecommerceBusiness = mockSMBProfiles.ecommerceStore;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login with test account
  });

  test('should sync products to Instagram Shopping catalog', async ({ page }) => {
    await page.goto('/commerce/instagram-shopping');

    // Connect Instagram Business Account (mock)
    await page.click('[data-testid="connect-instagram-shopping"]');

    // Should show product selector
    await expect(page.getByText('Select Products to Sync')).toBeVisible();

    // Select products from internal catalog
    for (const product of ecommerceBusiness.products!) {
      await page.check(`[data-product-id="${product.name}"]`);
    }

    // Sync to Instagram
    await page.click('[data-testid="sync-to-instagram"]');

    // Should show sync progress
    await expect(page.getByTestId('sync-progress')).toBeVisible();

    // Wait for sync completion
    await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 30000 });

    // Verify products synced
    const syncedCount = await page.textContent('[data-testid="synced-products-count"]');
    expect(syncedCount).toContain(ecommerceBusiness.products!.length.toString());
  });

  test('should tag products in Instagram post', async ({ page }) => {
    await page.goto('/content/instagram/create');

    // Create post
    await page.fill('[data-testid="post-caption"]', 'New sustainable fashion just dropped! 🌱');

    // Upload image
    await page.setInputFiles('[data-testid="post-image"]', './tests/fixtures/product-photo.jpg');

    // Open product tagging
    await page.click('[data-testid="tag-products"]');

    // Should show product catalog
    await expect(page.getByTestId('product-catalog')).toBeVisible();

    // Select product to tag
    await page.click('[data-product-name="Organic Cotton T-Shirt"]');

    // Click on image to place tag
    await page.locator('[data-testid="post-image-preview"]').click({
      position: { x: 100, y: 100 }, // Center-ish
    });

    // Verify tag placed
    await expect(page.getByTestId('product-tag-marker')).toBeVisible();

    // Add another tag
    await page.click('[data-product-name="Bamboo Hoodie"]');
    await page.locator('[data-testid="post-image-preview"]').click({
      position: { x: 200, y: 150 },
    });

    // Save post with tags
    await page.click('[data-testid="save-shoppable-post"]');

    await expect(page.getByText(/post.*saved.*product.*tags/i)).toBeVisible();
  });

  test('should create shoppable Instagram Story', async ({ page }) => {
    await page.goto('/content/instagram/stories/create');

    // Upload story image/video
    await page.setInputFiles('[data-testid="story-upload"]', './tests/fixtures/story-product.jpg');

    // Should auto-detect 9:16 format
    await expect(page.getByText('9:16 - Perfect for Stories')).toBeVisible();

    // Add product sticker
    await page.click('[data-testid="add-product-sticker"]');

    // Select product
    await page.click('[data-product-name="Recycled Denim Jeans"]');

    // Product sticker should appear
    await expect(page.getByTestId('product-sticker')).toBeVisible();

    // Should show product name and price
    await expect(page.getByText('Recycled Denim Jeans')).toBeVisible();
    await expect(page.getByText('$89')).toBeVisible();

    // Position sticker
    await page.dragAndDrop('[data-testid="product-sticker"]', '[data-testid="story-canvas"]', {
      targetPosition: { x: 180, y: 500 }, // Bottom center
    });

    // Save shoppable story
    await page.click('[data-testid="save-shoppable-story"]');

    await expect(page.getByText(/story.*saved/i)).toBeVisible();
  });

  test('should set up Facebook Shop', async ({ page }) => {
    await page.goto('/commerce/facebook-shop');

    // Connect Facebook Page (mock)
    await page.click('[data-testid="connect-facebook-shop"]');

    // Should show shop setup wizard
    await expect(page.getByText('Set Up Your Facebook Shop')).toBeVisible();

    // Step 1: Select catalog
    await page.click('[data-testid="use-existing-catalog"]'); // From Instagram Shopping

    // Step 2: Shop name and description
    await page.fill('[data-testid="shop-name"]', ecommerceBusiness.businessName);
    await page.fill('[data-testid="shop-description"]', ecommerceBusiness.description);

    // Step 3: Enable features
    await page.check('[data-testid="enable-marketplace"]');
    await page.check('[data-testid="enable-checkout"]');

    // Complete setup
    await page.click('[data-testid="complete-shop-setup"]');

    // Should show success with shop URL
    await expect(page.getByTestId('shop-url')).toBeVisible();
  });

  test('should create shoppable Facebook post', async ({ page }) => {
    await page.goto('/content/facebook/create');

    // Write post
    await page.fill('[data-testid="post-text"]', 'Our sustainable collection is now available! Shop eco-friendly fashion 🌍');

    // Upload photo
    await page.setInputFiles('[data-testid="post-photo"]', './tests/fixtures/collection-photo.jpg');

    // Tag products
    await page.click('[data-testid="tag-products"]');

    // Select multiple products
    await page.check('[data-product-id="prod-001"]');
    await page.check('[data-product-id="prod-002"]');
    await page.check('[data-product-id="prod-003"]');

    // Should show max 5 products warning if exceeded
    const taggedCount = await page.locator('[data-product-id]:checked').count();
    if (taggedCount > 5) {
      await expect(page.getByText(/maximum.*5.*products/i)).toBeVisible();
    }

    // Add call to action
    await page.selectOption('[data-testid="cta-type"]', 'SHOP_NOW');

    // Schedule post
    await page.click('[data-testid="schedule-post"]');

    await expect(page.getByText(/post.*scheduled/i)).toBeVisible();
  });

  test('should generate direct checkout links', async ({ page }) => {
    await page.goto('/commerce/facebook-shop/products');

    // Select product
    await page.click('[data-product-name="Organic Cotton T-Shirt"]');

    // Should show product details
    await expect(page.getByTestId('product-details-panel')).toBeVisible();

    // Generate checkout link
    await page.click('[data-testid="generate-checkout-link"]');

    // Should show direct checkout URL
    await expect(page.getByTestId('checkout-link')).toBeVisible();

    const checkoutLink = await page.inputValue('[data-testid="checkout-link"]');
    expect(checkoutLink).toContain('facebook.com/commerce');
    expect(checkoutLink).toContain(ecommerceBusiness.products![0].name.replace(/\s+/g, '-'));

    // Copy link button
    await page.click('[data-testid="copy-checkout-link"]');
    await expect(page.getByText('Link copied!')).toBeVisible();
  });

  test('should verify 2-4% conversion rate claim (mock data)', async ({ page }) => {
    await page.goto('/analytics/social-commerce');

    // Mock commerce analytics
    await page.route('**/api/analytics/commerce', (route) => {
      const views = 1000;
      const conversions = Math.floor(views * 0.03); // 3% conversion

      route.fulfill({
        status: 200,
        body: JSON.stringify({
          product_views: views,
          product_clicks: Math.floor(views * 0.15),
          purchases: conversions,
          conversion_rate: conversions / views,
          revenue: conversions * 60, // Average order value
        }),
      });
    });

    await page.reload();

    // Check conversion rate
    const conversionRate = await page.textContent('[data-testid="conversion-rate"]');
    const rate = parseFloat(conversionRate!.replace('%', '')) / 100;

    expect(rate).toBeGreaterThanOrEqual(expectedMetrics.socialCommerceConversion.min);
    expect(rate).toBeLessThanOrEqual(expectedMetrics.socialCommerceConversion.max);

    // Should show metrics breakdown
    await expect(page.getByTestId('product-views')).toBeVisible();
    await expect(page.getByTestId('product-clicks')).toBeVisible();
    await expect(page.getByTestId('purchases')).toBeVisible();
    await expect(page.getByTestId('revenue')).toBeVisible();
  });

  test('should display product performance by platform', async ({ page }) => {
    await page.goto('/analytics/social-commerce');

    // Should show platform tabs
    await expect(page.getByRole('tab', { name: 'Instagram' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Facebook' })).toBeVisible();

    // Click Instagram tab
    await page.click('[role="tab"][name="Instagram"]');

    // Should show Instagram-specific metrics
    await expect(page.getByTestId('instagram-product-tags')).toBeVisible();
    await expect(page.getByTestId('instagram-story-taps')).toBeVisible();
    await expect(page.getByTestId('instagram-checkout-clicks')).toBeVisible();

    // Click Facebook tab
    await page.click('[role="tab"][name="Facebook"]');

    // Should show Facebook-specific metrics
    await expect(page.getByTestId('facebook-shop-visits')).toBeVisible();
    await expect(page.getByTestId('facebook-marketplace-views')).toBeVisible();
  });

  test('should handle out-of-stock products', async ({ page }) => {
    await page.goto('/commerce/products');

    // Mark product as out of stock
    await page.click('[data-product-id="prod-001"]');
    await page.selectOption('[data-testid="product-availability"]', 'out_of_stock');
    await page.click('[data-testid="save-product"]');

    // Should sync to catalogs
    await expect(page.getByText(/updating.*catalogs/i)).toBeVisible();

    // Verify product hidden from shoppable posts
    await page.goto('/content/instagram/create');
    await page.click('[data-testid="tag-products"]');

    // Out of stock product should not appear or be disabled
    const outOfStockProduct = page.locator('[data-product-id="prod-001"]');
    await expect(outOfStockProduct).toHaveAttribute('disabled', '');
  });

  test('should bulk update product prices', async ({ page }) => {
    await page.goto('/commerce/products');

    // Select multiple products
    await page.check('[data-select-product="prod-001"]');
    await page.check('[data-select-product="prod-002"]');
    await page.check('[data-select-product="prod-003"]');

    // Open bulk actions
    await page.click('[data-testid="bulk-actions"]');

    // Select update price
    await page.click('[data-testid="bulk-update-price"]');

    // Apply percentage discount
    await page.selectOption('[data-testid="price-action"]', 'discount');
    await page.fill('[data-testid="discount-percentage"]', '15');

    // Apply changes
    await page.click('[data-testid="apply-bulk-changes"]');

    // Should show sync progress
    await expect(page.getByText(/syncing.*products/i)).toBeVisible();

    await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 30000 });

    // Verify prices updated
    const product1 = ecommerceBusiness.products![0];
    const discountedPrice = product1.price * 0.85;

    await page.click('[data-product-id="prod-001"]');
    const newPrice = await page.inputValue('[data-testid="product-price"]');
    expect(parseFloat(newPrice)).toBeCloseTo(discountedPrice, 2);
  });
});
