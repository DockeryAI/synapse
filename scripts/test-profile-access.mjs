import { createClient } from '@supabase/supabase-js';

const synapseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const synapseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dpZG9nb24iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzAyOSwiZXhwIjoyMDQ0NjEzMDI5fQ.0gEO2pv6Tth5ehBFiYIF7bvjLalSxlkrfj5OgSqpE0A';

async function testProfileAccess() {
  console.log('🧪 TESTING PROFILE ACCESS');
  console.log('='.repeat(60));

  const synapse = createClient(synapseUrl, synapseKey);

  // Test 1: Check total count
  const { count } = await synapse
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total profiles in database: ${count}`);

  // Test 2: Search for specific industry (Direct Property & Casualty Insurance)
  const { data: insuranceProfile, error: insuranceError } = await synapse
    .from('industry_profiles')
    .select('id, name, naics_code')
    .eq('naics_code', '524126')
    .single();

  if (insuranceProfile) {
    console.log('\n✅ Found Direct Property & Casualty Insurance:');
    console.log(`   ID: ${insuranceProfile.id}`);
    console.log(`   Name: ${insuranceProfile.name}`);
    console.log(`   NAICS: ${insuranceProfile.naics_code}`);
  } else {
    console.log('\n❌ Direct Property & Casualty Insurance not found:', insuranceError);
  }

  // Test 3: Check profile data structure
  const { data: sampleProfile } = await synapse
    .from('industry_profiles')
    .select('*')
    .limit(1)
    .single();

  if (sampleProfile && sampleProfile.profile_data) {
    console.log('\n✅ Profile data structure:');
    console.log(`   Has customer_triggers: ${'customer_triggers' in sampleProfile.profile_data}`);
    console.log(`   Has power_words: ${'power_words' in sampleProfile.profile_data}`);
    console.log(`   Has transformations: ${'transformations' in sampleProfile.profile_data}`);
    console.log(`   Total fields: ${Object.keys(sampleProfile.profile_data).length}`);
  }

  // Test 4: List a few industries
  const { data: industries } = await synapse
    .from('industry_profiles')
    .select('name, naics_code')
    .limit(10)
    .order('name');

  console.log('\n📋 Sample Industries:');
  industries?.forEach(ind => {
    console.log(`   - ${ind.name} (${ind.naics_code})`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ PROFILE ACCESS TEST COMPLETE');
  console.log('Your UVP flow should now work properly!');
}

testProfileAccess().catch(console.error);