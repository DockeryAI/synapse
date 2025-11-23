import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkInsuranceProfiles() {
  console.log('\n=== Checking Insurance NAICS Codes ===\n');

  // Check naics_codes table for insurance entries
  const { data: naicsCodes, error: naicsError } = await supabase
    .from('naics_codes')
    .select('code, title, has_full_profile, category')
    .ilike('title', '%insurance%')
    .order('code');

  if (naicsError) {
    console.error('Error loading naics_codes:', naicsError);
  } else {
    console.log('NAICS Codes for Insurance:');
    console.table(naicsCodes);
  }

  // Check industry_profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('industry_profiles')
    .select('id, name, naics_code, is_active')
    .ilike('name', '%insurance%')
    .eq('is_active', true);

  if (profilesError) {
    console.error('\nError loading industry_profiles:', profilesError);
  } else {
    console.log('\nIndustry Profiles for Insurance:');
    console.table(profiles);
  }
}

checkInsuranceProfiles();
