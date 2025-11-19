/**
 * Customer Extractor Service - Usage Example
 *
 * Demonstrates how to use the extractTargetCustomer function
 *
 * Created: 2025-11-18
 */

import { extractTargetCustomer } from './customer-extractor.service';

/**
 * Example 1: Extract from testimonials
 */
export async function exampleWithTestimonials() {
  const testimonials = [
    "As a marketing director at a fast-growing SaaS startup, I was drowning in data. I needed a solution that could save me 15 hours per week on reporting.",
    "I'm the CEO of a 50-person software company. We were struggling to scale our customer support without hiring more people.",
    "Working at a B2B tech company with 100 employees, I needed better analytics to prove ROI to our executive team."
  ];

  const result = await extractTargetCustomer(
    ['Website content about SaaS analytics platform'],
    testimonials,
    [],
    'Acme Analytics'
  );

  console.log('Extracted Profiles:', result.profiles.length);
  result.profiles.forEach(profile => {
    console.log('\nProfile:', profile.statement);
    console.log('Industry:', profile.industry || 'Not specified');
    console.log('Company Size:', profile.companySize || 'Not specified');
    console.log('Role:', profile.role || 'Not specified');
    console.log('Confidence:', `${profile.confidence?.overall}%`);
    console.log('Evidence Quotes:', profile.evidenceQuotes?.length);
  });
}

/**
 * Example 2: Extract from case studies
 */
export async function exampleWithCaseStudies() {
  const caseStudies = [
    `Case Study: How a Series A Startup Scaled Support

    Company: TechCorp (30 employees, San Francisco)
    Role: VP of Customer Success
    Challenge: Support team was overwhelmed with 50+ tickets daily
    Result: Reduced response time by 60% and improved CSAT to 95%`,

    `Case Study: Enterprise Analytics Migration

    Company: BigCo (5000+ employees, Fortune 500)
    Role: Director of Data Analytics
    Challenge: Legacy systems couldn't handle modern analytics needs
    Result: 10x faster query performance, saved $500K annually`
  ];

  const result = await extractTargetCustomer(
    ['Enterprise analytics platform for modern data teams'],
    [],
    caseStudies,
    'DataFlow'
  );

  console.log('\nCase Study Extraction:');
  console.log('Profiles found:', result.profiles.length);
  console.log('Overall confidence:', `${result.confidence.overall}%`);
  console.log('Data quality:', result.confidence.reasoning);
}

/**
 * Example 3: Handle cases with no clear customer evidence
 */
export async function exampleWithNoEvidence() {
  const result = await extractTargetCustomer(
    ['We build amazing software that everyone can use!'],
    [],
    [],
    'GenericCo'
  );

  console.log('\nNo Evidence Example:');
  console.log('Profiles found:', result.profiles.length); // Should be 0
  console.log('Confidence:', `${result.confidence.overall}%`); // Should be 0
  console.log('Reasoning:', result.confidence.reasoning);
}

/**
 * Example 4: Multiple distinct customer segments
 */
export async function exampleWithMultipleSegments() {
  const testimonials = [
    // Segment 1: Small business owners
    "As a small bakery owner with 5 employees, this helped me manage inventory",
    "I run a family restaurant and needed simple scheduling software",

    // Segment 2: Enterprise IT leaders
    "As CTO of a 2000-person company, we needed enterprise-grade security",
    "I'm VP of IT at a Fortune 500 and required multi-tenant architecture"
  ];

  const result = await extractTargetCustomer(
    ['Business management software for all sizes'],
    testimonials,
    [],
    'BizSoft'
  );

  console.log('\nMultiple Segments:');
  result.profiles.forEach((profile, idx) => {
    console.log(`\nSegment ${idx + 1}: ${profile.statement}`);
    console.log(`Company Size: ${profile.companySize}`);
    console.log(`Evidence: ${profile.evidenceQuotes?.length} quotes`);
  });
}

/**
 * Example 5: Working with the result
 */
export async function exampleUsingResult() {
  const result = await extractTargetCustomer(
    ['SaaS platform for marketing teams'],
    [
      'As CMO of a mid-sized B2B company...',
      'Marketing director at a tech startup...'
    ],
    [],
    'MarketingHub'
  );

  // Check if extraction was successful
  if (result.profiles.length === 0) {
    console.log('⚠️  No clear target customers found');
    console.log('Reason:', result.confidence.reasoning);
    return;
  }

  // Get the primary profile (first one)
  const primaryProfile = result.profiles[0];

  // Check confidence level
  if (primaryProfile.confidence && primaryProfile.confidence.overall > 80) {
    console.log('✅ High confidence profile found');
  } else if (primaryProfile.confidence && primaryProfile.confidence.overall > 60) {
    console.log('⚠️  Medium confidence - may need manual review');
  } else {
    console.log('❌ Low confidence - needs manual input');
  }

  // Build a customer statement for UVP
  const customerStatement = [
    primaryProfile.statement,
    primaryProfile.industry && `in the ${primaryProfile.industry} industry`,
    primaryProfile.companySize && `with ${primaryProfile.companySize}`
  ].filter(Boolean).join(' ');

  console.log('\nTarget Customer Statement:');
  console.log(customerStatement);

  // Show supporting evidence
  console.log('\nSupporting Evidence:');
  primaryProfile.evidenceQuotes?.forEach((quote, idx) => {
    console.log(`${idx + 1}. "${quote}"`);
  });

  // Show data sources
  console.log('\nData Sources:');
  result.sources.forEach(source => {
    console.log(`- ${source.name} (${source.reliability}% reliability)`);
  });
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    console.log('=== Customer Extractor Examples ===\n');

    await exampleWithTestimonials();
    await exampleWithCaseStudies();
    await exampleWithNoEvidence();
    await exampleWithMultipleSegments();
    await exampleUsingResult();

  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run examples:
// runAllExamples();
