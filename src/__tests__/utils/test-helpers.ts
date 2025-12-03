/**
 * Test Helpers - Utilities for testing AI services
 *
 * Provides mock data generators and assertion helpers
 * Created: 2025-11-18
 */

import { expect } from 'vitest';
import type { WebsiteData } from '@/services/scraping/websiteScraper';
import type { EQScore } from '@/types/eq-calculator.types';

/**
 * Create mock scraped website data
 */
export function createMockScrapedData(overrides?: Partial<WebsiteData>): WebsiteData {
  return {
    url: 'https://example.com',
    html: '<html><body>Example content</body></html>',
    structure: {
      navigation: [
        'Services',
        'Products',
        'About Us',
        'Contact',
        'Pricing'
      ],
      sections: [
        'Our Services',
        'What We Do',
        'Consulting Packages'
      ]
    },
    content: {
      headings: [
        'Professional Consulting Services',
        'What We Offer',
        'Our Services',
        'Strategic Planning',
        'Business Analysis',
        'Growth Consulting'
      ],
      paragraphs: [
        'We help businesses achieve sustainable growth through data-driven strategies.',
        'Our services include strategic planning, business analysis, and growth consulting.',
        'We offer consulting packages for startups and established businesses.',
        'Pricing starts at $5,000 per month for our basic package.'
      ],
      links: ['/services', '/pricing'],
      images: []
    },
    metadata: {
      title: 'Example Business - Professional Services',
      description: 'We help businesses grow through strategic consulting',
      keywords: ['consulting', 'business', 'strategy']
    },
    design: {
      colors: ['#2563eb', '#7c3aed'],
      fonts: ['Inter', 'Roboto']
    },
    ...overrides
  };
}

/**
 * Create mock business context
 */
export function createMockBusinessContext() {
  return {
    businessName: 'Example Consulting',
    industry: 'Business Consulting',
    website: 'https://example.com',
    services: ['Strategic Planning', 'Business Analysis', 'Growth Consulting'],
    targetAudience: 'Small to medium-sized businesses'
  };
}

/**
 * Create mock testimonial data
 */
export function createMockTestimonials(): string[] {
  return [
    "As a marketing director at a fast-growing SaaS startup, I was drowning in data. Working with them saved me 15 hours per week on reporting!",
    "Our CEO was worried about scaling. The strategic planning service helped us grow from $500K to $2M in 18 months.",
    "I'm a solo entrepreneur who was working 70 hours a week. Their systems helped me cut that to 40 hours while doubling revenue.",
    "The finance team was frustrated with our manual processes. They automated everything and we saved $50K annually.",
    "As a director of operations, I needed to streamline workflows. Their consulting was worth every penny - we reduced operational costs by 30%."
  ];
}

/**
 * Create mock website data with rich testimonials
 */
export function createMockScrapedDataWithTestimonials(): WebsiteData {
  const testimonials = createMockTestimonials();

  return {
    ...createMockScrapedData(),
    content: {
      headings: [
        'Professional Consulting Services',
        'Client Success Stories',
        'What Our Customers Say'
      ],
      paragraphs: [
        'We help businesses achieve sustainable growth through data-driven strategies.',
        ...testimonials,
        'Join hundreds of satisfied clients who have transformed their businesses.'
      ],
      links: ['/services', '/testimonials'],
      images: []
    }
  };
}

/**
 * Assert EQ score structure is valid
 */
export function assertEQScoreValid(score: EQScore): void {
  // Check all required V6 fields exist
  expect(score).toHaveProperty('overall');
  expect(score).toHaveProperty('emotional');
  expect(score).toHaveProperty('rational');
  expect(score).toHaveProperty('confidence');
  expect(score).toHaveProperty('calculation_method');

  // Check types
  expect(typeof score.overall).toBe('number');
  expect(typeof score.emotional).toBe('number');
  expect(typeof score.rational).toBe('number');
  expect(typeof score.confidence).toBe('number');
  expect(typeof score.calculation_method).toBe('string');

  // Check ranges (0-100)
  expect(score.overall).toBeGreaterThanOrEqual(0);
  expect(score.overall).toBeLessThanOrEqual(100);
  expect(score.emotional).toBeGreaterThanOrEqual(0);
  expect(score.emotional).toBeLessThanOrEqual(100);
  expect(score.rational).toBeGreaterThanOrEqual(0);
  expect(score.rational).toBeLessThanOrEqual(100);
  expect(score.confidence).toBeGreaterThanOrEqual(0);
  expect(score.confidence).toBeLessThanOrEqual(100);

  // Check calculation method is valid
  const validMethods = [
    'specialty_based',
    'pattern_based',
    'content_only',
    'hybrid'
  ];
  expect(validMethods).toContain(score.calculation_method);
}

/**
 * Create mock AI API response
 */
export function createMockAIResponse(content: any, model: string = 'anthropic/claude-sonnet-4-5-20250929') {
  return {
    choices: [{
      message: {
        content: typeof content === 'string' ? content : JSON.stringify(content),
        role: 'assistant'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 500,
      total_tokens: 600
    },
    model
  };
}

/**
 * Wait for async operation (test helper)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert confidence score is within expected range
 */
export function assertConfidenceInRange(confidence: number, min: number = 0, max: number = 100): void {
  expect(confidence).toBeGreaterThanOrEqual(min);
  expect(confidence).toBeLessThanOrEqual(max);
  expect(typeof confidence).toBe('number');
  expect(confidence).not.toBeNaN();
}

/**
 * Create minimal scraped data (for testing sparse content)
 */
export function createMinimalScrapedData(): WebsiteData {
  return {
    url: 'https://minimal.com',
    html: '<html><body>We do business.</body></html>',
    structure: {
      navigation: ['Home'],
      sections: []
    },
    content: {
      headings: ['Welcome'],
      paragraphs: ['We do business.'],
      links: [],
      images: []
    },
    metadata: {
      title: 'Minimal Site',
      description: 'A very basic website',
      keywords: []
    },
    design: {
      colors: ['#000000'],
      fonts: ['Arial']
    }
  };
}
