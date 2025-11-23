import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifySync() {
  console.log('\n=== Verification ===\n');

  // Get all active industry profiles with their NAICS codes
  const { data: profiles } = await supabase
    .from('industry_profiles')
    .select('naics_code')
    .eq('is_active', true);

  const uniqueNaicsCodes = new Set(profiles?.map(p => p.naics_code) || []);
  console.log(`Unique NAICS codes in industry_profiles: ${uniqueNaicsCodes.size}`);

  // Get all NAICS codes with full profiles
  const { data: naicsCodes } = await supabase
    .from('naics_codes')
    .select('code')
    .eq('has_full_profile', true);

  const naicsSet = new Set(naicsCodes?.map(n => n.code) || []);
  console.log(`NAICS codes with has_full_profile=true: ${naicsSet.size}`);

  // Find any profile codes not in naics_codes
  const missing = Array.from(uniqueNaicsCodes).filter(code => !naicsSet.has(code));

  if (missing.length === 0) {
    console.log('\n✅ Perfect sync! All industry profile NAICS codes exist in naics_codes table.');
  } else {
    console.log(`\n⚠️  Still missing ${missing.length} NAICS codes:`);
    console.log(missing);
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total active industry_profiles: ${profiles?.length}`);
  console.log(`Unique NAICS codes needed: ${uniqueNaicsCodes.size}`);
  console.log(`NAICS codes marked has_full_profile=true: ${naicsSet.size}`);
  console.log(`Coverage: ${((naicsSet.size / uniqueNaicsCodes.size) * 100).toFixed(1)}%`);
}

verifySync();
