#!/usr/bin/env node

/**
 * Test if the FRONTEND (anon key) can read the saved profile
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('\n🔍 Testing frontend read access...\n');

  // Test 1: Try to read the school psychologist profile
  console.log('Test 1: Read NAICS 621330 (School Psychologist)...');
  const { data, error } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', '621330')
    .single();

  if (error) {
    console.log('   ❌ FAILED');
    console.log('   Error:', error.code, error.message);
    console.log('   This is why it\'s not finding the profile!');
  } else if (!data) {
    console.log('   ❌ No data returned (profile doesn\'t exist)');
  } else {
    console.log('   ✅ SUCCESS - Profile found!');
    console.log('   NAICS:', data.naics_code);
    console.log('   Title:', data.title);
    console.log('   Has profile_data:', !!data.profile_data);
    console.log('   Generated on-demand:', data.generated_on_demand);
  }
}

test();
