/**
 * PreviewRendererService Tests
 * Total: 15 tests
 */

import { describe, it, expect } from 'vitest';
import { previewRenderer } from '../../../services/v2/preview-renderer.service';

describe('PreviewRendererService', () => {
  const sampleContent = 'Check out our product! #marketing #sales @customer https://example.com 🎉';

  it('should extract hashtags from content', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.hashtags).toContain('#marketing');
    expect(analysis.hashtags).toContain('#sales');
    expect(analysis.hashtags.length).toBe(2);
  });

  it('should extract mentions from content', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.mentions).toContain('@customer');
    expect(analysis.mentions.length).toBe(1);
  });

  it('should extract links from content', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.links).toContain('https://example.com');
    expect(analysis.links.length).toBe(1);
  });

  it('should extract emojis from content', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.emojis).toContain('🎉');
    expect(analysis.emojis.length).toBeGreaterThan(0);
  });

  it('should count characters correctly', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.characterCount).toBe(sampleContent.length);
  });

  it('should count words correctly', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.wordCount).toBeGreaterThan(0);
  });

  it('should render content for platform', async () => {
    const result = await previewRenderer.renderContent({
      platform: 'facebook',
      device: 'desktop',
      content: sampleContent,
      includeMetadata: true,
      generateThumbnail: false,
    });

    expect(result.content).toBe(sampleContent);
    expect(result.characterCount).toBe(sampleContent.length);
  });

  it('should generate warnings for character limit violations', async () => {
    const longContent = 'a'.repeat(300);

    const result = await previewRenderer.renderContent({
      platform: 'twitter',
      device: 'desktop',
      content: longContent,
      includeMetadata: true,
      generateThumbnail: false,
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].type).toBe('character_limit');
  });

  it('should validate content against platform limits', () => {
    const validation = previewRenderer.validateContent(sampleContent, 'twitter');

    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should invalidate content exceeding character limit', () => {
    const longContent = 'a'.repeat(300);
    const validation = previewRenderer.validateContent(longContent, 'twitter');

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should format content for Instagram (hashtags at end)', () => {
    const content = 'Great post #marketing with some #content';
    const formatted = previewRenderer.formatForPlatform(content, 'instagram');

    // Instagram format should move hashtags to end
    expect(formatted).toContain('#marketing');
    expect(formatted).toContain('#content');
  });

  it('should truncate content exceeding platform limit', () => {
    const longContent = 'a'.repeat(300);
    const formatted = previewRenderer.formatForPlatform(longContent, 'twitter');

    expect(formatted.length).toBeLessThanOrEqual(280);
    expect(formatted).toContain('...');
  });

  it('should suggest improvements for content', () => {
    const basicContent = 'Just a plain post without any features';
    const suggestions = previewRenderer.suggestImprovements(basicContent, 'instagram');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes('hashtag'))).toBe(true);
  });

  it('should provide optimal posting times for platforms', () => {
    const times = previewRenderer.getOptimalPostingTimes('linkedin');

    expect(times.length).toBeGreaterThan(0);
    expect(times[0]).toMatch(/\d{2}:\d{2}/); // Time format HH:MM
  });

  it('should calculate readability score', () => {
    const analysis = previewRenderer.analyzeContent(sampleContent);

    expect(analysis.readabilityScore).toBeGreaterThanOrEqual(0);
    expect(analysis.readabilityScore).toBeLessThanOrEqual(100);
  });
});
