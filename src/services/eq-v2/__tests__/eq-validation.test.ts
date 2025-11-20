/**
 * EQ Calculator v2.0 Validation Tests
 *
 * Tests against known benchmarks to ensure accuracy
 *
 * Expected Results:
 * - Classic cars: 70-80 (not 29 like old calculator)
 * - Enterprise software: 15-25
 * - Luxury goods: 70-85
 * - Professional services: 30-40
 *
 * Created: 2025-11-19
 */

import { describe, test, expect } from 'vitest';
import { eqIntegration } from '../eq-integration.service';
import type { EQValidationCase } from '@/types/eq-calculator.types';

describe('EQ Calculator v2.0 - Validation Tests', () => {
  const validationCases: EQValidationCase[] = [
    {
      business_name: 'Phoenix Insurance (Classic Cars)',
      specialty: 'classic cars',
      expected_eq: 75,
      expected_range: { min: 70, max: 80 },
      rationale: 'Passion product with high emotional attachment, community, heritage value'
    },
    {
      business_name: 'Vintage Motorcycle Shop',
      specialty: 'vintage motorcycles',
      expected_eq: 73,
      expected_range: { min: 68, max: 78 },
      rationale: 'Passion product, collector community, restoration craft'
    },
    {
      business_name: 'Enterprise Software Corp',
      specialty: 'enterprise software',
      expected_eq: 25,
      expected_range: { min: 20, max: 30 },
      rationale: 'B2B, ROI-driven, rational decision making, long sales cycles'
    },
    {
      business_name: 'Luxury Watch Dealer',
      specialty: 'luxury watches',
      expected_eq: 72,
      expected_range: { min: 68, max: 76 },
      rationale: 'High-end collectibles, status symbol, emotional purchase'
    },
    {
      business_name: 'Tax Preparation Service',
      specialty: 'tax preparation',
      expected_eq: 18,
      expected_range: { min: 15, max: 25 },
      rationale: 'Commodity service, compliance-driven, purely transactional'
    },
    {
      business_name: 'Wedding Photography Studio',
      specialty: 'wedding photography',
      expected_eq: 75,
      expected_range: { min: 70, max: 80 },
      rationale: 'Once-in-lifetime emotional purchase, memories, storytelling'
    },
    {
      business_name: 'Marketing Consulting Agency',
      specialty: 'marketing agency',
      expected_eq: 45,
      expected_range: { min: 40, max: 50 },
      rationale: 'Professional services, balanced emotional/rational, relationship-based'
    },
    {
      business_name: 'SaaS Analytics Platform',
      specialty: 'saas',
      expected_eq: 30,
      expected_range: { min: 25, max: 35 },
      rationale: 'B2B software, metrics-focused, ROI justification needed'
    },
    {
      business_name: 'Boutique Fitness Studio',
      specialty: 'fitness coaching',
      expected_eq: 65,
      expected_range: { min: 60, max: 70 },
      rationale: 'Personal transformation, community, lifestyle change'
    },
    {
      business_name: 'Accounting Firm',
      specialty: 'accounting',
      expected_eq: 35,
      expected_range: { min: 30, max: 40 },
      rationale: 'Professional services, compliance-focused, relationship + rational'
    }
  ];

  test.each(validationCases)(
    'should calculate correct EQ for $business_name',
    async (testCase) => {
      // Generate mock content with specialty keywords
      const mockContent = generateMockContent(testCase.specialty);

      const result = await eqIntegration.calculateEQ({
        businessName: testCase.business_name,
        websiteContent: [mockContent],
        specialty: testCase.specialty
      });

      const calculatedEQ = result.eq_score.overall;

      console.log(`\n[Validation] ${testCase.business_name}`);
      console.log(`  Expected: ${testCase.expected_eq} (${testCase.expected_range.min}-${testCase.expected_range.max})`);
      console.log(`  Calculated: ${calculatedEQ}`);
      console.log(`  Method: ${result.eq_score.calculation_method}`);
      console.log(`  Confidence: ${result.eq_score.confidence}%`);

      // Check if within expected range
      expect(calculatedEQ).toBeGreaterThanOrEqual(testCase.expected_range.min);
      expect(calculatedEQ).toBeLessThanOrEqual(testCase.expected_range.max);

      // Check that specialty-based calculation was used when available
      if (testCase.specialty) {
        expect(['specialty_based', 'hybrid']).toContain(result.eq_score.calculation_method);
      }
    },
    10000  // 10 second timeout
  );

  test('Phoenix Insurance regression test - should NOT return 29', async () => {
    const mockContent = generateMockContent('classic cars');

    const result = await eqIntegration.calculateEQ({
      businessName: 'Phoenix Insurance',
      websiteContent: [mockContent],
      specialty: 'classic cars'
    });

    const calculatedEQ = result.eq_score.overall;

    console.log(`\n[Regression] Phoenix Insurance (Classic Cars)`);
    console.log(`  OLD Calculator: 29 (WRONG)`);
    console.log(`  NEW Calculator: ${calculatedEQ}`);
    console.log(`  Expected Range: 70-80`);

    // Should be MUCH higher than old calculator's 29
    expect(calculatedEQ).toBeGreaterThan(60);
    expect(calculatedEQ).toBeLessThanOrEqual(85);
  });

  test('Platform adjustments should work correctly', async () => {
    const mockContent = generateMockContent('marketing agency');

    // LinkedIn should reduce EQ by 20
    const linkedInEQ = await eqIntegration.getPlatformAdjustedEQ({
      businessName: 'Marketing Agency',
      websiteContent: [mockContent],
      specialty: 'marketing agency',
      platform: 'linkedin'
    });

    // Instagram should increase EQ by 15
    const instagramEQ = await eqIntegration.getPlatformAdjustedEQ({
      businessName: 'Marketing Agency',
      websiteContent: [mockContent],
      specialty: 'marketing agency',
      platform: 'instagram'
    });

    console.log(`\n[Platform Adjustment]`);
    console.log(`  LinkedIn EQ: ${linkedInEQ.overall}`);
    console.log(`  Instagram EQ: ${instagramEQ.overall}`);

    // Instagram should be higher than LinkedIn
    expect(instagramEQ.overall).toBeGreaterThan(linkedInEQ.overall);
    expect(instagramEQ.overall - linkedInEQ.overall).toBeCloseTo(35, 0);  // 15 - (-20) = 35
  });

  test('Seasonal adjustments should work correctly', async () => {
    const mockContent = generateMockContent('retail');

    const baseEQ = await eqIntegration.getEQScore({
      businessName: 'Retail Shop',
      websiteContent: [mockContent],
      industry: 'retail'
    });

    const holidayEQ = await eqIntegration.getSeasonalAdjustedEQ({
      businessName: 'Retail Shop',
      websiteContent: [mockContent],
      industry: 'retail',
      season: 'holiday'
    });

    console.log(`\n[Seasonal Adjustment]`);
    console.log(`  Base EQ: ${baseEQ.overall}`);
    console.log(`  Holiday EQ: ${holidayEQ.overall}`);

    // Holiday should be +15
    expect(holidayEQ.overall).toBeCloseTo(baseEQ.overall + 15, 0);
  });

  test('Tone guidance should match EQ levels', () => {
    const highEQGuidance = eqIntegration.getToneGuidance(75);
    expect(highEQGuidance.primary_tone).toBe('emotional');
    expect(highEQGuidance.messaging_focus).toContain('transformation');

    const mediumEQGuidance = eqIntegration.getToneGuidance(50);
    expect(mediumEQGuidance.primary_tone).toBe('balanced');

    const lowEQGuidance = eqIntegration.getToneGuidance(25);
    expect(lowEQGuidance.primary_tone).toBe('rational');
    expect(lowEQGuidance.messaging_focus).toContain('ROI');
  });
});

