const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

async function checkRLSStatus() {
  console.log('🔍 Checking RLS and permissions status...\n');
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  // Test with SERVICE ROLE (should always work)
  console.log('📝 Testing with SERVICE ROLE key (admin access):\n');
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: adminData, error: adminError } = await adminClient
    .from('industry_profiles')
    .select('naics_code, title')
    .limit(3);

  if (adminError) {
    console.error('❌ SERVICE ROLE Error:', adminError);
  } else {
    console.log(`✅ SERVICE ROLE Success: Found ${adminData?.length || 0} profiles`);
    if (adminData && adminData.length > 0) {
      console.log('   Sample:', adminData[0]);
    }
  }

  console.log('\n---\n');

  // Test with ANON KEY (this is what the frontend uses)
  console.log('📝 Testing with ANON key (public access - what frontend uses):\n');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: anonData, error: anonError } = await anonClient
    .from('industry_profiles')
    .select('naics_code, title')
    .limit(3);

  if (anonError) {
    console.error('❌ ANON KEY Error:', anonError);
    console.log('\n🔴 PROBLEM FOUND: The frontend cannot access industry_profiles table!');
    console.log('   This is causing the 406 errors you\'re seeing.\n');
    console.log('📋 TO FIX THIS:');
    console.log('   1. Go to your Supabase Dashboard:');
    console.log('      https://supabase.com/dashboard/project/jpwljchikgmggjidogon/editor');
    console.log('\n   2. Click "SQL Editor" in the left sidebar');
    console.log('\n   3. Click "New Query" and paste this SQL:\n');
    console.log('   ---SQL---');
    console.log('   -- Disable RLS for demo (industry_profiles is reference data)');
    console.log('   ALTER TABLE industry_profiles DISABLE ROW LEVEL SECURITY;');
    console.log('   \n   -- Grant read/write access to anon users');
    console.log('   GRANT SELECT, INSERT ON industry_profiles TO anon;');
    console.log('   GRANT SELECT, INSERT ON industry_profiles TO authenticated;');
    console.log('   ---END SQL---\n');
    console.log('   4. Click "Run" to execute the SQL');
    console.log('\n   5. Run this script again to verify the fix worked\n');
  } else {
    console.log(`✅ ANON KEY Success: Found ${anonData?.length || 0} profiles`);
    if (anonData && anonData.length > 0) {
      console.log('   Sample:', anonData[0]);
    }
    console.log('\n✅ Everything is working! Industry profiles can be read and saved.');
  }

  // Also test INSERT permission
  console.log('\n---\n');
  console.log('📝 Testing INSERT permission with ANON key:\n');

  const testProfile = {
    naics_code: '999999',
    title: 'Test Industry (DELETE ME)',
    description: 'Test profile - can be deleted',
    profile_data: { test: true },
    generated_on_demand: true,
    generated_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await anonClient
    .from('industry_profiles')
    .insert(testProfile)
    .select();

  if (insertError) {
    console.error('❌ INSERT Error:', insertError);
    console.log('\n🔴 Cannot save industry profiles! Add this to your SQL fix:');
    console.log('   GRANT INSERT ON industry_profiles TO anon;');
  } else {
    console.log('✅ INSERT Success: Can save profiles to database');
    console.log('   Test record created:', insertData[0]?.naics_code);

    // Clean up test record
    await anonClient
      .from('industry_profiles')
      .delete()
      .eq('naics_code', '999999');
    console.log('   (Test record deleted)');
  }
}

checkRLSStatus().catch(console.error);
