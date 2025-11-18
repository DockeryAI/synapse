import { test, expect } from '@playwright/test';

/**
 * Onboarding Flow E2E Tests
 * 
 * Tests the complete onboarding journey:
 * URL Input → UVP Extraction → Confirmation → Insights → Suggestions → Generation
 */

test.describe('Onboarding Flow', () => {
  
  test('should complete full onboarding flow with URL input', async ({ page }) => {
    // Navigate to onboarding page
    await page.goto('/onboarding-v5');
    
    // Step 1: URL Input
    await expect(page.getByText('Welcome to Synapse')).toBeVisible();
    await expect(page.getByText('Just enter your website URL')).toBeVisible();
    
    // Enter website URL
    const urlInput = page.getByPlaceholder('www.yourbusiness.com');
    await urlInput.fill('www.example.com');
    
    // Select industry (wait for industry selector to load)
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });

    // Click the input to open dropdown
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();

    // Wait for dropdown option to appear
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    
    // Click Get Started
    await page.click('button:has-text("Get Started")');
    
    // Step 2: UVP Extraction - Wait for analysis to complete
    await expect(page.getByText('Learning About Your Business')).toBeVisible({ timeout: 10000 });
    
    // Wait for extraction to complete (should show progress steps)
    await expect(page.getByText('Understanding your unique offerings')).toBeVisible();
    await expect(page.getByText('Identifying your customers')).toBeVisible();
    
    // Wait for confirmation screen (may take up to 60 seconds for API calls)
    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    
    // Step 3: Smart Confirmation
    // Verify services card is visible
    await expect(page.getByText('Key Services')).toBeVisible();
    
    // Select at least one service
    const firstService = page.locator('[data-testid^="service-chip-"]').first();
    if (await firstService.count() > 0) {
      await firstService.click();
    }
    
    // Click Continue
    await page.click('button:has-text("Continue")');
    
    // Step 4: Insights Dashboard
    await expect(page.getByText('Your Business Insights')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Business Profile')).toBeVisible();
    await expect(page.getByText('Key Insights')).toBeVisible();
    await expect(page.getByText('Content Opportunities')).toBeVisible();
    
    // Click Continue to Smart Suggestions
    await page.click('button:has-text("Continue to Smart Suggestions")');
    
    // Step 5: Smart Suggestions
    await expect(page.getByText('Smart Content Suggestions')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Suggested Campaigns')).toBeVisible();
    await expect(page.getByText('Quick Posts')).toBeVisible();
    
    // Test complete - user is at suggestions screen
    expect(page.url()).toContain('/onboarding-v5');
  });
  
  test('should handle invalid URL gracefully', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    // Enter invalid URL
    const urlInput = page.getByPlaceholder('www.yourbusiness.com');
    await urlInput.fill('not-a-valid-url');
    
    // Select industry
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    
    // Try to submit
    await page.click('button:has-text("Get Started")');
    
    // Should show error message
    await expect(page.getByText(/valid website URL/i)).toBeVisible({ timeout: 5000 });
  });
  
  test('should require industry selection', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    // Enter valid URL but don't select industry
    const urlInput = page.getByPlaceholder('www.yourbusiness.com');
    await urlInput.fill('www.example.com');
    
    // Try to submit without industry
    await page.click('button:has-text("Get Started")');
    
    // Should show error
    await expect(page.getByText(/select your business type/i)).toBeVisible({ timeout: 5000 });
  });
  
  test('should allow editing during confirmation', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    // Complete URL input
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    await page.click('button:has-text("Get Started")');
    
    // Wait for confirmation
    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    
    // Try to add custom service
    const addServiceButton = page.getByText('Add Custom Service');
    if (await addServiceButton.isVisible()) {
      await addServiceButton.click();
      
      // Fill custom service input
      const customInput = page.getByPlaceholder(/custom service/i);
      await customInput.fill('Custom Catering');
      await page.keyboard.press('Enter');
      
      // Verify custom service appears
      await expect(page.getByText('Custom Catering')).toBeVisible();
    }
  });
  
  test('should allow going back from any step', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    // Complete URL input
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    await page.click('button:has-text("Get Started")');
    
    // Wait for confirmation
    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    
    // Click back button if it exists
    const backButton = page.getByText('Back');
    if (await backButton.isVisible()) {
      await backButton.click();
      
      // Should be back at URL input
      await expect(page.getByText('Welcome to Synapse')).toBeVisible();
    }
  });
  
  test('should show proper loading states', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    // Complete URL input
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    await page.click('button:has-text("Get Started")');
    
    // Should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 5000 });
    
    // Should show progress text
    await expect(page.getByText('Learning About Your Business')).toBeVisible();
  });
});

test.describe('Multi-select Functionality', () => {
  
  test('should allow selecting multiple services', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    // Skip to confirmation (assuming URL submitted successfully)
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    await page.click('button:has-text("Get Started")');
    
    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    
    // Select multiple services
    const serviceChips = page.locator('[data-testid^="service-chip-"]');
    const count = await serviceChips.count();
    
    if (count >= 3) {
      // Click first 3 services
      for (let i = 0; i < 3; i++) {
        await serviceChips.nth(i).click();
      }
      
      // Verify all 3 are selected (should have selected styling)
      for (let i = 0; i < 3; i++) {
        await expect(serviceChips.nth(i)).toHaveClass(/selected|bg-purple/i);
      }
    }
  });
  
  test('should allow deselecting services', async ({ page }) => {
    await page.goto('/onboarding-v5');
    
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', { timeout: 2000 });
    await page.click('[data-testid="industry-option-restaurant"]');
    await page.click('button:has-text("Get Started")');
    
    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    
    const firstService = page.locator('[data-testid^="service-chip-"]').first();
    
    // Select
    await firstService.click();
    await expect(firstService).toHaveClass(/selected|bg-purple/i);
    
    // Deselect
    await firstService.click();
    await expect(firstService).not.toHaveClass(/selected|bg-purple/i);
  });
});
