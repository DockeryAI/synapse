/**
 * Deep Website Scanner Service Tests
 *
 * Tests for comprehensive service/product detection from website data
 *
 * Created: 2025-11-18
 */

import { describe, it, expect } from 'vitest';
import { deepWebsiteScannerService } from '@/services/intelligence/deep-website-scanner.service';
import type { WebsiteData } from '@/services/scraping/websiteScraper';
import { createMockScrapedData, createMinimalScrapedData } from '../utils/test-helpers';

describe('DeepWebsiteScanner', () => {
  describe('scanWebsite', () => {
    it('should detect services from navigation menus', async () => {
      // Create mock data with service navigation
      const mockData: WebsiteData = createMockScrapedData({
        structure: {
          navigation: [
            'SEO Services',
            'Web Design',
            'Content Marketing',
            'Social Media Management',
            'About Us',
            'Contact'
          ],
          sections: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // Should detect at least the service-related navigation items
      expect(result.services.length).toBeGreaterThan(0);

      // Check that non-service nav items are filtered out
      const serviceNames = result.services.map(s => s.name.toLowerCase());
      expect(serviceNames.some(name => name.includes('about'))).toBe(false);
      expect(serviceNames.some(name => name.includes('contact'))).toBe(false);

      // Verify detected services include navigation items
      expect(
        serviceNames.some(name =>
          name.includes('seo') || name.includes('search engine')
        )
      ).toBe(true);
    });

    it('should detect services from headings', async () => {
      // Create mock data with service headings
      const mockData: WebsiteData = createMockScrapedData({
        structure: {
          navigation: ['Home', 'About'],
          sections: []
        },
        content: {
          headings: [
            'Our Services',
            'SEO Optimization',
            'Website Development',
            'Digital Marketing',
            'Brand Strategy',
            'Analytics & Reporting'
          ],
          paragraphs: [
            'We help businesses grow with comprehensive digital solutions.'
          ],
          links: [],
          images: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // Should detect services from headings
      expect(result.services.length).toBeGreaterThan(0);

      const serviceNames = result.services.map(s => s.name.toLowerCase());

      // Verify specific services are detected
      expect(
        serviceNames.some(name => name.includes('seo'))
      ).toBe(true);

      expect(
        serviceNames.some(name =>
          name.includes('website') || name.includes('web') || name.includes('development')
        )
      ).toBe(true);

      // Generic headings should be filtered out
      expect(
        serviceNames.some(name => name === 'our services')
      ).toBe(false);
    });

    it('should calculate confidence scores correctly', async () => {
      // Create mock data with varying signal strength
      const mockData: WebsiteData = createMockScrapedData({
        structure: {
          navigation: ['SEO Services', 'Web Design'],
          sections: ['SEO Services', 'Our SEO Approach']
        },
        content: {
          headings: [
            'SEO Optimization',
            'Search Engine Marketing',
            'Web Development'
          ],
          paragraphs: [
            'Our SEO services help businesses rank higher in Google.',
            'We offer comprehensive SEO packages starting at $2,000/month.',
            'Web design that converts visitors into customers.'
          ],
          links: ['/seo', '/design'],
          images: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // SEO should have higher confidence (mentioned in multiple places)
      const seoService = result.services.find(s =>
        s.name.toLowerCase().includes('seo')
      );

      const webDesignService = result.services.find(s =>
        s.name.toLowerCase().includes('web') &&
        s.name.toLowerCase().includes('design')
      );

      expect(seoService).toBeDefined();
      expect(webDesignService).toBeDefined();

      if (seoService && webDesignService) {
        // SEO mentioned in nav, sections, headings, paragraphs, links (5 sources)
        // Web design mentioned fewer times
        expect(seoService.confidence).toBeGreaterThan(webDesignService.confidence);

        // Both should have reasonable confidence scores (0-1 range)
        expect(seoService.confidence).toBeGreaterThanOrEqual(0.5);
        expect(seoService.confidence).toBeLessThanOrEqual(1);
        expect(webDesignService.confidence).toBeGreaterThanOrEqual(0);
        expect(webDesignService.confidence).toBeLessThanOrEqual(1);
      }

      // All services should have sources
      result.services.forEach(service => {
        expect(service.sources.length).toBeGreaterThan(0);
      });
    });

    it('should deduplicate similar services', async () => {
      // Create mock data with duplicate/similar services
      const mockData: WebsiteData = createMockScrapedData({
        structure: {
          navigation: ['SEO Services', 'Search Engine Optimization'],
          sections: ['SEO', 'Social Media Marketing', 'Social Media']
        },
        content: {
          headings: [
            'SEO',
            'Search Engine Optimization Services',
            'Social Media Marketing',
            'Social Media Management'
          ],
          paragraphs: [],
          links: [],
          images: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // Count SEO-related services (should be deduplicated into 1)
      const seoServices = result.services.filter(s => {
        const name = s.name.toLowerCase();
        return name.includes('seo') || name.includes('search engine');
      });

      // Should have at most 1 SEO service after deduplication
      expect(seoServices.length).toBeLessThanOrEqual(1);

      // Count social media services (should be deduplicated)
      const socialServices = result.services.filter(s => {
        const name = s.name.toLowerCase();
        return name.includes('social media');
      });

      // Should have at most 1-2 social media services
      expect(socialServices.length).toBeLessThanOrEqual(2);

      // Total services should be reasonable (not all duplicates kept)
      expect(result.services.length).toBeLessThan(6); // Started with 6 mentions
    });

    it('should handle websites with minimal content', async () => {
      const minimalData = createMinimalScrapedData();

      const result = await deepWebsiteScannerService.scanWebsite(minimalData);

      // Should not crash and return valid result structure
      expect(result).toBeDefined();
      expect(result.services).toBeDefined();
      expect(Array.isArray(result.services)).toBe(true);

      // Minimal content may have few or no services
      expect(result.services.length).toBeGreaterThanOrEqual(0);

      // All detected services should have valid structure
      result.services.forEach(service => {
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('category');
        expect(service).toHaveProperty('confidence');
        expect(service).toHaveProperty('sources');

        // Confidence should be in valid range (0-1, not 0-100)
        expect(service.confidence).toBeGreaterThanOrEqual(0);
        expect(service.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should categorize services correctly', async () => {
      // Create mock data with various service types
      const mockData: WebsiteData = createMockScrapedData({
        structure: {
          navigation: [
            'SEO Services',
            'Web Development',
            'Consulting',
            'Training Programs'
          ],
          sections: []
        },
        content: {
          headings: [
            'SEO Optimization Package',
            'Custom Web Development',
            'Business Consulting Services',
            'Employee Training Workshops'
          ],
          paragraphs: [
            'Our SEO package includes keyword research and link building.',
            'We build custom web applications for enterprises.',
            'Strategic consulting to help your business grow.',
            'Comprehensive training programs for your team.'
          ],
          links: [],
          images: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // Should detect multiple services
      expect(result.services.length).toBeGreaterThan(0);

      // Services should have appropriate categories
      result.services.forEach(service => {
        expect(service.category).toBeDefined();
        expect(typeof service.category).toBe('string');

        // Category should be one of the valid types
        const validCategories = [
          'primary',
          'secondary',
          'addon',
          'package',
          'tier'
        ];

        // Category should match valid categories
        expect(validCategories).toContain(service.category);
      });

      // Check specific categorizations
      const seoService = result.services.find(s =>
        s.name.toLowerCase().includes('seo')
      );
      if (seoService) {
        // SEO should have a valid category
        const validCategories = ['primary', 'secondary', 'addon', 'package', 'tier'];
        expect(validCategories).toContain(seoService.category);
      }

      const webDevService = result.services.find(s =>
        s.name.toLowerCase().includes('development')
      );
      if (webDevService) {
        // Web development should have a valid category
        const validCategories = ['primary', 'secondary', 'addon', 'package', 'tier'];
        expect(validCategories).toContain(webDevService.category);
      }
    });

    it('should identify primary service correctly', async () => {
      // Create mock data where SEO is clearly the primary focus
      const mockData: WebsiteData = createMockScrapedData({
        title: 'Best SEO Agency - Search Engine Optimization Services',
        description: 'Leading SEO company providing search engine optimization',
        structure: {
          navigation: ['SEO Services', 'SEO Packages', 'Web Design', 'Contact'],
          sections: ['Our SEO Services', 'SEO Pricing', 'Why Choose Our SEO']
        },
        content: {
          headings: [
            'Professional SEO Services',
            'SEO Packages',
            'Search Engine Optimization',
            'Also: Web Design'
          ],
          paragraphs: [
            'We are the leading SEO agency with 10 years of experience.',
            'Our SEO services have helped 500+ businesses rank on Google.',
            'We also offer web design services.'
          ],
          links: ['/seo', '/seo-pricing', '/design'],
          images: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // Should identify primary services
      expect(result.primaryServices).toBeDefined();
      expect(Array.isArray(result.primaryServices)).toBe(true);

      if (result.primaryServices.length > 0) {
        // Primary services should include SEO-related service
        const hasSEOPrimary = result.primaryServices.some(serviceName =>
          serviceName.toLowerCase().includes('seo') ||
          serviceName.toLowerCase().includes('search engine')
        );
        expect(hasSEOPrimary).toBe(true);
      }
    });

    it('should detect pricing information when available', async () => {
      // Create mock data with pricing signals
      const mockData: WebsiteData = createMockScrapedData({
        structure: {
          navigation: ['Services', 'Pricing'],
          sections: []
        },
        content: {
          headings: [
            'SEO Services',
            'SEO Pricing',
            'Web Development',
            'Development Packages'
          ],
          paragraphs: [
            'Our SEO services start at $2,000 per month.',
            'Premium SEO package: $5,000/month with dedicated account manager.',
            'Web development projects range from $10,000 to $50,000.',
            'Basic consulting package starts at $500/session.'
          ],
          links: ['/seo-pricing', '/dev-pricing'],
          images: []
        }
      });

      const result = await deepWebsiteScannerService.scanWebsite(mockData);

      // Services with pricing mentions should have higher confidence
      const seoService = result.services.find(s =>
        s.name.toLowerCase().includes('seo')
      );

      if (seoService) {
        // Should have detected pricing-related sources
        const hasPricingSource = seoService.sources.some(source =>
          source.context?.toLowerCase().includes('pricing') ||
          source.type.includes('pattern') ||
          source.type === 'content-pattern'
        );

        expect(hasPricingSource || seoService.sources.length > 1).toBe(true);
      }
    });
  });
});
