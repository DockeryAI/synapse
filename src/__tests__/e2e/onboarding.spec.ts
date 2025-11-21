import { test, expect } from '@playwright/test';

/**
 * Onboarding Flow E2E Tests
 * 
 * Tests the complete onboarding journey:
 * URL Input → UVP Extraction → Confirmation → Insights → Suggestions → Generation
 */

test.describe('Onboarding Flow', () => {
  
  test('should complete full onboarding flow with URL input', async ({ page }) => {
    test.setTimeout(150000);
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

    // Type in the industry search field to show dropdown
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');

    // Wait for dropdown option to appear
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });
    
    // Click Get Started
    await page.click('button:has-text("Get Started")');
    
    // Step 2: UVP Extraction - Wait for analysis to complete
    await expect(page.getByText(/Analyzing|Scanning/).first()).toBeVisible({ timeout: 10000 });

    // Wait for confirmation screen (extraction takes 60-90 seconds for real API calls)
    // This includes: scanning, extracting value props, analyzing buyer intelligence, synthesizing narrative
    await expect(page.getByText('Confirm Your Offerings')).toBeVisible({ timeout: 120000 });
    
    // Step 3: Smart Confirmation
    // Verify services section is visible
    await expect(page.getByText('Core Services')).toBeVisible();

    // Service chips are pre-selected (first 6), so we don't need to click anything
    // The button will be enabled since chips are pre-selected

    // Click Continue button
    await page.click('button:has-text("Continue")');
    
    // Step 4: UVP Wizard Flow - Target Customer
    await expect(page.getByText('Who is Your Target Customer?')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('AI Suggestions')).toBeVisible();

    // Test complete - user has progressed through confirmation to UVP wizard
    expect(page.url()).toContain('/onboarding-v5');
  });
  
  test('should handle invalid URL gracefully', async ({ page }) => {
    test.setTimeout(150000);
    await page.goto('/onboarding-v5');

    // Enter invalid URL (this format will fail URL constructor)
    const urlInput = page.getByPlaceholder('www.yourbusiness.com');
    await urlInput.fill('://');
    
    // Select industry
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });

    // Try to submit
    await page.click('button:has-text("Get Started")');

    // Should show error message
    await expect(page.getByText(/valid website URL/i)).toBeVisible({ timeout: 5000 });
  });
  
  test('should require industry selection', async ({ page }) => {
    test.setTimeout(150000);
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
    test.setTimeout(150000);
    await page.goto('/onboarding-v5');
    
    // Complete URL input
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });
    await page.click('button:has-text("Get Started")');

    // Wait for confirmation
    await expect(page.getByText('Confirm Your Offerings')).toBeVisible({ timeout: 120000 });

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
    test.setTimeout(150000);
    await page.goto('/onboarding-v5');
    
    // Complete URL input
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });
    await page.click('button:has-text("Get Started")');

    // Wait for confirmation
    await expect(page.getByText('Confirm Your Offerings')).toBeVisible({ timeout: 120000 });

    // Click back button if it exists
    const backButton = page.getByText('Back');
    if (await backButton.isVisible()) {
      await backButton.click();
      
      // Should be back at URL input
      await expect(page.getByText('Welcome to Synapse')).toBeVisible();
    }
  });
  
  test('should show proper loading states', async ({ page }) => {
    test.setTimeout(150000);
    await page.goto('/onboarding-v5');
    
    // Complete URL input
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });
    await page.click('button:has-text("Get Started")');

    // Should show loading spinner
    await expect(page.locator('.animate-spin').first()).toBeVisible({ timeout: 5000 });

    // Should show progress text - either "Analyzing" or the specific step (use first match)
    await expect(page.getByText(/Analyzing|Scanning/).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Multi-select Functionality', () => {
  
  test('should allow selecting multiple services', async ({ page }) => {
    test.setTimeout(150000);
    await page.goto('/onboarding-v5');

    // Skip to confirmation (assuming URL submitted successfully)
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });
    await page.click('button:has-text("Get Started")');

    await expect(page.getByText('Confirm Your Offerings')).toBeVisible({ timeout: 120000 });

    // Service chips are pre-selected (first 6 by default)
    const serviceChips = page.locator('[data-testid^="service-chip-"]');
    const count = await serviceChips.count();

    if (count >= 6) {
      // Verify first 6 chips are pre-selected
      for (let i = 0; i < 6; i++) {
        const chip = serviceChips.nth(i);
        await expect(chip).toHaveAttribute('aria-pressed', 'true');
      }

      // If there are more than 6 chips, verify the 7th is NOT selected
      if (count > 6) {
        const seventhChip = serviceChips.nth(6);
        await expect(seventhChip).toHaveAttribute('aria-pressed', 'false');

        // Click the 7th chip to select it
        await seventhChip.click();
        await page.waitForTimeout(300);

        // Verify it's now selected
        await expect(seventhChip).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });
  
  test('should allow deselecting services', async ({ page }) => {
    test.setTimeout(150000);
    await page.goto('/onboarding-v5');

    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();
    await industryInput.fill('restaurant');
    await page.waitForSelector('[data-testid="industry-option-restaurant"]', {
      timeout: 5000,
      state: 'visible'
    });
    // Small wait for animation to complete
    await page.waitForTimeout(300);
    await page.click('[data-testid="industry-option-restaurant"]');
    // Wait for selection to be reflected in UI
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 2000 });
    await page.click('button:has-text("Get Started")');

    await expect(page.getByText('Confirm Your Offerings')).toBeVisible({ timeout: 120000 });

    // Wait for services section to load
    await expect(page.getByText('Core Services')).toBeVisible({ timeout: 10000 });

    const firstService = page.locator('[data-testid^="service-chip-"]').first();

    // Wait for chip to be visible
    await expect(firstService).toBeVisible({ timeout: 10000 });

    // Get initial aria-pressed state (chips are pre-selected by default)
    const initialState = await firstService.getAttribute('aria-pressed');

    // Click to toggle
    await firstService.click();
    await page.waitForTimeout(300); // Wait for animation

    // Verify state changed
    const afterFirstClick = await firstService.getAttribute('aria-pressed');
    expect(afterFirstClick).not.toBe(initialState);

    // Click again to toggle back
    await firstService.click();
    await page.waitForTimeout(300); // Wait for animation

    // Verify state returned to initial
    const afterSecondClick = await firstService.getAttribute('aria-pressed');
    expect(afterSecondClick).toBe(initialState);
  });
});
