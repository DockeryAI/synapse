/**
 * Video Template Service Tests
 */

import { describe, it, expect } from 'vitest';
import { VideoTemplateService, VIDEO_TEMPLATES } from '../VideoTemplateService';

describe('VideoTemplateService', () => {
  it('should get all templates', () => {
    const templates = VideoTemplateService.getAllTemplates();
    expect(templates).toHaveLength(5);
  });

  it('should get template by type', () => {
    const template = VideoTemplateService.getTemplateByType('behind_the_scenes');
    expect(template.type).toBe('behind_the_scenes');
    expect(template.aspectRatio).toBe('9:16');
  });

  it('should suggest template for authority builder campaign', () => {
    const template = VideoTemplateService.suggestTemplate('authority_builder');
    expect(template).toBeDefined();
    expect(['tutorial', 'behind_the_scenes']).toContain(template.type);
  });

  it('should suggest template for revenue rush campaign', () => {
    const template = VideoTemplateService.suggestTemplate('revenue_rush');
    expect(template).toBeDefined();
    expect(['product_demo', 'trending']).toContain(template.type);
  });

  it('should validate all templates', () => {
    const templates = VideoTemplateService.getAllTemplates();
    templates.forEach(template => {
      const isValid = VideoTemplateService.validateTemplate(template);
      expect(isValid).toBe(true);
    });
  });

  it('should sort templates by engagement multiplier', () => {
    const templates = VideoTemplateService.getTemplatesByEngagement();
    expect(templates[0].engagementMultiplier).toBeGreaterThanOrEqual(
      templates[templates.length - 1].engagementMultiplier
    );
  });

  it('should get templates by platform', () => {
    const tiktokTemplates = VideoTemplateService.getTemplatesByPlatform('tiktok');
    expect(tiktokTemplates.length).toBeGreaterThan(0);
    tiktokTemplates.forEach(template => {
      expect(template.platforms).toContain('tiktok');
    });
  });
});
