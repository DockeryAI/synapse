import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dpZG9nb24iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzAyOSwiZXhwIjoyMDQ0NjEzMDI5fQ.0gEO2pv6Tth5ehBFiYIF7bvjLalSxlkrfj5OgSqpE0A'
);

async function checkProfiles() {
  // Check if mental health profile exists
  const { data, error } = await supabase
    .from('industry_profiles')
    .select('id, name, naics_code')
    .eq('naics_code', '621330')
    .maybeSingle();

  if (data) {
    console.log('✅ Mental Health profile EXISTS:');
    console.log('   ID:', data.id);
    console.log('   Name:', data.name);
    console.log('   NAICS:', data.naics_code);
    console.log('\n⚠️  This is why it\'s not generating a new profile!');
    console.log('   The system found an existing profile and used it.');
  } else {
    console.log('❌ Mental Health profile NOT found');
    console.log('   This WOULD trigger profile generation');
  }

  // List all profiles
  const { data: allProfiles } = await supabase
    .from('industry_profiles')
    .select('naics_code, name')
    .order('name');

  const existingCodes = allProfiles?.map(p => p.naics_code) || [];

  console.log('\n📋 Total profiles in database:', allProfiles?.length || 0);

  // Show first 10 profiles
  console.log('\n📚 Sample of existing profiles:');
  allProfiles?.slice(0, 10).forEach(p => {
    console.log(`   - ${p.naics_code}: ${p.name}`);
  });

  // Suggest some industries that likely don't have profiles
  console.log('\n💡 Try these industries to trigger profile generation:');
  console.log('   - "cryptocurrency exchange" (likely no profile)');
  console.log('   - "AI consulting" (likely no profile)');
  console.log('   - "drone delivery service" (likely no profile)');
  console.log('   - "virtual reality arcade" (likely no profile)');
  console.log('   - "3D printing service" (likely no profile)');
}

checkProfiles().catch(console.error);