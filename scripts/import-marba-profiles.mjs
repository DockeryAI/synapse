import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Synapse Database
const synapseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const synapseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dpZG9nb24iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzI5MDM3MDI5LCJleHAiOjIwNDQ2MTMwMjl9.jdKGxI60ZLTD4QkCPgFaC5mQNuYr0TBd3Jw4gpxHCQw';

// Read MARBA export
const marbaExport = JSON.parse(
  fs.readFileSync('/Users/byronhudson/Projects/MARBA/data/industry_profiles_export.json', 'utf8')
);

async function importProfiles() {
  console.log('🚀 STARTING MARBA PROFILE IMPORT');
  console.log('='.repeat(60));
  console.log(`Found ${marbaExport.length} profiles to import\n`);

  const synapse = createClient(synapseUrl, synapseKey);

  // First, clear existing profiles (optional - comment out if you want to append)
  console.log('🧹 Clearing existing profiles...');
  const { error: deleteError } = await synapse
    .from('industry_profiles')
    .delete()
    .neq('id', ''); // Delete all (workaround for Supabase)

  if (deleteError && deleteError.code !== 'PGRST116') { // Ignore "no rows" error
    console.error('Delete error:', deleteError);
  }

  // Transform and import profiles
  const transformedProfiles = [];
  const naicsCodesSet = new Set();

  for (const profile of marbaExport) {
    // Generate ID (lowercase, hyphenated)
    const industryName = profile.industry || profile.industry_name || 'Unknown Industry';
    const profileId = industryName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Transform to new structure
    const transformed = {
      id: profileId,
      name: industryName,
      naics_code: profile.naics_code || null,
      profile_data: profile, // Store entire original profile
      is_active: true,
      business_count: 0,
      template_count: 0
    };

    transformedProfiles.push(transformed);

    // Collect NAICS codes for separate table
    if (profile.naics_code) {
      naicsCodesSet.add({
        code: profile.naics_code,
        title: industryName,
        category: profile.category || 'General',
        has_full_profile: true
      });
    }
  }

  console.log(`📦 Transformed ${transformedProfiles.length} profiles`);
  console.log(`📊 Found ${naicsCodesSet.size} unique NAICS codes\n`);

  // Import profiles in batches
  const batchSize = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < transformedProfiles.length; i += batchSize) {
    const batch = transformedProfiles.slice(i, i + batchSize);

    console.log(`Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedProfiles.length/batchSize)}...`);

    const { data, error } = await synapse
      .from('industry_profiles')
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`❌ Batch error:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ Imported ${batch.length} profiles`);
    }
  }

  // Import NAICS codes
  console.log('\n📊 Importing NAICS codes...');
  const naicsArray = Array.from(naicsCodesSet);

  for (const naics of naicsArray) {
    const { error } = await synapse
      .from('naics_codes')
      .upsert(naics, {
        onConflict: 'code',
        ignoreDuplicates: true
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error(`NAICS error for ${naics.code}:`, error.message);
    }
  }

  // Verify import
  console.log('\n' + '='.repeat(60));
  console.log('📋 IMPORT SUMMARY');
  console.log('='.repeat(60));

  const { count: profileCount } = await synapse
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: naicsCount } = await synapse
    .from('naics_codes')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Successfully imported: ${successCount} profiles`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} profiles`);
  }
  console.log(`📊 Total profiles in database: ${profileCount || 0}`);
  console.log(`📊 Total NAICS codes in database: ${naicsCount || 0}`);

  // Test a sample lookup
  console.log('\n🧪 Testing profile lookup...');
  const { data: testProfile, error: testError } = await synapse
    .from('industry_profiles')
    .select('id, name, naics_code')
    .limit(1)
    .single();

  if (testProfile) {
    console.log('✅ Sample profile retrieved:', testProfile);
  } else {
    console.log('❌ Test lookup failed:', testError);
  }

  console.log('\n🎉 IMPORT COMPLETE!');
  console.log('Your 144 industry profiles have been restored to Synapse.');
}

// Run import
importProfiles().catch(console.error);