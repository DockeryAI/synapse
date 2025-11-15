/**
 * Template Service Tests
 * Critical path: Template selection and population
 */

import { describe, it, expect } from 'vitest';
import { templateService } from '../template.service';

describe('TemplateService', () => {
  describe('getRecommendedTemplates', () => {
    it('should return templates for valid industry', () => {
      const templates = templateService.getRecommendedTemplates({
        industryId: 'restaurant',
        count: 5,
      });

      expect(templates).toHaveLength(5);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('text');
      expect(templates[0]).toHaveProperty('structure');
    });

    it('should return templates for all industries', () => {
      const industries = ['restaurant', 'cpa', 'realtor', 'dentist', 'consultant'];

      industries.forEach((industry) => {
        const templates = templateService.getRecommendedTemplates({
          industryId: industry,
          count: 3,
        });

        expect(templates.length).toBeGreaterThan(0);
      });
    });

    it('should respect count parameter', () => {
      const count = 10;
      const templates = templateService.getRecommendedTemplates({
        industryId: 'restaurant',
        count,
      });

      expect(templates).toHaveLength(count);
    });

    it('should return varied content structures', () => {
      const templates = templateService.getRecommendedTemplates({
        industryId: 'restaurant',
        count: 10,
      });

      const structures = new Set(templates.map((t) => t.structure));
      expect(structures.size).toBeGreaterThan(1);
    });

    it('should handle missing industry gracefully', () => {
      const templates = templateService.getRecommendedTemplates({
        industryId: 'nonexistent',
        count: 5,
      });

      expect(templates.length).toBeGreaterThan(0);
    });

    it('should apply distribution if provided', () => {
      const distribution = {
        promotional: 50,
        educational: 30,
        engagement: 20,
      };

      const templates = templateService.getRecommendedTemplates({
        industryId: 'restaurant',
        count: 30,
        distribution,
      });

      expect(templates).toHaveLength(30);
    });
  });

  describe('populateTemplate', () => {
    it('should replace variables with brand data', () => {
      const template = {
        id: 'test-1',
        text: 'Visit {{BRAND_NAME}} for {{VALUE_PROP}}!',
        structure: 'hook-value-cta' as const,
        suitability: { restaurant: 0.9 },
        variables: ['BRAND_NAME', 'VALUE_PROP'],
        industry: 'restaurant',
      };

      const brandData = {
        id: 'brand-1',
        name: 'Test Restaurant',
        industry: 'restaurant',
        businessType: 'restaurant',
        uvp: 'authentic Italian cuisine',
        benefits: [],
        features: [],
        targetAudience: '',
        audienceCharacteristics: [],
        brandVoice: 'friendly',
        contentThemes: [],
        powerWords: [],
        currentOffers: [],
        upcomingEvents: [],
      };

      const result = templateService.populateTemplate(template, brandData);

      expect(result).toContain('Test Restaurant');
      expect(result).toContain('authentic Italian cuisine');
      expect(result).not.toContain('{{BRAND_NAME}}');
      expect(result).not.toContain('{{VALUE_PROP}}');
    });

    it('should handle missing brand data gracefully', () => {
      const template = {
        id: 'test-2',
        text: 'Check out {{BRAND_NAME}}!',
        structure: 'hook-value-cta' as const,
        suitability: { restaurant: 0.9 },
        variables: ['BRAND_NAME'],
        industry: 'restaurant',
      };

      const brandData = {
        id: 'brand-1',
        name: '',
        industry: 'restaurant',
        businessType: 'restaurant',
        uvp: '',
        benefits: [],
        features: [],
        targetAudience: '',
        audienceCharacteristics: [],
        brandVoice: '',
        contentThemes: [],
        powerWords: [],
        currentOffers: [],
        upcomingEvents: [],
      };

      const result = templateService.populateTemplate(template, brandData);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle templates with no variables', () => {
      const template = {
        id: 'test-3',
        text: 'Great food awaits!',
        structure: 'hook-value-cta' as const,
        suitability: { restaurant: 0.9 },
        variables: [],
        industry: 'restaurant',
      };

      const brandData = {
        id: 'brand-1',
        name: 'Test Restaurant',
        industry: 'restaurant',
        businessType: 'restaurant',
        uvp: 'great food',
        benefits: [],
        features: [],
        targetAudience: '',
        audienceCharacteristics: [],
        brandVoice: 'friendly',
        contentThemes: [],
        powerWords: [],
        currentOffers: [],
        upcomingEvents: [],
      };

      const result = templateService.populateTemplate(template, brandData);

      expect(result).toBe('Great food awaits!');
    });

    it('should capitalize brand name appropriately', () => {
      const template = {
        id: 'test-4',
        text: '{{BRAND_NAME}} is amazing!',
        structure: 'hook-value-cta' as const,
        suitability: { restaurant: 0.9 },
        variables: ['BRAND_NAME'],
        industry: 'restaurant',
      };

      const brandData = {
        id: 'brand-1',
        name: 'test restaurant',
        industry: 'restaurant',
        businessType: 'restaurant',
        uvp: '',
        benefits: [],
        features: [],
        targetAudience: '',
        audienceCharacteristics: [],
        brandVoice: '',
        contentThemes: [],
        powerWords: [],
        currentOffers: [],
        upcomingEvents: [],
      };

      const result = templateService.populateTemplate(template, brandData);

      expect(result).toContain('Test Restaurant');
    });
  });

  describe('getTemplateById', () => {
    it('should retrieve template by ID', () => {
      const templates = templateService.getRecommendedTemplates({
        industryId: 'restaurant',
        count: 1,
      });

      const templateId = templates[0].id;
      const found = templateService.getTemplateById(templateId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(templateId);
    });

    it('should return undefined for invalid ID', () => {
      const found = templateService.getTemplateById('nonexistent-id');

      expect(found).toBeUndefined();
    });
  });
});
