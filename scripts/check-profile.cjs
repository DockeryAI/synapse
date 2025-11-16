#!/usr/bin/env node

/**
 * Quick script to check if a profile exists in the database
 * Usage: node scripts/check-profile.cjs 621330
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile(naicsCode) {
  console.log(`\n🔍 Checking for profile: NAICS ${naicsCode}...\n`);

  try {
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .eq('naics_code', naicsCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Profile NOT found in database');
        console.log(`   NAICS ${naicsCode} does not exist\n`);
        return;
      }

      console.error('❌ Database error:');
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);

      if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
        console.error('\n⚠️  RLS POLICY BLOCKING ACCESS');
        console.error('   Run FIX_RLS_POLICIES.sql in Supabase SQL Editor to fix this\n');
      }
      return;
    }

    if (data) {
      console.log('✅ Profile EXISTS in database!\n');
      console.log(`   NAICS Code: ${data.naics_code}`);
      console.log(`   Industry: ${data.industry || 'N/A'}`);
      console.log(`   On-Demand: ${data.generated_on_demand ? 'Yes' : 'No'}`);
      console.log(`   Generated: ${data.generated_at || data.created_at || 'Unknown'}`);
      console.log(`\n   Available fields: ${Object.keys(data).join(', ')}`);
      console.log('');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Get NAICS code from command line or use default
const naicsCode = process.argv[2] || '621330'; // Default to School Psychologist
checkProfile(naicsCode);
