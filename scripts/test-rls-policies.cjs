#!/usr/bin/env node

/**
 * Quick test script to verify RLS policies are working
 * Tests database access to cache tables without running full Synapse
 */

const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRLSPolicies() {
  console.log('🔍 Testing RLS Policies...\n');

  let allPassed = true;

  // Test 1: intelligence_cache
  console.log('1. Testing intelligence_cache...');
  try {
    const { data, error } = await supabase
      .from('intelligence_cache')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301') {
        console.log('   ❌ FAILED - 406 Not Acceptable (RLS policy missing)');
        console.log('   → Run the SQL fix in Supabase SQL Editor');
        allPassed = false;
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    } else {
      console.log('   ✅ PASSED - Can read from intelligence_cache');
    }
  } catch (err) {
    console.log(`   ❌ FAILED - ${err.message}`);
    allPassed = false;
  }

  // Test 2: industry_profiles
  console.log('\n2. Testing industry_profiles...');
  try {
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301') {
        console.log('   ❌ FAILED - 406 Not Acceptable (RLS policy missing)');
        console.log('   → Run the SQL fix in Supabase SQL Editor');
        allPassed = false;
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    } else {
      console.log('   ✅ PASSED - Can read from industry_profiles');
    }
  } catch (err) {
    console.log(`   ❌ FAILED - ${err.message}`);
    allPassed = false;
  }

  // Test 3: location_detection_cache
  console.log('\n3. Testing location_detection_cache...');
  try {
    const { data, error } = await supabase
      .from('location_detection_cache')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301') {
        console.log('   ❌ FAILED - 406 Not Acceptable (RLS policy missing)');
        console.log('   → Run the SQL fix in Supabase SQL Editor');
        allPassed = false;
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    } else {
      console.log('   ✅ PASSED - Can read from location_detection_cache');
    }
  } catch (err) {
    console.log(`   ❌ FAILED - ${err.message}`);
    allPassed = false;
  }

  // Test 4: Insert test (optional)
  console.log('\n4. Testing insert permission (intelligence_cache)...');
  try {
    const testData = {
      cache_key: `test_${Date.now()}`,
      data: { test: true },
      expires_at: new Date(Date.now() + 3600000).toISOString()
    };

    const { data, error } = await supabase
      .from('intelligence_cache')
      .insert(testData)
      .select();

    if (error) {
      if (error.code === 'PGRST301') {
        console.log('   ❌ FAILED - 406 Not Acceptable (RLS policy missing)');
        console.log('   → Run the SQL fix in Supabase SQL Editor');
        allPassed = false;
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    } else {
      console.log('   ✅ PASSED - Can insert into intelligence_cache');

      // Clean up test data
      if (data && data[0]) {
        await supabase
          .from('intelligence_cache')
          .delete()
          .eq('cache_key', testData.cache_key);
      }
    }
  } catch (err) {
    console.log(`   ❌ FAILED - ${err.message}`);
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - RLS policies are working correctly!');
    console.log('   You can now run the full Synapse discovery.');
  } else {
    console.log('❌ SOME TESTS FAILED - RLS policies need to be fixed');
    console.log('   1. Copy the SQL from clipboard');
    console.log('   2. Go to Supabase Dashboard → SQL Editor');
    console.log('   3. Paste and run the SQL');
    console.log('   4. Run this test again to verify');
  }
  console.log('='.repeat(50) + '\n');
}

testRLSPolicies().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