/**
 * Generate mock website content with specialty-specific keywords
 */
function generateMockContent(specialty: string): string {
  const specialtyContent: Record<string, string> = {
    'classic cars': `
      Welcome to our classic car insurance agency. We specialize in protecting rare, vintage, and collectible automobiles.
      Our passion for automotive heritage drives everything we do. Each classic car tells a story, and we understand
      the emotional connection collectors have with their prized possessions. From numbers-matching restorations to
      concours-ready showpieces, we offer agreed value coverage that protects your investment. Join our community of
      enthusiasts who trust us with their automotive treasures. We've been serving the collector car community for over
      25 years, and understand the unique needs of vintage vehicle owners. Whether it's a pre-war classic, muscle car,
      or exotic sports car, we craft custom coverage that gives you peace of mind.
    `,
    'vintage motorcycles': `
      Vintage motorcycle restoration and insurance specialists. We're passionate about preserving motorcycling heritage.
      Our community of collectors and restorers share a deep appreciation for classic bikes. From café racers to
      vintage cruisers, we provide specialized coverage for these mechanical works of art. Agreed value policies protect
      your restoration investment.
    `,
    'enterprise software': `
      Enterprise software solutions that increase efficiency by 47% and reduce operational costs by 30%. Our cloud-based
      platform delivers measurable ROI within 6 months. Automated workflows, real-time analytics, and compliance management
      tools help Fortune 500 companies scale operations. Schedule a demo to calculate your potential savings. ISO 27001
      certified, 99.99% uptime SLA, enterprise-grade security.
    `,
    'luxury watches': `
      Luxury timepiece collection featuring rare watches from prestigious brands. Each piece represents craftsmanship,
      heritage, and timeless elegance. Our curated selection appeals to discerning collectors who appreciate horological
      artistry. From vintage Rolex to limited edition Patek Philippe, we offer investment-grade timepieces with provenance
      and authenticity guaranteed.
    `,
    'tax preparation': `
      Professional tax preparation services. Fast, accurate, affordable. Get your maximum refund. IRS-certified preparers.
      Electronic filing available. Schedule your appointment today. Competitive pricing, quick turnaround. Business and
      personal returns.
    `,
    'wedding photography': `
      Wedding photography that captures the magic of your special day. We tell your love story through timeless images
      that you'll treasure forever. From emotional first looks to joyful celebrations, we're there for every precious moment.
      Your wedding day is once in a lifetime - trust us to preserve the memories beautifully.
    `,
    'marketing agency': `
      Full-service marketing agency helping businesses grow through strategic campaigns. We combine creative storytelling
      with data-driven insights to deliver measurable results. Our team of specialists handles everything from brand
      strategy to digital marketing. Partner with us to elevate your brand and connect with your audience.
    `,
    'saas': `
      SaaS analytics platform that helps teams make data-driven decisions. Track key metrics, automate reporting,
      and identify growth opportunities. Increase productivity by 40%, reduce data analysis time by 60%. Free trial
      available. Integration with 50+ tools. Enterprise security and compliance.
    `,
    'fitness coaching': `
      Transform your life with personalized fitness coaching. Join our community of dedicated members achieving their
      health goals. We believe in sustainable lifestyle changes, not quick fixes. Our certified trainers provide the
      support and accountability you need to become your best self. Feel stronger, more confident, and energized.
    `,
    'accounting': `
      Professional accounting and bookkeeping services for small businesses. We handle your financials so you can focus
      on growing your business. QuickBooks certified, tax planning, financial statements, payroll services. Reliable,
      accurate, responsive. Building long-term relationships with our clients.
    `,
    'retail': `
      Discover unique products curated for style and quality. Shopping experience that feels personal. Browse our
      collection of carefully selected items. Free shipping on orders over $50. New arrivals weekly.
    `
  };

  return specialtyContent[specialty] || `
    Professional ${specialty} services. Quality solutions for your needs.
    Trusted by customers. Contact us for more information.
  `;
}
