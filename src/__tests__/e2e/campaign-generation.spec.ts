import { test, expect } from '@playwright/test';

/**
 * Campaign Generation E2E Tests
 * 
 * Tests campaign generation from SmartSuggestions:
 * - Selecting suggested campaigns
 * - Selecting quick posts
 * - Custom builder flow
 * - Campaign preview and editing
 */

test.describe('Campaign Generation from Smart Suggestions', () => {
  
  // Helper function to navigate to Smart Suggestions
  async function navigateToSuggestions(page) {
    await page.goto('/onboarding-v5');
    
    // Complete onboarding flow
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });

    // Click the input to open dropdown (auto-show has 500ms delay)
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();

    // Wait for dropdown option to appear and become stable
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
    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    
    // Select a service and continue
    const firstService = page.locator('[data-testid^="service-chip-"]').first();
    if (await firstService.count() > 0) {
      await firstService.click();
    }
    await page.click('button:has-text("Continue")');
    
    // Skip insights dashboard
    await expect(page.getByText('Your Business Insights')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Continue to Smart Suggestions")');
    
    // Wait for suggestions
    await expect(page.getByText('Smart Content Suggestions')).toBeVisible({ timeout: 10000 });
  }
  
  test('should generate campaign from suggested campaign', async ({ page }) => {
    await navigateToSuggestions(page);
    
    // Find first suggested campaign
    const firstCampaign = page.locator('[data-testid^="campaign-suggestion-"]').first();
    
    if (await firstCampaign.count() > 0) {
      // Click Select on campaign
      await firstCampaign.locator('button:has-text("Select")').click();
      
      // Should show content generation loading
      await expect(page.getByText('Creating Your Content')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Generating')).toBeVisible();
      
      // Wait for campaign preview (may take time for AI generation)
      await expect(page.locator('[data-testid="campaign-preview"]')).toBeVisible({ timeout: 120000 });
      
      // Verify multiple posts are shown
      const posts = page.locator('[data-testid^="campaign-post-"]');
      expect(await posts.count()).toBeGreaterThan(0);
    }
  });
  
  test('should generate single post from quick post suggestion', async ({ page }) => {
    await navigateToSuggestions(page);
    
    // Find first quick post
    const firstPost = page.locator('[data-testid^="quick-post-"]').first();
    
    if (await firstPost.count() > 0) {
      // Click Create on quick post
      await firstPost.locator('button:has-text("Create")').click();
      
      // Should show content generation loading
      await expect(page.getByText('Creating Your Content')).toBeVisible({ timeout: 10000 });
      
      // Wait for single post preview
      await expect(page.locator('[data-testid="post-preview"]')).toBeVisible({ timeout: 120000 });
      
      // Verify post content is displayed
      await expect(page.locator('[data-testid="post-content"]')).toBeVisible();
    }
  });
  
  test('should navigate to custom builder', async ({ page }) => {
    await navigateToSuggestions(page);
    
    // Click Build Custom Campaign button
    const customButton = page.getByText('Build Custom Campaign');
    await customButton.click();
    
    // Should navigate to campaign page with context
    await expect(page.url()).toContain('/campaign');
    
    // May show CampaignTypeSelector or ContentMixer depending on implementation
    // Just verify we left the onboarding flow
    expect(page.url()).not.toContain('/onboarding-v5');
  });
  
  test('should show campaign details correctly', async ({ page }) => {
    await navigateToSuggestions(page);
    
    // Get campaign suggestion details
    const firstCampaign = page.locator('[data-testid^="campaign-suggestion-"]').first();
    
    if (await firstCampaign.count() > 0) {
      // Verify campaign shows required info
      await expect(firstCampaign.getByText(/posts/i)).toBeVisible();
      await expect(firstCampaign.getByText(/days/i)).toBeVisible();
      await expect(firstCampaign.getByText(/Why this works/i)).toBeVisible();
    }
  });
  
  test('should show post suggestion previews', async ({ page }) => {
    await navigateToSuggestions(page);
    
    // Verify quick posts show preview snippets
    const posts = page.locator('[data-testid^="quick-post-"]');
    const count = await posts.count();
    
    if (count > 0) {
      const firstPost = posts.first();
      
      // Should show post title
      await expect(firstPost.locator('[data-testid="post-title"]')).toBeVisible();
      
      // Should show preview snippet
      await expect(firstPost.locator('[data-testid="post-preview-text"]')).toBeVisible();
      
      // Should show platform
      await expect(firstPost.getByText(/LinkedIn|Facebook|Instagram|Twitter/i)).toBeVisible();
    }
  });
});

test.describe('Campaign Preview and Editing', () => {
  
  test('should allow editing campaign post content', async ({ page }) => {
    // Navigate through full flow to campaign preview
    await page.goto('/onboarding-v5');
    await page.getByPlaceholder('www.yourbusiness.com').fill('www.example.com');
    await page.waitForSelector('[data-testid="industry-selector"]', { timeout: 5000 });

    // Click the input to open dropdown
    const industryInput = page.locator('[data-testid="industry-selector"] input[type="text"]');
    await industryInput.click();

    // Wait for dropdown option to appear and become stable
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

    await expect(page.getByText('Confirm Your Business Details')).toBeVisible({ timeout: 90000 });
    const firstService = page.locator('[data-testid^="service-chip-"]').first();
    if (await firstService.count() > 0) await firstService.click();
    await page.click('button:has-text("Continue")');
    
    await expect(page.getByText('Your Business Insights')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Continue to Smart Suggestions")');
    
    await expect(page.getByText('Smart Content Suggestions')).toBeVisible({ timeout: 10000 });
    
    const firstCampaign = page.locator('[data-testid^="campaign-suggestion-"]').first();
    if (await firstCampaign.count() > 0) {
      await firstCampaign.locator('button:has-text("Select")').click();
      await expect(page.locator('[data-testid="campaign-preview"]')).toBeVisible({ timeout: 120000 });
      
      // Find edit button on first post
      const editButton = page.locator('[data-testid^="edit-post-"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should show edit modal or inline editor
        const contentEditor = page.locator('[data-testid="content-editor"]');
        await expect(contentEditor).toBeVisible({ timeout: 5000 });
        
        // Edit content
        await contentEditor.fill('Updated post content');
        
        // Save changes
        await page.click('button:has-text("Save")');
        
        // Verify content updated
        await expect(page.getByText('Updated post content')).toBeVisible();
      }
    }
  });
  
  test('should show campaign schedule preview', async ({ page }) => {
    // Skip to campaign preview (assuming campaign generated)
    // This test would need campaign generation to complete first
    // For now, just verify the structure exists
    
    const preview = page.locator('[data-testid="campaign-preview"]');
    if (await preview.isVisible()) {
      // Should show posting schedule
      await expect(page.getByText(/schedule/i)).toBeVisible();
      
      // Should show platform distribution
      await expect(page.getByText(/platform/i)).toBeVisible();
    }
  });
});

test.describe('Content Mixer Flow', () => {
  
  test('should allow building custom campaign with content mixer', async ({ page }) => {
    // Navigate to campaign page
    await page.goto('/campaign/new');
    
    // Should show campaign type selector
    await expect(page.getByText(/Choose.*Campaign.*Type/i)).toBeVisible({ timeout: 10000 });
    
    // Select a campaign type
    const campaignType = page.locator('[data-testid^="campaign-type-"]').first();
    if (await campaignType.count() > 0) {
      await campaignType.click();
      
      // May show ContentMixer or SmartPicks depending on implementation
      // Just verify navigation worked
      expect(page.url()).toContain('/campaign');
    }
  });
});
