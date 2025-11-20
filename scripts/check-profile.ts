import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data, error } = await supabase
    .from('industry_profiles')
    .select('id, name, naics_code, is_active, created_at')
    .eq('naics_code', '524126');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Results for NAICS 524126:');
    console.log(JSON.stringify(data, null, 2));

    if (!data || data.length === 0) {
      console.log('\n❌ NO PROFILE FOUND - Save failed');
    } else {
      console.log('\n✅ Profile exists in database');
    }
  }

  // Also check all profiles
  const { data: allProfiles, error: allError } = await supabase
    .from('industry_profiles')
    .select('id, name, naics_code, is_active')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!allError && allProfiles) {
    console.log('\n\nAll profiles (latest 10):');
    console.log(JSON.stringify(allProfiles, null, 2));
  }
}

checkProfile().then(() => process.exit(0));
