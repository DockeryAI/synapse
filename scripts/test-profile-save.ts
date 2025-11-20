import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSaveProfile() {
  console.log('🧪 Testing profile save mechanism...\n');

  const naicsCode = '524126';
  const industryName = 'Direct Property & Casualty Insurance';

  // Mock profile data (minimal structure)
  const mockProfile = {
    industry: industryName,
    industry_name: industryName,
    naics_code: naicsCode,
    display_name: industryName,
    description: 'Test profile for insurance industry',
    emotional_triggers: ['Trust', 'Security'],
    avoid_words: ['cheap', 'discount'],
    specialty_depth: 'high',
    requires_credentials: true,
    typical_transaction_value: 'high',
    decision_timeline: 'long',
    primary_decision_maker: 'Business owner'
  };

  // Generate unique ID (same logic as the actual code)
  const profileId = industryName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  console.log('Profile ID:', profileId);
  console.log('NAICS Code:', naicsCode);
  console.log('\n📝 Attempting to save profile...\n');

  // Match the EXACT schema from the actual saveProfile() code
  const record = {
    id: profileId,
    name: industryName,
    naics_code: naicsCode,
    profile_data: mockProfile,
    is_active: true,
    business_count: 0,
    template_count: 0
  };

  const { data, error } = await supabase
    .from('industry_profiles')
    .upsert(record, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('❌ SAVE FAILED:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    return false;
  }

  console.log('✅ SAVE SUCCEEDED');
  console.log('Saved data:', JSON.stringify(data, null, 2));

  // Verify it's in the database
  console.log('\n🔍 Verifying profile is in database...\n');

  const { data: checkData, error: checkError } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', naicsCode)
    .eq('is_active', true)
    .maybeSingle();

  if (checkError || !checkData) {
    console.error('❌ VERIFICATION FAILED');
    console.error('Error:', checkError);
    return false;
  }

  console.log('✅ VERIFICATION PASSED');
  console.log('Profile found in database:', {
    id: checkData.id,
    name: checkData.name,
    naics_code: checkData.naics_code,
    is_active: checkData.is_active
  });

  return true;
}

testSaveProfile()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ TEST PASSED - Save mechanism works correctly');
    } else {
      console.log('❌ TEST FAILED - Save mechanism is broken');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ TEST CRASHED:', err);
    process.exit(1);
  });
