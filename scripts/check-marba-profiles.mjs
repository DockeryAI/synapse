import { createClient } from '@supabase/supabase-js';

// MARBA Database (source)
const marbaUrl = 'https://eyytfnrvzfidxoonnqyt.supabase.co';
const marbaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eXRmbnJ2emZpZHhvb25ucXl0Iiwicm9sZSI6InNlcnZpY2Vfc3BhblLCJpYXQiOjE3NjI4OTc5MTMsImV4cCI6MjA3ODQ3MzkxM30.NXxYhSKP0_pMgtSMjpxXxWkwNk_XaOgffQtp5ryRR6Q';

// Synapse Database (target)
const synapseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const synapseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dpZG9nb24iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzI5MDM3MDI5LCJleHAiOjIwNDQ2MTMwMjl9.jdKGxI60ZLTD4QkCPgFaC5mQNuYr0TBd3Jw4gpxHCQw';

async function checkDatabases() {
  console.log('🔍 DATABASE ASSESSMENT REPORT\n');
  console.log('='.repeat(60));

  // Connect to MARBA
  const marba = createClient(marbaUrl, marbaKey);
  console.log('\n📊 MARBA DATABASE (Source)');
  console.log('-'.repeat(40));

  let marbaProfileCount = 0;

  // Check for industry_profiles table in MARBA
  try {
    const { data: marbaProfiles, error: marbaError, count } = await marba
      .from('industry_profiles')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (marbaError) {
      console.log('❌ industry_profiles table: NOT FOUND');
      console.log('   Error:', marbaError.message);
    } else {
      marbaProfileCount = count || 0;
      console.log('✅ industry_profiles table: FOUND');
      console.log(`   Total records: ${count}`);

      if (marbaProfiles && marbaProfiles.length > 0) {
        const sampleProfile = marbaProfiles[0];
        console.log('   Sample fields:', Object.keys(sampleProfile).slice(0, 10).join(', '));
        console.log('   Has naics_code:', 'naics_code' in sampleProfile ? 'YES' : 'NO');
        console.log('   Has title:', 'title' in sampleProfile ? 'YES' : 'NO');
        console.log('   Has industry:', 'industry' in sampleProfile ? 'YES' : 'NO');
        console.log('   Has industry_name:', 'industry_name' in sampleProfile ? 'YES' : 'NO');

        // Check profile data structure
        if (sampleProfile.profile_data) {
          console.log('   Has profile_data: YES (JSON)');
          const profileKeys = Object.keys(sampleProfile.profile_data);
          console.log(`   Profile data fields: ${profileKeys.length} keys`);
        }
      }
    }
  } catch (e) {
    console.log('❌ Error checking MARBA:', e.message);
  }

  // Also check for naics_codes table
  try {
    const { count: naicsCount } = await marba
      .from('naics_codes')
      .select('*', { count: 'exact', head: true });

    if (naicsCount !== null) {
      console.log('✅ naics_codes table: FOUND');
      console.log(`   Total records: ${naicsCount}`);
    }
  } catch (e) {
    console.log('❌ naics_codes table: NOT FOUND');
  }

  // Connect to Synapse
  const synapse = createClient(synapseUrl, synapseKey);
  console.log('\n📊 SYNAPSE DATABASE (Target)');
  console.log('-'.repeat(40));

  let synapseTableExists = false;

  // Check for industry_profiles table in Synapse
  try {
    const { data: synapseProfiles, error: synapseError, count } = await synapse
      .from('industry_profiles')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (synapseError) {
      console.log('❌ industry_profiles table: NOT FOUND');
      console.log('   Error:', synapseError.message);
      console.log('   ⚠️  Need to create table first!');
    } else {
      synapseTableExists = true;
      console.log('✅ industry_profiles table: EXISTS');
      console.log(`   Current records: ${count || 0}`);

      if (synapseProfiles && synapseProfiles.length > 0) {
        console.log('   Table structure:', Object.keys(synapseProfiles[0]).slice(0, 10).join(', '));
      }
    }
  } catch (e) {
    console.log('❌ Error checking Synapse:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION ASSESSMENT');
  console.log('='.repeat(60));

  if (marbaProfileCount > 0) {
    console.log(`\n✅ FOUND ${marbaProfileCount} PROFILES IN MARBA`);

    if (!synapseTableExists) {
      console.log('\n⚠️  SYNAPSE TABLE NEEDS TO BE CREATED FIRST');
      console.log('   Run the SQL from 20251122300000_restore_industry_profiles.sql');
    }

    console.log('\n🎯 MIGRATION PLAN:');
    console.log('1. Ensure industry_profiles table exists in Synapse');
    console.log('2. Export all profiles from MARBA');
    console.log('3. Transform data to match Synapse structure');
    console.log('4. Import profiles to Synapse');
    console.log('5. Verify migration success');

    console.log('\n⚠️  IMPORTANT: ');
    console.log('- This will COPY data, not move it');
    console.log('- MARBA database will remain unchanged');
    console.log('- Any existing Synapse profiles will be REPLACED');

    console.log('\n✅ SAFE TO PROCEED - No destructive changes to MARBA');
  } else {
    console.log('\n❌ NO PROFILES FOUND IN MARBA DATABASE');
    console.log('Cannot proceed with migration');
  }
}

checkDatabases().catch(console.error);