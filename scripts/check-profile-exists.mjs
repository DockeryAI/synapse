import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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