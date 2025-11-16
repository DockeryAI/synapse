#!/usr/bin/env node

/**
 * Test script to verify profile save works WITHOUT generating a new profile
 * This tests the database write permissions and schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileSave() {
  console.log('\n🧪 Testing profile save capability...\n');

  // Create a test profile matching the JSONB schema
  const testProfile = {
    naics_code: 'TEST999',
    title: 'Test Industry',
    description: 'Test Description',
    profile_data: {
      category: 'Test Category',
      customer_triggers: { test: 'data' },
      power_words: ['test', 'words'],
      industry_name: 'Test Industry'
    },
    avoid_words: ['bad', 'words'],
    generated_on_demand: true,
    generated_at: new Date().toISOString(),
  };

  console.log('📝 Attempting to save test profile...');
  console.log(`   NAICS: ${testProfile.naics_code}`);
  console.log(`   Title: ${testProfile.title}`);
  console.log(`   Profile data keys: ${Object.keys(testProfile.profile_data).join(', ')}\n`);

  try {
    // Try to upsert (insert or update)
    const { data, error } = await supabase
      .from('industry_profiles')
      .upsert(testProfile)
      .select();

    if (error) {
      console.error('❌ SAVE FAILED!\n');
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error Message: ${error.message}`);

      if (error.code === 'PGRST204') {
        console.error('\n   🔍 Schema Issue Detected:');
        console.error('   The database schema is missing columns that the code expects.');
        console.error('   Run FIX_PROFILE_SAVE.sql in Supabase SQL Editor to fix this.\n');
      } else if (error.code === '42703') {
        console.error('\n   🔍 Column Missing:');
        console.error('   The database is missing one or more columns.');
        console.error('   Run FIX_PROFILE_SAVE.sql in Supabase SQL Editor to add them.\n');
      } else if (error.message?.includes('406') || error.message?.includes('policy')) {
        console.error('\n   🔍 RLS Policy Blocking:');
        console.error('   Row Level Security is blocking writes.');
        console.error('   Run FIX_PROFILE_SAVE.sql in Supabase SQL Editor to fix this.\n');
      }

      console.error('   Full error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✅ SAVE SUCCESSFUL!\n');
    console.log('   Profile was saved to database');
    console.log(`   Data: ${JSON.stringify(data, null, 2)}\n`);

    // Clean up test data
    console.log('🧹 Cleaning up test profile...');
    const { error: deleteError } = await supabase
      .from('industry_profiles')
      .delete()
      .eq('naics_code', 'TEST999');

    if (deleteError) {
      console.log('⚠️  Could not delete test profile (non-critical)');
    } else {
      console.log('✅ Test profile cleaned up\n');
    }

    console.log('✅ ALL TESTS PASSED!');
    console.log('   Your database is ready to save profiles permanently.\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error('   Stack:', err.stack);
    process.exit(1);
  }
}

testProfileSave();
