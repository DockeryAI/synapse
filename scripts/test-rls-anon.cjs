#!/usr/bin/env node

/**
 * Test RLS policies as ANON user BEFORE applying to production
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('L Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('\n>ê Testing RLS Policies (ANON user)...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Read profiles
  console.log('Test 1: SELECT profiles...');
  const { data: profiles, error: readError } = await supabase
    .from('industry_profiles')
    .select('naics_code')
    .limit(1);

  if (readError) {
    console.log('   L FAILED:', readError.message);
    failed++;
  } else {
    console.log('    PASSED - Can read profiles');
    passed++;
  }

  // Test 2: Insert on-demand profile
  console.log('\nTest 2: INSERT on-demand profile...');
  const { error: insertError } = await supabase
    .from('industry_profiles')
    .insert({
      naics_code: 'TEST999',
      title: 'Test',
      profile_data: {},
      generated_on_demand: true,
      generated_at: new Date().toISOString()
    });

  if (insertError) {
    console.log('   L FAILED:', insertError.message);
    failed++;
  } else {
    console.log('    PASSED - Can insert on-demand');
    passed++;

    // Cleanup
    await supabase.from('industry_profiles').delete().eq('naics_code', 'TEST999');
  }

  // Test 3: Try non-on-demand insert (should fail)
  console.log('\nTest 3: INSERT non-on-demand (should block)...');
  const { error: blockError } = await supabase
    .from('industry_profiles')
    .insert({
      naics_code: 'TEST998',
      title: 'Test',
      profile_data: {},
      generated_on_demand: false
    });

  if (blockError) {
    console.log('    PASSED - Correctly blocked');
    passed++;
  } else {
    console.log('   L FAILED - Should have blocked this!');
    failed++;
    await supabase.from('industry_profiles').delete().eq('naics_code', 'TEST998');
  }

  console.log(`\n${'='.repeat(50)}`);
  if (failed === 0) {
    console.log(' ALL TESTS PASSED! Safe to apply policies.');
  } else {
    console.log(`L ${failed} TESTS FAILED! Do not apply yet.`);
  }
  console.log(`${'='.repeat(50)}\n`);
}

test();
