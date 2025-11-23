import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncAllProfilesToNaics() {
  console.log('\n=== Checking for Missing NAICS Codes ===\n');

  // Get all active industry profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('industry_profiles')
    .select('id, name, naics_code, is_active')
    .eq('is_active', true)
    .order('name');

  if (profilesError) {
    console.error('Error loading industry_profiles:', profilesError);
    return;
  }

  console.log(`Found ${profiles.length} active industry profiles\n`);

  // Get all existing NAICS codes
  const { data: existingNaics, error: naicsError } = await supabase
    .from('naics_codes')
    .select('code, title, has_full_profile');

  if (naicsError) {
    console.error('Error loading naics_codes:', naicsError);
    return;
  }

  const existingCodes = new Set(existingNaics?.map(n => n.code) || []);
  console.log(`Found ${existingCodes.size} existing NAICS codes in naics_codes table\n`);

  // Find profiles that don't have corresponding NAICS entries
  const missingProfiles = profiles.filter(p => !existingCodes.has(p.naics_code));

  console.log(`\n=== Missing NAICS Codes: ${missingProfiles.length} ===\n`);

  if (missingProfiles.length === 0) {
    console.log('✅ All profiles have corresponding NAICS codes!');
    return;
  }

  console.table(missingProfiles.map(p => ({
    naics_code: p.naics_code,
    name: p.name,
    id: p.id
  })));

  // Categorize by NAICS code pattern
  const categorizeByNaics = (code: string) => {
    if (code.startsWith('44')) return 'Retail';
    if (code.startsWith('52')) return 'Financial Services';
    if (code.startsWith('54')) return 'Professional Services';
    if (code.startsWith('62')) return 'Healthcare Services';
    if (code.startsWith('71')) return 'Arts & Entertainment';
    if (code.startsWith('72')) return 'Food Services';
    if (code.startsWith('81')) return 'Other Services';
    if (code.startsWith('CUSTOM')) return 'Custom';
    return 'Other';
  };

  console.log('\n=== Adding Missing NAICS Codes ===\n');

  const newEntries = missingProfiles.map(profile => ({
    code: profile.naics_code,
    title: profile.name,
    category: categorizeByNaics(profile.naics_code),
    keywords: [profile.name.toLowerCase()],
    has_full_profile: true,
    popularity: 5 // Default popularity
  }));

  // Add in batches
  for (const entry of newEntries) {
    console.log(`Adding ${entry.code}: ${entry.title}...`);

    const { error } = await supabase
      .from('naics_codes')
      .upsert(entry, {
        onConflict: 'code'
      });

    if (error) {
      console.error(`  ❌ Error:`, error.message);
    } else {
      console.log(`  ✅ Success`);
    }
  }

  // Final verification
  console.log('\n=== Final Verification ===\n');

  const { count: profileCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: naicsCount } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true })
    .eq('has_full_profile', true);

  console.log(`Active industry_profiles: ${profileCount}`);
  console.log(`NAICS codes with has_full_profile=true: ${naicsCount}`);

  if (profileCount === naicsCount) {
    console.log('\n✅ All industry profiles now have corresponding NAICS codes!');
  } else {
    console.log(`\n⚠️  Mismatch: ${profileCount} profiles vs ${naicsCount} NAICS codes`);
  }
}

syncAllProfilesToNaics();
