const { createClient } = require('@supabase/supabase-js');

// MARBA Database (source)
const marbaUrl = 'https://eyytfnrvzfidxoonnqyt.supabase.co';
const marbaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eXRmbnJ2emZpZHhvb25ucXl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg5NzkxMywiZXhwIjoyMDc4NDczOTEzfQ.NXxYhSKP0_pMgtSMjpxXxWkwNk_XaOgffQtp5ryRR6Q';

// Synapse Database (target)
const synapseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const synapseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function checkDatabases() {
  console.log('🔍 DATABASE ASSESSMENT REPORT\n');
  console.log('=' .repeat(60));

  // Connect to MARBA
  const marba = createClient(marbaUrl, marbaKey);
  console.log('\n📊 MARBA DATABASE (Source)');
  console.log('-'.repeat(40));

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
      console.log('✅ industry_profiles table: FOUND');
      console.log(`   Total records: ${count}`);

      if (marbaProfiles && marbaProfiles.length > 0) {
        console.log('   Sample fields:', Object.keys(marbaProfiles[0]).slice(0, 10).join(', '));
        console.log('   Has naics_code:', 'naics_code' in marbaProfiles[0] ? 'YES' : 'NO');
        console.log('   Has title:', 'title' in marbaProfiles[0] ? 'YES' : 'NO');
        console.log('   Has full profiles:', marbaProfiles.filter(p => p.has_full_profile).length);
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

  // Check for industry_profiles table in Synapse
  try {
    const { data: synapseProfiles, error: synapseError, count } = await synapse
      .from('industry_profiles')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (synapseError) {
      console.log('❌ industry_profiles table: NOT FOUND');
      console.log('   Error:', synapseError.message);
      console.log('   Need to create table first!');
    } else {
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
  console.log('📋 MIGRATION PLAN');
  console.log('='.repeat(60));

  // Get detailed count from MARBA
  const { data: fullCheck, count: totalProfiles } = await marba
    .from('industry_profiles')
    .select('naics_code, title, has_full_profile', { count: 'exact' });

  if (totalProfiles > 0) {
    console.log(`\n✅ READY TO MIGRATE: ${totalProfiles} profiles from MARBA to Synapse`);
    console.log('\nSteps:');
    console.log('1. Create industry_profiles table in Synapse (if missing)');
    console.log('2. Export all profiles from MARBA');
    console.log('3. Import profiles to Synapse');
    console.log('4. Verify migration success');

    console.log('\n⚠️  IMPORTANT: ');
    console.log('- This will COPY data, not move it');
    console.log('- MARBA database will remain unchanged');
    console.log('- Any existing Synapse profiles will be REPLACED');

    console.log('\n🎯 Next: Run migrate-profiles.js to execute migration');
  } else {
    console.log('\n❌ NO PROFILES FOUND IN MARBA DATABASE');
    console.log('Cannot proceed with migration');
  }
}

checkDatabases().catch(console.error);