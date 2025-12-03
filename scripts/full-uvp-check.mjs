/**
 * Full UVP Data Flow Check
 * Tests every piece of data from marba_uvps through specialty_profiles
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo'
);

async function checkDB() {
  // Get brand
  const { data: brand } = await supabase.from('brands').select('id, name').limit(1).single();
  if (!brand) { console.log('No brand found'); return; }
  console.log('Brand:', brand.id, brand.name);

  // Get marba_uvps
  const { data: uvp } = await supabase.from('marba_uvps').select('*').eq('brand_id', brand.id).single();
  if (!uvp) { console.log('No UVP found'); return; }

  console.log('\n========================================');
  console.log('=== MARBA_UVPS (source of truth) ===');
  console.log('========================================');

  console.log('\n1. products_services:');
  console.log('   categories:', uvp.products_services?.categories?.length || 0);
  if (uvp.products_services?.categories?.[0]) {
    console.log('   first category:', uvp.products_services.categories[0].name);
    console.log('   first item:', uvp.products_services.categories[0].items?.[0]?.name);
  }

  console.log('\n2. target_customer:');
  console.log('   statement:', (uvp.target_customer?.statement || 'MISSING').substring(0, 80) + '...');
  console.log('   emotionalDrivers:', JSON.stringify(uvp.target_customer?.emotionalDrivers));
  console.log('   functionalDrivers:', JSON.stringify(uvp.target_customer?.functionalDrivers));
  console.log('   industry:', uvp.target_customer?.industry);
  console.log('   role:', uvp.target_customer?.role);

  console.log('\n3. transformation_goal:');
  console.log('   statement:', (uvp.transformation_goal?.statement || 'MISSING').substring(0, 80) + '...');
  console.log('   emotionalDrivers:', JSON.stringify(uvp.transformation_goal?.emotionalDrivers));
  console.log('   functionalDrivers:', JSON.stringify(uvp.transformation_goal?.functionalDrivers));
  console.log('   before:', (uvp.transformation_goal?.before || 'MISSING').substring(0, 60));
  console.log('   after:', (uvp.transformation_goal?.after || 'MISSING').substring(0, 60));
  console.log('   why:', (uvp.transformation_goal?.why || 'MISSING').substring(0, 60));

  console.log('\n4. unique_solution:');
  console.log('   statement:', (uvp.unique_solution?.statement || 'MISSING').substring(0, 80) + '...');
  console.log('   differentiators count:', uvp.unique_solution?.differentiators?.length || 0);
  if (uvp.unique_solution?.differentiators?.[0]) {
    const d = uvp.unique_solution.differentiators[0];
    console.log('   first differentiator:');
    console.log('     - id:', d.id);
    console.log('     - statement:', (d.statement || 'MISSING').substring(0, 60));
    console.log('     - evidence:', (d.evidence || 'MISSING').substring(0, 60));
    console.log('     - strengthScore:', d.strengthScore);
  }

  console.log('\n5. key_benefit:');
  console.log('   statement:', (uvp.key_benefit?.statement || 'MISSING').substring(0, 80) + '...');
  console.log('   metrics count:', uvp.key_benefit?.metrics?.length || 0);
  if (uvp.key_benefit?.metrics?.[0]) {
    console.log('   first metric:', JSON.stringify(uvp.key_benefit.metrics[0]));
  }
  console.log('   outcomeType:', uvp.key_benefit?.outcomeType);

  console.log('\n6. synthesized statements:');
  console.log('   value_proposition:', (uvp.value_proposition_statement || 'MISSING').substring(0, 80) + '...');
  console.log('   why_statement:', (uvp.why_statement || 'MISSING').substring(0, 60));
  console.log('   what_statement:', (uvp.what_statement || 'MISSING').substring(0, 60));
  console.log('   how_statement:', (uvp.how_statement || 'MISSING').substring(0, 60));

  // Get specialty_profiles
  const { data: profile, error: profErr } = await supabase.from('specialty_profiles').select('*').eq('brand_id', brand.id).single();
  if (profErr || !profile) {
    console.log('\n❌ No specialty profile found:', profErr?.message);
    return;
  }

  console.log('\n========================================');
  console.log('=== SPECIALTY_PROFILES (triggers read) ===');
  console.log('========================================');

  console.log('\nprofile_data.full_uvp:');
  const fullUvp = profile.profile_data?.full_uvp;
  if (!fullUvp) {
    console.log('   ❌ full_uvp is MISSING from profile_data');
  } else {
    console.log('   target_customer_statement:', (fullUvp.target_customer_statement || 'MISSING').substring(0, 60));
    console.log('   emotional_drivers:', JSON.stringify(fullUvp.emotional_drivers));
    console.log('   functional_drivers:', JSON.stringify(fullUvp.functional_drivers));
    console.log('   products_services count:', fullUvp.products_services?.length || 0);
    console.log('   differentiators:', JSON.stringify(fullUvp.differentiators));
    console.log('   key_benefit_statement:', (fullUvp.key_benefit_statement || 'MISSING').substring(0, 60));
    console.log('   transformation_before:', (fullUvp.transformation_before || 'MISSING').substring(0, 60));
    console.log('   transformation_after:', (fullUvp.transformation_after || 'MISSING').substring(0, 60));
  }

  console.log('\nTop-level trigger arrays:');
  console.log('   common_pain_points:', JSON.stringify(profile.common_pain_points));
  console.log('   common_buying_triggers:', JSON.stringify(profile.common_buying_triggers));
  console.log('   urgency_drivers:', JSON.stringify(profile.urgency_drivers));
  console.log('   customer_triggers count:', profile.customer_triggers?.length || 0);

  // DIAGNOSIS
  console.log('\n========================================');
  console.log('=== DIAGNOSIS ===');
  console.log('========================================');

  const issues = [];

  // Check marba_uvps
  if (!uvp.target_customer?.emotionalDrivers?.length) {
    issues.push('❌ marba_uvps.target_customer.emotionalDrivers is empty');
  }
  if (!uvp.target_customer?.functionalDrivers?.length) {
    issues.push('❌ marba_uvps.target_customer.functionalDrivers is empty');
  }
  if (!uvp.transformation_goal?.emotionalDrivers?.length) {
    issues.push('❌ marba_uvps.transformation_goal.emotionalDrivers is empty');
  }
  if (!uvp.transformation_goal?.functionalDrivers?.length) {
    issues.push('❌ marba_uvps.transformation_goal.functionalDrivers is empty');
  }
  if (!uvp.unique_solution?.differentiators?.length) {
    issues.push('❌ marba_uvps.unique_solution.differentiators is empty');
  } else {
    const firstDiff = uvp.unique_solution.differentiators[0];
    if (!firstDiff.statement) {
      issues.push('❌ marba_uvps.unique_solution.differentiators[0].statement is missing');
    }
  }

  // Check specialty_profiles
  if (!fullUvp?.emotional_drivers?.length) {
    issues.push('❌ specialty_profiles.full_uvp.emotional_drivers is empty');
  }
  if (!fullUvp?.functional_drivers?.length) {
    issues.push('❌ specialty_profiles.full_uvp.functional_drivers is empty');
  }
  if (!fullUvp?.differentiators?.length) {
    issues.push('❌ specialty_profiles.full_uvp.differentiators is empty');
  }

  if (issues.length === 0) {
    console.log('✅ All UVP data looks complete!');
  } else {
    issues.forEach(i => console.log(i));
  }

  console.log('\n=== END ===');
}

checkDB().catch(e => console.error('Error:', e.message));
