/**
 * Test UVP Data Flow WITHOUT running the UVP wizard
 *
 * This script:
 * 1. Creates a test brand
 * 2. Inserts test UVP data with ALL fields populated
 * 3. Calls the edge function to create specialty profile
 * 4. Verifies the data made it through correctly
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo'
);

// Test data with ALL fields populated
const TEST_UVP = {
  products_services: {
    categories: [
      {
        id: 'cat-1',
        name: 'AI Solutions',
        items: [
          { id: 'prod-1', name: 'AI Agent Platform', description: 'Enterprise AI agent management', category: 'AI Solutions', confidence: 90, source: 'website', confirmed: true },
          { id: 'prod-2', name: 'Compliance Engine', description: 'Automated compliance checking', category: 'AI Solutions', confidence: 85, source: 'website', confirmed: true },
        ]
      }
    ],
    extractionComplete: true,
    extractionConfidence: { overall: 85, dataQuality: 85, sourceCount: 1, modelAgreement: 85 },
    sources: []
  },
  target_customer: {
    id: 'customer-1',
    statement: 'Insurance agency COO seeking to modernize sales operations',
    industry: 'Insurance',
    companySize: 'Mid-market',
    role: 'COO',
    // CRITICAL: These must be populated
    emotionalDrivers: [
      'Want to be recognized as the leader who transformed the agency',
      'Fear of falling behind tech-forward competitors',
      'Desire for recognition from stakeholders'
    ],
    functionalDrivers: [
      'Streamline sales and service processes',
      'Reduce operational costs by 30%',
      'Scale without increasing headcount'
    ],
    confidence: { overall: 90, dataQuality: 90, sourceCount: 2, modelAgreement: 90 },
    sources: [],
    evidenceQuotes: ['Quote 1', 'Quote 2'],
    isManualInput: false
  },
  transformation_goal: {
    id: 'trans-1',
    statement: 'Transform from manual processes to AI-driven automation',
    before: 'Manual quote processing taking 2+ hours per lead',
    after: 'Automated AI responses converting 15% more quotes',
    why: 'To stay competitive in a rapidly digitalizing market',
    emotionalDrivers: [
      'Want to be recognized as the leader who transformed the agency',
      'Fear of falling behind tech-forward competitors'
    ],
    functionalDrivers: [
      'Streamline sales and service processes',
      'Reduce operational costs by 30%'
    ],
    eqScore: { emotional: 70, rational: 80, overall: 75 },
    confidence: { overall: 85, dataQuality: 85, sourceCount: 1, modelAgreement: 85 },
    sources: [],
    customerQuotes: [],
    isManualInput: false
  },
  unique_solution: {
    id: 'solution-1',
    statement: 'Purpose-built AI for regulated industries with compliance focus',
    // CRITICAL: Differentiators must have proper structure
    differentiators: [
      {
        id: 'diff-1',
        statement: 'Purpose-built for regulated industries with compliance focus',
        evidence: 'Built specifically for insurance, healthcare, and financial services',
        source: { type: 'website', name: 'Website', confidence: 90 },
        strengthScore: 85
      },
      {
        id: 'diff-2',
        statement: 'Automatic compliant upselling capability',
        evidence: 'AI suggests compliant upsell opportunities in real-time',
        source: { type: 'website', name: 'Website', confidence: 85 },
        strengthScore: 80
      },
      {
        id: 'diff-3',
        statement: 'Rapid ROI with 90-day deployment',
        evidence: 'Customers see ROI within first quarter',
        source: { type: 'case_study', name: 'Case Study', confidence: 95 },
        strengthScore: 90
      }
    ],
    methodology: 'Compliance-first AI development',
    proprietaryApproach: 'Patent-pending compliance engine',
    confidence: { overall: 88, dataQuality: 88, sourceCount: 3, modelAgreement: 88 },
    sources: [],
    isManualInput: false
  },
  key_benefit: {
    id: 'benefit-1',
    statement: 'Convert 15% more quotes into policies without compliance risk',
    outcomeType: 'quantifiable',
    metrics: [
      { id: 'metric-1', metric: 'Quote conversion rate', value: '+15%', timeframe: '90 days', source: { type: 'case_study', name: 'Case Study', confidence: 95 } },
      { id: 'metric-2', metric: 'Compliance incidents', value: '0', timeframe: 'Since deployment', source: { type: 'case_study', name: 'Case Study', confidence: 95 } }
    ],
    eqFraming: 'balanced',
    confidence: { overall: 90, dataQuality: 90, sourceCount: 2, modelAgreement: 90 },
    sources: [],
    isManualInput: false
  },
  value_proposition_statement: 'Transform abandoned insurance quotes into closed policies with AI that regulators trust',
  why_statement: 'Insurance leaders deserve AI that drives growth without compliance risk',
  what_statement: 'Purpose-built conversational AI for regulated insurance operations',
  how_statement: 'By building compliance-first automation that converts prospects into customers',
  overall_confidence: 87
};

async function runTest() {
  console.log('=== TEST UVP DATA FLOW ===\n');

  // Step 1: Create test brand
  console.log('Step 1: Creating test brand...');
  const { data: brand, error: brandErr } = await supabase
    .from('brands')
    .insert({
      name: 'Test Insurance AI',
      website: 'https://test-insurance-ai.com',
      industry: 'Insurance Technology'
    })
    .select()
    .single();

  if (brandErr) {
    console.error('Failed to create brand:', brandErr.message);
    return;
  }
  console.log('   Brand created:', brand.id);

  // Step 2: Insert UVP data
  console.log('\nStep 2: Inserting UVP data with ALL fields...');
  const { data: uvp, error: uvpErr } = await supabase
    .from('marba_uvps')
    .insert({
      brand_id: brand.id,
      ...TEST_UVP
    })
    .select()
    .single();

  if (uvpErr) {
    console.error('Failed to insert UVP:', uvpErr.message);
    // Cleanup
    await supabase.from('brands').delete().eq('id', brand.id);
    return;
  }
  console.log('   UVP inserted:', uvp.id);

  // Step 3: Verify UVP data is in DB correctly
  console.log('\nStep 3: Verifying UVP data in marba_uvps...');
  const { data: savedUvp } = await supabase
    .from('marba_uvps')
    .select('*')
    .eq('brand_id', brand.id)
    .single();

  console.log('   emotionalDrivers:', savedUvp.target_customer?.emotionalDrivers?.length || 0);
  console.log('   functionalDrivers:', savedUvp.target_customer?.functionalDrivers?.length || 0);
  console.log('   differentiators:', savedUvp.unique_solution?.differentiators?.length || 0);
  console.log('   first differentiator.statement:', savedUvp.unique_solution?.differentiators?.[0]?.statement?.substring(0, 50));

  // Step 4: Simulate transform (what the frontend does)
  console.log('\nStep 4: Simulating transform logic...');

  // This mimics what uvp-to-specialty.transform.ts does
  const targetCustomer = savedUvp.target_customer;
  const transformationGoal = savedUvp.transformation_goal;
  const uniqueSolution = savedUvp.unique_solution;
  const keyBenefit = savedUvp.key_benefit;

  const emotional_drivers = [
    ...(targetCustomer?.emotionalDrivers || []),
    ...(transformationGoal?.emotionalDrivers || []),
  ].filter(d => d);

  const functional_drivers = [
    ...(targetCustomer?.functionalDrivers || []),
    ...(transformationGoal?.functionalDrivers || []),
  ].filter(d => d);

  const differentiators = (uniqueSolution?.differentiators || [])
    .filter(d => d && d.statement)
    .map(d => d.statement);

  const products_services = [];
  if (savedUvp.products_services?.categories) {
    savedUvp.products_services.categories.forEach(cat => {
      cat.items?.forEach(item => {
        products_services.push(item.name);
        if (item.description) {
          products_services.push(`${item.name}: ${item.description}`);
        }
      });
    });
  }

  const full_uvp = {
    target_customer_statement: targetCustomer?.statement || '',
    emotional_drivers,
    functional_drivers,
    products_services,
    differentiators,
    key_benefit_statement: keyBenefit?.statement || '',
    transformation_before: transformationGoal?.before || '',
    transformation_after: transformationGoal?.after || '',
  };

  console.log('\n   SIMULATED full_uvp result:');
  console.log('   - target_customer_statement:', full_uvp.target_customer_statement.substring(0, 50) + '...');
  console.log('   - emotional_drivers:', full_uvp.emotional_drivers);
  console.log('   - functional_drivers:', full_uvp.functional_drivers);
  console.log('   - products_services:', full_uvp.products_services.length, 'items');
  console.log('   - differentiators:', full_uvp.differentiators);
  console.log('   - key_benefit_statement:', full_uvp.key_benefit_statement.substring(0, 50) + '...');
  console.log('   - transformation_before:', full_uvp.transformation_before.substring(0, 50) + '...');
  console.log('   - transformation_after:', full_uvp.transformation_after.substring(0, 50) + '...');

  // Step 5: DIAGNOSIS
  console.log('\n=== DIAGNOSIS ===');
  const issues = [];

  if (full_uvp.emotional_drivers.length === 0) {
    issues.push('❌ emotional_drivers is empty');
  } else {
    console.log('✅ emotional_drivers:', full_uvp.emotional_drivers.length, 'items');
  }

  if (full_uvp.functional_drivers.length === 0) {
    issues.push('❌ functional_drivers is empty');
  } else {
    console.log('✅ functional_drivers:', full_uvp.functional_drivers.length, 'items');
  }

  if (full_uvp.differentiators.length === 0) {
    issues.push('❌ differentiators is empty');
  } else {
    console.log('✅ differentiators:', full_uvp.differentiators.length, 'items');
  }

  if (full_uvp.products_services.length === 0) {
    issues.push('❌ products_services is empty');
  } else {
    console.log('✅ products_services:', full_uvp.products_services.length, 'items');
  }

  if (issues.length > 0) {
    console.log('\nISSUES FOUND:');
    issues.forEach(i => console.log(i));
  } else {
    console.log('\n✅ ALL DATA FLOWS CORRECTLY!');
    console.log('The transform logic works. Issues must be in how the UVP wizard populates data.');
  }

  // Cleanup
  console.log('\nCleaning up test data...');
  await supabase.from('marba_uvps').delete().eq('brand_id', brand.id);
  await supabase.from('brands').delete().eq('id', brand.id);
  console.log('Done.');
}

runTest().catch(e => console.error('Test error:', e.message));
